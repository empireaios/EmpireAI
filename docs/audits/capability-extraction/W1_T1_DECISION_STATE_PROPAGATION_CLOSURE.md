# W1-T1 Decision State Propagation Closure

**MISSION_TYPE:** DEVELOPMENT_UNBLOCK  
**TARGET:** W1_T1_CROSS_SECTION_DECISION_CONSISTENCY  
**SEVERITY:** P1  
**WAVE_CREDIT:** 0  
**WAVE_1:** PAUSED  
**WAVE_1_CLEAN_STREAK:** 0  
**BIRTH_AUTHORISED:** NO  
**TARGET_CLOSED:** YES  

## A. Exact W1-T1 trace

| Field | Value |
|---|---|
| TRACE_FOUND | **NO** (durable `chat-requests` / delivery-forensics window did not retain Aurora/Beacon/Cedar row) |
| TRACE_ID | null |
| REQUEST_ID | null |
| BRAIN_OUTPUT | Not recovered from durable store |
| BRAIN_TO_USER_EQUIVALENT | Assumed YES (shell architecture already externally confirmed; failure was semantic) |
| Reproduction | Deterministic local DecisionCase on W1-T1-equivalent pack (pre-fix) |

Pre-fix DecisionCase on the failure class:

- ELIGIBLE_SET={Aurora, Cedar} (wrong)
- SELECT Cedar (wrong)
- Cedar delivery gate used **earlier 5 days**, ignored **corrected 8 days**

Visible answer then mixed LLM-corrected Cedar-ineligible prose with DecisionCase-stale eligible/select and a false DO NOT SELECT — three incompatible states.

## B–D. Canonical state / divergence

| Field | Value |
|---|---|
| CANONICAL_CEDAR_STATE_CORRECT (pre-fix) | **NO** |
| RAW_EARLIER_DELIVERY | 5 |
| CORRECTED_VERIFIED_DELIVERY | 8 |
| CANONICAL_CURRENT_DELIVERY (pre-fix) | 5 (bug) |
| CANONICAL_CURRENT_DELIVERY (post-fix) | 8 |
| FIRST_DECISION_DIVERGENCE_LAYER | DecisionCase gate evaluation |
| FIRST_DECISION_DIVERGENCE_FUNCTION | `evaluateCandidateGates` delivery days first-match (`/delivery … days/`) |
| EXPECTED | Cedar delivery FAIL; ELIGIBLE={Aurora}; SELECT Aurora |
| ACTUAL (pre-fix) | Cedar PASS on 5; ELIGIBLE={Aurora,Cedar}; SELECT Cedar |

## E. Authority inventory

| Role | Before | After |
|---|---|---|
| Eligibility | DecisionCase + LLM prose + eligible-list polish | **DecisionCase** (`buildDecisionCaseState`) sole logical authority; polish repairs to it |
| Selection | DecisionCase + LLM + recommendation append | **DecisionCase recommendation** + `repairDecisionVisibility` |
| Recommendation | DecisionCase + task synth + release/polish | Same, constrained to canonical |

Shell / Option-E / arithmetic formula engine: untouched.

## F. Root cause

1. **PRIMARY:** `SUPERSEDED_VALUE_USED_IN_CURRENT_GATE` — earlier delivery 5 won over later verified corrected 8.  
2. **SECONDARY:** bare `contribution 12.80` (no currency symbol) not treated as given-metric → calculator unit-econ UNKNOWN hijack on production NEW cases.  
3. **TERTIARY:** visibility repair incomplete for `Eligible set:` / select-ineligible / DO NOT SELECT contradictions when canonical SELECT exists.

## G. Implementation

1. `extractCurrentDeliveryDays` — corrected/verified/later supersede earlier/historical.  
2. `repairDecisionVisibility` — fix Eligible set lines; neutralize select-ineligible; replace false DO NOT SELECT.  
3. `isGivenMetricDecisionAsk` — bare numeric contribution/margin/profit/score + decision shape.

## H–L. Qualification

Evidence: `W1_T1_DECISION_STATE_PROPAGATION_QUAL.json`

| Gate | Result |
|---|---|
| REPRO_CASES | 12 |
| CORRECTED_GATE_CASES | 100 / CURRENT_GATE_ERROR=0 / SUPERSEDED=0 |
| ELIGIBLE_SET_CASES | 100 / ERROR=0 |
| SELECTION_CASES | 100 / OUTSIDE=0 / FALSE_NO_SELECTION=0 |
| REVERSAL_CASES | 75 / CONTAMINATION=0 |
| CROSS_SECTION_DECISION_CONTRADICTION | 0 |
| NEGATIVE_CONTROL_FALSE_PASS | 0 |
| FALSE_MIXED_CURRENCY / ARITHMETIC_TASK_HIJACK | 0 / 0 |

## M–O. Preserve

| Gate | Result |
|---|---|
| G1 / G2 / G4 | CLEARED (arithmetic + given-metric preserved) |
| SHELL_REGRESSION | 0 |
| ARCHITECTURE_READY_EXTERNAL | YES |

## P. Capability delta

| Cap | Class |
|---|---|
| EC04 / EC10 / EC11 / EC12 | IMPROVED (corrected-gate + cross-section consistency) |
| EC01 / EC02 | UNCHANGED |
| EC03 / EC18 / EC25 | UNCHANGED (no material regression in focused locks) |

## Q. Production first-visible

Evidence: `W1_T1_DECISION_STATE_PROPAGATION_PRODUCTION.json`

**8/8 PASS** on NEW scenarios (no Aurora/Beacon/Cedar replay).

| DEPLOYMENT_ID | `a6086d7e-a995-413e-94ed-da16b72dec26` |
| SEMANTIC_CODE_SHA | `01b15a57269967f446bed4dc4765d2ebd0f7e26e` |

## R. SHAs

| Field | Value |
|---|---|
| BASELINE_SEMANTIC_SHA | `d2b7d01e` |
| FINAL_SEMANTIC_SHA | `01b15a57` |
| INFRA_SHA | unchanged (shell not modified) |
| BFF_SHA | unchanged |
| DEPLOYMENT_ID | `a6086d7e-a995-413e-94ed-da16b72dec26` |
| DOCS_SEAL_SHA | (this docs commit) |

## S. Remaining weaknesses

- Exact GK W1-T1 durable row not found (retention window / search gap).  
- 873 historical indexed-missing visual-memory IDs unrelated.  
- Contribution/stock correction helpers still delivery-primary (delivery was T1 failure mode).

## T–U. Wave / next

W1-T1 remains FAIL historically (zero credit).  
Next: **NEW unseen W1-T1**.  
CURSOR_MISSIONS_BEFORE_NEXT_PILLOW_TEST=0.
