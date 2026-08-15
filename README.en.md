<h1 align="center">API $$</h1>

<p align="center"><strong>DeepSeek API balance, local Token analytics, and estimated cost in the native DSH sidebar.</strong></p>

<p align="center">See what V4 Flash and V4 Pro used across pricing windows without opening another site or exposing the API key to the browser.</p>

<p align="center">
  <a href="README.md">简体中文</a> ·
  <strong>English</strong> ·
  <a href="#installation">Install</a> ·
  <a href="INSTALL.en.md">Full guide</a> ·
  <a href="SECURITY.md">Security</a> ·
  <a href="CHANGELOG.md">Changelog</a>
</p>

<p align="center">
  <a href="https://github.com/ArcanePivot/dsh-api-balance/actions/workflows/verify.yml"><img src="https://github.com/ArcanePivot/dsh-api-balance/actions/workflows/verify.yml/badge.svg" alt="Native plugin checks"></a>
  <img src="https://img.shields.io/badge/plugin-native%20Cordis-16a34a?style=flat-square" alt="Native Cordis plugin">
  <img src="https://img.shields.io/badge/tested%20DSH-0.1.0--rc.6-111827?style=flat-square" alt="Tested on DSH 0.1.0-rc.6">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS-2563eb?style=flat-square" alt="Windows and macOS">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-16a34a?style=flat-square" alt="MIT License"></a>
</p>

> [!IMPORTANT]
> `v0.5.x` replaces the old compiled-file patch with a **native Cordis bundle**. Installation and removal use the official `dsh plugin` command, do not overwrite DSH core files, and never touch the session directory. DeepSeek Harness remains a developer preview; the fully tested baseline is currently `@deepseek-ai/dsh@0.1.0-rc.6`.

## UI

| Chinese UI | English UI |
| --- | --- |
| ![Chinese API balance, per-model Token usage, and peak pricing](docs/screenshots/api-balance-zh.png) | ![English API balance, per-model Token usage, and peak pricing](docs/screenshots/api-balance-en.png) |

<details>
<summary>390 px mobile viewport</summary>

<p align="center">
  <img src="docs/screenshots/api-balance-mobile.png" width="360" alt="API $$ per-model usage and pricing in a 390 px mobile viewport">
</p>

</details>

Screenshots use the real DSH Web UI with demo balance, usage, cost, time, and session values.

## Highlights

| Balance and usage together | Host-only key handling | Native, reversible install |
| --- | --- | --- |
| The sidebar shows balance and today's estimated spend; the panel adds per-model usage, trends, and pricing. | The browser calls same-origin DSH routes. The API key is never returned to the client or written into plugin files. | DSH loads the bundle through a profile. Removal unregisters the layer and dependency without leaving core-file changes. |

- Sidebar label: `API Balance ¥xx · Today ¥xx` in English and `API 余额 ¥xx · 今日使用 ¥xx` in Chinese
- Selectable `All / V4 Flash / V4 Pro` views with Tokens, calls, estimated cost, and daily bars
- Today, week, month, and all-time totals; weeks start on Monday
- Price each call with the official CNY schedule active at its timestamp
- Separate cache-hit input, cache-miss input, and output costs
- Daily chart with month navigation and today's cache-hit rate
- Read retained local DSH sessions while excluding copied fork prefixes
- Low-balance warning below `20 CNY`; local usage still works if the balance endpoint fails
- Chinese, English, narrow screens, manual refresh, outside click, and `Esc`

## Installation

### 1. Prepare DSH and the API key

```sh
npm install -g @deepseek-ai/dsh@0.1.0-rc.6
dsh --version
```

Save the DeepSeek key under `Settings -> Models`, or expose `DEEPSEEK_API_KEY` to the DSH process.

### 2. Install the native bundle

Download the current `.tgz` asset from [Releases](https://github.com/ArcanePivot/dsh-api-balance/releases), then run from the download directory:

```sh
dsh plugin --profile web add ./arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz
dsh --profile web --dump-config
```

The dump should contain `@arcanepivot/dsh-api-balance`. Restart the existing `dsh web` process and refresh normally. Do not clear site data; conversations remain unchanged.

The repository also ships wrappers that migrate a legacy patch before installing the bundle:

```powershell
# Windows
.\install.ps1 -PackageSpec .\arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz -WhatIf
.\install.ps1 -PackageSpec .\arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz
```

```bash
# macOS
./install.sh --package-spec ./arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz --dry-run
./install.sh --package-spec ./arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz
```

See the [full install guide](INSTALL.en.md) for custom profiles, managed restarts, and troubleshooting.

## Migrating from v0.4.x

If the original checkout still contains `backup/` or `backup-macos/`, switch that **same directory** to `v0.5.x` and run the wrapper. It verifies the old state, restores the pristine DSH files transactionally, removes the old backup state, and then installs the native bundle. Sessions are not read, copied, or deleted.

Migration stops if a target is neither the known official file nor a known API $$ patch. If the old checkout is gone, recover the matching `v0.4.2` checkout and its backup to uninstall first, then install the native release.

## Architecture

```text
DSH browser client                    DSH host
sidebar.footer.action  ----------->  native sidebar action
shell.overlay          ----------->  native details panel

GET /api/api-balance/balance --->  credentials/settings -> DeepSeek /user/balance
GET /api/api-balance/usage   --->  aggregate retained local DSH session events
                         <---  balance and aggregates only; no key, prompts, or replies
```

The host registers two exact routes with `ctx.webServer.register()`. The client registers UI through the official `sidebar.footer.action` and `shell.overlay` slots. Cordis owns mount and disposal; the plugin no longer rewrites `dsh-host-apiproxy` or `dsh-client-ui-sidebar`.

Usage follows the browser's IANA timezone and Monday-based weeks. Estimated cost separates cache-hit input, cache-miss input, and output Tokens against the [official DeepSeek CNY schedule](https://api-docs.deepseek.com/zh-cn/quick_start/pricing/). Before 2026-08-17 00:00 Beijing time it uses the legacy schedule; afterwards peak windows are 09:00-12:00 and 14:00-18:00, with off-peak pricing otherwise.

Totals cover only retained local DSH sessions. They exclude deleted logs and calls from other clients and are not an official DeepSeek bill. The provider's bill remains authoritative.

## Compatibility

| Item | Tested baseline |
| --- | --- |
| DSH | `0.1.0-rc.6` |
| Node.js | `20.16+` |
| Windows | Windows 10 / 11; Windows PowerShell 5.1 or PowerShell 7 |
| macOS | Bash 3.2 or newer |
| UI | Chinese and English; desktop and 390 px mobile |

Native isolation changes the upgrade risk from “overwriting core files” to “whether official services and slots changed.” It does not justify blind compatibility claims. Every new DSH release still needs type, lifecycle, and real-UI verification.

## Uninstall

```sh
dsh plugin --profile web remove @arcanepivot/dsh-api-balance
```

You can also use `uninstall.ps1` or `uninstall.sh`. Restart DSH and refresh afterwards. The dependency, bundle layer, host routes, and client registrations disappear; retained conversations remain in DSH-owned storage.

## Development

```sh
pnpm install --frozen-lockfile
pnpm run check
pnpm test
pnpm run build
pnpm pack
```

Tests cover model splits, timezone/week boundaries, price transitions, peak windows, fork deduplication, route security, Cordis disposal, native Windows/macOS lifecycles, and legacy migration. A real DSH canary plus Playwright checks desktop and 390 px mobile geometry, text overflow, screenshots, and console errors.

## Community plugin status

DeepSeek Harness currently publishes no “officially certified plugin” badge or reviewed marketplace. Its README asks community plugins to use the installable bundle format and add the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic. This project follows that route but is not a DeepSeek product.

`files/`, `patches/`, and the old checksum tools remain only for safe `v0.4.x -> v0.5.x` migration. They are excluded from the native npm/tarball package.

`API $$` is the display brand. The repository, package, and code identifiers remain `dsh-api-balance` because `$` is special in command shells.

## License

New project code is [MIT licensed](LICENSE). Modified DeepSeek Harness artifacts retained for legacy migration are documented in [Third-party notices](THIRD_PARTY_NOTICES.md).
