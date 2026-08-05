# Q4-04 Topic Planner Worker

**Status:** FINAL PASS  
**Doctrine:** PILLOW-TPW-001  
**Programme:** Q4 — Media Factory  
**Mission:** Q4-04 Topic Planner Worker  
**Primary Deliverable:** Select daily topics per approved channel without waiting for Grand King prompts.

> Doctrine ID **PILLOW-TPW-001**. The Topic Planner Worker converts Editor-in-Chief strategy and Trend Research evidence into executable Topic Plans. It autonomously selects daily publishing topics under Pillow governance without requiring daily Grand King prompts. It plans content only — it never writes scripts, generates visuals, produces videos, publishes content, overrides Pillow/Grand King, or implements Q4-05+.

## How Q4-04 works

1. Editorial strategy is received from Editor-in-Chief Worker.
2. Trend Research Reports are received and analysed.
3. Channel objectives are analysed; opportunities are prioritized.
4. Daily topics are selected with evergreen/trending balance and duplicate prevention.
5. Publishing cadence is maintained; topics are ranked by strategic priority.
6. A Topic Plan (`TPW-PLAN-v1` / `TPW-001-v1`) is produced and submitted via ERR.

## Prerequisites

- Q4-01 Media Factory Core (`PILLOW-MFC-001`) FINAL PASS
- Q4-02 Editor-in-Chief Worker (`PILLOW-ECW-001`) FINAL PASS
- Q4-03 Trend Research Worker (`PILLOW-TRW-001`) FINAL PASS

## Topic Plan fields

`topicPlanId`, `timestamp`, `channelId`, `publishingDate`, `selectedTopics`, `topicPriority`, `selectionReason`, `editorialAlignment`, `trendAlignment`, `expectedAudience`, `confidenceScore`, `metadataVersion`

## Verification

`npx --yes tsx --test "src/validation/tests/topic-planner-worker.test.ts"` — 10 passing, 0 failing.
