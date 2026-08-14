<#
Restores the pristine DSH files saved by install.ps1.

The uninstaller verifies the backup manifest and checksums before changing
anything. If a restore fails, it puts the pre-uninstall files back.

Usage:
    .\uninstall.ps1
    .\uninstall.ps1 -WhatIf
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2.0

$projectRoot = $PSScriptRoot
$backupRoot = Join-Path $projectRoot "backup"
. (Join-Path $projectRoot "scripts\common.ps1")

if (-not (Test-Path -LiteralPath $backupRoot -PathType Container)) {
    Write-Host "No backup directory found; nothing to restore."
    exit 0
}

$install = Get-DshApiBalanceInstall
Assert-DshApiBalanceSupportedInstall $install
$entries = Get-DshApiBalanceEntries -Install $install -ProjectRoot $projectRoot -BackupRoot $backupRoot
Assert-DshApiBalanceFilesExist $entries
$manifest = Get-DshApiBalanceManifest $backupRoot
Assert-DshApiBalanceManifest -Manifest $manifest -Install $install -Entries $entries

Write-Host "DSH: $($install.DshRoot)"
Write-Host "Version: $($install.DshVersion) (supported)"

$alreadyPristine = @($entries | Where-Object {
    $entry = $_
    $record = $manifest.files | Where-Object { $_.path -eq $entry.RelativePath } | Select-Object -First 1
    (Get-DshApiBalanceSha256 $entry.Target) -eq [string]$record.originalSha256
})

foreach ($entry in $entries) {
    if ((Get-DshApiBalanceTargetState -Entry $entry -Manifest $manifest) -eq "unknown") {
        throw "Refusing to overwrite an unrecognized file: $($entry.RelativePath)"
    }
}

if ($alreadyPristine.Count -eq $entries.Count) {
    Write-Host "The pristine DSH files are already restored; no files changed."
    exit 0
}

if (-not $PSCmdlet.ShouldProcess($install.DshRoot, "Restore the pristine DSH files")) {
    return
}

$transactionRoot = New-DshApiBalanceTransactionBackup $entries
try {
    foreach ($entry in $entries) {
        $record = $manifest.files | Where-Object { $_.path -eq $entry.RelativePath } | Select-Object -First 1
        Copy-Item -LiteralPath $entry.Backup -Destination $entry.Target -Force
        $actual = Get-DshApiBalanceSha256 $entry.Target
        if ($actual -ne [string]$record.originalSha256) {
            throw "Post-restore checksum mismatch: $($entry.RelativePath)"
        }
        Write-Host "  restored: $($entry.RelativePath)"
    }

    $manifest.lastUninstalledAtUtc = [DateTime]::UtcNow.ToString("o")
    Write-DshApiBalanceJson -Path (Join-Path $backupRoot "manifest.json") -Value $manifest
} catch {
    Write-Warning "Restore failed. Putting the pre-uninstall files back."
    Restore-DshApiBalanceTransaction -Entries $entries -TransactionRoot $transactionRoot
    throw
} finally {
    Remove-Item -LiteralPath $transactionRoot -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Restored $($entries.Count) pristine files successfully."
Write-Host "Restart dsh web, then refresh the browser."
