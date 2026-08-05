# Q4-05 Script Worker

**Status:** FINAL PASS  
**Doctrine:** PILLOW-SCW-001  
**Programme:** Q4 — Media Factory  
**Mission:** Q4-05 Script Worker  
**Primary Deliverable:** Write scripts for long-form videos, shorts, reels, documentaries, explainers, and social content.

> Doctrine ID **PILLOW-SCW-001**. The Script Worker transforms approved Topic Plans into production-ready scripts aligned with Editor-in-Chief strategy, audience, and platform format. It creates scripts only — it never generates visuals or voiceovers, assembles videos, publishes content, overrides Pillow/Grand King, or implements Q4-06+.

## How Q4-05 works

1. An approved Topic Plan and Editorial Strategy are received.
2. Content format is determined (long-form, short, reel, explainer, etc.).
3. A complete script is generated with intro/body/conclusion structure and channel-adapted style.
4. Narration-ready output is produced.
5. Self-review runs before submission.
6. A Script Report (`SCW-RPT-v1` / `SCW-001-v1`) is produced and submitted via ERR.

## Prerequisites

- Q4-04 Topic Planner Worker (`PILLOW-TPW-001`) FINAL PASS
- Q4-02 Editor-in-Chief Worker (`PILLOW-ECW-001`) FINAL PASS

## Script Report fields

`scriptId`, `timestamp`, `channelId`, `topicId`, `contentFormat`, `targetAudience`, `scriptTitle`, `scriptSections`, `estimatedDuration`, `editorialCompliance`, `selfReviewSummary`, `confidenceScore`, `metadataVersion`

## Verification

`npx --yes tsx --test "src/validation/tests/script-worker.test.ts"` — 10 passing, 0 failing.
