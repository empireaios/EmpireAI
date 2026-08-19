# POST-FOUNDATION REPAIR 3 — Temporal occurrence + claim completeness + language + structure

**Severity:** P0 Birth-blocking (engineering qualification only)  
**Live SHA:** `64d17ca3`  
**Do not:** replay Lumen · run Wave T1/T2 · certify Wave 1 · authorize Birth

## Live ETA (seal)

| Field | Value |
|---|---|
| CURRENT_LOCAL_TIME | 2026-08-20 ~02:16 +08:00 |
| CURRENT_PHASE | SEALED |
| PROGRESS | 100% |
| WAVE_1 | UNCERTIFIED |
| WAVE_1_CLEAN_STREAK | 0 |
| BIRTH_AUTHORISED | NO |

---

## A. Independent failure synthesis

Unseen Wave 1 T1 after Repair 2 completed substantively (Repair 2 held) but failed on four systemic classes: temporal erasure of historical occurrence by later refund; silent omission of an explicit claim-set member; live sales-history phrasing in a synthetic logistics scenario; exact numbered section contract broken (duplicate numbering).

## B. Root causes A–D

| Defect | FIRST corruption point |
|---|---|
| A Temporal | LLM draft + evidence synthesizer treated refund as non-occurrence; no event-state repair before release. `synthesizeEvidenceStructureAudit` refund branch was arithmetic-only. |
| B Claim omission | `answerMateriallySatisfiesContract` + `appendMissingTaskCoverage` waived silent drops when ~50% kinds hit; explicit quoted claims were not expanded to N claim obligations. |
| C Language leak | `LIVE_COMMERCE_DEMOTE` / premise_audit synthesizer injected “sales-history…realised orders” / commissioning language into scoped paths. |
| D Structure | Duplicate top-level markers survived polish; no post-polish exact section contract. |

## C. Event-state architecture

New `executive-event-state.ts`: separates EVENT_OCCURRED / operational status / later service outcome / economic outcome / accounting treatment. `repairHistoricalOccurrenceErasure` runs in final polish. Pack invalidation (fraud/void/never executed) still allowed.

## D. Claim completeness architecture

`extractExplicitClaimSet` → N `claim_*` premise_audit tasks; `requiresClaimSetCompleteness` disables silent-drop waiver; coverage fill required for omitted middle members.

## E. Synthetic-language repair

Scoped demotes only; strip sales-history / realised-orders / verified-operating-state / commissioning-KPI from synthetic answers; premise/temporal synthesizers use scenario-native language when scoped.

## F. Structure repair

`executive-section-contract.ts` + polish `enforceExactSectionContract` renumbers 1..N, rejects duplicates after final reconstruction.

## G. EKLS / constitutional updates

Classes: `LATER_OUTCOME_ERASES_HISTORICAL_OCCURRENCE`, `EXPLICIT_CLAIM_SET_MEMBER_OMITTED`, `SOURCE_DOMAIN_LANGUAGE_LEAKS_THROUGH_MEMORY`, `EXACT_SECTION_CONTRACT_BROKEN` + birth lessons (principle transfer, not sealed content).

## H. Level A

PASS (13/13).

## I. Level B

PASS (5/5) — randomized domains, claim counts, section contracts, language purity, corpus×3.

## J. Level C live

Evidence: `POST_FOUNDATION_REPAIR_3_LEVEL_C.json`

```
N=8
FIRST_REQUEST_SUCCESS=8
FIRST_REQUEST_FAILURE=0
levelC=PASS
deploySha=64d17ca3
p50≈4313ms (from results)
```

CASE1–CASE8 all PASS on attempt=1 (occurrence+refund, invalidation, five claims, seven claims+unknown, hospitality language purity, exact 7 sections, combined, simple control).

## K. Regressions

Repair 1 hetero Level A PASS · Repair 2 Level A PASS · Foundation corpus via Repair 3 synthesizer gate PASS.

## L. Cost / latency

Level C wall ~60s for 8 first-request trials; max CASE3 ≈14s. No commercial side effects.

## M. Commits

- `64d17ca3` — Repair 3 implementation + Level C script

## N. Live SHA

`64d17ca399f48ae6c32ec0b7b732c304855d987e`

## O. Remaining weaknesses

- Section contract cannot invent missing section *bodies* if the model under-produces; it renumbers and may note shortfall.
- Claim extraction depends on quoted/numbered claim patterns; unusual prose lists may need future parsers.
- Unseen Grand King T1 still required.

## P. Certification state

```
WAVE_1=UNCERTIFIED
WAVE_1_CLEAN_STREAK=0
WAVE_2=UNCERTIFIED
WAVE_3=LOCKED
BIRTH_AUTHORISED=NO
```

## Q. Exact next action

Grand King + ChatGPT run another **unseen** Wave 1 T1 against live `64d17ca3` (or newer). Do not replay Lumen. Do not authorize Birth from this seal.

---

## Required gates

```
TEMPORAL_ERASURE_ROOT_CAUSE_PROVEN=YES
EVENT_STATE_DISTINCTION_IMPLEMENTED=YES
LATER_OUTCOME_NOT_AUTOMATIC_NON_OCCURRENCE=YES
CLAIM_SET_ROOT_CAUSE_PROVEN=YES
EXPECTED_CLAIMS_TRACKED=YES
MATERIAL_CLAIM_OMISSION=0
SYNTHETIC_LANGUAGE_ROOT_CAUSE_PROVEN=YES
SOURCE_DOMAIN_LANGUAGE_LEAKAGE=0
MEMORY_TRANSFERS_PRINCIPLE_NOT_SURFACE=YES
STRUCTURE_ROOT_CAUSE_PROVEN=YES
EXACT_SECTION_CONTRACT=YES
DUPLICATE_SECTION_NUMBERS=0
MISSING_SECTION_NUMBERS=0
CONSTITUTIONAL_CLASSES_ADDED=YES
LEVEL_A_PASS=YES
LEVEL_B_PASS=YES
LEVEL_C_LIVE_PASS=YES
FOUNDATION_REGRESSION_PASS=YES
REPAIR1_REGRESSION_PASS=YES
REPAIR2_REGRESSION_PASS=YES
KNOWN_P0_FROM_THIS_FAILURE=0
KNOWN_P1_FROM_THIS_FAILURE=0
WAVE_1=UNCERTIFIED
WAVE_1_CLEAN_STREAK=0
BIRTH_AUTHORISED=NO
```
