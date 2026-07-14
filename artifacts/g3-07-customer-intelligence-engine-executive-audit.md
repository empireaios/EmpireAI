# G3-07 — Customer Intelligence Engine · Executive Audit

**Mission:** G3-07 — Customer Intelligence Engine  
**Authority:** Grand King · G3-01–G3-06 complete  
**Date:** 2026-06-21  
**Status:** **COMPLETE**  
**Scope:** Architecture only — **no live CRM or marketplace customer API connections** · **G3-08 not started**

---

## Executive Summary

EmpireAI's **Customer Intelligence Engine** understands customers through registry-discovered segmentation and domain-store behavioural overlay. The engine scores customer segments on segmentation, behaviour, buying journey, retention, churn risk, lifetime value, and satisfaction — emitting RETAIN / ENGAGE / WIN_BACK / MONITOR executive recommendations.

**Design principle:** G3-07 discovers CRM platforms and marketplace buyer segments via RegistryLoader. Customer metrics overlay from orders and support tickets. No hardcoded platform lists in engine logic.

**Cockpit route:** `/cockpit/intelligence/customers` (SCR-107)  
**Brain module:** `customer-intelligence-engine`  
**Artifact ref:** Set on `loadCustomerIntelligenceEnginePanel().executiveAudit.artifactRef`

---

## 1. Architecture

```
Grand King (Cockpit SCR-107)
  │
  ├─ customer-intelligence-engine.load → compact engine panel
  └─ customer-intelligence-engine.architecture → full G3-07 engine view
  │
  ▼
Customer Intelligence Engine (G3-07)
  │
  ├─ RegistryLoader → CRM providers + marketplace segments + customer countries
  ├─ Orders + support tickets domain store
  ├─ Analytics + Advertising cross-signals
  └─ Customer analysis contract — LTV, churn, retention, recommendation
  │
  ▼
Integrated Executive AI Engines
  Marketplace · Analytics · Advertising
```

---

## 2. Engine Components

### Core capabilities (8)

| # | Capability | Status | Data mode |
|---|------------|--------|-----------|
| 1 | Segmentation | Partial | Registry |
| 2 | Behaviour | Partial | Domain store |
| 3 | Buying journey | Partial | Domain store |
| 4 | Retention | Partial | Derived |
| 5 | Churn | Partial | Derived |
| 6 | Lifetime value | Partial | Domain store |
| 7 | Satisfaction | Partial | Domain store |
| 8 | Executive recommendations | Live | RETAIN / ENGAGE / WIN_BACK / MONITOR |

### Dynamic customer discovery

| Discovery source | Registry | Engine usage |
|------------------|----------|--------------|
| CRM providers | Platform catalog (`loadCustomerCatalogRows`) | Zendesk, Intercom |
| Marketplace segments | Platform catalog (`loadMarketplaceRows`) | Buyer cohort segmentation |
| Customer countries | REG-COUNTRY (commerceDomains includes customer_service) | Geo coverage scope |
| Customers | Domain store + registry architecture fallback | Per-segment analysis |

### Customer analysis contract

| Field | Source |
|-------|--------|
| **Customer Score** | Composite: segmentation, behaviour, journey, retention, LTV, satisfaction |
| **Segmentation Score** | Marketplace + CRM provider mapping |
| **Behaviour Score** | Order frequency, repeat purchases, ticket interactions |
| **Journey Score** | Order-to-support journey stage proxy |
| **Retention Score** | Repeat purchase and engagement index |
| **Churn Risk Score** | Inverse retention + satisfaction + ticket escalation |
| **LTV Score** | Order value aggregates and segment benchmarks |
| **Satisfaction Score** | CSAT proxy from support tickets |
| **Confidence** | Domain data depth + registry mapping |
| **Supporting Evidence** | Domain, registry, advertising, analytics signals |
| **Recommended Action** | RETAIN / ENGAGE / WIN_BACK / MONITOR narrative |

---

## 3. Integration Map

| Engine | Relationship | Cockpit route |
|--------|--------------|---------------|
| **Marketplace** | Feeds | `/cockpit/intelligence/marketplace` |
| **Analytics** | Reports | `/cockpit/finance/profit` |
| **Advertising** | Consumes | `/cockpit/commerce/marketing` |

---

## 4. Files Delivered

| Layer | Path |
|-------|------|
| Architecture + scoring | `backend/src/intelligence/customer-intelligence-engine/` |
| Customer registry catalog | `global-commerce-registry-data.ts`, `platform-catalog-source.ts` |
| Cockpit view loader | `customer-intelligence-engine-views.ts` |
| Panel wiring | `cockpit-panel-views.ts` |
| Brain route | `customer-intelligence-engine` module |
| Cockpit nav + page | `intelligence/customers` |
| Tests | `g3-07-customer-intelligence-engine.test.ts` |

---

## 5. Verification

```bash
cd backend
node --import tsx --test src/validation/tests/g3-07-customer-intelligence-engine.test.ts
```

---

## 6. Mission Gate

**G3-07 complete.** Architecture defined and wired. No live CRM or marketplace customer APIs connected.  
**G3-08 not started** per mission directive.
