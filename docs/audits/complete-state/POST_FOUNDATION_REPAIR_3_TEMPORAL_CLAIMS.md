# POST-FOUNDATION REPAIR 3 — Temporal occurrence + claim completeness + language + structure

**Live baseline at mission start:** `8cfc592c`  
**Do not:** replay Lumen · run Wave T1/T2 · certify Wave 1 · authorize Birth

## ETA (engineering)

| Field | Value |
|---|---|
| CURRENT_PHASE | Commit → deploy → Level C |
| WAVE_1 | UNCERTIFIED |
| WAVE_1_CLEAN_STREAK | 0 |
| BIRTH_AUTHORISED | NO |

## A–D root causes (proven)

| Defect | FIRST corruption point |
|---|---|
| A Temporal erasure | LLM draft + weak refund/history synthesizer (`synthesizeEvidenceStructureAudit` historical/refund branches) collapsed later refund into non-occurrence; no event-state repair on polish |
| B Claim omission | `answerMateriallySatisfiesContract` + `appendMissingTaskCoverage` waived silent drops when ~50% kinds hit; no explicit claim-set task IDs |
| C Synthetic language | `LIVE_COMMERCE_DEMOTE` / premise_audit synthesizer injected sales-history / realised-orders / commissioning phrasing into scoped answers |
| D Section contract | Duplicate top-level numbers survived polish; no post-polish `1..N` enforcement |

## Architecture added

- `executive-event-state.ts` — EVENT_OCCURRED vs later outcomes; erasure repair
- `executive-section-contract.ts` — exact N section detect/renumber/validate
- Claim-set extraction → `claim_1..N` obligations; strict coverage (no waiver)
- Scoped premise/temporal synthesizers; language strip expanded
- Polish runs occurrence repair + section enforce after reconstruct

## Constitutional classes

- `LATER_OUTCOME_ERASES_HISTORICAL_OCCURRENCE`
- `EXPLICIT_CLAIM_SET_MEMBER_OMITTED`
- `SOURCE_DOMAIN_LANGUAGE_LEAKS_THROUGH_MEMORY`
- `EXACT_SECTION_CONTRACT_BROKEN`

## Gates / Level results

Filled after Level C seal in companion JSON + final chat report.
