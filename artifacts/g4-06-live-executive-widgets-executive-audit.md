# G4-06 — Live Executive Widgets · Executive Audit

**Mission:** G4-06 — Live Executive Widgets  
**Authority:** Grand King · GO-002 Phase 4 · G4-05B Authentication Verification prerequisite  
**Date:** 2026-07-02  
**Status:** **COMPLETE**  
**Scope:** Live widget wiring and contract enforcement only — no Cockpit UI redesign · no fake metrics

---

## Executive Summary

Executive Home now runs **10 priority live widgets** from a **single Brain aggregate** (`executive-home`) with **45-second auto-refresh**, explicit **live vs fallback contract**, and mounted **Executive Alerts** + **Executive Timeline** panels. Widgets show verified runtime data when available; otherwise **Status · Dependency · Next Action** — never fabricated metrics.

**Screenshots:** Not captured in this session (requires authenticated Cockpit session). Verify at `/cockpit` after login.

---

## 1. Widgets Completed

| Widget ID | Title | Card ID | Live | Data Mode | Component |
|-----------|-------|---------|------|-----------|-----------|
| G4-06-W01 | Empire Health | `empire-health` | ✅ | live | `ExecutiveLiveWidgetFrame` |
| G4-06-W02 | Marketplace Health | `marketplace-status` | ✅* | sandbox | `ExecutiveLiveWidgetFrame` |
| G4-06-W03 | Supplier Health | `supplier-status` | ✅* | sandbox | `ExecutiveLiveWidgetFrame` |
| G4-06-W04 | Revenue Summary | `revenue-today` | ✅ | sandbox/live† | `ExecutiveLiveWidgetFrame` |
| G4-06-W05 | Active Missions | `active-missions` | ✅ | live | `ExecutiveLiveWidgetFrame` |
| G4-06-W06 | Pillow Status | `pillow-status` | ✅ | sandbox | `ExecutiveLiveWidgetFrame` |
| G4-06-W07 | Executive Alerts | `executive-alerts` | ✅ | live | `ExecutiveLiveWidgetFrame` + `ExecutiveAlertsPanel` |
| G4-06-W08 | Pending King's Approval | `pending-kings-approval` | ✅ | live | `ExecutiveLiveWidgetFrame` |
| G4-06-W09 | Recent Executive Timeline | `executive-timeline` | ✅‡ | live/unavailable | `ExecutiveLiveWidgetFrame` + `ExecutiveTimelinePanel` |
| G4-06-W10 | AI Recommendation Summary | `ai-recommendations` | ✅ | sandbox | `ExecutiveLiveWidgetFrame` |

\* Engine panel runtime data; credentials not yet live in production.  
† `sandbox` until `LIVE_COMMERCE_INTEGRATION_MODE=production`; order ledger values still from domain store.  
‡ Card shows fallback when no timeline events; full panel lists `executiveTimeline` when populated.

### Supporting live chrome (G4-06)

| Component | Purpose |
|-----------|---------|
| `ExecutiveHomeProvider` | Single `executive-home` fetch · 45s auto-refresh |
| `ExecutiveHomeSyncBar` | Last Brain sync time · manual refresh |
| `ExecutiveAttentionStrip` | Live attention items from alerts |
| `ExecutiveNextActionStrip` | Live next executive action |
| `ExecutiveEngineHealthStrip` | Live V1 engine health row |

---

## 2. Brain Endpoints

| Endpoint | Module | Action | Returns |
|----------|--------|--------|---------|
| `POST /brain/dispatch` | `executive-home` | `load` | Full `ExecutiveHomeView` aggregate |

**Frontend BFF:** `POST /api/brain/dispatch` → Brain proxy with session cookie.

### Data sources per widget (backend)

| Widget | Brain field / loader |
|--------|---------------------|
| Empire Health | `buildEsisDashboard` · `command.operationalReadiness` · engine summaries |
| Marketplace Health | `loadEnginePanelView("marketplace")` |
| Supplier Health | `loadEnginePanelView("supplier")` |
| Revenue Summary | `loadOrdersView` · `loadFinanceView` · `command.proof001` |
| Active Missions | `buildObjectiveDashboard` · OMS reporting |
| Pillow Status | `loadPillowSupervisorView` |
| Executive Alerts | `buildExecutiveAlerts` · certification B5–B8 |
| Pending King's Approval | `command.pendingApprovals` · Pillow queue |
| Recent Executive Timeline | `buildGlobalExecutionTimeline` · `portfolio.recentActivity` · `buildExecutiveTimeline` |
| AI Recommendation Summary | `loadAiCeoView` · portfolio briefing (non-generative) |

---

## 3. Widget Contract (G4-06)

```
liveDataAvailable && primaryValue !== null
  → Show primaryValue + status + detail items + nextAction

Otherwise
  → Show Status
  → Show Dependency
  → Show Next Action
  → Never invent metrics
```

**Backend fields on each `ExecutiveSummaryCard`:**
- `widgetId`, `liveDataAvailable`, `dataMode`, `dataSource`, `refreshSeconds`, `futureEnhancement`

**Refresh behaviour:**
- Auto: every **45 seconds** via `ExecutiveHomeProvider`
- Manual: **Refresh now** on sync bar
- All widgets share one dispatch (no duplicate Brain calls on Executive Home)

---

## 4. Live vs Pending

| Widget | Status | Notes |
|--------|--------|-------|
| Empire Health | **Live** | ESIS + ops readiness from runtime inspection |
| Marketplace Health | **Live wiring · sandbox data** | Awaiting B6-01 Amazon SP-API credentials |
| Supplier Health | **Live wiring · sandbox data** | Awaiting B6-02 CJ credentials |
| Revenue Summary | **Live wiring** | Domain order ledger; production mode gates `live` badge |
| Active Missions | **Live** | OMS objective dashboard |
| Pillow Status | **Live wiring · sandbox** | Production mode flag not set |
| Executive Alerts | **Live** | Certification + engine failure routing |
| Pending King's Approval | **Live** | Decision + Pillow queues |
| Recent Executive Timeline | **Live when events exist** | Fallback when timeline empty |
| AI Recommendation Summary | **Live wiring · sandbox** | Repository briefing only — generative AI out of scope |

### Pending enhancements (documented per widget)

- GC-03 Notification Centre push for alerts
- Stripe webhook real-time revenue ticker
- Live SP-API / CJ health polling
- Pillow session SSE · council debate feed
- Generative AI CEO briefing (explicitly out of G4-06 scope)

---

## 5. Files Changed

| Layer | Path |
|-------|------|
| Backend cards | `backend/src/domain/services/cockpit-panel-views.ts` |
| Frontend types | `empireai-web/lib/cockpit/panel-types.ts` |
| Widget catalogue | `empireai-web/lib/cockpit/executive-widgets.ts` |
| Shared Brain context | `empireai-web/lib/cockpit/hooks/useExecutiveHome.tsx` |
| Widget frame | `empireai-web/components/cockpit/widgets/ExecutiveLiveWidgetFrame.tsx` |
| Priority grid | `empireai-web/components/cockpit/widgets/ExecutiveSummaryCards.tsx` |
| Executive Home page | `empireai-web/components/cockpit/pages/ExecutiveHomePage.tsx` |
| Integration panels | `empireai-web/components/cockpit/widgets/ExecutiveDashboardIntegration.tsx` |
| Widget registry | `empireai-web/lib/cockpit/widgets/registry.ts` |
| Tests | `backend/src/validation/tests/executive-live-widgets.test.ts` |

---

## 6. Validation

| Check | Result |
|-------|--------|
| Backend TypeScript | Pass |
| Frontend TypeScript | Pass |
| G4-06 widget contract tests | 2/2 pass |
| Fake metrics generated | None |
| UI redesign | None |

---

## 7. Executive Recommendation

Executive Home should now **feel alive**: Brain sync bar, auto-refresh, 10 named priority widgets, and expanded alerts/timeline panels — all from one authenticated dispatch. Deploy with G4-05A/B auth changes, then verify as Grand King at `/cockpit`.

**Mission G4-06:** **COMPLETE**
