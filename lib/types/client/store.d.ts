import { type BalanceView, type PricingPhase, type UsageView } from '../contracts.js';
export type LoadState<T> = {
    status: 'loading';
} | {
    status: 'ready';
    value: T;
} | {
    status: 'error';
    message: string;
};
export interface AnchorRect {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
export interface PanelSnapshot {
    open: boolean;
    anchor: AnchorRect | null;
    refreshing: boolean;
    selectedMonth: string;
    selectedModel: 'all' | string;
    selectedPricePhase: PricingPhase | null;
    balance: LoadState<BalanceView>;
    usage: LoadState<UsageView>;
}
export declare class PanelStore {
    private snapshot;
    private readonly listeners;
    private balanceController;
    private usageController;
    private refreshGeneration;
    private disposed;
    readonly getSnapshot: () => PanelSnapshot;
    readonly subscribe: (listener: () => void) => (() => void);
    private update;
    openAt(rect: DOMRect): void;
    close(): void;
    setSelectedModel(model: string): void;
    setSelectedPricePhase(phase: PricingPhase): void;
    setSelectedMonth(month: string): void;
    refresh(): Promise<void>;
    private loadBalance;
    private loadUsage;
    dispose(): void;
}
export declare function usePanelSnapshot(store: PanelStore): PanelSnapshot;
