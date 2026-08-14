<#
Restarts dsh web without hard-coded user paths.

Use -TaskName when DSH is managed by Task Scheduler. That preserves the task's
environment, DSH_HOME, permission mode, proxy integration, and hidden-window
settings. Without -TaskName, this script restarts a manually launched dsh web
process and inherits the current PowerShell environment.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$TaskName,
    [string]$HostAddress = "127.0.0.1",
    [ValidateRange(1, 65535)][int]$Port = 3080
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2.0

if (-not [string]::IsNullOrWhiteSpace($TaskName)) {
    $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
    if ($PSCmdlet.ShouldProcess($TaskName, "Restart the DSH scheduled task")) {
        if ($task.State -eq "Running") {
            Stop-ScheduledTask -TaskName $TaskName
            Start-Sleep -Seconds 2
        }
        Start-ScheduledTask -TaskName $TaskName
        Write-Host "Restarted scheduled task: $TaskName"
    }
    return
}

$dshCommand = Get-Command dsh.cmd -ErrorAction SilentlyContinue
if ($null -eq $dshCommand) {
    $dshCommand = Get-Command dsh -ErrorAction SilentlyContinue
}
if ($null -eq $dshCommand) {
    throw "Could not find dsh on PATH. Restart your existing DSH service manually or pass -TaskName."
}

$portPattern = "--port\s+{0}(?:\s|$)" -f $Port
$processes = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object {
    $_.CommandLine -like "*@deepseek-ai*dsh*bin.js*" -and
    $_.CommandLine -match "\sweb(?:\s|$)" -and
    $_.CommandLine -match $portPattern
})
if ($processes.Count -gt 1) {
    throw "Found multiple dsh web processes on port $Port. Stop the intended process manually or use -TaskName."
}

Write-Warning "Manual restart inherits this PowerShell session's environment. Managed deployments should use -TaskName."
if ($PSCmdlet.ShouldProcess("dsh web on $HostAddress`:$Port", "Restart the manual process")) {
    if ($processes.Count -eq 1) {
        Write-Host "Stopping dsh web (PID $($processes[0].ProcessId))"
        Stop-Process -Id $processes[0].ProcessId -Force
        Start-Sleep -Seconds 2
    } else {
        Write-Host "No matching dsh web process found; starting a new one."
    }

    Start-Process -FilePath $dshCommand.Source -ArgumentList @(
        "web", "--host", $HostAddress, "--port", [string]$Port
    ) -WindowStyle Hidden
    Write-Host "Started dsh web on http://$HostAddress`:$Port"
}
