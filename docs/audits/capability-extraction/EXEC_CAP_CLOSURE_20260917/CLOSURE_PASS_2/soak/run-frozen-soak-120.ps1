param(
  [switch]$AllowLiveRun,
  [switch]$AllowTargetedRestart
)
$ErrorActionPreference = 'Stop'
# Credentials, candidate SHA, deployment ID, URLs and exact service/environment
# must already be explicitly configured. No machine-specific path or stale SHA.
if (-not $AllowLiveRun -or -not $AllowTargetedRestart) {
  throw 'Explicit live-run and targeted-restart approval switches are required.'
}
$env:SOAK_ALLOW_LIVE_RUN = '1'
$env:SOAK_ALLOW_RESTART = '1'
$env:SOAK_MINUTES = '120'
$env:SOAK_FILL_GAP_MS = '45000'
try {
  & node (Join-Path $PSScriptRoot 'soak-runner.mjs')
  $result = $LASTEXITCODE
} finally {
  # Opt-in never leaks to a later command in this shell.
  Remove-Item Env:SOAK_ALLOW_LIVE_RUN -ErrorAction SilentlyContinue
  Remove-Item Env:SOAK_ALLOW_RESTART -ErrorAction SilentlyContinue
}
exit $result
