# Orchid Verdict Authority Closure — Seal

**Code SHA:** `939ede6b9b698b4aa364c7a26aadadf2bab17fb5`
**Live deploymentId:** `84f1d708-6866-47a5-991f-30d4a14adf72`

## Reproduction (before fix)

`REPRODUCED_BEFORE_FIX=YES`

LLM draft kept inline `**Verdict:** Supported` outside Claim blocks while canonical Claim 1 was regenerated to Unproven/Contradicted. Graders seeing any Supported surface failed the class.

Also: staffing/reassignment paths and never-had-shortage premises were under-bound in canonical state.

## Authority forensics

| Layer | Role |
|-------|------|
| Canonical assess | Determines resolved verdict |
| LLM draft | Could leave competing Supported |
| enforceClaimEnumeration | Regenerated Claim blocks only |
| Body after stripAllClaimBlocks | Retained inline Supported |

**FIRST_AUTHORITY_BREAK:** post-enforcement body retained LLM `**Verdict:** Supported` outside Claim N blocks.

## Implementation

- `stripCompetingVerdictSurfaces` — remove non-Claim verdict labels when canonical owns claims
- Reassignment / staffing causal path binding
- never-had-shortage as mechanism_absent in compounds
- Soft claim extraction + occurrence denial when occurred=true
- `FINAL_RELEASE_FAIL` on leftover Supported vs Claim Contradicted

**FINAL_VERDICT_OWNER:** canonical state (Claim blocks); LLM explains only.

## Qualification

RAW 100/100, OVERRIDE=0, MISMATCH=0, NEGATIVE_CONTROL_FALSE_PASS=0, JUDGMENT_CASES_PRESERVED=YES
Full regression PASS. Production 4/4 PASS.

WAVE_1=UNCERTIFIED / BIRTH_AUTHORISED=NO
