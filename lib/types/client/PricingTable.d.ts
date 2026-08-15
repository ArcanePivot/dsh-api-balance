import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import type { PricingPhase, PricingView } from '../contracts.js';
import { NS } from './locales.js';
interface PricingTableProps extends PropsLocale<typeof NS> {
    pricing: PricingView;
    selectedModel: string;
    selectedPhase: PricingPhase | null;
    onPhaseChange: (phase: PricingPhase) => void;
}
export declare function PricingTable({ pricing, selectedModel, selectedPhase, onPhaseChange, t, }: PricingTableProps): JSX.Element;
export {};
