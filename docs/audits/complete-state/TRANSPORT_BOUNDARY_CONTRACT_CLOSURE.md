# Transport-Boundary Contract Enforcement — Engineering Seal

**Status:** ENGINEERING CLOSED (Wave-1 remains UNCERTIFIED; Birth NOT authorised)

## Wave state (unchanged)

WAVE_1=UNCERTIFIED · WAVE_1_CLEAN_STREAK=0 · WAVE_2=UNCERTIFIED · WAVE_3=LOCKED · BIRTH_AUTHORISED=NO

## A. Valence failure class

EXPECTED_CLAIMS=5 · VISIBLE_CLAIMS=5 · VISIBLE_EXPLICIT_VERDICTS=1 · RELEASED despite 39ce4c2f hard gate.

Not a semantic claim-reasoning defect. Enforcement / path break.

## B–G. Lifecycle / first break

**Proven categories: A + secondary strip-parser break**

1. **A (primary):** `assessFinalVisibleContract` only ran claim checks when `claims[]` was non-empty. Empty obligations (e.g. “5 director claims” missed by asks-gate) → claim gate skipped while claim text still visible.
2. **stripAllClaimBlocks:** pattern `\d+\.\s*Claim:?` matched **`N. Claim audit`** section titles and deleted remainder of answer (sections 3–4), so finalize could not keep section+claim contracts together → fail-closed clean message or malformed release.
3. **F:** Ultimate fail-closed could `released: true` without transport re-authorize (fixed).
4. **Not K:** Streaming is post-complete fake SSE.
5. **Not H:** BFF pass-through on success for chat body.

**ACTUAL_LAST_SEMANTIC_WRITER:** `stripInternalValidatorDiagnostics` (finalizeVisible) · host may still call `ensureUsefulTerminalChatMessage` after grounding.
**ACTUAL_FINAL_CONTRACT_BOUNDARY:** `authorizeTransportRelease` (enforce + host terminal re-authorize).
**FIRST_CONTRACT_ENFORCEMENT_BREAK:** empty `claims[]` skipped verdict gate (Valence-class).

## H. Implementation

- `resolveTransportClaimObligations` — contract → answer surfaces → user quotes
- Surface verdict count hard check + provenance
- `authorizeTransportRelease` — authoritative transport gate
- Ultimate fail-closed must authorize or emit clean scoped failure
- `enforceExecutiveTruthGrounding` wraps authorize
- Asks-gate allows intervening words (`5 director claims`)
- Cover-based section titles; never quoted claims as top-level titles
- Section+claim reconstruct: placeholder claim-audit section; enumeration fills Claim N
- `stripAllClaimBlocks` ignores `Claim audit` section titles
- Host terminal path re-authorizes after `ensureUsefulTerminalChatMessage`

## I–K. Attacks / matrix / negatives

OBJECTIVE_CONTRACT_RAW_CASES≥250 · MALFORMED_RELEASE=0 · POST_VALIDATION_MUTATION_ESCAPE=0 · NEGATIVE_CONTROL_FALSE_PASS=0

## L–N. Regressions / gates

Evidence-quality / population / verdict ownership / path parity / memory preserved via DEPLOY+FULL suites.
FAST / DEPLOY / FULL PASS (pre-commit).

## Certification state

WAVE_1=UNCERTIFIED · WAVE_1_CLEAN_STREAK=0 · WAVE_2=UNCERTIFIED · WAVE_3=LOCKED · BIRTH_AUTHORISED=NO

Cursor PASS = zero Wave credit.

## SHAs

Filled after single deploy + production validation.
