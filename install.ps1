<#
Installs dsh-api-balance into a supported global DSH installation.

The installer validates every source and target before changing anything,
stores checksummed pristine backups, and rolls back the whole operation if a
copy or verification fails.

Usage:
    .\install.ps1
    .\install.ps1 -WhatIf
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2.0

$projectRoot = $PSScriptRoot
$backupRoot = Join-Path $projectRoot "backup"
. (Join-Path $projectRoot "scripts\common.ps1")

$install = Get-DshApiBalanceInstall
Assert-DshApiBalanceSupportedInstall $install
$entries = Get-DshApiBalanceEntries -Install $install -ProjectRoot $projectRoot -BackupRoot $backupRoot
Assert-DshApiBalanceFilesExist $entries

Write-Host "DSH: $($install.DshRoot)"
Write-Host "Version: $($install.DshVersion) (supported)"

$matchingTargets = @($entries | Where-Object {
    (Get-DshApiBalanceSha256 $_.Source) -eq (Get-DshApiBalanceSha256 $_.Target)
})
$backupExists = Test-Path -LiteralPath $backupRoot -PathType Container

if ($matchingTargets.Count -eq $entries.Count) {
    if (-not $backupExists) {
        throw "The patched files are already installed, but no pristine backup exists. Reinstall DSH $script:DshApiBalanceSupportedDshVersion cleanly before using this installer."
    }
    $manifest = Get-DshApiBalanceManifest $backupRoot
    Assert-DshApiBalanceManifest -Manifest $manifest -Install $install -Entries $entries
    Write-Host "dsh-api-balance is already installed; no files changed."
    exit 0
}

if (-not $backupExists -and $matchingTargets.Count -gt 0) {
    throw "Detected a partial or manually patched installation without a pristine backup. Reinstall DSH $script:DshApiBalanceSupportedDshVersion cleanly, then run this installer."
}

$manifest = $null
if ($backupExists) {
    $manifest = Get-DshApiBalanceManifest $backupRoot
    Assert-DshApiBalanceManifest -Manifest $manifest -Install $install -Entries $entries
    foreach ($entry in $entries) {
        if ((Get-DshApiBalanceTargetState -Entry $entry -Manifest $manifest) -eq "unknown") {
            throw "Refusing to overwrite an unrecognized file: $($entry.RelativePath)"
        }
    }
} else {
    Assert-DshApiBalanceOfficialTargets $entries
}

if (-not $PSCmdlet.ShouldProcess($install.DshRoot, "Back up and install dsh-api-balance $script:DshApiBalanceVersion")) {
    return
}

if ($backupExists) {
    # The manifest was validated during preflight so -WhatIf catches problems too.
} else {
    $stagingRoot = "$backupRoot.staging-$PID"
    try {
        New-Item -ItemType Directory -Force -Path $stagingRoot | Out-Null
        $records = @()
        foreach ($entry in $entries) {
            $backupPath = Join-Path $stagingRoot (ConvertTo-NativeRelativePath $entry.RelativePath)
            New-Item -ItemType Directory -Force -Path (Split-Path $backupPath -Parent) | Out-Null
            Copy-Item -LiteralPath $entry.Target -Destination $backupPath -Force
            $records += [pscustomobject]@{
                path = $entry.RelativePath
                originalSha256 = Get-DshApiBalanceSha256 $backupPath
                patchedSha256 = Get-DshApiBalanceSha256 $entry.Source
            }
        }
        $manifest = [ordered]@{
            schemaVersion = 1
            patchVersion = $script:DshApiBalanceVersion
            dshVersion = $install.DshVersion
            createdAtUtc = [DateTime]::UtcNow.ToString("o")
            lastInstalledAtUtc = $null
            lastUninstalledAtUtc = $null
            files = $records
        }
        Write-DshApiBalanceJson -Path (Join-Path $stagingRoot "manifest.json") -Value $manifest
        Move-Item -LiteralPath $stagingRoot -Destination $backupRoot
        Write-Host "Created checksummed pristine backup: $backupRoot"
    } finally {
        if (Test-Path -LiteralPath $stagingRoot) {
            Remove-Item -LiteralPath $stagingRoot -Recurse -Force
        }
    }
    $entries = Get-DshApiBalanceEntries -Install $install -ProjectRoot $projectRoot -BackupRoot $backupRoot
}

$transactionRoot = New-DshApiBalanceTransactionBackup $entries
try {
    foreach ($entry in $entries) {
        Copy-Item -LiteralPath $entry.Source -Destination $entry.Target -Force
        $expected = Get-DshApiBalanceSha256 $entry.Source
        $actual = Get-DshApiBalanceSha256 $entry.Target
        if ($actual -ne $expected) {
            throw "Post-install checksum mismatch: $($entry.RelativePath)"
        }
        Write-Host "  installed: $($entry.RelativePath)"
    }

    $manifest = Get-DshApiBalanceManifest $backupRoot
    $manifest.patchVersion = $script:DshApiBalanceVersion
    $manifest.lastInstalledAtUtc = [DateTime]::UtcNow.ToString("o")
    foreach ($entry in $entries) {
        $record = $manifest.files | Where-Object { $_.path -eq $entry.RelativePath } | Select-Object -First 1
        $record.patchedSha256 = Get-DshApiBalanceSha256 $entry.Source
    }
    Write-DshApiBalanceJson -Path (Join-Path $backupRoot "manifest.json") -Value $manifest
} catch {
    Write-Warning "Installation failed. Restoring the pre-install files."
    Restore-DshApiBalanceTransaction -Entries $entries -TransactionRoot $transactionRoot
    throw
} finally {
    Remove-Item -LiteralPath $transactionRoot -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Installed $($entries.Count) files successfully."
Write-Host "Restart dsh web, then refresh the browser."
Write-Host "Manual process: .\relaunch-dsh-web.ps1"
Write-Host "Scheduled task: .\relaunch-dsh-web.ps1 -TaskName '<your task name>'"
Write-Host "To restore the pristine files: .\uninstall.ps1"
