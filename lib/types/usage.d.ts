import type { UsageBuckets, UsageBucketsView, UsageSeriesView, UsageView } from './contracts.js';
export interface SessionHeaderLike {
    seedLength?: number;
}
export interface SessionEventLike {
    type: string;
    seq: number;
    time: number;
    data?: Record<string, any>;
}
export interface UsageSample {
    seq: number;
    time: number;
    provider: string | undefined;
    model: string;
    buckets: UsageBuckets;
}
export declare function emptyUsageBuckets(): UsageBuckets;
export declare function usageBucketsFrom(usage: Record<string, unknown> | undefined): UsageBuckets;
export declare function addUsageBuckets(target: UsageBuckets, source: UsageBuckets): UsageBuckets;
export declare function usageBucketsView(buckets: UsageBuckets): UsageBucketsView;
export declare function deepSeekUsageSamples(meta: SessionHeaderLike, events: readonly SessionEventLike[], provider?: string): UsageSample[];
export declare function usageDateKey(time: number, formatter: Intl.DateTimeFormat): string;
export declare function usageMonthDayCount(month: string): number;
export declare function usageWeekStart(dateKey: string): string;
export declare function validateTimeZone(timeZone: string): string;
export declare function aggregateUsageSeries(samples: readonly UsageSample[], selectedMonth: string, timeZone: string, generatedAt: number): UsageSeriesView;
export declare function aggregateDeepSeekUsage(samples: readonly UsageSample[], selectedMonth: string, timeZone: string, generatedAt?: number): Omit<UsageView, 'coverage'>;
