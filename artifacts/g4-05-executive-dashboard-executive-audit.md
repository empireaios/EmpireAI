# G4-05 — Executive Dashboard Integration · Executive Audit

**Mission:** G4-05 — Executive Dashboard Integration  
**Authority:** Grand King · GO-002 Phase 4 · G4-04 Engine Centers prerequisite  
**Date:** 2026-06-21  
**Status:** **COMPLETE**  
**Scope:** Integration and executive workflow only — no Cockpit UI redesign · G4-06 not started

---

## Executive Summary

The Cockpit is now an **integrated Executive Dashboard**: Executive Home, Engine Centers, alerts, approvals, timeline, and dependency graph share one Brain aggregate (`executive-home`) and cross-linked routing.

**Screenshots:** Not captured in this headless session. Verify at `/cockpit` and any Engine Center route.

---

## 1. Dashboard Integrations

| Integration | Implementation | Brain source |
|-------------|----------------|--------------|
| Executive Home ↔ Engine Centers | Summary cards `engineCenterId` + `href` via `applyCardEngineCenterLinks` | `executive-home.summaryCards` |
| Engine health strip | Clickable chips → canonical engine routes | `executive-home.engineSummaries` + `engineCenterHref()` |
| Cross-engine awareness | Upstream/downstream/related/missions on each Engine Center | `cockpit-engine` → `crossEngine` |
| Executive Timeline | Aggregated panel on Executive Home | `executive-home.executiveTimeline` |
| Executive Alerts | Attention strip + alerts panel with engine routing | `executive-home.executiveAlerts` |
| King's Approvals | Approval routing panel with workflow deep-links | `executive-home.approvalRoutes` |
| Dependency Graph | V1 spine visualization on Executive Home | `executive-home.dependencyGraph` |

### Executive Home layout additions (G4-05)

- King's Approvals routing panel  
- Executive Dependency Graph  
- Executive Timeline (anchor `#executive-timeline`)  
- Cards/alerts retain existing visual style — integration only

---

## 2. Card → Engine Center deep links

| Card | Engine Center / Workflow |
|------|---------------------------|
| Empire Health | Analytics Engine |
| Revenue Today | Analytics Engine |
| Marketplace Status | Marketplace Engine |
| Supplier Status | Supplier Engine |
| Active Missions | Mission Centre (`/cockpit/missions`) |
| Executive Alerts | First alert route or `#executive-alerts` |
| Pillow Status | Pillow Supervisor |
| Pending King's Approval | Approvals workflow |
| AI Recommendations | Quantitative Intelligence Engine |
| Executive Timeline | `#executive-timeline` anchor |

---

## 3. Dependency Graph

**Backend:** `buildExecutiveDependencyGraph()` in `executive-dashboard-integration.ts`

**V1 nodes (9):** supplier, marketplace, storefront, advertising, payment, logistics, analytics, quantitative-intelligence, pillow-supervisor

**V1 edges (commercial spine):**

```
quantitative-intelligence → supplier, marketplace
supplier → logistics, marketplace
marketplace → storefront
storefront → advertising, payment
payment → analytics
logistics → analytics
advertising → analytics
pillow-supervisor → supplier, marketplace (approval gates)
```

**UI:** `ExecutiveDependencyGraphPanel` — node health badges + edge list with links (no layout redesign).

---

## 4. Cross-Engine Routing

### Engine Center (`EngineCenterLayout`)

Each center now includes **Cross-Engine Awareness**:

- **Upstream dependencies** — V1 graph predecessors + reason labels  
- **Downstream dependencies** — V1 graph consumers  
- **Related Engine Centers** — graph neighbors + Pillow Supervisor  
- **Related active missions** — OMS objectives matched by engine keywords  

### Executive Alerts (`buildExecutiveAlerts`)

| Alert type | Routes to |
|------------|-----------|
| B6 blockers | Marketplace Engine or Integrations |
| Failed engine | Affected Engine Center |
| Pillow pending | Pillow Supervisor / Approvals |
| Executive decisions | Command Centre |
| OMS RED | Mission Centre |

### Executive Approvals (`buildExecutiveApprovalRoutes`)

| Approval type | Workflow href | Engine link |
|---------------|---------------|-------------|
| Executive decision | `/cockpit/command` | — |
| Pillow pending | `/cockpit/development/approvals` | Pillow Supervisor |

---

## 5. Timeline Implementation

**`buildExecutiveTimeline()`** aggregates live events from:

| Source | Engine |
|--------|--------|
| Pillow recent approvals | Pillow Supervisor |
| Supplier detail rows | Supplier |
| Marketplace channels | Marketplace |
| Store build stages | Storefront |
| Marketing campaigns | Advertising |
| Order profit today | Payment |
| Recent orders | Logistics |
| PROOF-001 state | Analytics |
| Portfolio activity | Executive Home |
| Global execution timeline | OMS / Mission Centre |

Events sorted by timestamp, capped at 24, each with `href` to engine center or workflow.

---

## 6. Files Changed

### Backend (new)

- `backend/src/domain/services/executive-dashboard-integration.ts`
- `backend/src/validation/tests/executive-dashboard-integration.test.ts`

### Backend (extended)

- `backend/src/domain/services/cockpit-panel-views.ts` — extended `ExecutiveHomeView`, card linking, alerts
- `backend/src/domain/services/engine-center-views.ts` — `crossEngine` on `EngineCenterView`

### Frontend (new)

- `empireai-web/components/cockpit/widgets/ExecutiveDashboardIntegration.tsx`

### Frontend (extended)

- `empireai-web/components/cockpit/pages/ExecutiveHomePage.tsx` — timeline, graph, approvals
- `empireai-web/components/cockpit/widgets/EnginePanelFrame.tsx` — cross-engine awareness panel
- `empireai-web/components/cockpit/widgets/ExecutiveSummaryCards.tsx` — alert engine labels, card engineCenterId
- `empireai-web/lib/cockpit/panel-types.ts` — G4-05 types

---

## 7. Brain Endpoints

| Module | Action | Delivers |
|--------|--------|----------|
| `executive-home` | `load` | Full integrated dashboard aggregate |
| `cockpit-engine` | `load` | Engine center + `crossEngine` awareness |

No new module IDs — integration extends existing G4-02/G4-04 dispatch paths.

---

## 8. Remaining Work

| Item | Notes |
|------|-------|
| Visual graph layout (force-directed) | Out of scope — list/grid integration only |
| GC-03 Notification Centre | Not merged into alert stream |
| Per-approval engine inference | Pillow → Pillow; executive → Command |
| Real-time SSE timeline | Polling via `useBrainModule` reload only |
| G4-06+ | Not started per scope gate |

---

## 9. Validation

```
executive-dashboard-integration.test.ts — 3/3 pass
cockpit-panel-views.test.ts — 3/3 pass (includes G4-05 fields)

Backend typecheck: pass
Frontend typecheck: pass
```

---

## 10. King Verification Checklist

1. Open `/cockpit` — confirm Dependency Graph, Timeline, Approvals panels load.  
2. Click each summary card — confirm navigation to correct Engine Center or workflow.  
3. Open Supplier Engine — confirm Cross-Engine Awareness shows upstream/downstream.  
4. Trigger or observe an alert — confirm attention strip links to engine route.  
5. Pending approval — confirm "Open workflow" routes to Approvals or Command.  
6. Timeline events — confirm each row links to source engine center.

---

**G4-05 complete.**
