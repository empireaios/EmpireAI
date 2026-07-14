# G4-04 — Engine Centers · Executive Audit

**Mission:** G4-04 — Engine Centers  
**Authority:** Grand King · GO-002 Phase 4 · G4-03 Executive Home prerequisite  
**Date:** 2026-06-21  
**Status:** **COMPLETE**  
**Scope:** Engine Centers only — Executive Home unchanged · no AI decision logic · G4-05 not started

---

## Executive Summary

All **nine mandated Engine Centers** are fully navigable operational departments. Each exposes the **G4-04 eight-section contract** via a single Brain dispatch (`cockpit-engine` → `loadEngineCenterView`).

**Eight sections (every center):**

Overview · Health · Current Activity · Dependencies · Executive Audit · Configuration · Future Expansion · Next Actions

Unavailable data renders **Status / Dependency / Next Action** only — no placeholder business metrics.

**Screenshots:** Not captured in this headless session. Verify each route listed below.

---

## 1. Engine Completion Status

| # | Engine Center | Route | Brain module | Status |
|---|---------------|-------|--------------|--------|
| 1 | Supplier Engine | `/cockpit/intelligence/suppliers` | `cockpit-engine` `{ engineId: "supplier" }` | ✅ Complete |
| 2 | Marketplace Engine | `/cockpit/intelligence/marketplace` | `cockpit-engine` `{ engineId: "marketplace" }` | ✅ Complete |
| 3 | Storefront Engine | `/cockpit/commerce/store` | `cockpit-engine` `{ engineId: "storefront" }` | ✅ Complete |
| 4 | Advertising Engine | `/cockpit/commerce/marketing` (+ `/commerce/ads`) | `cockpit-engine` `{ engineId: "advertising" }` | ✅ Complete |
| 5 | Payment Engine | `/cockpit/finance/billing` | `cockpit-engine` `{ engineId: "payment" }` | ✅ Complete |
| 6 | Logistics Engine | `/cockpit/operations/fulfillment` | `cockpit-engine` `{ engineId: "logistics" }` | ✅ Complete |
| 7 | Analytics Engine | `/cockpit/finance/profit` | `cockpit-engine` `{ engineId: "analytics" }` | ✅ Complete |
| 8 | Quantitative Intelligence Engine | `/cockpit/intelligence/discovery` | `cockpit-engine` `{ engineId: "quantitative-intelligence" }` | ✅ Complete (partial — PIE scores live) |
| 9 | Pillow Supervisor | `/cockpit/development/pillow` | `cockpit-engine` `{ engineId: "pillow-supervisor" }` | ✅ Complete |

### Partial implementation (explicit, not fake data)

| Engine | Note |
|--------|------|
| Quantitative Intelligence | Full discovery board deferred; PIE product scores live in Current Activity |
| Advertising | Meta live connector optional pre-PROOF-001 |
| Pillow | Runtime approval state only — no NL reasoning in cockpit |

### Not in G4-04 nine-center mandate (unchanged)

| Surface | Route | Module |
|---------|-------|--------|
| Product Intelligence Center | `/cockpit/intelligence/products` | `cockpit-intelligence` (compact panel + catalog) |

---

## 2. Brain Connections

### Primary dispatch

```
POST /api/brain/dispatch
  module: "cockpit-engine"
  action: "load"
  payload: { engineId: "<EngineCenterPanelId>" }
    → cockpit_engine.load_view
    → loadEngineCenterView(engineId, workspaceId)
    → loadEnginePanelView + buildSections (8 sections)
```

### Backend loaders

| File | Responsibility |
|------|----------------|
| `backend/src/domain/services/engine-center-views.ts` | **New** — G4-04 eight-section contract, routes, sibling nav |
| `backend/src/domain/services/cockpit-panel-views.ts` | Engine panel loaders + QIE + Pillow engine panels |
| `backend/src/agents/tools/module-load-tools.ts` | `cockpit_engine.load_view` returns `EngineCenterView` |

### Domain data sources (live when available)

| Engine | Runtime sources |
|--------|-----------------|
| Supplier | B6-02, CJ credentials, `suppliers.load_view` |
| Marketplace | B6-01a/b, Amazon ADR-052 profiles, integrations |
| Storefront | `store.load_view`, launch workflow |
| Advertising | `marketing.load_view`, `ads.load_view` |
| Payment | B6-03 Stripe, `finance.load_view` |
| Logistics | CJ fulfilment, `orders.load_view` |
| Analytics | PROOF-001, dashboard, finance |
| Quantitative Intelligence | `intelligence.load_view` (PIE scores) |
| Pillow Supervisor | Pillow approval repository, V1 operational flag |

---

## 3. Navigation Updates

| Change | Detail |
|--------|--------|
| Intelligence tab | **Discovery** renamed **Quantitative Intel** (SCR-102) |
| Engine health strip | Executive Home engine chips link to canonical engine routes |
| Payment href fix | `engineHref("payment")` → `/cockpit/finance/billing` (was broken `/finance/revenue`) |
| Cross-navigation | Each Engine Center includes sibling engine link bar |
| Registry | `empireai-web/lib/cockpit/engine-centers.ts` — canonical 9-center route map |

**IA preserved:** Engine Centers remain **department-embedded** per G4-01 — no new `/cockpit/engines/*` sidebar section.

---

## 4. Files Changed

### Backend (new)

- `backend/src/domain/services/engine-center-views.ts`
- `backend/src/validation/tests/engine-center-views.test.ts`

### Backend (extended)

- `backend/src/domain/services/cockpit-panel-views.ts` — `ENGINE_CENTER_PANEL_IDS`, QIE + Pillow loaders, payment href fix
- `backend/src/agents/tools/module-load-tools.ts` — returns `EngineCenterView`

### Frontend (new)

- `empireai-web/lib/cockpit/engine-centers.ts` — route registry + nav metadata

### Frontend (extended)

- `empireai-web/components/cockpit/widgets/EnginePanelFrame.tsx` — **`EngineCenterLayout`** (8 sections)
- `empireai-web/components/cockpit/widgets/IntelligenceEnginePanels.tsx` — QIE discovery center
- `empireai-web/components/cockpit/widgets/DevelopmentPanels.tsx` — Pillow engine center
- `empireai-web/lib/cockpit/panel-types.ts` — `EngineCenterView`, extended `CockpitEngineId`
- `empireai-web/lib/cockpit/navigation.ts` — Quantitative Intel tab label
- `empireai-web/components/cockpit/widgets/ExecutiveSummaryCards.tsx` — engine chip deep-links only

Department panels (Commerce, Finance, Operations) continue using `EngineCenterPanel` (alias → `EngineCenterLayout`) with domain tables as children below the eight sections.

---

## 5. Eight-Section Contract (UI)

`EngineCenterLayout` renders:

1. **Header** — display name, data mode, health badge  
2. **Section grid** — 8 panels from `sections.*`  
3. **Sibling navigation** — links to other engine centers  
4. **Children** — optional domain tables (suppliers, orders, finance, etc.)

When `section.available === false`:

```
Status:     <runtime message>
Dependency: <blocker or module>
Next Action: <concrete step>
```

**Future Expansion** slots are architecture placeholders only — no fabricated KPIs.

---

## 6. Remaining Work

| Item | Notes |
|------|-------|
| Full QIE discovery scoring board | PIE scores live; board UI deferred |
| Product Intelligence as 10th engine center | Out of G4-04 nine-center scope |
| GC-03 alerts in engine centers | Notification centre not wired per-engine |
| Generative Pillow / AI decision logic | Explicitly out of scope |
| Unified `/cockpit/engines` hub page | Optional — not required by G4-01 IA |
| G4-05 | Not started per scope gate |

---

## 7. Validation

```
backend/src/validation/tests/engine-center-views.test.ts
  ✔ loads eight-section engine center for each of 9 engine IDs (9 tests)

Backend typecheck: pass
Frontend typecheck: pass
```

---

## 8. King Verification Checklist

1. Open each of the 9 routes above — confirm 8 sections load from Brain.
2. Supplier + Marketplace — confirm B6 credential status in Configuration.
3. Quantitative Intel — confirm high-score table when catalog seeded; explicit partial status when empty.
4. Pillow — confirm approval counts match Mission Centre.
5. Click sibling engine links — confirm cross-navigation works.
6. Executive Home — confirm layout unchanged except engine chip links.

---

**G4-04 complete.** G4-05 not started.
