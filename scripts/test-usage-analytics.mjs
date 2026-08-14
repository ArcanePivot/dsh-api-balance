import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const host = await readFile(resolve(root, "files/dsh-host-apiproxy/lib/index.js"), "utf8");
const match = host.match(/\/\/#region dsh-api-balance\/usage-analytics\.js\n([\s\S]*?)\/\/#endregion/);
assert.ok(match, "usage analytics source region is present");

const load = new Function(`${match[1]}\nreturn { deepSeekUsageSamples, aggregateDeepSeekUsage };`);
const { deepSeekUsageSamples, aggregateDeepSeekUsage } = load();
const at = (iso) => Date.parse(iso);
const usage = (inputTokens, outputTokens, cacheReadTokens = 0, cacheWriteTokens = 0) => ({
  inputTokens,
  outputTokens,
  cacheReadTokens,
  cacheWriteTokens,
});

const events = [
  {
    type: "request/header",
    seq: 0,
    time: at("2026-08-09T09:00:00Z"),
    data: { header: { config: { provider: "deepseek-official" } } },
  },
  {
    type: "assistant/message",
    seq: 1,
    time: at("2026-08-09T09:00:05Z"),
    data: {
      turn: 0,
      step: 0,
      usage: usage(100, 20),
      message: { source: { kind: "model", provider: "deepseek-official", model: "deepseek-chat" } },
    },
  },
  {
    type: "request/header",
    seq: 2,
    time: at("2026-08-09T23:00:00Z"),
    data: { header: { config: { provider: "deepseek-official" } } },
  },
  {
    type: "assistant/message",
    seq: 3,
    time: at("2026-08-09T23:00:04Z"),
    data: {
      turn: 4,
      step: 0,
      usage: usage(40, 10, 50),
      message: { source: { kind: "model", provider: "deepseek-official", model: "deepseek-chat" } },
    },
  },
  {
    type: "request/header",
    seq: 4,
    time: at("2026-08-10T01:00:00Z"),
    data: { header: { config: { provider: "deepseek-official" } } },
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
      message: { source: { kind: "model", provider: "deepseek-official", model: "deepseek-chat" } },
    },
  },
  {
    type: "request/header",
    seq: 7,
    time: at("2026-08-10T02:00:00Z"),
    data: { header: { config: { provider: "openai" } } },
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
    data: { provider: "deepseek-official", model: "deepseek-reasoner" },
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
  samples.map((sample) => sample.buckets),
  [
    { uncachedInputTokens: 40, outputTokens: 10, cacheReadTokens: 50, cacheWriteTokens: 0, calls: 1 },
    { uncachedInputTokens: 12, outputTokens: 6, cacheReadTokens: 88, cacheWriteTokens: 0, calls: 1 },
    { uncachedInputTokens: 20, outputTokens: 0, cacheReadTokens: 80, cacheWriteTokens: 0, calls: 1 },
  ],
  "final assistant usage replaces the provisional chunk while failed-call chunks survive",
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

const midnight = aggregateDeepSeekUsage(
  [{ time: at("2026-08-31T16:30:00Z"), buckets: { uncachedInputTokens: 1, outputTokens: 1, cacheReadTokens: 0, cacheWriteTokens: 0, calls: 1 } }],
  "2026-09",
  "Asia/Taipei",
  at("2026-09-01T03:00:00Z"),
);
assert.equal(midnight.today, "2026-09-01");
assert.equal(midnight.days[0].totalTokens, 2, "browser time zone owns the day boundary");

const leapMonth = aggregateDeepSeekUsage([], "2028-02", "UTC", at("2028-02-01T00:00:00Z"));
assert.equal(leapMonth.days.length, 29, "selected-month bars follow leap-year calendars");

console.log("Usage aggregation fixtures passed.");
