# G4-07 — AI Interaction Layer · Executive Audit

**Mission:** G4-07 — AI Interaction Layer  
**Authority:** Grand King · GO-002 Phase 4 · G4-06 Live Executive Widgets prerequisite  
**Date:** 2026-07-02  
**Status:** **COMPLETE**  
**Scope:** Interaction framework design and wiring only — **no LLM business logic**

---

## Executive Summary

The Cockpit now has an **AI Interaction Layer** — a structured bridge between Grand King, Pillow Supervisor, Executive AI Engines, Brain, and Cockpit UI. Every Cockpit page supports contextual AI interaction via a global drawer, explain affordances on widgets, and a five-field insight contract on every Engine Center.

**Design principle:** Insights are assembled from **existing Brain aggregates** (executive-home, cockpit-engine, OMS, certification register). No generative LLM reasoning was added in G4-07.

**Screenshots:** Not captured (requires authenticated session). Verify via **Ask AI** in Cockpit top bar.

---

## 1. Architecture

```
Grand King (Cockpit UI)
  │
  ├─ CockpitInteractionProvider (pathname-aware)
  │     ├─ CockpitTopBar: "Ask AI" · "Next action"
  │     ├─ CockpitExplainButton (widgets · alerts)
  │     └─ CockpitInteractionDrawer (global)
  │
  ▼
POST /api/brain/dispatch
  module: cockpit-interaction
  actions: context | explain | recommend
  │
  ▼
Brain module-load-tools
  cockpit_interaction.load_context
  cockpit_interaction.explain
  cockpit_interaction.recommend
  │
  ▼
cockpit-interaction-layer.ts
  ├─ resolveCockpitScreenContext()
  ├─ buildEngineAiInsight()      ← engine panels
  ├─ loadCockpitInteractionContext()
  └─ handleCockpitInteraction()  ← intent routing
  │
  ├── executive-home aggregate
  ├── cockpit-engine / EngineCenterView
  ├── OMS · certification · alerts
  └── (future) Pillow NL · global-assistant bridge
```

### Bridge targets (extensible)

| Target | Module | G4-07 status |
|--------|--------|--------------|
| EmpireAI Brain | `brain/dispatch` | ✅ Wired |
| Executive Home | `executive-home` | ✅ Data source |
| Engine Centers | `cockpit-engine` | ✅ Data source + aiInsight |
| Pillow Supervisor | `cockpit-pillow` | 🔜 Future NL channel |
| Global Assistant (GC-05) | `/global-assistant/*` | 🔜 Future BFF bridge |

---

## 2. Brain Interaction Flow

### Load page context

```http
POST /api/brain/dispatch
{
  "module": "cockpit-interaction",
  "action": "context",
  "payload": { "screenPath": "/cockpit/intelligence/suppliers" }
}
```

**Returns:** `CockpitInteractionContext` — screen metadata, page insight, suggested prompts, bridge targets.

### Explain intent

```http
POST /api/brain/dispatch
{
  "module": "cockpit-interaction",
  "action": "explain",
  "payload": {
    "intent": "explain_panel",
    "screenPath": "/cockpit",
    "targetId": "marketplace-status",
    "label": "Marketplace Health"
  }
}
```

**Returns:** `CockpitInteractionResponse` — summary, `AiInsightContract`, follow-up suggestions.

### Recommend next action

```http
POST /api/brain/dispatch
{
  "module": "cockpit-interaction",
  "action": "recommend",
  "payload": { "screenPath": "/cockpit" }
}
```

**Returns:** OMS-driven next executive action with evidence from summary cards.

---

## 3. AI Interaction Contracts

### AiInsightContract (five fields — every Engine Center)

| Field | Description |
|-------|-------------|
| **currentInsight** | Runtime state summary from Brain |
| **recommendedAction** | Next action from engine panel / OMS |
| **confidence** | `high` · `medium` · `low` · `unavailable` |
| **reasoningSource** | Data lineage (e.g. `supplier engine panel · sandbox mode`) |
| **supportingEvidence** | Metrics, dependencies, detail rows — no fabrication |

Additional metadata: `confidenceScore`, `computedAt`, `interactionChannel`, `futureCapabilities`.

### CockpitInteractionIntent (extensible)

| Intent | Example prompt |
|--------|----------------|
| `explain_panel` | "Explain this panel" |
| `explain_alert` | "Why is this alert shown?" |
| `explain_metric` | "Why is revenue declining?" |
| `recommend_next_action` | "Recommend next action" |
| `explain_engine_health` | "Explain supplier health" |

### Fallback contract (unchanged from G4-06)

When live data unavailable → Status · Dependency · Next Action (never fake metrics).

---

## 4. Engine Integration Map

| Engine Center | Route | aiInsight source | Bound module |
|---------------|-------|------------------|--------------|
| Supplier | `/cockpit/intelligence/suppliers` | Supplier engine panel | `cockpit-engine` |
| Marketplace | `/cockpit/intelligence/marketplace` | Marketplace engine panel | `cockpit-engine` |
| Quantitative Intel | `/cockpit/intelligence/discovery` | QI engine panel | `cockpit-engine` |
| Storefront | `/cockpit/commerce/store` | Storefront engine panel | `cockpit-engine` |
| Advertising | `/cockpit/commerce/marketing` | Advertising engine panel | `cockpit-engine` |
| Payment | `/cockpit/finance/billing` | Payment engine panel | `cockpit-engine` |
| Analytics | `/cockpit/finance/profit` | Analytics engine panel | `cockpit-engine` |
| Logistics | `/cockpit/operations/fulfillment` | Logistics engine panel | `cockpit-engine` |
| Pillow Supervisor | `/cockpit/development/pillow` | Pillow supervisor panel | `cockpit-engine` + `cockpit-pillow` |

**Executive Home widgets** resolve via `executive-home.summaryCards` and `executiveAlerts`.

---

## 5. UI Integration (no redesign)

| Surface | Component | Interaction |
|---------|-----------|-------------|
| Global shell | `CockpitInteractionProvider` + `CockpitInteractionDrawer` | All pages |
| Top bar | `CockpitTopBar` | Ask AI · Next action |
| Executive widgets | `CockpitExplainButton` on `ExecutiveLiveWidgetFrame` | Per-card explain |
| Attention strip | Explain on each attention item | Alert explain |
| Engine Centers | `EngineCenterAiInsightPanel` | Five-field insight block |

---

## 6. Future Expansion

| Capability | Channel | Status |
|------------|---------|--------|
| Natural language | Pillow `/api/pillow/chat` | Architecture slot — not G4-07 |
| Voice interaction | TBD input adapter on `CockpitInteractionProvider` | Planned |
| Proactive recommendations | GC-03 Notification Centre push | Planned |
| Global Assistant bridge | `/global-assistant/why` BFF proxy | Planned |
| Generative reasoning | Pillow NL + LLMRouter | **Explicitly out of scope** |

---

## 7. Files

| Layer | Path |
|-------|------|
| Interaction service | `backend/src/domain/services/cockpit-interaction-layer.ts` |
| Engine aiInsight | `backend/src/domain/services/engine-center-views.ts` |
| Brain tools | `backend/src/agents/tools/module-load-tools.ts` |
| Module routes | `backend/src/agents/routes/module-routes.ts` |
| Permissions | `backend/src/auth/permissions.ts` |
| Frontend provider | `empireai-web/lib/cockpit/interaction/CockpitInteractionProvider.tsx` |
| Frontend drawer | `empireai-web/components/cockpit/interaction/CockpitInteractionDrawer.tsx` |
| Shell wiring | `empireai-web/components/cockpit/shell/CockpitShell.tsx` |
| Tests | `backend/src/validation/tests/cockpit-interaction-layer.test.ts` |

---

## 8. Validation

| Check | Result |
|-------|--------|
| Backend TypeScript | Pass |
| Frontend TypeScript | Pass |
| G4-07 interaction tests | 5 tests |
| Engine Center aiInsight | 9/9 centers |
| LLM business logic added | None |

---

**Mission G4-07:** **COMPLETE**
