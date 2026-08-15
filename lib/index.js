//#region src/contracts.ts
const API_BASE_PATH = "/api/api-balance";
const BALANCE_PATH = `${API_BASE_PATH}/balance`;
const USAGE_PATH = `${API_BASE_PATH}/usage`;

//#endregion
//#region src/pricing.ts
const DEEPSEEK_USAGE_PROVIDER = "deepseek-official";
const DEEPSEEK_USAGE_MODELS = ["deepseek-v4-flash", "deepseek-v4-pro"];
const DEEPSEEK_PRICING_SOURCE_URL = "https://api-docs.deepseek.com/zh-cn/quick_start/pricing/";
const DEEPSEEK_PRICING_SOURCE_UPDATED_AT = "2026-08-13";
const DEEPSEEK_PRICING_EFFECTIVE_AT = Date.parse("2026-08-16T16:00:00Z");
const DEEPSEEK_PRICING = {
	legacy: {
		"deepseek-v4-flash": {
			cacheHit: .02,
			cacheMiss: 1,
			output: 2
		},
		"deepseek-v4-pro": {
			cacheHit: .025,
			cacheMiss: 3,
			output: 6
		}
	},
	offPeak: {
		"deepseek-v4-flash": {
			cacheHit: .05,
			cacheMiss: 1.5,
			output: 4.5
		},
		"deepseek-v4-pro": {
			cacheHit: .15,
			cacheMiss: 4.5,
			output: 13.5
		}
	},
	peak: {
		"deepseek-v4-flash": {
			cacheHit: .1,
			cacheMiss: 3,
			output: 9
		},
		"deepseek-v4-pro": {
			cacheHit: .3,
			cacheMiss: 9,
			output: 27
		}
	}
};
function deepSeekPricingPhase(time) {
	if (time < DEEPSEEK_PRICING_EFFECTIVE_AT) return "legacy";
	const hour = new Date(time).getUTCHours();
	return hour >= 1 && hour < 4 || hour >= 6 && hour < 10 ? "peak" : "offPeak";
}
function deepSeekPriceAt(model, time) {
	if (!DEEPSEEK_USAGE_MODELS.includes(model)) return void 0;
	const phase = deepSeekPricingPhase(time);
	return {
		phase,
		rates: DEEPSEEK_PRICING[phase][model]
	};
}
function priceUsage(model, time, source) {
	const result = { ...source };
	const pricing = deepSeekPriceAt(model, time);
	if (pricing === void 0) {
		result.unpricedCalls += source.calls;
		return result;
	}
	const perMillion = 1e6;
	result.cacheHitCostCny = source.cacheReadTokens * pricing.rates.cacheHit / perMillion;
	result.cacheMissCostCny = (source.uncachedInputTokens + source.cacheWriteTokens) * pricing.rates.cacheMiss / perMillion;
	result.outputCostCny = source.outputTokens * pricing.rates.output / perMillion;
	result.estimatedCostCny = result.cacheHitCostCny + result.cacheMissCostCny + result.outputCostCny;
	result.pricedCalls += source.calls;
	return result;
}
function deepSeekPricingView(generatedAt) {
	return {
		currency: "CNY",
		unitTokens: 1e6,
		sourceUrl: DEEPSEEK_PRICING_SOURCE_URL,
		sourceUpdatedAt: DEEPSEEK_PRICING_SOURCE_UPDATED_AT,
		effectiveAt: DEEPSEEK_PRICING_EFFECTIVE_AT,
		timeZone: "Asia/Shanghai",
		currentPhase: deepSeekPricingPhase(generatedAt),
		peakPeriods: [{
			start: "09:00",
			end: "12:00"
		}, {
			start: "14:00",
			end: "18:00"
		}],
		models: DEEPSEEK_USAGE_MODELS.map((model) => ({
			model,
			legacy: DEEPSEEK_PRICING.legacy[model],
			offPeak: DEEPSEEK_PRICING.offPeak[model],
			peak: DEEPSEEK_PRICING.peak[model]
		}))
	};
}

//#endregion
//#region src/usage.ts
function emptyUsageBuckets() {
	return {
		uncachedInputTokens: 0,
		outputTokens: 0,
		cacheReadTokens: 0,
		cacheWriteTokens: 0,
		calls: 0,
		cacheHitCostCny: 0,
		cacheMissCostCny: 0,
		outputCostCny: 0,
		estimatedCostCny: 0,
		pricedCalls: 0,
		unpricedCalls: 0
	};
}
function tokenCount(value) {
	return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : 0;
}
function usageBucketsFrom(usage) {
	return {
		...emptyUsageBuckets(),
		uncachedInputTokens: tokenCount(usage?.inputTokens),
		outputTokens: tokenCount(usage?.outputTokens),
		cacheReadTokens: tokenCount(usage?.cacheReadTokens),
		cacheWriteTokens: tokenCount(usage?.cacheWriteTokens),
		calls: 1
	};
}
function addUsageBuckets(target, source) {
	target.uncachedInputTokens += source.uncachedInputTokens;
	target.outputTokens += source.outputTokens;
	target.cacheReadTokens += source.cacheReadTokens;
	target.cacheWriteTokens += source.cacheWriteTokens;
	target.calls += source.calls;
	target.cacheHitCostCny += source.cacheHitCostCny;
	target.cacheMissCostCny += source.cacheMissCostCny;
	target.outputCostCny += source.outputCostCny;
	target.estimatedCostCny += source.estimatedCostCny;
	target.pricedCalls += source.pricedCalls;
	target.unpricedCalls += source.unpricedCalls;
	return target;
}
function money(value) {
	return Number(value.toFixed(12));
}
function usageBucketsView(buckets) {
	const promptTokens = buckets.uncachedInputTokens + buckets.cacheReadTokens + buckets.cacheWriteTokens;
	return {
		...buckets,
		cacheHitCostCny: money(buckets.cacheHitCostCny),
		cacheMissCostCny: money(buckets.cacheMissCostCny),
		outputCostCny: money(buckets.outputCostCny),
		estimatedCostCny: money(buckets.estimatedCostCny),
		totalTokens: promptTokens + buckets.outputTokens,
		cacheHitRate: promptTokens === 0 ? null : buckets.cacheReadTokens / promptTokens
	};
}
function deepSeekUsageSamples(meta, events, provider = DEEPSEEK_USAGE_PROVIDER) {
	const inheritedLength = Number.isSafeInteger(meta.seedLength) && Number(meta.seedLength) > 0 ? Number(meta.seedLength) : 0;
	const samples = /* @__PURE__ */ new Map();
	let currentProvider;
	let currentModel;
	for (const event of events) {
		if (event.type === "request/header") {
			const configuredProvider = event.data?.header?.config?.provider;
			const configuredModel = event.data?.header?.config?.model;
			if (typeof configuredProvider === "string" && configuredProvider.length > 0) currentProvider = configuredProvider;
			if (typeof configuredModel === "string" && configuredModel.length > 0) currentModel = configuredModel;
		} else if (event.type === "request/context") {
			const configuredProvider = event.data?.provider;
			const configuredModel = event.data?.model;
			if (typeof configuredProvider === "string" && configuredProvider.length > 0) currentProvider = configuredProvider;
			if (typeof configuredModel === "string" && configuredModel.length > 0) currentModel = configuredModel;
		}
		let turn;
		let step;
		let usage;
		let sampleProvider = currentProvider;
		let sampleModel = currentModel;
		if (event.type === "assistant/chunk" && event.data?.chunk?.type === "usage") {
			turn = event.data.turn;
			step = event.data.step;
			usage = event.data.chunk.usage;
		} else if (event.type === "assistant/message" && event.data?.usage !== void 0) {
			turn = event.data.turn;
			step = event.data.step;
			usage = event.data.usage;
			const messageProvider = event.data.message?.source?.provider;
			const messageModel = event.data.message?.source?.model;
			if (typeof messageProvider === "string" && messageProvider.length > 0) sampleProvider = messageProvider;
			if (typeof messageModel === "string" && messageModel.length > 0) sampleModel = messageModel;
		}
		if (usage === void 0 || !Number.isSafeInteger(turn) || !Number.isSafeInteger(step)) continue;
		if (!Number.isSafeInteger(event.seq) || !Number.isFinite(event.time)) continue;
		samples.set(`${String(turn)}:${String(step)}`, {
			seq: event.seq,
			time: event.time,
			provider: sampleProvider,
			model: typeof sampleModel === "string" && sampleModel.length > 0 ? sampleModel : "unknown",
			buckets: usageBucketsFrom(usage)
		});
	}
	return [...samples.values()].filter((sample) => sample.seq >= inheritedLength && sample.provider === provider);
}
function usageDateKey(time, formatter) {
	const values = {};
	for (const part of formatter.formatToParts(new Date(time))) if (part.type === "year" || part.type === "month" || part.type === "day") values[part.type] = part.value;
	if (values.year === void 0 || values.month === void 0 || values.day === void 0) throw new Error("unable to format usage date");
	return `${values.year}-${values.month}-${values.day}`;
}
function usageMonthDayCount(month) {
	if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new TypeError(`invalid usage month: ${month}`);
	const [year, number] = month.split("-").map(Number);
	const date = /* @__PURE__ */ new Date(0);
	date.setUTCHours(0, 0, 0, 0);
	date.setUTCFullYear(year, number, 0);
	return date.getUTCDate();
}
function usageWeekStart(dateKey) {
	const date = /* @__PURE__ */ new Date(`${dateKey}T00:00:00Z`);
	const daysSinceMonday = (date.getUTCDay() + 6) % 7;
	date.setUTCDate(date.getUTCDate() - daysSinceMonday);
	return date.toISOString().slice(0, 10);
}
function validateTimeZone(timeZone) {
	if (timeZone.length === 0 || timeZone.length > 80) throw new TypeError("invalid time zone");
	new Intl.DateTimeFormat("en-CA", { timeZone }).format();
	return timeZone;
}
function aggregateUsageSeries(samples, selectedMonth, timeZone, generatedAt) {
	usageMonthDayCount(selectedMonth);
	validateTimeZone(timeZone);
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	});
	const todayKey = usageDateKey(generatedAt, formatter);
	const currentMonth$1 = todayKey.slice(0, 7);
	const currentWeekStart = usageWeekStart(todayKey);
	const today = emptyUsageBuckets();
	const week = emptyUsageBuckets();
	const month = emptyUsageBuckets();
	const allTime = emptyUsageBuckets();
	const selectedMonthTotal = emptyUsageBuckets();
	const days = Array.from({ length: usageMonthDayCount(selectedMonth) }, (_, index) => ({
		date: `${selectedMonth}-${String(index + 1).padStart(2, "0")}`,
		...emptyUsageBuckets()
	}));
	for (const sample of samples) {
		const key = usageDateKey(sample.time, formatter);
		const buckets = priceUsage(sample.model, sample.time, sample.buckets);
		addUsageBuckets(allTime, buckets);
		if (key === todayKey) addUsageBuckets(today, buckets);
		if (key >= currentWeekStart && key <= todayKey) addUsageBuckets(week, buckets);
		if (key.startsWith(`${currentMonth$1}-`)) addUsageBuckets(month, buckets);
		if (key.startsWith(`${selectedMonth}-`)) {
			addUsageBuckets(selectedMonthTotal, buckets);
			const target = days[Number(key.slice(-2)) - 1];
			if (target !== void 0) addUsageBuckets(target, buckets);
		}
	}
	return {
		today: todayKey,
		currentWeekStart,
		currentMonth: currentMonth$1,
		selectedMonth,
		totals: {
			today: usageBucketsView(today),
			week: usageBucketsView(week),
			month: usageBucketsView(month),
			allTime: usageBucketsView(allTime),
			selectedMonth: usageBucketsView(selectedMonthTotal)
		},
		days: days.map((day) => ({
			date: day.date,
			...usageBucketsView(day)
		}))
	};
}
function aggregateDeepSeekUsage(samples, selectedMonth, timeZone, generatedAt = Date.now()) {
	const overall = aggregateUsageSeries(samples, selectedMonth, timeZone, generatedAt);
	const extraModels = [...new Set(samples.map((sample) => sample.model).filter((model) => !DEEPSEEK_USAGE_MODELS.includes(model)))].sort();
	const modelNames = [...DEEPSEEK_USAGE_MODELS, ...extraModels];
	return {
		provider: DEEPSEEK_USAGE_PROVIDER,
		source: "local-retained-sessions",
		timeZone,
		generatedAt,
		...overall,
		models: modelNames.map((model) => ({
			model,
			...aggregateUsageSeries(samples.filter((sample) => sample.model === model), selectedMonth, timeZone, generatedAt)
		})),
		pricing: deepSeekPricingView(generatedAt)
	};
}

//#endregion
//#region src/collector.ts
function asEvents(events) {
	return events;
}
function throwIfAborted(signal) {
	signal?.throwIfAborted();
}
function createUsageCollector(ctx) {
	const cache = /* @__PURE__ */ new Map();
	return {
		async collect(signal) {
			throwIfAborted(signal);
			const live = new Map(ctx.sessions.list().map((session) => [String(session.id), session]));
			const persistence = ctx.get("sessionPersistence");
			const snapshots = persistence === void 0 ? [] : await persistence.listSnapshots(signal);
			throwIfAborted(signal);
			const seen = /* @__PURE__ */ new Set();
			const samples = [];
			let failedSessions = 0;
			const useFold = (id, version, meta, events) => {
				seen.add(id);
				const cached = cache.get(id);
				if (cached?.version === version) {
					samples.push(...cached.samples);
					return;
				}
				const folded = deepSeekUsageSamples(meta, asEvents(events));
				cache.set(id, {
					version,
					samples: folded
				});
				samples.push(...folded);
			};
			const cold = [];
			for (const snapshot of snapshots) {
				const id = String(snapshot.header.id);
				const session = live.get(id);
				if (session !== void 0) {
					live.delete(id);
					try {
						useFold(id, `live:${session.seq}`, session.header, session.events);
					} catch (error) {
						seen.add(id);
						failedSessions += 1;
						ctx.logger.warn(`api-balance: live session "${id}" could not be folded: ${String(error)}`);
					}
					continue;
				}
				seen.add(id);
				const version = `stored:${String(snapshot.revision)}`;
				const cached = cache.get(id);
				if (cached?.version === version) samples.push(...cached.samples);
				else cold.push({
					id,
					version,
					header: snapshot.header
				});
			}
			for (const [id, session] of live) try {
				useFold(id, `live:${session.seq}`, session.header, session.events);
			} catch (error) {
				seen.add(id);
				failedSessions += 1;
				ctx.logger.warn(`api-balance: live session "${id}" could not be folded: ${String(error)}`);
			}
			if (persistence !== void 0) for (let offset = 0; offset < cold.length; offset += 4) {
				throwIfAborted(signal);
				const batch = cold.slice(offset, offset + 4);
				const settled = await Promise.allSettled(batch.map(async (item) => ({
					item,
					stored: await persistence.readFrom(item.header.id, 0, signal)
				})));
				throwIfAborted(signal);
				settled.forEach((result, index) => {
					const item = batch[index];
					if (item === void 0) return;
					if (result.status === "fulfilled") try {
						useFold(item.id, item.version, result.value.stored.meta, result.value.stored.events);
					} catch (error) {
						failedSessions += 1;
						ctx.logger.warn(`api-balance: stored session "${item.id}" could not be folded: ${String(error)}`);
					}
					else {
						failedSessions += 1;
						ctx.logger.warn(`api-balance: stored session "${item.id}" could not be read: ${String(result.reason)}`);
					}
				});
			}
			for (const id of cache.keys()) if (!seen.has(id)) cache.delete(id);
			return {
				samples,
				coverage: {
					sessions: seen.size,
					failedSessions,
					durable: persistence !== void 0
				}
			};
		},
		clear() {
			cache.clear();
		}
	};
}

//#endregion
//#region src/balance.ts
const PROVIDER = "deepseek-official";
const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_API_KEY_ENV = "DEEPSEEK_API_KEY";
const CREDENTIAL_REF_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
function normalizedBaseURL(value) {
	const url = new URL(value);
	if (url.protocol !== "https:" && url.protocol !== "http:") throw new TypeError("DeepSeek base URL must use HTTP or HTTPS");
	return url.toString().replace(/\/+$/, "");
}
function failure(baseURL, code, message) {
	return {
		ok: false,
		provider: PROVIDER,
		baseURL,
		checkedAt: Date.now(),
		code,
		message
	};
}
async function readDeepSeekBalance(ctx, signal, fetcher = globalThis.fetch) {
	let configuredBaseURL;
	let apiKeyEnv = DEFAULT_API_KEY_ENV;
	const settings = ctx.get("settings");
	if (settings !== void 0) try {
		const value = settings.describe({ redactSecrets: true }).find((candidate) => String(candidate.ns) === "llm-deepseek")?.value;
		if (typeof value?.baseURL === "string" && value.baseURL.trim().length > 0) configuredBaseURL = value.baseURL.trim();
		if (typeof value?.apiKeyEnv === "string" && value.apiKeyEnv.trim().length > 0) apiKeyEnv = value.apiKeyEnv.trim();
	} catch {}
	let baseURL;
	try {
		baseURL = normalizedBaseURL(configuredBaseURL ?? process.env.DEEPSEEK_BASE_URL ?? DEFAULT_BASE_URL);
	} catch (error) {
		return failure(DEFAULT_BASE_URL, "upstream", error instanceof Error ? error.message : String(error));
	}
	if (!CREDENTIAL_REF_PATTERN.test(apiKeyEnv)) return failure(baseURL, "missing-credential", `Invalid DeepSeek credential reference: ${apiKeyEnv}`);
	let apiKey;
	const credentials = ctx.get("credentials");
	if (credentials !== void 0) {
		const hit = await credentials.resolve(apiKeyEnv);
		if (hit !== void 0) apiKey = hit.value;
	} else {
		const ambient = process.env[apiKeyEnv];
		if (typeof ambient === "string" && ambient.length > 0) apiKey = ambient;
	}
	if (apiKey === void 0 || apiKey.length === 0) return failure(baseURL, "missing-credential", `DeepSeek API key is not configured (${apiKeyEnv})`);
	let callerAborted = signal?.aborted === true;
	if (callerAborted) return failure(baseURL, "cancelled", "Balance check was cancelled");
	const controller = new AbortController();
	const abortFromCaller = () => {
		callerAborted = true;
		controller.abort(signal?.reason);
	};
	signal?.addEventListener("abort", abortFromCaller, { once: true });
	const timeout = setTimeout(() => controller.abort(/* @__PURE__ */ new Error("timeout")), 1e4);
	try {
		const response = await fetcher(`${baseURL}/user/balance`, {
			headers: { authorization: `Bearer ${apiKey}` },
			signal: controller.signal
		});
		if (!response.ok) return failure(baseURL, "upstream", `DeepSeek balance API returned HTTP ${response.status}`);
		const payload = await response.json();
		const infos = Array.isArray(payload.balance_infos) ? payload.balance_infos.map((info) => ({
			currency: String(info.currency ?? ""),
			totalBalance: String(info.total_balance ?? ""),
			grantedBalance: String(info.granted_balance ?? ""),
			toppedUpBalance: String(info.topped_up_balance ?? "")
		})) : [];
		return {
			ok: true,
			provider: PROVIDER,
			baseURL,
			checkedAt: Date.now(),
			isAvailable: payload.is_available === true,
			infos
		};
	} catch (error) {
		if (callerAborted) return failure(baseURL, "cancelled", "Balance check was cancelled");
		if (controller.signal.aborted) return failure(baseURL, "timeout", "DeepSeek balance request timed out after 10 seconds");
		return failure(baseURL, "upstream", error instanceof Error ? error.message : String(error));
	} finally {
		clearTimeout(timeout);
		signal?.removeEventListener("abort", abortFromCaller);
	}
}

//#endregion
//#region src/http.ts
function sendJson(res, status, value) {
	if (res.destroyed || res.writableEnded) return;
	const body = JSON.stringify(value);
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"content-length": Buffer.byteLength(body),
		"cache-control": "no-store",
		"x-content-type-options": "nosniff"
	});
	res.end(body);
}
function apiError(res, status, code, message) {
	sendJson(res, status, {
		ok: false,
		code,
		message
	});
}
function acceptsRequest(req, res) {
	if (req.method !== "GET") {
		res.setHeader("allow", "GET");
		apiError(res, 405, "method-not-allowed", "Only GET is allowed");
		return false;
	}
	const origin = req.headers.origin;
	if (origin !== void 0) try {
		const originHost = new URL(origin).host;
		if (req.headers.host === void 0 || originHost !== req.headers.host) {
			apiError(res, 403, "forbidden", "Cross-origin requests are not allowed");
			return false;
		}
	} catch {
		apiError(res, 403, "forbidden", "Invalid request origin");
		return false;
	}
	return true;
}
async function withRequestSignal(req, res, operation) {
	const controller = new AbortController();
	const abort = () => controller.abort(/* @__PURE__ */ new Error("HTTP client disconnected"));
	const abortOnClose = () => {
		if (!res.writableEnded) abort();
	};
	req.once("aborted", abort);
	res.once("close", abortOnClose);
	try {
		return await operation(controller.signal);
	} finally {
		req.removeListener("aborted", abort);
		res.removeListener("close", abortOnClose);
	}
}
function currentMonth(timeZone, now) {
	return usageDateKey(now, new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	})).slice(0, 7);
}
function createApiHandlers(ctx, collector) {
	return {
		async balance(req, res) {
			if (!acceptsRequest(req, res)) return;
			try {
				sendJson(res, 200, await withRequestSignal(req, res, (signal) => readDeepSeekBalance(ctx, signal)));
			} catch (error) {
				ctx.logger.warn(`api-balance: balance route failed: ${String(error)}`);
				apiError(res, 500, "internal", "Unable to read DeepSeek balance");
			}
		},
		async usage(req, res) {
			if (!acceptsRequest(req, res)) return;
			try {
				const url = new URL(req.url ?? USAGE_PATH, "http://dsh.local");
				const timeZone = validateTimeZone(url.searchParams.get("timeZone") ?? "UTC");
				const generatedAt = Date.now();
				const selectedMonth = url.searchParams.get("month") ?? currentMonth(timeZone, generatedAt);
				if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(selectedMonth)) {
					apiError(res, 400, "bad-request", "month must use YYYY-MM");
					return;
				}
				const collected = await withRequestSignal(req, res, (signal) => collector.collect(signal));
				sendJson(res, 200, {
					...aggregateDeepSeekUsage(collected.samples, selectedMonth, timeZone, generatedAt),
					coverage: collected.coverage
				});
			} catch (error) {
				if (error instanceof RangeError || error instanceof TypeError) {
					apiError(res, 400, "bad-request", error.message);
					return;
				}
				ctx.logger.warn(`api-balance: usage route failed: ${String(error)}`);
				apiError(res, 500, "internal", "Unable to summarize local DeepSeek usage");
			}
		}
	};
}

//#endregion
//#region src/index.ts
const inject = ["webServer", "sessions"];
function apply(ctx) {
	const collector = createUsageCollector(ctx);
	const handlers = createApiHandlers(ctx, collector);
	ctx.effect(function* () {
		yield ctx.webServer.register({
			kind: "exact",
			path: BALANCE_PATH,
			handler: handlers.balance
		});
		yield ctx.webServer.register({
			kind: "exact",
			path: USAGE_PATH,
			handler: handlers.usage
		});
		yield () => collector.clear();
	}, "api-balance: native routes");
}

//#endregion
export { API_BASE_PATH, BALANCE_PATH, DEEPSEEK_PRICING, DEEPSEEK_PRICING_EFFECTIVE_AT, DEEPSEEK_PRICING_SOURCE_UPDATED_AT, DEEPSEEK_PRICING_SOURCE_URL, DEEPSEEK_USAGE_MODELS, DEEPSEEK_USAGE_PROVIDER, USAGE_PATH, addUsageBuckets, aggregateDeepSeekUsage, aggregateUsageSeries, apply, deepSeekPriceAt, deepSeekPricingPhase, deepSeekPricingView, deepSeekUsageSamples, emptyUsageBuckets, inject, priceUsage, usageBucketsFrom, usageBucketsView, usageDateKey, usageMonthDayCount, usageWeekStart, validateTimeZone };