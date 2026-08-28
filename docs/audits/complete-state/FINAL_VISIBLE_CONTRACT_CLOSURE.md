# Final Visible Contract + Evidence Quality Core — Engineering Seal

**Status:** ENGINEERING CLOSED (Wave-1 remains UNCERTIFIED; Birth NOT authorised)

**SEMANTIC_CODE_SHA:** `39ce4c2fdce3832c963085ee81752a648e448177`  
**CERTIFIED_SHA (engineering):** `39ce4c2fdce3832c963085ee81752a648e448177`  
**RUNNING_BRAIN_SHA:** `39ce4c2fdce3832c963085ee81752a648e448177`  
**DEPLOYMENT_ID:** `a49bfbee` (full id from `/health/live.deploy.deploymentId`)  
**REPO_TIP_SHA:** `39ce4c2fdce3832c963085ee81752a648e448177`  
**Base preserved:** `66d98803` · `3b60fd7c` · `239cc95b`

## Wave state (unchanged — Cursor PASS = zero Wave credit)

WAVE_1=UNCERTIFIED · WAVE_1_CLEAN_STREAK=0 · WAVE_2=UNCERTIFIED · WAVE_3=LOCKED · BIRTH_AUTHORISED=NO

## Pre-fix reproductions

| Class | Reproduced |
|------|------------|
| False section-contract diagnostic leak | YES |
| Missing verdicts despite claim text | YES |
| Evidence ranking by measured magnitude | YES |
| Dropped population scope qualifier | YES |

## Final-visible boundary

`FINAL_RESPONSE_BEFORE_TRANSPORT → stripInternalValidatorDiagnostics → assessFinalVisibleContract → PASS|regenerate|fail-closed → TRANSPORT`

One parser: `executive-final-visible-contract.ts` (release + certification + production grader).

## Mutator simplification

| | Before | After |
|--|--------|-------|
| STRUCTURE | demote + **diagnostic append** ×2 | demote only; diagnostic **REMOVED**; hard gate |
| CLAIM | soft omission telemetry | orphan strip + hard fail |
| FAIL-CLOSED | bypassed final contract | re-runs finalizeVisible + strip diagnostics |

STRUCTURE_MUTATORS_BEFORE≈8 · AFTER≈6  
CLAIM_MUTATORS_BEFORE≈7 · AFTER≈7 (hard gate ownership; orphan strip fixed)

## Evidence quality

- MEASURED_VALUE ≠ EVIDENCE_STRENGTH
- obs < pop → PARTIAL (never FULL)
- Scope qualifiers preserved
- Missing ranked subjects → VALUE_FOR_STRENGTH_SUBSTITUTION

## Gates

FAST / DEPLOY / FULL PASS  
IC real-path PASS  
PRODUCTION_FIRST_VISIBLE PASS on `39ce4c2f`  
INTERNAL_VALIDATOR_DIAGNOSTIC_VISIBLE=0  
OBJECTIVE_VALIDATOR_FALSE_PASS=0 · FALSE_FAIL=0  
KNOWN_P0=0 · KNOWN_P1=0 (engineering)

## Remaining weakness

Some ranking-only asks still draft a claim-template preamble before the injected evidence-strength block. Contract gates pass when the strength order is present; first-pass narrative quality for pure ranking asks remains a follow-on polish item (not a Wave cert).
