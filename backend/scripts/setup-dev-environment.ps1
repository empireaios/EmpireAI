# EmpireAI backend - one-shot dev environment setup (Windows)
$ErrorActionPreference = "Stop"
$BackendRoot = Split-Path $PSScriptRoot -Parent
Set-Location $BackendRoot

Write-Host "EmpireAI backend setup - $BackendRoot"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is not installed or not on PATH. Install Node.js 20+ from https://nodejs.org/"
}

Write-Host "Node: $(node -v)"
Write-Host "npm: $(npm -v)"

# Stale partial install from better-sqlite3 blocks sql.js setup (node-gyp / Python errors).
if (Test-Path (Join-Path $BackendRoot "node_modules\better-sqlite3")) {
  Write-Host ""
  Write-Host "Removing stale node_modules (leftover better-sqlite3 native build)..."
  Remove-Item -Recurse -Force (Join-Path $BackendRoot "node_modules")
}
if (Test-Path (Join-Path $BackendRoot "package-lock.json")) {
  $lock = Get-Content (Join-Path $BackendRoot "package-lock.json") -Raw
  if ($lock -match "better-sqlite3") {
    Write-Host "Removing package-lock.json (references better-sqlite3)..."
    Remove-Item -Force (Join-Path $BackendRoot "package-lock.json")
  }
}

Write-Host ""
Write-Host "Installing dependencies (no native SQLite compile required)..."
npm install
if ($LASTEXITCODE -ne 0) {
  Write-Error "npm install failed. See output above."
}

Write-Host ""
Write-Host "Verifying environment..."
node scripts/verify-dev-environment.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Running architect:report..."
npm run architect:report
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Running typecheck..."
npm run typecheck
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Setup complete."
