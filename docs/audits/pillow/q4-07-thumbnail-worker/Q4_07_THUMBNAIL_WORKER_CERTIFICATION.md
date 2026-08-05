# Q4-07 Thumbnail Worker

**Status:** FINAL PASS  
**Doctrine:** PILLOW-THW-001  
**Programme:** Q4 — Media Factory  
**Mission:** Q4-07 Thumbnail Worker  
**Primary Deliverable:** Design thumbnail concepts, text overlays, emotional triggers, and A/B variants.

> Doctrine ID **PILLOW-THW-001**. The Thumbnail Worker creates high-performing thumbnail specifications from approved scripts and hooks. It designs concepts, layouts, text overlays, emotional triggers, and A/B variants for downstream image generation/editing. It never generates final artwork, edits images directly, publishes thumbnails, uses misleading designs, overrides Pillow/Grand King, or implements Q4-08+.

## How Q4-07 works

1. An approved Script Report is received; Hook Report inputs are preferred.
2. Thumbnail concepts are generated with full design elements.
3. Emotional triggers, text overlays, and composition/framing guidance are produced.
4. Multiple A/B variants are generated; script consistency is validated.
5. Self-review confirms quality and non-deception.
6. A Thumbnail Report (`THW-RPT-v1` / `THW-001-v1`) is produced and submitted via ERR.

## Prerequisites

- Q4-05 Script Worker (`PILLOW-SCW-001`) FINAL PASS
- Q4-06 Hook Worker (`PILLOW-HKW-001`) FINAL PASS

## Thumbnail Report fields

`thumbnailReportId`, `timestamp`, `scriptId`, `channelId`, `thumbnailConcepts`, `primaryConcept`, `abVariants`, `textOverlays`, `emotionalTriggers`, `compositionGuidance`, `selfReviewSummary`, `confidenceScore`, `metadataVersion`

## Verification

`npx --yes tsx --test "src/validation/tests/thumbnail-worker.test.ts"` — 10 passing, 0 failing.
