# G3-01 — Product Intelligence Engine · Executive Audit

**Mission:** G3-01 — Product Intelligence Engine  
**Authority:** Grand King · GO-002 · G4 Cockpit foundation complete  
**Date:** 2026-07-02  
**Status:** **COMPLETE**  
**Scope:** Architecture only — **no live API connections** · **G3-02 not started**

---

## Executive Summary

EmpireAI's first **Executive AI Engine** — the **Product Intelligence Engine** — is architecturally defined and wired into Brain, Cockpit, and the existing PIE domain store. The engine discovers, scores, ranks, and monitors products across Version 1 intelligence sources, exposing a seven-field analysis contract for every analysed product.

**Design principle:** G3-01 extends Mission 005 PIE (`evaluateProduct`, catalog repository, mock connectors) without duplicating scoring logic or connecting live marketplace APIs.

**Cockpit route:** `/cockpit/intelligence/products` (SCR-100)  
**Brain module:** `product-intelligence-engine`  
**Artifact ref:** Set on `loadIntelligenceEnginePanel().executiveAudit.artifactRef`

---

## 1. Architecture

```
Grand King (Cockpit SCR-100)
  │
  ├─ cockpit-intelligence.load_view → compact engine panel
  └─ product-intelligence-engine.load → full G3-01 engine view
  │
  ▼
Product Intelligence Engine (G3-01)
  │
  ├─ V1 Source Registry (CJ · Amazon US/SG · Shopee SG · Shopify future)
  ├─ Connector Signal Plane (mock/architecture — no live APIs)
  ├─ PIE evaluateProduct() — dimension scoring
  ├─ product_intelligence_catalog — persistence
  └─ Analysis Contract — seven-field executive output
  │
  ▼
Integrated Executive AI Engines
  Supplier · Marketplace · QIE · Advertising · Analytics
```

### Layer separation

| Layer | Responsibility | G3-01 status |
|-------|----------------|--------------|
| **G3-01 architecture** | Source registry, capabilities, integrations, analysis contract | ✅ Defined |
| **PIE (Mission 005)** | Scoring, SELL/REVIEW/DO_NOT_SELL | ✅ Reused |
| **Connectors (Mission 012)** | Mock signal plane | ✅ Architecture slot |
| **Empire Product Scoring (020)** | Parallel empireScore pipeline | Documented — not merged |
| **Live PIE (REAL-128)** | Live connector swap | **Deferred** |

---

## 2. Engine Components

### Core capabilities (10)

| # | Capability | Status | Data mode |
|---|------------|--------|-----------|
| 1 | Product discovery | Partial | Domain store |
| 2 | Product scoring | Live | PIE evaluateProduct |
| 3 | Product ranking | Partial | Composite rank |
| 4 | Trend monitoring | Partial | Connector signals |
| 5 | Profitability estimation | Live | Margin score |
| 6 | Competition analysis | Live | Competition score |
| 7 | Supplier availability | Partial | CJ mock + Supplier Engine |
| 8 | Marketplace availability | Architecture | Amazon US/SG, Shopee SG |
| 9 | Product lifecycle tracking | Architecture | discovered → ranked stages |
| 10 | Executive recommendations | Live | SELL / REVIEW / DO_NOT_SELL |

### Version 1 supported sources

| Source ID | Label | Region | Status |
|-----------|-------|--------|--------|
| `cj-dropshipping` | CJ Dropshipping | Global | Mock connector |
| `amazon-us` | Amazon US | US | Architecture (B6-01a slot) |
| `amazon-sg` | Amazon Singapore | SG | Architecture (B6-01b slot) |
| `shopee-sg` | Shopee Singapore | SG | Architecture provision |
| `shopify-stores` | Shopify Stores | Global | **Future** |

### Brain module contract

| Capability | Purpose |
|------------|---------|
| `product-intelligence.architecture` | Return G3-01 architecture document |
| `product-intelligence.rank` | Ranked catalog with analysis contracts |
| `product-intelligence.evaluate` | Delegate to PIE (existing) |
| `product-intelligence.persist` | Delegate to PIE catalog (existing) |

---

## 3. Data Flow

```
1. Discovery
   V1 sources → Connector signal plane → ProductIntelligenceSignal

2. Scoring
   Signals + supplier data → PIE evaluateProduct() → dimension scores

3. Persistence
   Evaluation → product_intelligence_catalog (+ signals table)

4. Ranking
   Catalog → mapCatalogToAnalysisContract() → rankAnalysisContracts()

5. Executive output
   ProductIntelligenceAnalysisContract → Cockpit SCR-100 · QIE · Global Assistant

6. Engine integration
   Ranked opportunities → Supplier · Marketplace · Ads · Analytics engines
```

### Seven-field product analysis contract

Every analysed product exposes:

| Field | Source |
|-------|--------|
| **Intelligence Score** | `overallScore` (PIE composite) |
| **Profit Score** | `marginScore` |
| **Competition Score** | `competitionScore` (Empire-friendly) |
| **Risk Score** | Derived from competition, supplier availability, trend |
| **Confidence** | PIE `computeConfidence()` |
| **Supporting Evidence** | Demand, margin, supplier, trend, provider signal count |
| **Recommended Action** | SELL/REVIEW/DO_NOT_SELL narrative + next step |

---

## 4. Integration Map

| Engine | Relationship | Cockpit route | Brain module |
|--------|--------------|---------------|--------------|
| **Supplier Engine** | Feeds supplier reliability + CJ availability | `/cockpit/intelligence/suppliers` | `cockpit-engine` |
| **Marketplace Engine** | Feeds Amazon US/SG listing readiness | `/cockpit/intelligence/marketplace` | `cockpit-engine` |
| **Quantitative Intelligence Engine** | Consumes PIE scores for discovery board | `/cockpit/intelligence/discovery` | `cockpit-engine` |
| **Advertising Engine** | Validates campaign potential for ranked SKUs | `/cockpit/commerce/marketing` | `cockpit-engine` |
| **Analytics Engine** | Reports revenue telemetry for launched products | `/cockpit/finance/profit` | `cockpit-engine` |

### Existing PIE stack (reused, not duplicated)

| Component | Path |
|-----------|------|
| Evaluation engine | `backend/src/intelligence/product-intelligence-engine/product-intelligence-engine.ts` |
| Catalog repository | `backend/src/intelligence/product-intelligence-engine/catalog-repository.ts` |
| Mock connectors | `backend/src/intelligence/connectors/` |
| REST routes | `backend/src/intelligence/product-intelligence-engine/routes.ts` |
| Cockpit panel | `loadIntelligenceEnginePanel()` in `cockpit-panel-views.ts` |

---

## 5. Future Expansion

| Item | Gate |
|------|------|
| Shopee SG live connector | G3-02+ |
| Shopify Stores catalog sync | Post-V1 commerce spine |
| GPIE discovery runs + opportunity rankings tables | Mission 015 extension |
| Amazon SP-API live signals | B6-01 live activation |
| Product lifecycle state machine | REAL-013 live-PIE integration |
| Promote to 10th Engine Center (8-section) | Explicit Grand King decision |
| Generative product briefs / LLM reasoning | Out of G3-01 scope |

---

## 6. Files Delivered

| Layer | Path |
|-------|------|
| Architecture types + registry | `backend/src/intelligence/product-intelligence-engine/engine-architecture.ts` |
| Brain module contract | `backend/src/intelligence/product-intelligence-engine/module-contract.ts` |
| Cockpit view loader | `backend/src/domain/services/product-intelligence-engine-views.ts` |
| Panel wiring | `backend/src/domain/services/cockpit-panel-views.ts` (updated) |
| Brain capabilities | `backend/src/brain/contract/capabilities.ts` (extended) |
| Brain tool | `product_intelligence_engine.load_view` |
| Brain route | `product-intelligence-engine` module |
| Permissions | `backend/src/auth/permissions.ts` |
| Interaction registry | `cockpit-interaction-layer.ts` SCR-100 |
| Tests | `backend/src/validation/tests/g3-01-product-intelligence-engine.test.ts` |

---

## 7. Brain Dispatch

### Load full engine view

```http
POST /api/brain/dispatch
{
  "module": "product-intelligence-engine",
  "action": "load"
}
```

### Load compact Cockpit panel

```http
POST /api/brain/dispatch
{
  "module": "cockpit-intelligence",
  "action": "load"
}
```

---

## 8. Verification

```bash
cd backend
node --import tsx --test src/validation/tests/g3-01-product-intelligence-engine.test.ts
```

**Manual:** Log in → Intelligence → Products → verify Product Intelligence Engine panel shows G3-01 dependencies, ranked products with intelligence/profit/risk scores.

---

## 9. Mission Gate

**G3-01 complete.** Architecture defined and wired. No live APIs connected.  
**G3-02 not started** per mission directive.

---

## 10. Screenshots

Not captured (requires authenticated session). Recommended after deploy:

1. SCR-100 Product Intelligence Engine panel with ranked products
2. Analysis contract detail (intelligence · profit · competition · risk scores)
3. Integration dependencies list on engine panel
