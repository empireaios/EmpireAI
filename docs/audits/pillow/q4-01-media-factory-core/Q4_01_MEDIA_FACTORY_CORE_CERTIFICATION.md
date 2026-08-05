# Q4-01 Media Factory Core

**Status:** FINAL PASS  
**Doctrine:** PILLOW-MFC-001  
**Programme:** Q4 — Media Factory  
**Mission:** Q4-01 Media Factory Core  
**Primary Deliverable:** Operate media businesses, channels, content pipelines, approvals, publishing, and learning.

> Doctrine ID **PILLOW-MFC-001**. Media Factory Core is the executive orchestration layer for every media business under EmpireAI. It coordinates channels, pipelines, approvals, publishing, analytics, and continuous learning under Pillow. It never writes scripts, generates images/videos, publishes directly, bypasses approvals, overrides Pillow/Grand King, or implements Q4-02+.

## How Q4-01 works

1. A Media Business Mission is created and registered with Mission Coordination.
2. Media channels and content pipelines are registered against the mission.
3. Downstream media workers are coordinated via Worker Registry / Lifecycle / Assignment.
4. Approval, publishing, analytics, and learning workflows are coordinated (never bypassed).
5. Production and publishing status are tracked.
6. A machine-readable Media Factory Report (`MFC-MFR-v1` / `MFC-001-v1`) is produced and submitted via ERR.

## Prerequisites

- Q3 Commerce Certification (`PILLOW-CMC-001` / Q3-14) FINAL PASS
- Worker Registry, Worker Lifecycle, Worker Assignment Engine, Mission Coordination Engine, Executive Reporting Runtime, Worker Performance Review, Worker Recovery System

## Media Factory Report fields

`mediaMissionId`, `timestamp`, `mediaBusinessId`, `channelId`, `channelType`, `contentPipeline`, `currentStage`, `assignedWorkers`, `approvalStatus`, `publishingStatus`, `learningStatus`, `executiveSummary`, `metadataVersion`

## Verification

`npx --yes tsx --test "src/validation/tests/media-factory-core.test.ts"` — 10 passing, 0 failing.
