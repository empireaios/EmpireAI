# Causal Predicate Precision + Visible Relevance — Engineering Seal

**Status:** ENGINEERING CLOSED (Wave-1 remains UNCERTIFIED; Birth NOT authorised)

## Wave state (unchanged)

WAVE_1=UNCERTIFIED · WAVE_1_CLEAN_STREAK=0 · WAVE_2=UNCERTIFIED · WAVE_3=LOCKED · BIRTH_AUTHORISED=NO

Cursor engineering PASS = zero Wave credit.

## A. Bluehaven reproduction (new scenarios only; Bluehaven not replayed)

| Class | Reproduced |
|-------|------------|
| BLUEHAVEN_CAUSAL_CLASS_REPRODUCED | YES (≥5 multi-domain cascade packs; direct-over-path + unrelated-because + same-root) |
| BLUEHAVEN_PRE_APPEND_REPRODUCED | YES (EDE Recommendation prepend under exact-N) |
| BLUEHAVEN_POST_APPEND_REPRODUCED | YES (Risk/lesson soft-append under exact-N) |

## B–D. Root causes

| Class | Root cause |
|-------|------------|
| CAUSAL_ROOT_CAUSE | `"X directly caused Y"` not classified as `causal_direct_cause` (only “is/was the direct cause”); stayed generic → UNRESOLVED → LLM Supported. Entity `/i` regex pollution. Missing `causal_connected` ownership. Soft “failure redirected work to” NL missed graph. |
| PRE_APPEND_ROOT_CAUSE | `alignVisibleAnswerWithDeliberation` prepended Recommendation without exact-N gate |
| POST_APPEND_ROOT_CAUSE | `ensureCausalClaimConsistency` → `synthesizeCausalRiskLesson` soft-appended Risk/lesson under monitoring heuristics without exact-N / explicit-risk gate |

## E–G. Causal architecture

- Typed links: DIRECT_CAUSE / UPSTREAM_TRIGGER / INDIRECT_CAUSAL_DEPENDENCY (+ roles)
- PATH_EXISTS vs DIRECT_EDGE via `hasCausalPath` / `isDirectCause`
- Proposition kinds: `causal_direct_cause`, `causal_connected`, `causal_unrelated`, `causal_same_root`, `causal_different_root`, `mechanism_absent`
- Compound “because” claims: true premise ≠ whole SUPPORTED (deterministic resolved ownership)

## H–I. Visible envelope / appenders

- `assessVisibleContractEnvelope` / `enforceVisibleContractEnvelope` — EXPECTED_FIRST=SECTION_1, EXPECTED_LAST=SECTION_N
- Hard failures: UNREQUESTED_PRE_SECTION_SEMANTIC_TEXT / UNREQUESTED_POST_FINAL_SECTION_TEXT
- EDE prepend demoted under exact-N; Risk/lesson soft-append gated; freeform `is **SUPPORTED**` scrubbed when Claim Contradicted

## J–M. Qualification

| Metric | Result |
|--------|--------|
| CAUSAL_RAW_CASES | 820 |
| DIRECT_FOR_INDIRECT_ERROR | 0 |
| INDIRECT_AS_UNRELATED_ERROR | 0 |
| CONNECTION_AS_COMMON_ROOT_ERROR | 0 |
| TEMPORAL_AS_CAUSAL_ERROR | 0 |
| NEGATIVE_CONTROL_FALSE_PASS | 0 |
| VISIBLE_RELEVANCE_RAW_CASES | 170 |
| UNREQUESTED_PRE_SECTION_SEMANTIC_TEXT | 0 |
| UNREQUESTED_POST_FINAL_SECTION_TEXT | 0 |
| REQUESTED_RECOMMENDATION_OMISSION | 0 |
| REQUESTED_RISK_OMISSION | 0 |
| COMBINED_CAUSAL_RELEVANCE_CASES | 100 |
| COMBINED_PASS_RATE | 100% |

## N–Q. Preservation

TRANSPORT_CONTRACT_PASS (MALFORMED_RELEASE=0) · EVIDENCE_QUALITY / POPULATION preserved · Northstar/Solace class preserved by non-touch · IC-01..25 updated (IC-03=CAUSAL_PREDICATE_GRADES; envelope IC-16/22) · path/memory/synthetic isolation preserved

## R–S. Gates / production

| Gate | Result |
|------|--------|
| FAST_GATE_PASS | YES |
| DEPLOY_GATE_PASS | YES |
| FULL_GATE_PASS | YES (prior full + FAST/DEPLOY after final scrub) |
| PRODUCTION_FIRST_VISIBLE_PASS | YES (10/10 new scenarios) |

Evidence: `docs/audits/complete-state/CAUSAL_PREDICATE_VISIBLE_RELEVANCE_PRODUCTION.json`

## T. Cost/latency

Production ladder total wall ~95s for 10 first-visible chats (per-case ~2.4–10s).

## U. SHAs / deployment

| Field | Value |
|-------|-------|
| SEMANTIC_CODE_SHA | `c534deaed70a147270121f74b317f49528a06876` |
| RUNNING_BRAIN_SHA | `c534deaed70a147270121f74b317f49528a06876` |
| RUNNING_FRONTEND | Cockpit BFF (empire-ai.co) — not redeployed this mission |
| DEPLOYMENT_ID | `5134ae50-ba0f-48c9-b66e-2be88b4ddc9c` |
| CERTIFIED_SHA | `c534deaed70a147270121f74b317f49528a06876` (engineering seal only) |
| DOCS_SEAL_SHA | _(this commit)_ |
| FINAL_CANDIDATE_SINGLE_SHA | YES |
| KNOWN_P0 | 0 |
| KNOWN_P1 | 0 |

## V. Remaining weaknesses

- Soft Assess answers may still lead with prose before Claim blocks (Claim blocks are authoritative).
- Some natural-language redirect variants may still miss graph extractors until seen in the wild.
- Frontend not redeployed (brain-side fix).

## W. Certification state

WAVE_1=UNCERTIFIED · WAVE_1_CLEAN_STREAK=0 · WAVE_2=UNCERTIFIED · WAVE_3=LOCKED · BIRTH_AUTHORISED=NO

## X. Exact next action

Hold for Grand King Wave exam decision. Do not authorize Birth. Do not treat this seal as Wave credit.
