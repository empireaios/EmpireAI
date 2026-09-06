# BUILD: EC01/EC02 Commercial Arithmetic Precision V1

**MISSION_TYPE:** DEVELOPMENT_BUILD  
**TARGET:** EC01_EC02_COMMERCIAL_ARITHMETIC  
**WAVE_CREDIT:** 0  
**BIRTH_AUTHORISED:** NO  
**TARGET_CLOSED:** YES  

## SHAs / deployment

| Field | Value |
|---|---|
| BASELINE_SHA | `934c031d` |
| SEMANTIC_CODE_SHA | `b5928344` |
| RUNNING_BRAIN_SHA | null on `railway up` (expected) |
| DEPLOYMENT_ID | `0c0c3115-a222-445d-8950-8552e524abad` |
| DOCS_SEAL_SHA | (this docs commit) |

---

## A. EC01/02 baseline failures

| Probe | Expected | Before (Pillow) | Class |
|---|---|---|---|
| EC01 classic | ~S$14.60 | **S$15** | NATIVE_CAPABILITY_GAP (fee% rounding) |
| EC02 cost shock | ~S$12.60 | **S$13** | follows prior rounding |
| Decimal fee | 39.90 / 12.35 / 4.80 / 14.5% / 1.20 → **15.76** | often whole-number approx | premature rounding |

Differed from recent orchestration/stub failures → **BUILD** justified; scope kept to commercial arithmetic.

---

## B. Existing arithmetic architecture

| Field | Value |
|---|---|
| EXISTING_ARITHMETIC_AUTHORITIES | presale `calculateExpectedContribution` (absolute fees); pricing-worker fee%×price; decision-case `parseMoney`/`parsePct`; **no** prior executive fee%→contribution calculator on chat path |
| DUPLICATION | avoided — single new executive module |
| REUSED_COMPONENTS | contribution formula shape from presale; fee%×price from pricing-worker |
| CHOSEN | new `executive-commercial-arithmetic.ts` + task-contract / release-gate / bounded-decision inject |

---

## C. Chosen implementation

1. **Parse** commercial operands (price, supplier, shipping, % fee, fixed fee, refund, other, currency).
2. **Compute** deterministically:  
   `contribution = price − supplier − shipping − (price × fee%/100) − fixed − return − other`
3. **Authority path:**
   - Pure arith asks → `synthesizeCommercialArithmeticAnswer`
   - Decision + arith → decision synthesis **injects** calculator contribution (does not suppress SELECT)
   - Release gate → `repairAnswerWithCalculator` overrides invented FX / false-complete / wrong rounding
4. **Unknown discipline:** missing fee → `CONTRIBUTION=UNKNOWN`; MIXED currency without FX → no invented conversion; forecast/realised ledgers not forced through unit-price UNKNOWN.

---

## D. Precision / rounding policy

| Field | Policy |
|---|---|
| INTERNAL_PRECISION_POLICY | IEEE float64 for intermediates; percentage fee = price × (pct/100) at full precision before subtraction |
| VISIBLE_ROUNDING_POLICY | Round only final contribution/margin for display to **2 decimal places**; do not round intermediate fee amounts before contribution |

---

## E–I. Qualification (DEV_ARITH_FULL)

Evidence: `BUILD_EC01_EC02_ARITH_DEV_FULL_QUAL.json`

| Gate | Result |
|---|---|
| EC01_RAW_CASES | 150 / MATERIAL_ARITHMETIC_ERROR=0 |
| EC02_UNIT_ECONOMIC_CASES | 150 / UNIT_ECONOMIC_ERROR=0 |
| DECIMAL_EDGE_CASES | 100 / PREMATURE_ROUNDING_ERROR=0 |
| INTEGRATED_COMMERCIAL_CASES | 75 / ARITHMETIC_CAUSED_DECISION_ERROR=0 |
| INVENTED_FX | 0 |
| INVENTED_COST | 0 |
| FALSE_COMPLETE_ECONOMICS | 0 |
| DEV_ARITH_FAST_PASS | YES (core lock + %) |
| DEV_ARITH_FULL_PASS | YES |
| PRESERVE_REGRESSION_PASS | YES (PRESERVE_MATERIAL_REGRESSION=0) |

---

## J–K. PRESERVE + G1/G2

| Gate | Result |
|---|---|
| PRESERVE_MATERIAL_REGRESSION | 0 |
| G1_OPEN_STUB | **CLEARED** |
| G2_WARM_TRANSITION | **CLEARED** |
| G4_ARITHMETIC | **CLEARED** |

---

## L. Capability delta (small production slice)

Evidence: `BUILD_EC01_EC02_ARITH_CAPABILITY_DELTA.json`

| Capability | Before | After | Delta |
|---|---|---|---|
| EC01 | PARTIAL (15 vs 14.60) | exact 14.60 | **IMPROVED** |
| EC02 | NOT_DEMONSTRATED (13 vs 12.60) | exact 12.60 | **IMPROVED** |
| EC03 | DEMONSTRATED | realised 2.75 kept separate | **UNCHANGED** |
| EC10 | DEMONSTRATED | gate-correct | **UNCHANGED** |
| EC18 | IMPROVED (prior UNBLOCK) | open plan, no stub | **UNCHANGED** |
| EC25 warm | IMPROVED (prior UNBLOCK) | RADIX + 14.60, no Unsupported | **UNCHANGED** |

---

## M. Representative production review

Evidence: `BUILD_EC01_EC02_ARITH_PRODUCTION_VALIDATE.json`  
**REPRESENTATIVE_REVIEW_COUNT=10** · **MATERIAL_ANOMALIES=0** · **PRODUCTION_FIRST_VISIBLE_PASS=YES**

### Before → After (classic)

| Case | Before | After |
|---|---|---|
| Price 40 / cost 18 / ship 4 / fee 6% / refund 1 | **S$15** | **S$14.60** |
| Cost rises to 20 | **S$13** | **S$12.60** |
| 39.90 / 12.35 / 4.80 / 14.5% / 1.20 | rounded whole | **S$15.76** |
| Missing fee | invented partial | **UNKNOWN** |
| SGD + USD without FX | invented rate | **MIXED / no invented FX** |
| Warm + select | Unsupported risk historically | **RADIX SELECT + S$14.60** |

---

## N. Latency

| Metric | Baseline (capability extraction) | Candidate (prod validate) |
|---|---|---|
| P50 | ~4142 ms | **2935 ms** |
| P95 | ~14017 ms | **5951 ms** |
| EXTRA_LLM_CALLS | — | **0** |

Deterministic calculator adds negligible latency (no extra LLM round-trip).

---

## O. Remaining weaknesses

- Forecast/realised **ledger** totals still rely on LLM arithmetic when not unit-price shaped (EC03 preserved; not a second calculator layer).
- Some LLM bodies still narrate math; calculator/repair ensures authoritative figure when unit economics resolve.
- `RUNNING_BRAIN_SHA` remains null on CLI `railway up` (known).

---

## P. Wave-entry gate

| Gate | Status |
|---|---|
| G1_OPEN_STUB | CLEARED |
| G2_WARM_TRANSITION | CLEARED |
| G4_ARITHMETIC | **CLEARED** |
| WAVE_1_ENTRY_READY | **YES** (engineering view — ChatGPT/Grand King decide entry) |

**Do not restart Wave automatically.**

---

## Q. Exact next action

**STOP.** Return to Grand King + ChatGPT.  
ChatGPT decides whether Wave 1 entry is satisfied or MEASURE_MORE capabilities require development first.

---

## Certification state (unchanged)

```
WAVE_1=UNCERTIFIED
WAVE_1_CLEAN_STREAK=0
WAVE_2=UNCERTIFIED
WAVE_3=LOCKED
BIRTH_AUTHORISED=NO
WAVE_CREDIT=0
```
