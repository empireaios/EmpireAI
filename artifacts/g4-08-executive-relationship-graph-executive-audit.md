# G4-08 — Executive Relationship Graph · Executive Audit

**Mission:** G4-08 — Executive Relationship Graph  
**Authority:** Grand King · GO-002 Phase 4 · G4-07 AI Interaction Layer prerequisite  
**Date:** 2026-07-02  
**Status:** **COMPLETE**  
**Scope:** Architecture, interaction, and navigation only — **no graph animations**

---

## Executive Summary

The Cockpit now exposes an **Executive Relationship Graph** — a live, extensible model of how Version 1 engines connect across the Empire. Every V1 engine is a navigable node with health, upstream/downstream relationships, active missions, and blocking issues derived from existing Brain aggregates.

**Design principle:** Graph data is assembled from **executive-home, cockpit-engine, OMS, and alert aggregates**. No new LLM or generative logic was added.

**Route:** `/cockpit/relationship` (SCR-015)  
**Screenshots:** Not captured (requires authenticated session). Verify via sidebar **Relationship Graph**.

---

## 1. Architecture

```
Grand King (Cockpit UI)
  │
  ├─ Sidebar: Relationship Graph (SCR-015)
  ├─ Executive Home: dependency graph → link to full graph
  │
  ▼
ExecutiveRelationshipGraphProvider
  useBrainModule("executive-relationship-graph")
  │
  ▼
POST /api/brain/dispatch
  module: executive-relationship-graph
  action: load
  │
  ▼
Brain module-load-tools
  executive_relationship_graph.load_view
  │
  ▼
executive-relationship-graph.ts
  ├─ V1_ENGINE_IDS (9 nodes)
  ├─ V1_DEPENDENCY_EDGES (spine)
  ├─ buildExecutiveAlerts → blocking_issue edges
  ├─ buildObjectiveDashboard → active_mission edges
  └─ loadAllEnginePanels → health + currentState
  │
  ├── executive-dashboard-integration (G4-05 spine)
  ├── cockpit-panel-views (engine health)
  ├── operational-command-view (certification blockers)
  └── objective-management-engine (missions)
```

### Interaction model

| Action | Behaviour |
|--------|-----------|
| Click engine node | Navigate to Engine Center route |
| Click upstream/downstream link | Navigate to related Engine Center |
| Click mission edge target | Navigate to `/cockpit/missions` |
| Click blocker edge | Navigate to alert href |

No force-directed layout or animations in G4-08 (static grid + edge lists).

---

## 2. Graph Model

```typescript
ExecutiveRelationshipGraphView {
  schemaVersion: "g4-08-v1"
  nodes: RelationshipGraphNode[]
  edges: RelationshipGraphEdge[]
  summary: { totalEngines, healthyEngines, enginesWithBlockers, activeMissionLinks, dependencyEdges }
  futureExpansion: { nodeKinds, edgeKinds, registrationPattern, notes }
}
```

**Node ID convention:** `engine:{engineId}` — future kinds use `{kind}:{id}` prefixes.

**Edge ID convention:** `dep-`, `feeds-`, `upstream-`, `downstream-`, `mission-`, `blocker-` prefixes.

---

## 3. Node Definitions

### V1 live nodes (9)

| Engine ID | Label | Route | Department |
|-----------|-------|-------|------------|
| `supplier` | Supplier Engine | `/cockpit/intelligence/suppliers` | Intelligence |
| `marketplace` | Marketplace Engine | `/cockpit/intelligence/marketplace` | Intelligence |
| `quantitative-intelligence` | Quantitative Intelligence | `/cockpit/intelligence/discovery` | Intelligence |
| `storefront` | Storefront Engine | `/cockpit/commerce/store` | Commerce |
| `advertising` | Advertising Engine | `/cockpit/commerce/marketing` | Commerce |
| `payment` | Payment Engine | `/cockpit/finance/billing` | Finance |
| `analytics` | Analytics Engine | `/cockpit/finance/profit` | Finance |
| `logistics` | Logistics Engine | `/cockpit/operations/fulfillment` | Operations |
| `pillow-supervisor` | Pillow Supervisor | `/cockpit/development/pillow` | Development |

### Per-node fields

| Field | Source |
|-------|--------|
| `health` | `EnginePanelView.health` |
| `currentState` | `EnginePanelView.currentState` |
| `dependencies` | `EnginePanelView.dependencies` |
| `upstream` | `V1_DEPENDENCY_EDGES` (incoming) |
| `downstream` | `V1_DEPENDENCY_EDGES` (outgoing) |
| `activeMissions` | OMS objectives matched by `MISSION_ENGINE_KEYWORDS` |
| `blockingIssues` | `buildExecutiveAlerts` filtered by `engineId` |

### Future node kinds (architecture only)

- `company`
- `brand`
- `product`
- `marketplace` (entity-level, distinct from engine)
- `supplier` (entity-level, distinct from engine)

No live nodes of these kinds in G4-08.

---

## 4. Relationship Definitions

| Edge kind | Meaning | V1 source |
|-----------|---------|-----------|
| `depends_on` | Architectural dependency (from → to) | `V1_DEPENDENCY_EDGES` |
| `feeds` | Data/output flow | Same spine, semantic alias |
| `upstream` | Upstream provider link | Same spine, navigable label |
| `downstream` | Downstream consumer link | Same spine, navigable label |
| `active_mission` | Engine ↔ OMS objective | `buildObjectiveDashboard` |
| `blocking_issue` | Blocker → affected engine | `buildExecutiveAlerts` |

### V1 dependency spine (12 edges)

```
supplier → logistics, marketplace
marketplace → storefront
storefront → advertising, payment
payment → analytics
logistics → analytics
advertising → analytics
quantitative-intelligence → supplier, marketplace
pillow-supervisor → supplier, marketplace
```

---

## 5. Engine Integration Map

| Brain module | Role in graph |
|--------------|---------------|
| `executive-relationship-graph` | Primary graph loader |
| `executive-home` | G4-05 dependency preview + link to full graph |
| `cockpit-engine` | Per-node detail when navigating to Engine Center |
| `cockpit-missions` | Mission edge targets |
| `cockpit-interaction` | Screen context for SCR-015 (Ask AI) |
| `cockpit-command` | Certification blockers → alerts |

---

## 6. Future Expansion

1. **New engines:** Append to `V1_ENGINE_IDS` (or parallel registry) — schema unchanged.
2. **Commercial entities:** Register as `company:`, `brand:`, `product:` nodes with cross-links to engines.
3. **Force-directed canvas:** Optional UX layer — data contract already supports nodes + typed edges.
4. **Proactive graph alerts:** GC-03 can push edge weight changes without redesign.
5. **Pillow governance edges:** `governs` edge kind reserved in `RelationshipEdgeKind`.

---

## 7. Files Delivered

| Layer | Path |
|-------|------|
| Backend service | `backend/src/domain/services/executive-relationship-graph.ts` |
| G4-05 exports | `backend/src/domain/services/executive-dashboard-integration.ts` |
| Brain tool | `backend/src/agents/tools/module-load-tools.ts` |
| Brain route | `backend/src/agents/routes/module-routes.ts` |
| Permissions | `backend/src/auth/permissions.ts` |
| Interaction registry | `backend/src/domain/services/cockpit-interaction-layer.ts` |
| Frontend page | `empireai-web/app/(cockpit)/cockpit/relationship/page.tsx` |
| Frontend component | `empireai-web/components/cockpit/widgets/ExecutiveRelationshipGraphPanel.tsx` |
| Hook | `empireai-web/lib/cockpit/hooks/useExecutiveRelationshipGraph.tsx` |
| Navigation | `empireai-web/lib/cockpit/navigation.ts` |
| Tests | `backend/src/validation/tests/executive-relationship-graph.test.ts` |

---

## 8. Verification

```bash
# Backend validation (slow — Brain aggregate loading)
cd backend
node --import tsx --test src/validation/tests/executive-relationship-graph.test.ts

# TypeScript
cd backend && npx tsc --noEmit
cd empireai-web && npx tsc --noEmit
```

**Manual:** Log in → Cockpit → **Relationship Graph** → click any engine node → Engine Center opens.

---

## 9. Screenshots

Not available in this audit (authentication required). Capture after deploy:

1. Full graph page with 9 engine nodes
2. Node click navigation to Supplier Engine Center
3. Executive Home dependency graph link to full graph
