# EA-002 — Canonical Registry Architecture

**Mission:** EA-002 — Registry Architecture Consolidation  
**Authority:** Grand King Architecture Directive · EA-001 Hardcode Governance Audit  
**Date:** 2026-07-02  
**Status:** **COMPLETE**  
**Scope:** Unified registry hierarchy · **No implementation modified**

---

## Executive Summary

EA-001 found that EmpireAI already operates **40+ registry-like artifacts** across backend, cockpit, and governance docs — but they are **fragmented**, **partially duplicated**, and **inconsistently consumed**. EA-002 does **not** propose adding more registries. It defines **one canonical hierarchy** with **twenty domain registries**, shared cross-cutting mechanics, and a single extension rule:

> **Every future capability is added by extending a registry row, plugin manifest, or workspace profile — never by editing engine business logic.**

The architecture organizes registries into **five tiers** (Constitutional → Platform Catalog → Deployment → Workspace → Runtime Derivation). Upper tiers are King-governed and versioned; lower tiers are workspace-scoped or computed at runtime from upper tiers plus activation state.

**Primary outcome:** A developer or agent can answer “where does this business assumption live?” with exactly one registry ID and one loader path.

---

## 1. Design Principles

| # | Principle | Implication |
|---|-----------|-------------|
| P1 | **Single source of truth** | Each business fact exists in exactly one authoritative registry |
| P2 | **Read, don’t copy** | Engines, evaluators, and UI loaders consume registries; duplication is a defect |
| P3 | **Tier separation** | Constitutional ≠ deployment ≠ workspace ≠ runtime state |
| P4 | **Append to extend** | New country, marketplace, engine, or policy = new row + version bump |
| P5 | **Derived over duplicated** | Live/future flags, health bands, and activation gates are **computed** from registries + env/DB |
| P6 | **Plugins register, never patch** | Third-party and future adapters extend via manifest hooks into Platform Catalog tier |
| P7 | **Overrides are explicit** | King, deployment, and workspace overrides are auditable events — not silent code edits |
| P8 | **No new registries without EA review** | Consolidation first; split only when lifecycle or ownership genuinely differs |

---

## 2. Unified Registry Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TIER 0 — CONSTITUTIONAL                                                    │
│ REG-DOCTRINE · REG-BUSINESS-RULES                                         │
│ Immutable / versioned · Grand King authority                              │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ constrains
┌───────────────────────────────▼─────────────────────────────────────────┐
│ TIER 1 — PLATFORM GEOGRAPHY & COMMERCE CATALOG                             │
│ REG-REGION · REG-COUNTRY · REG-MARKETPLACE · REG-SUPPLIER                 │
│ Global expansion catalog · append-only rows                                │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ referenced by
┌───────────────────────────────▼─────────────────────────────────────────┐
│ TIER 2 — INTEGRATION & DEPLOYMENT                                          │
│ REG-PROVIDER · REG-INTEGRATION · REG-CHANNEL · REG-DEPLOYMENT-PROFILE   │
│ What this EmpireAI deployment activates for V1/V2                        │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ scoped by
┌───────────────────────────────▼─────────────────────────────────────────┐
│ TIER 3 — POLICY & TOPOLOGY                                                 │
│ REG-SCORING-POLICY · REG-PRICING-POLICY · REG-AI-ENGINE · REG-WORKFLOW    │
│ How the platform thinks and routes work                                  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ instantiated per
┌───────────────────────────────▼─────────────────────────────────────────┐
│ TIER 4 — WORKSPACE & CATALOG                                               │
│ REG-TENANT · REG-COMPANY · REG-BRAND · REG-CATEGORY · REG-PRODUCT         │
│ Tenant-owned commercial entities                                           │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ projects to
┌───────────────────────────────▼─────────────────────────────────────────┐
│ TIER 5 — RUNTIME DERIVATION (not registries — computed views)              │
│ ActivationSnapshot · DiscoverySnapshot · ReadinessSnapshot · HealthView   │
│ Built by RegistryLoader from tiers 0–4 + env + Brain DB                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.1 RegistryLoader (conceptual — not implemented in EA-002)

All consumers call **one facade**:

```
RegistryLoader.resolve(context, registryId, query?) → RegistrySnapshot | Row[]
```

| Context field | Purpose |
|---------------|---------|
| `workspaceId` | Tenant/workspace scope for tier-4 registries |
| `companyId` | Company scope for products/brands/policies |
| `deploymentProfileId` | e.g. `v1-production`, `sandbox` |
| `overrideStack` | Ordered King → deployment → workspace overrides |

**Forbidden:** Importing `*-registry-data.ts` directly from engine modules (except the loader implementation itself).

---

## 3. Cross-Cutting Mechanics

### 3.1 Ownership model

| Owner | Scope | Approval |
|-------|-------|----------|
| **Grand King** | Doctrine, deployment profiles, scoring/pricing policy defaults, engine topology | `EMPIREAI_DECISIONS.md` ADR entry |
| **Platform Architect** | Platform catalog rows (country, marketplace, provider) | Architecture review + EA gate |
| **Guardian / GVD** | Business rules bound to modules | Doctrine amendment process |
| **Workspace Admin** | Tenant, company, brand, product, workspace policy overrides | Audited via Brain |
| **System** | Runtime derivation, cache invalidation | Automated |

### 3.2 Lifecycle (all registries)

```
DRAFT → REVIEW → APPROVED → ACTIVE → DEPRECATED → RETIRED
```

| State | Meaning |
|-------|---------|
| **DRAFT** | Row exists in dev/staging seed only |
| **REVIEW** | Pending King or architect sign-off |
| **APPROVED** | Governance doc updated; not yet active in production deployment profile |
| **ACTIVE** | Included in active deployment profile or workspace |
| **DEPRECATED** | Readable; no new bindings; migration path documented |
| **RETIRED** | Hidden from discovery; historical audit only |

Version stamp: `{registryId}@{semver}+{contentHash}` on every snapshot.

### 3.3 Runtime loading strategies

| Strategy | Registries | Mechanism |
|----------|------------|-----------|
| **STATIC_SEED** | Region, Country, Marketplace catalog, Provider catalog, Doctrine | Bundled TS/JSON at build; hot-reload in dev via file watch (future) |
| **STATIC_DEPLOYMENT** | Channel, Deployment Profile | Deployment bundle selected by `EMPIRE_DEPLOYMENT_PROFILE` env |
| **DATABASE** | Tenant, Company, Brand, Category, Product | Brain SQLite tables; workspace-scoped queries |
| **COMPOSITE** | Integration (provider + activation), Discovery views | Loader joins STATIC + DB + env |
| **GOVERNANCE_MIRROR** | Business Rules, Scoring Policy defaults | Markdown/YAML in `docs/governance/` mirrored to runtime seed on deploy |

### 3.4 Caching

| Cache tier | TTL | Invalidation |
|------------|-----|--------------|
| **Immutable platform snapshot** | Process lifetime | Deploy / registry version bump |
| **Deployment snapshot** | Process lifetime | `EMPIRE_DEPLOYMENT_PROFILE` change |
| **Workspace catalog** | 60s default (configurable) | Product/brand CRUD event |
| **Policy snapshot** | 5m | Policy version bump or King override event |
| **Derived discovery** | 30s | Channel activation or credential state change |

Cache key: `{registryId}:{version}:{workspaceId}:{deploymentProfileId}`.

**Rule:** Engines cache **snapshots**, not individual rows copied into module constants.

### 3.5 Override rules (precedence high → low)

1. **King emergency override** — single-row patch in Brain `registry_override` table; audited; expires unless renewed  
2. **Deployment profile overlay** — e.g. V1 production activates subset of marketplace catalog  
3. **Workspace policy override** — company-level scoring/pricing policy pointer  
4. **Canonical registry row** — platform default  

Overrides may **narrow** activation (disable channel) or **replace policy parameters** (thresholds). Overrides may **not** violate REG-DOCTRINE immutable articles.

### 3.6 Future plugin support

| Mechanism | Tier | Contract |
|-----------|------|----------|
| **ProviderPlugin** | REG-PROVIDER | Manifest: `providerId`, capabilities, auth schema, rate limits |
| **MarketplacePlugin** | REG-MARKETPLACE | Extends platform family; links to RuntimePluginRegistry |
| **SupplierPlugin** | REG-SUPPLIER | Adapter template + credential schema |
| **EnginePlugin** | REG-AI-ENGINE | Registers engine node + Brain module binding |
| **WorkflowPlugin** | REG-WORKFLOW | Declares step template + gate policy refs |
| **PolicyPackPlugin** | REG-SCORING-POLICY / REG-PRICING-POLICY | Versioned JSON pack; Guardian validation hook |

Registration path: `RegistryLoader.registerPlugin(manifest)` at startup → validates against schema → appends to in-memory index → persists manifest hash to Brain.

**V1 rule:** Plugins may **register rows**; they may not **replace** constitutional or doctrine registries.

---

## 4. Domain Registry Specifications

Each section follows: **Registry ID · Tier · Purpose · Current sources · Ownership · Lifecycle · Dependencies · Runtime loading · Caching · Overrides · Plugins**

---

### 4.1 REG-REGION

| Field | Value |
|-------|-------|
| **Tier** | 1 — Platform Geography |
| **Purpose** | Macro geography grouping for commerce expansion |
| **Canonical key** | `regionId` (e.g. `apac`, `americas`, `emea`) |
| **Current sources** | `runtime/global-commerce/data/global-commerce-registry-data.ts` → `GLOBAL_REGIONS` |
| **Ownership** | Platform Architect; major splits require King acknowledgment |
| **Lifecycle** | New regions rare; APPROVED → ACTIVE via catalog version bump |
| **Dependencies** | REG-DOCTRINE (expansion doctrine) |
| **Runtime loading** | STATIC_SEED |
| **Caching** | Immutable platform snapshot |
| **Overrides** | None at workspace level |
| **Plugins** | None; regions are platform-defined |

---

### 4.2 REG-COUNTRY

| Field | Value |
|-------|-------|
| **Tier** | 1 — Platform Geography |
| **Purpose** | ISO country commerce profile: currency, languages, enabled domains |
| **Canonical key** | `countryCode` (ISO 3166-1 alpha-2) |
| **Current sources** | `GLOBAL_COUNTRIES`; intelligence baselines in `global-commerce-intelligence/data/country-intelligence-seed-data.ts`; infrastructure deps in `global-commerce-infrastructure/data/infrastructure-seed-data.ts` |
| **Ownership** | Platform Architect (catalog); King (intelligence baselines) |
| **Lifecycle** | Append country row → REVIEW → ACTIVE; intelligence baselines versioned separately |
| **Dependencies** | REG-REGION |
| **Runtime loading** | STATIC_SEED (+ optional DB overlay for intelligence baselines) |
| **Caching** | Immutable platform snapshot; intelligence overlay 5m |
| **Overrides** | Workspace may set **primary market** pointer (not alter ISO catalog) |
| **Plugins** | CountryPlugin (future): extends `commerceDomains[]` only |

---

### 4.3 REG-MARKETPLACE

| Field | Value |
|-------|-------|
| **Tier** | 1 — Platform Commerce Catalog |
| **Purpose** | Country × platform marketplace identity (expansion catalog) |
| **Canonical key** | `providerId` / `marketplaceRegistryId` (e.g. `lazada-sg`, `amazon-us`) |
| **Current sources** | `GLOBAL_MARKETPLACE_PROVIDERS`; family enum in `global-marketplace-operations/models/country-marketplace-operations.ts`; publish adapters in `marketplace-publishing/models/marketplace-adapter.ts` |
| **Ownership** | Platform Architect |
| **Lifecycle** | Append row for new country/platform; adapter linkage in REG-PROVIDER |
| **Dependencies** | REG-COUNTRY, REG-PROVIDER (optional `realityProviderId`) |
| **Runtime loading** | STATIC_SEED |
| **Caching** | Immutable platform snapshot |
| **Overrides** | Deployment profile activates subset; workspace cannot invent marketplace IDs |
| **Plugins** | **MarketplacePlugin** — registers row + adapter manifest |

---

### 4.4 REG-CHANNEL

| Field | Value |
|-------|-------|
| **Tier** | 2 — Integration & Deployment |
| **Purpose** | Operational channel identity: marketplace, storefront, or supplier-facing channel |
| **Canonical key** | `registryId` (e.g. `amazon-us`, `shopify`, `cj-dropshipping`) |
| **Current sources** | `intelligence/shared/marketplace-channel-registry.ts`; governance `docs/governance/V1_MARKETPLACE_CHANNEL_REGISTRY.md` |
| **Ownership** | Grand King (V1 mandatory channels); Platform Architect (expansion channels) |
| **Lifecycle** | DRAFT → King APPROVED for mandatory_live → ACTIVE in deployment profile |
| **Dependencies** | REG-MARKETPLACE or REG-SUPPLIER, REG-DEPLOYMENT-PROFILE |
| **Runtime loading** | STATIC_DEPLOYMENT (filtered view of channel definitions) |
| **Caching** | Deployment snapshot |
| **Overrides** | Deployment profile enables/disables channel; King override for emergency disable |
| **Plugins** | Channel binds to ProviderPlugin; no orphan channels |

**Discovery chain (mandatory consumer pattern):**

```
REG-CHANNEL → REG-COUNTRY → REG-MARKETPLACE → (workspace) REG-PRODUCT
```

Reference: `intelligence-market-discovery.ts` (G3 pattern).

---

### 4.5 REG-SUPPLIER

| Field | Value |
|-------|-------|
| **Tier** | 1 — Platform Commerce Catalog |
| **Purpose** | Fulfilment supplier platform definitions |
| **Canonical key** | `supplierId` (e.g. `cj-dropshipping`, `aliexpress`) |
| **Current sources** | `GLOBAL_SUPPLIER_PROVIDERS`; `suppliers/supplier-connector-framework/adapters/supplier-adapter-registry.ts`; `connectors/catalog.ts` |
| **Ownership** | Platform Architect; V1 sole supplier requires King ADR |
| **Lifecycle** | Adapter template + channel row in REG-CHANNEL for activation |
| **Dependencies** | REG-PROVIDER |
| **Runtime loading** | STATIC_SEED + adapter registry COMPOSITE |
| **Caching** | Immutable + adapter manifest cache |
| **Overrides** | Deployment profile selects V1 supplier(s) |
| **Plugins** | **SupplierPlugin** — credential schema + adapter class registration |

---

### 4.6 REG-PRODUCT

| Field | Value |
|-------|-------|
| **Tier** | 4 — Workspace Catalog |
| **Purpose** | Workspace product catalog instances (PIE, launch commander, portfolio) |
| **Canonical key** | `productId` (UUID) scoped by `workspaceId` + `companyId` |
| **Current sources** | Brain `product_intelligence_catalog`; PIE `catalog-repository.ts`; portfolio services |
| **Ownership** | Workspace Admin / Commerce runtime |
| **Lifecycle** | discovered → scored → ranked → monitored → archived (states from REG-SCORING-POLICY lifecycle gates) |
| **Dependencies** | REG-CATEGORY, REG-BRAND, REG-CHANNEL (source signals), REG-SCORING-POLICY |
| **Runtime loading** | DATABASE |
| **Caching** | Workspace 60s; invalidate on evaluate/persist |
| **Overrides** | Manual King approval flags on individual SKUs (audit table) |
| **Plugins** | ProductEnrichmentPlugin — adds signal dimensions; cannot change core schema |

---

### 4.7 REG-BRAND

| Field | Value |
|-------|-------|
| **Tier** | 4 — Workspace Catalog |
| **Purpose** | Brand / storefront identity for DTC and premium routing |
| **Canonical key** | `brandId` scoped by `companyId` |
| **Current sources** | Scattered in commerce-intelligence creative service; demo `Nova Home` in cockpit `*DemoData.ts` (not authoritative) |
| **Ownership** | Workspace Admin |
| **Lifecycle** | Created with company; linked to REG-CHANNEL (`shopify` storefront pattern) |
| **Dependencies** | REG-COMPANY, REG-CHANNEL |
| **Runtime loading** | DATABASE (target); demo files excluded from live loader |
| **Caching** | Workspace 60s |
| **Overrides** | None |
| **Plugins** | BrandSurfacePlugin — Shopify theme/store bindings |

---

### 4.8 REG-CATEGORY

| Field | Value |
|-------|-------|
| **Tier** | 4 — Workspace Catalog (taxonomy) |
| **Purpose** | Product taxonomy and route-heuristic grouping |
| **Canonical key** | `categoryId` or normalized slug |
| **Current sources** | Hardcoded in `product-fit-service.ts` (accessory/kitchen/appliance); demo intelligence data |
| **Ownership** | Platform Architect (global taxonomy seed); Workspace Admin (custom categories) |
| **Lifecycle** | Global taxonomy ACTIVE; workspace extensions APPROVED automatically unless Guardian flags |
| **Dependencies** | REG-SCORING-POLICY (route rules may reference category) |
| **Runtime loading** | STATIC_SEED (global) + DATABASE (workspace extensions) |
| **Caching** | Platform immutable + workspace 60s |
| **Overrides** | Workspace category mapping overlay |
| **Plugins** | CategoryExtensionPlugin — adds attributes, not duplicate slugs |

---

### 4.9 REG-PRICING-POLICY

| Field | Value |
|-------|-------|
| **Tier** | 3 — Policy & Topology |
| **Purpose** | Margin floors, fee models, currency rules, marketplace fee placeholders |
| **Canonical key** | `policyId` + `version` |
| **Current sources** | Implicit in scoring/commerce-readiness; tax/fee notes in `V1_MARKETPLACE_CHANNEL_REGISTRY.md` dimensions |
| **Ownership** | Grand King (defaults); Workspace Admin (company policy pointer) |
| **Lifecycle** | King APPROVED versions; old versions DEPRECATED not deleted |
| **Dependencies** | REG-MARKETPLACE (fee model per platform), REG-COUNTRY (tax jurisdiction) |
| **Runtime loading** | GOVERNANCE_MIRROR + DATABASE overrides |
| **Caching** | Policy snapshot 5m |
| **Overrides** | Workspace → company policy pointer; King global default always fallback |
| **Plugins** | **PolicyPackPlugin** for marketplace-specific fee tables |

---

### 4.10 REG-SCORING-POLICY

| Field | Value |
|-------|-------|
| **Tier** | 3 — Policy & Topology |
| **Purpose** | Sell/reject thresholds, health bands, readiness gates, lifecycle stage boundaries |
| **Canonical key** | `policyPackId` (e.g. `pie-default`, `supplier-guard`, `cockpit-health`) |
| **Current sources** | `product-intelligence-engine/recommendation-engine.ts`; `supplier-guard.ts`; `commerce-readiness-evaluator.ts`; `objective-management-service.ts`; duplicated `>= 70` in cockpit |
| **Ownership** | Grand King |
| **Lifecycle** | Versioned; Guardian validates against REG-BUSINESS-RULES |
| **Dependencies** | REG-BUSINESS-RULES, REG-DOCTRINE |
| **Runtime loading** | GOVERNANCE_MIRROR |
| **Caching** | Policy snapshot 5m |
| **Overrides** | Workspace policy pointer (narrower thresholds only with King approval) |
| **Plugins** | PolicyPackPlugin — adds dimension weights; must declare `policyPackId` |

**EA-001 consolidation target:** Replace 12+ duplicated threshold sites with `RegistryLoader.resolve('REG-SCORING-POLICY', { pack: 'pie-default' })`.

---

### 4.11 REG-AI-ENGINE

| Field | Value |
|-------|-------|
| **Tier** | 3 — Policy & Topology |
| **Purpose** | Executive AI engine topology: IDs, routes, Brain modules, integration edges |
| **Canonical key** | `engineId` |
| **Current sources** | `domain/services/cockpit-panel-views.ts` → `COCKPIT_ENGINE_IDS`; `executive-dashboard-integration.ts` → `V1_ENGINE_IDS`, `V1_DEPENDENCY_EDGES`; `engine-center-views.ts`; G3 integration map |
| **Ownership** | Grand King (V1 spine); Platform Architect (expansion engines) |
| **Lifecycle** | New engine → APPROVED → ACTIVE; edges versioned with graph semver |
| **Dependencies** | REG-DOCTRINE (module boundaries GVD-007+), REG-WORKFLOW |
| **Runtime loading** | STATIC_SEED (target single `engine-topology-registry.json`) |
| **Caching** | Immutable platform snapshot |
| **Overrides** | Deployment may hide engines not in profile; cannot add engines without registry row |
| **Plugins** | **EnginePlugin** — registers node, route, Brain module, capability list |

---

### 4.12 REG-WORKFLOW

| Field | Value |
|-------|-------|
| **Tier** | 3 — Policy & Topology |
| **Purpose** | Multi-step business workflows: launch pipeline, PROOF critical path, credential missions |
| **Canonical key** | `workflowId` + `version` |
| **Current sources** | `product-launch-commander-service.ts` → `LAUNCH_STEPS`; `objective-default-objectives.ts` → PROOF-001 path; `b6-credential-implementation.ts` |
| **Ownership** | Grand King (executive missions); Platform Architect (operational workflows) |
| **Lifecycle** | Mission workflows require King ADR; steps reference REG-SCORING-POLICY gates |
| **Dependencies** | REG-AI-ENGINE, REG-SCORING-POLICY, REG-CHANNEL |
| **Runtime loading** | GOVERNANCE_MIRROR + STATIC_SEED |
| **Caching** | Immutable per version |
| **Overrides** | Workspace cannot alter PROOF/SUCCESS paths; may add company sub-workflows |
| **Plugins** | **WorkflowPlugin** — appends steps; cannot remove King-mandated gates |

---

### 4.13 REG-BUSINESS-RULE

| Field | Value |
|-------|-------|
| **Tier** | 0 — Constitutional (operational rules) |
| **Purpose** | Enforceable rules: launch gates, approval requirements, module boundaries |
| **Canonical key** | `ruleId` (e.g. `BR-LAUNCH-001`, GVD-bound rules) |
| **Current sources** | `commerce-readiness-engine/models/commerce-readiness.ts`; `operational-access/models/approval-boundary.ts`; Guardian risk registry |
| **Ownership** | Guardian + Grand King |
| **Lifecycle** | Tied to doctrine amendment or ADR |
| **Dependencies** | REG-DOCTRINE |
| **Runtime loading** | COMPOSITE (doctrine + Guardian registry) |
| **Caching** | Immutable until version bump |
| **Overrides** | **Forbidden** except documented King whitelist (GVD-019) |
| **Plugins** | RulesPlugin — proposes rules; activation requires King approval |

---

### 4.14 REG-TENANT

| Field | Value |
|-------|-------|
| **Tier** | 4 — Workspace |
| **Purpose** | Platform tenant / workspace identity and defaults |
| **Canonical key** | `workspaceId` |
| **Current sources** | Hardcoded `ws_empire_1`; Brain workspace tables; `foundation/identity-registry` |
| **Ownership** | Grand King (platform owner workspace); System (provisioned tenants) |
| **Lifecycle** | Provisioned → ACTIVE → SUSPENDED → RETIRED |
| **Dependencies** | REG-DEPLOYMENT-PROFILE |
| **Runtime loading** | DATABASE |
| **Caching** | 60s; invalidate on settings change |
| **Overrides** | Primary market, default company, policy pointers |
| **Plugins** | TenantProvisionerPlugin — SaaS multi-tenant (future) |

---

### 4.15 REG-COMPANY

| Field | Value |
|-------|-------|
| **Tier** | 4 — Workspace |
| **Purpose** | Commercial company entity under tenant |
| **Canonical key** | `companyId` |
| **Current sources** | Hardcoded `co-grand-king`; Brain company tables; identity registry |
| **Ownership** | Workspace Admin |
| **Lifecycle** | Created → ACTIVE → ARCHIVED |
| **Dependencies** | REG-TENANT, REG-BRAND |
| **Runtime loading** | DATABASE |
| **Caching** | Workspace 60s |
| **Overrides** | Commerce profile pointer (channels, supplier preferences) |
| **Plugins** | None |

---

### 4.16 REG-PROVIDER

| Field | Value |
|-------|-------|
| **Tier** | 2 — Integration & Deployment |
| **Purpose** | Reality integration provider: auth, capabilities, rate limits, adapter binding |
| **Canonical key** | `providerId` |
| **Current sources** | `orchestration/reality-integration/models/provider-catalog.ts`; `amazon-marketplace-profiles.ts`; `connectors/catalog.ts` |
| **Ownership** | Platform Architect |
| **Lifecycle** | ProviderPlugin registration → REVIEW → ACTIVE |
| **Dependencies** | REG-MARKETPLACE (commerce providers) |
| **Runtime loading** | STATIC_SEED + plugin index COMPOSITE |
| **Caching** | Immutable + plugin manifest |
| **Overrides** | Env credential presence (not provider definition) |
| **Plugins** | **ProviderPlugin** (primary extension point) |

---

### 4.17 REG-INTEGRATION

| Field | Value |
|-------|-------|
| **Tier** | 2 — Integration & Deployment |
| **Purpose** | Integrations Hub presentation + operational access view of providers |
| **Canonical key** | `integrationId` |
| **Current sources** | `operational-access/integrations-hub/models/integrations-hub-catalog.ts`; `empire-platform-catalog.ts`; `operational-access-registry-service.ts` |
| **Ownership** | Platform Architect |
| **Lifecycle** | **Derived** from REG-PROVIDER + activation state; live/future flags not manually duplicated |
| **Dependencies** | REG-PROVIDER, REG-DEPLOYMENT-PROFILE, runtime activation |
| **Runtime loading** | COMPOSITE (derived view) |
| **Caching** | 30s derived snapshot |
| **Overrides** | Display order per workspace (cosmetic only) |
| **Plugins** | Auto-listed when ProviderPlugin registers |

**Rule:** REG-INTEGRATION is a **view registry**, not a second provider catalog.

---

### 4.18 REG-DEPLOYMENT-PROFILE

| Field | Value |
|-------|-------|
| **Tier** | 2 — Integration & Deployment |
| **Purpose** | Which platform rows this EmpireAI instance activates (V1 production, sandbox, etc.) |
| **Canonical key** | `deploymentProfileId` (e.g. `v1-production`) |
| **Current sources** | `marketplace-channel-registry.ts`; `version-1-activation-config.ts`; `V1_MARKETPLACE_CHANNEL_REGISTRY.md`; `VERSION_1_GO_LIVE_PREPARATION_CHECKLIST.md` |
| **Ownership** | Grand King |
| **Lifecycle** | APPROVED by ADR → ACTIVE on Railway/Vercel via env |
| **Dependencies** | REG-CHANNEL, REG-SCORING-POLICY (defaults), REG-WORKFLOW (missions) |
| **Runtime loading** | STATIC_DEPLOYMENT selected by `EMPIRE_DEPLOYMENT_PROFILE` |
| **Caching** | Deployment snapshot (process lifetime) |
| **Overrides** | None — use different profile ID for different deployment |
| **Plugins** | DeploymentProfileExtension — adds channel IDs to existing profile with King approval |

**EA-001 consolidation target:** `V1_PRODUCTION_MARKETPLACE_IDS` and live-commerce lists become **views** of this registry.

---

### 4.19 REG-DOCTRINE

| Field | Value |
|-------|-------|
| **Tier** | 0 — Constitutional |
| **Purpose** | Immutable governance doctrine and executive intelligence charter |
| **Canonical key** | `doctrineId` (GVD-*, EI*, ADR-*) |
| **Current sources** | `foundation/empire-governance-doctrine/catalog/gvd-catalog.ts`; `docs/governance/*.md`; `EMPIREAI_DECISIONS.md` |
| **Ownership** | Grand King |
| **Lifecycle** | Versioned amendment only; prior versions RETIRED not deleted |
| **Dependencies** | None (root) |
| **Runtime loading** | STATIC_SEED mirrored from governance docs |
| **Caching** | Immutable |
| **Overrides** | **Forbidden** |
| **Plugins** | **Forbidden** |

---

## 5. Dependency Graph (Registry → Registry)

```
REG-DOCTRINE
    └── REG-BUSINESS-RULE
            └── REG-SCORING-POLICY ──┬── REG-AI-ENGINE
            └── REG-PRICING-POLICY   │
                                     └── REG-WORKFLOW

REG-REGION
    └── REG-COUNTRY
            └── REG-MARKETPLACE
                    └── REG-PROVIDER
                            └── REG-INTEGRATION (derived)
                            └── REG-SUPPLIER
                                    └── REG-CHANNEL
                                            └── REG-DEPLOYMENT-PROFILE

REG-DEPLOYMENT-PROFILE + REG-TENANT
    └── REG-COMPANY
            ├── REG-BRAND
            ├── REG-CATEGORY
            └── REG-PRODUCT
```

---

## 6. Migration Map — Existing Artifacts → Canonical Registry

| Existing artifact | Target registry | Action |
|-------------------|-----------------|--------|
| `global-commerce-registry-data.ts` | REG-REGION, REG-COUNTRY, REG-MARKETPLACE, REG-SUPPLIER (catalog slice) | **Keep as seed**; access only via loader |
| `marketplace-channel-registry.ts` | REG-CHANNEL + REG-DEPLOYMENT-PROFILE | Merge channel rows under deployment profile |
| `provider-catalog.ts` | REG-PROVIDER | Keep; dedupe with connectors/catalog |
| `integrations-hub-catalog.ts` | REG-INTEGRATION | **Convert to derived view** |
| `empire-platform-catalog.ts` | REG-INTEGRATION | Merge into derived view |
| `version-1-activation-config.ts` | REG-DEPLOYMENT-PROFILE | Remove duplicated ID lists |
| `recommendation-engine.ts` thresholds | REG-SCORING-POLICY | Extract policy pack |
| `executive-dashboard-integration.ts` V1_ENGINE_IDS | REG-AI-ENGINE | Single topology seed |
| `cockpit-panel-views.ts` COCKPIT_ENGINE_IDS | REG-AI-ENGINE | Read topology |
| `product-launch-commander LAUNCH_STEPS` | REG-WORKFLOW | Extract workflow `launch-v1` |
| `objective-default-objectives.ts` | REG-WORKFLOW | Extract `proof-001` |
| `gvd-catalog.ts` | REG-DOCTRINE | Authoritative runtime mirror |
| `identity-registry` | REG-TENANT / REG-COMPANY | Align canonical IDs |
| `runtime-plugin-registry.ts` | Plugin host for REG-PROVIDER / REG-MARKETPLACE | Keep; wire to RegistryLoader |
| `intelligence-market-discovery.ts` | Tier-5 DiscoverySnapshot | **Reference derived view** |
| Cockpit `*DemoData.ts` | None (not a registry) | Demo mode only; never merged into REG-PRODUCT |

---

## 7. Extension Protocol

To add a capability **without modifying business logic**:

| Step | Action |
|------|--------|
| 1 | Identify tier and registry (use decision tree below) |
| 2 | Append row to canonical seed **or** register plugin manifest |
| 3 | Bump registry `{semver}` and update governance doc if Tier 0–2 |
| 4 | If deployment activation required → add channel ID to REG-DEPLOYMENT-PROFILE (King approval) |
| 5 | Implement **adapter/plugin** only — no engine conditionals on platform name |
| 6 | Add parity test: loader returns new row; derived views include it |
| 7 | **Do not** add literals to evaluators, panel loaders, or frontend defaults |

### 7.1 Decision tree

```
Is it immutable governance?
  YES → REG-DOCTRINE / REG-BUSINESS-RULE
Is it geography or global catalog?
  YES → REG-REGION / REG-COUNTRY / REG-MARKETPLACE / REG-SUPPLIER
Is it activated on this deployment?
  YES → REG-DEPLOYMENT-PROFILE + REG-CHANNEL
Is it how decisions are scored?
  YES → REG-SCORING-POLICY or REG-PRICING-POLICY
Is it an engine or workflow?
  YES → REG-AI-ENGINE / REG-WORKFLOW
Is it tenant-owned data?
  YES → REG-TENANT / REG-COMPANY / REG-BRAND / REG-CATEGORY / REG-PRODUCT
Is it external connectivity?
  YES → REG-PROVIDER (+ plugin); REG-INTEGRATION is derived
```

---

## 8. Tier-5 Derived Views (Not Registries)

These are **computed**; never edited directly:

| View | Inputs | Consumer |
|------|--------|----------|
| **DiscoverySnapshot** | REG-CHANNEL, REG-COUNTRY, REG-MARKETPLACE, REG-DEPLOYMENT-PROFILE | Intelligence engines, cockpit marketplace panel |
| **ActivationSnapshot** | REG-PROVIDER, env credentials, live-commerce mode | Version-1 activation, go-live gates |
| **ReadinessSnapshot** | REG-SCORING-POLICY, REG-BUSINESS-RULE, activation | Commerce readiness engine |
| **IntegrationHubView** | REG-INTEGRATION derivation | Integrations Hub UI |
| **EngineTopologyView** | REG-AI-ENGINE, health from panels | G4-05 relationship graph |
| **HealthView** | REG-SCORING-POLICY bands + engine state | Cockpit badges |

---

## 9. Governance & Compliance

| Requirement | Mechanism |
|-------------|-----------|
| No silent registry change | Version stamp + Brain audit on override |
| King approval for Tier 0–2 | ADR in `EMPIREAI_DECISIONS.md` |
| EA gate for new registry split | Architecture review — prefer row append |
| CI parity | Governance doc ↔ seed hash tests |
| Hardcode lint | Forbid platform literals outside loader paths (EA-001 §8.3) |

---

## 10. Relationship to Prior Missions

| Mission | Relationship |
|---------|--------------|
| **EA-001** | Identified fragmentation; EA-002 consolidates into hierarchy |
| **G3 dynamic discovery** | Tier-5 DiscoverySnapshot pattern — mandatory for intelligence engines |
| **ADR-052** | REG-CHANNEL + REG-DEPLOYMENT-PROFILE governance source |
| **EA-003+ (future)** | Implementation: RegistryLoader facade, policy extraction, derived REG-INTEGRATION |

---

## 11. Success Criteria

EA-002 is successful when:

1. Every business domain maps to **exactly one** canonical registry ID  
2. No new capability requires editing engine evaluators for scope/threshold/topology  
3. Existing 40+ registry-like files have a **documented migration target**  
4. Plugin extension path is defined for providers, marketplaces, engines, and workflows  
5. Override precedence is explicit and doctrine-safe  

**Implementation missions are out of scope for EA-002.** This document is the architecture authority for consolidation work.

---

*EA-002 Canonical Registry Architecture · 2026-07-02 · Architecture only · No code modified*
