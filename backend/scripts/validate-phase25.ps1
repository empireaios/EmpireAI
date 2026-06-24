# Phase 2.5 validation gate — run from backend/
$ErrorActionPreference = "Continue"
$BackendRoot = Split-Path $PSScriptRoot -Parent
Set-Location $BackendRoot

$log = Join-Path $BackendRoot "phase25-results.txt"
"" | Set-Content $log -Encoding utf8

function Run-Step($name, $command) {
  Add-Content $log "`n========== $name =========="
  Add-Content $log "Start: $(Get-Date -Format o)"
  Invoke-Expression $command 2>&1 | Tee-Object -FilePath $log -Append | Out-Null
  $code = $LASTEXITCODE
  if ($null -eq $code) { $code = 0 }
  Add-Content $log "EXIT_CODE: $code"
  return $code
}

Add-Content $log "========== REDIS CHECK =========="
try {
  $redis = redis-cli ping 2>&1
  Add-Content $log $redis
} catch {
  Add-Content $log "redis-cli not available: $_"
}

$codes = @{}
$codes.install   = Run-Step "npm install" "npm install"
$codes.typecheck = Run-Step "npm run typecheck" "npm run typecheck"
$codes.test      = Run-Step "npm run test" "npm run test"
$codes.validate  = Run-Step "npm run validate" "npm run validate"

Add-Content $log "`n========== SUMMARY =========="
$codes.GetEnumerator() | Sort-Object Name | ForEach-Object {
  Add-Content $log "$($_.Key): $($_.Value)"
}

$reportPath = Join-Path $BackendRoot "phase25-report.json"
if (Test-Path $reportPath) {
  Add-Content $log "`nReport: phase25-report.json generated"
}

Write-Host "Done. See $log and phase25-report.json"
