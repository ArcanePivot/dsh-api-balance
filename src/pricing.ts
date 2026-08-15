import type {
  DeepSeekModel,
  PriceRates,
  PricingPhase,
  PricingView,
  UsageBuckets,
} from './contracts.js'

export const DEEPSEEK_USAGE_PROVIDER = 'deepseek-official'
export const DEEPSEEK_USAGE_MODELS = ['deepseek-v4-flash', 'deepseek-v4-pro'] as const
export const DEEPSEEK_PRICING_SOURCE_URL = 'https://api-docs.deepseek.com/zh-cn/quick_start/pricing/'
export const DEEPSEEK_PRICING_SOURCE_UPDATED_AT = '2026-08-13'
export const DEEPSEEK_PRICING_EFFECTIVE_AT = Date.parse('2026-08-16T16:00:00Z')

export const DEEPSEEK_PRICING: Record<PricingPhase, Record<DeepSeekModel, PriceRates>> = {
  legacy: {
    'deepseek-v4-flash': { cacheHit: 0.02, cacheMiss: 1, output: 2 },
    'deepseek-v4-pro': { cacheHit: 0.025, cacheMiss: 3, output: 6 },
  },
  offPeak: {
    'deepseek-v4-flash': { cacheHit: 0.05, cacheMiss: 1.5, output: 4.5 },
    'deepseek-v4-pro': { cacheHit: 0.15, cacheMiss: 4.5, output: 13.5 },
  },
  peak: {
    'deepseek-v4-flash': { cacheHit: 0.1, cacheMiss: 3, output: 9 },
    'deepseek-v4-pro': { cacheHit: 0.3, cacheMiss: 9, output: 27 },
  },
}

export function deepSeekPricingPhase(time: number): PricingPhase {
  if (time < DEEPSEEK_PRICING_EFFECTIVE_AT) return 'legacy'
  const hour = new Date(time).getUTCHours()
  return (hour >= 1 && hour < 4) || (hour >= 6 && hour < 10) ? 'peak' : 'offPeak'
}

export function deepSeekPriceAt(model: string, time: number): { phase: PricingPhase; rates: PriceRates } | undefined {
  if (!DEEPSEEK_USAGE_MODELS.includes(model as DeepSeekModel)) return undefined
  const phase = deepSeekPricingPhase(time)
  return { phase, rates: DEEPSEEK_PRICING[phase][model as DeepSeekModel] }
}

export function priceUsage(model: string, time: number, source: UsageBuckets): UsageBuckets {
  const result = { ...source }
  const pricing = deepSeekPriceAt(model, time)
  if (pricing === undefined) {
    result.unpricedCalls += source.calls
    return result
  }
  const perMillion = 1_000_000
  result.cacheHitCostCny = source.cacheReadTokens * pricing.rates.cacheHit / perMillion
  result.cacheMissCostCny = (source.uncachedInputTokens + source.cacheWriteTokens) * pricing.rates.cacheMiss / perMillion
  result.outputCostCny = source.outputTokens * pricing.rates.output / perMillion
  result.estimatedCostCny = result.cacheHitCostCny + result.cacheMissCostCny + result.outputCostCny
  result.pricedCalls += source.calls
  return result
}

export function deepSeekPricingView(generatedAt: number): PricingView {
  return {
    currency: 'CNY',
    unitTokens: 1_000_000,
    sourceUrl: DEEPSEEK_PRICING_SOURCE_URL,
    sourceUpdatedAt: DEEPSEEK_PRICING_SOURCE_UPDATED_AT,
    effectiveAt: DEEPSEEK_PRICING_EFFECTIVE_AT,
    timeZone: 'Asia/Shanghai',
    currentPhase: deepSeekPricingPhase(generatedAt),
    peakPeriods: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    models: DEEPSEEK_USAGE_MODELS.map(model => ({
      model,
      legacy: DEEPSEEK_PRICING.legacy[model],
      offPeak: DEEPSEEK_PRICING.offPeak[model],
      peak: DEEPSEEK_PRICING.peak[model],
    })),
  }
}
