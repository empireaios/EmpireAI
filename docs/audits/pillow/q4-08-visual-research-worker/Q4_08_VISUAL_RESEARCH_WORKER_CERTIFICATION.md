# Q4-08 Visual Research Worker

**Status:** FINAL PASS  
**Doctrine:** PILLOW-VRW-001  
**Programme:** Q4 — Media Factory  
**Mission:** Q4-08 Visual Research Worker  
**Primary Deliverable:** Find or generate safe visual references, stock assets, public-domain assets, and original supporting visuals.

> Doctrine ID **PILLOW-VRW-001**. The Visual Research Worker discovers and prepares legally usable visual references for approved scripts. It breaks scripts into scenes, searches approved stock/public-domain/internal sources, classifies copyright and usage rights, maps timeline coverage, and detects gaps. It never generates final creative assets, edits images, assembles videos, publishes content, overrides Pillow/Grand King, or implements Q4-09+.

## How Q4-08 works

1. An approved Script Report is received; Thumbnail Report context is optional.
2. The script is broken into visual scenes; required assets are identified.
3. Approved stock libraries, public-domain sources, and internal assets are searched.
4. Copyright status and usage rights are classified; visuals are mapped to timeline.
5. Missing coverage is detected.
6. A Visual Research Report (`VRW-RPT-v1` / `VRW-001-v1`) is produced and submitted via ERR.

## Prerequisites

- Q4-05 Script Worker (`PILLOW-SCW-001`) FINAL PASS
- Q4-07 Thumbnail Worker (`PILLOW-THW-001`) FINAL PASS

## Visual Research Report fields

`visualResearchId`, `timestamp`, `scriptId`, `sceneNumber`, `requiredVisual`, `visualSource`, `assetType`, `copyrightStatus`, `usageRights`, `timelinePosition`, `coverageStatus`, `confidenceScore`, `metadataVersion`

## Verification

`npx --yes tsx --test "src/validation/tests/visual-research-worker.test.ts"` — 10 passing, 0 failing.
