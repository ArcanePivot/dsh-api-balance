<#
Remove the native API $$ bundle and, when present, restore the old v0.4.x
core-file patch. DSH sessions and retained usage history are never removed.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$Profile = "web",
    [switch]$LegacyOnly
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2.0

$packageName = "@arcanepivot/dsh-api-balance"
$projectRoot = $PSScriptRoot
. (Join-Path $projectRoot "scripts\common.ps1")

function Restore-LegacyApiBalancePatch {
    param([Parameter(Mandatory = $true)][string]$BackupRoot)

    $install = Get-DshApiBalanceInstall
    Assert-DshApiBalanceSupportedInstall $install
    $entries = Get-DshApiBalanceEntries -Install $install -ProjectRoot $projectRoot -BackupRoot $BackupRoot
    Assert-DshApiBalanceFilesExist $entries
    $manifest = Get-DshApiBalanceManifest $BackupRoot
    Assert-DshApiBalanceManifest -Manifest $manifest -Install $install -Entries $entries

    $alreadyPristine = @($entries | Where-Object {
        (Get-DshApiBalanceTargetState -Entry $_ -Manifest $manifest) -eq "original"
    })
    foreach ($entry in $entries) {
        if ((Get-DshApiBalanceTargetState -Entry $entry -Manifest $manifest) -eq "unknown") {
            throw "Refusing to overwrite an unrecognized legacy file: $($entry.RelativePath)"
        }
    }

    if (-not $PSCmdlet.ShouldProcess($install.DshRoot, "Restore the v0.4.x pristine DSH files")) {
        return
    }
    if ($alreadyPristine.Count -eq $entries.Count) {
        Remove-Item -LiteralPath $BackupRoot -Recurse -Force
        Write-Host "Legacy DSH files were already pristine; removed stale patch state."
        return
    }

    $transactionRoot = New-DshApiBalanceTransactionBackup $entries
    try {
        foreach ($entry in $entries) {
            $record = $manifest.files | Where-Object { $_.path -eq $entry.RelativePath } | Select-Object -First 1
            Copy-Item -LiteralPath $entry.Backup -Destination $entry.Target -Force
            if ((Get-DshApiBalanceSha256 $entry.Target) -ne [string]$record.originalSha256) {
                throw "Post-restore checksum mismatch: $($entry.RelativePath)"
            }
            Write-Host "  restored legacy file: $($entry.RelativePath)"
        }
    } catch {
        Write-Warning "Legacy restore failed. Putting the pre-migration files back."
        Restore-DshApiBalanceTransaction -Entries $entries -TransactionRoot $transactionRoot
        throw
    } finally {
        Remove-Item -LiteralPath $transactionRoot -Recurse -Force -ErrorAction SilentlyContinue
    }

    Remove-Item -LiteralPath $BackupRoot -Recurse -Force
    if (Test-Path -LiteralPath $BackupRoot) {
        throw "Legacy files were restored, but patch state could not be removed: $BackupRoot"
    }
    Write-Host "Legacy v0.4.x core-file patch removed without touching DSH sessions."
}

$legacyRoots = @(
    (Join-Path $projectRoot "backup"),
    (Join-Path $projectRoot "backup-macos")
)
$legacyRoot = $legacyRoots | Where-Object { Test-Path -LiteralPath $_ -PathType Container } | Select-Object -First 1
if ($null -ne $legacyRoot) {
    Restore-LegacyApiBalancePatch -BackupRoot $legacyRoot
}
if ($LegacyOnly) {
    if ($null -eq $legacyRoot) { Write-Host "No legacy v0.4.x patch state found." }
    return
}

if ($null -eq (Get-Command dsh -ErrorAction SilentlyContinue)) {
    throw "Required command not found: dsh"
}
$dshHome = if ([string]::IsNullOrWhiteSpace($env:DSH_HOME)) { Join-Path $HOME ".dsh" } else { $env:DSH_HOME }
$profileManifest = Join-Path (Join-Path (Join-Path $dshHome "profiles") $Profile) "package.json"
$installed = $false
if (Test-Path -LiteralPath $profileManifest -PathType Leaf) {
    $manifest = Get-Content -LiteralPath $profileManifest -Raw | ConvertFrom-Json
    $installed = $null -ne $manifest.dependencies.PSObject.Properties[$packageName]
}
if (-not $installed) {
    Write-Host "API `$`$ is not installed in profile $Profile; nothing to remove."
    return
}
if (-not $PSCmdlet.ShouldProcess("DSH profile $Profile", "Remove native bundle $packageName")) {
    return
}

& dsh plugin --profile $Profile remove $packageName
if ($LASTEXITCODE -ne 0) { throw "dsh plugin remove failed with exit code $LASTEXITCODE." }
$manifest = Get-Content -LiteralPath $profileManifest -Raw | ConvertFrom-Json
if ($null -ne $manifest.dependencies.PSObject.Properties[$packageName]) {
    throw "Package still appears in the DSH profile after removal."
}

Write-Host ""
Write-Host "API `$`$ was removed completely from profile $Profile. DSH sessions remain intact."
Write-Host "Restart dsh web once, then refresh the browser."
