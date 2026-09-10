# GIVEN METRIC / ARITHMETIC AUTHORITY CLOSURE

**MISSION_TYPE:** SEMANTIC_INTERFERENCE_FORENSIC  
**SEVERITY:** P1 — WAVE ENTRY BLOCKER  
**WAVE_CREDIT:** 0  
**WAVE_1:** PAUSED (entry readiness only — Wave not run)  
**BIRTH_AUTHORISED:** NO  
**TARGET_CLOSED:** YES  
**WAVE_1_ENTRY_READY:** YES  

## Exact checkpoint

| Field | Value |
|---|---|
| CHECKPOINT_TRACE_FOUND | YES |
| TRACE_ID | `dft_f953ab40578b4f98` |
| REQUEST_ID | `pcr_58bed31b41174e15` |
| SESSION_ID | `30053163-1227-4433-a13a-788b22a22019` |
| TIMESTAMP | `2026-09-08T11:37:49Z` |
| DID_BRAIN_ALREADY_SAY_MIXED_CURRENCY | YES |
| DID_BRAIN_ALREADY_OUTPUT_UNIT_ECONOMICS_STUB | YES |
| DID_BRAIN_PRODUCE_CORRECT_ELIGIBILITY | NO |
| deliveryClass | BRAIN_ANSWER (shell did not rewrite) |

## Root cause

| Field | Value |
|---|---|
| PRIMARY_ROOT_CAUSE | `CURRENCY_SCOPE_CONTAMINATION` + `ARITHMETIC_SCOPE_OVERREACH` |
| SECONDARY_ROOT_CAUSE | `DECISIONCASE_BYPASS` (inline Title/lowercase peer parse miss) + subject-default `"Unit economics"` synth trap; later warm negation `"do not recompute unit economics"` false compute ask |
| FIRST_MIXED_CURRENCY_LAYER | commercial arithmetic `detectCurrency` (`/S\$/` matched inside `US$13`) |
| FIRST_TASK_DIVERGENCE_LAYER | `isCommercialArithmeticAsk` / `synthesizeCommercialArithmeticAnswer` treating given contribution metrics as unit-econ calc; DecisionCase null so calculator won |
| ARITHMETIC_BUILD_CAUSALLY_INVOLVED | YES (narrow authority — EC01/EC02 preserved) |
| DECISIONCASE_CREATED (pre-fix) | NO on forensic one-line / Title-case peers |

## Fix (authority narrowing — not deletion)

1. **Currency:** do not treat `S$` inside `US$` as SGD.
2. **Invocation:** `isGivenMetricDecisionAsk` → calculator ask = false; synthesize requires message ask (subject `"Unit economics"` alone cannot force calculator).
3. **Negations:** `"do not recompute unit economics"` is not a positive compute ask.
4. **DecisionCase:** Title Case / lowercase inline peers; delivery max days; contribution/margin/profit/score floors; stock min; reversal counterfactuals.
5. **Economics branch:** given-metric decisions inject “use stated metrics” instead of recomputing contribution.
6. **Missing cost:** contribution asks without supplier cost → UNKNOWN (do not invent cost=0).

**Shell / Option-E / durable / BFF:** untouched.

## Qualification (local)

Evidence: `GIVEN_METRIC_ARITHMETIC_AUTHORITY_QUAL.json`

| Gate | Result |
|---|---|
| GIVEN_METRIC_DECISION_CASES | 100 / HIJACK=0 / FALSE_MIXED=0 / DECISION_ERROR=0 |
| ARITHMETIC_CASES | ≥100 / MATERIAL_ARITHMETIC_ERROR=0 |
| TRUE_MIXED_CURRENCY_DETECTION | 20/20 |
| WARM_SINGLE_CURRENCY_CASES | 50 / CONTAMINATION=0 |
| DECISION_INTEGRATION_CASES | 75 / ELIGIBLE=0 / SELECT=0 / REVERSAL=0 |
| INVENTED_FX / INVENTED_COST | 0 / 0 |
| EC01/EC02 DEV_ARITH_FULL | PASS (preserved) |
| G1_OPEN_STUB / G2_WARM / G4_ARITHMETIC | CLEARED |

## Production first-visible

Evidence: `GIVEN_METRIC_ARITHMETIC_AUTHORITY_PRODUCTION.json`

| Case | Result |
|---|---|
| given_contribution_decision (Juniper) | PASS |
| given_metric_reversal | PASS |
| pct_fee_calculation | PASS |
| true_mixed_currency | PASS |
| usd_after_sgd_warm | PASS |
| open_strategy | PASS |
| live_unknown_fact | PASS |
| **TOTAL** | **7/7 PASS** |

## Capability delta

| Cap | Class |
|---|---|
| EC01 / EC02 | UNCHANGED (preserved) |
| EC10 / EC11 / EC12 (given-metric multi-gate) | IMPROVED |
| EC18 / EC25_WARM | UNCHANGED / warm currency + negation scope preserved |
| SHELL_REGRESSION | 0 |

## SHAs / deployment

| Field | Value |
|---|---|
| BASELINE_SEMANTIC_SHA | `b5928344` (EC01/EC02 tip preserved as capability base) |
| SEMANTIC_CODE_SHA | `d2b7d01e34079df245db3e1ea103bdfbb137afea` |
| DEPLOYMENT_ID | `4617fd54-a90b-4a1c-8034-9bbe839028ff` |
| ARCHITECTURE_READY_EXTERNAL | YES (delivery — unchanged) |
| WAVE_1_ENTRY_READY | YES |
| Next Pillow test | **W1-T1** (not another shell checkpoint) |
