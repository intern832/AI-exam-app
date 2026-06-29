$ErrorActionPreference = "Continue"

$root = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $root "work\logs"
$logFile = Join-Path $logDir "app-supervisor.log"

if (!(Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

while ($true) {
  $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -Path $logFile -Value "[$stamp] Starting AI Exam app..."

  try {
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "start-app.ps1") *>> $logFile
  } catch {
    $err = $_.Exception.Message
    Add-Content -Path $logFile -Value "[$stamp] App crashed: $err"
  }

  Start-Sleep -Seconds 5
}
