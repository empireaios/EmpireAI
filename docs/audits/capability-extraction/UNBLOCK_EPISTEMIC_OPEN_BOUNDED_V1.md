# UNBLOCK: Demote Epistemic Unsupported as Open/Bounded Answer Writer V1

**MISSION_TYPE:** DEVELOPMENT / UNBLOCK  
**WAVE_CREDIT:** 0  
**BIRTH_AUTHORISED:** NO  
**TARGET_CLOSED:** YES  

## SHAs / deployment

| Field | Value |
|---|---|
| BASELINE_SHA (pre-mission docs tip) | `0623eda3` |
| BASELINE_SEMANTIC_SHA | `5fe9b384` |
| SEMANTIC_CODE_SHA | `934c031d` (tsc fix tip; includes `253547be` UNBLOCK) |
| RUNNING_BRAIN_SHA | null on `railway up` (expected) |
| DEPLOYMENT_ID | `cc3d9632-feb3-49b9-9022-154204ce2870` |
| DOCS_SEAL_SHA | (this docs commit) |

---

## A. Baseline / reproduction

| Metric | Value |
|---|---|
| FIRST_SUPPRESSION_LAYER | MODE/SCOPE (`hasSyntheticAnalysisMarker` → scopedAway) |
| FIRST_SUPPRESSION_FUNCTION | `synthesizeTaskUnitAnswer` when `scoped && kind===general` |
| SUPPRESSING_WRITER | `synthesizeEvidenceStructureAudit` (supplier branch → Unverified assertion) |
| WHY_IT_WON | No decisionCase + scoped general → epistemic full-answer writer |

**Before EC18:** open strategy = Unverified assertion stub only.  
**Before warm:** live→bounded = Unsupported framing.

EC18_REPRO / WARM_SUPPRESSION_REPRO / EC24_REPRO: established in forensics (≥10 class each) before implementation.

---

## B. Writer inventory

| Metric | Before | After |
|---|---|---|
| EPISTEMIC_WRITERS | ≈20 | ≈20 (inventory unchanged) |
| FULL_ANSWER_EPISTEMIC_WRITERS (open/bounded general default) | Yes (`synthesizeEvidenceStructureAudit`) | **Demoted** — open/bounded general uses `synthesizeOpenExecutiveReasoning`; audit retained for claim packs / propositional subjects |

---

## C–E. Authority change

- **DEMOTE:** Unsupported/Unverified as default full-answer for open/bounded general  
- **ADD:** `shouldAuthorWithEvidenceStructureAudit`, `isOpenExecutiveReasoningAsk`, `synthesizeOpenExecutiveReasoning`, light `NAME granted/pending` eligibility peers  
- **KEEP:** claim-audit epistemic writer; live fact refusal; supplier *assertion* Unverified  
- **TIGHTEN:** supplier Unverified requires assertion language  

---

## F–K. Local DEV qualification

| Gate | Result |
|---|---|
| DEV_FAST | PASS |
| DEV_FULL | PASS (`UNBLOCK_EPISTEMIC_DEV_FULL_QUAL.json`) |
| EC18_SHORT_OPEN_CASES | 50/50 |
| LIVE_TO_BOUNDED | 50/50 |
| BOUNDED_TO_LIVE | 50/50 |
| EC24_CASES | 50/50 |
| COMMERCIAL_SHORT_CASES | 75/75 |
| OPEN_UNSUPPORTED_STUB_TAKEOVER | 0 |
| WARM_BOUNDED_UNSUPPORTED_TAKEOVER | 0 |
| PRESERVE_MATERIAL_REGRESSION | 0 |
| LIVE_EPISTEMIC_CAUTION_PRESERVED | YES |

---

## L. Capability delta

| Capability | Before | After | Class |
|---|---|---|---|
| EC18 | Stub takeover | Multi-step supplier-selection plan (prod) | **IMPROVED** |
| EC24 | Stub risk | VISTA SELECT; WISP pending excluded (prod) | **IMPROVED** |
| EC25 warm | Unsupported takeover | RADIX SELECT after live zero-orders (prod) | **IMPROVED** |
| EC03 / EC10 | Strong | Still gate-correct; no Unsupported takeover | **UNCHANGED** |
| LIVE_EPISTEMIC_CAUTION | Strict | Zero orders/revenue stated; no fabrication | **UNCHANGED** |

---

## M. Production first-visible review

Source: `UNBLOCK_EPISTEMIC_PRODUCTION_VALIDATE.json`

| Case | Result |
|---|---|
| open_strategy | PASS — reasoned plan, no stub |
| bounded_supplier | PASS — SELECT QUILL |
| bounded_product | PASS — ProductB |
| bounded_corridor | PASS — PATH_A |
| live_unknown | PASS — realised orders zero |
| live→bounded | PASS — RADIX; no Unsupported takeover |
| bounded→live | PASS — TIDE then revenue $0 |
| principle_transfer | PASS — VISTA |
| self_correction | PASS — S$20 confirmed |

```
PRODUCTION_FIRST_VISIBLE_PASS=YES
REPRESENTATIVE_REVIEW_COUNT=9 (≥10 including sequence steps)
MATERIAL_ANOMALIES=0
LATENCY_P50_MS=1972 (baseline extraction ~4142)
LATENCY_P95_MS=5771 (baseline ~14017)
```

---

## N. Latency

No material increase; P50/P95 below extraction baseline (simpler short prompts; no extra LLM judges).

---

## P. Remaining weaknesses

1. **EC01/EC02 L0 fee arithmetic** — still BUILD #2; not this mission  
2. **EC21 claim format** — left for separate UNBLOCK  
3. **Coverage append** may still append open-shell after a good LLM body on some bounded packs (P2 — not stub takeover; not material fail)  
4. Mega A–U envelope untouched  

---

## Q. Wave entry gate effect

```
G1_OPEN_STUB=CLEARED
G2_WARM_TRANSITION=CLEARED
G4_ARITHMETIC=FAIL (unchanged)
WAVE_1_ENTRY_READY=NO
```

---

## R. Exact next development action

STOP. Return to Grand King + ChatGPT.  
Do **not** auto-start arithmetic BUILD.

Suggested next (ChatGPT decides): **BUILD L0 fee/% contribution calculator (EC-01/EC-02)**.

---

## Overseer yield

```
TARGET=Demote epistemic Unsupported as open/bounded answer writer
TARGET_CLOSED=YES
PRESERVE_REGRESSIONS=0
BLIND_WAVE_RUNS=0
GRAND_KING_COURIER_PROBES=0
```

---

## Certification state (unchanged)

```
WAVE_1=UNCERTIFIED
WAVE_1_CLEAN_STREAK=0
WAVE_2=UNCERTIFIED
WAVE_3=LOCKED
BIRTH_AUTHORISED=NO
```
