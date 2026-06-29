$ErrorActionPreference = "Stop"

$startup = [Environment]::GetFolderPath("Startup")
$target = Join-Path $startup "AI Exam Local Web App.cmd"
$root = Split-Path -Parent $PSScriptRoot
$supervisor = Join-Path $PSScriptRoot "supervisor.ps1"

@"
@echo off
cd /d "$root"
start "AI Exam Local Web App" /min powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$supervisor"
"@ | Set-Content -Path $target -Encoding ASCII

Write-Host "Created startup launcher: $target"
Write-Host "Stable URL: http://127.0.0.1:3001"
