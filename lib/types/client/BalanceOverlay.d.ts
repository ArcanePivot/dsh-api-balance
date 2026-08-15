import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import type { PanelFace } from './FooterAction.js';
import { NS } from './locales.js';
export type BalanceOverlayProps = PropsLocale<typeof NS> & PanelFace;
export declare function BalanceOverlay({ t, store }: BalanceOverlayProps): JSX.Element | null;
