# G4-09 — Global AI Assistant · Executive Audit

**Mission:** G4-09 — Global AI Assistant  
**Authority:** Grand King · GO-002 Phase 4 · G4-07 AI Interaction Layer prerequisite  
**Date:** 2026-07-02  
**Status:** **COMPLETE**  
**Scope:** Assistant framework only — **no LLM business reasoning**

---

## Executive Summary

The Cockpit now has a **Global AI Assistant** — a persistent companion that follows the Grand King across every Cockpit page. It automatically assembles page, engine, mission, and alert context without the King needing to explain where they are. All actions delegate to the **G4-07 AI Interaction Layer** — no business logic was duplicated.

**Design principle:** G4-09 is an orchestration and presentation layer. Reasoning remains in `cockpit-interaction-layer.ts` via `handleCockpitInteraction()`.

**UI:** Floating **AI Assistant** chip (bottom-right) expands to full panel on any Cockpit route.  
**Screenshots:** Not captured (requires authenticated session).

---

## 1. Architecture

```
Grand King (any Cockpit page)
  │
  ├─ GlobalAiAssistantPanel (persistent · collapsible)
  │     ├─ Auto context header (page · engine · missions · alerts)
  │     ├─ Ask · Explain · Recommend · Summarise · Next Action
  │     └─ Five-field response contract
  │
  ▼
GlobalAiAssistantProvider (pathname-aware)
  │
  ▼
POST /api/brain/dispatch
  module: cockpit-global-assistant
  actions: context | ask
  │
  ▼
cockpit-global-assistant.ts (G4-09 orchestration)
  ├─ buildExecutiveContext()     ← page · engine · OMS · alerts
  ├─ loadCockpitInteractionContext()  ← G4-07 (no duplicate)
  └─ handleCockpitInteraction()    ← G4-07 (all actions except summarise assembly)
  │
  ▼
cockpit-interaction-layer.ts (G4-07 — single source of truth)
```

### Layer separation

| Layer | Responsibility |
|-------|----------------|
| **G4-09** | Persistent UI, executive context assembly, action routing, response normalisation |
| **G4-07** | Brain aggregates, intent handling, insight contracts |
| **GC-05 legacy** | `backend/src/global-assistant/` HTTP routes for legacy frontend — not duplicated |

---

## 2. Context Model

```typescript
GlobalAssistantContext {
  schemaVersion: "g4-09-v1"
  executiveContext: {
    screenPath, screenId, screenTitle, department
    engineCenterId, engineCenterName
    activeMissionCount, topMissionTitle
    alertCount, topAlertLabel
    nextExecutiveAction
    contextSummary          // auto-assembled one-liner
  }
  availableActions: ["ask", "explain", "recommend", "summarise", "next_action"]
  pageInsightSummary        // from G4-07 loadCockpitInteractionContext
  bridgeTargets             // from G4-07
  futureChannels            // voice · walkthrough · Pillow · LLM
}
```

### Auto-awareness (no King input required)

| Signal | Source |
|--------|--------|
| Current Cockpit page | `resolveCockpitScreenContext(screenPath)` |
| Current Engine Center | `resolveEngineCenterFromPath(screenPath)` |
| Active missions | `buildObjectiveDashboard()` |
| Current alerts | `loadExecutiveHomeView().executiveAlerts` |
| Executive context | `loadExecutiveHomeView().nextExecutiveAction` |

Context refreshes on every pathname change.

---

## 3. Interaction Flow

### Load context (automatic on navigation)

```http
POST /api/brain/dispatch
{
  "module": "cockpit-global-assistant",
  "action": "context",
  "payload": { "screenPath": "/cockpit/intelligence/suppliers" }
}
```

### Execute action

```http
POST /api/brain/dispatch
{
  "module": "cockpit-global-assistant",
  "action": "ask",
  "payload": {
    "action": "summarise",
    "screenPath": "/cockpit/intelligence/suppliers"
  }
}
```

### Action → G4-07 delegation map

| G4-09 Action | G4-07 Intent | Notes |
|--------------|--------------|-------|
| `ask` | Keyword-routed intent | alert → `explain_alert`, health → `explain_engine_health`, etc. |
| `explain` | `explain_panel` / `explain_alert` | Target-aware |
| `recommend` | `recommend_next_action` | Direct delegation |
| `summarise` | Composed from G4-07 context + executive home | Assembly only — no new reasoning |
| `next_action` | `recommend_next_action` | Alias |

---

## 4. Response Contract

Every assistant response includes:

| Field | Source |
|-------|--------|
| **Current Context** | `executiveContext.contextSummary` |
| **Reason** | `interaction.insight.reasoningSource` (G4-07) |
| **Supporting Evidence** | `interaction.insight.supportingEvidence` (G4-07) |
| **Recommended Next Action** | `interaction.insight.recommendedAction` (G4-07) |

Additional trace fields: `interactionIntent`, `interactionSummary`, `confidence`, `suggestedFollowUps`.

---

## 5. Integration Map

| Component | Integration |
|-----------|-------------|
| `CockpitShell` | Wraps `GlobalAiAssistantProvider` + mounts `GlobalAiAssistantPanel` |
| `CockpitTopBar` | Ask AI · Summarise · Next action → global assistant |
| `CockpitExplainButton` | Widget Explain → `globalAssistant.explain()` |
| `CockpitInteractionDrawer` | G4-07 drawer retained for backward compatibility |
| `cockpit-interaction` module | All non-summarise actions delegate here |
| `executive-home` | Mission/alert/next-action context |
| `cockpit-engine` | Engine Center page insight via G4-07 |
| Legacy `global-assistant/` | Future BFF bridge — not wired in G4-09 |

---

## 6. Future Expansion (architecture only)

| Channel | Status |
|---------|--------|
| Voice conversation | Slot in `futureChannels`; no audio pipeline |
| Screen awareness (DOM) | Reserved — context model extensible with `screenElements[]` |
| Live walkthroughs | Reserved — step graph can attach to `GlobalAssistantResponse` |
| Pillow collaboration | Bridge target `cockpit-pillow` already in G4-07 |
| Quantitative Intelligence Engine | Engine path auto-detected via `resolveEngineCenterFromPath` |
| External LLM providers | Adapter slot after G4-07 insight assembly — not in G4-09 scope |

---

## 7. Files Delivered

| Layer | Path |
|-------|------|
| Backend service | `backend/src/domain/services/cockpit-global-assistant.ts` |
| Brain tools | `backend/src/agents/tools/module-load-tools.ts` |
| Brain routes | `backend/src/agents/routes/module-routes.ts` |
| Permissions | `backend/src/auth/permissions.ts` |
| Provider | `empireai-web/lib/cockpit/global-assistant/GlobalAiAssistantProvider.tsx` |
| Panel | `empireai-web/components/cockpit/global-assistant/GlobalAiAssistantPanel.tsx` |
| Types | `empireai-web/lib/cockpit/global-assistant/types.ts` |
| Shell wiring | `empireai-web/components/cockpit/shell/CockpitShell.tsx` |
| Top bar | `empireai-web/components/cockpit/shell/CockpitTopBar.tsx` |
| Tests | `backend/src/validation/tests/cockpit-global-assistant.test.ts` |

---

## 8. Verification

```bash
cd backend
node --import tsx --test src/validation/tests/cockpit-global-assistant.test.ts
```

**Manual:** Log in → any Cockpit page → click **AI Assistant** chip → verify auto context header → **Summarise** → five-field response → navigate to Engine Center → context updates automatically.

---

## 9. Screenshots

Not available (authentication required). Capture after deploy:

1. Collapsed AI Assistant chip with alert badge
2. Expanded panel on Supplier Engine Center with auto context
3. Summarise response showing five-field contract
