# Indirect Causal Compound Closure — Seal

**Date:** 2026-08-24  
**Code SHA (unchanged tip):** `77d1283e3f4ce906567f892870d4fdeadb501f35`  
**Live deploymentId:** `1f58f809-abb6-466d-b846-e8b0c754a3a5`  
(`railway up` leaves `gitCommitSha` empty; deploymentId is production truth.)

## Reproduction (before fix, on HEAD `0baee86a`)

`REPRODUCED_BEFORE_FIX=YES`

Shape: A failure → workload transfer/failover → B constraint; later claim “B independent/unrelated to A because B lacks A’s direct mechanism” returned **Supported**.

**FIRST_DIVERGENCE_LAYER:** claim proposition mapping  
Independence conclusion classified as `generic` → filtered out → only `causal_different_root=supported` remained → overall **SUPPORTED**.

**ROOT_CAUSE:** Material compound assessment treated a true different-mechanism premise as sufficient for overall SUPPORTED when the unrelatedness conclusion was not mapped as a material proposition; failover/transfer phrasing also failed to bind A→B in canonical causal state for some wording.

## Fix (semantic path, not phrase patches)

1. Map “causally independent / unrelated / lacks|did not share direct mechanism” into `causal_unrelated` + `causal_different_root` compounds.
2. Inject independence as material when asserted but unmapped.
3. Bind workload shift / failover / constraint-resulted-from-transfer into canonical causal links (prior failure actor → destination).
4. Soft single-claim asks (`assess this claim`, `separate verdict on`, `judge:`) extract obligations so explicit Claim verdicts bind on the live path.

## Qualification

| Metric | Value |
|--------|-------|
| RAW_CAUSAL_COMPOUND_CASES | 100 |
| RAW_CAUSAL_COMPOUND_PASS | 100% |
| WRONG_SUPPORTED_VERDICTS | 0 |
| NEGATIVE_CONTROL_FALSE_PASS | 0 |
| Full local regression (RCS L0–L4, canonical claims, timestamps, decision-gate, causal-state, constitutional corpus) | PASS |

## Production

New scenarios only (no sealed exams). First visible response only.  
Evidence: `docs/audits/complete-state/INDIRECT_CAUSAL_COMPOUND_PRODUCTION_LADDER.json`  
**PRODUCTION_FIRST_VISIBLE_VALIDATION=PASS** (4/4 explicit Contradicted; WRONG_SUPPORTED=0)

## Status (unchanged)

WAVE_1=UNCERTIFIED  
WAVE_1_CLEAN_STREAK=0  
BIRTH_AUTHORISED=NO  

Cursor engineering PASS gives zero Wave certification credit.
