# Q4-09 Image & Creative Worker

**Status:** FINAL PASS  
**Doctrine:** PILLOW-ICW-001  
**Programme:** Q4 — Media Factory  
**Mission:** Q4-09 Image & Creative Worker  
**Primary Deliverable:** Create or edit supporting visuals, graphics, covers, thumbnails, diagrams, and social assets.

> Doctrine ID **PILLOW-ICW-001**. Distinct from commerce `product-image-worker`. The Image & Creative Worker transforms Visual Research Reports and Thumbnail specifications into production-ready creative asset descriptors (structural signals). It records edits, produces variants, and verifies copyright compliance. It never assembles videos, generates voiceovers, publishes media, overrides Pillow/Grand King, or implements Q4-10+.

## How Q4-09 works

1. Visual Research Reports and Thumbnail specifications are received.
2. Original graphics, diagrams, covers, banners, and social assets are generated as asset descriptors.
3. Existing source images are edited with recorded edit operations; originals preserved.
4. Multiple creative variants are produced when appropriate.
5. Quality and copyright compliance are validated.
6. A Creative Asset Report (`ICW-RPT-v1` / `ICW-001-v1`) is produced and submitted via ERR.

## Prerequisites

- Q4-07 Thumbnail Worker (`PILLOW-THW-001`) FINAL PASS
- Q4-08 Visual Research Worker (`PILLOW-VRW-001`) FINAL PASS

## Creative Asset Report fields

`creativeAssetId`, `timestamp`, `scriptId`, `sceneId`, `assetType`, `sourceAssets`, `generatedAssets`, `editOperations`, `qualityStatus`, `copyrightStatus`, `variantCount`, `metadataVersion`

## Verification

`npx --yes tsx --test "src/validation/tests/image-creative-worker.test.ts"` — 10 passing, 0 failing.
