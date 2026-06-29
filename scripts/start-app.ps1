$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$pnpm = "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd"
$nodeBin = "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$bin = "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin"

Set-Location $root
$env:PATH = "$nodeBin;$bin;$env:PATH"
$env:CI = "true"
& $pnpm start
