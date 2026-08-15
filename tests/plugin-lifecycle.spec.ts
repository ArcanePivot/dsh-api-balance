import type { Context } from '@deepseek-ai/cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createServer } from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { apply } from '../src/index.js'
import { BALANCE_PATH, USAGE_PATH } from '../src/contracts.js'

type Route = {
  kind: 'exact' | 'prefix'
  path: string
  handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
}

function bench(): { ctx: Context; routes: Map<string, Route>; dispose: () => Promise<void> } {
  const routes = new Map<string, Route>()
  const disposers: Array<() => void | Promise<void>> = []
  const ctx = {
    sessions: { list: () => [] },
    logger: { warn: () => undefined },
    get: () => undefined,
    webServer: {
      register(route: Route): () => void {
        if (routes.has(route.path)) throw new Error(`duplicate ${route.path}`)
        routes.set(route.path, route)
        return () => { routes.delete(route.path) }
      },
    },
    effect(effect: () => unknown): void {
      const result = effect()
      if (typeof result === 'function') {
        disposers.push(result as () => void)
        return
      }
      if (result !== null && typeof result === 'object' && Symbol.iterator in result) {
        for (const disposer of result as Iterable<() => void>) disposers.push(disposer)
      }
    },
  } as unknown as Context
  return {
    ctx,
    routes,
    async dispose(): Promise<void> {
      for (const disposer of disposers.reverse()) await disposer()
    },
  }
}

const servers: Array<ReturnType<typeof createServer>> = []
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve()))))
})

describe('native plugin lifecycle', () => {
  it('registers two additive routes and removes every route on dispose', async () => {
    const b = bench()
    apply(b.ctx)
    expect([...b.routes.keys()].sort()).toEqual([BALANCE_PATH, USAGE_PATH].sort())
    await b.dispose()
    expect(b.routes.size).toBe(0)
  })

  it('serves usage read-only and rejects cross-origin access', async () => {
    const b = bench()
    apply(b.ctx)
    const server = createServer((req, res) => {
      const path = new URL(req.url ?? '/', 'http://localhost').pathname
      const route = b.routes.get(path)
      if (route === undefined) {
        res.writeHead(404).end()
        return
      }
      void route.handler(req, res)
    })
    servers.push(server)
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (address === null || typeof address === 'string') throw new Error('server did not bind')
    const base = `http://127.0.0.1:${address.port}`

    const usage = await fetch(`${base}${USAGE_PATH}?month=2026-08&timeZone=UTC`)
    expect(usage.status).toBe(200)
    expect(await usage.json()).toMatchObject({ provider: 'deepseek-official', coverage: { sessions: 0 } })

    const post = await fetch(`${base}${USAGE_PATH}`, { method: 'POST' })
    expect(post.status).toBe(405)

    const crossOrigin = await fetch(`${base}${USAGE_PATH}`, { headers: { origin: 'https://evil.example' } })
    expect(crossOrigin.status).toBe(403)
    await b.dispose()
  })
})
