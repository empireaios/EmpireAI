# G4-03 — Executive Home Experience · Executive Audit

**Mission:** G4-03 — Executive Home Experience  
**Authority:** Grand King · GO-002 Phase 4 · G4-02 live wiring prerequisite  
**Date:** 2026-06-21  
**Status:** **COMPLETE**  
**Canonical route:** `/cockpit` (Executive Home — default King landing)

---

## Executive Summary

Executive Home is now the **King's primary operating screen**. A single `executive-home` Brain dispatch aggregates ten Executive Summary cards plus attention items, next action, and engine health — answering the six daily questions without placeholder numbers.

**Screenshots:** Not captured in this headless wiring session. Verify at `/cockpit` after starting backend + `empireai-web`.

---

## 1. Screens Implemented

| Screen | Route | Screen ID | Status |
|--------|-------|-----------|--------|
| **Executive Home** | `/cockpit` | SCR-001 | ✅ G4-03 primary operating screen |
| Default landing | `/platform` → `/cockpit` | — | ✅ Existing redirect preserved |
| Post-login | → `/cockpit` | — | ✅ Unchanged |

### Executive Home layout (top → bottom)

1. Page header (live data mode badge)
2. Grand King greeting + top certification blocker
3. **Attention strip** — what requires my attention?
4. **Next action strip** — what should I do next?
5. **Executive Summary card grid** (10 cards)
6. **V1 Engine health strip** — which AI engines are healthy?

---

## 2. Widgets Completed

### G4-03 new widgets

| Widget ID | Component | Purpose |
|-----------|-----------|---------|
| W-E-014 | `ExecutiveSummaryCardGrid` | 10 summary cards from Brain |
| W-E-015 | `ExecutiveAttentionStrip` | Aggregated attention items |
| W-E-016 | `ExecutiveNextActionStrip` | OMS / certification next action |
| W-E-017 | `ExecutiveEngineHealthStrip` | 7-engine health row |

### Executive Summary cards (minimum 10)

| Card ID | Title | Live data source |
|---------|-------|------------------|
| `empire-health` | Empire Health | ESIS + operational readiness |
| `revenue-today` | Revenue Today | Order repository `profitTodayCents` |
| `marketplace-status` | Marketplace Status | Marketplace engine panel (B6-01) |
| `supplier-status` | Supplier Status | Supplier engine panel (B6-02) |
| `active-missions` | Active Missions | OMS objective dashboard |
| `executive-alerts` | Executive Alerts | B5–B8 certification blockers |
| `pillow-status` | Pillow Status | Pillow approval runtime |
| `pending-kings-approval` | Pending King's Approval | Decision repo + Pillow queue |
| `ai-recommendations` | AI Recommendations | AI CEO seeded briefing + OMS |
| `executive-timeline` | Executive Timeline | Activity repo + global-execution-timeline |

### Unavailable data rule

When `available === false` or `primaryValue === null`, cards render:

- **Status**
- **Dependency**
- **Next Action**

No fabricated metrics.

---

## 3. Brain Endpoints Used

| Module | Action | Tool | Used for |
|--------|--------|------|----------|
| **`executive-home`** | `load` | `executive_home.load_view` | Single dispatch for entire Executive Home |

### Aggregated inside `loadExecutiveHomeView`

| Internal loader | Data |
|-----------------|------|
| `loadOperationalCommandView` | Readiness, PROOF-001, OMS, approvals, blockers |
| `loadDashboardView` | Portfolio metrics, companies, recent activity |
| `loadAllEnginePanels` | 7 V1 engine summaries |
| `buildEsisDashboard` | Empire Health card |
| `loadOrdersView` / `loadFinanceView` | Revenue Today |
| `loadAiCeoView` | AI Recommendations |
| `loadPillowSupervisorView` | Pillow + Pending Approval |
| `buildObjectiveDashboard` | Active Missions |
| `buildGlobalExecutionTimeline` | Executive Timeline |
| `buildExecutiveSummaryCards` | Normalized 10-card contract |
| `buildAttentionItems` | Attention strip |

Frontend uses **one** `useBrainModule("executive-home")` per widget group (shared cache via hook).

---

## 4. Six Daily Questions — Mapping

| Question | UI element | Data |
|----------|------------|------|
| What requires my attention? | `ExecutiveAttentionStrip` | `attentionItems[]` |
| What made money today? | Revenue Today card | `orders.profitTodayCents` |
| Which AI engines are healthy? | Engine health strip + engine cards | `engineSummaries[]` |
| Which missions are running? | Active Missions card | OMS objectives |
| Which approvals are waiting? | Pending King's Approval card | Pillow + decision repo |
| What should I do next? | `ExecutiveNextActionStrip` | `nextExecutiveAction` |

---

## 5. Files Changed

### Backend

| File | Change |
|------|--------|
| `backend/src/domain/services/cockpit-panel-views.ts` | `ExecutiveSummaryCard`, `buildExecutiveSummaryCards`, extended `ExecutiveHomeView` |
| `backend/src/agents/tools/module-load-tools.ts` | G4-03 description update |
| `backend/src/validation/tests/cockpit-panel-views.test.ts` | Assert 10 summary cards |

### Frontend

| File | Change |
|------|--------|
| `empireai-web/components/cockpit/pages/ExecutiveHomePage.tsx` | G4-03 layout |
| `empireai-web/components/cockpit/widgets/ExecutiveSummaryCards.tsx` | **New** — cards, attention, next action, engine strip |
| `empireai-web/lib/cockpit/panel-types.ts` | G4-03 types |
| `empireai-web/lib/cockpit/widgets/registry.ts` | W-E-014–017 |

---

## 6. Remaining Work

| Item | Notes |
|------|-------|
| GC-03 Notification Centre | Not wired to Executive Alerts card (future REAL mission) |
| Generative AI CEO briefing | Seeded repository only — `ai-ceo.brief` action not on home |
| Governance policy/risk Brain dispatch | Still static preview on governance routes |
| Workforce Agents panel | Demo — not wired |
| Executive Learning | Explicit not-implemented (Development) |
| Visual polish / card drill-down modals | Out of scope — wiring only per G4-02 constraint carry-forward |

---

## 7. Validation

```
backend/src/validation/tests/cockpit-panel-views.test.ts
  ✔ returns six-field engine panel for supplier engine
  ✔ loads executive home with engine summaries (10 summaryCards)
  ✔ loads mission centre with OMS data
3 pass · 0 fail

Backend typecheck: pass
Frontend typecheck: pass
```

---

## 8. King Verification Checklist

1. Navigate to `/cockpit` — confirm 10 Executive Summary cards load.
2. Confirm Revenue Today shows order-repo value (may be `$0.00` — not fake).
3. Confirm attention strip lists open B5–B8 blockers when present.
4. Confirm next action reflects OMS or top certification blocker.
5. Confirm engine health strip shows 7 engines with live health badges.
6. Click any card — confirm deep-link to department route.

---

**G4-03 complete.**
