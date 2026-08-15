# Security

## Supported versions

Only the version listed below receives compatibility and security fixes:

| API $$ | DeepSeek Harness |
| --- | --- |
| `0.4.x` | `0.1.0-rc.6` only |

Do not bypass the installer version or SHA-256 checks. Restore the official DSH files before upgrading DSH, then wait for a matching API $$ release.

## Data flow

- The browser calls the same-origin DSH route `/api/llm.balance` without an API key.
- The DSH host resolves `DEEPSEEK_API_KEY` through its credentials service.
- The host sends the key only to the configured DeepSeek `baseURL` and returns normalized balance fields to the browser.
- Error response bodies from the upstream balance API are not forwarded to the browser.
- The browser calls `/api/llm.usage` with a month and IANA timezone. That route needs no API key and makes no external request.
- Usage aggregation reads retained DSH session logs on the host and returns model identifiers, dates, Token totals, estimated costs, call counts, cache ratios, and coverage counts only. It does not return prompts or response text.
- Official price schedules are versioned constants with a public source URL. Opening the panel does not scrape the pricing site or send local usage data to it.
- The plugin creates no usage database and does not duplicate conversation logs. Unchanged per-session aggregates are cached only in the current DSH process.

The account balance and usage totals are account metadata. Anyone who can access the DSH Web UI can also view them after this patch is installed. Keep the DSH Web UI behind the same access controls you use for the rest of DSH.

If you configure a custom DeepSeek `baseURL`, the host sends the API key to that endpoint, matching the configured DeepSeek adapter behavior. Only use endpoints you trust.

## Reporting a vulnerability

Use the repository's [Security tab](https://github.com/ArcanePivot/dsh-api-balance/security) when GitHub private vulnerability reporting is available there.

If the private form is unavailable, open a minimal [security contact request](https://github.com/ArcanePivot/dsh-api-balance/issues/new?title=Security%20contact%20request) containing no technical details and ask the maintainer to arrange a private channel.

Never put credentials, private URLs, account details, local usernames, or unredacted screenshots in a public issue.
