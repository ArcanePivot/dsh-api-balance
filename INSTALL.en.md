# API $$ installation and maintenance

[简体中文](INSTALL.md) | [English](INSTALL.en.md) | [Back to README](README.en.md)

This guide covers download, install, restart, verification, uninstall, upgrades, and common failures. The installer supports only a global npm installation of `@deepseek-ai/dsh@0.1.0-rc.6`.

## Before installing

1. Install Node.js and npm.
2. Install the exact supported DSH version globally:

   ```sh
   npm install -g @deepseek-ai/dsh@0.1.0-rc.6
   ```

3. Confirm the version:

   ```sh
   dsh --version
   ```

4. Save the DeepSeek API key under `Settings -> Models`, or expose `DEEPSEEK_API_KEY` to the process that launches DSH.
5. Make sure no other patch has changed `dsh-host-apiproxy/lib/index.js` or `dsh-client-ui-sidebar/lib/client.js`. The first install verifies the official SHA-256 values.

> [!NOTE]
> Running only `npx @deepseek-ai/dsh web` is not a global installation. API $$ needs a stable global DSH directory that the installer can locate.

## Get the project

Pin the formal release tag so a future `main` update cannot install unreleased code unexpectedly:

```sh
git clone --branch v0.4.0 --depth 1 https://github.com/ArcanePivot/dsh-api-balance.git
cd dsh-api-balance
```

You can also download the source archive from the [`v0.4.0` release page](https://github.com/ArcanePivot/dsh-api-balance/releases/tag/v0.4.0). Open a terminal in the extracted directory containing `install.ps1` and `install.sh`.

## Windows

### Install

Run in PowerShell:

```powershell
.\install.ps1 -WhatIf
.\install.ps1
```

`-WhatIf` validates the version, source files, target files, and backup state without writing to DSH. The first real install stores official files and a checksum manifest in `backup/`.

If Windows blocks scripts downloaded from the internet, remove the download marker only from this project:

```powershell
Get-ChildItem -Recurse -File | Unblock-File
.\install.ps1 -WhatIf
```

Do not permanently weaken the machine-wide PowerShell execution policy for this project.

### Restart

For a manually launched DSH process on the official default port `3080`:

```powershell
.\relaunch-dsh-web.ps1
```

For a custom address or port:

```powershell
.\relaunch-dsh-web.ps1 -HostAddress "127.0.0.1" -Port 34567
```

If Task Scheduler owns DSH, restart the original task instead of launching a second process:

```powershell
.\relaunch-dsh-web.ps1 -TaskName "<your DSH task name>"
```

This preserves the task's `DSH_HOME`, API key, proxy, permission mode, and hidden-window settings.

### Uninstall

```powershell
.\uninstall.ps1 -WhatIf
.\uninstall.ps1
.\relaunch-dsh-web.ps1
```

Use the `-TaskName` form for the last command when Task Scheduler owns DSH.

## macOS

### Install

```bash
./install.sh --dry-run
./install.sh
```

If a downloaded source archive loses executable bits, invoke the script explicitly through Bash:

```bash
bash ./install.sh --dry-run
bash ./install.sh
```

The first install stores official files and a checksum manifest in `backup-macos/`.

### Restart

For a manually launched DSH process on the official default port `3080`:

```bash
./relaunch-dsh-web.sh
```

For a custom address or port:

```bash
./relaunch-dsh-web.sh --host 127.0.0.1 --port 34567
```

If launchd owns DSH, restart the original service:

```bash
./relaunch-dsh-web.sh --launchd-label "<your launchd label>"
```

The default service domain is `gui/<current user UID>`. Add `--launchd-domain system` for a system service.

### Uninstall

```bash
./uninstall.sh --dry-run
./uninstall.sh
./relaunch-dsh-web.sh
```

Use the `--launchd-label` form for the last command when launchd owns DSH.

## Verify the result

1. Refresh the browser once without clearing site data.
2. Confirm that `API 余额` or `API Balance` appears at the bottom of the sidebar.
3. Click it and confirm that the `API $$` details popover opens.
4. Refresh the balance and verify account status, currency, topped-up balance, granted balance, and timestamp.
5. Select `All / V4 Flash / V4 Pro` and confirm that each model updates Today, This week, This month, All time, estimated cost, and the daily chart.
6. Switch `Before change / Off-peak / Peak` in the price section and confirm the CNY-per-million-Token rates for cache-hit input, cache-miss input, and output.
7. Switch to the previous month and back; future dates in the current month should remain zero.
8. Confirm that existing projects, sessions, and conversation history are unchanged.

The first usage-panel open may scan retained local session logs. Unchanged sessions reuse an in-process cache, so later refreshes are usually faster.

The installer is idempotent. If the target files already match this project and the backup is valid, it does not overwrite them again. Promoting an identical release candidate to the final release updates only the backup-manifest version.

## Upgrade from an older API $$ release

The safest path is to reuse the original project directory because its `backup/` or `backup-macos/` contains the verified pristine files:

```sh
git fetch --tags
git checkout v0.4.0
```

Then run `.\install.ps1 -WhatIf` and `.\install.ps1` on Windows, or `./install.sh --dry-run` and `./install.sh` on macOS. From `v0.2.0` or `v0.3.0`, the installer verifies that the targets match the previous patch, replaces both files transactionally, and updates the manifest. From `v0.4.0-rc.1`, identical files only promote the manifest version. Conversation history is not involved.

If you downloaded `v0.4.0` into a new directory, first use the old directory's uninstaller to restore the official files, then install from the new directory. Never copy a backup directory from another machine or DSH version, and do not bypass the official-file guard.

## Upgrade DSH

Use this order:

1. Run this project's uninstaller to restore official files.
2. Restart and confirm that DSH still opens normally.
3. Upgrade DSH.
4. Wait for an API $$ release that exactly matches the new DSH version.

Do not rerun an old installer after upgrading DSH. The version and SHA-256 guards exist to prevent old code from overwriting a new release.

## Troubleshooting

### Global DSH cannot be found

The error contains `Could not locate a global @deepseek-ai/dsh installation` or `could not locate a global`.

```sh
npm install -g @deepseek-ai/dsh@0.1.0-rc.6
npm root -g
```

Run the installer and DSH under the same user and the same Node/npm installation.

### Unsupported DSH version

This release supports only `0.1.0-rc.6`. Do not bypass the check. Restore or install the supported version, or wait for a matching API $$ release.

### Target file is not an official original

On first install, both target files must match the official npm package. If another patch is present, use that project's uninstaller first. If the state is unclear, reinstall official DSH and rerun `-WhatIf` or `--dry-run`.

### Balance unavailable

Check in this order:

1. The DeepSeek key is saved under `Settings -> Models`.
2. When using an environment variable, the restarted DSH service actually inherits `DEEPSEEK_API_KEY`.
3. A custom `baseURL` is trusted, reachable, and supports `/user/balance`.
4. If a reverse proxy fronts DSH, same-origin `/api/llm.balance` still reaches the original DSH host.

Never paste an API key, account-balance screenshot, or private URL into a public issue.

A balance-route failure does not block local usage aggregation. The usage route needs no API key and makes no request to DeepSeek.

### Usage is zero or incomplete

This panel reports retained local DSH sessions, not the official DeepSeek account-wide bill. Check that:

1. Calls used DSH's official `deepseek-official` provider and the provider returned Token usage.
2. Their session logs still exist under the current `DSH_HOME`; deleted sessions cannot be backfilled.
3. Calls made on other computers, by other clients, or directly against the API are intentionally excluded.
4. Dates use the browser timezone, and the current week begins Monday at midnight.

Copied history at the start of forked sessions is excluded to prevent double-counting the same Tokens.

### Old UI remains after restart

Confirm that you restarted the DSH process and port serving the current page, then perform a normal refresh. Site-data deletion is unnecessary and can remove local UI preferences.

### Uninstaller refuses to overwrite

The target file, backup manifest, or SHA-256 no longer matches. The uninstaller stops rather than overwriting a third-party change. Keep the complete error and open an issue only after removing keys and private paths.

## Local verification

With Bash, Git, npm, and Node available, run the same core checks used by CI:

```bash
./scripts/verify-patches.sh
```

The verifier downloads official npm packages into a temporary directory. It does not install DSH permanently on the current machine.
