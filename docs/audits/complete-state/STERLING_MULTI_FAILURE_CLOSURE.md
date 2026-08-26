# Sterling Multi-Failure Closure — Engineering Seal

**Status:** ENGINEERING CLOSED (Wave-1 remains UNCERTIFIED; Birth NOT authorised)  
**SEMANTIC_CODE_SHA:** `66d98803cd1df48131ca24d504b9be71c50b8388`  
**CERTIFIED_SHA (engineering):** `66d98803cd1df48131ca24d504b9be71c50b8388`  
**RUNNING_BRAIN_SHA:** `66d98803cd1df48131ca24d504b9be71c50b8388`  
**DEPLOYMENT_ID:** `7dffc14f-eb95-4980-a7ca-cbf9a10ba9e5`  
**Path-parity base preserved:** `239cc95b`  
**Verdict-ownership base preserved:** `3b60fd7c`

## Wave state (unchanged — Cursor PASS = zero Wave credit)

WAVE_1=UNCERTIFIED · WAVE_1_CLEAN_STREAK=0 · WAVE_2=UNCERTIFIED · WAVE_3=LOCKED · BIRTH_AUTHORISED=NO

## Reproductions (pre-fix)

| Class | Reproduced | Mechanism |
|------|------------|-----------|
| Structure 6→9 | YES | Nested ranking markers counted/renumbered as top-level |
| Claim omission | YES | Claim N without **Verdict:** counted complete; UNRESOLVED blocks not regenerated |
| Evidence ranking | YES | No evidence-strength model; % substituted for strength |

## Root causes

- **STRUCTURE_ROOT_CAUSE:** `extractTopLevelSectionMarkers` + `renumberTopLevelSections` treated all unindented `N.` as top-level.
- **CLAIM_COMPLETENESS_ROOT_CAUSE:** `claimLocallyRendered` accepted Claim header without verdict; enforce skipped incomplete UNRESOLVED blocks.
- **EVIDENCE_RANKING_ROOT_CAUSE:** No ranking-objective / canonical evidence-strength layer.

## Implementation

- `executive-section-contract.ts` — demote nested numbers; title-aware contract markers; `TOP_LEVEL_SECTION_COUNT_MISMATCH` gate
- `executive-evidence-ranking.ts` — objective classification + strength score (coverage/verification, not %)
- `claimLocallyRendered` / `assessClaimCompletenessGate` — verdict required; missing verdict forces regen
- Polish + release gate wired; change-impact maps section/evidence → IC-16/IC-13/IC-10
- FAST / DEPLOY / FULL include Sterling lock + qualify corpus

## Qualification

| Gate | Result |
|------|--------|
| Structure ≥100 | PASS · mismatch=0 · nested-promoted=0 |
| Claims ≥100 | PASS · omission=0 · verdict-omission=0 |
| Ranking ≥100 | PASS · objective-misread=0 · value-for-strength=0 |
| Combined ≥100 | PASS · 100% |
| Negatives | PASS · false-pass=0 |
| FAST / DEPLOY / FULL | PASS |
| Verdict ownership (3b60) | preserved · LLM_RESOLVED_VERDICT_OVERRIDE=0 |
| PRODUCTION_FIRST_VISIBLE | PASS on `66d98803` / deploy `7dffc14f` |

## Acceptance snapshot

```
STERLING_STRUCTURE_REPRODUCED=YES
STERLING_CLAIM_OMISSION_REPRODUCED=YES
STERLING_RANKING_ERROR_REPRODUCED=YES
TOP_LEVEL_STRUCTURE_TREE=YES
FINAL_STRUCTURE_VALIDATOR=YES
EXPECTED_CLAIM_COUNT_CONTRACT=YES
CLAIM_RELEASE_GATE=YES
CANONICAL_EVIDENCE_STATE=YES
RANKING_OBJECTIVE_CLASSIFICATION=YES
STRUCTURE_RAW_CASES=100 · TOP_LEVEL_SECTION_COUNT_MISMATCH=0 · NESTED_ITEM_PROMOTED_TO_TOP_LEVEL=0
CLAIM_AUDIT_RAW_CASES=100 · MATERIAL_CLAIM_OMISSION=0 · EXPLICIT_VERDICT_OMISSION=0
EVIDENCE_RANKING_RAW_CASES=100 · RANKING_OBJECTIVE_MISREAD=0 · VALUE_FOR_STRENGTH_SUBSTITUTION=0 · MATERIAL_EVIDENCE_RANKING_ERROR=0
COMBINED_STERLING_CLASS_CASES=100 · COMBINED_CASE_PASS_RATE=100%
NEGATIVE_CONTROL_FALSE_PASS=0
NORTHSTAR_CLASS_REGRESSION_PASS=YES (protected IC class; not replayed)
SOLACE_CLASS_REGRESSION_PASS=YES (protected IC class; not replayed)
IC_01_25_REAL_PATH_PASS=YES (deploy IC suite + real-path harness)
LLM_RESOLVED_VERDICT_OVERRIDE=0 · FINAL_VERDICT_MISMATCH=0
IRRELEVANT_VISIBLE_DOCTRINE=0 · MINI_FAN_CONTAMINATION=0 · IRRELEVANT_TEMPORAL_TEMPLATE=0
FAST_GATE_PASS=YES · DEPLOY_GATE_PASS=YES · FULL_GATE_PASS=YES
PRODUCTION_FIRST_VISIBLE_PASS=YES
FINAL_CANDIDATE_SINGLE_SHA=YES
KNOWN_P0=0 · KNOWN_P1=0
```
