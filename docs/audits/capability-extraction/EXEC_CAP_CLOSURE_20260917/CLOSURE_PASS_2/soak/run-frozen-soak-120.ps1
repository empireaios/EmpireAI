# Frozen-candidate soak only (Pass 2 blocker rerun). Not a full campaign.
$ErrorActionPreference = "Continue"
$root = "C:\Users\erlan\OneDrive\Desktop\EmpireAI\docs\audits\capability-extraction\EXEC_CAP_CLOSURE_20260917\CLOSURE_PASS_2"
Set-Location $root
$env:SOAK_MINUTES = "120"
$env:SOAK_TIP_SHA = "ab6ac3b771d97e694e45db4a7ddc4bcea713decc"
$env:SOAK_FILL_GAP_MS = "45000"
$out = Join-Path $root "soak\soak-rerun-stdout.txt"
$err = Join-Path $root "soak\soak-rerun-stderr.txt"
node "soak\soak-runner.mjs" 1> $out 2> $err
Add-Content -Path $out -Value ("EXIT:" + $LASTEXITCODE)
