# CROSS-REPAIR INVARIANT PRESERVATION — CLOSURE

**Authority:** Grand King  
**Mission:** CROSS_REPAIR_INVARIANT_PRESERVATION (P0 / Wave-1 / Birth-blocking)  
**FINAL_UNCHANGED_LIVE_SHA (code):** `4ab8cefd51216cf5d312f6b24d64700cadbaeced`  
**Deployment ID:** `0a90b2f9-78d4-4296-b991-fdac635d9550`  
**Prior live candidate:** `0f30aaa88d830131b3bc8ee7614de34b1abc1944`  
**Docs seal SHA:** (this commit; separate from code SHA)

## Certification state (unchanged — Cursor PASS ≠ Wave credit)

- WAVE_1=UNCERTIFIED
- WAVE_1_CLEAN_STREAK=0
- WAVE_2=UNCERTIFIED
- WAVE_3=LOCKED
- BIRTH_AUTHORISED=NO
- BIRTH_TIMESTAMP=NULL

## A. Crestline regression forensic

Independent Crestline-class failure after memory-relevance repair on `0f30aaa8`:

1. Soft pack shape `Assess this claim:` + **newline** + unquoted proposition → soft claim regex required same-line proposition → **claims extracted = []**.
2. Empty claims → claim enumeration / canonical binding skipped → LLM `**Verdict:** Supported` survived.
3. Memory-relevance commits also touched claim/canonical paths; memory prod ladder had causal cases but not this soft newline + “no causal relationship” binding.
4. Existing suites often used quoted / stronger fixtures than real Crestline soft prompts.
5. Graders that only checked prose (not explicit `**Verdict:**`) could miss Supported leftovers.

**CRESTLINE_REGRESSION_ROOT_CAUSE_PROVEN=YES**  
**WHY_0F30AAA8_REGRESSION_MISSED=soft_claim_newline_gap + fixture_stronger_than_raw + no_cross_invariant_deploy_gate**

## B–J. Architecture & gates

| Item | Result |
|------|--------|
| Independent-closure catalogue IC-01..25 | YES |
| RAW_VARIANTS_PER_INVARIANT | ≥5 |
| CROSS_INVARIANT_CASES | ≥100 |
| PAIRWISE_INTERACTION_CASES | ≥100 |
| FAST_INVARIANT_GATE | PASS (`npm run gate:fast-invariant`) |
| DEPLOY_INVARIANT_GATE | PASS (`npm run gate:deploy-invariant`; wired into `verify:production-deploy`) |
| FULL_CERTIFICATION_GATE | PASS (`npm run gate:full-certification`) |
| CHANGE_IMPACT_MAPPING | YES (`describeChangeImpact` / `requiredRegressionsForPaths`) |
| PERMANENT_SEMANTIC_WORKFLOW_INTEGRATED | YES — see `CROSS_REPAIR_INVARIANT_PRESERVATION_WORKFLOW.md` |
| Interaction matrix | YES — `buildCriticalInteractionMatrix` + deploy pairwise suite |

## K–O. Repair + preservation

| Gate | Result |
|------|--------|
| Soft newline claim extract | FIXED (`executive-canonical-state.ts`) |
| Single soft claim → claim_1 bind | FIXED (`executive-task-contract.ts`) |
| `no causal relationship` pairing | FIXED (`executive-claim-proposition.ts`) |
| CRESTLINE_FAILURE_CLASS_GENERALIZED_PASS | YES (randomized domains; no sealed names) |
| MEMORY_RELEVANCE_PASS / IRRELEVANT_VISIBLE_DOCTRINE | 0 |
| RESOLVED_VERDICT_AUTHORITY / LLM_RESOLVED_VERDICT_OVERRIDE | 0 (resolved-verdict-authority regression PASS) |
| NEGATIVE_CONTROL_FALSE_PASS | 0 |

## P–Q. Regression + production

| Gate | Result |
|------|--------|
| FULL_EXISTING_REGRESSION_PASS | YES — L1–L4, repair3/4, causal, memory raw, timestamps, verdict authority, accepted-request, foundation/constitutional |
| PRODUCTION_FIRST_VISIBLE_PASS | YES — 8/8 combined ladder |
| Evidence | `INDEPENDENT_CLOSURE_PRODUCTION_COMBINED_LADDER.json` |
| IRRELEVANT_VISIBLE_DOCTRINE (prod) | 0 |
| FINAL_VERDICT_MISMATCH (prod) | 0 |

## R–T. Cost / commits / SHA

- Production ladder wall ~59s; per-trial ~2–13s first-visible.
- Code commit: `4ab8cefd` — soft-claim causal binding + IC gates + workflow.
- Docs seal: this commit (does not change live code SHA).
- **FINAL_CANDIDATE_SINGLE_SHA=YES** — live code unchanged at `4ab8cefd`.

## U. Remaining weaknesses

- Some first-visible answers still use prose “supported/not supported” before canonical `### Claim N` / `**Verdict:**` blocks; graders must keep grading the explicit verdict.
- Population-scope prose can still over-assert before the explicit Unproven/Contradicted block (IC-10/IC-14 tension under LLM narration).
- `railway up` (upload) does not inject `RAILWAY_GIT_COMMIT_SHA`; use `railway redeploy --from-source` for SHA-visible production candidates.

## V. Certification state

WAVE_1=UNCERTIFIED · WAVE_1_CLEAN_STREAK=0 · WAVE_2=UNCERTIFIED · WAVE_3=LOCKED · BIRTH_AUTHORISED=NO

## W. Exact next action

STOP. Return control to Grand King + ChatGPT. Do not run Crestline. Do not run another Wave test. Do not certify Wave 1. Do not authorize Birth.
