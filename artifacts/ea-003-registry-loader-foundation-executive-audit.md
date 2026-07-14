# EA-003 — Registry Loader Foundation · Executive Audit

**Mission:** EA-003 — Registry Loader Foundation  
**Authority:** EA-002 Canonical Registry Architecture · Grand King Architecture Directive  
**Date:** 2026-07-02  
**Status:** **COMPLETE**  
**Scope:** RegistryLoader foundation + one proof consumer · **G3-02 not started**

---

## Executive Summary

EA-003 implements the **RegistryLoader facade** defined in EA-002. Intelligence and future engines can consume business knowledge through a single loader contract instead of importing catalog seeds directly.

**Wired registries (foundation):** Doctrine, Region, Country, Marketplace, Supplier, Channel, Deployment Profile, and **DERIVED-DISCOVERY-SNAPSHOT**.

**Proof consumer:** Product Intelligence market/channel discovery (`intelligence-market-discovery.ts`) now delegates to `RegistryLoader.resolveDerivedView(DERIVED-DISCOVERY-SNAPSHOT)`.

**G3-02 readiness:** `buildMarketIntelligenceDiscoveryView()` and `resolveMarketIntelligenceDiscoverySnapshot()` expose the same RegistryLoader path — no G3-02 implementation started.

**Not in scope:** Full hardcode migration, scoring policy extraction, activation/readiness derived views, workspace DB registries.

---

## 1. Files Changed

### 1.1 New — `backend/src/registry/` module

| File | Purpose |
|------|---------|
| `registry/index.ts` | Public exports |
| `registry/registry-loader.ts` | **RegistryLoader facade** + singleton |
| `registry/types/registry-ids.ts` | Registry IDs, tiers, wired vs placeholder lists |
| `registry/types/registry-types.ts` | Loader contract, context, cache policies, snapshot meta |
| `registry/types/plugin-manifest.ts` | Plugin manifest placeholder types |
| `registry/cache/registry-cache.ts` | TTL cache (immutable / deployment / policy / workspace / derived) |
| `registry/validation/registry-validator.ts` | ID validation, workspace guards, plugin validation |
| `registry/sources/constitutional-source.ts` | REG-DOCTRINE ← `gvd-catalog.ts` |
| `registry/sources/platform-catalog-source.ts` | REG-REGION/COUNTRY/MARKETPLACE/SUPPLIER ← global-commerce |
| `registry/sources/deployment-source.ts` | REG-CHANNEL, REG-DEPLOYMENT-PROFILE ← marketplace-channel-registry |
| `registry/sources/placeholder-source.ts` | Unwired registry placeholder notices |
| `registry/derived/discovery-view.ts` | **DERIVED-DISCOVERY-SNAPSHOT** builder + G3-02 entry |

### 1.2 Modified — proof consumer

| File | Change |
|------|--------|
| `backend/src/intelligence/shared/intelligence-market-discovery.ts` | Delegates to RegistryLoader; adds `resolveDiscoverySnapshot()`, `resolveMarketIntelligenceDiscoverySnapshot()` |

### 1.3 New tests

| File | Coverage |
|------|----------|
| `backend/src/validation/tests/ea-003-registry-loader-foundation.test.ts` | Loader contract, tiers, cache, plugin placeholder, proof consumer |

### 1.4 Updated tests

| File | Change |
|------|--------|
| `backend/src/validation/tests/g3-architecture-dynamic-market-discovery.test.ts` | `registrySource` → `RegistryLoader:DERIVED-DISCOVERY-SNAPSHOT` |

### 1.5 Unchanged (by design)

- `marketplace-channel-registry.ts` — remains deployment seed; loaded **only** via deployment-source
- `global-commerce-registry-data.ts` — remains platform seed; loaded **only** via platform-catalog-source
- G3-02 Market Intelligence Engine module — **not created**
- Scoring thresholds, engine topology, cockpit panels — **not migrated**

---

## 2. Loader Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Engine / Cockpit consumer                                   │
│  intelligence-market-discovery · (future G3-02)              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  getRegistryLoader()                                         │
│  · resolve(context, registryId, query?)                      │
│  · resolveDerivedView(context, viewId, query?)             │
│  · registerPlugin(manifest)  [placeholder]                   │
│  · listFoundationStatus()                                    │
└───────────┬─────────────────────────────┬───────────────────┘
            │                             │
            ▼                             ▼
┌───────────────────────┐     ┌───────────────────────────────┐
│  RegistryCache         │     │  Validation                    │
│  immutable · derived   │     │  assertRegistryId · workspace  │
│  TTL per EA-002        │     │  guards · plugin manifest      │
└───────────┬───────────┘     └───────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│  Sources (tier adapters — only place that imports seeds)     │
│  constitutional · platform-catalog · deployment · placeholder│
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Existing seeds (unchanged location)                         │
│  gvd-catalog · global-commerce-registry-data                 │
│  marketplace-channel-registry                                │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Loader contract

```typescript
RegistryLoaderContext = {
  workspaceId?: string;
  companyId?: string;
  deploymentProfileId?: string;  // default: v1-production
}

resolve(context, registryId, query?) → { meta, rows }
resolveDerivedView(context, viewId, query?) → { meta, view }
registerPlugin(manifest) → { accepted, message }
```

Every `meta` block includes: `registryId`, `tier`, `version`, `contentHash`, `loadedAt`, `deploymentProfileId`, `rowCount`, `wired`.

---

## 3. Registries Supported

### 3.1 Wired (EA-003)

| Registry ID | Tier | Source |
|-------------|------|--------|
| `REG-DOCTRINE` | Constitutional | `gvd-catalog.ts` |
| `REG-REGION` | Platform catalog | `GLOBAL_REGIONS` |
| `REG-COUNTRY` | Platform catalog | `GLOBAL_COUNTRIES` |
| `REG-MARKETPLACE` | Platform catalog | `GLOBAL_MARKETPLACE_PROVIDERS` |
| `REG-SUPPLIER` | Platform catalog | `GLOBAL_SUPPLIER_PROVIDERS` |
| `REG-CHANNEL` | Deployment | `marketplace-channel-registry.ts` |
| `REG-DEPLOYMENT-PROFILE` | Deployment | `v1-production` profile row |
| `DERIVED-DISCOVERY-SNAPSHOT` | Derived | `discovery-view.ts` |

### 3.2 Placeholder (declared, not wired)

| Registry ID | Tier | EA-003 behaviour |
|-------------|------|------------------|
| `REG-BUSINESS-RULE` | Constitutional | Placeholder notice row |
| `REG-PROVIDER` | Deployment | Placeholder |
| `REG-INTEGRATION` | Deployment | Placeholder |
| `REG-SCORING-POLICY` | Policy | Placeholder |
| `REG-PRICING-POLICY` | Policy | Placeholder |
| `REG-AI-ENGINE` | Policy/topology | Placeholder |
| `REG-WORKFLOW` | Policy/topology | Placeholder |
| `REG-TENANT` | Workspace | Placeholder (+ requires workspaceId) |
| `REG-COMPANY` | Workspace | Placeholder |
| `REG-BRAND` | Workspace | Placeholder |
| `REG-CATEGORY` | Workspace | Placeholder |
| `REG-PRODUCT` | Workspace | Placeholder |
| `DERIVED-ACTIVATION-SNAPSHOT` | Derived | Placeholder view |
| `DERIVED-READINESS-SNAPSHOT` | Derived | Placeholder view |

### 3.3 Cache strategy (implemented)

| Policy | TTL | Registries |
|--------|-----|------------|
| `immutable` | Process lifetime | Doctrine, platform catalog |
| `deployment` | Process lifetime | Channel, deployment profile |
| `policy` | 5 min | Scoring/pricing (when wired) |
| `workspace` | 60s | Tenant/product (when wired) |
| `derived` | 30s | Discovery snapshot |

---

## 4. Proof Consumer

### 4.1 Product Intelligence (G3-01)

**Before EA-003:** `intelligence-market-discovery.ts` imported `global-commerce-registry-data` and `marketplace-channel-registry` directly.

**After EA-003:**

```typescript
getRegistryLoader().resolveDerivedView<DiscoverySnapshotView>({}, DERIVED-DISCOVERY-SNAPSHOT)
```

Public API preserved for backward compatibility:

- `buildIntelligenceMarketDiscoverySnapshot()`
- `resolveIntelligenceSources()`
- `listAvailableCountries()` / `listAvailableMarketplacesByCountry()`
- `listExpansionMarketplaces()`

`registrySource` field now reads: **`RegistryLoader:DERIVED-DISCOVERY-SNAPSHOT`**

### 4.2 G3-02 Market Intelligence Engine (prepared, not implemented)

| Entry point | Module | Usage |
|-------------|--------|-------|
| `buildMarketIntelligenceDiscoveryView(context)` | `registry/derived/discovery-view.ts` | Direct RegistryLoader path |
| `resolveMarketIntelligenceDiscoverySnapshot()` | `intelligence-market-discovery.ts` | Intelligence-layer wrapper |

G3-02 must **not** import marketplace/country seeds directly. Use one of the above entry points.

---

## 5. Validation Strategy

| Check | Implementation |
|-------|----------------|
| Unknown registry ID | `RegistryValidationError` |
| Workspace-required registries without `workspaceId` | `RegistryValidationError` |
| Invalid `countryCode` query | `RegistryValidationError` |
| Plugin manifest missing `pluginId` / `version` | `RegistryValidationError` |
| Duplicate plugin registration | Rejected with message |
| Placeholder registries | `meta.wired = false` + notice row |

---

## 6. Plugin Manifest Support (Placeholder)

`registerPlugin(manifest)` accepts and stores manifests in memory. **Row injection into resolve() is deferred** to a future EA mission.

Supported manifest kinds: `provider`, `marketplace`, `supplier`, `engine`, `workflow`, `policy_pack`.

---

## 7. Tests

| Suite | Tests | Result |
|-------|-------|--------|
| `ea-003-registry-loader-foundation.test.ts` | 12 | ✅ Pass |
| `g3-architecture-dynamic-market-discovery.test.ts` | 6 | ✅ Pass |
| `g3-01-product-intelligence-engine.test.ts` | 6 | ✅ Pass |
| **Total** | **24** | ✅ Pass |

Typecheck: `npx tsc --noEmit` ✅

---

## 8. Remaining Migration Work

| Priority | Work | Target registry |
|----------|------|-----------------|
| P0 | Remove duplicate V1 ID lists from `version-1-activation-config.ts` | REG-DEPLOYMENT-PROFILE |
| P0 | Wire `DERIVED-ACTIVATION-SNAPSHOT` | REG-PROVIDER + env |
| P1 | Extract scoring thresholds to loader | REG-SCORING-POLICY |
| P1 | Engine topology from cockpit constants | REG-AI-ENGINE |
| P1 | Commerce-intelligence `amazon-us` literals | DERIVED-DISCOVERY-SNAPSHOT |
| P1 | Cockpit marketplace panel | REG-CHANNEL via loader |
| P2 | Integrations Hub derived view | REG-INTEGRATION |
| P2 | Workspace product/brand/company from Brain | REG-PRODUCT etc. |
| P2 | Plugin row injection on registerPlugin | Plugin host |
| P3 | CI lint: forbid seed imports outside `registry/sources/` | Governance |

**G3-02:** Blocked until King accepts EA-003 foundation — then G3-02 implements Market Intelligence Engine **on top of** `buildMarketIntelligenceDiscoveryView()` only.

---

## 9. Gate Status

| Gate | Status |
|------|--------|
| RegistryLoader facade | ✅ |
| Tier support (all tiers declared) | ✅ |
| Cache + validation + plugin placeholder | ✅ |
| DERIVED-DISCOVERY-SNAPSHOT | ✅ |
| PIE proof consumer wired | ✅ |
| G3-02 prepared entry points | ✅ |
| **G3-02 implementation** | ⛔ Not started |
| Full registry migration | ⛔ Deferred |

---

## 10. References

| Document | Link |
|----------|------|
| EA-002 architecture | `artifacts/ea-002-canonical-registry-architecture.md` |
| EA-001 hardcode audit | `artifacts/architecture-hardcode-governance-audit.md` |
| G3 discovery pattern | `artifacts/g3-architecture-dynamic-market-discovery-executive-audit.md` |
| Registry module | `backend/src/registry/` |

---

*EA-003 Registry Loader Foundation · 2026-07-02 · G3-02 not started*
