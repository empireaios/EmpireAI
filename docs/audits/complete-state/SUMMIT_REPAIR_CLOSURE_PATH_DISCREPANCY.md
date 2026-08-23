# SUMMIT REPAIR CLOSURE FAILURE — PATH DISCREPANCY + FIX

**WAVE_1=UNCERTIFIED · WAVE_1_CLEAN_STREAK=0 · BIRTH_AUTHORISED=NO**

## Forensic verdict (proven)

Prior qualification did **not** control the Grand-King-visible claim path for raw user-shaped prompts.

### ACTUAL_SUMMIT_SERVING_SHA
At investigation time live tip was `a621219a` (docs seal on top of `f69c117d`). Code at tip **includes** the prior semantic repair. Summit was not failed because the SHA lacked the repair — it failed because **enforcement never engaged** when claim obligations were empty.

### ACTUAL_SUMMIT_CLAIM_PATH
`pillow-host` → `enforceExecutiveTruthGrounding` → `releaseExecutiveAnswer` → `finalizeVisible` → `enforceClaimEnumeration` / `polishFinalVisibleAnswer`  
(same module chain as qualification polish, but only when `claimObs.length >= 1`)

### WHY_100_OF_100_MISSED_FAILURE
Atomic suite largely called `assessClaimAgainstCanonical` / `polishFinalVisibleAnswer` with **pre-quoted packs + magic eligibility phrases + pre-structured wrong drafts**. It did **not** require raw unquoted audit lines through `releaseExecutiveAnswer` with empty-obligation failure modes.

### WHY_PRODUCTION_10_OF_10_MISSED_FAILURE
1. Trials used **quoted** claims + pack phrasing that always produced claim obligations.
2. Grader accepted narrative `/Contradict/i` and only forbade `Claim N` + Supported within 220 chars — wrong explicit verdicts in other surfaces could slip; narrative correctness compensated.

### TEST_FIXTURE_REAL_PROMPT_DIFFERENCE
Fixtures: quoted claims, `satisfies every eligibility gate`, helper-level assess.  
Real: often **unquoted** numbered claims under “audit these claims”; soft eligibility wording; answer surfaces `1. "…" **Verdict:** Supported` without `### Claim N`.

### GRADER_BLIND_SPOT
`require: [/Contradict/i]` + forbid only `Claim\s*N…Supported` — does not grade each explicit claim verdict independently.

### FIRST_REAL_PIPELINE_DIVERGENCE
**Claim obligation extraction empty** → `enforceClaimEnumeration` skipped → LLM Supported retained.

### ROOT_CAUSE
Architectural gate: claim authority only runs when obligations are extracted. Extraction required quotes; answer fallback required `Claim N` headers. Raw Summit-class surfaces bypassed both.

## Fix (smallest systemic)

1. Extract unquoted numbered proposition-shaped claims under audit asks.
2. Strip claim-ask surfaces before actor/causal binding.
3. Recover obligations from numbered quoted/bare + Verdict answer surfaces.
4. Broader eligibility phrasing (`cleared for dispatch`).
5. Tester: explicit per-claim verdict grading + negative controls (false-pass=0).
6. Production ladder: `expectClaimVerdicts` + unquoted raw trial.

## Qualification
See seal section after deploy.
