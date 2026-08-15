import type { Context } from '@deepseek-ai/cordis'
import type { SessionEvent, SessionHeader } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-session-persistence'
import type { UsageCoverage } from './contracts.js'
import { deepSeekUsageSamples, type SessionEventLike, type UsageSample } from './usage.js'

interface SessionFoldCacheEntry {
  version: string
  samples: UsageSample[]
}

export interface CollectedUsage {
  samples: UsageSample[]
  coverage: UsageCoverage
}

export interface UsageCollector {
  collect(signal?: AbortSignal): Promise<CollectedUsage>
  clear(): void
}

function asEvents(events: readonly SessionEvent[]): readonly SessionEventLike[] {
  return events as unknown as readonly SessionEventLike[]
}

function throwIfAborted(signal?: AbortSignal): void {
  signal?.throwIfAborted()
}

export function createUsageCollector(ctx: Context): UsageCollector {
  const cache = new Map<string, SessionFoldCacheEntry>()

  return {
    async collect(signal?: AbortSignal): Promise<CollectedUsage> {
      throwIfAborted(signal)
      const live = new Map(ctx.sessions.list().map(session => [String(session.id), session]))
      const persistence = ctx.get('sessionPersistence')
      const snapshots = persistence === undefined ? [] : await persistence.listSnapshots(signal)
      throwIfAborted(signal)

      const seen = new Set<string>()
      const samples: UsageSample[] = []
      let failedSessions = 0

      const useFold = (
        id: string,
        version: string,
        meta: SessionHeader,
        events: readonly SessionEvent[],
      ): void => {
        seen.add(id)
        const cached = cache.get(id)
        if (cached?.version === version) {
          samples.push(...cached.samples)
          return
        }
        const folded = deepSeekUsageSamples(meta, asEvents(events))
        cache.set(id, { version, samples: folded })
        samples.push(...folded)
      }

      const cold: Array<{ id: string; version: string; header: SessionHeader }> = []
      for (const snapshot of snapshots) {
        const id = String(snapshot.header.id)
        const session = live.get(id)
        if (session !== undefined) {
          live.delete(id)
          try {
            useFold(id, `live:${session.seq}`, session.header, session.events)
          } catch (error) {
            seen.add(id)
            failedSessions += 1
            ctx.logger.warn(`api-balance: live session "${id}" could not be folded: ${String(error)}`)
          }
          continue
        }
        seen.add(id)
        const version = `stored:${String(snapshot.revision)}`
        const cached = cache.get(id)
        if (cached?.version === version) samples.push(...cached.samples)
        else cold.push({ id, version, header: snapshot.header })
      }

      for (const [id, session] of live) {
        try {
          useFold(id, `live:${session.seq}`, session.header, session.events)
        } catch (error) {
          seen.add(id)
          failedSessions += 1
          ctx.logger.warn(`api-balance: live session "${id}" could not be folded: ${String(error)}`)
        }
      }

      if (persistence !== undefined) {
        for (let offset = 0; offset < cold.length; offset += 4) {
          throwIfAborted(signal)
          const batch = cold.slice(offset, offset + 4)
          const settled = await Promise.allSettled(batch.map(async item => ({
            item,
            stored: await persistence.readFrom(item.header.id, 0, signal),
          })))
          throwIfAborted(signal)
          settled.forEach((result, index) => {
            const item = batch[index]
            if (item === undefined) return
            if (result.status === 'fulfilled') {
              try {
                useFold(item.id, item.version, result.value.stored.meta, result.value.stored.events)
              } catch (error) {
                failedSessions += 1
                ctx.logger.warn(`api-balance: stored session "${item.id}" could not be folded: ${String(error)}`)
              }
            } else {
              failedSessions += 1
              ctx.logger.warn(`api-balance: stored session "${item.id}" could not be read: ${String(result.reason)}`)
            }
          })
        }
      }

      for (const id of cache.keys()) {
        if (!seen.has(id)) cache.delete(id)
      }
      return {
        samples,
        coverage: {
          sessions: seen.size,
          failedSessions,
          durable: persistence !== undefined,
        },
      }
    },
    clear(): void {
      cache.clear()
    },
  }
}
