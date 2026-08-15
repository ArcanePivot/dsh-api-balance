import type { Context } from '@deepseek-ai/cordis';
import type { BalanceView } from './contracts.js';
export declare function readDeepSeekBalance(ctx: Context, signal?: AbortSignal, fetcher?: typeof fetch): Promise<BalanceView>;
