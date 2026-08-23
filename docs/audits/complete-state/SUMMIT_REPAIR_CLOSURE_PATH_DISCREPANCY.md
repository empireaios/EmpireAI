# SUMMIT REPAIR CLOSURE FAILURE — PATH DISCREPANCY + FIX

**WAVE_1=UNCERTIFIED · WAVE_1_CLEAN_STREAK=0 · BIRTH_AUTHORISED=NO**

## Forensics (proven)

### ACTUAL_SUMMIT_SERVING_SHA
Live at investigation tip was `a621219a…` (docs seal on top of code `f69c117d…`). Summit was served code that **included** the prior claim-proposition repair — not a missing deploy of f69c117d alone.

### ACTUAL_SUMMIT_CLAIM_PATH
`pillow-host` → `enforceExecutiveTruthGrounding` → `releaseExecutiveAnswer` → `finalizeVisible` → `enforceClaimEnumeration` / `polishFinalVisibleAnswer` → `assessClaimAgainstCanonical`.

### WHY_100_OF_100_MISSED_FAILURE
Most cases called **helpers** (`assessClaimAgainstCanonical` / polish with **pre-quoted packs** and magic eligibility phrases). They did **not** exercise raw unquoted user prompts through `releaseExecutiveAnswer`. When claim extraction returned empty, enforcement never ran — that path was untested.

### WHY_PRODUCTION_10_OF_10_MISSED_FAILURE
1. Trials used **quoted** claims + phrase-matched packs (same as helpers).
2. Grader accepted narrative `/Contradict/i` and only forbade `Claim N` + Supported within 220 chars — **not** per-claim explicit verdict equality. Formats without `Claim N` or with inline Supported could slip or be weakly checked.
3. No unquoted raw-user trial; no negative control that narrative-correct + verdict-wrong must fail.

### TEST_FIXTURE_REAL_PROMPT_DIFFERENCE
Fixtures: quoted claims + `currently satisfies every eligibility gate`.  
Real: often unquoted numbered claims; soft eligibility wording; section headers adjacent to claim lists. Unquoted → `extractQuotedClaimsOnly=[]` → `claimObs=[]` → **enforceClaimEnumeration skipped** → LLM Supported retained.

### GRADER_BLIND_SPOT
Correct prose containing “contradict” could satisfy `require`; explicit Supported without `Claim N` prefix was not reliably failed.

### FIRST_REAL_PIPELINE_DIVERGENCE
**Claim-obligation extraction / empty `claimObs`** → enforcement never invoked on the Grand-King-visible path.

### ROOT_CAUSE
Prior repair lived in proposition assessment + regen, but production only regenerates when claim obligations are discovered. Discovery required quotes; answer fallback required `Claim N` headers. Real Summit-class surfaces bypassed both gates.

## Fix (smallest systemic, at divergence layer)

1. Extract unquoted numbered claims under audit/verdict asks (proposition-shaped filter).
2. Strip claim-ask surfaces before binding actor/causal narrative state.
3. Recover claim obligations from `N. "…"` / bare + Verdict answer surfaces.
4. Broaden eligibility narrative phrases slightly (`cleared for dispatch`, etc.).
5. Repair tester: explicit per-claim verdict grading + negative controls + raw-prompt 100 through `releaseExecutiveAnswer`.

## Qualification (local)

- NEGATIVE_CONTROL_FALSE_PASS=0
- RAW_USER_PROMPT_COMPOUND_CASES=100, PASS=100%
- Prior compound 100/100 + timestamps atomic + L0–L4 causal/decision: PASS

Production ladder + final live SHA filled after deploy.
