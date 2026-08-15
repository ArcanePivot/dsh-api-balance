# Security

## Supported versions

| API $$ | DeepSeek Harness | Status |
| --- | --- | --- |
| `0.5.x` | `0.1.0-rc.6` | Supported native plugin baseline |
| `0.4.x` | `0.1.0-rc.6` | Legacy migration only |

DeepSeek Harness is a developer preview. Test a matching API $$ release before upgrading its host services or browser slots.

## Data flow

- The browser calls same-origin `GET /api/api-balance/balance` without an API key.
- The DSH host resolves the configured DeepSeek key through settings and credentials.
- The host sends the key only to the configured DeepSeek `baseURL` and returns normalized balance fields.
- Upstream error response bodies are not forwarded to the browser.
- The browser calls `GET /api/api-balance/usage` with a month and IANA timezone. This route needs no API key and makes no external request.
- Usage aggregation reads retained DSH session events and returns model identifiers, dates, Token totals, estimated costs, call counts, cache ratios, and coverage counts only. It does not return prompts or response text.
- Official price schedules are versioned constants with a public source URL. Opening the panel does not scrape that site or send local usage to it.
- The plugin creates no usage database and does not duplicate conversation logs. Unchanged per-session aggregates are cached only in the current DSH process.

Both routes accept `GET` only, send `Cache-Control: no-store`, and reject a browser `Origin` whose host differs from the DSH request host.

Balance and usage totals are account metadata. Anyone who can access the DSH Web UI can view them after installation. Keep DSH behind the same authentication and network controls used for the rest of the agent.

If a custom DeepSeek `baseURL` is configured, the host sends the key to that endpoint, matching the DeepSeek adapter behavior. Use only trusted endpoints.

## Installation boundary

The `v0.5.x` tarball contains the native host/client bundle and does not contain legacy patched DSH files. DSH owns installation through the selected profile, and `dsh plugin remove` unregisters the dependency and bundle layer.

The repository keeps old compiled artifacts only so the wrappers can identify and safely remove a local `v0.4.x` patch. They are excluded from the published package. Migration rejects unknown targets and preserves recovery state on failure.

Install only a release asset or commit you have verified. DSH profile installation is host-level code execution, outside an agent sandbox.

## Reporting a vulnerability

Use the repository's [Security tab](https://github.com/ArcanePivot/dsh-api-balance/security) when private vulnerability reporting is available.

If it is unavailable, open a minimal [security contact request](https://github.com/ArcanePivot/dsh-api-balance/issues/new?title=Security%20contact%20request) with no technical details and ask for a private channel.

Never put credentials, private URLs, account details, local usernames, retained conversations, or unredacted screenshots in a public issue.
