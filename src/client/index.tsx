import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { BalanceOverlay } from './BalanceOverlay.js'
import { FooterAction, type PanelFace } from './FooterAction.js'
import { en, NS, zh } from './locales.js'
import { PanelStore } from './store.js'

export const inject = ['slots', 'locale']

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'api-balance: dictionaries')

  const store = new PanelStore()
  const face = (): PanelFace => ({ store })
  ctx.effect(() => () => store.dispose(), 'api-balance: store lifecycle')

  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'api-balance',
    order: 20,
    label: 'API $$',
    locale: NS,
    inject: face,
  }, FooterAction))

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'api-balance-panel',
    order: 120,
    label: 'API $$',
    locale: NS,
    inject: face,
  }, BalanceOverlay))

  void store.refresh()
}

export type { PanelFace } from './FooterAction.js'
export { PanelStore } from './store.js'
