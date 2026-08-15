import { describe, expect, it } from 'vitest'
import {
  aggregateDeepSeekUsage,
  deepSeekUsageSamples,
  type SessionEventLike,
} from '../src/usage.js'
import {
  DEEPSEEK_PRICING_EFFECTIVE_AT,
  deepSeekPriceAt,
  deepSeekPricingPhase,
} from '../src/pricing.js'

function event(seq: number, type: string, data: Record<string, any>, time = Date.UTC(2026, 7, 15, 2)): SessionEventLike {
  return { seq, type, data, time }
}

describe('DeepSeek usage folding', () => {
  it('keeps the finalized message once and excludes other providers', () => {
    const events = [
      event(0, 'request/header', { header: { config: { provider: 'deepseek-official', model: 'deepseek-v4-flash' } } }),
      event(1, 'assistant/chunk', { turn: 0, step: 0, chunk: { type: 'usage', usage: { inputTokens: 10, outputTokens: 2 } } }),
      event(2, 'assistant/message', { turn: 0, step: 0, usage: { inputTokens: 20, outputTokens: 4 }, message: { source: { provider: 'deepseek-official', model: 'deepseek-v4-flash' } } }),
      event(3, 'request/context', { provider: 'openai', model: 'gpt-test' }),
      event(4, 'assistant/message', { turn: 1, step: 0, usage: { inputTokens: 100, outputTokens: 20 } }),
    ]

    const samples = deepSeekUsageSamples({}, events)
    expect(samples).toHaveLength(1)
    expect(samples[0]).toMatchObject({ seq: 2, model: 'deepseek-v4-flash' })
    expect(samples[0]?.buckets).toMatchObject({ uncachedInputTokens: 20, outputTokens: 4, calls: 1 })
  })

  it('does not charge a fork inherited prefix twice', () => {
    const events = [
      event(0, 'request/header', { header: { config: { provider: 'deepseek-official', model: 'deepseek-v4-pro' } } }),
      event(1, 'assistant/message', { turn: 0, step: 0, usage: { inputTokens: 10, outputTokens: 1 } }),
      event(2, 'assistant/message', { turn: 1, step: 0, usage: { inputTokens: 30, outputTokens: 3 } }),
    ]
    expect(deepSeekUsageSamples({ seedLength: 2 }, events).map(sample => sample.seq)).toEqual([2])
  })
})

describe('official time-of-use pricing', () => {
  it('selects legacy, peak, and off-peak phases at their exact boundaries', () => {
    expect(deepSeekPricingPhase(DEEPSEEK_PRICING_EFFECTIVE_AT - 1)).toBe('legacy')
    expect(deepSeekPricingPhase(Date.parse('2026-08-17T01:00:00Z'))).toBe('peak')
    expect(deepSeekPricingPhase(Date.parse('2026-08-17T04:00:00Z'))).toBe('offPeak')
    expect(deepSeekPricingPhase(Date.parse('2026-08-17T06:00:00Z'))).toBe('peak')
    expect(deepSeekPricingPhase(Date.parse('2026-08-17T10:00:00Z'))).toBe('offPeak')
    expect(deepSeekPriceAt('unknown', Date.now())).toBeUndefined()
  })

  it('aggregates today, week, month, model splits, and estimated cost', () => {
    const generatedAt = Date.parse('2026-08-19T08:00:00Z')
    const events = [
      event(0, 'request/header', { header: { config: { provider: 'deepseek-official', model: 'deepseek-v4-flash' } } }, generatedAt),
      event(1, 'assistant/message', {
        turn: 0,
        step: 0,
        usage: { inputTokens: 1_000_000, cacheReadTokens: 1_000_000, outputTokens: 1_000_000 },
      }, generatedAt),
      event(2, 'request/context', { provider: 'deepseek-official', model: 'deepseek-v4-pro' }, generatedAt),
      event(3, 'assistant/message', {
        turn: 1,
        step: 0,
        usage: { inputTokens: 1_000_000, outputTokens: 1_000_000 },
      }, generatedAt),
    ]
    const samples = deepSeekUsageSamples({}, events)
    const view = aggregateDeepSeekUsage(samples, '2026-08', 'UTC', generatedAt)

    expect(view.totals.today.totalTokens).toBe(5_000_000)
    expect(view.totals.week.totalTokens).toBe(5_000_000)
    expect(view.models.find(model => model.model === 'deepseek-v4-flash')?.totals.allTime.totalTokens).toBe(3_000_000)
    expect(view.models.find(model => model.model === 'deepseek-v4-pro')?.totals.allTime.totalTokens).toBe(2_000_000)
    expect(view.totals.today.estimatedCostCny).toBeGreaterThan(0)
    expect(view.days[18]?.totalTokens).toBe(5_000_000)
  })
})
