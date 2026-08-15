import type { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readDeepSeekBalance } from '../src/balance.js'

const previousKey = process.env.DEEPSEEK_API_KEY

afterEach(() => {
  if (previousKey === undefined) delete process.env.DEEPSEEK_API_KEY
  else process.env.DEEPSEEK_API_KEY = previousKey
})

function context(services: Record<string, unknown> = {}): Context {
  return {
    get(name: string): unknown {
      return services[name]
    },
  } as unknown as Context
}

describe.sequential('DeepSeek balance', () => {
  it('reports a missing credential without making a network request', async () => {
    delete process.env.DEEPSEEK_API_KEY
    const fetcher = vi.fn<typeof fetch>()
    const value = await readDeepSeekBalance(context(), undefined, fetcher)
    expect(value).toMatchObject({ ok: false, code: 'missing-credential' })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('resolves the host credential and returns only normalized balance fields', async () => {
    const resolve = vi.fn().mockResolvedValue({ value: 'secret-value', source: 'test' })
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (_input, init) => {
      expect(init?.headers).toEqual({ authorization: 'Bearer secret-value' })
      return new Response(JSON.stringify({
        is_available: true,
        balance_infos: [{
          currency: 'CNY',
          total_balance: '88.00',
          granted_balance: '8.00',
          topped_up_balance: '80.00',
        }],
      }), { status: 200, headers: { 'content-type': 'application/json' } })
    })
    const value = await readDeepSeekBalance(context({ credentials: { resolve } }), undefined, fetcher)
    expect(value).toMatchObject({
      ok: true,
      provider: 'deepseek-official',
      infos: [{ currency: 'CNY', totalBalance: '88.00', grantedBalance: '8.00', toppedUpBalance: '80.00' }],
    })
    expect(JSON.stringify(value)).not.toContain('secret-value')
  })
})
