import { useSyncExternalStore } from 'react'
import { BALANCE_PATH, USAGE_PATH, type BalanceView, type PricingPhase, type UsageView } from '../contracts.js'
import { currentMonthKey } from './format.js'

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'ready'; value: T }
  | { status: 'error'; message: string }

export interface AnchorRect {
  top: number
  right: number
  bottom: number
  left: number
}

export interface PanelSnapshot {
  open: boolean
  anchor: AnchorRect | null
  refreshing: boolean
  selectedMonth: string
  selectedModel: 'all' | string
  selectedPricePhase: PricingPhase | null
  balance: LoadState<BalanceView>
  usage: LoadState<UsageView>
}

async function fetchJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    method: 'GET',
    headers: { accept: 'application/json' },
    credentials: 'same-origin',
    signal,
  })
  const value = await response.json() as T & { message?: unknown }
  if (!response.ok) throw new Error(typeof value.message === 'string' ? value.message : `HTTP ${response.status}`)
  return value
}

export class PanelStore {
  private snapshot: PanelSnapshot = {
    open: false,
    anchor: null,
    refreshing: false,
    selectedMonth: currentMonthKey(),
    selectedModel: 'all',
    selectedPricePhase: null,
    balance: { status: 'loading' },
    usage: { status: 'loading' },
  }

  private readonly listeners = new Set<() => void>()
  private balanceController: AbortController | undefined
  private usageController: AbortController | undefined
  private refreshGeneration = 0
  private disposed = false

  readonly getSnapshot = (): PanelSnapshot => this.snapshot

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private update(patch: Partial<PanelSnapshot>): void {
    if (this.disposed) return
    this.snapshot = { ...this.snapshot, ...patch }
    for (const listener of this.listeners) listener()
  }

  openAt(rect: DOMRect): void {
    this.update({
      open: true,
      anchor: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left },
    })
  }

  close(): void {
    this.update({ open: false })
  }

  setSelectedModel(model: string): void {
    this.update({ selectedModel: model })
  }

  setSelectedPricePhase(phase: PricingPhase): void {
    this.update({ selectedPricePhase: phase })
  }

  setSelectedMonth(month: string): void {
    if (month === this.snapshot.selectedMonth) return
    this.update({ selectedMonth: month, usage: { status: 'loading' } })
    void this.loadUsage(month)
  }

  async refresh(): Promise<void> {
    const generation = ++this.refreshGeneration
    this.update({ refreshing: true })
    await Promise.allSettled([this.loadBalance(), this.loadUsage(this.snapshot.selectedMonth)])
    if (generation === this.refreshGeneration) this.update({ refreshing: false })
  }

  private async loadBalance(): Promise<void> {
    this.balanceController?.abort()
    const controller = new AbortController()
    this.balanceController = controller
    if (this.snapshot.balance.status !== 'ready') this.update({ balance: { status: 'loading' } })
    try {
      const value = await fetchJson<BalanceView>(BALANCE_PATH, controller.signal)
      if (controller.signal.aborted) return
      if (!value.ok) this.update({ balance: { status: 'error', message: value.message } })
      else this.update({ balance: { status: 'ready', value } })
    } catch (error) {
      if (!controller.signal.aborted) {
        this.update({ balance: { status: 'error', message: error instanceof Error ? error.message : String(error) } })
      }
    }
  }

  private async loadUsage(month: string): Promise<void> {
    this.usageController?.abort()
    const controller = new AbortController()
    this.usageController = controller
    if (this.snapshot.usage.status !== 'ready') this.update({ usage: { status: 'loading' } })
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const query = new URLSearchParams({ month, timeZone })
    try {
      const value = await fetchJson<UsageView>(`${USAGE_PATH}?${query.toString()}`, controller.signal)
      if (!controller.signal.aborted && month === this.snapshot.selectedMonth) {
        this.update({ usage: { status: 'ready', value } })
      }
    } catch (error) {
      if (!controller.signal.aborted && month === this.snapshot.selectedMonth) {
        this.update({ usage: { status: 'error', message: error instanceof Error ? error.message : String(error) } })
      }
    }
  }

  dispose(): void {
    this.disposed = true
    this.refreshGeneration += 1
    this.balanceController?.abort()
    this.usageController?.abort()
    this.listeners.clear()
  }
}

export function usePanelSnapshot(store: PanelStore): PanelSnapshot {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
}
