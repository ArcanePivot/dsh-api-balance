param(
    [string]$OfficialHostPackageDir,
    [string]$OfficialSidebarPackageDir
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2.0

$root = Split-Path $PSScriptRoot -Parent
$fixture = Join-Path ([IO.Path]::GetTempPath()) ("dsh-api-balance-windows-{0}" -f [Guid]::NewGuid().ToString("N"))
$packageName = "@arcanepivot/dsh-api-balance"

function Assert-Condition {
    param(
        [Parameter(Mandatory = $true)][bool]$Condition,
        [Parameter(Mandatory = $true)][string]$Message
    )
    if (-not $Condition) { throw $Message }
}

function Get-Sha256 {
    param([Parameter(Mandatory = $true)][string]$Path)
    $stream = [IO.File]::OpenRead($Path)
    try {
        $algorithm = [Security.Cryptography.SHA256]::Create()
        try {
            return ([BitConverter]::ToString($algorithm.ComputeHash($stream))).Replace("-", "").ToLowerInvariant()
        } finally {
            $algorithm.Dispose()
        }
    } finally {
        $stream.Dispose()
    }
}

function Write-Utf8File {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )
    $parent = Split-Path $Path -Parent
    if (-not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }
    [IO.File]::WriteAllText($Path, $Content, (New-Object Text.UTF8Encoding($false)))
}

function Invoke-ExpectedFailure {
    param(
        [Parameter(Mandatory = $true)][scriptblock]$Action,
        [Parameter(Mandatory = $true)][string]$Pattern
    )
    try {
        & $Action
    } catch {
        if ([string]$_ -notmatch $Pattern) { throw }
        return
    }
    throw "Expected failure matching '$Pattern'."
}

function New-CommandWrapper {
    param(
        [Parameter(Mandatory = $true)][string]$BinRoot,
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$ScriptPath
    )
    $hostExecutable = (Get-Process -Id $PID).Path
    if ([IO.Path]::DirectorySeparatorChar -eq "\") {
        $wrapper = "@echo off`r`n`"$hostExecutable`" -NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`" %*`r`n"
        Write-Utf8File (Join-Path $BinRoot "$Name.cmd") $wrapper
        return
    }

    $quotedHost = $hostExecutable.Replace("'", "'`"'`"'")
    $quotedScript = $ScriptPath.Replace("'", "'`"'`"'")
    $wrapper = "#!/bin/sh`nexec '$quotedHost' -NoProfile -File '$quotedScript' `"`$@`"`n"
    $path = Join-Path $BinRoot $Name
    Write-Utf8File $path $wrapper
    & chmod +x $path
}

function Initialize-LegacyState {
    param(
        [Parameter(Mandatory = $true)][string]$ProjectRoot,
        [Parameter(Mandatory = $true)][string]$PackageRoot,
        [Parameter(Mandatory = $true)][string]$HostSource,
        [Parameter(Mandatory = $true)][string]$SidebarSource
    )

    $hostTarget = Join-Path (Join-Path (Join-Path $PackageRoot "dsh-host-apiproxy") "lib") "index.js"
    $sidebarTarget = Join-Path (Join-Path (Join-Path $PackageRoot "dsh-client-ui-sidebar") "lib") "client.js"
    $hostPatch = Join-Path (Join-Path (Join-Path (Join-Path $ProjectRoot "files") "dsh-host-apiproxy") "lib") "index.js"
    $sidebarPatch = Join-Path (Join-Path (Join-Path (Join-Path $ProjectRoot "files") "dsh-client-ui-sidebar") "lib") "client.js"
    $backupRoot = Join-Path $ProjectRoot "backup"
    $hostBackup = Join-Path (Join-Path (Join-Path $backupRoot "dsh-host-apiproxy") "lib") "index.js"
    $sidebarBackup = Join-Path (Join-Path (Join-Path $backupRoot "dsh-client-ui-sidebar") "lib") "client.js"

    New-Item -ItemType Directory -Force -Path (Split-Path $hostTarget -Parent), (Split-Path $sidebarTarget -Parent) | Out-Null
    New-Item -ItemType Directory -Force -Path (Split-Path $hostBackup -Parent), (Split-Path $sidebarBackup -Parent) | Out-Null
    Copy-Item -LiteralPath $hostPatch -Destination $hostTarget -Force
    Copy-Item -LiteralPath $sidebarPatch -Destination $sidebarTarget -Force
    Copy-Item -LiteralPath $HostSource -Destination $hostBackup -Force
    Copy-Item -LiteralPath $SidebarSource -Destination $sidebarBackup -Force

    $manifest = [ordered]@{
        schemaVersion = 1
        patchVersion = "0.4.2"
        dshVersion = "0.1.0-rc.6"
        platform = "win32"
        createdAtUtc = [DateTime]::UtcNow.ToString("o")
        lastInstalledAtUtc = [DateTime]::UtcNow.ToString("o")
        lastUninstalledAtUtc = $null
        files = @(
            [ordered]@{
                path = "dsh-host-apiproxy/lib/index.js"
                originalSha256 = Get-Sha256 $hostBackup
                patchedSha256 = Get-Sha256 $hostPatch
            },
            [ordered]@{
                path = "dsh-client-ui-sidebar/lib/client.js"
                originalSha256 = Get-Sha256 $sidebarBackup
                patchedSha256 = Get-Sha256 $sidebarPatch
            }
        )
    }
    Write-Utf8File (Join-Path $backupRoot "manifest.json") (($manifest | ConvertTo-Json -Depth 8) + [Environment]::NewLine)
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
    $fakeBin = Join-Path $fixture "fake bin"
    $dshHome = Join-Path $fixture "dsh home"
    New-Item -ItemType Directory -Force -Path $project, $fakeBin, $dshHome | Out-Null
    Copy-Item -LiteralPath (Join-Path $root "install.ps1"), (Join-Path $root "uninstall.ps1") -Destination $project
    Copy-Item -LiteralPath (Join-Path $root "scripts") -Destination $project -Recurse

    $fakeDsh = Join-Path $fakeBin "fake-dsh.ps1"
    Write-Utf8File $fakeDsh @'
$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2.0
$packageName = "@arcanepivot/dsh-api-balance"

function Write-Manifest {
    param([string]$Path, $Value)
    New-Item -ItemType Directory -Force -Path (Split-Path $Path -Parent) | Out-Null
    [IO.File]::WriteAllText($Path, (($Value | ConvertTo-Json -Depth 8) + [Environment]::NewLine), (New-Object Text.UTF8Encoding($false)))
}

if ($args.Count -gt 0 -and $args[0] -eq "plugin") {
    $profileIndex = [Array]::IndexOf([object[]]$args, "--profile")
    if ($profileIndex -lt 0 -or $args.Count -le ($profileIndex + 2)) { exit 2 }
    $profile = [string]$args[$profileIndex + 1]
    $action = [string]$args[$profileIndex + 2]
    $manifestPath = Join-Path (Join-Path (Join-Path $env:DSH_HOME "profiles") $profile) "package.json"
    if (Test-Path -LiteralPath $manifestPath) {
        $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    } else {
        $manifest = [pscustomobject]@{
            dependencies = [pscustomobject]@{}
            dsh = [pscustomobject]@{ profile = [pscustomobject]@{ bundles = @() } }
        }
    }
    if ($action -eq "add") {
        if ($args.Count -le ($profileIndex + 3)) { exit 2 }
        $spec = [string]$args[$profileIndex + 3]
        $property = $manifest.dependencies.PSObject.Properties[$packageName]
        if ($null -eq $property) {
            $manifest.dependencies | Add-Member -NotePropertyName $packageName -NotePropertyValue $spec
        } else {
            $property.Value = $spec
        }
        if (@($manifest.dsh.profile.bundles) -notcontains $packageName) {
            $manifest.dsh.profile.bundles = @($manifest.dsh.profile.bundles) + $packageName
        }
        Write-Manifest $manifestPath $manifest
        exit 0
    }
    if ($action -eq "remove") {
        $manifest.dependencies.PSObject.Properties.Remove($packageName)
        $manifest.dsh.profile.bundles = @($manifest.dsh.profile.bundles | Where-Object { $_ -ne $packageName })
        Write-Manifest $manifestPath $manifest
        exit 0
    }
    exit 2
}

if ($args -contains "--dump-config") {
    Write-Output "- id: api-balance"
    Write-Output "  name: '$packageName'"
    exit 0
}
exit 2
'@
    $fakeNoop = Join-Path $fakeBin "fake-noop.ps1"
    Write-Utf8File $fakeNoop "exit 0`n"
    New-CommandWrapper -BinRoot $fakeBin -Name "dsh" -ScriptPath $fakeDsh
    New-CommandWrapper -BinRoot $fakeBin -Name "pnpm" -ScriptPath $fakeNoop

    $oldPath = $env:PATH
    $oldDshHome = $env:DSH_HOME
    $oldAppData = $env:APPDATA
    $env:PATH = "$fakeBin$([IO.Path]::PathSeparator)$oldPath"
    $env:DSH_HOME = $dshHome
    try {
        $sessionFile = Join-Path (Join-Path $dshHome "sessions") "retained.jsonl"
        Write-Utf8File $sessionFile "retained-session-sentinel`n"
        $manifestPath = Join-Path (Join-Path (Join-Path $dshHome "profiles") "web") "package.json"
        $packageSpec = Join-Path $fixture "api-balance candidate.tgz"
        Write-Utf8File $packageSpec "fixture package`n"

        & (Join-Path $project "install.ps1") -PackageSpec $packageSpec -WhatIf | Out-Null
        Assert-Condition (-not (Test-Path -LiteralPath $manifestPath)) "Native install WhatIf created profile state."

        & (Join-Path $project "install.ps1") -PackageSpec $packageSpec | Out-Null
        $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
        Assert-Condition ($null -ne $manifest.dependencies.PSObject.Properties[$packageName]) "Native package dependency was not installed."
        Assert-Condition (@($manifest.dsh.profile.bundles) -contains $packageName) "Native bundle was not added."

        & (Join-Path $project "install.ps1") -PackageSpec $packageSpec | Out-Null
        $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
        Assert-Condition (@($manifest.dsh.profile.bundles | Where-Object { $_ -eq $packageName }).Count -eq 1) "Repeated install duplicated the native bundle."

        & (Join-Path $project "uninstall.ps1") -WhatIf | Out-Null
        $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
        Assert-Condition ($null -ne $manifest.dependencies.PSObject.Properties[$packageName]) "Native uninstall WhatIf removed the package."

        & (Join-Path $project "uninstall.ps1") | Out-Null
        $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
        Assert-Condition ($null -eq $manifest.dependencies.PSObject.Properties[$packageName]) "Native package dependency remained after uninstall."
        Assert-Condition (@($manifest.dsh.profile.bundles) -notcontains $packageName) "Native bundle remained after uninstall."
        & (Join-Path $project "uninstall.ps1") | Out-Null
        Assert-Condition ((Get-Content -LiteralPath $sessionFile -Raw) -match "retained-session-sentinel") "Native lifecycle touched retained sessions."

        $legacyProject = Join-Path $fixture "legacy project"
        $npmRoot = Join-Path $fixture "npm root"
        $dshRoot = Join-Path (Join-Path $npmRoot "@deepseek-ai") "dsh"
        $packageRoot = Join-Path (Join-Path (Join-Path $dshRoot "node_modules") "@deepseek-ai") ""
        New-Item -ItemType Directory -Force -Path $legacyProject, $dshRoot, $packageRoot | Out-Null
        Copy-Item -LiteralPath (Join-Path $root "uninstall.ps1") -Destination $legacyProject
        Copy-Item -LiteralPath (Join-Path $root "scripts"), (Join-Path $root "files") -Destination $legacyProject -Recurse
        Write-Utf8File (Join-Path $dshRoot "package.json") "{`"name`":`"@deepseek-ai/dsh`",`"version`":`"0.1.0-rc.6`"}`n"

        $hostPackage = Join-Path $packageRoot "dsh-host-apiproxy"
        $sidebarPackage = Join-Path $packageRoot "dsh-client-ui-sidebar"
        New-Item -ItemType Directory -Force -Path $hostPackage, $sidebarPackage | Out-Null
        Copy-Item -LiteralPath (Join-Path $OfficialHostPackageDir "package.json") -Destination $hostPackage
        Copy-Item -LiteralPath (Join-Path $OfficialSidebarPackageDir "package.json") -Destination $sidebarPackage

        $fakeNpm = Join-Path $fakeBin "fake-npm.ps1"
        Write-Utf8File $fakeNpm @"
if (`$args.Count -eq 2 -and ((`$args[0] -eq 'root' -and `$args[1] -eq '-g') -or (`$args[0] -eq 'prefix' -and `$args[1] -eq '-g'))) {
    Write-Output '$($npmRoot.Replace("'", "''"))'
    exit 0
}
exit 2
"@
        New-CommandWrapper -BinRoot $fakeBin -Name "npm" -ScriptPath $fakeNpm
        $env:APPDATA = Join-Path $fixture "unused appdata"

        $officialHost = Join-Path (Join-Path $OfficialHostPackageDir "lib") "index.js"
        $officialSidebar = Join-Path (Join-Path $OfficialSidebarPackageDir "lib") "client.js"
        Initialize-LegacyState -ProjectRoot $legacyProject -PackageRoot $packageRoot -HostSource $officialHost -SidebarSource $officialSidebar
        $legacyBackup = Join-Path $legacyProject "backup"
        & (Join-Path $legacyProject "uninstall.ps1") -LegacyOnly -WhatIf | Out-Null
        Assert-Condition (Test-Path -LiteralPath $legacyBackup) "Legacy WhatIf removed recovery state."

        & (Join-Path $legacyProject "uninstall.ps1") -LegacyOnly | Out-Null
        $hostTarget = Join-Path (Join-Path $hostPackage "lib") "index.js"
        $sidebarTarget = Join-Path (Join-Path $sidebarPackage "lib") "client.js"
        Assert-Condition ((Get-Sha256 $hostTarget) -eq (Get-Sha256 $officialHost)) "Legacy host file was not restored."
        Assert-Condition ((Get-Sha256 $sidebarTarget) -eq (Get-Sha256 $officialSidebar)) "Legacy sidebar file was not restored."
        Assert-Condition (-not (Test-Path -LiteralPath $legacyBackup)) "Legacy restore left backup state."
        & (Join-Path $legacyProject "uninstall.ps1") -LegacyOnly | Out-Null

        Initialize-LegacyState -ProjectRoot $legacyProject -PackageRoot $packageRoot -HostSource $officialHost -SidebarSource $officialSidebar
        Add-Content -LiteralPath $sidebarTarget -Value "intentional-test-tamper"
        Invoke-ExpectedFailure -Pattern "unrecognized legacy file" -Action {
            & (Join-Path $legacyProject "uninstall.ps1") -LegacyOnly | Out-Null
        }
        Assert-Condition (Test-Path -LiteralPath $legacyBackup) "Rejected migration destroyed recovery state."
        Assert-Condition ((Get-Content -LiteralPath $sessionFile -Raw) -match "retained-session-sentinel") "Legacy migration touched retained sessions."
    } finally {
        $env:PATH = $oldPath
        $env:DSH_HOME = $oldDshHome
        $env:APPDATA = $oldAppData
    }

    Write-Host "Windows native and legacy-migration lifecycle tests passed."
} finally {
    if (Test-Path -LiteralPath $fixture) {
        Remove-Item -LiteralPath $fixture -Recurse -Force
    }
}
