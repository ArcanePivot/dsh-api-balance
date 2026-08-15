window.__ModuleLoader__.load({ id: "@arcanepivot/dsh-api-balance", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let react = require("react");
react = __toESM(react);
let __deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
__deepseek_ai_dsh_client_ui_primitives = __toESM(__deepseek_ai_dsh_client_ui_primitives);
let react_jsx_runtime = require("react/jsx-runtime");
react_jsx_runtime = __toESM(react_jsx_runtime);

//#region src/client/format.ts
function currentMonthKey() {
	const now = /* @__PURE__ */ new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
function shiftMonthKey(month, delta) {
	const [year, number] = month.split("-").map(Number);
	const shifted = new Date(year, number - 1 + delta, 1, 12);
	return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}`;
}
function formatMonthName(month) {
	const [year, number] = month.split("-").map(Number);
	return new Intl.DateTimeFormat(void 0, {
		year: "numeric",
		month: "long"
	}).format(new Date(year, number - 1, 1, 12));
}
function formatTokenCount(value) {
	const compact = (divisor, suffix) => `${Number((value / divisor).toFixed(value >= divisor * 10 ? 1 : 2))}${suffix}`;
	if (value >= 1e9) return compact(1e9, "B");
	if (value >= 1e6) return compact(1e6, "M");
	if (value >= 1e3) return compact(1e3, "K");
	return value.toLocaleString();
}
function formatEstimatedCost(value) {
	const digits = value > 0 && value < .01 ? 4 : 2;
	return new Intl.NumberFormat(void 0, {
		style: "currency",
		currency: "CNY",
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	}).format(value);
}
function formatAmount(currency, amount) {
	return `${currency === "CNY" ? "¥" : `${currency} `}${amount}`;
}

//#endregion
//#region src/client/locales.ts
const NS = "api-balance";
const zh = {
	"balance.title": "API $$",
	"balance.shortLabel": "API 余额",
	"balance.loading": "余额…",
	"balance.unavailable": "余额不可用",
	"balance.granted": "赠送",
	"balance.toppedUp": "充值",
	"balance.close": "关闭",
	"balance.refresh": "刷新",
	"balance.retryAction": "重试",
	"balance.availableShort": "可用",
	"balance.notAvailableShort": "不可用",
	"balance.updatedAt": "更新时间",
	"balance.low": "余额偏低，建议及时充值",
	"balance.detailHint": "DeepSeek 账户余额与本机 DSH 用量",
	"usage.title": "Token 用量",
	"usage.model.select": "选择模型",
	"usage.model.all": "全部",
	"usage.model.flash": "V4 Flash",
	"usage.model.pro": "V4 Pro",
	"usage.loading": "正在汇总本机用量…",
	"usage.today": "今日",
	"usage.todaySpent": "今日使用",
	"usage.week": "本周",
	"usage.month": "本月",
	"usage.allTime": "累计",
	"usage.cacheHit": "今日缓存命中率",
	"usage.daily": "每日用量",
	"usage.previousMonth": "上个月",
	"usage.nextMonth": "下个月",
	"usage.empty": "本月暂无记录",
	"usage.tokens": "Token",
	"usage.calls": "次调用",
	"usage.coverage": "本机保留会话",
	"usage.skipped": "个未纳入",
	"usage.scopeHint": "仅统计本机保留的 DSH 会话；不包含已删除日志或其他客户端的 API 调用。",
	"pricing.title": "DeepSeek 官方模型价格",
	"pricing.current": "当前：",
	"pricing.select": "选择价格时段",
	"pricing.phase.legacy": "生效前",
	"pricing.phase.offPeak": "空闲",
	"pricing.phase.peak": "高峰",
	"pricing.model": "模型",
	"pricing.cacheHit": "命中输入",
	"pricing.cacheMiss": "未命中",
	"pricing.output": "输出",
	"pricing.unit": "人民币 / 百万 Token",
	"pricing.peakHours": "北京时间高峰",
	"pricing.offPeakRest": "其余为空闲时段",
	"pricing.effectiveAt": "峰谷价生效：",
	"pricing.estimateHint": "费用按实际调用时刻估算，账单以官方为准",
	"pricing.source": "官方价格页"
};
const en = {
	"balance.title": "API $$",
	"balance.shortLabel": "API Balance",
	"balance.loading": "Balance…",
	"balance.unavailable": "Balance unavailable",
	"balance.granted": "Granted",
	"balance.toppedUp": "Topped up",
	"balance.close": "Close",
	"balance.refresh": "Refresh",
	"balance.retryAction": "Retry",
	"balance.availableShort": "Available",
	"balance.notAvailableShort": "Unavailable",
	"balance.updatedAt": "Updated",
	"balance.low": "Balance is low, consider topping up",
	"balance.detailHint": "DeepSeek account balance and local DSH usage",
	"usage.title": "Token usage",
	"usage.model.select": "Select model",
	"usage.model.all": "All",
	"usage.model.flash": "V4 Flash",
	"usage.model.pro": "V4 Pro",
	"usage.loading": "Summarizing local usage…",
	"usage.today": "Today",
	"usage.todaySpent": "Today",
	"usage.week": "This week",
	"usage.month": "This month",
	"usage.allTime": "All time",
	"usage.cacheHit": "Today's cache hit rate",
	"usage.daily": "Daily usage",
	"usage.previousMonth": "Previous month",
	"usage.nextMonth": "Next month",
	"usage.empty": "No usage this month",
	"usage.tokens": "tokens",
	"usage.calls": "calls",
	"usage.coverage": "Retained local sessions",
	"usage.skipped": "skipped",
	"usage.scopeHint": "Counts retained local DSH sessions only; deleted logs and API calls from other clients are not included.",
	"pricing.title": "Official DeepSeek pricing",
	"pricing.current": "Current: ",
	"pricing.select": "Select price period",
	"pricing.phase.legacy": "Before change",
	"pricing.phase.offPeak": "Off-peak",
	"pricing.phase.peak": "Peak",
	"pricing.model": "Model",
	"pricing.cacheHit": "Cache hit",
	"pricing.cacheMiss": "Cache miss",
	"pricing.output": "Output",
	"pricing.unit": "CNY per 1M tokens",
	"pricing.peakHours": "Beijing peak",
	"pricing.offPeakRest": "all other hours are off-peak",
	"pricing.effectiveAt": "Peak pricing starts:",
	"pricing.estimateHint": "Estimated by call time; the official bill is authoritative",
	"pricing.source": "Official pricing"
};

//#endregion
//#region src/contracts.ts
const API_BASE_PATH = "/api/api-balance";
const BALANCE_PATH = `${API_BASE_PATH}/balance`;
const USAGE_PATH = `${API_BASE_PATH}/usage`;

//#endregion
//#region src/client/store.ts
async function fetchJson(path, signal) {
	const response = await fetch(path, {
		method: "GET",
		headers: { accept: "application/json" },
		credentials: "same-origin",
		signal
	});
	const value = await response.json();
	if (!response.ok) throw new Error(typeof value.message === "string" ? value.message : `HTTP ${response.status}`);
	return value;
}
var PanelStore = class {
	snapshot = {
		open: false,
		anchor: null,
		refreshing: false,
		selectedMonth: currentMonthKey(),
		selectedModel: "all",
		selectedPricePhase: null,
		balance: { status: "loading" },
		usage: { status: "loading" }
	};
	listeners = /* @__PURE__ */ new Set();
	balanceController;
	usageController;
	refreshGeneration = 0;
	disposed = false;
	getSnapshot = () => this.snapshot;
	subscribe = (listener) => {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	};
	update(patch) {
		if (this.disposed) return;
		this.snapshot = {
			...this.snapshot,
			...patch
		};
		for (const listener of this.listeners) listener();
	}
	openAt(rect) {
		this.update({
			open: true,
			anchor: {
				top: rect.top,
				right: rect.right,
				bottom: rect.bottom,
				left: rect.left
			}
		});
	}
	close() {
		this.update({ open: false });
	}
	setSelectedModel(model) {
		this.update({ selectedModel: model });
	}
	setSelectedPricePhase(phase) {
		this.update({ selectedPricePhase: phase });
	}
	setSelectedMonth(month) {
		if (month === this.snapshot.selectedMonth) return;
		this.update({
			selectedMonth: month,
			usage: { status: "loading" }
		});
		this.loadUsage(month);
	}
	async refresh() {
		const generation = ++this.refreshGeneration;
		this.update({ refreshing: true });
		await Promise.allSettled([this.loadBalance(), this.loadUsage(this.snapshot.selectedMonth)]);
		if (generation === this.refreshGeneration) this.update({ refreshing: false });
	}
	async loadBalance() {
		this.balanceController?.abort();
		const controller = new AbortController();
		this.balanceController = controller;
		if (this.snapshot.balance.status !== "ready") this.update({ balance: { status: "loading" } });
		try {
			const value = await fetchJson(BALANCE_PATH, controller.signal);
			if (controller.signal.aborted) return;
			if (!value.ok) this.update({ balance: {
				status: "error",
				message: value.message
			} });
			else this.update({ balance: {
				status: "ready",
				value
			} });
		} catch (error) {
			if (!controller.signal.aborted) this.update({ balance: {
				status: "error",
				message: error instanceof Error ? error.message : String(error)
			} });
		}
	}
	async loadUsage(month) {
		this.usageController?.abort();
		const controller = new AbortController();
		this.usageController = controller;
		if (this.snapshot.usage.status !== "ready") this.update({ usage: { status: "loading" } });
		const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
		const query = new URLSearchParams({
			month,
			timeZone
		});
		try {
			const value = await fetchJson(`${USAGE_PATH}?${query.toString()}`, controller.signal);
			if (!controller.signal.aborted && month === this.snapshot.selectedMonth) this.update({ usage: {
				status: "ready",
				value
			} });
		} catch (error) {
			if (!controller.signal.aborted && month === this.snapshot.selectedMonth) this.update({ usage: {
				status: "error",
				message: error instanceof Error ? error.message : String(error)
			} });
		}
	}
	dispose() {
		this.disposed = true;
		this.refreshGeneration += 1;
		this.balanceController?.abort();
		this.usageController?.abort();
		this.listeners.clear();
	}
};
function usePanelSnapshot(store) {
	return (0, react.useSyncExternalStore)(store.subscribe, store.getSnapshot, store.getSnapshot);
}

//#endregion
//#region src/client/PricingTable.tsx
const PHASES = [
	"legacy",
	"offPeak",
	"peak"
];
function PricingTable({ pricing, selectedModel, selectedPhase, onPhaseChange, t }) {
	const phase = selectedPhase ?? pricing.currentPhase;
	const models = selectedModel === "all" ? pricing.models : pricing.models.filter((item) => item.model === selectedModel);
	const modelName = (model) => model === "deepseek-v4-flash" ? t("usage.model.flash") : model === "deepseek-v4-pro" ? t("usage.model.pro") : model;
	const formatRate = (value) => `¥${Number(value.toFixed(3))}`;
	const effectiveDate = new Date(pricing.effectiveAt).toLocaleDateString(void 0, {
		timeZone: pricing.timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	});
	const peakHours = pricing.peakPeriods.map((period) => `${period.start}-${period.end}`).join("、");
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
		style: {
			marginTop: 14,
			paddingTop: 12,
			borderTop: "1px solid var(--dsw-alias-border-l1)"
		},
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 8,
					marginBottom: 8
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
					style: {
						fontSize: 13,
						lineHeight: "18px",
						color: "var(--dsw-alias-label-primary)"
					},
					children: t("pricing.title")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					style: {
						display: "inline-flex",
						alignItems: "center",
						gap: 5,
						fontSize: 10,
						lineHeight: "16px",
						color: pricing.currentPhase === "peak" ? "var(--dsw-alias-state-warn-primary)" : "var(--dsw-alias-state-success-primary)",
						whiteSpace: "nowrap"
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							style: {
								width: 6,
								height: 6,
								borderRadius: "50%",
								background: "currentColor"
							}
						}),
						t("pricing.current"),
						t(`pricing.phase.${pricing.currentPhase}`)
					]
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				role: "group",
				"aria-label": t("pricing.select"),
				style: {
					display: "grid",
					gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
					border: "1px solid var(--dsw-alias-border-l2)",
					borderRadius: 7,
					overflow: "hidden",
					marginBottom: 9
				},
				children: PHASES.map((item, index) => {
					const active = phase === item;
					return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-pressed": active,
						onClick: () => onPhaseChange(item),
						style: {
							height: 32,
							padding: "0 6px",
							border: "none",
							borderLeft: index === 0 ? "none" : "1px solid var(--dsw-alias-border-l2)",
							background: active ? "var(--dsw-static-blue-450)" : "var(--dsw-alias-button-elevated-fill)",
							color: active ? "white" : "var(--dsw-alias-label-primary)",
							font: "inherit",
							fontSize: 11,
							fontWeight: active ? 650 : 500,
							cursor: "pointer"
						},
						children: t(`pricing.phase.${item}`)
					}, item);
				})
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "minmax(74px, 1.1fr) repeat(3, minmax(0, 1fr))",
					alignItems: "center",
					fontSize: 10,
					lineHeight: "15px"
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: {
							color: "var(--dsw-alias-label-secondary)",
							padding: "3px 4px"
						},
						children: t("pricing.model")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: {
							color: "var(--dsw-alias-label-secondary)",
							textAlign: "right",
							padding: "3px 2px"
						},
						children: t("pricing.cacheHit")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: {
							color: "var(--dsw-alias-label-secondary)",
							textAlign: "right",
							padding: "3px 2px"
						},
						children: t("pricing.cacheMiss")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: {
							color: "var(--dsw-alias-label-secondary)",
							textAlign: "right",
							padding: "3px 2px"
						},
						children: t("pricing.output")
					}),
					models.flatMap((model) => {
						const rates = model[phase];
						return [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
							style: {
								borderTop: "1px solid var(--dsw-alias-border-l1)",
								color: "var(--dsw-alias-label-primary)",
								padding: "6px 4px",
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap"
							},
							children: modelName(model.model)
						}, `${model.model}-name`), ...[
							["cacheHit", rates.cacheHit],
							["cacheMiss", rates.cacheMiss],
							["output", rates.output]
						].map(([key, value]) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							title: `${formatRate(value)} / ${pricing.unitTokens.toLocaleString()} ${t("usage.tokens")}`,
							style: {
								borderTop: "1px solid var(--dsw-alias-border-l1)",
								color: "var(--dsw-alias-label-primary)",
								textAlign: "right",
								padding: "6px 2px",
								fontVariantNumeric: "tabular-nums"
							},
							children: formatRate(value)
						}, `${model.model}-${key}`))];
					})
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
				style: {
					margin: "8px 0 0",
					fontSize: 10,
					lineHeight: "16px",
					color: "var(--dsw-alias-label-secondary)"
				},
				children: [
					t("pricing.unit"),
					" · ",
					t("pricing.peakHours"),
					" ",
					peakHours,
					" · ",
					t("pricing.offPeakRest"),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("br", {}),
					t("pricing.effectiveAt"),
					" ",
					effectiveDate,
					" 00:00"
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
				style: {
					margin: "5px 0 0",
					fontSize: 10,
					lineHeight: "16px",
					color: "var(--dsw-alias-label-secondary)"
				},
				children: [
					t("pricing.estimateHint"),
					" ·",
					" ",
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
						href: pricing.sourceUrl,
						target: "_blank",
						rel: "noreferrer",
						style: {
							color: "var(--dsw-static-blue-450)",
							textDecoration: "none"
						},
						children: t("pricing.source")
					})
				]
			})
		]
	});
}

//#endregion
//#region src/client/UsageAnalytics.tsx
const sectionStyle = {
	marginTop: 14,
	paddingTop: 14,
	borderTop: "1px solid var(--dsw-alias-border-l1)"
};
const actionButtonStyle = {
	marginTop: 8,
	padding: "6px 12px",
	border: "1px solid var(--dsw-alias-border-l2)",
	borderRadius: 7,
	background: "var(--dsw-alias-button-elevated-fill)",
	color: "var(--dsw-alias-label-primary)",
	font: "inherit",
	fontSize: 13,
	cursor: "pointer"
};
function UsageAnalytics({ state, selectedMonth, selectedModel, selectedPricePhase, onMonthChange, onModelChange, onPricePhaseChange, onRetry, t }) {
	const heading = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
		style: {
			margin: "0 0 10px",
			fontSize: 14,
			fontWeight: 650,
			lineHeight: "20px",
			color: "var(--dsw-alias-label-primary)"
		},
		children: t("usage.title")
	});
	if (state.status === "loading") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
		style: sectionStyle,
		children: [heading, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
			style: {
				margin: 0,
				fontSize: 12,
				lineHeight: "18px",
				color: "var(--dsw-alias-label-secondary)"
			},
			children: t("usage.loading")
		})]
	});
	if (state.status === "error") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
		style: sectionStyle,
		children: [
			heading,
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				role: "alert",
				style: {
					margin: 0,
					fontSize: 12,
					lineHeight: "18px",
					color: "var(--dsw-alias-state-error-primary)"
				},
				children: state.message
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				style: actionButtonStyle,
				onClick: onRetry,
				children: t("balance.retryAction")
			})
		]
	});
	const value = state.value;
	const selectedSeries = selectedModel === "all" ? value : value.models.find((item) => item.model === selectedModel) ?? value;
	const modelName = (model) => model === "deepseek-v4-flash" ? t("usage.model.flash") : model === "deepseek-v4-pro" ? t("usage.model.pro") : model;
	const modelOptions = [{
		id: "all",
		label: t("usage.model.all"),
		series: value
	}, ...value.models.filter((item) => item.model === "deepseek-v4-flash" || item.model === "deepseek-v4-pro").map((item) => ({
		id: item.model,
		label: modelName(item.model),
		series: item
	}))];
	const days = selectedSeries.days;
	const maxTokens = Math.max(0, ...days.map((day) => day.totalTokens));
	const current = currentMonthKey();
	const metric = (label, bucket) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		title: `${bucket.totalTokens.toLocaleString()} ${t("usage.tokens")} · ${formatEstimatedCost(bucket.estimatedCostCny)}`,
		style: {
			minWidth: 0,
			padding: "8px 7px"
		},
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
				style: {
					display: "block",
					fontSize: 17,
					fontWeight: 650,
					lineHeight: "23px",
					color: "var(--dsw-alias-label-primary)",
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap"
				},
				children: formatTokenCount(bucket.totalTokens)
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				style: {
					display: "block",
					fontSize: 11,
					lineHeight: "16px",
					color: "var(--dsw-alias-label-secondary)",
					whiteSpace: "nowrap"
				},
				children: label
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				style: {
					display: "block",
					fontSize: 10,
					lineHeight: "15px",
					color: "var(--dsw-static-blue-450)",
					fontWeight: 600,
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap"
				},
				children: formatEstimatedCost(bucket.estimatedCostCny)
			})
		]
	});
	const iconButtonStyle = {
		width: 28,
		height: 28,
		border: "none",
		borderRadius: "50%",
		background: "transparent",
		color: "var(--dsw-alias-label-secondary)",
		cursor: "pointer",
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		padding: 0
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
		style: sectionStyle,
		children: [
			heading,
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				role: "group",
				"aria-label": t("usage.model.select"),
				style: {
					display: "grid",
					gridTemplateColumns: `repeat(${modelOptions.length}, minmax(0, 1fr))`,
					marginBottom: 10,
					border: "1px solid var(--dsw-alias-border-l2)",
					borderRadius: 7,
					overflow: "hidden"
				},
				children: modelOptions.map((option, index) => {
					const active = selectedModel === option.id;
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						"aria-pressed": active,
						onClick: () => onModelChange(option.id),
						style: {
							minWidth: 0,
							height: 50,
							padding: "5px 6px",
							border: "none",
							borderLeft: index === 0 ? "none" : "1px solid var(--dsw-alias-border-l2)",
							background: active ? "var(--dsw-static-blue-450)" : "var(--dsw-alias-button-elevated-fill)",
							color: active ? "white" : "var(--dsw-alias-label-primary)",
							font: "inherit",
							cursor: "pointer"
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: {
								display: "block",
								fontSize: 11,
								lineHeight: "15px",
								fontWeight: 650,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap"
							},
							children: option.label
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: {
								display: "block",
								fontSize: 10,
								lineHeight: "15px",
								opacity: active ? .9 : .68,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap"
							},
							children: formatTokenCount(option.series.totals.allTime.totalTokens)
						})]
					}, option.id);
				})
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
					background: "var(--dsw-alias-button-elevated-fill)",
					border: "1px solid var(--dsw-alias-border-l1)",
					borderRadius: 7,
					overflow: "hidden"
				},
				children: [
					metric(t("usage.today"), selectedSeries.totals.today),
					metric(t("usage.week"), selectedSeries.totals.week),
					metric(t("usage.month"), selectedSeries.totals.month),
					metric(t("usage.allTime"), selectedSeries.totals.allTime)
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					justifyContent: "space-between",
					gap: 12,
					margin: "8px 0 12px",
					fontSize: 12,
					lineHeight: "18px"
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: { color: "var(--dsw-alias-label-secondary)" },
					children: t("usage.cacheHit")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
					style: {
						color: "var(--dsw-alias-label-primary)",
						fontWeight: 600
					},
					children: selectedSeries.totals.today.cacheHitRate === null ? "—" : new Intl.NumberFormat(void 0, {
						style: "percent",
						maximumFractionDigits: 1
					}).format(selectedSeries.totals.today.cacheHitRate)
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 8,
					marginBottom: 8
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: { minWidth: 0 },
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
						style: {
							display: "block",
							fontSize: 13,
							lineHeight: "18px",
							color: "var(--dsw-alias-label-primary)"
						},
						children: t("usage.daily")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						style: {
							display: "block",
							fontSize: 11,
							lineHeight: "16px",
							color: "var(--dsw-alias-label-secondary)",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap"
						},
						children: [
							formatMonthName(selectedMonth),
							" · ",
							formatTokenCount(selectedSeries.totals.selectedMonth.totalTokens),
							" · ",
							formatEstimatedCost(selectedSeries.totals.selectedMonth.estimatedCostCny)
						]
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 2,
						flex: "none"
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						style: iconButtonStyle,
						title: t("usage.previousMonth"),
						"aria-label": t("usage.previousMonth"),
						onClick: () => onMonthChange(shiftMonthKey(selectedMonth, -1)),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconChevronLeftOutline14, { size: 14 })
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						style: {
							...iconButtonStyle,
							opacity: selectedMonth >= current ? .35 : 1,
							cursor: selectedMonth >= current ? "default" : "pointer"
						},
						disabled: selectedMonth >= current,
						title: t("usage.nextMonth"),
						"aria-label": t("usage.nextMonth"),
						onClick: () => onMonthChange(shiftMonthKey(selectedMonth, 1)),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, { size: 14 })
					})]
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				role: "img",
				"aria-label": `${formatMonthName(selectedMonth)} ${t("usage.daily")}`,
				style: {
					position: "relative",
					display: "flex",
					alignItems: "flex-end",
					gap: 3,
					height: 112,
					paddingTop: 4,
					borderBottom: "1px solid var(--dsw-alias-border-l1)"
				},
				children: [maxTokens === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: {
						position: "absolute",
						inset: "34px 0 auto",
						textAlign: "center",
						fontSize: 12,
						color: "var(--dsw-alias-label-secondary)"
					},
					children: t("usage.empty")
				}), days.map((day, index) => {
					const number = index + 1;
					const isToday = day.date === selectedSeries.today;
					const height = day.totalTokens === 0 || maxTokens === 0 ? 2 : Math.max(4, Math.round(day.totalTokens / maxTokens * 84));
					const showLabel = number === 1 || number === days.length || number % 5 === 0 && days.length - number > 1 || isToday;
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						title: `${day.date}: ${day.totalTokens.toLocaleString()} ${t("usage.tokens")} · ${formatEstimatedCost(day.estimatedCostCny)} · ${day.calls} ${t("usage.calls")}`,
						style: {
							display: "flex",
							flex: "1 1 0",
							minWidth: 0,
							height: "100%",
							flexDirection: "column",
							justifyContent: "flex-end",
							alignItems: "center"
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { style: {
							width: "100%",
							maxWidth: 10,
							height,
							borderRadius: "3px 3px 1px 1px",
							background: "var(--dsw-static-blue-450)",
							opacity: isToday ? 1 : day.totalTokens === 0 ? .18 : .58
						} }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: {
								display: "block",
								width: 12,
								height: 18,
								paddingTop: 4,
								fontSize: 9,
								lineHeight: "14px",
								textAlign: "center",
								color: isToday ? "var(--dsw-static-blue-450)" : "var(--dsw-alias-label-secondary)",
								fontWeight: isToday ? 650 : 400
							},
							children: showLabel ? String(number) : ""
						})]
					}, day.date);
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)(PricingTable, {
				pricing: value.pricing,
				selectedModel,
				selectedPhase: selectedPricePhase,
				onPhaseChange: onPricePhaseChange,
				t
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
				title: t("usage.scopeHint"),
				style: {
					margin: "8px 0 0",
					fontSize: 11,
					lineHeight: "16px",
					color: value.coverage.failedSessions > 0 ? "var(--dsw-alias-state-warn-primary)" : "var(--dsw-alias-label-secondary)"
				},
				children: [
					t("usage.coverage"),
					" · ",
					value.coverage.sessions,
					value.coverage.failedSessions > 0 ? ` · ${value.coverage.failedSessions} ${t("usage.skipped")}` : ""
				]
			})
		]
	});
}

//#endregion
//#region src/client/BalanceOverlay.tsx
const LOW_BALANCE_THRESHOLD$1 = 20;
function useViewport() {
	const [viewport, setViewport] = (0, react.useState)(() => ({
		width: window.innerWidth,
		height: window.innerHeight
	}));
	(0, react.useEffect)(() => {
		const update = () => setViewport({
			width: window.innerWidth,
			height: window.innerHeight
		});
		window.addEventListener("resize", update);
		return () => window.removeEventListener("resize", update);
	}, []);
	return viewport;
}
function BalanceOverlay({ t, store }) {
	const state = usePanelSnapshot(store);
	const viewport = useViewport();
	const panelRef = (0, react.useRef)(null);
	const closeRef = (0, react.useRef)(null);
	(0, react.useEffect)(() => {
		if (!state.open) return;
		const onPointerDown = (event) => {
			if (panelRef.current?.contains(event.target) === true) return;
			if (event.target?.closest?.("[data-api-balance-trigger]") !== null) return;
			store.close();
		};
		const onKeyDown = (event) => {
			if (event.key === "Escape") store.close();
		};
		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		const frame = requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));
		return () => {
			cancelAnimationFrame(frame);
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [state.open, store]);
	if (!state.open || state.anchor === null) return null;
	const width = Math.max(240, Math.min(440, viewport.width - 16));
	const left = Math.max(8, Math.min(state.anchor.right - width, viewport.width - width - 8));
	const preferAbove = state.anchor.top > 320;
	const available = preferAbove ? state.anchor.top - 16 : viewport.height - state.anchor.bottom - 16;
	const maxHeight = Math.max(180, Math.min(Math.round(viewport.height * .82), available));
	const position = preferAbove ? { bottom: viewport.height - state.anchor.top + 8 } : { top: state.anchor.bottom + 8 };
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		ref: panelRef,
		role: "dialog",
		"aria-label": t("balance.title"),
		"aria-modal": "false",
		"data-api-balance-panel": true,
		style: {
			position: "fixed",
			zIndex: 1e3,
			left,
			width,
			maxHeight,
			overflow: "hidden",
			display: "flex",
			flexDirection: "column",
			boxSizing: "border-box",
			pointerEvents: "auto",
			background: "var(--dsw-alias-bg-layer-1)",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: 8,
			boxShadow: "var(--dsw-shadow-lv3)",
			padding: "14px 14px 10px",
			...position
		},
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					flex: "none",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 8,
					marginBottom: 4
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
					style: {
						margin: 0,
						fontSize: 15,
						fontWeight: 650,
						color: "var(--dsw-alias-label-primary)",
						lineHeight: "22px"
					},
					children: t("balance.title")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					ref: closeRef,
					type: "button",
					"aria-label": t("balance.close"),
					title: t("balance.close"),
					onClick: () => store.close(),
					style: {
						width: 28,
						height: 28,
						border: "none",
						borderRadius: "50%",
						background: "transparent",
						cursor: "pointer",
						padding: 0,
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						color: "var(--dsw-alias-label-secondary)"
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, { size: 14 })
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: {
					flex: "none",
					margin: "0 0 8px",
					fontSize: 12,
					lineHeight: "18px",
					color: "var(--dsw-alias-label-secondary)"
				},
				children: t("balance.detailHint")
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: {
					minHeight: 0,
					overflowX: "hidden",
					overflowY: "auto",
					overscrollBehavior: "contain",
					padding: "4px 0 8px"
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BalanceBody, {
					t,
					store
				})
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					flex: "none",
					justifyContent: "flex-end",
					gap: 8,
					paddingTop: 10,
					borderTop: "1px solid var(--dsw-alias-border-l1)"
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					title: t("balance.refresh"),
					disabled: state.refreshing,
					onClick: () => {
						store.refresh();
					},
					style: {
						padding: "6px 12px",
						border: "1px solid var(--dsw-alias-border-l2)",
						borderRadius: 7,
						background: "var(--dsw-alias-button-elevated-fill)",
						color: "var(--dsw-alias-label-primary)",
						font: "inherit",
						fontSize: 13,
						cursor: state.refreshing ? "default" : "pointer",
						opacity: state.refreshing ? .6 : 1,
						display: "inline-flex",
						alignItems: "center",
						gap: 6
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(__deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline14, { size: 14 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("balance.refresh") })]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => store.close(),
					style: {
						padding: "6px 12px",
						border: "none",
						borderRadius: 7,
						background: "transparent",
						color: "var(--dsw-alias-label-secondary)",
						font: "inherit",
						fontSize: 13,
						cursor: "pointer"
					},
					children: t("balance.close")
				})]
			})
		]
	});
}
function BalanceBody({ t, store }) {
	const state = usePanelSnapshot(store);
	const balance = state.balance;
	const info = balance.status === "ready" && balance.value.ok ? balance.value.infos[0] : void 0;
	const total = Number(info?.totalBalance);
	const low = info !== void 0 && Number.isFinite(total) && total < LOW_BALANCE_THRESHOLD$1;
	const textStyle = {
		color: "var(--dsw-alias-label-primary)",
		fontSize: 13,
		lineHeight: "20px",
		margin: "4px 0"
	};
	const retryStyle = {
		marginTop: 8,
		padding: "6px 12px",
		border: "1px solid var(--dsw-alias-border-l2)",
		borderRadius: 7,
		background: "var(--dsw-alias-button-elevated-fill)",
		color: "var(--dsw-alias-label-primary)",
		font: "inherit",
		fontSize: 13,
		cursor: "pointer"
	};
	const row = (label, value) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: {
			display: "flex",
			justifyContent: "space-between",
			alignItems: "center",
			gap: 12,
			padding: "4px 0",
			fontSize: 13,
			lineHeight: "20px"
		},
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
			style: { color: "var(--dsw-alias-label-secondary)" },
			children: label
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
			style: {
				color: "var(--dsw-alias-label-primary)",
				fontWeight: 500
			},
			children: value
		})]
	});
	let balanceBody;
	if (balance.status === "loading") balanceBody = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
		style: textStyle,
		children: t("balance.loading")
	});
	else if (balance.status === "error") balanceBody = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
		role: "alert",
		style: {
			...textStyle,
			color: "var(--dsw-alias-state-error-primary)"
		},
		children: balance.message
	}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
		type: "button",
		style: retryStyle,
		onClick: () => {
			store.refresh();
		},
		children: t("balance.retryAction")
	})] });
	else if (!balance.value.ok || info === void 0) balanceBody = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
		style: textStyle,
		children: t("balance.unavailable")
	});
	else {
		const checkedAt = new Date(balance.value.checkedAt);
		balanceBody = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					alignItems: "baseline",
					gap: 8,
					marginBottom: 8
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
					style: {
						fontSize: 26,
						fontWeight: 650,
						lineHeight: "34px",
						color: low ? "var(--dsw-alias-state-warn-primary)" : "var(--dsw-alias-label-primary)",
						fontVariantNumeric: "tabular-nums"
					},
					children: formatAmount(info.currency, info.totalBalance)
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					style: {
						display: "inline-flex",
						alignItems: "center",
						gap: 5,
						fontSize: 12,
						color: balance.value.isAvailable ? "var(--dsw-alias-state-success-primary)" : "var(--dsw-alias-state-error-primary)"
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						"aria-hidden": "true",
						style: {
							width: 7,
							height: 7,
							borderRadius: "50%",
							background: "currentColor"
						}
					}), balance.value.isAvailable ? t("balance.availableShort") : t("balance.notAvailableShort")]
				})]
			}),
			low && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				role: "status",
				style: {
					margin: "0 0 8px",
					fontSize: 12,
					lineHeight: "18px",
					color: "var(--dsw-alias-state-warn-primary)"
				},
				children: t("balance.low")
			}),
			row(t("balance.toppedUp"), formatAmount(info.currency, info.toppedUpBalance)),
			row(t("balance.granted"), formatAmount(info.currency, info.grantedBalance)),
			row(t("balance.updatedAt"), checkedAt.toLocaleString())
		] });
	}
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [balanceBody, /* @__PURE__ */ (0, react_jsx_runtime.jsx)(UsageAnalytics, {
		state: state.usage,
		selectedMonth: state.selectedMonth,
		selectedModel: state.selectedModel,
		selectedPricePhase: state.selectedPricePhase,
		onMonthChange: (month) => store.setSelectedMonth(month),
		onModelChange: (model) => store.setSelectedModel(model),
		onPricePhaseChange: (phase) => store.setSelectedPricePhase(phase),
		onRetry: () => {
			store.refresh();
		},
		t
	})] });
}

//#endregion
//#region src/client/WalletIcon.tsx
function WalletIcon({ size = 16 }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
		width: size,
		height: size,
		viewBox: "0 0 16 16",
		fill: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
				d: "M2.5 4.3h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-9a2 2 0 0 1-2-2V4.3Z",
				stroke: "currentColor",
				strokeWidth: "1.25",
				strokeLinejoin: "round"
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
				d: "M2.5 6h11",
				stroke: "currentColor",
				strokeWidth: "1.25",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
				cx: "11",
				cy: "9.5",
				r: "1.8",
				stroke: "currentColor",
				strokeWidth: "1.1"
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
				cx: "11",
				cy: "9.5",
				r: "0.75",
				fill: "currentColor"
			})
		]
	});
}

//#endregion
//#region src/client/FooterAction.tsx
const LOW_BALANCE_THRESHOLD = 20;
function FooterAction({ wide, t, store }) {
	const state = usePanelSnapshot(store);
	const buttonRef = (0, react.useRef)(null);
	const info = state.balance.status === "ready" && state.balance.value.ok ? state.balance.value.infos[0] : void 0;
	const total = Number(info?.totalBalance);
	const low = info !== void 0 && Number.isFinite(total) && total < LOW_BALANCE_THRESHOLD;
	const balanceLabel = state.balance.status === "ready" ? `${t("balance.shortLabel")} ${formatAmount(info?.currency ?? "", info?.totalBalance ?? "")}` : state.balance.status === "error" ? t("balance.unavailable") : t("balance.loading");
	const todayCost = state.usage.status === "ready" ? formatEstimatedCost(state.usage.value.totals.today.estimatedCostCny) : state.usage.status === "error" ? "--" : "…";
	const label = `${balanceLabel} · ${t("usage.todaySpent")} ${todayCost}`;
	const title = state.balance.status === "error" ? `${t("balance.unavailable")}: ${state.balance.message}` : `${t("balance.title")}: ${label}${low ? ` (${t("balance.low")})` : ""}`;
	const open = () => {
		const button = buttonRef.current;
		if (button === null) return;
		if (state.open) store.close();
		else store.openAt(button.getBoundingClientRect());
	};
	(0, react.useLayoutEffect)(() => {
		if (!state.open || buttonRef.current === null) return;
		store.openAt(buttonRef.current.getBoundingClientRect());
	}, [
		state.open,
		store,
		wide
	]);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
		ref: buttonRef,
		type: "button",
		title,
		"aria-label": `${t("balance.title")}: ${label}`,
		"aria-expanded": state.open,
		"data-api-balance-trigger": true,
		onClick: open,
		style: {
			display: "flex",
			alignItems: "center",
			justifyContent: wide ? "flex-start" : "center",
			gap: 7,
			width: wide ? "100%" : 40,
			height: wide ? 36 : 40,
			boxSizing: "border-box",
			border: "none",
			borderRadius: 6,
			background: state.open ? "var(--dsw-alias-bg-layer-2)" : "transparent",
			cursor: "pointer",
			padding: wide ? "7px 4px" : 0,
			font: "inherit",
			fontSize: 14,
			fontWeight: 700,
			lineHeight: "20px",
			color: low ? "var(--dsw-alias-state-warn-primary)" : "var(--dsw-alias-label-primary)",
			whiteSpace: "nowrap",
			overflow: "hidden",
			textAlign: "left"
		},
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
			style: {
				display: "inline-flex",
				flex: "none"
			},
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WalletIcon, { size: 16 })
		}), wide && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
			style: {
				overflow: "hidden",
				textOverflow: "ellipsis"
			},
			children: label
		})]
	});
}

//#endregion
//#region src/client/index.tsx
const inject = ["slots", "locale"];
function apply(ctx) {
	ctx.effect(() => ctx.locale.register(NS, {
		zh,
		en
	}), "api-balance: dictionaries");
	const store = new PanelStore();
	const face = () => ({ store });
	ctx.effect(() => () => store.dispose(), "api-balance: store lifecycle");
	ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
		name: "sidebar.footer.action",
		id: "api-balance",
		order: 20,
		label: "API $$",
		locale: NS,
		inject: face
	}, FooterAction));
	ctx.slots.inject("shell.overlay", () => ctx.slots.register({
		name: "shell.overlay",
		id: "api-balance-panel",
		order: 120,
		label: "API $$",
		locale: NS,
		inject: face
	}, BalanceOverlay));
	store.refresh();
}

//#endregion
exports.PanelStore = PanelStore;
exports.apply = apply;
exports.inject = inject;
return module.exports; } });
//# sourceMappingURL=client.js.map