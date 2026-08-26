# Sterling Multi-Failure Closure — Engineering Seal

**Status:** ENGINEERING CLOSED (Wave-1 remains UNCERTIFIED; Birth NOT authorised)  
**Semantic base:** `3b60fd7c` preserved (deterministic verdict ownership)  
**Path-parity base:** `239cc95b` preserved

## Wave state (unchanged)

WAVE_1=UNCERTIFIED · WAVE_1_CLEAN_STREAK=0 · WAVE_2=UNCERTIFIED · WAVE_3=LOCKED · BIRTH_AUTHORISED=NO

## Reproductions (pre-fix)

| Class | Reproduced | Mechanism |
|------|------------|-----------|
| Structure 6→9 | YES | Nested ranking markers counted/renumbered as top-level |
| Claim omission | YES | Claim N without **Verdict:** counted complete; UNRESOLVED blocks not regenerated |
| Evidence ranking | YES | No evidence-strength model; % substituted for strength |

## Root causes

- **STRUCTURE_ROOT_CAUSE:** `extractTopLevelSectionMarkers` + `renumberTopLevelSections` treated all unindented `N.` as top-level.
- **CLAIM_COMPLETENESS_ROOT_CAUSE:** `claimLocallyRendered` accepted Claim header without verdict; enforce skipped incomplete UNRESOLVED blocks.
- **EVIDENCE_RANKING_ROOT_CAUSE:** No ranking-objective / canonical evidence-strength layer.

## Implementation

- `executive-section-contract.ts` — demote nested numbers; title-aware contract markers
- `executive-evidence-ranking.ts` — objective classification + strength score (coverage/verification, not %)
- `claimLocallyRendered` / `assessClaimCompletenessGate` — verdict required; missing verdict forces regen
- Polish + release gate wired; change-impact maps section/evidence → IC-16/IC-13/IC-10

## Qualification

| Gate | Result |
|------|--------|
| Structure ≥100 | PASS · mismatch=0 |
| Claims ≥100 | PASS · omission=0 |
| Ranking ≥100 | PASS · errors=0 |
| Combined ≥100 | PASS · 100% |
| Negatives | PASS · false-pass=0 |
| FAST / DEPLOY | PASS |
| Verdict ownership (3b60) | preserved |

## Production / SHA

Filled after single deploy of consolidated semantic tip.
