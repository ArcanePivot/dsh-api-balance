import type { Context } from '@deepseek-ai/cordis';
import type { UsageCoverage } from './contracts.js';
import { type UsageSample } from './usage.js';
export interface CollectedUsage {
    samples: UsageSample[];
    coverage: UsageCoverage;
}
export interface UsageCollector {
    collect(signal?: AbortSignal): Promise<CollectedUsage>;
    clear(): void;
}
export declare function createUsageCollector(ctx: Context): UsageCollector;
