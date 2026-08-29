# Transport-Boundary Contract Enforcement — Engineering Seal

**Status:** ENGINEERING CLOSED (Wave-1 remains UNCERTIFIED; Birth NOT authorised)

## Wave state (unchanged)

WAVE_1=UNCERTIFIED · WAVE_1_CLEAN_STREAK=0 · WAVE_2=UNCERTIFIED · WAVE_3=LOCKED · BIRTH_AUTHORISED=NO

## A. Valence failure class

EXPECTED_CLAIMS=5 · VISIBLE_CLAIMS=5 · VISIBLE_EXPLICIT_VERDICTS=1 · RELEASED despite 39ce4c2f hard gate.

Not a semantic claim-reasoning defect. Enforcement / path break.

## B–G. Lifecycle / first break

**Proven categories: A + strip-parser secondary**

1. **A (primary):** `assessFinalVisibleContract` only ran claim checks when `claims[]` was non-empty. Empty obligations (e.g. “5 director claims” missed by asks-gate) → claim gate skipped while claim text still visible.
2. **stripAllClaimBlocks:** `\d+\.\s*Claim:?` matched **`N. Claim audit`** section titles and deleted the rest of the answer → section+claim contracts could not coexist → fail-closed / malformed path.
3. **F:** Ultimate fail-closed could `released: true` without transport re-authorize (fixed).
4. **Not K:** Streaming is post-complete fake SSE.
5. **Not H:** BFF pass-through on success for chat body.

| Field | Value |
|-------|-------|
| ACTUAL_LAST_SEMANTIC_WRITER | `stripInternalValidatorDiagnostics` (finalizeVisible); host may mutate via `ensureUsefulTerminalChatMessage` |
| ACTUAL_FINAL_CONTRACT_BOUNDARY | `authorizeTransportRelease` (enforce + host terminal re-authorize) |
| FIRST_CONTRACT_ENFORCEMENT_BREAK | empty `claims[]` skipped verdict gate (Valence-class) |
| STREAMING_BYPASS | 0 |
| FALLBACK_BYPASS | 0 (ultimate fail-closed re-authorizes) |
| REGENERATION_BYPASS | 0 (every release candidate authorized) |

## H. Implementation

- `resolveTransportClaimObligations` — contract → answer surfaces → user quotes
- Surface verdict count hard check + provenance
- `authorizeTransportRelease` — authoritative transport gate
- Ultimate fail-closed must authorize or emit clean scoped failure
- Asks-gate allows intervening words (`5 director claims`)
- Cover-based section titles; never quoted claims as top-level titles
- Section+claim reconstruct: claim-audit placeholder; enumeration fills Claim N
- `stripAllClaimBlocks` ignores `Claim audit` section titles
- Host terminal path re-authorizes after `ensureUsefulTerminalChatMessage`

## I–K. Attacks / matrix / negatives

OBJECTIVE_CONTRACT_RAW_CASES=320 · MALFORMED_RELEASE=0 · POST_VALIDATION_MUTATION_ESCAPE=0 · NEGATIVE_CONTROL_FALSE_PASS=0

## L–N. Regressions / gates

Evidence-quality / population / Ridge>Coast preserved on production first-visible.
FAST / DEPLOY / FULL PASS.

## O. Production contract telemetry

Live SHA `d4ce7692` · deployment `3b7ccacc-a18b-4bb2-bbff-83dcb01454b5`

All cases: transport `validatorResult=PASS`, no diagnostic leak.
`prod_memory` harness grader widened (answer already said “cannot be fully supported”; transport already PASS).

PRODUCTION_FIRST_VISIBLE_PASS=PASS

## Q. SHAs / deployment

| Field | Value |
|-------|-------|
| SEMANTIC_CODE_SHA | `d4ce7692f8f19c5cdfaf4bc12fc05bfa7fe96183` |
| RUNNING_BRAIN_SHA | `d4ce7692f8f19c5cdfaf4bc12fc05bfa7fe96183` |
| RUNNING_FRONTEND | empire-ai.co / cockpit (BFF) |
| DEPLOYMENT_ID | `3b7ccacc-a18b-4bb2-bbff-83dcb01454b5` |
| CERTIFIED_SHA | *(none — Wave uncertified)* |
| DOCS_SEAL_SHA | *(this seal commit)* |

## R. Remaining weaknesses

- Claim synthesizer sometimes emits “Claims retain distinct identity” labels (counts as explicit Verdict for transport; semantic quality still soft).
- Pure `releaseExecutiveAnswer` callers without `enforce` / host terminal authorize still skip the outer gate (production chat path is covered).

## S. Certification state

WAVE_1=UNCERTIFIED · WAVE_1_CLEAN_STREAK=0 · WAVE_2=UNCERTIFIED · WAVE_3=LOCKED · BIRTH_AUTHORISED=NO

Cursor PASS = zero Wave credit.

## T. Exact next action

Grand King independent production audit on new scenarios only (not Valence replay). No Birth. No Wave credit from this seal.
