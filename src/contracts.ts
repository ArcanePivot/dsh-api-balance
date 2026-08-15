export const API_BASE_PATH = '/api/api-balance'
export const BALANCE_PATH = `${API_BASE_PATH}/balance`
export const USAGE_PATH = `${API_BASE_PATH}/usage`

export type DeepSeekModel = 'deepseek-v4-flash' | 'deepseek-v4-pro'
export type PricingPhase = 'legacy' | 'offPeak' | 'peak'

export interface BalanceInfoView {
  currency: string
  totalBalance: string
  grantedBalance: string
  toppedUpBalance: string
}

export interface BalanceSuccess {
  ok: true
  provider: 'deepseek-official'
  baseURL: string
  checkedAt: number
  isAvailable: boolean
  infos: BalanceInfoView[]
}

export interface BalanceFailure {
  ok: false
  provider: 'deepseek-official'
  baseURL: string
  checkedAt: number
  code: 'missing-credential' | 'upstream' | 'timeout' | 'cancelled'
  message: string
}

export type BalanceView = BalanceSuccess | BalanceFailure

export interface UsageBuckets {
  uncachedInputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  calls: number
  cacheHitCostCny: number
  cacheMissCostCny: number
  outputCostCny: number
  estimatedCostCny: number
  pricedCalls: number
  unpricedCalls: number
}

export interface UsageBucketsView extends UsageBuckets {
  totalTokens: number
  cacheHitRate: number | null
}

export interface UsageDayView extends UsageBucketsView {
  date: string
}

export interface UsageSeriesView {
  today: string
  currentWeekStart: string
  currentMonth: string
  selectedMonth: string
  totals: {
    today: UsageBucketsView
    week: UsageBucketsView
    month: UsageBucketsView
    allTime: UsageBucketsView
    selectedMonth: UsageBucketsView
  }
  days: UsageDayView[]
}

export interface PriceRates {
  cacheHit: number
  cacheMiss: number
  output: number
}

export interface PricingModelView {
  model: DeepSeekModel
  legacy: PriceRates
  offPeak: PriceRates
  peak: PriceRates
}

export interface PricingView {
  currency: 'CNY'
  unitTokens: 1_000_000
  sourceUrl: string
  sourceUpdatedAt: string
  effectiveAt: number
  timeZone: 'Asia/Shanghai'
  currentPhase: PricingPhase
  peakPeriods: Array<{ start: string; end: string }>
  models: PricingModelView[]
}

export interface UsageCoverage {
  sessions: number
  failedSessions: number
  durable: boolean
}

export interface UsageView extends UsageSeriesView {
  provider: 'deepseek-official'
  source: 'local-retained-sessions'
  timeZone: string
  generatedAt: number
  models: Array<UsageSeriesView & { model: string }>
  pricing: PricingView
  coverage: UsageCoverage
}

export interface ApiErrorView {
  ok: false
  code: 'bad-request' | 'forbidden' | 'method-not-allowed' | 'internal'
  message: string
}
