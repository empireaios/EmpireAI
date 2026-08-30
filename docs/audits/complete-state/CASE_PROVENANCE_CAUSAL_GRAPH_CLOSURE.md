# Case Evidence Provenance + Executable Causal Graph — Engineering Seal

**Status:** ENGINEERING CLOSED (Wave-1 remains UNCERTIFIED; Birth NOT authorised)

**FINAL_LIVE_QUALIFIED_SHA (code):** `654fe053366f6ff425412f0b20eb5c355bd6f991`  
**Base preserved:** causal-predicate + visible-relevance on `c534deae` (docs seal `44229e64`)

## Wave state (unchanged)

WAVE_1=UNCERTIFIED · WAVE_1_CLEAN_STREAK=0 · WAVE_2=UNCERTIFIED · WAVE_3=LOCKED · BIRTH_AUTHORISED=NO

Cursor engineering PASS = zero Wave credit.

---

## Decision fields

| Field | Value |
|-------|--------|
| CASE_PROVENANCE_ARCHITECTURE_VALIDATED | YES |
| CAUSAL_GRAPH_AUTHORITY_VALIDATED | YES |
| REAL_PATH_BEHAVIOR_VALIDATED | YES |

---

## A–D. Failures addressed (new scenarios; sealed exams not replayed)

| Class | Result |
|-------|--------|
| FOREIGN_CASE_FACTS | Prior specimen facts redacted under NEW_BOUNDED_CASE before LLM; release polish silently scrubs distinctive foreign tokens |
| DIRECT_EDGE_AUTHORITY | `causalPathLength` + DIRECT≠INDIRECT: PATH_LENGTH>1 or path-without-direct ⇒ direct claim CONTRADICTED |

## E–G. Architecture

- `executive-case-provenance.ts`: CASE_MODE, fingerprints, history filter, answer firewall
- Modes: NEW_BOUNDED_CASE / CONTINUATION / EXPLICIT_CROSS_CASE_COMPARISON / LIVE_EMPIREAI / GENERAL
- Principles may transfer; specimen facts must not
- Causal graph owns DIRECT_EDGE vs PATH; claim propositions bind to graph
- `Audit:` / `Also:` prefixed quotes extract as claims

## H–I. Demotion report

| Metric | Value |
|--------|------:|
| FACT_INJECTION_PATHS_BEFORE | raw prior turns → LLM; post-LLM prose unchecked |
| FACT_INJECTION_PATHS_AFTER | filtered prior turns + optional polish firewall (distinctive entities/timestamps/mechanisms only) |
| CAUSAL_MUTATORS_BEFORE | claim text could invent DIRECT edges; incomplete event-chain NL |
| CAUSAL_MUTATORS_AFTER | claim-ask surfaces stripped before graph; event-chain extractors; path-length authority in proposition assess |

## J–M. Qualification

| Gate | Result |
|------|--------|
| Lock test `case-provenance-causal-graph-lock` | PASS |
| FAST | PASS |
| DEPLOY (incl. ≥100 history / ≥300 graph / ≥150 combined) | PASS |
| Prior causal/relevance quals | PASS (no regression) |
| CPRV production ladder | 10/10 PASS on live tip |
| Provenance production ladder | **8/8 PASS** on `654fe053` |

Evidence: `CASE_PROVENANCE_CAUSAL_GRAPH_QUAL.json`, `CASE_PROVENANCE_CAUSAL_GRAPH_PRODUCTION.json`

## N–R. Production sequence controls

| Control | Result |
|---------|--------|
| CASE_A_FACTS_IN_B | 0 |
| CASE_CONTINUATION_CONTEXT_PRESERVED | YES |
| EXPLICIT_CROSS_CASE_REFERENCE_SUPPORTED | YES |
| PRINCIPLE_TRANSFER_PRESERVED | YES (facts no / path yes) |

## S–V. Protected closures

Transport N→N, exact-N envelope, evidence strength, population, path parity, memory relevance, deterministic verdict ownership, Northstar/Solace classes — not reopened.

## W–AE. Stop conditions

- Do NOT run Arclight / Bluehaven / sealed Grand King exams
- Do NOT certify Wave 1
- Do NOT authorize Birth
- STOP for Grand King blind Wave 1 T1

EXTRA_LLM_JUDGE_CALLS=0 (deterministic provenance/graph)
