# Final Visible Contract + Evidence Quality Core — Engineering Seal

**Status:** ENGINEERING CLOSED (Wave-1 remains UNCERTIFIED; Birth NOT authorised)

**SEMANTIC_CODE_SHA:** `ba304f300a7eeb2bec272eb61033651e3663ddc7`  
**CERTIFIED_SHA (engineering):** `ba304f300a7eeb2bec272eb61033651e3663ddc7`  
**RUNNING_BRAIN_SHA:** `ba304f300a7eeb2bec272eb61033651e3663ddc7`  
**DEPLOYMENT_ID:** `26cb4f8e-3e46-4818-8a20-62fb803e2a7c`  
**Base preserved:** `66d98803` (Sterling classes) · `3b60fd7c` (verdict ownership) · `239cc95b` (path parity)

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

One parser: `executive-final-visible-contract.ts` (release + certification).

## Mutator simplification

| | Before | After |
|--|--------|-------|
| STRUCTURE_MUTATORS | demote + **diagnostic append** ×2 | demote only; diagnostic **REMOVED**; hard gate |
| CLAIM_MUTATORS | soft omission telemetry | orphan strip + hard fail on omission |

STRUCTURE_MUTATORS_BEFORE≈8 writers · AFTER≈6 (diagnostic append gone; dual enforce demoted to demote-only)  
CLAIM_MUTATORS_BEFORE≈7 · AFTER≈7 (same writers; hard gate ownership added; strip orphans fixed)

## Evidence quality

- MEASURED_VALUE ≠ EVIDENCE_STRENGTH
- obs < pop → PARTIAL (never FULL)
- Scope qualifiers preserved / overgeneralization gated
- Stub answers without ranked subjects fail VALUE_FOR_STRENGTH_SUBSTITUTION

## Gates

FAST / DEPLOY / FULL PASS · PRODUCTION_FIRST_VISIBLE PASS on `ba304f30` / `26cb4f8e`  
INTERNAL_VALIDATOR_DIAGNOSTIC_VISIBLE=0 on production ladder  
OBJECTIVE_VALIDATOR_FALSE_PASS=0 · FALSE_FAIL=0
