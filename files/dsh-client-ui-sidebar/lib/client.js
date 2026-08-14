window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-sidebar",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region ../../../node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
		function r(e) {
			var t, f, n = "";
			if ("string" == typeof e || "number" == typeof e) n += e;
			else if ("object" == typeof e) if (Array.isArray(e)) {
				var o = e.length;
				for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
			} else for (f in e) e[f] && (n && (n += " "), n += f);
			return n;
		}
		function clsx() {
			for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
			return n;
		}
		//#endregion
		//#region \0dsh-css:/home/runner/work/deepseek-harness/deepseek-harness/packages/client/ui-sidebar/src/client/SidebarRoot.module.css.mjs
		const css = ".hHd-Xa_root{--dsh-sidebar-inline-padding:12px;height:100%;padding:6px var(--dsh-sidebar-inline-padding);box-sizing:border-box;background:var(--dsw-specific-sidebar-fill);color:var(--dsw-alias-label-primary);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);flex-direction:column;font-size:14px;display:flex}.hHd-Xa_root.hHd-Xa_collapsed{padding:18px 10px 6px}.hHd-Xa_root.hHd-Xa_quietBars{--dsh-scrollbar-thumb:transparent;--dsh-scrollbar-thumb-hover:transparent}.hHd-Xa_fading>*{opacity:0;transition:opacity .15s var(--ds-ease-in-out)}.hHd-Xa_wide{animation:hHd-Xa_wide-in .2s var(--ds-ease-in-out)}@keyframes hHd-Xa_wide-in{0%{opacity:0}}.hHd-Xa_railIn .hHd-Xa_iconButton,.hHd-Xa_railIn .hHd-Xa_newSession,.hHd-Xa_railIn .hHd-Xa_regionArea{animation:hHd-Xa_rail-in .15s var(--ds-ease-in-out) backwards}.hHd-Xa_railIn .hHd-Xa_footArea{animation:hHd-Xa_rail-fade-in .15s var(--ds-ease-in-out) backwards}@keyframes hHd-Xa_rail-in{0%{opacity:0;transform:translate(49px)}}@keyframes hHd-Xa_rail-fade-in{0%{opacity:0}}.hHd-Xa_logoRow{box-sizing:border-box;flex:none;justify-content:flex-end;align-items:center;gap:8px;height:60px;margin-bottom:8px;padding:8px 0 8px 4px;display:flex;overflow:hidden}.hHd-Xa_collapsed .hHd-Xa_logoRow{justify-content:flex-start;height:36px;margin-bottom:12px;padding:0}.hHd-Xa_brand{min-width:0;color:inherit;cursor:pointer;background:0 0;border:none;flex:1;align-items:center;padding:0;display:inline-flex;overflow:hidden}.hHd-Xa_iconButton{cursor:pointer;width:28px;height:28px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.hHd-Xa_iconButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.hHd-Xa_collapsed .hHd-Xa_iconButton{width:36px;height:36px}.hHd-Xa_collapsed .hHd-Xa_toggle .hHd-Xa_panelIcon{display:none}.hHd-Xa_collapsed .hHd-Xa_toggle:hover .hHd-Xa_panelIcon{display:inline}.hHd-Xa_collapsed .hHd-Xa_toggle:hover .hHd-Xa_railFish{display:none}.hHd-Xa_collapsed .hHd-Xa_iconButton{color:var(--dsw-alias-label-primary)}.hHd-Xa_newSession{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-elevated-fill);height:38px;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:12px;flex:none;justify-content:center;align-items:center;gap:6px;margin:0 2px 8px;padding:8px 16px;font-size:14px;font-weight:500;line-height:22px;display:flex;overflow:hidden}.hHd-Xa_newSession:hover{background:var(--dsw-alias-button-floating-hover)}.hHd-Xa_collapsed .hHd-Xa_newSession{background:0 0;border-color:#0000;align-self:flex-start;gap:0;width:36px;height:36px;margin:0 0 12px;padding:0}.hHd-Xa_collapsed .hHd-Xa_newSession:hover{background:var(--dsw-alias-interactive-bg-hover)}.hHd-Xa_newSessionLabel{white-space:nowrap;max-width:200px;overflow:hidden}.hHd-Xa_collapsed .hHd-Xa_newSessionLabel{max-width:0}.hHd-Xa_regionArea{min-height:0;margin-left:-4px;margin-right:calc(-1 * var(--dsh-sidebar-inline-padding));flex-direction:column;flex:1;padding-left:4px;display:flex;overflow:hidden}.hHd-Xa_collapsed .hHd-Xa_regionArea{margin-left:0;margin-right:0;padding-left:0}.hHd-Xa_footArea{flex-direction:column;flex:none;display:flex}.hHd-Xa_settingsArea,.hHd-Xa_footerActions{flex:none;width:100%;min-width:0}.hHd-Xa_footerActions{display:flex}.hHd-Xa_collapsed .hHd-Xa_footArea{align-items:center}.hHd-Xa_collapsed .hHd-Xa_settingsArea,.hHd-Xa_collapsed .hHd-Xa_footerActions{justify-content:center;width:auto;display:flex}@media (prefers-reduced-motion:reduce){.hHd-Xa_wide,.hHd-Xa_fading>*,.hHd-Xa_railIn .hHd-Xa_iconButton,.hHd-Xa_railIn .hHd-Xa_newSession,.hHd-Xa_railIn .hHd-Xa_footArea,.hHd-Xa_railIn .hHd-Xa_regionArea{transition:none;animation:none}}";
		const tagId = "@deepseek-ai/dsh-client-ui-sidebar/SidebarRoot.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-sidebar";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var SidebarRoot_module_css_default = {
			"railFish": "hHd-Xa_railFish",
			"settingsArea": "hHd-Xa_settingsArea",
			"rail-fade-in": "hHd-Xa_rail-fade-in",
			"wide": "hHd-Xa_wide",
			"footArea": "hHd-Xa_footArea",
			"brand": "hHd-Xa_brand",
			"regionArea": "hHd-Xa_regionArea",
			"quietBars": "hHd-Xa_quietBars",
			"newSession": "hHd-Xa_newSession",
			"toggle": "hHd-Xa_toggle",
			"iconButton": "hHd-Xa_iconButton",
			"railIn": "hHd-Xa_railIn",
			"fading": "hHd-Xa_fading",
			"root": "hHd-Xa_root",
			"panelIcon": "hHd-Xa_panelIcon",
			"footerActions": "hHd-Xa_footerActions",
			"collapsed": "hHd-Xa_collapsed",
			"logoRow": "hHd-Xa_logoRow",
			"wide-in": "hHd-Xa_wide-in",
			"rail-in": "hHd-Xa_rail-in",
			"newSessionLabel": "hHd-Xa_newSessionLabel"
		};
		//#endregion
		//#region lib/types/client/SidebarRoot.js
		/**
		* Sidebar shell: column geometry only. Collapse is a slide plus crossfade:
		* content freezes at its expanded width (inline style) and fades out in place
		* while the sliding column (AppFrame grid tracks) clips it — nothing reflows
		* mid-slide. At settle the wide-only content unmounts and the four upper
		* controls enter the 56px rail from the same horizontal offset (one icon each,
		* same top-down order) on one fade that ends with the slide. The bottom-pinned
		* settings control only fades. The workspace/session browsing region between
		* the New Session button and the foot is the `sidebar.workspaces` registrant's,
		* and the foot holds the balance badge, `sidebar.settings` plus
		* `sidebar.footer.action`; the shell hands them the wide flag (plus an expand
		* request callback for the browser).
		*
		* The column also owns whether the scroll regions nested in it draw a
		* scrollbar at all: the shell tracks the pointer and rebinds ui-theme's
		* scrollbar indirection away while it is elsewhere, so a list the user is not
		* pointing at carries no bar.
		*/
		/** Wide-content unmount delay; matches the 150ms wide-content fade-out. */
		const COLLAPSE_SETTLE_MS = 150;
		/**
		* How long the column's scrollbars stay drawn after the pointer leaves it.
		* The bar is a pointer affordance here, and hiding it on the leave event
		* itself makes it blink out while the pointer is only crossing the column's
		* edge —on the way to the conversation, or around a portalled menu.
		*/
		const SCROLLBAR_LINGER_MS = 2e3;
		/**
		* Render the sidebar column shell.
		* @param props - composed slot props (runtime share + injected callbacks, contract/slots.ts).
		* @returns the sidebar element tree.
		*/
		function SidebarRoot({ collapsed, width, startSession, toggleSidebar, t, renderSlot }) {
			const [settled, setSettled] = (0, react.useState)(collapsed);
			(0, react.useEffect)(() => {
				if (!collapsed) {
					setSettled(false);
					return;
				}
				const timer = window.setTimeout(() => {
					setSettled(true);
				}, COLLAPSE_SETTLE_MS);
				return () => {
					window.clearTimeout(timer);
				};
			}, [collapsed]);
			const wide = !collapsed || !settled;
			const lastWideWidth = (0, react.useRef)(width);
			if (!collapsed) lastWideWidth.current = width;
			const everWide = (0, react.useRef)(!collapsed);
			if (!collapsed) everWide.current = true;
			const column = (0, react.useRef)(null);
			const [pointerInside, setPointerInside] = (0, react.useState)(false);
			const lingerTimer = (0, react.useRef)(void 0);
			const armLinger = () => {
				if (lingerTimer.current !== void 0) return;
				lingerTimer.current = window.setTimeout(() => {
					lingerTimer.current = void 0;
					setPointerInside(false);
				}, SCROLLBAR_LINGER_MS);
			};
			const cancelLinger = () => {
				window.clearTimeout(lingerTimer.current);
				lingerTimer.current = void 0;
			};
			(0, react.useEffect)(() => {
				if (!pointerInside) return;
				const onMove = (event) => {
					const rect = column.current?.getBoundingClientRect();
					/* v8 ignore next -- the listener only exists while the column is mounted and revealed. */
					if (rect === void 0) return;
					if (event.clientX >= rect.left && event.clientX < rect.right && event.clientY >= rect.top && event.clientY < rect.bottom) cancelLinger();
					else armLinger();
				};
				document.addEventListener("pointermove", onMove);
				return () => {
					document.removeEventListener("pointermove", onMove);
					cancelLinger();
				};
			}, [pointerInside]);
			return (0, react_jsx_runtime.jsxs)("div", {
				ref: column,
				className: clsx(SidebarRoot_module_css_default.root, !wide && SidebarRoot_module_css_default.collapsed, !wide && everWide.current && SidebarRoot_module_css_default.railIn, collapsed && wide && SidebarRoot_module_css_default.fading, !pointerInside && SidebarRoot_module_css_default.quietBars),
				style: wide ? { width: collapsed ? lastWideWidth.current : width } : void 0,
				onPointerEnter: () => {
					cancelLinger();
					setPointerInside(true);
				},
				onPointerLeave: () => {
					armLinger();
				},
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: SidebarRoot_module_css_default.logoRow,
						children: [wide && (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: clsx(SidebarRoot_module_css_default.brand, SidebarRoot_module_css_default.wide),
							"aria-label": t("session.new.label"),
							onClick: () => {
								startSession();
							},
							children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.BrandWordmark, {})
						}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
							label: collapsed ? t("toggle.open") : t("toggle.collapse"),
							delayMs: 500,
							children: (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: clsx(SidebarRoot_module_css_default.iconButton, SidebarRoot_module_css_default.toggle),
								"aria-label": collapsed ? t("toggle.open") : t("toggle.collapse"),
								onClick: () => {
									toggleSidebar();
								},
								children: [!wide && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.FishLogo, {
									className: SidebarRoot_module_css_default.railFish,
									size: 24
								}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPanelLeftOutline16, {
									className: SidebarRoot_module_css_default.panelIcon,
									size: wide ? 16 : 18
								})]
							})
						})]
					}),
					(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
						label: t("session.new.label"),
						delayMs: 500,
						disabled: wide,
						children: (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: SidebarRoot_module_css_default.newSession,
							"aria-label": t("session.new.label"),
							onClick: () => {
								startSession();
							},
							children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconNewChatOutline16, { size: wide ? 14 : 18 }), wide && (0, react_jsx_runtime.jsx)("span", {
								className: clsx(SidebarRoot_module_css_default.newSessionLabel, SidebarRoot_module_css_default.wide),
								children: t("session.new")
							})]
						})
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: SidebarRoot_module_css_default.regionArea,
						children: renderSlot("sidebar.workspaces", {
							wide,
							expandSidebar: () => {
								if (collapsed) toggleSidebar();
							}
						})
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: SidebarRoot_module_css_default.footArea,
						children: [(0, react_jsx_runtime.jsx)(SidebarBalance, {
							wide,
							t
						}), (0, react_jsx_runtime.jsx)("div", {
							className: SidebarRoot_module_css_default.footerActions,
							children: renderSlot("sidebar.footer.action", { wide })
						}), (0, react_jsx_runtime.jsx)("div", {
							className: SidebarRoot_module_css_default.settingsArea,
							children: renderSlot("sidebar.settings", { wide })
						})]
					})
				]
			});
		}
		/**
		* Balance total (in the account currency) below which the entry turns
		* into the warning state and the details dialog shows a top-up hint.
		*/
		const LOW_BALANCE_THRESHOLD = 20;
		/** Build a correlation id even when an HTTP page lacks crypto.randomUUID. */
		function createBalanceRpcId() {
			const cryptoApi = globalThis.crypto;
			if (typeof cryptoApi?.randomUUID === "function") return cryptoApi.randomUUID();
			return `balance-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
		}
		/**
		* Sidebar footer balance entry: an API icon plus the current DeepSeek
		* account balance, fetched by POSTing the same-origin `llm.balance` RPC
		* endpoint directly (the API key stays on the host). Clicking opens a
		* details dialog with the full granted/topped-up breakdown, account
		* availability, and the check time, plus a refresh control. Hidden in
		* the collapsed rail, where the footer centers icon-only controls.
		* @param props - the wide flag and the bound dictionary.
		* @returns the balance row, or null when collapsed.
		*/
		function SidebarBalance({ wide, t }) {
			const [state, setState] = (0, react.useState)({ status: "loading" });
			const [nonce, setNonce] = (0, react.useState)(0);
			const [open, setOpen] = (0, react.useState)(false);
			const [anchor, setAnchor] = (0, react.useState)(null);
			const buttonRef = (0, react.useRef)(null);
			const popoverRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (!wide) return;
				let current = true;
				const controller = new AbortController();
				const report = (next) => {
					if (current) setState(next);
				};
				report({ status: "loading" });
				fetch("/api/llm.balance", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ type: "client-request", rpcId: createBalanceRpcId(), method: "llm.balance", payload: {} }),
					signal: controller.signal
				}).then((response) => {
					if (!response.ok) {
						report({ status: "error", message: `HTTP ${response.status}` });
						return;
					}
					return response.json();
				}).then((envelope) => {
					if (envelope === void 0) return;
					const result = envelope?.result;
					if (!result?.ok) {
						report({ status: "error", message: result?.error?.message ?? String(result?.error) });
						return;
					}
					if (!result.value?.ok) {
						report({ status: "error", message: result.value.message });
						return;
					}
					report({ status: "ready", value: result.value });
				}).catch((error) => {
					report({ status: "error", message: error instanceof Error ? error.message : String(error) });
				});
				return () => {
					current = false;
					controller.abort();
				};
			}, [nonce, wide]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const onPointerDown = (event) => {
					if (popoverRef.current?.contains(event.target)) return;
					if (buttonRef.current?.contains(event.target)) return;
					setOpen(false);
				};
				const onKeyDown = (event) => {
					if (event.key === "Escape") setOpen(false);
				};
				document.addEventListener("pointerdown", onPointerDown);
				document.addEventListener("keydown", onKeyDown);
				return () => {
					document.removeEventListener("pointerdown", onPointerDown);
					document.removeEventListener("keydown", onKeyDown);
				};
			}, [open]);
			if (!wide) return null;
			const refresh = () => setNonce((value) => value + 1);
			const openPopover = () => {
				const rect = buttonRef.current?.getBoundingClientRect();
				if (rect !== void 0) setAnchor({ top: rect.top, right: rect.right, left: rect.left, bottom: rect.bottom });
				setOpen(true);
			};
			const formatAmount = (currency, amount) => `${currency === "CNY" ? "¥" : `${currency} `}${amount}`;
			const info = state.status === "ready" ? state.value.infos[0] : void 0;
			const total = info === void 0 ? Number.NaN : Number(info.totalBalance);
			const low = state.status === "ready" && info !== void 0 && Number.isFinite(total) && total < LOW_BALANCE_THRESHOLD;
			const label = state.status === "ready" ? `${t("balance.shortLabel")} ${formatAmount(info?.currency ?? "", info?.totalBalance ?? "")}` : state.status === "error" ? t("balance.unavailable") : t("balance.loading");
			const title = state.status === "ready" ? `${t("balance.title")}: ${label}${low ? ` (${t("balance.low")})` : ""}` : state.status === "error" ? `${t("balance.unavailable")}: ${state.message}` : t("balance.loading");
			const rowStyle = {
				display: "flex",
				alignItems: "center",
				gap: 7,
				width: "100%",
				boxSizing: "border-box",
				border: "none",
				background: "none",
				cursor: "pointer",
				padding: "7px 4px",
				font: "inherit",
				fontSize: 14,
				fontWeight: 700,
				lineHeight: "20px",
				color: low ? "var(--dsw-alias-state-warn-primary)" : "var(--dsw-alias-label-primary)",
				whiteSpace: "nowrap",
				overflow: "hidden",
				textAlign: "left"
			};
			return (0, react_jsx_runtime.jsxs)(react.Fragment, {
				children: [
					(0, react_jsx_runtime.jsx)("button", {
						ref: buttonRef,
						type: "button",
						style: rowStyle,
						title,
						"aria-label": `${t("balance.title")}: ${label}`,
						onClick: openPopover,
						children: [(0, react_jsx_runtime.jsx)(WalletIcon, {
							size: 16,
							flex: "none",
							"aria-hidden": "true"
						}), (0, react_jsx_runtime.jsx)("span", {
							style: {
								overflow: "hidden",
								textOverflow: "ellipsis"
							},
							children: label
						})]
					}),
					(0, react_jsx_runtime.jsx)(BalancePopover, {
						open,
						anchor,
						popoverRef,
						onClose: () => {
							setOpen(false);
						},
						title: t("balance.title"),
						hint: t("balance.detailHint"),
						closeLabel: t("balance.close"),
						footer: (0, react_jsx_runtime.jsxs)(react.Fragment, {
							children: [
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: {
										padding: "6px 12px",
										border: "1px solid var(--dsw-alias-border-l2)",
										borderRadius: 8,
										background: "var(--dsw-alias-button-elevated-fill)",
										color: "var(--dsw-alias-label-primary)",
										font: "inherit",
										fontSize: 13,
										cursor: "pointer"
									},
									onClick: refresh,
									children: t("balance.refresh")
								}),
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: {
										padding: "6px 12px",
										border: "none",
										borderRadius: 8,
										background: "none",
										color: "var(--dsw-alias-label-secondary)",
										font: "inherit",
										fontSize: 13,
										cursor: "pointer"
									},
									onClick: () => {
										setOpen(false);
									},
									children: t("balance.close")
								})
							]
						}),
						children: (0, react_jsx_runtime.jsx)(BalanceDetailBody, {
							state,
							info,
							low,
							formatAmount,
							onRetry: refresh,
							t
						})
					})
				]
			});
		}
		/**
		* Wallet glyph for the balance entry: a rounded wallet body with a
		* closure line and a coin, drawn with currentColor so it follows the
		* surrounding label color.
		* @param props - icon size in pixels.
		* @returns the svg element.
		*/
		function WalletIcon({ size = 14 }) {
			return (0, react_jsx_runtime.jsx)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				xmlns: "http://www.w3.org/2000/svg",
				"aria-hidden": "true",
				children: [
					(0, react_jsx_runtime.jsx)("path", {
						d: "M2.5 4.3h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-9a2 2 0 0 1-2-2V4.3Z",
						stroke: "currentColor",
						strokeWidth: 1.25,
						strokeLinejoin: "round"
					}),
					(0, react_jsx_runtime.jsx)("path", {
						d: "M2.5 6h11",
						stroke: "currentColor",
						strokeWidth: 1.25,
						strokeLinecap: "round"
					}),
					(0, react_jsx_runtime.jsx)("circle", {
						cx: 11,
						cy: 9.5,
						r: 1.8,
						stroke: "currentColor",
						strokeWidth: 1.1
					}),
					(0, react_jsx_runtime.jsx)("circle", {
						cx: 11,
						cy: 9.5,
						r: 0.75,
						fill: "currentColor"
					})
				]
			});
		}
		/**
		* Anchored details popover for the balance entry: a themed card pinned
		* just above the trigger button (fixed positioning from the button's
		* measured rect, so the popover stays put regardless of the sidebar's
		* own layout), with title, optional hint, body, and footer. Closes on
		* outside pointer-down, Escape, or the close button (outside-click
		* detection lives in the owner via `popoverRef`).
		* @param props - open flag, the anchor rect, a ref for outside-click detection, and card content.
		* @returns null when closed or unanchored; otherwise the popover tree.
		*/
		function BalancePopover({ open, anchor, popoverRef, onClose, title, hint, closeLabel, footer, children }) {
			if (!open || anchor === null) return null;
			const width = Math.min(340, Math.max(220, window.innerWidth - 16));
			const left = Math.max(8, Math.min(anchor.right - width, window.innerWidth - width - 8));
			const preferAbove = anchor.top > 320;
			const avail = preferAbove ? anchor.top - 16 : window.innerHeight - anchor.bottom - 16;
			const maxHeight = Math.max(140, Math.min(Math.round(window.innerHeight * 0.7), avail));
			const style = {
				position: "fixed",
				zIndex: 1000,
				left,
				width,
				maxHeight,
				overflow: "auto",
				boxSizing: "border-box",
				background: "var(--dsw-alias-bg-layer-1)",
				border: "1px solid var(--dsw-alias-border-l2)",
				borderRadius: 12,
				boxShadow: "var(--dsw-shadow-lv3)",
				padding: "14px 14px 10px"
			};
			if (preferAbove) style.bottom = window.innerHeight - anchor.top + 8;
			else style.top = anchor.bottom + 8;
			return (0, react_jsx_runtime.jsxs)("div", {
				ref: popoverRef,
				role: "dialog",
				"aria-label": title,
				style,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							gap: 8,
							marginBottom: 4
						},
						children: [
							(0, react_jsx_runtime.jsx)("h2", {
								style: {
									margin: 0,
									fontSize: 15,
									fontWeight: 600,
									color: "var(--dsw-alias-label-primary)",
									lineHeight: "22px"
								},
								children: title
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": closeLabel,
								style: {
									border: "none",
									background: "none",
									cursor: "pointer",
									padding: 4,
									display: "inline-flex",
									color: "var(--dsw-alias-label-secondary)"
								},
								onClick: onClose,
								children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, {
									size: 14
								})
							})
						]
					}),
					hint !== void 0 && (0, react_jsx_runtime.jsx)("p", {
						style: {
							margin: "0 0 8px",
							fontSize: 12,
							lineHeight: "18px",
							color: "var(--dsw-alias-label-secondary)"
						},
						children: hint
					}),
					(0, react_jsx_runtime.jsx)("div", {
						style: {
							padding: "4px 0 8px"
						},
						children
					}),
					footer !== void 0 && (0, react_jsx_runtime.jsx)("div", {
						style: {
							display: "flex",
							justifyContent: "flex-end",
							gap: 8,
							paddingTop: 10,
							borderTop: "1px solid var(--dsw-alias-border-l1)"
						},
						children: footer
					})
				]
			});
		}
		/**
		* Body of the balance details dialog: a large total figure, the account
		* availability and check time, and one row per balance-info entry
		* (currency, topped-up, granted). Loading and failure states render their
		* own compact copy with a retry control.
		* @param props - the fetch state, the first balance-info row, formatters, and the bound dictionary.
		* @returns the dialog body element tree.
		*/
		function BalanceDetailBody({ state, info, low, formatAmount, onRetry, t }) {
			const textStyle = {
				color: "var(--dsw-alias-label-primary)",
				fontSize: 13,
				lineHeight: "20px",
				margin: "4px 0"
			};
			const rowStyle = {
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				gap: 12,
				padding: "4px 0",
				fontSize: 13,
				lineHeight: "20px"
			};
			const labelStyle = {
				color: "var(--dsw-alias-label-secondary)"
			};
			const valueStyle = {
				color: "var(--dsw-alias-label-primary)",
				fontWeight: 500
			};
			const row = (label, value) => (0, react_jsx_runtime.jsxs)("div", {
				style: rowStyle,
				children: [(0, react_jsx_runtime.jsx)("span", {
					style: labelStyle,
					children: label
				}), (0, react_jsx_runtime.jsx)("span", {
					style: valueStyle,
					children: value
				})]
			});
			const buttonStyle = {
				marginTop: 8,
				padding: "6px 12px",
				border: "1px solid var(--dsw-alias-border-l2)",
				borderRadius: 8,
				background: "var(--dsw-alias-button-elevated-fill)",
				color: "var(--dsw-alias-label-primary)",
				font: "inherit",
				fontSize: 13,
				cursor: "pointer"
			};
			if (state.status === "loading") return (0, react_jsx_runtime.jsx)("p", {
				style: textStyle,
				children: t("balance.loading")
			});
			if (state.status === "error") return (0, react_jsx_runtime.jsxs)("div", {
				children: [(0, react_jsx_runtime.jsx)("p", {
					role: "alert",
					style: {
						...textStyle,
						color: "var(--dsw-alias-state-error-primary)"
					},
					children: state.message
				}), (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					style: buttonStyle,
					onClick: onRetry,
					children: t("balance.retryAction")
				})]
			});
			if (info === void 0) return (0, react_jsx_runtime.jsx)("p", {
				style: textStyle,
				children: t("balance.unavailable")
			});
			const checkedAt = new Date(state.value.checkedAt);
			return (0, react_jsx_runtime.jsxs)("div", {
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						style: {
							fontSize: 24,
							fontWeight: 600,
							lineHeight: "32px",
							color: low ? "var(--dsw-alias-state-warn-primary)" : "var(--dsw-alias-label-primary)",
							marginBottom: 8
						},
						children: formatAmount(info.currency, info.totalBalance)
					}),
					low && (0, react_jsx_runtime.jsx)("p", {
						role: "status",
						style: {
							margin: "0 0 8px",
							fontSize: 12,
							lineHeight: "18px",
							color: "var(--dsw-alias-state-warn-primary)"
						},
						children: t("balance.low")
					}),
					row(t("balance.account"), state.value.isAvailable ? t("balance.available") : t("balance.notAvailable")),
					row(t("balance.currency"), info.currency),
					row(t("balance.toppedUp"), formatAmount(info.currency, info.toppedUpBalance)),
					row(t("balance.granted"), formatAmount(info.currency, info.grantedBalance)),
					row(t("balance.updatedAt"), checkedAt.toLocaleString())
				]
			});
		}
		//#endregion
		//#region lib/types/client/locales.js
		/** `sidebar` namespace dictionaries: shell controls (brand row, New Session, fold toggle). */
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"session.new": "新会话",
			"session.new.label": "新建会话",
			"toggle.open": "打开侧边栏",
			"toggle.collapse": "收起侧边栏",
			"balance.title": "API $$",
			"balance.shortLabel": "API 余额",
			"balance.loading": "余额…",
			"balance.unavailable": "余额不可用",
			"balance.retry": "点击刷新余额",
			"balance.total": "总额",
			"balance.granted": "赠送",
			"balance.toppedUp": "充值",
			"balance.close": "关闭",
			"balance.refresh": "刷新",
			"balance.retryAction": "重试",
			"balance.available": "账户可用",
			"balance.notAvailable": "账户不可用",
			"balance.account": "账户状态",
			"balance.updatedAt": "更新时间",
			"balance.low": "余额偏低，建议及时充值",
			"balance.currency": "币种",
			"balance.detail": "余额详情",
			"balance.detailHint": "点击刷新获取最新余额"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"session.new": "New Session",
			"session.new.label": "New session",
			"toggle.open": "Open sidebar",
			"toggle.collapse": "Collapse sidebar",
			"balance.title": "API $$",
			"balance.shortLabel": "API Balance",
			"balance.loading": "Balance…",
			"balance.unavailable": "Balance unavailable",
			"balance.retry": "Click to refresh balance",
			"balance.total": "Total",
			"balance.granted": "Granted",
			"balance.toppedUp": "Topped up",
			"balance.close": "Close",
			"balance.refresh": "Refresh",
			"balance.retryAction": "Retry",
			"balance.available": "Account available",
			"balance.notAvailable": "Account unavailable",
			"balance.account": "Account status",
			"balance.updatedAt": "Updated",
			"balance.low": "Balance is low, consider topping up",
			"balance.currency": "Currency",
			"balance.detail": "Balance details",
			"balance.detailHint": "Click to refresh for the latest balance"
		};
		//#endregion
		//#region lib/types/client/index.js
		/** Dictionary namespace owned by this plugin (shell controls copy). */
		const NS = "sidebar";
		/** Services required by the sidebar plugin. */
		const inject = [
			"slots",
			"layout",
			"sessions",
			"workspaces",
			"locale"
		];
		/** Registers the sidebar shell and its service callbacks.
		* @param ctx - Client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-sidebar: dictionaries");
			const injectProps = () => ({
				startSession: (workspaceId) => {
					ctx.workspaces.startSession(workspaceId);
				},
				toggleSidebar: () => {
					ctx.layout.toggleSidebar();
				}
			});
			ctx.effect(() => ctx.slots.register({
				name: "sidebar",
				locale: NS,
				children: {
					"sidebar.workspaces": {
						kind: "single",
						scope: "root"
					},
					"sidebar.settings": {
						kind: "single",
						scope: "root"
					},
					"sidebar.footer.action": {
						kind: "list",
						scope: "root"
					}
				},
				inject: injectProps
			}, SidebarRoot), "ui-sidebar: slot registration");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
