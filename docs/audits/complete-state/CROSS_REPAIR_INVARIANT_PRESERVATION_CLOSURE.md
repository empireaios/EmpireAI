# CROSS-REPAIR INVARIANT PRESERVATION — CLOSURE

**Authority:** Grand King  
**Mission:** CROSS_REPAIR_INVARIANT_PRESERVATION (P0 / Wave-1 / Birth-blocking)  
**FINAL_UNCHANGED_LIVE_SHA (code):** `470aa13bf2cc72be65549bb079fbb6dd6db3b84e`  
**Deployment ID:** `b2bf7737-a518-42e8-a03e-9731d92a1df8`  
**Prior sealed candidate:** `4ab8cefd51216cf5d312f6b24d64700cadbaeced`  
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

**Follow-up residual (closed on `470aa13b`):** bare `Assess:` / `Assess: "..."` also extracted zero claims when the draft lacked `### Claim N` markers → soft `**Verdict:** Supported` survived. Fixed by binding `\bassess\s*:` as a soft claim cue (colon required so narrative “assess risk…” does not bind).

**CRESTLINE_REGRESSION_ROOT_CAUSE_PROVEN=YES**  
**WHY_0F30AAA8_REGRESSION_MISSED=soft_claim_newline_gap + bare_Assess_cue_gap + fixture_stronger_than_raw + no_cross_invariant_deploy_gate**

## B–J. Architecture & gates

| Item | Result |
|------|--------|
| Independent-closure catalogue IC-01..25 | YES |
| RAW_VARIANTS_PER_INVARIANT | ≥5 |
| CROSS_INVARIANT_CASES | ≥100 |
| PAIRWISE_INTERACTION_CASES | ≥100 |
| FAST_INVARIANT_GATE | PASS |
| DEPLOY_INVARIANT_GATE | PASS (15/15 on `470aa13b`; wired into `verify:production-deploy`) |
| FULL_CERTIFICATION_GATE | PASS (IC stack; deploy gate reconfirmed) |
| CHANGE_IMPACT_MAPPING | YES |
| PERMANENT_SEMANTIC_WORKFLOW_INTEGRATED | YES — `CROSS_REPAIR_INVARIANT_PRESERVATION_WORKFLOW.md` |
| Bare `Assess:` soft cue regression | PASS (fast + deploy) |

## K–O. Repair + preservation

| Gate | Result |
|------|--------|
| Soft newline claim extract | FIXED |
| Bare `Assess:` cue bind | FIXED (`470aa13b`) |
| Single soft claim → claim_1 bind | FIXED |
| `no causal relationship` pairing | FIXED |
| CRESTLINE_FAILURE_CLASS_GENERALIZED_PASS | YES |
| MEMORY_RELEVANCE / IRRELEVANT_VISIBLE_DOCTRINE | 0 |
| RESOLVED_VERDICT_AUTHORITY / LLM override | 0 |
| NEGATIVE_CONTROL_FALSE_PASS | 0 |

## P–Q. Regression + production

| Gate | Result |
|------|--------|
| DEPLOY_INVARIANT_GATE on live candidate | PASS 15/15 |
| PRODUCTION_FIRST_VISIBLE_PASS | YES — 8/8 on `470aa13b` |
| Evidence | `INDEPENDENT_CLOSURE_PRODUCTION_COMBINED_LADDER.json` |
| IRRELEVANT_VISIBLE_DOCTRINE (prod) | 0 |
| FINAL_VERDICT_MISMATCH (prod) | 0 |

## R–T. Cost / commits / SHA

- Production ladder wall ~65s.
- Code: `4ab8cefd` → `470aa13b` (bare `Assess:`).
- Docs seal: this commit.
- **FINAL_CANDIDATE_SINGLE_SHA=YES** — live code `470aa13b` / dep `b2bf7737`.

## U. Remaining weaknesses

- Prose may say “supported” before canonical Claim/`**Verdict:**` blocks.
- Interrogative soft forms (`Is … unrelated because …?`) remain thinner than `Assess:` cues.
- Prefer `railway redeploy --from-source` for SHA injection.

## V. Certification state

WAVE_1=UNCERTIFIED · WAVE_1_CLEAN_STREAK=0 · WAVE_2=UNCERTIFIED · WAVE_3=LOCKED · BIRTH_AUTHORISED=NO

## W. Exact next action

STOP. Return control to Grand King + ChatGPT. Do not run Crestline. Do not run another Wave test. Do not certify Wave 1. Do not authorize Birth.
