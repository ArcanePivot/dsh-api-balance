$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2.0

$root = Split-Path $PSScriptRoot -Parent
. (Join-Path $root "scripts/common.ps1")

$fixture = [IO.Path]::GetTempFileName()
try {
    [IO.File]::WriteAllText($fixture, "api-balance-whatif-hash")
    $expected = Get-DshApiBalanceSha256 $fixture

    $WhatIfPreference = $true
    $actual = Get-DshApiBalanceSha256 $fixture

    if ($actual -ne $expected -or $actual -notmatch "^[0-9a-f]{64}$") {
        throw "SHA-256 changed or disappeared while WhatIf was active."
    }
    if (-not $WhatIfPreference) {
        throw "The caller's WhatIf preference was not preserved."
    }
    Write-Host "PowerShell WhatIf hashing fixture passed."
} finally {
    $WhatIfPreference = $false
    [IO.File]::Delete($fixture)
}
