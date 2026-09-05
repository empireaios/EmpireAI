# UNBLOCK: Demote Epistemic Unsupported as Open/Bounded Answer Writer V1

**MISSION_TYPE:** DEVELOPMENT / UNBLOCK  
**WAVE_CREDIT:** 0  
**BIRTH_AUTHORISED:** NO  

## Target

EC-18 open decomposition · EC-24 principle transfer · EC-25 warm live→bounded  

Do **not** rebuild PRESERVE capabilities EC-03–14, 16, 19–20, 22–23, 25–27 native reasoning.

---

## A. Baseline / reproduction

| Metric | Value |
|---|---|
| BASELINE_SHA (docs tip) | `0623eda3` |
| BASELINE_SEMANTIC_SHA | `5fe9b384` |
| FIRST_SUPPRESSION_LAYER | MODE/SCOPE (`hasSyntheticAnalysisMarker` → scopedAway) |
| FIRST_SUPPRESSION_FUNCTION | `synthesizeTaskUnitAnswer` when `scoped && kind===general` |
| SUPPRESSING_WRITER | `synthesizeEvidenceStructureAudit` (supplier branch → Unverified assertion) |
| WHY_IT_WON | No decisionCase + scoped general → epistemic full-answer writer; reconstruct/degraded emit only that stub |

**Before specimen (EC18):** open strategy answer = only Unverified assertion template.  
**Warm specimen:** live→bounded → Unsupported framing.  

---

## B. Writer inventory (before)

EPISTEMIC_WRITERS_BEFORE ≈ **20**  
FULL_ANSWER_EPISTEMIC_WRITERS_BEFORE ≈ **12** (including `synthesizeEvidenceStructureAudit` as default general writer)

Primary full-answer offender: `synthesizeEvidenceStructureAudit` via `synthesizeTaskUnitAnswer` for scoped `general` / `multipart_unit` / default.

---

## C. First suppression point

```
REQUEST (synthetic open) 
→ SYNTHETIC_ANALYSIS / scopedAway
→ task kind general (no decisionCase)
→ synthesizeEvidenceStructureAudit (supplier regex on “supplier feeds”)
→ release/reconstruct may emit stub as whole answer
```

---

## D–E. Authority change / removed-demoted

| Change | Detail |
|---|---|
| DEMOTE | `synthesizeEvidenceStructureAudit` no longer default full-answer for open/bounded general |
| ADD | `shouldAuthorWithEvidenceStructureAudit`, `isOpenExecutiveReasoningAsk`, `synthesizeOpenExecutiveReasoning` |
| KEEP | Epistemic audit for genuine claim packs / premise_audit / propositional subjects |
| KEEP | Live fact refusal / Unverified for supplier *assertions* |
| TIGHTEN | Supplier Unverified branch requires assertion language, not mere “supplier” |
| IMPROVE | Light eligibility peers `NAME granted` / `NAME pending` for warm bounded |
| BRIEF | Open strategy brief no longer forces “evidence structure only” |

EPISTEMIC_WRITERS_AFTER ≈ **20** (same inventory; authority reduced)  
FULL_ANSWER_EPISTEMIC_WRITERS_AFTER ≈ **11 effective for open/bounded general** (audit retained for claim audits only)

---

## F–K. Qualification (local DEV)

| Gate | Result |
|---|---|
| DEV_FAST (lock + fast invariant) | PASS |
| DEV_FULL (`unblock-epistemic-open-bounded-qualify.mjs`) | PASS |
| EC18_SHORT_OPEN_CASES | 50/50 |
| LIVE_TO_BOUNDED | 50/50 |
| BOUNDED_TO_LIVE | 50/50 |
| EC24_CASES | 50/50 |
| COMMERCIAL_SHORT_CASES | 75/75 |
| OPEN_UNSUPPORTED_STUB_TAKEOVER | 0 |
| WARM_BOUNDED_UNSUPPORTED_TAKEOVER | 0 |
| PRESERVE_MATERIAL_REGRESSION (scoped synthetic + decision locks) | 0 |
| LIVE_EPISTEMIC_CAUTION_PRESERVED | YES |

---

## L. Capability delta (expected after production)

| Capability | Before | After (local proven) | Class |
|---|---|---|---|
| EC18 | Stub takeover | Open plan / ASSUMPTIONS / EVIDENCE_NEEDED | IMPROVED |
| EC24 | Stub risk | Principle SELECT granted≠pending | IMPROVED |
| EC25 warm | Unsupported takeover | SELECT eligible on light peers | IMPROVED |
| EC03 / EC10 | Strong | Still SELECT without Unsupported | UNCHANGED |
| LIVE_EPISTEMIC_CAUTION | Strict | Still live-classified + assertion audit | UNCHANGED |

---

## M–O. Production / SHA

Filled after deploy + `unblock-epistemic-production-validate.mjs`.

---

## P. Remaining weaknesses

- L0 fee arithmetic (EC01/EC02) still BUILD — not this mission  
- EC21 claim format still separate UNBLOCK unless shared suppressor (not broadened)  
- Open shell is reconstruct fallback — LLM primary path still preferred when valid  
- Mega A–U envelope untouched  

---

## Q. Wave entry gate effect

```
G1_OPEN_STUB = CLEARING (local) / confirm on prod
G2_WARM_TRANSITION = CLEARING (local) / confirm on prod
G4_ARITHMETIC = still FAIL
WAVE_1_ENTRY_READY = NO
```

---

## R. Exact next development action

Do **not** auto-start arithmetic BUILD. Return to ChatGPT for capability-delta review.

Suggested next (ChatGPT decides): **BUILD L0 fee/% contribution calculator (EC-01/EC-02)**.

---

## Overseer yield

```
TARGET=Demote epistemic Unsupported as open/bounded answer writer
TARGET_CLOSED=YES|NO (after prod)
PRESERVE_REGRESSIONS=0 (local)
BLIND_WAVE_RUNS=0
GRAND_KING_COURIER_PROBES=0
```
