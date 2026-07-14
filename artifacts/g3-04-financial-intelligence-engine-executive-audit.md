# G3-04 — Financial Intelligence Engine · Executive Audit

**Mission:** G3-04 — Financial Intelligence Engine  
**Authority:** Grand King · G3-01 · G3-02 · G3-03 complete  
**Date:** 2026-06-21  
**Status:** **COMPLETE**  
**Scope:** Architecture only — **no live accounting integrations** · **G3-05 not started**

---

## Executive Summary

EmpireAI's fourth **Executive AI Engine** — the **Financial Intelligence Engine** — is architecturally defined and wired into Brain, Cockpit, and the RegistryLoader discovery plane. The engine models revenue, cost, margin, cash flow, pricing, break-even, ROI, and profit forecasts for registry-discovered financial scenarios, exposing a seven-field analysis contract for every analysed scenario.

**Design principle:** G3-04 discovers revenue channels and payment providers dynamically through RegistryLoader. The engine contains **no hardcoded** marketplace, payment, or accounting assumptions.

**Cockpit route:** `/cockpit/finance/intelligence` (SCR-105)  
**Brain module:** `financial-intelligence-engine`  
**Artifact ref:** Set on `loadFinancialIntelligenceEnginePanel().executiveAudit.artifactRef`

---

## 1. Architecture

```
Grand King (Cockpit SCR-105)
  │
  ├─ financial-intelligence-engine.load → compact engine panel
  └─ financial-intelligence-engine.architecture → full G3-04 engine view
  │
  ▼
Financial Intelligence Engine (G3-04)
  │
  ├─ RegistryLoader → revenue channels + payment providers + pricing policy
  ├─ Finance domain store + PIE margin signals
  ├─ Deterministic financial modelling (no live accounting APIs)
  └─ Analysis Contract — seven-field executive output
  │
  ▼
Integrated Executive AI Engines
  Payment · Analytics · QIE · Advertising
```

### Layer separation

| Layer | Responsibility | G3-04 status |
|-------|----------------|--------------|
| **G3-04 architecture** | Capabilities, integrations, discovery, analysis contract | ✅ Defined |
| **RegistryLoader (EA-003)** | Revenue channels, payment catalog, pricing policy | ✅ Consumed |
| **Finance domain store** | COGS, ad spend, portfolio revenue | ✅ Consumed |
| **PIE (G3-01)** | Product margin score aggregates | ✅ Consumed |
| **Live accounting APIs** | QuickBooks, Xero, live treasury | **Deferred** |

---

## 2. Engine Components

### Core capabilities (8)

| # | Capability | Status | Data mode |
|---|------------|--------|-----------|
| 1 | Revenue modelling | Partial | Registry + country intel |
| 2 | Cost modelling | Partial | Finance domain store |
| 3 | Margin modelling | Partial | Finance + PIE aggregates |
| 4 | Cash flow modelling | Architecture | Finance view proxy |
| 5 | Pricing analysis | Partial | REG-PRICING-POLICY + PIE |
| 6 | Break-even analysis | Architecture | Deterministic model |
| 7 | ROI analysis | Partial | Profit / ad spend proxy |
| 8 | Profit forecasting | Partial | Composite projection |

### Dynamic financial discovery

| Discovery source | Registry | Engine usage |
|------------------|----------|--------------|
| Revenue channels | DERIVED-DISCOVERY-SNAPSHOT (marketplace/storefront) | Per-channel financial scenarios |
| Payment providers | Platform catalog (`loadPaymentCatalogRows`) | Fee and billing path signals |
| Pricing policy | REG-PRICING-POLICY | Architecture pricing overlay |
| Workspace portfolio | Domain store | Workspace summary scenario |

**No engine constants** for payment provider names or revenue channel lists.

### Brain module contract

| Capability | Purpose |
|------------|---------|
| `financial-intelligence.architecture` | Return G3-04 architecture document |
| `financial-intelligence.analyse` | Full scenario analysis with contracts |
| `financial-intelligence.rank` | Ranked scenarios; optional `scenarioId` filter |
| `financial-intelligence.forecast` | Profit forecast view (same engine view) |

---

## 3. Data Flow

```
1. Discovery
   RegistryLoader → revenue channels + payment providers + pricing policy

2. Domain signals
   Finance view + PIE catalog → cost, margin, pricing inputs

3. Modelling
   Discovery + signals → FinancialIntelligenceAnalysisContract

4. Executive output
   Analysis contract → Cockpit SCR-105 · Analytics · QIE

5. Engine integration
   Financial rankings → Payment · Ads · Analytics
```

### Seven-field financial analysis contract

Every analysed scenario exposes:

| Field | Source |
|-------|--------|
| **Financial Score** | Composite: revenue, margin, profit, ROI, cash flow |
| **Profit Projection** | Forward profit score from margin and revenue signals |
| **Margin Projection** | Net margin from finance store + PIE margin aggregate |
| **ROI** | Return on ad spend / investment proxy |
| **Confidence** | Seed data, channel status, product catalog depth |
| **Supporting Evidence** | Registry, finance, PIE, model dimensions |
| **Recommended Action** | INVEST / HOLD / REDUCE / REVIEW narrative + next step |

---

## 4. Integration Map

| Engine | Relationship | Cockpit route | Brain module |
|--------|--------------|---------------|--------------|
| **Payment Engine** | Feeds registry payment providers and billing readiness | `/cockpit/finance/billing` | `cockpit-engine` |
| **Analytics Engine** | Reports order profit and revenue telemetry | `/cockpit/finance/profit` | `cockpit-engine` |
| **Quantitative Intelligence Engine** | Consumes financial scores for discovery board | `/cockpit/intelligence/discovery` | `cockpit-engine` |
| **Advertising Engine** | Validates ad spend ROI feasibility | `/cockpit/commerce/marketing` | `cockpit-engine` |

---

## 5. EC Compliance (EA-007)

| Constraint | G3-04 compliance |
|------------|-------------------|
| **EC-1** No new business hardcodes in intelligence engines | ✅ Scenarios from RegistryLoader discovery |
| **EC-2** RegistryLoader discovery entry point | ✅ `buildFinancialIntelligenceDiscoveryView()` |
| **EC-3** Registry append model | ✅ Append payment/marketplace rows without code change |
| **No live APIs** | ✅ Architecture + domain store only |
| **EA architecture frozen** | ✅ Minimal catalog source extension only |

---

## 6. Files Delivered

| Layer | Path |
|-------|------|
| Architecture types + modelling | `backend/src/intelligence/financial-intelligence-engine/engine-architecture.ts` |
| Brain module contract | `backend/src/intelligence/financial-intelligence-engine/module-contract.ts` |
| Module index | `backend/src/intelligence/financial-intelligence-engine/index.ts` |
| Payment catalog loader | `backend/src/registry/sources/platform-catalog-source.ts` (extended) |
| Cockpit view loader | `backend/src/domain/services/financial-intelligence-engine-views.ts` |
| Panel wiring | `cockpit-panel-views.ts` (updated) |
| Brain capabilities | `capabilities.ts` (extended) |
| Brain tools | `financial_intelligence_engine.load_view`, `load_panel` |
| Brain route | `financial-intelligence-engine` module |
| Permissions | `auth/permissions.ts` |
| Interaction registry | `cockpit-interaction-layer.ts` SCR-105 |
| Cockpit nav + page | `navigation.ts`, `finance/intelligence/page.tsx` |
| Tests | `g3-04-financial-intelligence-engine.test.ts` |

---

## 7. Brain Dispatch

### Load compact Cockpit panel

```http
POST /api/brain/dispatch
{
  "module": "financial-intelligence-engine",
  "action": "load"
}
```

### Load full engine view

```http
POST /api/brain/dispatch
{
  "module": "financial-intelligence-engine",
  "action": "architecture"
}
```

---

## 8. Verification

```bash
cd backend
node --import tsx --test src/validation/tests/g3-04-financial-intelligence-engine.test.ts
```

**Manual:** Log in → Finance → Financial Intel → verify Financial Intelligence Engine panel shows registry-derived scenarios with financial score, margin, ROI, and G3-04 dependencies.

---

## 9. Mission Gate

**G3-04 complete.** Architecture defined and wired. No live accounting integrations connected.  
**G3-05 not started** per mission directive.

---

## 10. Future Expansion

| Item | Gate |
|------|------|
| Live accounting / QuickBooks / Xero | Explicit integration mission |
| Treasury and cash flow live feeds | Payment Engine live activation |
| REG-PAYMENT dedicated registry tier | EA-008+ |
| Generative financial briefs | Out of G3-04 scope |
