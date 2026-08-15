import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import type { SidebarFooterActionOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client';
import { NS } from './locales.js';
import { type PanelStore } from './store.js';
export interface PanelFace {
    store: PanelStore;
}
export type FooterActionProps = SidebarFooterActionOwnerProps & PropsLocale<typeof NS> & PanelFace;
export declare function FooterAction({ wide, t, store }: FooterActionProps): JSX.Element;
