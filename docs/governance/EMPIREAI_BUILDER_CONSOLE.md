# EmpireAI Builder Console

**Mission ID:** P7-05  
**Status:** Active  
**Depends on:** P7-04 Executive Home · P6-04 Builder Monitor  
**Successor:** P7-07 Explainability ✅ · P8-01 Factory

## Purpose

The Builder Console is **not a developer console**. It is the **live engineering command centre** of EmpireAI.

The Grand King observes Builder execution in real time without reading logs or opening Cursor.

## Canonical Architecture

```
Builder Monitor (P6-04) + Supervisor + ETA + ECC + Recovery
        ↓
BUILDER_CONSOLE_VIEW (P7-05)
        ↓
`/cockpit/founder/builder` — P7-BUILDER
```

## Live Execution Fields

Current Mission · Roadmap Item · Phase · Purpose · State · Step · Activity · Progress · Stage Progress · Elapsed · ETA · Velocity · Repository · Files · Validation · Recovery · Heartbeat · Risks · Warnings

## Panels

Mission Timeline · Repository Activity · Validation · Recovery · Pillow · Supervisor · ECC

## Principles

Near real-time updates (5s) · No log inspection · No Cursor required · Executive context preserved

## Implementation

| Layer | Path |
|-------|------|
| Governance | `docs/governance/EMPIREAI_BUILDER_CONSOLE.md` |
| View assembler | `pillow/src/builder-console/` |
| API | `GET /api/pillow/builder-console` |
| Dashboard | `empireai-web/components/cockpit/builder/BuilderConsoleDashboard.tsx` |
| Route | `empireai-web/app/(cockpit)/cockpit/founder/builder/page.tsx` |
