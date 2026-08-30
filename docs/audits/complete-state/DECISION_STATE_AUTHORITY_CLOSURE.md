# Authoritative Decision State + Cross-Section Propagation — Engineering Seal

**Status:** ENGINEERING CLOSED (Wave-1 remains UNCERTIFIED; Birth NOT authorised)

**FINAL_LIVE_QUALIFIED_SHA (code):** `b96dc08fd27c021b91b99630ba1ae7d592fd7a0c`  
**Deployment ID:** `fb365025-f364-402f-a2c3-cf87d7d00b08`  
**Qualified base preserved:** provenance + causal graph on `654fe053`  
**Prior tip before this mission:** `654fe053` → deploy-fix tip `7a91a7ae` → consolidated tip `b96dc08f`

## Wave state (unchanged)

WAVE_1=UNCERTIFIED · WAVE_1_CLEAN_STREAK=0 · WAVE_2=UNCERTIFIED · WAVE_3=LOCKED · BIRTH_AUTHORISED=NO

Cursor engineering PASS = zero Wave credit.

---

## Decision fields (§70)

| Field | Value |
|-------|--------|
| AUTHORITATIVE_DECISION_STATE_VALIDATED | YES |
| ELIGIBILITY_PROPAGATION_VALIDATED | YES |
| RECOMMENDATION_PROPAGATION_VALIDATED | YES |
| CROSS_SECTION_DECISION_CONSISTENCY_VALIDATED | YES |
| COMMERCIAL_DECISION_GENERALIZATION_VALIDATED | YES |
| REAL_PATH_BEHAVIOR_VALIDATED | YES |

---

## A. Pioneer-class reproduction (new names only)

Pioneer shapes reproduced without replaying Pioneer:

| Shape | Result |
|-------|--------|
| Detail FAIL → summary eligible | Local lock dirty-draft repair PASS |
| Pending ⇒ eligible claim | Claim verdict CONTRADICTED on live |
| Sole eligible → DO NOT SELECT | Repair injects SELECT {id} |
| One eligible / zero / multi cheapest | Production ladder PASS |
| Forecast winner hard-gate FAIL | CORRIDOR_B selected on live |

`PIONEER_CLASS_REPRODUCED=YES` (FLINT/MAPLE/OAK; ASH/ELM; PINE/TEAK; etc.)

## B. First decision divergence

`FIRST_DECISION_DIVERGENCE=` canonical `decisionCase` existed, but soft-correct answers skipped `repairDecisionVisibility` (assess did not treat missing SELECT / DO NOT SELECT as inconsistency). Parallel path: multipart Snapshot units could be filled with epistemic “Unsupported as established fact” stubs. Root class: **DECISION_STATE_FRAGMENTATION** (not arithmetic).

## C–H. Architecture

| Concern | Owner |
|---------|--------|
| Gates | Three-state PASS/FAIL/UNKNOWN; pending mandatory approval ≠ PASS |
| Eligibility | Per-candidate all hard gates PASS |
| Eligible set | Derived only from `currentlyEligible` |
| Comparison | Among eligible only; attractiveness never overrides hard FAIL |
| Recommendation | SELECT / DO_NOT_SELECT / UNRESOLVED from objective + eligible set |
| Current vs reversal | Separate `recommendation` vs `reversalConditions` (all remaining blockers) |

Module: `executive-decision-case-state.ts` → wired into `executive-canonical-state.ts`, claim propositions, release polish.

## I–K. Propagation + validator

- Claim audit consumes `decisionCase` (pending≠eligible; eligible-count)
- Eligible / recommendation / conclusion repaired via `repairDecisionVisibility` (no user-visible diagnostics)
- Final assess fails on missing SELECT / missing DO NOT SELECT / false eligible assertions
- Canonical brief includes decision state for LLM; strip path removes leaked ELIGIBLE_SET / CURRENT_RECOMMENDATION lines

## L–O. Qualification matrices

| Metric | Value |
|--------|------:|
| COMMERCIAL_DECISION_RAW_CASES | ≥300 |
| CROSS_SECTION_DECISION_CASES | ≥200 |
| COMMERCE_INTEGRATED_CASES | ≥150 |
| JUDGMENT_CONTROLS | ≥75 |
| ELIGIBILITY_ERROR | 0 |
| ELIGIBLE_SET_ERROR | 0 |
| CURRENT_RECOMMENDATION_ERROR | 0 |
| CROSS_SECTION_DECISION_CONTRADICTION | 0 |
| OVER_DETERMINIZATION | 0 |
| NEGATIVE_CONTROL_FALSE_PASS | 0 |
| LARGE_CANDIDATE_* | 0 |
| ORDER_DEPENDENT_DECISION_ERROR | 0 |

Evidence: `DECISION_STATE_AUTHORITY_QUAL.json` (`pass: true`)

## P–U. Preserved closures

| Suite | Result |
|-------|--------|
| Provenance regression | PASS (DEPLOY gate) |
| Causal graph regression | PASS (incl. causal-state-atomic after empty-gate null) |
| Transport contract | PASS |
| Evidence / final visible | PASS |
| Memory / path parity | Covered under DEPLOY/FULL suites |
| IC-01..25 real-path | Covered under FAST/DEPLOY/FULL catalog |

## V. FAST / DEPLOY / FULL

| Gate | Result |
|------|--------|
| FAST | PASS |
| DEPLOY | PASS |
| FULL | PASS |

## W. Production first-visible

| Field | Value |
|-------|--------|
| LIVE_SHA | `b96dc08fd27c021b91b99630ba1ae7d592fd7a0c` |
| PRODUCTION_DECISION_STATE_PASS | **PASS 10/10** |
| Cases | one eligible, zero, multi cheapest, pending, forecast vs gate, history A→B, continuation gate clear, exact-N claims |

Evidence: `DECISION_STATE_AUTHORITY_PRODUCTION.json`

## X. Cost / latency

Production ladder case latencies ~2–15s first-visible (see production JSON `ms` fields). No live commerce actions.

## Y–Z. SHA provenance

| Field | Value |
|-------|--------|
| SEMANTIC_CODE_SHA | `b96dc08fd27c021b91b99630ba1ae7d592fd7a0c` |
| RUNNING_BRAIN_SHA | `b96dc08fd27c021b91b99630ba1ae7d592fd7a0c` |
| RUNNING_FRONTEND | empire-ai.co (cockpit BFF; unchanged this mission) |
| DEPLOYMENT_ID | `fb365025-f364-402f-a2c3-cf87d7d00b08` |
| CERTIFIED_SHA | `b96dc08f` (engineering seal only) |
| DOCS_SEAL_SHA | set at docs seal commit |

## AA. Remaining weaknesses

1. Some multipart Snapshot units can still open with epistemic “Unsupported as established fact” stubs even when later sections and repair lock the decision (recommendation/claims correct). Prefer decision-aware unit synthesis next.
2. Continuation prompts should restate candidate gates (ladder does); automatic prior-turn decisionCase merge not yet general.
3. Grader phrases remain keyword-assisted; executive quality still partly regex-bounded.

`REPRESENTATIVE_FINAL_VISIBLE_REVIEW=YES`  
`MATERIAL_ANOMALIES_FOUND=` Snapshot epistemic stub on some synthetic multipart turns (non-blocking for locked recommendation/claims on production ladder).

## AB. Certification state

WAVE_1=UNCERTIFIED  
WAVE_1_CLEAN_STREAK=0  
WAVE_2=UNCERTIFIED  
WAVE_3=LOCKED  
BIRTH_AUTHORISED=NO

## AC. Exact next action

STOP. Return control to Grand King + ChatGPT for a **NEW blind Wave 1 T1**.

Do NOT run Pioneer. Do NOT replay sealed exams. Do NOT award Wave credit. Do NOT authorize Birth.

---

## Commits (this mission)

| SHA | Role |
|-----|------|
| `bb3e3915` | Authoritative multi-candidate decision state |
| `7a91a7ae` | Unblock Railway TS2367 gate-id map |
| `b96dc08f` | Lock recommendation action into visibility repair + peer parse |

`FINAL_CANDIDATE_SINGLE_SHA=YES` (`b96dc08f`)  
`KNOWN_P0=0` · `KNOWN_P1=0` (engineering scope)
