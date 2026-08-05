# Q4-02 Editor-in-Chief Worker

**Status:** FINAL PASS  
**Doctrine:** PILLOW-ECW-001  
**Programme:** Q4 — Media Factory  
**Mission:** Q4-02 Editor-in-Chief Worker  
**Primary Deliverable:** Own channel editorial direction, quality, audience, tone, and long-term content strategy.

> Doctrine ID **PILLOW-ECW-001** (not EIC — that ID belongs to Executive Intelligence Certification). The Editor-in-Chief Worker is the executive editorial leader for every media channel under EmpireAI. It directs downstream content workers and produces machine-readable Editorial Reports. It never writes scripts, creates thumbnails, assembles videos, publishes content, bypasses Pillow governance, overrides Pillow/Grand King, or implements Q4-03+.

## How Q4-02 works

1. Editorial direction and channel identity are defined for a media business/channel.
2. Target audience, editorial tone, content standards, and publishing priorities are set.
3. Content quality is reviewed; brand consistency and long-term strategy are maintained.
4. Editorial decisions are approved under Pillow governance.
5. An Editorial Report (`ECW-RPT-v1` / `ECW-001-v1`) is produced and submitted via ERR.

## Prerequisites

- Q4-01 Media Factory Core (`PILLOW-MFC-001`) FINAL PASS
- Worker Registry, Lifecycle, Assignment Engine, Media Factory Core, ERR, Performance Review, Recovery

## Editorial Report fields

`editorialReportId`, `timestamp`, `mediaBusinessId`, `channelId`, `editorialStrategy`, `targetAudience`, `editorialTone`, `qualityStandards`, `contentPriorities`, `reviewOutcome`, `executiveRecommendations`, `metadataVersion`

## Verification

`npx --yes tsx --test "src/validation/tests/editor-in-chief-worker.test.ts"` — 10 passing, 0 failing.
