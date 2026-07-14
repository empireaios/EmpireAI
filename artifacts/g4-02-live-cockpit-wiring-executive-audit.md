# G4-02 — Grand King Cockpit Live Wiring · Executive Audit

**Mission:** G4-02 — Grand King Cockpit Live Wiring  
**Authority:** Grand King · GO-002 Phase 4 · G4-01 architecture prerequisite  
**Date:** 2026-06-21  
**Status:** **WIRING COMPLETE** (G4-02 scope only — no UI redesign, no AI logic, G4-03 not started)

---

## Executive Summary

G4-02 connects the Grand King Cockpit shell to Brain dispatch and wires live (or explicitly not-implemented) panels across Executive Home, Command Centre, Mission Centre, Executive Audit Center, Pillow Supervisor, and all seven mandated V1 engine centers.

Every engine panel exposes the six-field contract: **Current State · Health · Progress · Next Action · Executive Audit · Dependencies**.

**Dispatch path:**

```
Cockpit widget → useBrainModule(module, "load", { payload? })
  → POST /api/brain/dispatch
  → module-load-tools handler
  → cockpit-panel-views / operational-command-view / module-views / ESIS / OMS
```

**Validation:** Backend typecheck clean · Frontend typecheck clean · `cockpit-panel-views.test.ts` — 3/3 pass.

**Screenshots:** Not captured in this environment (headless wiring session). Verify visually at `/cockpit`, `/cockpit/command`, `/cockpit/missions`, and department engine routes.

---

## 1. Files Changed (G4-02)

### Backend — new

| File | Purpose |
|------|---------|
| `backend/src/domain/services/cockpit-panel-views.ts` | Normalized panel views: engine panels, executive home, missions, audit, pillow |
| `backend/src/validation/tests/cockpit-panel-views.test.ts` | Unit tests for engine/home/mission loaders |

### Backend — extended

| File | Change |
|------|--------|
| `backend/src/agents/tools/module-load-tools.ts` | Tools: `executive_home`, `cockpit_missions`, `cockpit_audit`, `cockpit_pillow`, `cockpit_engine`, `cockpit_intelligence` |
| `backend/src/agents/routes/module-routes.ts` | Matching `load` routes for new modules |
| `backend/src/auth/permissions.ts` | Founder/admin/operator permissions for cockpit modules |

### Frontend — new

| File | Purpose |
|------|---------|
| `empireai-web/lib/cockpit/panel-types.ts` | Shared TS types for Brain panel payloads |
| `empireai-web/components/cockpit/widgets/EnginePanelFrame.tsx` | Six-field engine panel frame + `EngineCenterPanel` |
| `empireai-web/components/cockpit/widgets/ExecutiveHomeLiveWidgets.tsx` | Executive Home live widgets |
| `empireai-web/components/cockpit/widgets/CommandCentreLiveWidgets.tsx` | Command Centre live widgets |
| `empireai-web/components/cockpit/widgets/MissionCentreLiveWidgets.tsx` | Mission Centre live widgets |
| `empireai-web/components/cockpit/widgets/IntelligenceEnginePanels.tsx` | Intelligence + supplier/marketplace engine wiring |
| `empireai-web/components/cockpit/widgets/CommerceEnginePanels.tsx` | Marketing/ads + advertising engine wiring |

### Frontend — rewired

| File | Change |
|------|--------|
| `empireai-web/components/cockpit/shell/CockpitShell.tsx` | `ExecutiveCommandStrip` → `cockpit-command` in global chrome |
| `empireai-web/components/cockpit/pages/ExecutiveHomePage.tsx` | Full live Executive Home |
| `empireai-web/components/cockpit/pages/CommandCentrePage.tsx` | Full live Command Centre |
| `empireai-web/components/cockpit/pages/MissionCentrePage.tsx` | Full live Mission Centre |
| `empireai-web/components/cockpit/widgets/DevelopmentPanels.tsx` | Pillow, ESIS audit, approvals inbox live; Learning explicit not-implemented |
| `empireai-web/components/cockpit/widgets/FinancePanels.tsx` | Live finance + payment/analytics engines + V1 certification |
| `empireai-web/components/cockpit/widgets/CommerceStorePanel.tsx` | Storefront engine panel prepended |
| `empireai-web/components/cockpit/widgets/OperationsPanels.tsx` | Logistics engine panel prepended |
| `empireai-web/components/cockpit/widgets/GovernancePanels.tsx` | Executive audit live; council/soul/recovery explicit not-implemented |
| `empireai-web/lib/brain/hooks/useBrainModule.ts` | Payload + companyId support for `cockpit-engine` |
| `empireai-web/lib/platform/types.ts` | New `ModuleId` values |
| `empireai-web/lib/cockpit/widgets/registry.ts` | Widget catalogue updated — live vs placeholder flags |
| Intelligence/commerce/governance route pages | Point to live panel components |

---

## 2. Live Panels

### Global shell

| Panel | Screen | Brain module | Data mode |
|-------|--------|--------------|-----------|
| Executive Command Strip | All cockpit routes | `cockpit-command` | Live |
| KPI Strip (ledger-backed) | SCR-001, SCR-010 | `master-completion-ledger` (via hook) | Live |

### Executive Home (SCR-001) — King's daily operating screen

| Widget | Brain module |
|--------|--------------|
| Grand King Greeting | `executive-home` |
| KPI Strip | Ledger + dashboard |
| PROOF-001 Tracker | `executive-home` |
| Command Snapshot | `executive-home` (aggregates `cockpit-command`) |
| Mission Queue Preview | `executive-home` (OMS) |
| Portfolio Pulse | `executive-home` |
| Agent Activity | `executive-home` (activity repository) |
| V1 Engine Health Row | `executive-home` (7 engine summaries) |

### Command Centre (SCR-010)

| Widget | Brain module |
|--------|--------------|
| KPI Strip | Ledger |
| Operational Readiness | `cockpit-command` |
| AI CEO Briefing | `ai-ceo` (seeded repository — no generative AI in G4-02) |
| Pending Decisions | `ai-ceo` |
| Portfolio Table | `executive-home` |
| Agent Activity | `executive-home` |

### Mission Centre (SCR-020)

| Widget | Brain module |
|--------|--------------|
| Blocker Strip | `cockpit-missions` |
| Approval Triage | `cockpit-missions` |
| Mission Queue Full | `cockpit-missions` |

### Executive Audit Center

| Route / Panel | Brain module |
|---------------|--------------|
| Development → ESIS Inspection | `cockpit-audit` |
| Governance → Decisions | `cockpit-audit` |
| Governance → V1 Certification | `cockpit-audit` |
| Finance → V1 Certification panel | `cockpit-audit` |

### Pillow Supervisor (SCR-800)

| Panel | Brain module |
|-------|--------------|
| Pillow runtime state | `cockpit-pillow` |
| Approvals inbox | `cockpit-missions` |
| Executive Learning | **Not implemented** (explicit message) |

### Department panels (existing module views + engine centers)

| Department route | Module views | Engine center |
|------------------|--------------|---------------|
| Intelligence → Products | `cockpit-intelligence`, `intelligence` | — |
| Intelligence → Suppliers | `suppliers`, `cockpit-engine` | Supplier |
| Intelligence → Marketplace | `cockpit-engine` | Marketplace |
| Commerce → Store | `store`, `launch` | Storefront |
| Commerce → Marketing / Ads | `marketing`, `ads` | Advertising |
| Finance → Profit / Costs | `finance` | Analytics, Payment |
| Operations → Fulfillment | `orders` | Logistics |
| Infrastructure → Integrations | `integrations` | — |

---

## 3. Connected Brain Endpoints

| Module ID | Action | Tool | Payload |
|-----------|--------|------|---------|
| `executive-home` | `load` | `executive_home.load_view` | — |
| `cockpit-command` | `load` | `cockpit_command.load_view` | — |
| `cockpit-missions` | `load` | `cockpit_missions.load_view` | — |
| `cockpit-audit` | `load` | `cockpit_audit.load_view` | — |
| `cockpit-pillow` | `load` | `cockpit_pillow.load_view` | — |
| `cockpit-engine` | `load` | `cockpit_engine.load_view` | `{ engineId }` |
| `cockpit-intelligence` | `load` | `cockpit_intelligence.load_view` | — |
| `ai-ceo` | `load` | `ai-ceo.load_view` | — |
| `finance` | `load` | `finance.load_view` | — |
| `integrations` | `load` | `integrations.load_view` | — |
| `orders` | `load` | `orders.load_view` | — |
| `marketing` / `ads` / `store` / `suppliers` / `launch` | `load` | Existing module-load tools | — |

All routes dispatch through `POST /api/brain/dispatch` with workspace context from auth session.

---

## 4. Connected Engines (Six-Field Contract)

Each engine is loaded via `cockpit-engine` with `{ engineId }` and rendered through `EnginePanelFrame`.

| Engine ID | Display name | Route anchor | Runtime sources |
|-----------|--------------|--------------|-----------------|
| `supplier` | Supplier Engine | Intelligence → Suppliers | B6-02, CJ credentials, `suppliers.load_view` |
| `marketplace` | Marketplace Engine | Intelligence → Marketplace | B6-01a/b, ADR-052 profiles, integrations |
| `storefront` | Storefront Engine | Commerce → Store | `store.load_view`, launch workflow |
| `advertising` | Advertising Engine | Commerce → Marketing, Ads | `marketing.load_view`, `ads.load_view` |
| `payment` | Payment Engine | Finance → Revenue | B6-03 Stripe, `finance.load_view` |
| `logistics` | Logistics Engine | Operations → Fulfillment | CJ fulfilment, `orders.load_view` |
| `analytics` | Analytics Engine | Finance → Profit | Analytics conversion engine, finance metrics |

**Contract fields (all engines):** `currentState`, `health`, `progress`, `nextAction`, `executiveAudit`, `dependencies` (+ optional `metrics`, `detailRows`).

Engines with partial implementation (e.g. shopee-sg, shopify) report **NOT_IMPLEMENTED** or explicit pending status in `detailRows` — no fake live data.

---

## 5. Remaining Widgets / Explicit Gaps

### Not yet implemented (explicit UI message — no placeholder data)

| Widget / Screen | Status |
|-------------------|--------|
| Executive Learning (Development) | Not implemented |
| Executive Council (Governance) | Not implemented |
| Soul Decision Chamber (Governance) | Not implemented |
| Recovery Plans doctrine panel | Not implemented |
| Workforce Agents Panel | Demo — not wired |
| Governance Policies (Brain) | Static doctrine preview only |
| Governance Risk Register (Brain) | Static preview only |

### Live with sandbox/demo domain data (verified runtime, not production commerce)

| Widget | Notes |
|--------|-------|
| Operations Orders Panel | Sandbox order pipeline |
| Commerce workspace panels | Domain store data; live commerce gated on B6 credentials |

### Pre-existing placeholder files (superseded, not mounted on routes)

Legacy `*Placeholder.tsx` components remain in repo for reference but are no longer used on G4-02 wired screens.

---

## 6. Mission Constraints — Verified

| Constraint | Status |
|------------|--------|
| Wiring only — no UI redesign | ✅ Existing REAL-079 layout preserved |
| No AI logic implementation | ✅ Pillow shows runtime only; ai-ceo uses seeded repository |
| No G4-03 progression | ✅ Stopped at G4-02 |
| No placeholder widgets on wired screens | ✅ Live data, verified state, or explicit not-implemented |
| Engine six-field contract | ✅ `EnginePanelFrame` enforces all fields |

---

## 7. Test Evidence

```
backend/src/validation/tests/cockpit-panel-views.test.ts
  ✔ returns six-field engine panel for supplier engine
  ✔ loads executive home with engine summaries
  ✔ loads mission centre with OMS data
3 pass · 0 fail
```

---

## 8. Recommended King Verification (manual)

1. Open `/cockpit` — confirm greeting, KPIs, PROOF-001, engine health row populate from Brain.
2. Open `/cockpit/command` — confirm operational readiness, ai-ceo briefing, portfolio table.
3. Open `/cockpit/missions` — confirm blockers and approval triage from OMS/Pillow.
4. Open Intelligence → Suppliers — confirm Supplier Engine panel six fields.
5. Open Governance → V1 — confirm B5–B8 certification blockers from `cockpit-audit`.
6. Confirm global Executive Command Strip shows certification chips and OMS objective.

---

**G4-02 complete.** Next mission (G4-03+) not started per scope gate.
