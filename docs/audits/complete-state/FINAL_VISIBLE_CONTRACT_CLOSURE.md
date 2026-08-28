# Final Visible Contract + Evidence Quality Core — Engineering Seal

**Status:** ENGINEERING CLOSED (Wave-1 remains UNCERTIFIED; Birth NOT authorised)

## Wave state (unchanged)

WAVE_1=UNCERTIFIED · WAVE_1_CLEAN_STREAK=0 · WAVE_2=UNCERTIFIED · WAVE_3=LOCKED · BIRTH_AUTHORISED=NO

## Pre-fix reproductions

| Class | Reproduced |
|------|------------|
| False section-contract diagnostic leak | YES |
| Missing verdicts despite claim text | YES |
| Evidence ranking by measured magnitude (28/40 @ 8.5% vs 25/25 @ 8%) | YES |
| Dropped population scope qualifier | YES |

## Architecture

**FINAL_VISIBLE_CONTRACT_BOUNDARY:**  
`FINAL_RESPONSE_BEFORE_TRANSPORT → assessFinalVisibleContract / stripInternalValidatorDiagnostics → PASS|regenerate|fail-closed → TRANSPORT`

One parser implementation for release + certification: `executive-final-visible-contract.ts`.

## Mutator simplification

| Class | Before | After |
|------|--------|-------|
| STRUCTURE_MUTATORS | enforceExactSectionContract (demote + **diagnostic append**) ×2 (finalize+polish), renumber, reconstruct, coverage append | demote only (candidate repair); **diagnostic append REMOVED**; hard gate fails shortfall |
| CLAIM_MUTATORS | enforceClaimEnumeration + soft EXPLICIT_VERDICT_OMISSION telemetry | enforce remains candidate materializer; **hard fail** on omission; strip orphans without Verdict; final-string claim contract |

## Evidence quality

- `MEASURED_VALUE ≠ EVIDENCE_STRENGTH` end-to-end
- `obs < pop` never `FULL_POPULATION` (PARTIAL)
- Ranking objective: evidence cues win over % cues
- Scope qualifier preserved / overgeneralization gated

## Qualification (local)

See `FINAL_VISIBLE_CONTRACT_QUAL.json` / `FINAL_VISIBLE_CONTRACT_REPRO.json`.

FAST / DEPLOY / FULL wired.

Production SHAs filled after single deploy.
