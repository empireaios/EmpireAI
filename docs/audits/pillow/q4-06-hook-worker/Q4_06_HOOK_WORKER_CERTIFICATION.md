# Q4-06 Hook Worker

**Status:** FINAL PASS  
**Doctrine:** PILLOW-HKW-001  
**Programme:** Q4 — Media Factory  
**Mission:** Q4-06 Hook Worker  
**Primary Deliverable:** Create opening hooks, retention loops, curiosity gaps, and viewer continuation moments.

> Doctrine ID **PILLOW-HKW-001**. The Hook Worker optimizes audience retention for approved scripts by generating opening hooks, curiosity gaps, retention loops, and continuation moments. It improves engagement without rewriting the complete script. It never generates thumbnails/videos, publishes content, uses misleading hooks, overrides Pillow/Grand King, or implements Q4-07+.

## How Q4-06 works

1. An approved Script Report is received from the Script Worker.
2. Opening hooks and alternatives are generated across supported hook types.
3. Curiosity gaps, retention loops, and continuation moments are produced with placement notes.
4. Pacing and engagement recommendations are improved.
5. Self-review validates originality, non-deception, and script-intent preservation.
6. A Hook Report (`HKW-RPT-v1` / `HKW-001-v1`) is produced and submitted via ERR.

## Prerequisites

- Q4-05 Script Worker (`PILLOW-SCW-001`) FINAL PASS
- Worker Registry, Lifecycle, Assignment Engine, ERR, Performance Review, Recovery

## Hook Report fields

`hookReportId`, `timestamp`, `scriptId`, `contentFormat`, `primaryHook`, `alternativeHooks`, `curiosityGaps`, `retentionLoops`, `continuationMoments`, `engagementRationale`, `selfReviewSummary`, `confidenceScore`, `metadataVersion`

## Verification

`npx --yes tsx --test "src/validation/tests/hook-worker.test.ts"` — 10 passing, 0 failing.
