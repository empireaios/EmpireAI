# EmpireAI Live ETA Experience

**Mission ID:** P7-06  
**Status:** Active  
**Depends on:** P7-05 Builder Console · P6-05 ETA Engine · P6-03 Supervisor · P6-04 Builder Monitor  
**Successor:** P7-07 Explainability ✅ · P8-01 Factory

## Purpose

Fulfills the Grand King's constitutional requirement: continuously know **how much is done**, **how much remains**, **when completion is expected**, and **why the estimate changes** — from live execution evidence, not manual calculation.

## Canonical Architecture

```
Builder Monitor (evidence) + Supervisor (validation) + ETA Engine (prediction)
        ↓
LIVE_ETA_EXPERIENCE (P7-06)
        ↓
Builder Console · Live ETA panel · Executive Home awareness
```

## Live ETA Displays

Mission Countdown · Progress · Completed/Remaining Work · Predicted Finish · Velocity · Confidence · Delay · Bottleneck · Supervisor Timer · Builder Countdown

## Update Policy

Automatic refresh every **5 seconds** — no manual reload on progress, step, repository, recovery, validation, or velocity changes.

## Implementation

| Layer | Path |
|-------|------|
| Assembler | `pillow/src/live-eta/` |
| API | `GET /api/pillow/live-eta` |
| Dashboard | `empireai-web/components/cockpit/live-eta/LiveEtaDashboard.tsx` |
| Route | `/cockpit/founder/live-eta` |
