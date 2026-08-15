import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import type { PricingPhase, UsageView } from '../contracts.js';
import { NS } from './locales.js';
import type { LoadState } from './store.js';
interface UsageAnalyticsProps extends PropsLocale<typeof NS> {
    state: LoadState<UsageView>;
    selectedMonth: string;
    selectedModel: string;
    selectedPricePhase: PricingPhase | null;
    onMonthChange: (month: string) => void;
    onModelChange: (model: string) => void;
    onPricePhaseChange: (phase: PricingPhase) => void;
    onRetry: () => void;
}
export declare function UsageAnalytics({ state, selectedMonth, selectedModel, selectedPricePhase, onMonthChange, onModelChange, onPricePhaseChange, onRetry, t, }: UsageAnalyticsProps): JSX.Element;
export {};
