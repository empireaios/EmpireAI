# G3-02 — Market Intelligence Engine · Executive Audit

**Mission:** G3-02 — Market Intelligence Engine  
**Authority:** Grand King · EA-007 certification · G3-01 complete  
**Date:** 2026-06-21  
**Status:** **COMPLETE**  
**Scope:** Architecture only — **no live API connections** · **G3-03 not started**

---

## Executive Summary

EmpireAI's second **Executive AI Engine** — the **Market Intelligence Engine** — is architecturally defined and wired into Brain, Cockpit, and the RegistryLoader discovery plane. The engine analyses **markets** (countries and registry-discovered channels), not individual products, exposing an eight-field analysis contract for every supported market.

**Design principle:** G3-02 discovers all markets dynamically through `RegistryLoader → DERIVED-DISCOVERY-SNAPSHOT`. The engine contains **no hardcoded** marketplace, country, supplier, or channel assumptions.

**Cockpit route:** `/cockpit/intelligence/markets` (SCR-104)  
**Brain module:** `market-intelligence-engine`  
**Artifact ref:** Set on `loadMarketIntelligenceEnginePanel().executiveAudit.artifactRef`

---

## 1. Architecture

```
Grand King (Cockpit SCR-104)
  │
  ├─ market-intelligence-engine.load → compact engine panel
  └─ market-intelligence-engine.architecture → full G3-02 engine view
  │
  ▼
Market Intelligence Engine (G3-02)
  │
  ├─ RegistryLoader → DERIVED-DISCOVERY-SNAPSHOT
  ├─ Country Intelligence Engine (dimension overlay)
  ├─ Seasonal opportunity curve (deterministic, no live APIs)
  ├─ Channel + country market scoring
  └─ Analysis Contract — eight-field executive output
  │
  ▼
Integrated Executive AI Engines
  Product Intelligence · Marketplace · QIE · Advertising · Analytics
```

### Layer separation

| Layer | Responsibility | G3-02 status |
|-------|----------------|--------------|
| **G3-02 architecture** | Capabilities, integrations, discovery, analysis contract | ✅ Defined |
| **RegistryLoader (EA-003)** | Dynamic market universe | ✅ Consumed |
| **Country Intelligence (B-011)** | Per-country dimension overlay | ✅ Consumed |
| **PIE (G3-01)** | Category trend signal feed | Architecture slot |
| **Live marketplace APIs** | Demand, listing, ad telemetry | **Deferred** |

---

## 2. Engine Components

### Core capabilities (10)

| # | Capability | Status | Data mode |
|---|------------|--------|-----------|
| 1 | Market demand analysis | Partial | Registry + country intel |
| 2 | Category trend analysis | Architecture | PIE catalog aggregates |
| 3 | Seasonal opportunity analysis | Partial | Deterministic seasonal curve |
| 4 | Country opportunity analysis | Live | Registry-discovered countries |
| 5 | Marketplace comparison | Partial | Ranked comparison board |
| 6 | Competition density | Partial | Competition intensity + marketplace count |
| 7 | Category saturation | Partial | Marketplace density + maturity |
| 8 | Growth prediction | Partial | Growth + seasonal + emerging uplift |
| 9 | Market risk assessment | Live | Regulatory, tax, language, cross-border |
| 10 | Executive recommendations | Live | ENTER / WATCH / AVOID / EXPAND |

### Dynamic market discovery

All supported markets are discovered at runtime:

| Discovery source | Registry | Engine usage |
|------------------|----------|--------------|
| Countries | `REG-COUNTRY` via snapshot | Country opportunity markets |
| Deployment channels | `REG-CHANNEL` via snapshot | Channel markets |
| Expansion marketplaces | `REG-MARKETPLACE` minus deployed | Future expansion signals |
| Intelligence sources | Derived from channel profiles | Channel scoring inputs |

**No engine constants** for marketplace names, country lists, or supplier identities.

### Brain module contract

| Capability | Purpose |
|------------|---------|
| `market-intelligence.architecture` | Return G3-02 architecture document |
| `market-intelligence.analyse` | Full market analysis with contracts |
| `market-intelligence.rank` | Ranked markets; optional `marketId` filter |
| `market-intelligence.compare` | Marketplace comparison board |

---

## 3. Data Flow

```
1. Discovery
   RegistryLoader → DERIVED-DISCOVERY-SNAPSHOT → countries + channels + expansion

2. Intelligence overlay
   Country Intelligence Engine → maturity, growth, competition, saturation, risk

3. Market scoring
   Discovery + dimensions + seasonal curve → MarketIntelligenceAnalysisContract

4. Comparison
   Scored markets → marketplaceComparison ranked board

5. Executive output
   Analysis contract → Cockpit SCR-104 · QIE · Global Assistant

6. Engine integration
   Market rankings → PIE · Marketplace · Ads · Analytics
```

### Eight-field market analysis contract

Every analysed market exposes:

| Field | Source |
|-------|--------|
| **Opportunity Score** | Composite: demand, growth, competition, saturation, risk |
| **Growth Score** | Country growth + seasonal modifier + emerging uplift |
| **Competition Score** | Empire-friendly (100 − competition intensity − density penalty) |
| **Saturation Score** | Marketplace density + market maturity proxy |
| **Risk Score** | Regulatory, tax, language, cross-border composite |
| **Confidence** | Seed vs registry fallback + channel status + marketplace count |
| **Supporting Evidence** | Registry status, country dimensions, seasonal modifier |
| **Recommended Action** | ENTER / WATCH / AVOID / EXPAND narrative + next step |

---

## 4. Integration Map

| Engine | Relationship | Cockpit route | Brain module |
|--------|--------------|---------------|--------------|
| **Product Intelligence Engine** | Feeds category trend signals from PIE catalog | `/cockpit/intelligence/products` | `product-intelligence-engine` |
| **Marketplace Engine** | Feeds registry channel profiles and launch readiness | `/cockpit/intelligence/marketplace` | `cockpit-engine` |
| **Quantitative Intelligence Engine** | Consumes market opportunity scores | `/cockpit/intelligence/discovery` | `cockpit-engine` |
| **Advertising Engine** | Validates ad spend feasibility for priority markets | `/cockpit/commerce/marketing` | `cockpit-engine` |
| **Analytics Engine** | Reports revenue telemetry for launched channels | `/cockpit/finance/profit` | `cockpit-engine` |

---

## 5. EC Compliance (EA-007)

| Constraint | G3-02 compliance |
|------------|-------------------|
| **EC-1** No new business hardcodes in intelligence engines | ✅ Markets discovered via RegistryLoader only |
| **EC-2** Use `buildMarketIntelligenceDiscoveryView()` | ✅ Entry point in `engine-architecture.ts` |
| **EC-3** Registry append model for new markets | ✅ Expansion marketplaces from registry diff |
| **No live APIs** | ✅ Architecture + country seed overlay only |
| **EA architecture frozen** | ✅ No EA-001–007 changes |

---

## 6. Files Delivered

| Layer | Path |
|-------|------|
| Architecture types + scoring | `backend/src/intelligence/market-intelligence-engine/engine-architecture.ts` |
| Brain module contract | `backend/src/intelligence/market-intelligence-engine/module-contract.ts` |
| Module index | `backend/src/intelligence/market-intelligence-engine/index.ts` |
| Cockpit view loader | `backend/src/domain/services/market-intelligence-engine-views.ts` |
| Panel wiring | `backend/src/domain/services/cockpit-panel-views.ts` (updated) |
| Brain capabilities | `backend/src/brain/contract/capabilities.ts` (extended) |
| Brain tools | `market_intelligence_engine.load_view`, `market_intelligence_engine.load_panel` |
| Brain route | `market-intelligence-engine` module |
| Permissions | `backend/src/auth/permissions.ts` |
| Interaction registry | `cockpit-interaction-layer.ts` SCR-104 |
| Cockpit nav + page | `empireai-web/lib/cockpit/navigation.ts`, `app/(cockpit)/cockpit/intelligence/markets/page.tsx` |
| Tests | `backend/src/validation/tests/g3-02-market-intelligence-engine.test.ts` |

---

## 7. Brain Dispatch

### Load compact Cockpit panel

```http
POST /api/brain/dispatch
{
  "module": "market-intelligence-engine",
  "action": "load"
}
```

### Load full engine view

```http
POST /api/brain/dispatch
{
  "module": "market-intelligence-engine",
  "action": "architecture"
}
```

---

## 8. Verification

```bash
cd backend
node --import tsx --test src/validation/tests/g3-02-market-intelligence-engine.test.ts
```

**Manual:** Log in → Intelligence → Markets → verify Market Intelligence Engine panel shows registry-derived markets with opportunity/growth/risk scores and G3-02 dependencies.

---

## 9. Mission Gate

**G3-02 complete.** Architecture defined and wired. No live APIs connected.  
**G3-03 not started** per mission directive.

---

## 10. Future Expansion

| Item | Gate |
|------|------|
| PIE category trend time-series fusion | REAL-013 |
| Live marketplace demand signals | Channel launch readiness activation |
| Country intelligence seed via REG-COUNTRY append | EA-008+ registry migration |
| Generative market briefs / LLM reasoning | Out of G3-02 scope |
| Promote to Engine Center (8-section) | Explicit Grand King decision |
