import {
  IconChevronLeftOutline14,
  IconChevronRightOutline14,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { PricingPhase, UsageBucketsView, UsageSeriesView, UsageView } from '../contracts.js'
import {
  currentMonthKey,
  formatEstimatedCost,
  formatMonthName,
  formatTokenCount,
  shiftMonthKey,
} from './format.js'
import { NS } from './locales.js'
import { PricingTable } from './PricingTable.js'
import type { LoadState } from './store.js'

interface UsageAnalyticsProps extends PropsLocale<typeof NS> {
  state: LoadState<UsageView>
  selectedMonth: string
  selectedModel: string
  selectedPricePhase: PricingPhase | null
  onMonthChange: (month: string) => void
  onModelChange: (model: string) => void
  onPricePhaseChange: (phase: PricingPhase) => void
  onRetry: () => void
}

const sectionStyle: React.CSSProperties = {
  marginTop: 14,
  paddingTop: 14,
  borderTop: '1px solid var(--dsw-alias-border-l1)',
}

const actionButtonStyle: React.CSSProperties = {
  marginTop: 8,
  padding: '6px 12px',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: 7,
  background: 'var(--dsw-alias-button-elevated-fill)',
  color: 'var(--dsw-alias-label-primary)',
  font: 'inherit',
  fontSize: 13,
  cursor: 'pointer',
}

export function UsageAnalytics({
  state,
  selectedMonth,
  selectedModel,
  selectedPricePhase,
  onMonthChange,
  onModelChange,
  onPricePhaseChange,
  onRetry,
  t,
}: UsageAnalyticsProps): JSX.Element {
  const heading = (
    <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 650, lineHeight: '20px', color: 'var(--dsw-alias-label-primary)' }}>
      {t('usage.title')}
    </h3>
  )

  if (state.status === 'loading') {
    return (
      <section style={sectionStyle}>
        {heading}
        <p style={{ margin: 0, fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-secondary)' }}>
          {t('usage.loading')}
        </p>
      </section>
    )
  }
  if (state.status === 'error') {
    return (
      <section style={sectionStyle}>
        {heading}
        <p role="alert" style={{ margin: 0, fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-state-error-primary)' }}>
          {state.message}
        </p>
        <button type="button" style={actionButtonStyle} onClick={onRetry}>{t('balance.retryAction')}</button>
      </section>
    )
  }

  const value = state.value
  const selectedSeries: UsageSeriesView = selectedModel === 'all'
    ? value
    : value.models.find(item => item.model === selectedModel) ?? value
  const modelName = (model: string): string => model === 'deepseek-v4-flash'
    ? t('usage.model.flash')
    : model === 'deepseek-v4-pro' ? t('usage.model.pro') : model
  const modelOptions: Array<{ id: string; label: string; series: UsageSeriesView }> = [
    { id: 'all', label: t('usage.model.all'), series: value },
    ...value.models
      .filter(item => item.model === 'deepseek-v4-flash' || item.model === 'deepseek-v4-pro')
      .map(item => ({ id: item.model, label: modelName(item.model), series: item })),
  ]
  const days = selectedSeries.days
  const maxTokens = Math.max(0, ...days.map(day => day.totalTokens))
  const current = currentMonthKey()

  const metric = (label: string, bucket: UsageBucketsView): JSX.Element => (
    <div
      title={`${bucket.totalTokens.toLocaleString()} ${t('usage.tokens')} · ${formatEstimatedCost(bucket.estimatedCostCny)}`}
      style={{ minWidth: 0, padding: '8px 7px' }}
    >
      <strong style={{
        display: 'block',
        fontSize: 17,
        fontWeight: 650,
        lineHeight: '23px',
        color: 'var(--dsw-alias-label-primary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {formatTokenCount(bucket.totalTokens)}
      </strong>
      <span style={{ display: 'block', fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-label-secondary)', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span style={{
        display: 'block',
        fontSize: 10,
        lineHeight: '15px',
        color: 'var(--dsw-static-blue-450)',
        fontWeight: 600,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {formatEstimatedCost(bucket.estimatedCostCny)}
      </span>
    </div>
  )

  const iconButtonStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    border: 'none',
    borderRadius: '50%',
    background: 'transparent',
    color: 'var(--dsw-alias-label-secondary)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  }

  return (
    <section style={sectionStyle}>
      {heading}

      <div
        role="group"
        aria-label={t('usage.model.select')}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${modelOptions.length}, minmax(0, 1fr))`,
          marginBottom: 10,
          border: '1px solid var(--dsw-alias-border-l2)',
          borderRadius: 7,
          overflow: 'hidden',
        }}
      >
        {modelOptions.map((option, index) => {
          const active = selectedModel === option.id
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onModelChange(option.id)}
              style={{
                minWidth: 0,
                height: 50,
                padding: '5px 6px',
                border: 'none',
                borderLeft: index === 0 ? 'none' : '1px solid var(--dsw-alias-border-l2)',
                background: active ? 'var(--dsw-static-blue-450)' : 'var(--dsw-alias-button-elevated-fill)',
                color: active ? 'white' : 'var(--dsw-alias-label-primary)',
                font: 'inherit',
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'block', fontSize: 11, lineHeight: '15px', fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {option.label}
              </span>
              <span style={{ display: 'block', fontSize: 10, lineHeight: '15px', opacity: active ? 0.9 : 0.68, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {formatTokenCount(option.series.totals.allTime.totalTokens)}
              </span>
            </button>
          )
        })}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        background: 'var(--dsw-alias-button-elevated-fill)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 7,
        overflow: 'hidden',
      }}>
        {metric(t('usage.today'), selectedSeries.totals.today)}
        {metric(t('usage.week'), selectedSeries.totals.week)}
        {metric(t('usage.month'), selectedSeries.totals.month)}
        {metric(t('usage.allTime'), selectedSeries.totals.allTime)}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, margin: '8px 0 12px', fontSize: 12, lineHeight: '18px' }}>
        <span style={{ color: 'var(--dsw-alias-label-secondary)' }}>{t('usage.cacheHit')}</span>
        <strong style={{ color: 'var(--dsw-alias-label-primary)', fontWeight: 600 }}>
          {selectedSeries.totals.today.cacheHitRate === null
            ? '—'
            : new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 })
                .format(selectedSeries.totals.today.cacheHitRate)}
        </strong>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <div style={{ minWidth: 0 }}>
          <strong style={{ display: 'block', fontSize: 13, lineHeight: '18px', color: 'var(--dsw-alias-label-primary)' }}>
            {t('usage.daily')}
          </strong>
          <span style={{ display: 'block', fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-label-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {formatMonthName(selectedMonth)} · {formatTokenCount(selectedSeries.totals.selectedMonth.totalTokens)} · {formatEstimatedCost(selectedSeries.totals.selectedMonth.estimatedCostCny)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 'none' }}>
          <button type="button" style={iconButtonStyle} title={t('usage.previousMonth')} aria-label={t('usage.previousMonth')} onClick={() => onMonthChange(shiftMonthKey(selectedMonth, -1))}>
            <IconChevronLeftOutline14 size={14} />
          </button>
          <button
            type="button"
            style={{ ...iconButtonStyle, opacity: selectedMonth >= current ? 0.35 : 1, cursor: selectedMonth >= current ? 'default' : 'pointer' }}
            disabled={selectedMonth >= current}
            title={t('usage.nextMonth')}
            aria-label={t('usage.nextMonth')}
            onClick={() => onMonthChange(shiftMonthKey(selectedMonth, 1))}
          >
            <IconChevronRightOutline14 size={14} />
          </button>
        </div>
      </div>

      <div
        role="img"
        aria-label={`${formatMonthName(selectedMonth)} ${t('usage.daily')}`}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 3,
          height: 112,
          paddingTop: 4,
          borderBottom: '1px solid var(--dsw-alias-border-l1)',
        }}
      >
        {maxTokens === 0 && (
          <span style={{ position: 'absolute', inset: '34px 0 auto', textAlign: 'center', fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }}>
            {t('usage.empty')}
          </span>
        )}
        {days.map((day, index) => {
          const number = index + 1
          const isToday = day.date === selectedSeries.today
          const height = day.totalTokens === 0 || maxTokens === 0 ? 2 : Math.max(4, Math.round(day.totalTokens / maxTokens * 84))
          const showLabel = number === 1 || number === days.length || (number % 5 === 0 && days.length - number > 1) || isToday
          return (
            <div
              key={day.date}
              title={`${day.date}: ${day.totalTokens.toLocaleString()} ${t('usage.tokens')} · ${formatEstimatedCost(day.estimatedCostCny)} · ${day.calls} ${t('usage.calls')}`}
              style={{ display: 'flex', flex: '1 1 0', minWidth: 0, height: '100%', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}
            >
              <span style={{
                width: '100%',
                maxWidth: 10,
                height,
                borderRadius: '3px 3px 1px 1px',
                background: 'var(--dsw-static-blue-450)',
                opacity: isToday ? 1 : day.totalTokens === 0 ? 0.18 : 0.58,
              }} />
              <span style={{
                display: 'block',
                width: 12,
                height: 18,
                paddingTop: 4,
                fontSize: 9,
                lineHeight: '14px',
                textAlign: 'center',
                color: isToday ? 'var(--dsw-static-blue-450)' : 'var(--dsw-alias-label-secondary)',
                fontWeight: isToday ? 650 : 400,
              }}>
                {showLabel ? String(number) : ''}
              </span>
            </div>
          )
        })}
      </div>

      <PricingTable
        pricing={value.pricing}
        selectedModel={selectedModel}
        selectedPhase={selectedPricePhase}
        onPhaseChange={onPricePhaseChange}
        t={t}
      />

      <p
        title={t('usage.scopeHint')}
        style={{
          margin: '8px 0 0',
          fontSize: 11,
          lineHeight: '16px',
          color: value.coverage.failedSessions > 0
            ? 'var(--dsw-alias-state-warn-primary)'
            : 'var(--dsw-alias-label-secondary)',
        }}
      >
        {t('usage.coverage')} · {value.coverage.sessions}
        {value.coverage.failedSessions > 0 ? ` · ${value.coverage.failedSessions} ${t('usage.skipped')}` : ''}
      </p>
    </section>
  )
}
