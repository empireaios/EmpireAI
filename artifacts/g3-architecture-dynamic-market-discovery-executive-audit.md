# G3 — Dynamic Market Discovery · Executive Audit

**Mission:** Architecture correction — Intelligence Engines must not hardcode supported markets  
**Authority:** Grand King · ADR-052 · `V1_MARKETPLACE_CHANNEL_REGISTRY.md`  
**Date:** 2026-07-02  
**Status:** **COMPLETE**  
**Scope:** Architecture review + registry refactor · **G3-02 not started**

---

## Executive Summary

G3-01 introduced the Product Intelligence Engine with **hardcoded Version 1 marketplace names** (`amazon-us`, `amazon-sg`, `shopee-sg`, `shopify-stores`) embedded in engine logic. That violates ADR-052: V1 marketplaces are **deployment configuration**, not engine assumptions.

This audit documents the violation, refactors discovery into a shared registry chain, and defines the canonical pattern all future G3 Intelligence Engines must follow.

**Outcome:** Intelligence Engines now discover markets dynamically:

```
Intelligence Engine
  ↓
Marketplace / Channel Registry (deployment config)
  ↓
Global Commerce Registry (expansion catalog)
  ↓
Available Countries
  ↓
Available Marketplaces (per country)
  ↓
Available Channels (V1 deployment + supplier)
  ↓
Available Products (PIE catalog / future engine stores)
```

**G3-02 gate:** Blocked until this review is accepted — no G3-02 implementation started.

---

## 1. Current Architecture Review

### 1.1 Pre-correction state (G3-01 initial)

| Layer | Behaviour | Problem |
|-------|-----------|---------|
| **Product Intelligence Engine** | `G3_01_V1_SOURCES` constant array with 5 hardcoded source rows | Engine assumed V1 = Amazon US/SG + Shopee SG + Shopify |
| **Source ID union type** | Closed union `"amazon-us" \| "amazon-sg" \| ...` | New registry IDs require engine type edits |
| **Executive summary** | Literal string "Amazon US/SG (architecture), Shopee SG" | UI copy baked into engine |
| **Future expansion** | Hardcoded bullet list ("Shopee SG live connector", etc.) | Expansion required engine file changes |
| **Cockpit panel** | Dependency label "Marketplace Engine (Amazon US/SG)" | Cockpit echoed hardcoded markets |

### 1.2 Existing canonical registries (already in codebase)

| Registry | Path | Role |
|----------|------|------|
| **Governance V1 Channel Registry** | `docs/governance/V1_MARKETPLACE_CHANNEL_REGISTRY.md` | ADR-052 authority — four V1 channels + expansion model |
| **Global Commerce Registry** | `backend/src/runtime/global-commerce/data/global-commerce-registry-data.ts` | 80+ country × marketplace rows (Lazada, TikTok, Walmart, Rakuten, Mercado Libre, …) |
| **Amazon Marketplace Profiles** | `backend/src/orchestration/reality-integration/live-commerce/amazon-marketplace-profiles.ts` | Amazon-specific credential/endpoint profiles (adapter layer — not intelligence) |
| **Marketplace Adapter Registry** | `backend/src/runtime/marketplace-publishing/models/marketplace-adapter.ts` | Publish adapter slots (execution layer) |
| **Marketplace Definitions** | `backend/src/orchestration/marketplace-infrastructure-engine/services/marketplace-definitions.ts` | Platform family connection guides |

**Gap:** G3-01 did not consume these registries. Intelligence layer duplicated V1 channel knowledge.

### 1.3 Market Intelligence Engine naming

No standalone **Market Intelligence Engine** module exists yet in G3. Related surfaces:

| Surface | Location | Hardcoding risk |
|---------|----------|-----------------|
| **Marketplace Intelligence (EI8)** | `docs/executive-intelligence/EI8_MARKETPLACE_INTELLIGENCE.md` | Doctrine only — no runtime |
| **Marketplace Engine panel** | `cockpit-panel-views.ts` → `loadMarketplaceEnginePanel()` | Amazon-only channel rows via `AMAZON_MARKETPLACE_REGISTRY_IDS` |
| **Commerce Intelligence Core** | `commerce-intelligence-core/services/marketplace-study-service.ts` | `marketplaceId: "amazon-us"` literal |
| **Product Intelligence Engine** | `engine-architecture.ts` | **Fixed in this mission** |

Future **G3 Market Intelligence Engine** must adopt the same discovery module from day one.

---

## 2. Hardcoded Locations Found

### 2.1 Intelligence layer (G3 scope — corrected)

| File | Hardcoded content | Status |
|------|-------------------|--------|
| `backend/src/intelligence/product-intelligence-engine/engine-architecture.ts` | `G3_01_V1_SOURCES`, closed source union, Amazon/Shopee strings | ✅ **Refactored** |
| `backend/src/domain/services/cockpit-panel-views.ts` | `"Marketplace Engine (Amazon US/SG)"` | ✅ **Updated** to registry wording |

### 2.2 Intelligence layer (remaining — documented, not G3-02)

| File | Hardcoded content | Recommended action |
|------|-------------------|-------------------|
| `backend/src/intelligence/commerce-intelligence-core/models/commerce-intelligence-core.ts` | `marketplaceId: z.literal("amazon-us")` | Migrate to registry-resolved channel id |
| `backend/src/intelligence/commerce-intelligence-core/services/marketplace-study-service.ts` | `marketplaceId: "amazon-us"` | Call `resolveIntelligenceSources()` or channel registry |
| `backend/src/intelligence/commerce-intelligence-core/services/mission-service.ts` | `marketplaceId: "amazon-us"` | Same |

### 2.3 Execution / orchestration layer (acceptable — adapter config, not intelligence)

These are **deployment/adapter configuration**, not Intelligence Engine logic. They should feed the registry, not be duplicated inside engines:

| File | Content | Notes |
|------|---------|-------|
| `amazon-marketplace-profiles.ts` | `AMAZON_MARKETPLACE_REGISTRY_IDS = ["amazon-us", "amazon-sg"]` | Amazon adapter profiles — OK at adapter layer |
| `live-commerce/config.ts` | V1 Amazon marketplaces comment | B6 live-commerce scope |
| `marketplace-adapter.ts` | `MARKETPLACE_ADAPTERS` display names | Publish formatter registry |
| `global-commerce-registry-data.ts` | All marketplace rows | **Canonical expansion catalog** |
| `cockpit-panel-views.ts` → `loadMarketplaceEnginePanel()` | Amazon-only `channelRows` | Future: use `listAvailableChannels()` |

### 2.4 Governance / artifacts (reference only — not runtime)

| Location | Notes |
|----------|-------|
| `artifacts/g3-01-product-intelligence-engine-executive-audit.md` | Historical — predates this correction |
| `docs/governance/V1_MARKETPLACE_CHANNEL_REGISTRY.md` | **Correct** — V1 channels belong here |

---

## 3. Refactoring Recommendations

### 3.1 Implemented (this mission)

| Deliverable | Path |
|-------------|------|
| **Deployment channel registry** | `backend/src/intelligence/shared/marketplace-channel-registry.ts` |
| **Discovery service** | `backend/src/intelligence/shared/intelligence-market-discovery.ts` |
| **PIE architecture refactor** | `backend/src/intelligence/product-intelligence-engine/engine-architecture.ts` |
| **Validation tests** | `backend/src/validation/tests/g3-architecture-dynamic-market-discovery.test.ts` |

### 3.2 Rules for all future G3 Intelligence Engines

1. **Never** embed marketplace names (`Amazon US`, `Shopee SG`, `Shopify`) in engine source files.
2. **Always** call `resolveIntelligenceSources()` or `buildIntelligenceMarketDiscoverySnapshot()` at view-build time.
3. **V1 channels** are rows in `MARKETPLACE_CHANNEL_DEPLOYMENT_PROFILES` — add rows, not engine constants.
4. **Expansion marketplaces** appear automatically via `global-commerce-registry-data.ts`; intelligence surfaces them through `listExpansionMarketplaces()`.
5. **Activating** an expansion marketplace for V1 deployment = append deployment profile row + adapter mission — **zero engine edits**.
6. **Supplier channels** use `SUPPLIER_CHANNEL_DEPLOYMENT_PROFILES` (currently CJ) — same pattern.
7. **Type IDs** are `string` registry ids, not closed unions tied to V1 names.

### 3.3 Recommended follow-ups (post-audit, pre-G3-02)

| Priority | Task | Owner mission |
|----------|------|-----------------|
| P1 | Refactor `commerce-intelligence-core` to registry discovery | G3-02 or parallel hygiene |
| P1 | Wire `loadMarketplaceEnginePanel()` to `listAvailableChannels()` | G4 cockpit wiring |
| P2 | Single runtime loader that syncs governance doc §4 profiles → deployment registry | B6 / platform |
| P2 | Workspace-scoped channel activation (connected vs architecture-only) | Marketplace Connection Engine |
| P3 | Product catalog `sourceIds` from signal `provider_id` column | G3-02 PIE live path |

---

## 4. Final Dynamic Discovery Architecture

### 4.1 Component diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Intelligence Engine (Product · Market · Supplier · …)     │
│  — NO hardcoded marketplace names                           │
└───────────────────────────┬─────────────────────────────────┘
                            │ resolveIntelligenceSources()
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  intelligence-market-discovery.ts                           │
│  listAvailableCountries()                                   │
│  listAvailableMarketplacesByCountry()                         │
│  listAvailableChannels()                                    │
│  listExpansionMarketplaces()                                │
└───────────────┬─────────────────────────┬───────────────────┘
                │                         │
                ▼                         ▼
┌───────────────────────────┐   ┌─────────────────────────────┐
│ marketplace-channel-      │   │ global-commerce-registry    │
│ registry.ts               │   │ (80+ marketplace rows)      │
│ V1 deployment profiles    │   │ Countries · Providers       │
│ amazon-us · amazon-sg     │   │ lazada-sg · tiktok-shop-us  │
│ shopee-sg · shopify · CJ  │   │ walmart-us · rakuten-jp …   │
└───────────────────────────┘   └─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│  Adapter / Live-commerce layer (execution — not intelligence)│
│  amazon-marketplace-profiles · marketplace-adapter · B6     │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Discovery API surface

| Function | Returns |
|----------|---------|
| `buildIntelligenceMarketDiscoverySnapshot()` | Full tree for Cockpit / audit |
| `resolveIntelligenceSources()` | Channel + supplier sources for engine views |
| `listAvailableCountries()` | Countries with marketplace coverage |
| `listAvailableMarketplacesByCountry(code)` | All registered marketplaces in country |
| `listExpansionMarketplaces()` | Global-commerce rows not in V1 deployment |
| `listV1MandatoryChannels()` | ADR-052 mandatory deployment rows |

### 4.3 V1 deployment registrations (current config)

| Registry ID | Type | V1 role | Engine discovers via |
|-------------|------|---------|----------------------|
| `cj-dropshipping` | Supplier | Mandatory live | Deployment registry |
| `amazon-us` | Marketplace | Mandatory live | Deployment registry |
| `amazon-sg` | Marketplace | Mandatory live | Deployment registry |
| `shopee-sg` | Marketplace | Mandatory live | Deployment registry |
| `shopify` | Storefront | Mandatory architecture | Deployment registry |

### 4.4 Automatic expansion (no engine change)

When `global-commerce-registry-data.ts` contains a row (e.g. `lazada-sg`, `tiktok-shop-us`, `mercado-livre-br`):

- `listExpansionMarketplaces()` includes it immediately
- `listAvailableMarketplacesByCountry("SG")` includes it
- PIE `futureExpansion` lists it dynamically
- **Intelligence Engine code unchanged**

To promote expansion → V1 deployment: append row to `MARKETPLACE_CHANNEL_DEPLOYMENT_PROFILES`.

### 4.5 Product Intelligence Engine post-refactor

```typescript
// engine-architecture.ts — pattern
const marketDiscovery = buildIntelligenceMarketDiscoverySnapshot();
sources: marketDiscovery.intelligenceSources,  // not a hardcoded array
```

Architecture payload now includes `marketDiscovery` block for Cockpit transparency.

---

## 5. Validation

| Test file | Coverage |
|-----------|----------|
| `g3-architecture-dynamic-market-discovery.test.ts` | Registry chain, expansion auto-discovery, PIE source derivation |
| `g3-01-product-intelligence-engine.test.ts` | Updated — V1 channels from registry, not engine constants |

**Run:**

```bash
node --import tsx --test backend/src/validation/tests/g3-architecture-dynamic-market-discovery.test.ts
node --import tsx --test backend/src/validation/tests/g3-01-product-intelligence-engine.test.ts
```

---

## 6. Gate Status

| Gate | Status |
|------|--------|
| Architecture review complete | ✅ |
| Hardcoded locations documented | ✅ |
| PIE refactored to dynamic discovery | ✅ |
| Shared discovery module for future G3 engines | ✅ |
| **G3-02 implementation** | ⛔ **Not started** |

---

## 7. References

| Document | Link |
|----------|------|
| ADR-052 V1 Channel Registry | `docs/governance/V1_MARKETPLACE_CHANNEL_REGISTRY.md` |
| G3-01 PIE audit (historical) | `artifacts/g3-01-product-intelligence-engine-executive-audit.md` |
| B6-01C governance amendment | `artifacts/b6-01c-marketplace-governance-amendment-v2-executive-audit.md` |
| Deployment registry | `backend/src/intelligence/shared/marketplace-channel-registry.ts` |
| Discovery service | `backend/src/intelligence/shared/intelligence-market-discovery.ts` |

---

*G3 Dynamic Market Discovery — Executive Audit · 2026-07-02 · G3-02 blocked pending King acceptance of this correction*
