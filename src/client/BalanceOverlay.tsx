import { useEffect, useRef, useState } from 'react'
import {
  IconCloseOutline16,
  IconRefreshOutline14,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { formatAmount } from './format.js'
import type { PanelFace } from './FooterAction.js'
import { NS } from './locales.js'
import { usePanelSnapshot } from './store.js'
import { UsageAnalytics } from './UsageAnalytics.js'

export type BalanceOverlayProps = PropsLocale<typeof NS> & PanelFace

const LOW_BALANCE_THRESHOLD = 20

function useViewport(): { width: number; height: number } {
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const update = (): void => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return viewport
}

export function BalanceOverlay({ t, store }: BalanceOverlayProps): JSX.Element | null {
  const state = usePanelSnapshot(store)
  const viewport = useViewport()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!state.open) return
    const onPointerDown = (event: PointerEvent): void => {
      if (panelRef.current?.contains(event.target as Node) === true) return
      if ((event.target as Element | null)?.closest?.('[data-api-balance-trigger]') !== null) return
      store.close()
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') store.close()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    const frame = requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }))
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [state.open, store])

  if (!state.open || state.anchor === null) return null
  const width = Math.max(240, Math.min(440, viewport.width - 16))
  const left = Math.max(8, Math.min(state.anchor.right - width, viewport.width - width - 8))
  const preferAbove = state.anchor.top > 320
  const available = preferAbove
    ? state.anchor.top - 16
    : viewport.height - state.anchor.bottom - 16
  const maxHeight = Math.max(180, Math.min(Math.round(viewport.height * 0.82), available))
  const position: React.CSSProperties = preferAbove
    ? { bottom: viewport.height - state.anchor.top + 8 }
    : { top: state.anchor.bottom + 8 }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={t('balance.title')}
      aria-modal="false"
      data-api-balance-panel
      style={{
        position: 'fixed',
        zIndex: 1000,
        left,
        width,
        maxHeight,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        pointerEvents: 'auto',
        background: 'var(--dsw-alias-bg-layer-1)',
        border: '1px solid var(--dsw-alias-border-l2)',
        borderRadius: 8,
        boxShadow: 'var(--dsw-shadow-lv3)',
        padding: '14px 14px 10px',
        ...position,
      }}
    >
      <div style={{ display: 'flex', flex: 'none', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 650, color: 'var(--dsw-alias-label-primary)', lineHeight: '22px' }}>
          {t('balance.title')}
        </h2>
        <button
          ref={closeRef}
          type="button"
          aria-label={t('balance.close')}
          title={t('balance.close')}
          onClick={() => store.close()}
          style={{
            width: 28,
            height: 28,
            border: 'none',
            borderRadius: '50%',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--dsw-alias-label-secondary)',
          }}
        >
          <IconCloseOutline16 size={14} />
        </button>
      </div>
      <p style={{ flex: 'none', margin: '0 0 8px', fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-secondary)' }}>
        {t('balance.detailHint')}
      </p>

      <div style={{ minHeight: 0, overflowX: 'hidden', overflowY: 'auto', overscrollBehavior: 'contain', padding: '4px 0 8px' }}>
        <BalanceBody t={t} store={store} />
      </div>

      <div style={{ display: 'flex', flex: 'none', justifyContent: 'flex-end', gap: 8, paddingTop: 10, borderTop: '1px solid var(--dsw-alias-border-l1)' }}>
        <button
          type="button"
          title={t('balance.refresh')}
          disabled={state.refreshing}
          onClick={() => { void store.refresh() }}
          style={{
            padding: '6px 12px',
            border: '1px solid var(--dsw-alias-border-l2)',
            borderRadius: 7,
            background: 'var(--dsw-alias-button-elevated-fill)',
            color: 'var(--dsw-alias-label-primary)',
            font: 'inherit',
            fontSize: 13,
            cursor: state.refreshing ? 'default' : 'pointer',
            opacity: state.refreshing ? 0.6 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <IconRefreshOutline14 size={14} />
          <span>{t('balance.refresh')}</span>
        </button>
        <button
          type="button"
          onClick={() => store.close()}
          style={{
            padding: '6px 12px',
            border: 'none',
            borderRadius: 7,
            background: 'transparent',
            color: 'var(--dsw-alias-label-secondary)',
            font: 'inherit',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {t('balance.close')}
        </button>
      </div>
    </div>
  )
}

function BalanceBody({ t, store }: BalanceOverlayProps): JSX.Element {
  const state = usePanelSnapshot(store)
  const balance = state.balance
  const info = balance.status === 'ready' && balance.value.ok ? balance.value.infos[0] : undefined
  const total = Number(info?.totalBalance)
  const low = info !== undefined && Number.isFinite(total) && total < LOW_BALANCE_THRESHOLD
  const textStyle: React.CSSProperties = {
    color: 'var(--dsw-alias-label-primary)',
    fontSize: 13,
    lineHeight: '20px',
    margin: '4px 0',
  }
  const retryStyle: React.CSSProperties = {
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
  const row = (label: string, value: string): JSX.Element => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '4px 0', fontSize: 13, lineHeight: '20px' }}>
      <span style={{ color: 'var(--dsw-alias-label-secondary)' }}>{label}</span>
      <span style={{ color: 'var(--dsw-alias-label-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  )

  let balanceBody: JSX.Element
  if (balance.status === 'loading') {
    balanceBody = <p style={textStyle}>{t('balance.loading')}</p>
  } else if (balance.status === 'error') {
    balanceBody = (
      <div>
        <p role="alert" style={{ ...textStyle, color: 'var(--dsw-alias-state-error-primary)' }}>{balance.message}</p>
        <button type="button" style={retryStyle} onClick={() => { void store.refresh() }}>{t('balance.retryAction')}</button>
      </div>
    )
  } else if (!balance.value.ok || info === undefined) {
    balanceBody = <p style={textStyle}>{t('balance.unavailable')}</p>
  } else {
    const checkedAt = new Date(balance.value.checkedAt)
    balanceBody = (
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
          <strong style={{
            fontSize: 26,
            fontWeight: 650,
            lineHeight: '34px',
            color: low ? 'var(--dsw-alias-state-warn-primary)' : 'var(--dsw-alias-label-primary)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatAmount(info.currency, info.totalBalance)}
          </strong>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            color: balance.value.isAvailable
              ? 'var(--dsw-alias-state-success-primary)'
              : 'var(--dsw-alias-state-error-primary)',
          }}>
            <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />
            {balance.value.isAvailable ? t('balance.availableShort') : t('balance.notAvailableShort')}
          </span>
        </div>
        {low && (
          <p role="status" style={{ margin: '0 0 8px', fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-state-warn-primary)' }}>
            {t('balance.low')}
          </p>
        )}
        {row(t('balance.toppedUp'), formatAmount(info.currency, info.toppedUpBalance))}
        {row(t('balance.granted'), formatAmount(info.currency, info.grantedBalance))}
        {row(t('balance.updatedAt'), checkedAt.toLocaleString())}
      </div>
    )
  }

  return (
    <div>
      {balanceBody}
      <UsageAnalytics
        state={state.usage}
        selectedMonth={state.selectedMonth}
        selectedModel={state.selectedModel}
        selectedPricePhase={state.selectedPricePhase}
        onMonthChange={month => store.setSelectedMonth(month)}
        onModelChange={model => store.setSelectedModel(model)}
        onPricePhaseChange={phase => store.setSelectedPricePhase(phase)}
        onRetry={() => { void store.refresh() }}
        t={t}
      />
    </div>
  )
}
