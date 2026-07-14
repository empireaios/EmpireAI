# EmpireAI Executive Home

**Mission ID:** P7-04  
**Status:** Active  
**Depends on:** P7-01 Founder Shell · P7-02 Cockpit UX · P7-03 Pillow UX  
**Successor:** P7-06 Live ETA ✅ · P7-07 Explainability ✅ · P8-01 Factory

## Purpose

Executive Home is **not merely the first page after login**. It is the **constitutional command center** of EmpireAI.

Within five seconds the Grand King shall understand: *What is happening across my Empire right now?*

## Canonical Architecture

```
Brain executive-home module → ExecutiveHomeView (P7-04)
        ↓
Executive Brief · Centre Summaries · Awareness · KPI · Widgets · Pillow Chat
        ↓
SCR-001 `/cockpit` — default Founder landing
```

## Executive Home Displays

Empire Health · Roadmap Position · Current Mission · Progress · ETA · Builder · Supervisor · Guardian · Pillow Recommendations · Business · Revenue · Orders · Profit · Marketing · Production · Infrastructure · Alerts · Approvals · Recent Activity

## Executive Summary (P7-04)

`executiveBrief` — Overall Empire Status · Strategic Objective · Constitutional Phase · Execution Phase · Highest Risk · Highest Opportunity · Current Recommendation

## Centre Summaries

| Centre | Fields | Deep link |
|--------|--------|-----------|
| **Mission** | mission, owner, step, progress, ETA, risks, validation, recovery | `/cockpit/missions` |
| **Pillow** | recommendations, findings, opportunities, vision, decisions | Embedded chat |
| **Business** | ventures, revenue, orders, profit, marketing, health, trend | `/cockpit/commerce/workspace` |
| **Production** | production, runtime, guardian, sessions, deployment, incidents | `/cockpit/founder/production` |

## Principles

Everything important above the fold · No duplicate information · No unnecessary navigation · Real-time updates · Context preserved · Executive-first design

## Personalization

Adapts from current business, mission, journey, priorities, alerts, and recommendations — no manual configuration.

## Implementation

| Layer | Path |
|-------|------|
| Governance | `docs/governance/EMPIREAI_EXECUTIVE_HOME.md` |
| Backend brief + centres | `backend/src/domain/services/executive-home-p7-04.ts` |
| Brain view | `backend/src/domain/services/cockpit-panel-views.ts` |
| Frontend lib | `empireai-web/lib/executive-home/` |
| Page | `empireai-web/components/cockpit/pages/ExecutiveHomePage.tsx` |
| Brief panel | `empireai-web/components/cockpit/executive/ExecutiveHomeBriefPanel.tsx` |
| Centres grid | `empireai-web/components/cockpit/executive/ExecutiveHomeCentresGrid.tsx` |
| Awareness strip | `empireai-web/components/cockpit/ux/ExecutiveEmpireAwarenessStrip.tsx` |
| Pillow chat | `empireai-web/components/cockpit/executive/ExecutiveHomeChatWorkspace.tsx` |

## Validation Alignment

Vision · Soul · CTD · Constitution Hierarchy · Architecture · Repository · Production Truth · Founder Shell · Cockpit UX · Pillow UX · ECC · VIE · Supervisor · Journey
