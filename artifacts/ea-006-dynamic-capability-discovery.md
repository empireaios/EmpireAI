# EA-006 — Dynamic Capability Discovery

**Mission:** EA-006 — Dynamic Capability Discovery  
**Authority:** EA-002 Registry Architecture · EA-003 RegistryLoader · EA-004 Migration Standard · EA-005 Plugin Framework  
**Date:** 2026-07-02  
**Status:** **COMPLETE**  
**Scope:** Automatic capability discovery architecture · **No implementation modified**

---

## Executive Summary

Registries and plugins define what EmpireAI **can** do. **Dynamic Capability Discovery** defines how the platform **learns what is available at runtime** — without business hardcodes in engines, cockpit loaders, or frontend defaults.

EA-006 introduces the **Capability Discovery Service (CDS)** — a single facade above `RegistryLoader` and `PluginHost` that produces a unified **`CapabilityDiscoverySnapshot`**: countries, marketplaces, suppliers, providers, AI engines, workflows, and plugins — all **computed** from registry rows, deployment profiles, plugin manifests, and activation state.

**Core rule:**

> Discovery **reads** registries and plugins. It **never embeds** marketplace names, engine lists, or workflow steps.

**Current state:** `DERIVED-DISCOVERY-SNAPSHOT` (EA-003) covers countries, marketplaces, suppliers, and deployment channels only. EA-006 **generalizes** that pattern into the full CDS model — implementation deferred to EA-007+.

---

## 1. Design Principles

| # | Principle | Implication |
|---|-----------|-------------|
| D1 | **Discover, don’t declare** | Consumers call CDS; they do not import seed files or constant arrays |
| D2 | **Snapshot is derived** | No persistent “discovery database”; snapshots are computed views with cache |
| D3 | **Plugin-aware** | Enabled plugins append to discovery graph automatically |
| D4 | **Context-scoped** | Workspace + deployment profile filter what appears **available** vs **catalog** |
| D5 | **Stale-safe** | Cached snapshots carry `computedAt`, `contentHash`, `staleness`; consumers decide tolerance |
| D6 | **Partial discovery allowed** | One failed source degrades a **branch**, not the entire platform (see §8) |
| D7 | **Dispatch ≠ discovery** | Discovery may list ARCHITECTURE_ONLY capabilities; dispatch remains fail-closed (EA-005) |
| D8 | **Graph is first-class** | Dependency edges exposed for Cockpit spine, G3 engines, and readiness evaluators |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CAPABILITY DISCOVERY SERVICE (CDS)                    │
│  discover(context) · refresh(scope) · getGraph() · subscribe(scope)   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ RegistryLoader │     │ PluginHost       │     │ ActivationPlane  │
│ REG-* rows     │     │ enabled plugins  │     │ env · vault ·    │
│ derived views  │     │ capabilities     │     │ credential state │
└───────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                                │
                                ▼
                  ┌─────────────────────────────┐
                  │ CapabilityDiscoverySnapshot  │
                  │ + CapabilityDependencyGraph  │
                  └─────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
  Intelligence engines    Cockpit / Integrations    Commerce runtime
  (PIE, G3-02, QIE)       Hub · Engine centers       Launch · readiness
```

### 2.1 CDS vs RegistryLoader vs PluginHost

| Layer | Responsibility | Consumer use |
|-------|----------------|--------------|
| **RegistryLoader** | Authoritative rows and tier-5 registry derived views | CDS internal only (after migration complete) |
| **PluginHost** | Plugin lifecycle, dispatch, certification | CDS internal + dispatch path |
| **CDS** | **Unified availability model** — what exists, what’s enabled, what’s live | **All engines and UI loaders** |

**Migration rule (EA-004):** Replace `buildIntelligenceMarketDiscoverySnapshot()` call sites with `CapabilityDiscoveryService.discover()` over time; intelligence wrapper may remain as thin delegate.

---

## 3. Discovery Domains

Each domain is a **section** of `CapabilityDiscoverySnapshot` — never a hardcoded list in consumer code.

| Domain | Primary sources | Snapshot section | Availability signal |
|--------|-----------------|------------------|---------------------|
| **Countries** | REG-REGION, REG-COUNTRY | `countries[]` | Catalog: all active countries with commerce domains |
| **Marketplaces** | REG-MARKETPLACE + plugin extensions | `marketplacesByCountry{}` | Catalog + deployment filter |
| **Suppliers** | REG-SUPPLIER + plugin extensions | `suppliers[]` | Deployment channels + enabled supplier plugins |
| **Providers** | REG-PROVIDER + plugin extensions | `providers[]` | Grouped by category (commerce, payment, logistics, ads) |
| **Channels** | REG-CHANNEL, REG-DEPLOYMENT-PROFILE | `channels[]` | Activated for current deployment profile |
| **AI Engines** | REG-AI-ENGINE + ai_engine plugins | `aiEngines[]` | Topology nodes with routes and Brain modules |
| **Workflows** | REG-WORKFLOW | `workflows[]` | Declared steps + gate policy refs |
| **Plugins** | PluginHost registry | `plugins[]` | lifecycle, version, capabilities, health summary |

### 3.1 Unified discovery chain (no hardcodes)

```
Deployment Profile
  → Channels (marketplace · storefront · supplier)
    → Countries (channel country codes ∪ marketplace coverage)
      → Marketplaces (per country catalog)
        → Providers (adapter binding · realityProviderId)
          → Plugins (Layer A rows + Layer B runtime)
            → Capabilities (declared ∩ permitted ∩ certified)
              → Workflows (reference channels · engines · policies)
                → AI Engines (consume capabilities · emit evaluations)
```

This generalizes the G3 chain documented in `g3-architecture-dynamic-market-discovery-executive-audit.md`.

### 3.2 Capability record (atomic unit)

```typescript
type DiscoveredCapability = {
  capabilityId: string;
  pluginId: string | null;           // null = built-in registry only
  providerId: string | null;
  channelRegistryId: string | null;
  category: PluginCategory;
  executionMode: ExecutionMode;
  availability: "catalog" | "deployed" | "enabled" | "live";
  permissionsRequired: PermissionType[];
  irreversible: boolean;
  health: "HEALTHY" | "WARNING" | "DEGRADED" | "BLOCKED" | "UNKNOWN";
};
```

Engines filter `DiscoveredCapability[]` by `category` and `availability` — never by string-matching `"amazon-us"`.

---

## 4. CapabilityDiscoverySnapshot

```typescript
type CapabilityDiscoverySnapshot = {
  // Metadata
  snapshotId: string;
  computedAt: string;
  contentHash: string;
  schemaVersion: "cds-1";
  context: DiscoveryContext;
  staleness: StalenessInfo;

  // Domains
  countries: DiscoveredCountry[];
  marketplacesByCountry: Record<string, DiscoveredMarketplace[]>;
  suppliers: DiscoveredSupplier[];
  providers: DiscoveredProvider[];
  channels: DiscoveredChannel[];
  aiEngines: DiscoveredAiEngine[];
  workflows: DiscoveredWorkflow[];
  plugins: DiscoveredPluginSummary[];
  capabilities: DiscoveredCapability[];

  // Graph
  dependencyGraph: CapabilityDependencyGraph;

  // Diagnostics
  sources: DiscoverySourceReport[];
  failures: DiscoveryFailure[];
};
```

### 4.1 Relationship to EA-003 view

| EA-003 `DiscoverySnapshotView` field | EA-006 mapping |
|--------------------------------------|----------------|
| `countries` | `countries` |
| `marketplacesByCountry` | `marketplacesByCountry` |
| `deploymentChannels` | `channels` |
| `expansionMarketplaces` | `marketplaces` where `availability === "catalog"` only |
| `intelligenceSources` | Derived projection of `channels` + `suppliers` for intelligence engines |
| `supplierProviders` | `suppliers` |

**`intelligenceSources`** becomes a **projection helper** on CDS — not a separate hardcoded builder:

```typescript
CDS.projectIntelligenceSources(snapshot) → IntelligenceSourceDefinition[]
```

---

## 5. Discovery Lifecycle

### 5.1 Lifecycle states (snapshot)

```
                    ┌─────────────┐
         miss       │   COLD      │  no cache entry
        ──────────► │  (compute)  │
                    └──────┬──────┘
                           │ discover()
                           ▼
                    ┌─────────────┐
                    │  COMPUTING  │  sources queried in dependency order
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  FRESH   │ │ PARTIAL  │ │  FAILED  │
        │ (cached) │ │ (cached) │ │ (no cache│
        └────┬─────┘ └────┬─────┘ │  store)  │
             │            │       └──────────┘
             │ TTL expiry │            │
             ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐  consumer gets
        │  STALE   │ │ REFRESH  │  error snapshot
        │ (serve + │ │ IN_FLIGHT│  or last-good
        │  async)  │ └──────────┘
        └──────────┘
```

| State | Meaning | Consumer behaviour |
|-------|---------|-------------------|
| **COLD** | First request or cache invalidated | Synchronous compute |
| **COMPUTING** | In-flight build (per cache key) | Wait or dedupe (single-flight) |
| **FRESH** | Within TTL, all sources OK | Use snapshot |
| **PARTIAL** | Within TTL, ≥1 source failed | Use snapshot + read `failures[]` |
| **STALE** | Past TTL, last-good served | Serve cached + trigger background refresh |
| **FAILED** | Compute failed, no last-good | Fail closed for dispatch; discovery returns empty sections + errors |

### 5.2 Event-driven transitions

| Event | Action |
|-------|--------|
| `plugin.registered` | Invalidate `plugins`, `providers`, affected registry sections |
| `plugin.enabled` / `disabled` | Invalidate `plugins`, `capabilities`, `channels` availability |
| `plugin.certified` / `revoked` | Invalidate `capabilities` live flags |
| `registry.version_bump` | Invalidate all registry-backed sections |
| `credential.activated` | Invalidate ActivationPlane → `channels`, `capabilities` |
| `deployment.profile_change` | Full snapshot invalidate for context |
| `workspace.settings_change` | Invalidate workspace-scoped filters |

Events append to Brain `discovery_invalidation_log` (conceptual — implementation EA-007).

### 5.3 Discovery modes

| Mode | API | Use case |
|------|-----|----------|
| **Full** | `discover(context)` | Cockpit home, engine architecture views |
| **Scoped** | `discover(context, { scope: "marketplace" })` | Marketplace panel only |
| **Projected** | `project(snapshot, "intelligence")` | PIE / G3-02 source list |
| **Graph-only** | `getGraph(context)` | G4-05 relationship panel |

---

## 6. Cache Strategy

### 6.1 Cache layers

| Layer | Key | TTL | Invalidation |
|-------|-----|-----|--------------|
| **L1 — Snapshot** | `cds:{deploymentProfileId}:{workspaceId}:full` | 30s default | Events §5.2 |
| **L2 — Section** | `cds:{context}:section:{domain}` | Per EA-003 policy (immutable 30s derived) | Section-scoped events |
| **L3 — Graph** | `cds:{context}:graph` | 30s | Engine/plugin/registry change |
| **L4 — Last-good** | `cds:{context}:last-good` | Indefinite until replaced | Updated on every successful FRESH/PARTIAL |

### 6.2 Cache key context

```typescript
type DiscoveryContext = {
  workspaceId?: string;
  companyId?: string;
  deploymentProfileId: string;  // default v1-production
  dataMode?: "live" | "demo";   // demo excludes live activation plane
};
```

### 6.3 Single-flight deduplication

Concurrent `discover()` calls with identical cache key share one in-flight promise — prevents stampede on cold start.

### 6.4 Staleness metadata

```typescript
type StalenessInfo = {
  state: "FRESH" | "STALE" | "PARTIAL" | "FAILED";
  ageMs: number;
  ttlMs: number;
  lastGoodComputedAt: string | null;
  refreshInFlight: boolean;
};
```

**Cockpit rule:** Display staleness badge when `ageMs > ttlMs * 0.8` or `state !== FRESH`.

### 6.5 Alignment with RegistryLoader cache

CDS **does not duplicate** RegistryLoader row cache. It caches **composed snapshots** only. RegistryLoader invalidation cascades to CDS L1 invalidate via event bus.

---

## 7. Refresh

### 7.1 Refresh triggers

| Trigger | Scope | Sync/async |
|---------|-------|------------|
| **On-demand** | `refresh(context, scope?)` | Sync |
| **TTL expiry** | Full or section | Async background (serve STALE first) |
| **Invalidation event** | Targeted section | Async |
| **Scheduled** | `EMPIRE_DISCOVERY_REFRESH_INTERVAL_MS` (default 60s) | Async warm cache |
| **Pre-dispatch** | Plugin + capability | Sync mini-refresh for dispatch path only |

### 7.2 Refresh ordering

Refresh follows **dependency order** (§9) — upstream sections first:

```
1. Deployment profile + doctrine constraints
2. Registry platform catalog (countries, marketplaces, suppliers)
3. Registry providers + channels
4. Plugin registry (enabled manifests)
5. Activation plane (credentials)
6. AI engines + workflows
7. Capability merge + graph build
8. Projections (intelligence sources, integration hub)
```

### 7.3 Partial refresh

`refresh(context, { scope: "plugins" })` recomputes only plugin-dependent sections and merges into existing snapshot — avoids full cold rebuild when one plugin toggles.

### 7.4 Refresh API (conceptual)

```typescript
CapabilityDiscoveryService.discover(context): CapabilityDiscoverySnapshot;
CapabilityDiscoveryService.refresh(context, options?): RefreshResult;
CapabilityDiscoveryService.subscribe(context, scope, callback): Unsubscribe;
```

---

## 8. Failure Behaviour

### 8.1 Failure taxonomy

| Code | Source failure | Discovery impact | Dispatch impact |
|------|----------------|------------------|-----------------|
| `SRC_REGISTRY_UNWIRED` | Placeholder registry | Empty section + notice | N/A |
| `SRC_REGISTRY_ERROR` | Loader throw | PARTIAL; section empty | Fail closed if dispatch needs row |
| `SRC_PLUGIN_HOST_ERROR` | PluginHost unavailable | `plugins[]` empty; capabilities from built-in only | Block plugin dispatch |
| `SRC_ACTIVATION_ERROR` | Credential probe failed | Channels show `availability: deployed` not `live` | Fail closed for LIVE |
| `SRC_GRAPH_CYCLE` | Dependency cycle detected | PARTIAL; graph omitted | Warning in Cockpit |
| `SRC_TIMEOUT` | Source exceeded budget | PARTIAL; failed section stale or empty | Use last-good if available |

### 8.2 Fail-open vs fail-closed

| Concern | Policy |
|---------|--------|
| **Discovery listing** | **Fail partial-open** — return last-good or empty section with `failures[]`; never fabricate capabilities |
| **Live dispatch** | **Fail closed** (EA-005 E6) — no capability dispatch on FAILED or BLOCKED |
| **Intelligence scoring** | **Fail closed** — missing supplier/marketplace source → reduce confidence, do not invent sources |
| **Cockpit display** | **Fail visible** — show degradation badge + `failures[0].message` |
| **Demo mode** | **Fail isolated** — demo data never mixed into live snapshot (`dataMode: demo` separate cache key) |

### 8.3 Last-good fallback

If compute fails but L4 last-good exists:

- Return last-good snapshot with `staleness.state = FAILED` and `failures[]` populated  
- Log Brain audit: `discovery_fallback_last_good`  
- Do **not** update last-good on failed compute  

### 8.4 Source timeout budget

| Source | Default budget |
|--------|----------------|
| RegistryLoader (all wired registries) | 200ms |
| PluginHost list + health | 300ms |
| Activation plane probe | 500ms |
| Full snapshot | 1000ms hard cap |

Exceeded → `SRC_TIMEOUT` for slow source; other sections still computed.

### 8.5 Health aggregation

```typescript
type DiscoveryHealth = "HEALTHY" | "DEGRADED" | "CRITICAL" | "UNKNOWN";

// HEALTHY: all sources OK, FRESH
// DEGRADED: PARTIAL or STALE
// CRITICAL: FAILED with no last-good
// UNKNOWN: first cold start in progress
```

Exposed on Cockpit command strip and G4-05 graph panel header.

---

## 9. Dependency Graph

### 9.1 Graph model

```typescript
type CapabilityDependencyGraph = {
  nodes: CapabilityGraphNode[];
  edges: CapabilityGraphEdge[];
  schemaVersion: string;
  computedAt: string;
};

type CapabilityGraphNode = {
  nodeId: string;
  nodeKind: "country" | "marketplace" | "supplier" | "provider" | "channel" |
            "plugin" | "ai_engine" | "workflow" | "capability";
  label: string;
  availability: string;
  registryRef: string | null;   // e.g. REG-MARKETPLACE:amazon-us
  pluginId: string | null;
};

type CapabilityGraphEdge = {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  relationship: "contains" | "deploys" | "binds" | "feeds" | "consumes" |
                "requires" | "gates" | "extends";
};
```

### 9.2 Canonical edges (auto-generated)

| From | To | Relationship | Source |
|------|-----|--------------|--------|
| Country | Marketplace | `contains` | REG-MARKETPLACE.countryCode |
| Marketplace | Provider | `binds` | providerId / realityProviderId |
| Provider | Plugin | `extends` | PluginHost Layer A |
| Deployment Profile | Channel | `deploys` | REG-DEPLOYMENT-PROFILE |
| Channel | Marketplace / Supplier | `binds` | REG-CHANNEL |
| Supplier | Capability | `feeds` | fulfilment capabilities |
| AI Engine | Capability | `consumes` | REG-AI-ENGINE integrations |
| AI Engine | AI Engine | `feeds` | REG-AI-ENGINE topology (replaces V1_DEPENDENCY_EDGES hardcode) |
| Workflow | Channel / Engine | `requires` | REG-WORKFLOW steps |
| Workflow | Policy | `gates` | REG-SCORING-POLICY refs |
| Plugin | Capability | `extends` | manifest capabilities |

### 9.3 Graph build algorithm

```
1. Load REG-COUNTRY, REG-MARKETPLACE, REG-SUPPLIER, REG-PROVIDER, REG-CHANNEL rows
2. Merge plugin registry extensions (enabled plugins only for deploy graph)
3. Load REG-AI-ENGINE, REG-WORKFLOW rows (when wired)
4. Add PluginHost nodes for ENABLED + REGISTERED plugins
5. Add capability nodes; link to plugin or built-in provider
6. Apply ActivationPlane: upgrade availability deployed → live where creds OK
7. Validate DAG; if cycle → SRC_GRAPH_CYCLE, emit maximal acyclic subset
8. Emit graph + index by nodeKind for Cockpit queries
```

### 9.4 Consumer queries

```typescript
CDS.getGraph(context).nodes.filter(n => n.nodeKind === "ai_engine");
CDS.getGraph(context).edges.filter(e => e.relationship === "feeds");
CDS.resolvePath(context, { from: "cj-dropshipping", to: "product-intelligence-engine" });
```

Replaces hardcoded `V1_DEPENDENCY_EDGES` in `executive-dashboard-integration.ts` when REG-AI-ENGINE migrates (EA-004 W3).

---

## 10. Source Integration Map

| Discovery section | RegistryLoader | PluginHost | ActivationPlane | Status EA-006 |
|-------------------|----------------|------------|-----------------|---------------|
| Countries | REG-COUNTRY | extensions | — | **Designed** (partial impl EA-003) |
| Marketplaces | REG-MARKETPLACE | extensions | — | **Designed** |
| Suppliers | REG-SUPPLIER | extensions | — | **Designed** |
| Providers | REG-PROVIDER | extensions | credential schema | **Designed** (placeholder REG) |
| Channels | REG-CHANNEL | — | live flags | **Designed** |
| AI Engines | REG-AI-ENGINE | ai_engine plugins | — | **Designed** (placeholder REG) |
| Workflows | REG-WORKFLOW | workflow plugins | — | **Designed** (placeholder REG) |
| Plugins | — | full | health | **Designed** |
| Capabilities | derived | derived | permission + cert | **Designed** |

**ActivationPlane** (conceptual component): joins env credential probes, `version-1-activation-config`, and OAR grant state — feeds `availability: live` without hardcoding `amazon-us`.

---

## 11. Consumer Migration (EA-004 alignment)

| Consumer | Current | Target |
|----------|---------|--------|
| `intelligence-market-discovery.ts` | `RegistryLoader.resolveDerivedView(DERIVED-DISCOVERY-SNAPSHOT)` | `CDS.discover()` + `projectIntelligenceSources()` |
| `engine-architecture.ts` (PIE) | via intelligence-market-discovery | CDS projection |
| G3-02 Market Intelligence | `buildMarketIntelligenceDiscoveryView()` | `CDS.discover()` + engine-specific projection |
| `cockpit-panel-views.ts` marketplace panel | Amazon hardcodes | `CDS.discover({ scope: "channels" })` |
| `executive-dashboard-integration.ts` | `V1_DEPENDENCY_EDGES` | `CDS.getGraph()` |
| `integrations-hub-service.ts` | static catalog | `CDS.project(snapshot, "integrations")` |
| Frontend LaunchCenter | CJ + amazon-us defaults | Brain API returns workspace slice of CDS |

**No mass migration in EA-006** — architecture only.

---

## 12. Observability

| Metric | Purpose |
|--------|---------|
| `discovery.compute.duration_ms` | Performance |
| `discovery.cache.hit_ratio` | Cache effectiveness |
| `discovery.failures.count` by code | Reliability |
| `discovery.staleness.age_ms` p95 | Freshness SLA |
| `discovery.graph.node_count` | Growth tracking |
| `discovery.plugin.count` | Plugin adoption |

Cockpit **Infrastructure** widget surfaces `DiscoveryHealth` alongside existing engine health.

---

## 13. Security & Governance

| Rule | Detail |
|------|--------|
| Discovery respects deployment profile | Sandbox never lists production-only live channels as `live` |
| Workspace filter | Tenant sees only workspace-activated plugins when `workspaceScoped: true` |
| No secret leakage | Snapshots expose credential **state** (configured / missing), never values |
| Demo isolation | Separate cache key; demo projections flagged `synthetic: true` |
| Audit | Every FAILED or PARTIAL snapshot logs `failures[]` to Brain |

---

## 14. Implementation Roadmap (not EA-006)

| Mission | Deliverable |
|---------|-------------|
| **EA-007** | `CapabilityDiscoveryService` + L1 cache + `discover()` |
| **EA-008** | ActivationPlane + live availability |
| **EA-009** | Graph builder + Cockpit G4-05 cutover |
| **EA-010** | Replace `DERIVED-DISCOVERY-SNAPSHOT` with CDS projections |
| **EA-011** | Event bus + partial refresh |

---

## 15. Relationship to Prior Missions

| Mission | Relationship |
|---------|--------------|
| EA-002 | CDS composes tier 1–5 registries into one snapshot |
| EA-003 | `DERIVED-DISCOVERY-SNAPSHOT` → first CDS section |
| EA-004 | Consumer migration targets CDS API |
| EA-005 | PluginHost feeds `plugins[]` and capability nodes |
| G3-01 / G3-02 | `projectIntelligenceSources(snapshot)` — no hardcoded markets |
| EA-001 | Eliminates LEGACY discovery hardcodes via CDS |

---

## 16. Gate Status

| Item | Status |
|------|--------|
| Dynamic capability discovery architecture | ✅ |
| Lifecycle, cache, refresh, graph, failures documented | ✅ |
| All seven discovery domains covered | ✅ |
| Implementation | ⛔ Deferred (EA-007+) |
| G3-02 | ⛔ Not started |

---

*EA-006 Dynamic Capability Discovery · Architecture only · 2026-07-02*
