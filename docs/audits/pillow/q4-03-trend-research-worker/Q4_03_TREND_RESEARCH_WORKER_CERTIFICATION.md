# Q4-03 Trend Research Worker

**Status:** FINAL PASS  
**Doctrine:** PILLOW-TRW-001  
**Programme:** Q4 — Media Factory  
**Mission:** Q4-03 Trend Research Worker  
**Primary Deliverable:** Scan trends, competitors, search demand, social signals, and current events for content opportunities.

> Doctrine ID **PILLOW-TRW-001**. The Trend Research Worker discovers high-value content opportunities before planning begins. It monitors search, competitors, social platforms, audience behaviour, and current events; scores confidence; and produces machine-readable Trend Research Reports. It never selects publishing topics, writes scripts, generates thumbnails, publishes content, generates content directly, overrides Pillow/Grand King, or implements Q4-04+.

## How Q4-03 works

1. Approved research sources are monitored (search, competitors, social, audience, events).
2. Emerging and declining trends are identified and categorized.
3. Confidence is scored from demand, social, competitor, event, and audience signals.
4. Facts are distinguished from assumptions in supporting evidence.
5. A Trend Research Report (`TRW-RPT-v1` / `TRW-001-v1`) is produced and submitted via ERR.

## Prerequisites

- Q4-01 Media Factory Core (`PILLOW-MFC-001`) FINAL PASS
- Q4-02 Editor-in-Chief Worker (`PILLOW-ECW-001`) FINAL PASS

## Trend Research Report fields

`trendReportId`, `timestamp`, `channelId`, `trendCategory`, `trendTopic`, `discoverySource`, `searchDemand`, `socialSignals`, `competitorActivity`, `currentEventRelevance`, `confidenceScore`, `supportingEvidence`, `recommendedPriority`, `metadataVersion`

## Verification

`npx --yes tsx --test "src/validation/tests/trend-research-worker.test.ts"` — 10 passing, 0 failing.
