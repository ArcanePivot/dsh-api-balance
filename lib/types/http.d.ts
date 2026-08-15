import type { Context } from '@deepseek-ai/cordis';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { UsageCollector } from './collector.js';
export interface ApiHandlers {
    balance(req: IncomingMessage, res: ServerResponse): Promise<void>;
    usage(req: IncomingMessage, res: ServerResponse): Promise<void>;
}
export declare function createApiHandlers(ctx: Context, collector: UsageCollector): ApiHandlers;
export declare const API_ROUTES: readonly ["/api/api-balance/balance", "/api/api-balance/usage"];
