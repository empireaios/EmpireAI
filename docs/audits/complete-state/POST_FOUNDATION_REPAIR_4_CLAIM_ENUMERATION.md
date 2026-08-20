# POST-FOUNDATION REPAIR 4 — SEALED

**Finished:** 2026-08-20 ~14:20 +08:00  
**LIVE_SHA:** `84ab7f732667c12db11beba57a39873e844a0e9e`  
**Prior tip at mission start:** `e99248bf` / Repair 3 path `64d17ca3`

**WAVE_1=UNCERTIFIED** · **WAVE_1_CLEAN_STREAK=0** · **WAVE_2=UNCERTIFIED** · **WAVE_3=LOCKED** · **BIRTH_AUTHORISED=NO**

Cursor tests do **not** award Wave certification. Do not run sealed T1/T2.

---

## A. Independent failure synthesis

Post–Repair 3 unseen Wave 1 T1 produced a substantive first response and preserved Repair 2/3 wins (forecast≠realised, room-nights vs guests, arithmetic, local entity solve, external rating, occurrence vs refund, exact numbering, no GK/recovery residue) but still FAILED on:

1. **Middle claim omission** — Claims 1,3,4,5 rendered; Claim 2 silent
2. **Cross-section contradiction** — earlier HT-88=Hillside / distinct from Harbour Crown; later claim “HT-88 is Harbour Crown — Supported”
3. **Memory/source-domain leak** — “sales-history…realised orders” + `**Event-state reading:**` doctrine dump

## B. Claim omission root cause

`CLAIM_ENUMERATION_ROOT_CAUSE_PROVEN=YES`

FIRST corruption: `assessTaskCoverage` treated `claim_*` via whole-answer `tokenOverlapHit`. Claim 2’s financial tokens already appeared in earlier analysis → marked completed/partial → no `silent_drop` → no fill. Count was inferred from prose, not structural obligations.

## C. Cross-section contradiction root cause

`CROSS_SECTION_CONSISTENCY_ROOT_CAUSE_PROVEN=YES`

Claim audit re-synthesized identity verdicts without consuming earlier verified conclusions. No answer-local ledger → Supported could reverse Section 3.

## D. Memory-language leakage root cause

`MEMORY_REALIZATION_ROOT_CAUSE_PROVEN=YES`

Occurrence repair appended doctrine template (`**Event-state reading:**` / chargeback list). Live sales-history demote phrasing survived synthetic scope. Retrieved principle surfaced as source-domain wording.

## E. Claim enumeration architecture

- Stable `claim_1..N` with source text + verdict slots
- Coverage requires **local** Claim N / quote+verdict (`claimLocallyRendered`)
- `enforceClaimEnumeration` rebuilds Claim 1..N in original order
- Gates: `EXPECTED_CLAIMS=N`, `RENDERED_CLAIMS=N`, `MISSING_CLAIMS=0`, `DUPLICATE_CLAIMS=0`
- “claim audit” phrasing recognized (CASE7 fix in `84ab7f73`)

## F. Conclusion ledger / consistency architecture

- `buildConclusionLedger` from non-claim body (entity / forecast≠realised / occurrence)
- Ledger-aware claim verdicts; Supported-vs-ledger rewritten to Contradicted
- `detectMaterialInternalContradictions` oracle before release
- `ANSWER_LOCAL_CONCLUSION_LEDGER=YES` · `MATERIAL_INTERNAL_CONTRADICTIONS=0` (gated)

## G. Domain-native memory realization

- Domain-native occurrence one-liners (hospitality/logistics/software/healthcare/manufacturing)
- `realizeDomainNativeMemorySurface` strips doctrine dumps + sales-history surfaces
- Telemetry concept: `LESSON_RETRIEVED` ≠ `LESSON_TEXT_SURFACED`
- `LESSON_TEXT_DUMP=0` · `SOURCE_DOMAIN_LANGUAGE_LEAKAGE=0` (gated)

## H. EKLS + constitutional updates

Permanent classes + birth lessons (generalized; no sealed entities):

- `EXPLICIT_MIDDLE_CLAIM_DROPPED`
- `LATER_SECTION_CONTRADICTS_EARLIER_VERIFIED_CONCLUSION`
- `RETRIEVED_LESSON_TEXT_LEAKS_INTO_FINAL_RESPONSE`
- `SOURCE_DOMAIN_SURFACE_LANGUAGE_CONTAMINATION`

## I. Level A

**LEVEL_A_PASS=YES** (17/17) — five claims, middle cannot drop, order, ledger reuse (entity/finance/temporal), contradiction catch, unknown present, no regen drift, hotel/healthcare purity, lesson without dump, section contract, multipart, claim-audit+sections, corpus.

## J. Level B

**LEVEL_B_PASS=YES** (3/3) — randomized 3–10 claims; repeated proposition ledger-bound; domain-native occurrence.

## K. Level C live

**LEVEL_C_LIVE_PASS=YES** — 8/8 first-request on Grand-King-visible surface  
Evidence: `docs/audits/complete-state/POST_FOUNDATION_REPAIR_4_LEVEL_C.json`  
SHA: `84ab7f73…` · p50≈5720ms · p95≈20312ms · max≈20312ms  
CASE7 re-pass after claim-audit recognition deploy.

## L. Foundation + Repair 1/2/3 regression

- Repair 3 Level A: **13/13 PASS**
- Repair 4 preserves FR/R1/R2/R3 classes in corpus synthesizer gate
- **FOUNDATION_REGRESSION_PASS=YES** (corpus gate)
- **REPAIR1_REGRESSION_PASS=YES** (hetero specimens retained)
- **REPAIR2_REGRESSION_PASS=YES** (no soft-fallback lifecycle in Level C forbids)
- **REPAIR3_REGRESSION_PASS=YES**

## M. Cost/latency

Level C N=8; p50≈5.7s; p95≈20.3s; max≈20.3s (first visible only).

## N. Commits

- `141e2188` — claim enumeration, ledger, domain-native memory, Level A/B/C harness, corpus/lessons
- `84ab7f73` — claim-audit phrasing + post-section claim re-enforce (CASE7)

## O. Live SHA

`84ab7f732667c12db11beba57a39873e844a0e9e` (brain + frontend stamp)

## P. Remaining weaknesses

- LLM may still draft numbered quote lists before polish appends `### Claim N` (structure enforced at polish)
- Ledger entity extraction is heuristic (code/name patterns); rare phrasings may miss
- Domain detection is keyword-scoped, not full NLU
- Level C claim marker detection is pattern-based (Claim N), not semantic completeness of justification quality

## Q. Certification state

```
WAVE_1=UNCERTIFIED
WAVE_1_CLEAN_STREAK=0
WAVE_2=UNCERTIFIED
WAVE_3=LOCKED
BIRTH_AUTHORISED=NO
KNOWN_P0_FROM_THIS_FAILURE=0
KNOWN_P1_FROM_THIS_FAILURE=0
```

## R. Exact next action

Grand King + ChatGPT issue another **unseen Wave 1 T1** on live `84ab7f73`.  
Do **not** run sealed T1/T2 from Cursor. Do **not** open Wave 3. Do **not** authorize Birth.

---

### Required gates checklist

| Gate | Value |
|------|-------|
| CLAIM_ENUMERATION_ROOT_CAUSE_PROVEN | YES |
| EXPECTED_CLAIMS_TRACKED | YES |
| ORIGINAL_CLAIM_ORDER_PRESERVED | YES |
| MISSING_CLAIMS | 0 |
| DUPLICATE_CLAIMS | 0 |
| CROSS_SECTION_CONSISTENCY_ROOT_CAUSE_PROVEN | YES |
| ANSWER_LOCAL_CONCLUSION_LEDGER | YES |
| MATERIAL_INTERNAL_CONTRADICTIONS | 0 |
| MEMORY_REALIZATION_ROOT_CAUSE_PROVEN | YES |
| LESSON_RETRIEVED_DISTINCT_FROM_LESSON_SURFACED | YES |
| LESSON_TEXT_DUMP | 0 |
| SOURCE_DOMAIN_LANGUAGE_LEAKAGE | 0 |
| LEVEL_A_PASS | YES |
| LEVEL_B_PASS | YES |
| LEVEL_C_LIVE_PASS | YES |
| FOUNDATION_REGRESSION_PASS | YES |
| REPAIR1_REGRESSION_PASS | YES |
| REPAIR2_REGRESSION_PASS | YES |
| REPAIR3_REGRESSION_PASS | YES |

**STOP.**
