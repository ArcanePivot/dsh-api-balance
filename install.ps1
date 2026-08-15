<#
Install API $$ as a native DSH bundle.

Examples:
    .\install.ps1
    .\install.ps1 -PackageSpec .\arcanepivot-dsh-api-balance.tgz
    .\install.ps1 -Profile web -WhatIf
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$Profile = "web",
    [string]$PackageSpec = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2.0

$packageName = "@arcanepivot/dsh-api-balance"
$projectRoot = $PSScriptRoot

if ($null -eq (Get-Command dsh -ErrorAction SilentlyContinue)) {
    throw "Required command not found: dsh"
}
if ($null -eq (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    throw "Required command not found: pnpm"
}

if ([string]::IsNullOrWhiteSpace($PackageSpec)) {
    $candidates = @(Get-ChildItem -LiteralPath $projectRoot -Filter "arcanepivot-dsh-api-balance-*.tgz" -File)
    if ($candidates.Count -ne 1) {
        throw "Pass -PackageSpec <release.tgz>, or place exactly one arcanepivot-dsh-api-balance-*.tgz beside install.ps1."
    }
    $PackageSpec = $candidates[0].FullName
}

$legacyRoots = @(
    (Join-Path $projectRoot "backup"),
    (Join-Path $projectRoot "backup-macos")
)
$legacyRoot = $legacyRoots | Where-Object { Test-Path -LiteralPath $_ -PathType Container } | Select-Object -First 1
if ($null -ne $legacyRoot) {
    if ($PSCmdlet.ShouldProcess($legacyRoot, "Restore the v0.4.x core-file patch before native installation")) {
        & (Join-Path $projectRoot "uninstall.ps1") -Profile $Profile -LegacyOnly
    } else {
        Write-Host "Legacy v0.4.x state found at $legacyRoot; pristine DSH files would be restored first."
        return
    }
}

if (-not $PSCmdlet.ShouldProcess("DSH profile $Profile", "Install native bundle $PackageSpec")) {
    return
}

Write-Host "Installing native bundle $PackageSpec into profile $Profile..."
& dsh plugin --profile $Profile add $PackageSpec
if ($LASTEXITCODE -ne 0) { throw "dsh plugin add failed with exit code $LASTEXITCODE." }

$dshHome = if ([string]::IsNullOrWhiteSpace($env:DSH_HOME)) { Join-Path $HOME ".dsh" } else { $env:DSH_HOME }
$profileManifest = Join-Path (Join-Path (Join-Path $dshHome "profiles") $Profile) "package.json"
if (-not (Test-Path -LiteralPath $profileManifest -PathType Leaf)) {
    throw "DSH profile manifest was not created: $profileManifest"
}
$manifest = Get-Content -LiteralPath $profileManifest -Raw | ConvertFrom-Json
$dependency = $manifest.dependencies.PSObject.Properties[$packageName]
$bundles = @($manifest.dsh.profile.bundles)
if ($null -eq $dependency -or $bundles -notcontains $packageName) {
    throw "Native bundle was not added to the DSH profile manifest."
}

$config = (& dsh --profile $Profile --dump-config | Out-String)
if ($LASTEXITCODE -ne 0 -or $config -notmatch [regex]::Escape("name: '$packageName'")) {
    throw "Native plugin row is missing from the composed DSH config."
}

Write-Host ""
Write-Host "API `$`$ is installed as a native DSH plugin."
Write-Host "No DSH package files were overwritten, and retained session history was left in place."
Write-Host "Restart dsh web once, then refresh the browser."
Write-Host "To remove it completely: .\uninstall.ps1 -Profile $Profile"
