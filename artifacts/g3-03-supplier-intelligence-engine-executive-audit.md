# G3-03 — Supplier Intelligence Engine · Executive Audit

**Mission:** G3-03 — Supplier Intelligence Engine  
**Authority:** Grand King · G3-01 · G3-02 complete  
**Date:** 2026-06-21  
**Status:** **COMPLETE**  
**Scope:** Architecture only — **no live supplier API connections** · **G3-04 not started**

---

## Executive Summary

EmpireAI's third **Executive AI Engine** — the **Supplier Intelligence Engine** — is architecturally defined and wired into Brain, Cockpit, and the RegistryLoader discovery plane. The engine scores, compares, and recommends **suppliers** discovered dynamically from the registry, exposing a six-field analysis contract for every analysed supplier.

**Design principle:** G3-03 extends Mission 006 SIE (`evaluateSupplier`, trust scoring, fake detection, Guardian gates) with registry-driven supplier discovery. The engine contains **no hardcoded** supplier lists — all suppliers are resolved from `RegistryLoader → DERIVED-DISCOVERY-SNAPSHOT`.

**Cockpit route:** `/cockpit/intelligence/suppliers` (SCR-101)  
**Brain module:** `supplier-intelligence-engine`  
**Artifact ref:** Set on `loadSupplierIntelligenceEnginePanel().executiveAudit.artifactRef`

---

## 1. Architecture

```
Grand King (Cockpit SCR-101)
  │
  ├─ supplier-intelligence-engine.load → compact engine panel
  └─ supplier-intelligence-engine.architecture → full G3-03 engine view
  │
  ▼
Supplier Intelligence Engine (G3-03)
  │
  ├─ RegistryLoader → supplierProviders + supplier deployment channels
  ├─ Mock catalog overlay (architecture signals — no live APIs)
  ├─ SIE evaluateSupplierCatalogRecord() — dimension scoring
  ├─ Guardian fake-supplier detection
  └─ Analysis Contract — six-field executive output
  │
  ▼
Integrated Executive AI Engines
  Supplier Engine · Marketplace · Product Intelligence · QIE · Logistics
```

### Layer separation

| Layer | Responsibility | G3-03 status |
|-------|----------------|--------------|
| **G3-03 architecture** | Registry discovery, capabilities, integrations, analysis contract | ✅ Defined |
| **SIE (Mission 006)** | Scoring, SELL/REVIEW/REJECT, fake detection | ✅ Reused |
| **RegistryLoader (EA-003)** | Dynamic supplier universe | ✅ Consumed |
| **Live supplier APIs** | CJ / Spocket / Zendrop live feeds | **Deferred** |

---

## 2. Engine Components

### Core capabilities (10)

| # | Capability | Status | Data mode |
|---|------------|--------|-----------|
| 1 | Supplier scoring | Live | SIE trust score |
| 2 | Reliability | Live | Tenure + verification signals |
| 3 | Fulfilment performance | Partial | Shipping score dimension |
| 4 | Stock confidence | Architecture | Catalog depth proxy |
| 5 | Pricing stability | Live | Pricing score dimension |
| 6 | Quality confidence | Live | Quality index + defect rate |
| 7 | Geographic coverage | Partial | Registry country + region |
| 8 | Supplier risk | Live | Fake risk + Guardian flags |
| 9 | Supplier comparison | Partial | Ranked comparison board |
| 10 | Executive recommendations | Live | SELL / REVIEW / REJECT |

### Dynamic supplier discovery

| Discovery source | Registry | Engine usage |
|------------------|----------|--------------|
| Supplier providers | `REG-SUPPLIER` via snapshot | Primary supplier universe |
| Deployment channels | `REG-CHANNEL` (supplier type) | Connector refs + launch readiness |
| Catalog overlay | Mock catalog matched by connectorId | Architecture scoring signals |

**No engine constants** for supplier names or provider lists.

### Brain module contract

| Capability | Purpose |
|------------|---------|
| `supplier-intelligence.architecture` | Return G3-03 architecture document |
| `supplier-intelligence.rank` | Ranked suppliers with analysis contracts |
| `supplier-intelligence.evaluate` | Delegate to SIE (existing) |
| `supplier-intelligence.compare` | Delegate to SIE comparison (existing) |
| `supplier-intelligence.discover` | Filtered discovery (existing) |

---

## 3. Data Flow

```
1. Discovery
   RegistryLoader → supplierProviders + supplier channels

2. Catalog overlay
   Registry rows → matched mock catalog OR architecture defaults

3. Scoring
   Catalog + signals → evaluateSupplierCatalogRecord() → dimension scores

4. Comparison
   Scored suppliers → buildSupplierComparison() → ranked board

5. Executive output
   Analysis contract → Cockpit SCR-101 · PIE · QIE

6. Engine integration
   Supplier rankings → Supplier Engine · Marketplace · Logistics
```

### Six-field supplier analysis contract

Every analysed supplier exposes:

| Field | Source |
|-------|--------|
| **Supplier Score** | SIE `trustScore` composite |
| **Reliability** | SIE `reliabilityScore` |
| **Risk** | Fake supplier risk + Guardian flag penalty |
| **Confidence** | SIE `computeConfidence()` |
| **Supporting Evidence** | Quality, fulfilment, pricing, stock, geography, Guardian |
| **Recommended Action** | SELL/REVIEW/REJECT narrative + next step |

---

## 4. Integration Map

| Engine | Relationship | Cockpit route | Brain module |
|--------|--------------|---------------|--------------|
| **Supplier Engine** | Feeds CJ credentials and fulfilment handoff | `/cockpit/intelligence/suppliers` | `cockpit-engine` |
| **Marketplace Engine** | Validates listing and channel constraints | `/cockpit/intelligence/marketplace` | `cockpit-engine` |
| **Product Intelligence Engine** | Consumes supplier availability for product scoring | `/cockpit/intelligence/products` | `product-intelligence-engine` |
| **Quantitative Intelligence Engine** | Reports supplier scores to discovery board | `/cockpit/intelligence/discovery` | `cockpit-engine` |
| **Logistics Engine** | Validates shipping and fulfilment routing | `/cockpit/operations/fulfillment` | `cockpit-engine` |

---

## 5. EC Compliance (EA-007)

| Constraint | G3-03 compliance |
|------------|-------------------|
| **EC-1** No new business hardcodes in intelligence engines | ✅ Suppliers discovered via RegistryLoader |
| **EC-2** RegistryLoader discovery entry point | ✅ `buildMarketIntelligenceDiscoveryView()` / snapshot |
| **EC-3** Registry append model | ✅ Append REG-SUPPLIER to activate new supplier |
| **No live APIs** | ✅ Mock catalog overlay only |
| **EA architecture frozen** | ✅ No EA-001–007 changes |

---

## 6. Files Delivered

| Layer | Path |
|-------|------|
| Architecture types + scoring | `backend/src/intelligence/supplier-intelligence-engine/engine-architecture.ts` |
| Catalog record evaluation | `supplier-intelligence-engine.ts` (`evaluateSupplierCatalogRecord`) |
| Brain module contract | `module-contract.ts` (extended) |
| Cockpit view loader | `backend/src/domain/services/supplier-intelligence-engine-views.ts` |
| Panel wiring | `cockpit-panel-views.ts` (updated) |
| Brain capabilities | `capabilities.ts` (extended) |
| Brain tools | `supplier_intelligence_engine.load_view`, `load_panel` |
| Brain route | `supplier-intelligence-engine` module |
| Permissions | `auth/permissions.ts` |
| Interaction registry | `cockpit-interaction-layer.ts` SCR-101 |
| Frontend panel | `IntelligenceEnginePanels.tsx` |
| Tests | `g3-03-supplier-intelligence-engine.test.ts` |

---

## 7. Brain Dispatch

### Load compact Cockpit panel

```http
POST /api/brain/dispatch
{
  "module": "supplier-intelligence-engine",
  "action": "load"
}
```

### Load full engine view

```http
POST /api/brain/dispatch
{
  "module": "supplier-intelligence-engine",
  "action": "architecture"
}
```

---

## 8. Verification

```bash
cd backend
node --import tsx --test src/validation/tests/g3-03-supplier-intelligence-engine.test.ts
```

**Manual:** Log in → Intelligence → Suppliers → verify Supplier Intelligence Engine panel shows registry-derived suppliers with score/reliability/risk and G3-03 dependencies.

---

## 9. Mission Gate

**G3-03 complete.** Architecture defined and wired. No live supplier APIs connected.  
**G3-04 not started** per mission directive.

---

## 10. Future Expansion

| Item | Gate |
|------|------|
| Live CJ / Spocket API signal ingestion | B6-02 live activation |
| Stock confidence from live inventory | Logistics Engine telemetry |
| REG-SUPPLIER append-only migration | EA-008+ |
| Generative supplier briefs | Out of G3-03 scope |
