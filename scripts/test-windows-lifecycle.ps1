param(
    [string]$OfficialHostPackageDir,
    [string]$OfficialSidebarPackageDir
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2.0

$root = Split-Path $PSScriptRoot -Parent
$fixture = Join-Path ([IO.Path]::GetTempPath()) ("dsh-api-balance-windows-{0}" -f [Guid]::NewGuid().ToString("N"))

function Assert-Condition {
    param(
        [Parameter(Mandatory = $true)][bool]$Condition,
        [Parameter(Mandatory = $true)][string]$Message
    )
    if (-not $Condition) {
        throw $Message
    }
}

function Get-Sha256 {
    param([Parameter(Mandatory = $true)][string]$Path)
    return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant()
}

function Get-TreeSnapshot {
    param([Parameter(Mandatory = $true)][string]$TreeRoot)
    $items = @(
        Get-ChildItem -LiteralPath $TreeRoot -Recurse -File |
            Sort-Object FullName |
            ForEach-Object {
                [pscustomobject]@{
                    Path = $_.FullName.Substring($TreeRoot.Length + 1).Replace("\", "/")
                    Sha256 = Get-Sha256 $_.FullName
                }
            }
    )
    return ($items | ConvertTo-Json -Depth 4 -Compress)
}

function Invoke-ExpectedFailure {
    param(
        [Parameter(Mandatory = $true)][scriptblock]$Action,
        [Parameter(Mandatory = $true)][string]$Pattern
    )
    try {
        & $Action
    } catch {
        if ([string]$_ -notmatch $Pattern) {
            throw
        }
        return
    }
    throw "Expected failure matching '$Pattern'."
}

try {
    New-Item -ItemType Directory -Force -Path $fixture | Out-Null

    if ([string]::IsNullOrWhiteSpace($OfficialHostPackageDir) -or
        [string]::IsNullOrWhiteSpace($OfficialSidebarPackageDir)) {
        $downloads = Join-Path $fixture "downloads"
        $hostExtract = Join-Path $downloads "host"
        $sidebarExtract = Join-Path $downloads "sidebar"
        New-Item -ItemType Directory -Force -Path $downloads, $hostExtract, $sidebarExtract | Out-Null

        Push-Location $downloads
        try {
            $hostArchive = (& npm pack "@deepseek-ai/dsh-host-apiproxy@0.1.0-rc.6" --silent | Select-Object -Last 1).Trim()
            $sidebarArchive = (& npm pack "@deepseek-ai/dsh-client-ui-sidebar@0.1.0-rc.6" --silent | Select-Object -Last 1).Trim()
        } finally {
            Pop-Location
        }
        & tar -xzf (Join-Path $downloads $hostArchive) -C $hostExtract
        & tar -xzf (Join-Path $downloads $sidebarArchive) -C $sidebarExtract
        $OfficialHostPackageDir = Join-Path $hostExtract "package"
        $OfficialSidebarPackageDir = Join-Path $sidebarExtract "package"
    }

    $project = Join-Path $fixture "project"
    $npmRoot = Join-Path $fixture "npm root"
    $dshRoot = Join-Path $npmRoot "@deepseek-ai\dsh"
    $packageRoot = Join-Path $dshRoot "node_modules\@deepseek-ai"
    $hostPackage = Join-Path $packageRoot "dsh-host-apiproxy"
    $sidebarPackage = Join-Path $packageRoot "dsh-client-ui-sidebar"
    $fakeBin = Join-Path $fixture "fake bin"
    New-Item -ItemType Directory -Force -Path $project, $hostPackage, $sidebarPackage, $fakeBin | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $hostPackage "lib"), (Join-Path $sidebarPackage "lib") | Out-Null

    Copy-Item -LiteralPath (Join-Path $root "install.ps1"), (Join-Path $root "uninstall.ps1") -Destination $project
    Copy-Item -LiteralPath (Join-Path $root "scripts"), (Join-Path $root "files") -Destination $project -Recurse

    [IO.File]::WriteAllText(
        (Join-Path $dshRoot "package.json"),
        "{`"name`":`"@deepseek-ai/dsh`",`"version`":`"0.1.0-rc.6`"}`n",
        (New-Object Text.UTF8Encoding($false))
    )
    Copy-Item -LiteralPath (Join-Path $OfficialHostPackageDir "package.json") -Destination $hostPackage
    Copy-Item -LiteralPath (Join-Path $OfficialSidebarPackageDir "package.json") -Destination $sidebarPackage
    Copy-Item -LiteralPath (Join-Path $OfficialHostPackageDir "lib\index.js") -Destination (Join-Path $hostPackage "lib\index.js")
    Copy-Item -LiteralPath (Join-Path $OfficialSidebarPackageDir "lib\client.js") -Destination (Join-Path $sidebarPackage "lib\client.js")

    if ([IO.Path]::DirectorySeparatorChar -eq "\") {
        $npmCommand = @"
@echo off
if "%1"=="root" if "%2"=="-g" echo $npmRoot& exit /b 0
if "%1"=="prefix" if "%2"=="-g" echo $npmRoot& exit /b 0
exit /b 2
"@
        [IO.File]::WriteAllText((Join-Path $fakeBin "npm.cmd"), $npmCommand, [Text.Encoding]::ASCII)
    } else {
        $npmTemplate = @'
#!/bin/sh
case "$1:$2" in
  root:-g|prefix:-g) printf '%s\n' '__NPM_ROOT__' ;;
  *) exit 2 ;;
esac
'@
        $npmCommand = $npmTemplate.Replace("__NPM_ROOT__", $npmRoot)
        $npmPath = Join-Path $fakeBin "npm"
        [IO.File]::WriteAllText($npmPath, $npmCommand, (New-Object Text.UTF8Encoding($false)))
        & chmod +x $npmPath
    }

    $oldPath = $env:PATH
    $oldAppData = $env:APPDATA
    $env:PATH = "$fakeBin$([IO.Path]::PathSeparator)$oldPath"
    $env:APPDATA = Join-Path $fixture "unused appdata"
    try {
        $hostTarget = Join-Path $hostPackage "lib\index.js"
        $sidebarTarget = Join-Path $sidebarPackage "lib\client.js"
        $backupRoot = Join-Path $project "backup"
        $baseline = Get-TreeSnapshot $dshRoot

        & (Join-Path $project "install.ps1") -WhatIf | Out-Null
        Assert-Condition (-not (Test-Path -LiteralPath $backupRoot)) "WhatIf created installation state."
        Assert-Condition ((Get-TreeSnapshot $dshRoot) -eq $baseline) "WhatIf changed the fake DSH tree."

        & (Join-Path $project "install.ps1") | Out-Null
        Assert-Condition (Test-Path -LiteralPath $backupRoot -PathType Container) "Install did not create its recovery state."
        Assert-Condition ((Get-Sha256 $hostTarget) -eq (Get-Sha256 (Join-Path $project "files\dsh-host-apiproxy\lib\index.js"))) "Host patch was not installed."
        Assert-Condition ((Get-Sha256 $sidebarTarget) -eq (Get-Sha256 (Join-Path $project "files\dsh-client-ui-sidebar\lib\client.js"))) "Sidebar patch was not installed."

        & (Join-Path $project "uninstall.ps1") -WhatIf | Out-Null
        Assert-Condition (Test-Path -LiteralPath $backupRoot -PathType Container) "Uninstall WhatIf removed installation state."

        & (Join-Path $project "uninstall.ps1") | Out-Null
        Assert-Condition (-not (Test-Path -LiteralPath $backupRoot)) "Successful uninstall left backup state."
        Assert-Condition ((Get-TreeSnapshot $dshRoot) -eq $baseline) "Successful uninstall did not restore the byte-identical DSH tree."

        & (Join-Path $project "uninstall.ps1") | Out-Null
        Assert-Condition (-not (Test-Path -LiteralPath $backupRoot)) "Repeated uninstall created residue."

        & (Join-Path $project "install.ps1") | Out-Null
        Copy-Item -LiteralPath (Join-Path $OfficialHostPackageDir "lib\index.js") -Destination $hostTarget -Force
        Copy-Item -LiteralPath (Join-Path $OfficialSidebarPackageDir "lib\client.js") -Destination $sidebarTarget -Force
        & (Join-Path $project "uninstall.ps1") | Out-Null
        Assert-Condition (-not (Test-Path -LiteralPath $backupRoot)) "Already-pristine uninstall left backup state."
        Assert-Condition ((Get-TreeSnapshot $dshRoot) -eq $baseline) "Already-pristine uninstall changed the DSH tree."

        & (Join-Path $project "install.ps1") | Out-Null
        Add-Content -LiteralPath $sidebarTarget -Value "intentional-test-tamper"
        Invoke-ExpectedFailure -Pattern "unrecognized file" -Action {
            & (Join-Path $project "uninstall.ps1") | Out-Null
        }
        Assert-Condition (Test-Path -LiteralPath $backupRoot -PathType Container) "Rejected uninstall destroyed recovery state."
        Copy-Item -LiteralPath (Join-Path $project "files\dsh-client-ui-sidebar\lib\client.js") -Destination $sidebarTarget -Force
        & (Join-Path $project "uninstall.ps1") | Out-Null
        Assert-Condition (-not (Test-Path -LiteralPath $backupRoot)) "Final uninstall left backup state."
        Assert-Condition ((Get-TreeSnapshot $dshRoot) -eq $baseline) "Final uninstall did not restore the byte-identical DSH tree."
    } finally {
        $env:PATH = $oldPath
        $env:APPDATA = $oldAppData
    }

    Write-Host "Windows zero-residue lifecycle fixture tests passed."
} finally {
    if (Test-Path -LiteralPath $fixture) {
        Remove-Item -LiteralPath $fixture -Recurse -Force
    }
}
