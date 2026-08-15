import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { PricingPhase, PricingView } from '../contracts.js'
import { NS } from './locales.js'

interface PricingTableProps extends PropsLocale<typeof NS> {
  pricing: PricingView
  selectedModel: string
  selectedPhase: PricingPhase | null
  onPhaseChange: (phase: PricingPhase) => void
}

const PHASES: PricingPhase[] = ['legacy', 'offPeak', 'peak']

export function PricingTable({
  pricing,
  selectedModel,
  selectedPhase,
  onPhaseChange,
  t,
}: PricingTableProps): JSX.Element {
  const phase = selectedPhase ?? pricing.currentPhase
  const models = selectedModel === 'all'
    ? pricing.models
    : pricing.models.filter(item => item.model === selectedModel)
  const modelName = (model: string): string => model === 'deepseek-v4-flash'
    ? t('usage.model.flash')
    : model === 'deepseek-v4-pro' ? t('usage.model.pro') : model
  const formatRate = (value: number): string => `¥${Number(value.toFixed(3))}`
  const effectiveDate = new Date(pricing.effectiveAt).toLocaleDateString(undefined, {
    timeZone: pricing.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const peakHours = pricing.peakPeriods.map(period => `${period.start}-${period.end}`).join('、')

  return (
    <section style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--dsw-alias-border-l1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <strong style={{ fontSize: 13, lineHeight: '18px', color: 'var(--dsw-alias-label-primary)' }}>
          {t('pricing.title')}
        </strong>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 10,
          lineHeight: '16px',
          color: pricing.currentPhase === 'peak'
            ? 'var(--dsw-alias-state-warn-primary)'
            : 'var(--dsw-alias-state-success-primary)',
          whiteSpace: 'nowrap',
        }}>
          <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
          {t('pricing.current')}{t(`pricing.phase.${pricing.currentPhase}`)}
        </span>
      </div>

      <div
        role="group"
        aria-label={t('pricing.select')}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          border: '1px solid var(--dsw-alias-border-l2)',
          borderRadius: 7,
          overflow: 'hidden',
          marginBottom: 9,
        }}
      >
        {PHASES.map((item, index) => {
          const active = phase === item
          return (
            <button
              key={item}
              type="button"
              aria-pressed={active}
              onClick={() => onPhaseChange(item)}
              style={{
                height: 32,
                padding: '0 6px',
                border: 'none',
                borderLeft: index === 0 ? 'none' : '1px solid var(--dsw-alias-border-l2)',
                background: active ? 'var(--dsw-static-blue-450)' : 'var(--dsw-alias-button-elevated-fill)',
                color: active ? 'white' : 'var(--dsw-alias-label-primary)',
                font: 'inherit',
                fontSize: 11,
                fontWeight: active ? 650 : 500,
                cursor: 'pointer',
              }}
            >
              {t(`pricing.phase.${item}`)}
            </button>
          )
        })}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(74px, 1.1fr) repeat(3, minmax(0, 1fr))',
        alignItems: 'center',
        fontSize: 10,
        lineHeight: '15px',
      }}>
        <span style={{ color: 'var(--dsw-alias-label-secondary)', padding: '3px 4px' }}>{t('pricing.model')}</span>
        <span style={{ color: 'var(--dsw-alias-label-secondary)', textAlign: 'right', padding: '3px 2px' }}>{t('pricing.cacheHit')}</span>
        <span style={{ color: 'var(--dsw-alias-label-secondary)', textAlign: 'right', padding: '3px 2px' }}>{t('pricing.cacheMiss')}</span>
        <span style={{ color: 'var(--dsw-alias-label-secondary)', textAlign: 'right', padding: '3px 2px' }}>{t('pricing.output')}</span>
        {models.flatMap(model => {
          const rates = model[phase]
          return [
            <strong key={`${model.model}-name`} style={{
              borderTop: '1px solid var(--dsw-alias-border-l1)',
              color: 'var(--dsw-alias-label-primary)',
              padding: '6px 4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {modelName(model.model)}
            </strong>,
            ...([
              ['cacheHit', rates.cacheHit],
              ['cacheMiss', rates.cacheMiss],
              ['output', rates.output],
            ] as const).map(([key, value]) => (
              <span
                key={`${model.model}-${key}`}
                title={`${formatRate(value)} / ${pricing.unitTokens.toLocaleString()} ${t('usage.tokens')}`}
                style={{
                  borderTop: '1px solid var(--dsw-alias-border-l1)',
                  color: 'var(--dsw-alias-label-primary)',
                  textAlign: 'right',
                  padding: '6px 2px',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatRate(value)}
              </span>
            )),
          ]
        })}
      </div>

      <p style={{ margin: '8px 0 0', fontSize: 10, lineHeight: '16px', color: 'var(--dsw-alias-label-secondary)' }}>
        {t('pricing.unit')} · {t('pricing.peakHours')} {peakHours} · {t('pricing.offPeakRest')}
        <br />
        {t('pricing.effectiveAt')} {effectiveDate} 00:00
      </p>
      <p style={{ margin: '5px 0 0', fontSize: 10, lineHeight: '16px', color: 'var(--dsw-alias-label-secondary)' }}>
        {t('pricing.estimateHint')} ·{' '}
        <a
          href={pricing.sourceUrl}
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--dsw-static-blue-450)', textDecoration: 'none' }}
        >
          {t('pricing.source')}
        </a>
      </p>
    </section>
  )
}
