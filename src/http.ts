import type { Context } from '@deepseek-ai/cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { BALANCE_PATH, USAGE_PATH, type ApiErrorView, type UsageView } from './contracts.js'
import { readDeepSeekBalance } from './balance.js'
import type { UsageCollector } from './collector.js'
import { aggregateDeepSeekUsage, usageDateKey, validateTimeZone } from './usage.js'

export interface ApiHandlers {
  balance(req: IncomingMessage, res: ServerResponse): Promise<void>
  usage(req: IncomingMessage, res: ServerResponse): Promise<void>
}

function sendJson(res: ServerResponse, status: number, value: unknown): void {
  if (res.destroyed || res.writableEnded) return
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  res.end(body)
}

function apiError(
  res: ServerResponse,
  status: number,
  code: ApiErrorView['code'],
  message: string,
): void {
  sendJson(res, status, { ok: false, code, message } satisfies ApiErrorView)
}

function acceptsRequest(req: IncomingMessage, res: ServerResponse): boolean {
  if (req.method !== 'GET') {
    res.setHeader('allow', 'GET')
    apiError(res, 405, 'method-not-allowed', 'Only GET is allowed')
    return false
  }
  const origin = req.headers.origin
  if (origin !== undefined) {
    try {
      const originHost = new URL(origin).host
      if (req.headers.host === undefined || originHost !== req.headers.host) {
        apiError(res, 403, 'forbidden', 'Cross-origin requests are not allowed')
        return false
      }
    } catch {
      apiError(res, 403, 'forbidden', 'Invalid request origin')
      return false
    }
  }
  return true
}

async function withRequestSignal<T>(
  req: IncomingMessage,
  res: ServerResponse,
  operation: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController()
  const abort = (): void => controller.abort(new Error('HTTP client disconnected'))
  const abortOnClose = (): void => {
    if (!res.writableEnded) abort()
  }
  req.once('aborted', abort)
  res.once('close', abortOnClose)
  try {
    return await operation(controller.signal)
  } finally {
    req.removeListener('aborted', abort)
    res.removeListener('close', abortOnClose)
  }
}

function currentMonth(timeZone: string, now: number): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return usageDateKey(now, formatter).slice(0, 7)
}

export function createApiHandlers(ctx: Context, collector: UsageCollector): ApiHandlers {
  return {
    async balance(req, res): Promise<void> {
      if (!acceptsRequest(req, res)) return
      try {
        const value = await withRequestSignal(req, res, signal => readDeepSeekBalance(ctx, signal))
        sendJson(res, 200, value)
      } catch (error) {
        ctx.logger.warn(`api-balance: balance route failed: ${String(error)}`)
        apiError(res, 500, 'internal', 'Unable to read DeepSeek balance')
      }
    },

    async usage(req, res): Promise<void> {
      if (!acceptsRequest(req, res)) return
      try {
        const url = new URL(req.url ?? USAGE_PATH, 'http://dsh.local')
        const timeZone = validateTimeZone(url.searchParams.get('timeZone') ?? 'UTC')
        const generatedAt = Date.now()
        const selectedMonth = url.searchParams.get('month') ?? currentMonth(timeZone, generatedAt)
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(selectedMonth)) {
          apiError(res, 400, 'bad-request', 'month must use YYYY-MM')
          return
        }
        const collected = await withRequestSignal(req, res, signal => collector.collect(signal))
        const value: UsageView = {
          ...aggregateDeepSeekUsage(collected.samples, selectedMonth, timeZone, generatedAt),
          coverage: collected.coverage,
        }
        sendJson(res, 200, value)
      } catch (error) {
        if (error instanceof RangeError || error instanceof TypeError) {
          apiError(res, 400, 'bad-request', error.message)
          return
        }
        ctx.logger.warn(`api-balance: usage route failed: ${String(error)}`)
        apiError(res, 500, 'internal', 'Unable to summarize local DeepSeek usage')
      }
    },
  }
}

export const API_ROUTES = [BALANCE_PATH, USAGE_PATH] as const
