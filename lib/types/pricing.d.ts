import type { DeepSeekModel, PriceRates, PricingPhase, PricingView, UsageBuckets } from './contracts.js';
export declare const DEEPSEEK_USAGE_PROVIDER = "deepseek-official";
export declare const DEEPSEEK_USAGE_MODELS: readonly ["deepseek-v4-flash", "deepseek-v4-pro"];
export declare const DEEPSEEK_PRICING_SOURCE_URL = "https://api-docs.deepseek.com/zh-cn/quick_start/pricing/";
export declare const DEEPSEEK_PRICING_SOURCE_UPDATED_AT = "2026-08-13";
export declare const DEEPSEEK_PRICING_EFFECTIVE_AT: number;
export declare const DEEPSEEK_PRICING: Record<PricingPhase, Record<DeepSeekModel, PriceRates>>;
export declare function deepSeekPricingPhase(time: number): PricingPhase;
export declare function deepSeekPriceAt(model: string, time: number): {
    phase: PricingPhase;
    rates: PriceRates;
} | undefined;
export declare function priceUsage(model: string, time: number, source: UsageBuckets): UsageBuckets;
export declare function deepSeekPricingView(generatedAt: number): PricingView;
