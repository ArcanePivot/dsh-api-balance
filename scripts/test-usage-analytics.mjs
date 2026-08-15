import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const host = await readFile(resolve(root, "files/dsh-host-apiproxy/lib/index.js"), "utf8");
const sidebar = await readFile(resolve(root, "files/dsh-client-ui-sidebar/lib/client.js"), "utf8");
const match = host.match(/\/\/#region dsh-api-balance\/usage-analytics\.js\n([\s\S]*?)\/\/#endregion/);
assert.ok(match, "usage analytics source region is present");

const load = new Function(`${match[1]}\nreturn { deepSeekUsageSamples, aggregateDeepSeekUsage, deepSeekPricingPhase, deepSeekPriceAt };`);
const { deepSeekUsageSamples, aggregateDeepSeekUsage, deepSeekPricingPhase, deepSeekPriceAt } = load();
const at = (iso) => Date.parse(iso);
const usage = (inputTokens, outputTokens, cacheReadTokens = 0, cacheWriteTokens = 0) => ({
  inputTokens,
  outputTokens,
  cacheReadTokens,
  cacheWriteTokens,
});
const bucket = (uncachedInputTokens, outputTokens, cacheReadTokens = 0, cacheWriteTokens = 0) => ({
  uncachedInputTokens,
  outputTokens,
  cacheReadTokens,
  cacheWriteTokens,
  calls: 1,
});

const events = [
  {
    type: "request/header",
    seq: 0,
    time: at("2026-08-09T09:00:00Z"),
    data: { header: { config: { provider: "deepseek-official", model: "deepseek-v4-flash" } } },
  },
  {
    type: "assistant/message",
    seq: 1,
    time: at("2026-08-09T09:00:05Z"),
    data: {
      turn: 0,
      step: 0,
      usage: usage(100, 20),
      message: { source: { kind: "model", provider: "deepseek-official", model: "deepseek-v4-flash" } },
    },
  },
  {
    type: "request/header",
    seq: 2,
    time: at("2026-08-09T23:00:00Z"),
    data: { header: { config: { provider: "deepseek-official", model: "deepseek-v4-flash" } } },
  },
  {
    type: "assistant/message",
    seq: 3,
    time: at("2026-08-09T23:00:04Z"),
    data: {
      turn: 4,
      step: 0,
      usage: usage(40, 10, 50),
      message: { source: { kind: "model", provider: "deepseek-official", model: "deepseek-v4-flash" } },
    },
  },
  {
    type: "request/header",
    seq: 4,
    time: at("2026-08-10T01:00:00Z"),
    data: { header: { config: { provider: "deepseek-official", model: "deepseek-v4-flash" } } },
  },
  {
    type: "assistant/chunk",
    seq: 5,
    time: at("2026-08-10T01:00:03Z"),
    data: { turn: 1, step: 0, chunk: { type: "usage", usage: usage(10, 5, 90) } },
  },
  {
    type: "assistant/message",
    seq: 6,
    time: at("2026-08-10T01:00:04Z"),
    data: {
      turn: 1,
      step: 0,
      usage: usage(12, 6, 88),
      message: { source: { kind: "model", provider: "deepseek-official", model: "deepseek-v4-flash" } },
    },
  },
  {
    type: "request/header",
    seq: 7,
    time: at("2026-08-10T02:00:00Z"),
    data: { header: { config: { provider: "openai", model: "gpt-test" } } },
  },
  {
    type: "assistant/message",
    seq: 8,
    time: at("2026-08-10T02:00:04Z"),
    data: {
      turn: 2,
      step: 0,
      usage: usage(1_000, 1_000),
      message: { source: { kind: "model", provider: "openai", model: "gpt-test" } },
    },
  },
  {
    type: "request/context",
    seq: 9,
    time: at("2026-08-11T04:00:00Z"),
    data: { provider: "deepseek-official", model: "deepseek-v4-pro" },
  },
  {
    type: "assistant/chunk",
    seq: 10,
    time: at("2026-08-11T04:00:06Z"),
    data: { turn: 3, step: 0, chunk: { type: "usage", usage: usage(20, 0, 80) } },
  },
];

const samples = deepSeekUsageSamples({ seedLength: 2 }, events);
assert.equal(samples.length, 3, "fork prefix and other providers are excluded");
assert.deepEqual(
  samples.map((sample) => ({ model: sample.model, buckets: sample.buckets })),
  [
    { model: "deepseek-v4-flash", buckets: bucket(40, 10, 50) },
    { model: "deepseek-v4-flash", buckets: bucket(12, 6, 88) },
    { model: "deepseek-v4-pro", buckets: bucket(20, 0, 80) },
  ],
  "the final message replaces its usage chunk and each sample keeps its actual model",
);

const result = aggregateDeepSeekUsage(samples, "2026-08", "UTC", at("2026-08-11T12:00:00Z"));
assert.equal(result.currentWeekStart, "2026-08-10");
assert.equal(result.totals.today.totalTokens, 100);
assert.equal(result.totals.week.totalTokens, 206);
assert.equal(result.totals.month.totalTokens, 306);
assert.equal(result.totals.allTime.totalTokens, 306);
assert.equal(result.totals.allTime.calls, 3);
assert.equal(result.days[8].totalTokens, 100, "Sunday remains in month/all-time but not the Monday-based current week");
assert.equal(result.days[9].totalTokens, 106);
assert.equal(result.days[10].totalTokens, 100);
assert.equal(result.totals.today.cacheHitRate, 0.8);
assert.equal(result.models.find((item) => item.model === "deepseek-v4-flash").totals.allTime.totalTokens, 206);
assert.equal(result.models.find((item) => item.model === "deepseek-v4-pro").totals.allTime.totalTokens, 100);
assert.ok(Math.abs(result.totals.allTime.estimatedCostCny - 0.00014876) < 1e-12, "legacy CNY rates price each model separately");
assert.equal(result.totals.allTime.pricedCalls, 3);
assert.equal(result.totals.allTime.unpricedCalls, 0);

assert.equal(deepSeekPricingPhase(at("2026-08-16T15:59:59.999Z")), "legacy");
assert.equal(deepSeekPricingPhase(at("2026-08-16T16:00:00Z")), "offPeak", "new pricing starts at Beijing midnight");
assert.equal(deepSeekPricingPhase(at("2026-08-17T01:00:00Z")), "peak");
assert.equal(deepSeekPricingPhase(at("2026-08-17T04:00:00Z")), "offPeak");
assert.equal(deepSeekPricingPhase(at("2026-08-17T06:00:00Z")), "peak");
assert.equal(deepSeekPricingPhase(at("2026-08-17T10:00:00Z")), "offPeak");
assert.deepEqual(deepSeekPriceAt("deepseek-v4-pro", at("2026-08-17T01:00:00Z")), {
  phase: "peak",
  rates: { cacheHit: 0.3, cacheMiss: 9, output: 27 },
});

const peak = aggregateDeepSeekUsage(
  [{ time: at("2026-08-17T01:30:00Z"), model: "deepseek-v4-pro", buckets: bucket(0, 1_000_000) }],
  "2026-08",
  "Asia/Shanghai",
  at("2026-08-17T02:00:00Z"),
);
assert.equal(peak.totals.today.estimatedCostCny, 27, "peak Pro output uses the announced CNY price");
assert.equal(peak.pricing.currentPhase, "peak");
assert.equal(peak.pricing.effectiveAt, at("2026-08-16T16:00:00Z"));

const midnight = aggregateDeepSeekUsage(
  [{ time: at("2026-08-31T16:30:00Z"), model: "deepseek-v4-flash", buckets: bucket(1, 1) }],
  "2026-09",
  "Asia/Taipei",
  at("2026-09-01T03:00:00Z"),
);
assert.equal(midnight.today, "2026-09-01");
assert.equal(midnight.days[0].totalTokens, 2, "browser time zone owns the day boundary");

const unpriced = aggregateDeepSeekUsage(
  [{ time: at("2026-08-15T00:00:00Z"), model: "unknown-model", buckets: bucket(10, 5) }],
  "2026-08",
  "UTC",
  at("2026-08-15T01:00:00Z"),
);
assert.equal(unpriced.totals.allTime.estimatedCostCny, 0);
assert.equal(unpriced.totals.allTime.unpricedCalls, 1, "unknown models remain visible without fabricated cost");

const leapMonth = aggregateDeepSeekUsage([], "2028-02", "UTC", at("2028-02-01T00:00:00Z"));
assert.equal(leapMonth.days.length, 29, "selected-month bars follow leap-year calendars");
assert.deepEqual(leapMonth.models.map((item) => item.model), ["deepseek-v4-flash", "deepseek-v4-pro"], "both official models remain selectable at zero usage");

assert.match(sidebar, /if \(!wide\) return;\n\s+let current = true;\n\s+const controller = new AbortController\(\);\n\s+setUsageState\(\{ status: "loading" \}\);/, "sidebar usage loads without waiting for the detail popover");
assert.match(sidebar, /const label = `\$\{balanceLabel\} · \$\{t\("usage\.todaySpent"\)\} \$\{todayCost\}`;/, "sidebar footer combines balance and today's estimated spend");
assert.match(sidebar, /"usage\.todaySpent": "今日使用"/, "Chinese footer copy is present");
assert.match(sidebar, /"usage\.todaySpent": "Today"/, "English footer copy is present");

console.log("Model usage and official pricing fixtures passed.");
