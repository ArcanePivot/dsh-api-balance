import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-session-persistence'
import type {} from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/dsh-credentials'
import { BALANCE_PATH, USAGE_PATH } from './contracts.js'
import { createUsageCollector } from './collector.js'
import { createApiHandlers } from './http.js'

export const inject = ['webServer', 'sessions']

export function apply(ctx: Context): void {
  const collector = createUsageCollector(ctx)
  const handlers = createApiHandlers(ctx, collector)

  ctx.effect(function* () {
    yield ctx.webServer.register({ kind: 'exact', path: BALANCE_PATH, handler: handlers.balance })
    yield ctx.webServer.register({ kind: 'exact', path: USAGE_PATH, handler: handlers.usage })
    yield () => collector.clear()
  }, 'api-balance: native routes')
}

export * from './contracts.js'
export * from './pricing.js'
export * from './usage.js'
