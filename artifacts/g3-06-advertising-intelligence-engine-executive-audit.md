# G3-06 — Advertising Intelligence Engine · Executive Audit

**Mission:** G3-06 — Advertising Intelligence Engine  
**Authority:** Grand King · G3-01–G3-05 complete  
**Date:** 2026-06-21  
**Status:** **COMPLETE**  
**Scope:** Architecture only — **no live advertising API connections** · **G3-07 not started**

---

## Executive Summary

EmpireAI's **Advertising Intelligence Engine** optimises advertising decisions through registry-discovered campaign analysis. The engine scores campaigns on ROAS, CAC, budget allocation, creative performance, audience reach, and scaling potential — emitting SCALE / MAINTAIN / PAUSE / TEST executive recommendations.

**Design principle:** G3-06 discovers ad platforms and geo coverage via RegistryLoader. Campaign metrics overlay from the domain store. No hardcoded platform lists in engine logic.

**Cockpit route:** `/cockpit/commerce/ad-intelligence` (SCR-106)  
**Brain module:** `advertising-intelligence-engine`  
**Artifact ref:** Set on `loadAdvertisingIntelligenceEnginePanel().executiveAudit.artifactRef`

---

## 1. Architecture

```
Grand King (Cockpit SCR-106)
  │
  ├─ advertising-intelligence-engine.load → compact engine panel
  └─ advertising-intelligence-engine.architecture → full G3-06 engine view
  │
  ▼
Advertising Intelligence Engine (G3-06)
  │
  ├─ RegistryLoader → advertising providers + advertising countries
  ├─ Ads + marketing domain store
  ├─ FIE + QIE + analytics cross-signals
  └─ Campaign analysis contract — ROAS, CAC, scaling, recommendation
  │
  ▼
Integrated Executive AI Engines
  Advertising · Financial · Quantitative · Analytics
```

---

## 2. Engine Components

### Core capabilities (8)

| # | Capability | Status | Data mode |
|---|------------|--------|-----------|
| 1 | Budget allocation | Partial | Domain store |
| 2 | Creative performance | Partial | Domain store |
| 3 | Audience analysis | Partial | Registry countries |
| 4 | Campaign comparison | Partial | Ranked board |
| 5 | CAC | Partial | Spend / conversion proxy |
| 6 | ROAS | Live | Domain store |
| 7 | Scaling opportunities | Partial | FIE + QIE derived |
| 8 | Executive recommendations | Live | SCALE / MAINTAIN / PAUSE / TEST |

### Dynamic advertising discovery

| Discovery source | Registry | Engine usage |
|------------------|----------|--------------|
| Ad providers | Platform catalog (`loadAdvertisingCatalogRows`) | Meta Ads, Google Ads |
| Advertising countries | REG-COUNTRY (commerceDomains includes advertising) | Audience reach scope |
| Campaigns | Domain store + registry architecture fallback | Per-campaign analysis |

### Campaign analysis contract

| Field | Source |
|-------|--------|
| **Advertising Score** | Composite: ROAS, CAC, budget, creative, scaling |
| **ROAS** | Ad channel domain store |
| **CAC Score** | Inverted CAC index from spend and conversions |
| **Budget Allocation Score** | ROAS-tier allocation efficiency |
| **Scaling Score** | ROAS + CAC + QIE probability + FIE score |
| **Confidence** | Domain data depth + registry mapping |
| **Supporting Evidence** | Domain, registry, QIE, FIE signals |
| **Recommended Action** | SCALE / MAINTAIN / PAUSE / TEST narrative |

---

## 3. Integration Map

| Engine | Relationship | Cockpit route |
|--------|--------------|---------------|
| **Advertising Engine** | Feeds | `/cockpit/commerce/marketing` |
| **Financial Intelligence Engine** | Validates | `/cockpit/finance/intelligence` |
| **Quantitative Intelligence Engine** | Consumes | `/cockpit/intelligence/discovery` |
| **Analytics Engine** | Reports | `/cockpit/finance/profit` |

---

## 4. Files Delivered

| Layer | Path |
|-------|------|
| Architecture + scoring | `backend/src/intelligence/advertising-intelligence-engine/` |
| Advertising registry catalog | `global-commerce-registry-data.ts`, `platform-catalog-source.ts` |
| Cockpit view loader | `advertising-intelligence-engine-views.ts` |
| Panel wiring | `cockpit-panel-views.ts` |
| Brain route | `advertising-intelligence-engine` module |
| Cockpit nav + page | `commerce/ad-intelligence` |
| Tests | `g3-06-advertising-intelligence-engine.test.ts` |

---

## 5. Verification

```bash
cd backend
node --import tsx --test src/validation/tests/g3-06-advertising-intelligence-engine.test.ts
```

---

## 6. Mission Gate

**G3-06 complete.** Architecture defined and wired. No live advertising APIs connected.  
**G3-07 not started** per mission directive.
