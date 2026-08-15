export function currentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function shiftMonthKey(month: string, delta: number): string {
  const [year, number] = month.split('-').map(Number)
  const shifted = new Date(year!, number! - 1 + delta, 1, 12)
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}`
}

export function formatMonthName(month: string): string {
  const [year, number] = month.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long' })
    .format(new Date(year!, number! - 1, 1, 12))
}

export function formatTokenCount(value: number): string {
  const compact = (divisor: number, suffix: string): string =>
    `${Number((value / divisor).toFixed(value >= divisor * 10 ? 1 : 2))}${suffix}`
  if (value >= 1e9) return compact(1e9, 'B')
  if (value >= 1e6) return compact(1e6, 'M')
  if (value >= 1e3) return compact(1e3, 'K')
  return value.toLocaleString()
}

export function formatEstimatedCost(value: number): string {
  const digits = value > 0 && value < 0.01 ? 4 : 2
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatAmount(currency: string, amount: string): string {
  return `${currency === 'CNY' ? '¥' : `${currency} `}${amount}`
}
