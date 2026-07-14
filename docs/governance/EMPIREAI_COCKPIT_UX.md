# EmpireAI Executive Cockpit UX

**Mission ID:** P7-02  
**Status:** Active · Constitutional Executive Control Centre  
**Phase:** P7 Experience  
**Depends on:** P7-01 Founder Shell  
**Successor:** P7-03 Pillow UX

## Constitutional Purpose

The Cockpit is the **Executive Operating System** of EmpireAI — not merely a dashboard.

Every important decision, status, and recommendation must be immediately visible to the Grand King within seconds of opening the Executive Cockpit, without navigating multiple pages or interpreting technical logs.

## Canonical Architecture

```
Founder Shell (P7-01)
        +
COCKPIT_UX (P7-02 · PILLOW-CUX-001)
        +
Brain SSE + polling fallback
        +
Executive Home widgets
        =
Executive Cockpit
```

No competing Cockpit UX standards.

## Executive Centres

| Centre | Route |
|--------|-------|
| Executive Home | `/cockpit` |
| Mission Centre | `/cockpit/missions` |
| Pillow Centre | `/cockpit/development/pillow` |
| Builder Console | `/cockpit/founder/builder` |
| Supervisor Centre | `/cockpit/founder/supervisor` |
| Journey Centre | `/cockpit/founder/journey` |
| Production Centre | `/cockpit/founder/production` |
| Guardian Centre | `/cockpit/founder/guardian` |
| Business Centre | `/cockpit/commerce/workspace` |
| Commerce Centre | `/cockpit/commerce/operating` |
| Knowledge Centre | `/cockpit/founder/architecture` |
| Settings | `/cockpit/governance/settings` |

## UX Principles

Executive First · One Screen Awareness · Zero Confusion · Explain Before Action · Production First · Browser First · Minimal Navigation · Consistent Layout · Real-Time Updates · No Duplicate Information

## Executive Home Awareness

Executive Home displays: Empire Health · Current Mission · Current Roadmap Item · Overall Progress · ETA · Builder Status · Supervisor Status · Guardian Status · Pillow Recommendations · Current Business · Revenue · Production Health · Alerts · Pending Approvals

## Canonical Widgets

Empire Health · Mission Progress · Builder · Supervisor · Journey · Production · Business Health · Revenue · Notifications · Recommendations · Current Risks

## Real-Time Updates

| Domain | Mode |
|--------|------|
| Mission Progress | Hybrid · 15s |
| Execution State | Brain SSE |
| Production Health | Poll · 30s |
| Business Health | Poll · 30s |
| ETA | Poll · 5s |
| Recovery | Brain SSE |
| Alerts | Hybrid · 15s |
| Recommendations | Hybrid · 15s |

Brain SSE events: `task_complete` · `workflow_completed` · `workflow_failed` · `escalation` · `approval_needed` · `workflow_started` · `decision_made`

## Continuous Publications

**Pillow:** Recommendations · Warnings · Architecture Findings · Engineering Findings · Business Findings · Vision Findings

**Supervisor:** Current Mission · Progress · Current Step · ETA · Recovery · Mission Health

**Guardian:** Runtime Health · Infrastructure Health · Performance · Alerts · Availability

## Consolidation

| Layer | Companion | Role |
|-------|-----------|------|
| Founder Shell | P7-01 | Workspace · navigation · context preservation |
| Cockpit UX | `pillow/src/cockpit-ux-architecture/` (PILLOW-CUX-001) | **Canonical P7-02 assembler** |
| Navigation | `empireai-web/lib/cockpit-ux/navigation.ts` | Single nav truth |
| Widgets | `empireai-web/lib/cockpit-ux/widgets.ts` | Canonical widget registry |
| Real-time | `empireai-web/lib/cockpit-ux/useCockpitRealtime.ts` | SSE + polling |
| Awareness | `ExecutiveEmpireAwarenessStrip.tsx` | One-screen executive awareness |

## Implementation

| Layer | Path |
|-------|------|
| Assembler | `pillow/src/cockpit-ux-architecture/` |
| API | `GET /api/pillow/cockpit-ux` |
| Executive Home | `empireai-web/components/cockpit/pages/ExecutiveHomePage.tsx` |
| Sidebar | `empireai-web/components/cockpit/shell/CockpitSidebar.tsx` |
| Real-time bridge | `empireai-web/components/cockpit/ux/CockpitRealtimeBridge.tsx` |

## Validation Alignment

Vision · Soul · CTD · Constitution Hierarchy · Architecture · Repository · Production Truth · Founder Shell · ECC · Supervisor · Guardian
