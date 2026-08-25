# Deterministic Resolved-Verdict Finalization — Closure Seal

**Status:** ENGINEERING CLOSED (Wave-1 remains UNCERTIFIED; Birth NOT authorised)  
**Mission:** Canonical owns FINAL visible verdict for RESOLVED claims; LLM explains only.  
**Base lineage:** path-parity `239cc95b` (do not reopen without regression evidence)

## Wave state (unchanged)

- WAVE_1=UNCERTIFIED / WAVE_1_CLEAN_STREAK=0
- WAVE_2=UNCERTIFIED / WAVE_3=LOCKED
- BIRTH_AUTHORISED=NO
- No Cursor Wave credit

## A. Harbour-class reproduction (pre-fix)

Four new-domain raw scenarios (no sealed exam replay):

| Case | Pre-fix CANONICAL | Pre-fix FINAL risk |
|------|---------------------|----------------------|
| lab `nothing to do with` | unproven (missed class) | soft Supported could survive / Unproven lock |
| retail `unrelated` + apostrophe quote | contradicted on full text; extract truncated to `Store Cobalt` | Unproven from truncated claim_1 |
| energy `no causal relationship` | contradicted | OK when bound |
| soft Supported no Claim markers | unproven | Supported temptation |

`HARBOUR_CLASS_REPRODUCED_PRE_FIX=YES`

## B. Verdict authorities (audit)

Capable of modifying explicit verdict surfaces:

1. `assessClaimAgainstCanonical` / `decomposeClaimPropositions`
2. `synthesizeClaimVerdictBlock` / `enforceClaimEnumeration`
3. `ensureCausalClaimConsistency` (Claim N shapes)
4. LLM draft `**Verdict:**` lines (polish/release must strip when resolved)
5. Fail-closed reconstruct / coverage append
6. Frontend display (must not invent alternate semantic verdict)

## C. First authority break

`FIRST_VERDICT_AUTHORITY_BREAK=CANONICAL_ASSESS_GAP`

Primary: `"has nothing to do with"` not classified as `causal_unrelated` → overall unproven while causal path Mesa→Quay existed.  
Secondary: apostrophe-bearing quoted claims truncated; multi-word entities (`Bench Quay`) failed graph bind; mid-line leftover `**Verdict:** Supported`.

## D–E. Architecture / ownership

- `executive-final-verdict.ts`: `FinalVerdictObject` with `RESOLUTION_STATUS`, `VERDICT_OWNER`, `FINAL_VISIBLE_VERDICT`
- RESOLVED (material non-generic props) → `VERDICT_OWNER=CANONICAL` → locked label
- UNRESOLVED (generic-only) → `VERDICT_OWNER=LLM` → no forced Contradicted (`OVER_DETERMINIZATION=0`)
- `CANONICAL_FINAL_VERDICT_OWNER=YES` for resolved claims

## F. Explanation consistency

- `reconcileExplanationWithLockedVerdict`
- `scrubContradictedIndependenceProse` on body when locked Contradicted
- Leftover Supported → release UX failure `RESOLVED_VERDICT_OVERRIDE_LEFTOVER_SUPPORTED`

## G–K. Qualification

| Gate | Result |
|------|--------|
| Harbour-class post-fix 4/4 Contradicted, leftover Supported=0 | PASS |
| Adversarial corpus RESOLVED=315, compound=175, temptation=295, judgment=55 | PASS |
| RESOLVED_FINAL_VERDICT_ERROR | 0 |
| LEFTOVER_SUPPORTED_OVERRIDES | 0 |
| OVER_DETERMINIZATION | 0 |
| FAST_INVARIANT_GATE | PASS |
| DEPLOY_INVARIANT_GATE (IC-01..25 + adversarial) | PASS |
| FULL_CERTIFICATION_GATE | PASS |
| REAL_PATH_CERTIFICATION_HARNESS | PASS |

Evidence:

- `DETERMINISTIC_VERDICT_HARBOUR_CLASS_REPRO.json`
- `DETERMINISTIC_RESOLVED_VERDICT_ADVERSARIAL_QUAL.json`
- `REAL_PATH_CERTIFICATION_HARNESS.json`

## Production / SHA

| Field | Value |
|------|-------|
| SEMANTIC_CODE_SHA | `3b60fd7cb475c225301a3ad6293428afd037e130` |
| REPO_TIP_SHA | `3b60fd7cb475c225301a3ad6293428afd037e130` |
| RUNNING_BRAIN_SHA | `3b60fd7cb475c225301a3ad6293428afd037e130` |
| RUNNING_FRONTEND_SHA | Cockpit BFF (empire-ai.co) — not redeployed this mission |
| DEPLOYMENT_ID | `206f7f43-5a59-4b40-b175-4277c4d1b201` |
| CERTIFIED_SHA | Engineering closure only — **not** Wave-certified |
| Path-parity base preserved | `239cc95b` |

Semantic lineage (single consolidated live candidate):

1. `e717df6f` — canonical final-verdict lock
2. `d69856af` — Railway tsc fix
3. `3b60fd7c` — forecast/population pack binding (live tip)

`PRODUCTION_FIRST_VISIBLE_PASS=PASS` — evidence: `DETERMINISTIC_RESOLVED_VERDICT_PRODUCTION_FIRST_VISIBLE.json` (8/8: causal compound, current/historical, certificate, population, financial, unresolved judgment, memory temptation, warm session).

## Remaining weaknesses

- Independence scrub can rewrite claim-quote wording awkwardly in narrative body (`nothing to do with` → `not free of causal connection`) while Claim-block verdict stays correct.
- Certificate identity justification can over-bind ACTIVE phrasing into identity string; verdict still Contradicted.
- `/health` omits SHA; use `/health/live.deploy.gitCommitSha`.

## Wave state (unchanged)

WAVE_1=UNCERTIFIED · WAVE_1_CLEAN_STREAK=0 · WAVE_2=UNCERTIFIED · WAVE_3=LOCKED · BIRTH_AUTHORISED=NO · no Cursor Wave credit.