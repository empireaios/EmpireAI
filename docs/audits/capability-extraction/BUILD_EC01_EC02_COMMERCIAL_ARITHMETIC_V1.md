# BUILD EC01/EC02 — Commercial Arithmetic Precision V1

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
| DOCS_SEAL_SHA | `d080e296` |

## A. EC01/02 baseline failures

| Probe | Expected | Baseline Pillow | Class |
|---|---|---|---|
| EC01 L0 | ~S$14.60 | **S$15** | NATIVE_CAPABILITY_GAP (fee% rounding) |
| EC02 L0 | ~S$12.60 | **S$13** | Follow-on of same arithmetic gap |

Not orchestration/Unsupported takeover — deterministic math was approximated by the LLM.

## B. Existing arithmetic architecture

| Item | Finding |
|---|---|
| EXISTING_ARITHMETIC_AUTHORITIES | presale `calculateExpectedContribution` (absolute fees); pricing-worker fee%×price; decision-case `parseMoney`/`parsePct`; **no** prior executive fee%→contribution calculator on chat path |
| DUPLICATION | avoided — one new executive module |
| REUSED_COMPONENTS | contribution formula shape from presale; fee%×price from pricing-worker |
| Chosen module | `backend/src/orchestration/pillow-host/executive-commercial-arithmetic.ts` |

## C. Chosen implementation

**Principle:** Pillow interprets → structured operands → deterministic calculator → verified numeric result → Pillow reasons.

Wiring:
1. **Task synthesizer** — pure arithmetic asks use `synthesizeCommercialArithmeticAnswer` before epistemic/open shells.
2. **Decision cases** — eligibility/selection remains decision authority; economics branch injects calculator contribution.
3. **Release gate** — `repairAnswerWithCalculator` overrides invented FX, false-complete fee-unknown claims, and numeric mismatches.
4. **LLM brief** — `DETERMINISTIC_ARITHMETIC` injected when contribution is resolved.

**Does not:** invent missing costs, invent FX, combine forecast/realised ledgers, or teach arithmetic via prose prompts.

## D. Precision / rounding policy

| Policy | Value |
|---|---|
| INTERNAL_PRECISION_POLICY | IEEE float64 intermediates; percentage fee = price × (pct/100) at full precision before subtraction |
| VISIBLE_ROUNDING_POLICY | Round only final contribution/margin for display to 2 decimal places; do not round intermediate fee amounts before contribution |

Example: 14.5% × S$39.90 = 5.7855 internally → contribution 15.7645 → display **S$15.76**.

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
| CROSS_SECTION_ARITHMETIC_MISMATCH | 0 (repair enforces) |
| DEV_ARITH_FAST_PASS | YES (core lock + qualify) |
| DEV_ARITH_FULL_PASS | YES |
| PRESERVE_REGRESSION_PASS | YES / PRESERVE_MATERIAL_REGRESSION=0 |

## J–K. PRESERVE + G1/G2

| Gate | Result |
|---|---|
| G1_OPEN_STUB | **CLEARED** (open supplier-process plan; no Unsupported takeover) |
| G2_WARM_TRANSITION | **CLEARED** (live zero-orders → bounded RADIX + S$14.60) |
| PRESERVE EC03/EC10/EC18/warm EC25 | no material regression on delta slice |

## L. Capability delta

Evidence: `BUILD_EC01_EC02_ARITH_CAPABILITY_DELTA.json`

| Capability | Before | After | Delta |
|---|---|---|---|
| EC01 | PARTIAL (15 vs 14.60) | DEMONSTRATED (14.60) | **IMPROVED** |
| EC02 | NOT_DEMONSTRATED (13 vs 12.60) | DEMONSTRATED (12.60) | **IMPROVED** |
| EC03 | DEMONSTRATED | still separates forecast/realised | **UNCHANGED** |
| EC10 | DEMONSTRATED | gate-correct select | **UNCHANGED** |
| EC18 | IMPROVED (UNBLOCK) | open plan, no stub | **UNCHANGED** |
| EC25 warm | IMPROVED (UNBLOCK) | RADIX + 14.60 | **UNCHANGED** |

## M. Representative production review

Evidence: `BUILD_EC01_EC02_ARITH_PRODUCTION_VALIDATE.json`  
**REPRESENTATIVE_REVIEW_COUNT:** 10  
**MATERIAL_ANOMALIES:** 0  
**PRODUCTION_FIRST_VISIBLE_PASS:** YES

| Case | Observed |
|---|---|
| percentage-fee 39.90 / 14.5% | **S$15.76** |
| fixed-fee | **S$21.50** |
| negative contribution | **S$-5.00** |
| forecast vs realised | realised **S$2.75**; forecast kept separate |
| supplier + arith | **S$14.60** + QUILL |
| missing fee | **UNKNOWN** (no invented fee) |
| mixed currency | **MIXED / no invented FX** |
| warm bounded | zero orders → RADIX + **S$14.60** |
| open G1 | plan steps; no Unsupported takeover |
| classic EC01 | **S$14.60** (not 15) |

### Before → after (classic)

| | Text |
|---|---|
| BEFORE | contribution ≈ **S$15** |
| AFTER | **Contribution/order = S$14.60** (calculator-authoritative) |

## N. Latency

| Metric | Value |
|---|---|
| BASELINE_P50 / P95 (capability extraction envelope) | 4142 / 14017 ms |
| CANDIDATE_P50 / P95 (production validate) | **2935 / 5951** ms |
| EXTRA_LLM_CALLS | **0** |

Deterministic calculator adds negligible latency; no extra LLM round-trip.

## O. SHAs / deployment

See table at top. Semantic tip includes: `8448b70b` (feat) → repair series → `b5928344` (decision economics inject).

## P. Remaining weaknesses

- Forecast/realised **ledger totals** still rely on LLM arithmetic when no unit selling-price operands exist (EC03 path intentionally leaves calculator); unit-price contribution path is calculator-owned.
- Some LLM bodies still narrate correct math; release repair / synthesizer enforce authority when they diverge.
- No general algebra / tax / multi-currency FX engine (by design).

## Q. Wave-entry gate

| Gate | Status |
|---|---|
| G1_OPEN_STUB | CLEARED |
| G2_WARM_TRANSITION | CLEARED |
| G4_ARITHMETIC | **CLEARED** |
| WAVE_1_ENTRY_READY | **YES** (engineering view — ChatGPT/Grand King decide MEASURE_MORE) |

**Do not restart Wave automatically.**

## R. Exact next action

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

## Final stop block

```
MISSION_TYPE=DEVELOPMENT_BUILD
TARGET=EC01_EC02_COMMERCIAL_ARITHMETIC
TARGET_CLOSED=YES
G1_OPEN_STUB=CLEARED
G2_WARM_TRANSITION=CLEARED
G4_ARITHMETIC=CLEARED
WAVE_1_ENTRY_READY=YES
WAVE_CREDIT=0
WAVE_1=UNCERTIFIED
WAVE_1_CLEAN_STREAK=0
BIRTH_AUTHORISED=NO

STOP.
```
