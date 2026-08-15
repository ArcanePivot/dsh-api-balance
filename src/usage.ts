import type { UsageBuckets, UsageBucketsView, UsageSeriesView, UsageView } from './contracts.js'
import {
  DEEPSEEK_USAGE_MODELS,
  DEEPSEEK_USAGE_PROVIDER,
  deepSeekPricingView,
  priceUsage,
} from './pricing.js'

export interface SessionHeaderLike {
  seedLength?: number
}

export interface SessionEventLike {
  type: string
  seq: number
  time: number
  data?: Record<string, any>
}

export interface UsageSample {
  seq: number
  time: number
  provider: string | undefined
  model: string
  buckets: UsageBuckets
}

export function emptyUsageBuckets(): UsageBuckets {
  return {
    uncachedInputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    calls: 0,
    cacheHitCostCny: 0,
    cacheMissCostCny: 0,
    outputCostCny: 0,
    estimatedCostCny: 0,
    pricedCalls: 0,
    unpricedCalls: 0,
  }
}

function tokenCount(value: unknown): number {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : 0
}

export function usageBucketsFrom(usage: Record<string, unknown> | undefined): UsageBuckets {
  return {
    ...emptyUsageBuckets(),
    uncachedInputTokens: tokenCount(usage?.inputTokens),
    outputTokens: tokenCount(usage?.outputTokens),
    cacheReadTokens: tokenCount(usage?.cacheReadTokens),
    cacheWriteTokens: tokenCount(usage?.cacheWriteTokens),
    calls: 1,
  }
}

export function addUsageBuckets(target: UsageBuckets, source: UsageBuckets): UsageBuckets {
  target.uncachedInputTokens += source.uncachedInputTokens
  target.outputTokens += source.outputTokens
  target.cacheReadTokens += source.cacheReadTokens
  target.cacheWriteTokens += source.cacheWriteTokens
  target.calls += source.calls
  target.cacheHitCostCny += source.cacheHitCostCny
  target.cacheMissCostCny += source.cacheMissCostCny
  target.outputCostCny += source.outputCostCny
  target.estimatedCostCny += source.estimatedCostCny
  target.pricedCalls += source.pricedCalls
  target.unpricedCalls += source.unpricedCalls
  return target
}

function money(value: number): number {
  return Number(value.toFixed(12))
}

export function usageBucketsView(buckets: UsageBuckets): UsageBucketsView {
  const promptTokens = buckets.uncachedInputTokens + buckets.cacheReadTokens + buckets.cacheWriteTokens
  return {
    ...buckets,
    cacheHitCostCny: money(buckets.cacheHitCostCny),
    cacheMissCostCny: money(buckets.cacheMissCostCny),
    outputCostCny: money(buckets.outputCostCny),
    estimatedCostCny: money(buckets.estimatedCostCny),
    totalTokens: promptTokens + buckets.outputTokens,
    cacheHitRate: promptTokens === 0 ? null : buckets.cacheReadTokens / promptTokens,
  }
}

export function deepSeekUsageSamples(
  meta: SessionHeaderLike,
  events: readonly SessionEventLike[],
  provider = DEEPSEEK_USAGE_PROVIDER,
): UsageSample[] {
  const inheritedLength = Number.isSafeInteger(meta.seedLength) && Number(meta.seedLength) > 0
    ? Number(meta.seedLength)
    : 0
  const samples = new Map<string, UsageSample>()
  let currentProvider: string | undefined
  let currentModel: string | undefined

  for (const event of events) {
    if (event.type === 'request/header') {
      const configuredProvider = event.data?.header?.config?.provider
      const configuredModel = event.data?.header?.config?.model
      if (typeof configuredProvider === 'string' && configuredProvider.length > 0) currentProvider = configuredProvider
      if (typeof configuredModel === 'string' && configuredModel.length > 0) currentModel = configuredModel
    } else if (event.type === 'request/context') {
      const configuredProvider = event.data?.provider
      const configuredModel = event.data?.model
      if (typeof configuredProvider === 'string' && configuredProvider.length > 0) currentProvider = configuredProvider
      if (typeof configuredModel === 'string' && configuredModel.length > 0) currentModel = configuredModel
    }

    let turn: unknown
    let step: unknown
    let usage: Record<string, unknown> | undefined
    let sampleProvider = currentProvider
    let sampleModel = currentModel
    if (event.type === 'assistant/chunk' && event.data?.chunk?.type === 'usage') {
      turn = event.data.turn
      step = event.data.step
      usage = event.data.chunk.usage
    } else if (event.type === 'assistant/message' && event.data?.usage !== undefined) {
      turn = event.data.turn
      step = event.data.step
      usage = event.data.usage
      const messageProvider = event.data.message?.source?.provider
      const messageModel = event.data.message?.source?.model
      if (typeof messageProvider === 'string' && messageProvider.length > 0) sampleProvider = messageProvider
      if (typeof messageModel === 'string' && messageModel.length > 0) sampleModel = messageModel
    }
    if (usage === undefined || !Number.isSafeInteger(turn) || !Number.isSafeInteger(step)) continue
    if (!Number.isSafeInteger(event.seq) || !Number.isFinite(event.time)) continue
    samples.set(`${String(turn)}:${String(step)}`, {
      seq: event.seq,
      time: event.time,
      provider: sampleProvider,
      model: typeof sampleModel === 'string' && sampleModel.length > 0 ? sampleModel : 'unknown',
      buckets: usageBucketsFrom(usage),
    })
  }

  return [...samples.values()].filter(sample => sample.seq >= inheritedLength && sample.provider === provider)
}

export function usageDateKey(time: number, formatter: Intl.DateTimeFormat): string {
  const values: Partial<Record<'year' | 'month' | 'day', string>> = {}
  for (const part of formatter.formatToParts(new Date(time))) {
    if (part.type === 'year' || part.type === 'month' || part.type === 'day') values[part.type] = part.value
  }
  if (values.year === undefined || values.month === undefined || values.day === undefined) {
    throw new Error('unable to format usage date')
  }
  return `${values.year}-${values.month}-${values.day}`
}

export function usageMonthDayCount(month: string): number {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new TypeError(`invalid usage month: ${month}`)
  const [year, number] = month.split('-').map(Number)
  const date = new Date(0)
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCFullYear(year!, number!, 0)
  return date.getUTCDate()
}

export function usageWeekStart(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00Z`)
  const daysSinceMonday = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - daysSinceMonday)
  return date.toISOString().slice(0, 10)
}

export function validateTimeZone(timeZone: string): string {
  if (timeZone.length === 0 || timeZone.length > 80) throw new TypeError('invalid time zone')
  new Intl.DateTimeFormat('en-CA', { timeZone }).format()
  return timeZone
}

export function aggregateUsageSeries(
  samples: readonly UsageSample[],
  selectedMonth: string,
  timeZone: string,
  generatedAt: number,
): UsageSeriesView {
  usageMonthDayCount(selectedMonth)
  validateTimeZone(timeZone)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const todayKey = usageDateKey(generatedAt, formatter)
  const currentMonth = todayKey.slice(0, 7)
  const currentWeekStart = usageWeekStart(todayKey)
  const today = emptyUsageBuckets()
  const week = emptyUsageBuckets()
  const month = emptyUsageBuckets()
  const allTime = emptyUsageBuckets()
  const selectedMonthTotal = emptyUsageBuckets()
  const days = Array.from({ length: usageMonthDayCount(selectedMonth) }, (_, index) => ({
    date: `${selectedMonth}-${String(index + 1).padStart(2, '0')}`,
    ...emptyUsageBuckets(),
  }))

  for (const sample of samples) {
    const key = usageDateKey(sample.time, formatter)
    const buckets = priceUsage(sample.model, sample.time, sample.buckets)
    addUsageBuckets(allTime, buckets)
    if (key === todayKey) addUsageBuckets(today, buckets)
    if (key >= currentWeekStart && key <= todayKey) addUsageBuckets(week, buckets)
    if (key.startsWith(`${currentMonth}-`)) addUsageBuckets(month, buckets)
    if (key.startsWith(`${selectedMonth}-`)) {
      addUsageBuckets(selectedMonthTotal, buckets)
      const day = Number(key.slice(-2))
      const target = days[day - 1]
      if (target !== undefined) addUsageBuckets(target, buckets)
    }
  }

  return {
    today: todayKey,
    currentWeekStart,
    currentMonth,
    selectedMonth,
    totals: {
      today: usageBucketsView(today),
      week: usageBucketsView(week),
      month: usageBucketsView(month),
      allTime: usageBucketsView(allTime),
      selectedMonth: usageBucketsView(selectedMonthTotal),
    },
    days: days.map(day => ({ date: day.date, ...usageBucketsView(day) })),
  }
}

export function aggregateDeepSeekUsage(
  samples: readonly UsageSample[],
  selectedMonth: string,
  timeZone: string,
  generatedAt = Date.now(),
): Omit<UsageView, 'coverage'> {
  const overall = aggregateUsageSeries(samples, selectedMonth, timeZone, generatedAt)
  const extraModels = [...new Set(samples
    .map(sample => sample.model)
    .filter(model => !DEEPSEEK_USAGE_MODELS.includes(model as typeof DEEPSEEK_USAGE_MODELS[number])))]
    .sort()
  const modelNames = [...DEEPSEEK_USAGE_MODELS, ...extraModels]
  return {
    provider: DEEPSEEK_USAGE_PROVIDER,
    source: 'local-retained-sessions',
    timeZone,
    generatedAt,
    ...overall,
    models: modelNames.map(model => ({
      model,
      ...aggregateUsageSeries(samples.filter(sample => sample.model === model), selectedMonth, timeZone, generatedAt),
    })),
    pricing: deepSeekPricingView(generatedAt),
  }
}
