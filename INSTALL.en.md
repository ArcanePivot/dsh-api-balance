# API $$ installation and maintenance

[简体中文](INSTALL.md) | [English](INSTALL.en.md) | [Back to README](README.en.md)

`v0.5.x` is a native DSH Cordis bundle. A normal install changes only the selected profile manifest. It does not overwrite npm files or modify the session directory.

## Prerequisites

1. Install Node.js `20.16+`, pnpm, and the tested DSH baseline:

   ```sh
   corepack enable
   npm install -g @deepseek-ai/dsh@0.1.0-rc.6
   dsh --version
   pnpm --version
   ```

2. Save the DeepSeek API key under `Settings -> Models`, or expose `DEEPSEEK_API_KEY` to the DSH process.
3. Download the current `.tgz` asset from [Releases](https://github.com/ArcanePivot/dsh-api-balance/releases).
4. Pick a profile. The regular Web UI uses `web`.

## Install with DSH directly

```sh
dsh plugin --profile web add ./arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz
dsh --profile web --dump-config
```

The dump should contain:

```text
name: '@arcanepivot/dsh-api-balance'
```

This is the recommended first-install path and uses the official DSH profile/bundle mechanism.

## Windows wrapper

The wrapper also migrates a legacy `v0.4.x` patch and verifies the resulting profile.

```powershell
.\install.ps1 -PackageSpec .\arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz -WhatIf
.\install.ps1 -PackageSpec .\arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz
```

Custom profile:

```powershell
.\install.ps1 -Profile my-web -PackageSpec .\arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz
```

If Windows blocks downloaded scripts, unblock only this checkout rather than weakening the machine-wide policy:

```powershell
Get-ChildItem -Recurse -File | Unblock-File
```

## macOS wrapper

```bash
./install.sh --package-spec ./arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz --dry-run
./install.sh --package-spec ./arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz
```

Custom profile:

```bash
./install.sh --profile my-web --package-spec ./arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz
```

If archive extraction removed executable bits, call the script through `bash ./install.sh ...`.

## Restart DSH

The host loads bundles at startup, so a browser refresh alone is not enough after install.

For a manually started server on the official default port:

```powershell
# Windows
.\relaunch-dsh-web.ps1
```

```bash
# macOS
./relaunch-dsh-web.sh
```

Custom port:

```powershell
.\relaunch-dsh-web.ps1 -HostAddress "127.0.0.1" -Port 34567
```

```bash
./relaunch-dsh-web.sh --host 127.0.0.1 --port 34567
```

If Task Scheduler or launchd owns DSH, restart that service rather than creating a second process:

```powershell
.\relaunch-dsh-web.ps1 -TaskName "<task name>"
```

```bash
./relaunch-dsh-web.sh --launchd-label "<launchd label>"
```

## Acceptance check

1. Refresh normally without clearing site data.
2. The sidebar shows `API Balance ¥xx · Today ¥xx` or its Chinese equivalent.
3. Clicking it opens the `API $$` panel.
4. `All / V4 Flash / V4 Pro` updates the four Token/cost totals and daily bars.
5. The pricing section switches among legacy, off-peak, and peak schedules and links the official source.
6. Existing projects, sessions, and conversations remain present.

If balance lookup fails while local usage works, check the DeepSeek key, `baseURL`, and DSH process environment. The plugin does not return the key or upstream error body to the browser.

## Migrate from v0.4.x

The safest path keeps the original checkout and its untracked `backup/` or `backup-macos/` directory:

```sh
git fetch --tags
git checkout v0.5.0-rc.1
```

Then run the platform wrapper with an explicit `.tgz`. It verifies the old state, restores pristine DSH files, removes legacy state, and installs the native bundle.

Migration protection includes:

- stop on a backup SHA-256 mismatch;
- stop when a target is neither the known official file nor a known legacy patch;
- transactionally restore the pre-migration files if restoration fails;
- never involve `DSH_HOME/sessions`.

If the old checkout is gone, do not copy a backup from another machine. Recover the matching local `v0.4.2` checkout and backup to uninstall, or reinstall that exact DSH version to restore official files before installing the native release.

## Upgrade the plugin

Run `add` again against the same profile:

```sh
dsh plugin --profile web add ./arcanepivot-dsh-api-balance-<new-version>.tgz
```

Restart DSH and verify the UI. The plugin owns no usage database; analytics continue to use DSH-retained sessions.

## Upgrade DSH

The native plugin no longer requires restoring core files first, but Harness is a developer preview and its services or slots can still change. Recommended sequence:

1. Confirm API $$ declares support for the target DSH version.
2. Temporarily remove the plugin.
3. Upgrade and verify DSH.
4. Install the compatible API $$ release.

Native isolation is not a reason to skip compatibility testing.

## Uninstall

Direct removal:

```sh
dsh plugin --profile web remove @arcanepivot/dsh-api-balance
```

Or use the wrappers:

```powershell
.\uninstall.ps1 -WhatIf
.\uninstall.ps1
```

```bash
./uninstall.sh --dry-run
./uninstall.sh
```

If legacy `v0.4.x` state is present, the wrappers restore it safely first. Restart DSH afterwards. Removal does not delete the downloaded source directory or DSH sessions.

## Troubleshooting

### `dsh` or `pnpm` is missing

Make sure the installer and DSH run under the same user and PATH:

```sh
command -v dsh
command -v pnpm
```

On Windows:

```powershell
Get-Command dsh
Get-Command pnpm
```

### No plugin row in `dump-config`

Verify that the profile name matches:

```sh
dsh --profile web --dump-config
```

The default manifest is `$DSH_HOME/profiles/web/package.json`, or `~/.dsh/profiles/web/package.json` when `DSH_HOME` is unset.

### The panel does not appear

The host bundle loads only when DSH starts. Confirm the original process was restarted, the Web UI uses the same `DSH_HOME` and profile, and startup logs contain no plugin load error.

### Usage is lower than the official bill

This is an expected boundary. The plugin aggregates retained sessions on this DSH host only. Deleted logs and calls from other clients are absent. The DeepSeek bill remains authoritative.

### Legacy migration refuses to overwrite

The current DSH file or backup is not in a recognized state. The installer stops to protect third-party changes. Preserve the full error and redact keys, balances, usernames, and private paths before opening an issue.
