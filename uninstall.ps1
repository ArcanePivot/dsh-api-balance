<#
Restores the pristine DSH files saved by install.ps1 and removes all
installation state created by this project.

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
    Write-Host 'No API $$ installation state found; nothing to remove.'
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
    if (-not $PSCmdlet.ShouldProcess($backupRoot, 'Remove API $$ installation state')) {
        return
    }
    Remove-Item -LiteralPath $backupRoot -Recurse -Force
    if (Test-Path -LiteralPath $backupRoot) {
        throw ('Could not remove API $$ installation state: {0}' -f $backupRoot)
    }
    Write-Host "The pristine DSH files were already restored; removed the remaining installation state."
    exit 0
}

if (-not $PSCmdlet.ShouldProcess($install.DshRoot, 'Restore the pristine DSH files and remove API $$ installation state')) {
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

} catch {
    Write-Warning "Restore failed. Putting the pre-uninstall files back."
    Restore-DshApiBalanceTransaction -Entries $entries -TransactionRoot $transactionRoot
    throw
} finally {
    Remove-Item -LiteralPath $transactionRoot -Recurse -Force -ErrorAction SilentlyContinue
}

Remove-Item -LiteralPath $backupRoot -Recurse -Force
if (Test-Path -LiteralPath $backupRoot) {
    throw ('Pristine files were restored, but API $$ installation state could not be removed: {0}' -f $backupRoot)
}

Write-Host ""
Write-Host "Restored $($entries.Count) pristine files and removed all project-created installation state."
Write-Host "Restart dsh web, then refresh the browser."
