import { useLayoutEffect, useRef } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { SidebarFooterActionOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { formatAmount, formatEstimatedCost } from './format.js'
import { NS } from './locales.js'
import { type PanelStore, usePanelSnapshot } from './store.js'
import { WalletIcon } from './WalletIcon.js'

export interface PanelFace {
  store: PanelStore
}

export type FooterActionProps = SidebarFooterActionOwnerProps & PropsLocale<typeof NS> & PanelFace

const LOW_BALANCE_THRESHOLD = 20

export function FooterAction({ wide, t, store }: FooterActionProps): JSX.Element {
  const state = usePanelSnapshot(store)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const info = state.balance.status === 'ready' && state.balance.value.ok
    ? state.balance.value.infos[0]
    : undefined
  const total = Number(info?.totalBalance)
  const low = info !== undefined && Number.isFinite(total) && total < LOW_BALANCE_THRESHOLD
  const balanceLabel = state.balance.status === 'ready'
    ? `${t('balance.shortLabel')} ${formatAmount(info?.currency ?? '', info?.totalBalance ?? '')}`
    : state.balance.status === 'error'
      ? t('balance.unavailable')
      : t('balance.loading')
  const todayCost = state.usage.status === 'ready'
    ? formatEstimatedCost(state.usage.value.totals.today.estimatedCostCny)
    : state.usage.status === 'error' ? '--' : '…'
  const label = `${balanceLabel} · ${t('usage.todaySpent')} ${todayCost}`
  const title = state.balance.status === 'error'
    ? `${t('balance.unavailable')}: ${state.balance.message}`
    : `${t('balance.title')}: ${label}${low ? ` (${t('balance.low')})` : ''}`

  const open = (): void => {
    const button = buttonRef.current
    if (button === null) return
    if (state.open) store.close()
    else store.openAt(button.getBoundingClientRect())
  }

  useLayoutEffect(() => {
    if (!state.open || buttonRef.current === null) return
    store.openAt(buttonRef.current.getBoundingClientRect())
  }, [state.open, store, wide])

  return (
    <button
      ref={buttonRef}
      type="button"
      title={title}
      aria-label={`${t('balance.title')}: ${label}`}
      aria-expanded={state.open}
      data-api-balance-trigger
      onClick={open}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: wide ? 'flex-start' : 'center',
        gap: 7,
        width: wide ? '100%' : 40,
        height: wide ? 36 : 40,
        boxSizing: 'border-box',
        border: 'none',
        borderRadius: 6,
        background: state.open ? 'var(--dsw-alias-bg-layer-2)' : 'transparent',
        cursor: 'pointer',
        padding: wide ? '7px 4px' : 0,
        font: 'inherit',
        fontSize: 14,
        fontWeight: 700,
        lineHeight: '20px',
        color: low ? 'var(--dsw-alias-state-warn-primary)' : 'var(--dsw-alias-label-primary)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textAlign: 'left',
      }}
    >
      <span style={{ display: 'inline-flex', flex: 'none' }}><WalletIcon size={16} /></span>
      {wide && (
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      )}
    </button>
  )
}
