Set-StrictMode -Version 2.0

$script:DshApiBalanceVersion = "0.2.0"
$script:DshApiBalanceSupportedDshVersion = "0.1.0-rc.6"
$script:DshApiBalanceFiles = @(
    [pscustomobject]@{
        Package = "dsh-host-apiproxy"
        RelativePath = "lib/index.js"
        OriginalSha256 = "c0c506a6a22c02e07db3a1ced277c5fd4435119c1d97b83fec524da3e66711a9"
    },
    [pscustomobject]@{
        Package = "dsh-client-ui-sidebar"
        RelativePath = "lib/client.js"
        OriginalSha256 = "b8f03724988d75954b88d1fbaecf7e0cd1bf5dd17b722f7cfeb65220f9de915b"
    }
)

function ConvertTo-NativeRelativePath {
    param([Parameter(Mandatory = $true)][string]$Path)
    return $Path.Replace("/", [string][IO.Path]::DirectorySeparatorChar)
}

function Get-DshApiBalanceSha256 {
    param([Parameter(Mandatory = $true)][string]$Path)
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Get-DshApiBalanceInstall {
    $roots = New-Object System.Collections.Generic.List[string]

    try {
        $npmRoot = (& npm root -g 2>$null | Select-Object -First 1)
        if (-not [string]::IsNullOrWhiteSpace($npmRoot)) {
            $roots.Add($npmRoot.Trim())
        }
    } catch {}

    if (-not [string]::IsNullOrWhiteSpace($env:APPDATA)) {
        $roots.Add((Join-Path $env:APPDATA "npm\node_modules"))
    }

    $dshCommand = Get-Command dsh.cmd -ErrorAction SilentlyContinue
    if ($null -ne $dshCommand -and -not [string]::IsNullOrWhiteSpace($dshCommand.Source)) {
        $roots.Add((Join-Path (Split-Path $dshCommand.Source -Parent) "node_modules"))
    }

    foreach ($root in ($roots | Select-Object -Unique)) {
        $dshRoot = Join-Path $root "@deepseek-ai\dsh"
        $dshPackageJson = Join-Path $dshRoot "package.json"
        if (-not (Test-Path -LiteralPath $dshPackageJson -PathType Leaf)) {
            continue
        }

        $packageRoots = @(
            (Join-Path $dshRoot "node_modules\@deepseek-ai"),
            (Join-Path $root "@deepseek-ai")
        )
        foreach ($packageRoot in $packageRoots) {
            $allPresent = $true
            foreach ($package in ($script:DshApiBalanceFiles.Package | Select-Object -Unique)) {
                if (-not (Test-Path -LiteralPath (Join-Path $packageRoot "$package\package.json") -PathType Leaf)) {
                    $allPresent = $false
                    break
                }
            }
            if (-not $allPresent) {
                continue
            }

            $dshMetadata = Get-Content -LiteralPath $dshPackageJson -Raw | ConvertFrom-Json
            $packageVersions = @{}
            foreach ($package in ($script:DshApiBalanceFiles.Package | Select-Object -Unique)) {
                $metadataPath = Join-Path $packageRoot "$package\package.json"
                $metadata = Get-Content -LiteralPath $metadataPath -Raw | ConvertFrom-Json
                $packageVersions[$package] = [string]$metadata.version
            }
            return [pscustomobject]@{
                DshRoot = $dshRoot
                PackageRoot = $packageRoot
                DshVersion = [string]$dshMetadata.version
                PackageVersions = $packageVersions
            }
        }
    }

    throw "Could not locate a global @deepseek-ai/dsh installation containing the required packages."
}

function Assert-DshApiBalanceSupportedInstall {
    param([Parameter(Mandatory = $true)]$Install)

    if ($Install.DshVersion -ne $script:DshApiBalanceSupportedDshVersion) {
        throw "Unsupported @deepseek-ai/dsh version '$($Install.DshVersion)'. This release supports only $script:DshApiBalanceSupportedDshVersion."
    }
    foreach ($package in ($script:DshApiBalanceFiles.Package | Select-Object -Unique)) {
        $version = [string]$Install.PackageVersions[$package]
        if ($version -ne $script:DshApiBalanceSupportedDshVersion) {
            throw "Unsupported @deepseek-ai/$package version '$version'. Expected $script:DshApiBalanceSupportedDshVersion."
        }
    }
}

function Get-DshApiBalanceEntries {
    param(
        [Parameter(Mandatory = $true)]$Install,
        [Parameter(Mandatory = $true)][string]$ProjectRoot,
        [Parameter(Mandatory = $true)][string]$BackupRoot
    )

    $entries = @()
    foreach ($file in $script:DshApiBalanceFiles) {
        $relative = "$($file.Package)/$($file.RelativePath)"
        $nativeRelative = ConvertTo-NativeRelativePath $relative
        $entries += [pscustomobject]@{
            RelativePath = $relative
            Source = Join-Path (Join-Path $ProjectRoot "files") $nativeRelative
            Target = Join-Path $Install.PackageRoot $nativeRelative
            Backup = Join-Path $BackupRoot $nativeRelative
            OriginalSha256 = $file.OriginalSha256
        }
    }
    return $entries
}

function Assert-DshApiBalanceOfficialTargets {
    param([Parameter(Mandatory = $true)]$Entries)

    foreach ($entry in $Entries) {
        $actual = Get-DshApiBalanceSha256 $entry.Target
        if ($actual -ne [string]$entry.OriginalSha256) {
            throw "Refusing first install because $($entry.RelativePath) is not the official $script:DshApiBalanceSupportedDshVersion file."
        }
    }
}

function Get-DshApiBalanceTargetState {
    param(
        [Parameter(Mandatory = $true)]$Entry,
        [Parameter(Mandatory = $true)]$Manifest
    )

    $record = $Manifest.files | Where-Object { $_.path -eq $Entry.RelativePath } | Select-Object -First 1
    if ($null -eq $record) {
        return "unknown"
    }
    $actual = Get-DshApiBalanceSha256 $Entry.Target
    if ($actual -eq [string]$record.originalSha256) {
        return "original"
    }
    if ($actual -eq [string]$record.patchedSha256) {
        return "patched"
    }
    return "unknown"
}

function Assert-DshApiBalanceFilesExist {
    param([Parameter(Mandatory = $true)]$Entries)

    foreach ($entry in $Entries) {
        if (-not (Test-Path -LiteralPath $entry.Source -PathType Leaf)) {
            throw "Missing project file: $($entry.Source)"
        }
        if (-not (Test-Path -LiteralPath $entry.Target -PathType Leaf)) {
            throw "Missing DSH target file: $($entry.Target)"
        }
    }
}

function Write-DshApiBalanceJson {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)]$Value
    )

    $parent = Split-Path $Path -Parent
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
    $json = $Value | ConvertTo-Json -Depth 8
    [IO.File]::WriteAllText($Path, $json + [Environment]::NewLine, (New-Object Text.UTF8Encoding($false)))
}

function Get-DshApiBalanceManifest {
    param([Parameter(Mandatory = $true)][string]$BackupRoot)

    $path = Join-Path $BackupRoot "manifest.json"
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "Backup metadata is missing: $path. Refusing to overwrite or restore an ambiguous backup."
    }
    return Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
}

function Assert-DshApiBalanceManifest {
    param(
        [Parameter(Mandatory = $true)]$Manifest,
        [Parameter(Mandatory = $true)]$Install,
        [Parameter(Mandatory = $true)]$Entries
    )

    if ([int]$Manifest.schemaVersion -ne 1) {
        throw "Unsupported backup manifest schema '$($Manifest.schemaVersion)'."
    }
    if ([string]$Manifest.dshVersion -ne [string]$Install.DshVersion) {
        throw "Backup belongs to DSH $($Manifest.dshVersion), but the installed version is $($Install.DshVersion)."
    }
    foreach ($entry in $Entries) {
        $record = $Manifest.files | Where-Object { $_.path -eq $entry.RelativePath } | Select-Object -First 1
        if ($null -eq $record) {
            throw "Backup manifest has no record for $($entry.RelativePath)."
        }
        if (-not (Test-Path -LiteralPath $entry.Backup -PathType Leaf)) {
            throw "Backup file is missing: $($entry.Backup)"
        }
        $actual = Get-DshApiBalanceSha256 $entry.Backup
        if ($actual -ne [string]$record.originalSha256) {
            throw "Backup checksum mismatch: $($entry.RelativePath)."
        }
    }
}

function New-DshApiBalanceTransactionBackup {
    param([Parameter(Mandatory = $true)]$Entries)

    $root = Join-Path ([IO.Path]::GetTempPath()) ("dsh-api-balance-{0}-{1}" -f $PID, [Guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Force -Path $root | Out-Null
    foreach ($entry in $Entries) {
        $copy = Join-Path $root (ConvertTo-NativeRelativePath $entry.RelativePath)
        New-Item -ItemType Directory -Force -Path (Split-Path $copy -Parent) | Out-Null
        Copy-Item -LiteralPath $entry.Target -Destination $copy -Force
    }
    return $root
}

function Restore-DshApiBalanceTransaction {
    param(
        [Parameter(Mandatory = $true)]$Entries,
        [Parameter(Mandatory = $true)][string]$TransactionRoot
    )

    foreach ($entry in $Entries) {
        $copy = Join-Path $TransactionRoot (ConvertTo-NativeRelativePath $entry.RelativePath)
        Copy-Item -LiteralPath $copy -Destination $entry.Target -Force
    }
}
