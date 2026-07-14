# EA-005 — Plugin & Extension Framework

**Mission:** EA-005 — Plugin & Extension Framework  
**Authority:** EA-002 Registry Architecture · EA-003 RegistryLoader · EA-004 Migration Standard · GVD module boundaries  
**Date:** 2026-07-02  
**Status:** **COMPLETE**  
**Scope:** Canonical plugin architecture · **No implementation modified**

---

## Executive Summary

EmpireAI must grow by **registering extensions**, not by editing core engine logic. EA-005 defines the **Empire Plugin Framework (EPF)** — a unified architecture that connects:

1. **Registry extension** — append catalog/policy rows via `RegistryLoader`  
2. **Runtime execution** — live adapter behaviour via `IRuntimePlugin`  
3. **Governance** — permissions, certification, and King approval gates  

**Core rule:**

> Plugins **register manifests**. They **never patch** core modules, doctrine registries, or engine evaluators.

EPF supports future extensions for **marketplaces, suppliers, payment providers, logistics providers, AI engines, advertising providers, and external tools** through one registration pipeline with category-specific capability contracts.

**Current codebase state:** Partial foundations exist (`RegistryLoader.registerPlugin` placeholder, `RuntimePluginRegistry`, `permission-matrix`). EA-005 **unifies** them into one canonical model — implementation deferred to EA-006+.

---

## 1. Design Principles

| # | Principle | Implication |
|---|-----------|-------------|
| E1 | **Register, don’t patch** | No plugin modifies files under `intelligence/`, `domain/services/`, or doctrine catalogs |
| E2 | **Manifest-first** | Every plugin is declared before code loads; undeclared code cannot execute in production |
| E3 | **Registry before runtime** | Catalog row (REG-*) must exist or be injected before runtime plugin enables LIVE mode |
| E4 | **Doctrine-safe** | Plugins cannot grant themselves authority (GVD-026); permissions are declared, not inferred |
| E5 | **Versioned immutability** | Published manifest versions are immutable; changes = new semver |
| E6 | **Fail closed** | Invalid manifest, failed validation, or missing permission → BLOCKED, not degraded silently |
| E7 | **King gate for irreversible** | Publish, payout, live commerce require certification + approval flags |
| E8 | **One host** | Single `PluginHost` coordinates registry + runtime + Brain tool registration |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EMPIRE PLUGIN HOST (EPF)                         │
│  register(manifest) · enable · disable · certify · dispatch(capability) │
└───────────────┬─────────────────────┬─────────────────────┬─────────────┘
                │                     │                     │
                ▼                     ▼                     ▼
┌───────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ RegistryLoader         │ │ RuntimePluginRegistry│ │ Brain / ToolRegistry │
│ REG-* row injection    │ │ IRuntimePlugin impl  │ │ MCP / external tools │
│ (declarative catalog)  │ │ (execution adapters) │ │ (agent capabilities) │
└───────────┬───────────┘ └──────────┬──────────┘ └──────────┬──────────┘
            │                        │                        │
            ▼                        ▼                        ▼
┌───────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ Operational Access     │ │ Guardian / GVD       │ │ Cockpit / Integrations│
│ Permission matrix      │ │ Module boundary check│ │ Hub derived views     │
└───────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

### 2.1 Two-layer plugin model

| Layer | Role | When used |
|-------|------|-----------|
| **Layer A — Registry Extension** | Appends rows to REG-MARKETPLACE, REG-PROVIDER, REG-SUPPLIER, REG-AI-ENGINE, etc. | New Lazada SG, new payment rail metadata |
| **Layer B — Runtime Plugin** | Implements `IRuntimePlugin` — health, capabilities, dispatch | Live SP-API calls, CJ fulfilment, Stripe charges |

**Both layers share one `pluginId`.** Layer A may ship alone (`ARCHITECTURE_ONLY`). Layer B requires Layer A registry rows.

### 2.2 Relationship to existing code

| Existing artifact | EPF role | EA-005 action |
|-------------------|----------|---------------|
| `registry/types/plugin-manifest.ts` | Layer A stub | **Superseded by** `EmpirePluginManifest` (backward compatible fields) |
| `registry/registry-loader.ts` `registerPlugin()` | Layer A store | **Extend** to apply registry rows after validation |
| `runtime/plugins/registry/runtime-plugin-registry.ts` | Layer B host | **Subordinate** to PluginHost |
| `runtime/plugins/framework/i-runtime-plugin.ts` | Layer B contract | **Retain** as execution interface |
| `operational-access/models/permission-matrix.ts` | Permissions | **Bind** to manifest `permissions[]` |
| `connectors/catalog.ts`, `provider-catalog.ts` | Legacy catalogs | **Migrate** rows via plugins (EA-004 W1/W4) |

---

## 3. Plugin Categories

| Category | `pluginCategory` | Registry targets | Runtime capabilities (examples) | King gate |
|----------|----------------|------------------|--------------------------------|-----------|
| **Marketplace** | `marketplace` | REG-MARKETPLACE, REG-PROVIDER, REG-CHANNEL | `catalog_sync`, `listing_publish`, `order_read` | Live publish |
| **Supplier** | `supplier` | REG-SUPPLIER, REG-PROVIDER, REG-CHANNEL | `catalog_pull`, `order_submit`, `tracking` | Live fulfilment |
| **Payment** | `payment` | REG-PROVIDER | `charge`, `refund`, `payout`, `webhook` | Live money movement |
| **Logistics** | `logistics` | REG-PROVIDER | `rate_quote`, `label_create`, `track` | Live shipment |
| **AI Engine** | `ai_engine` | REG-AI-ENGINE | `evaluate`, `rank`, `explain` (no LLM business logic in core) | Engine topology ADR |
| **Advertising** | `advertising` | REG-PROVIDER | `campaign_create`, `metrics_import`, `bid_adjust` | Ad spend |
| **External Tool** | `external_tool` | REG-PROVIDER (optional) | Brain tool dispatch, MCP bridge | Tool permission scope |

**Forbidden plugin categories:** Constitutional overrides, doctrine edits, scoring policy defaults without King policy pack approval.

---

## 4. Manifest Specification

### 4.1 EmpirePluginManifest (canonical)

```typescript
type EmpirePluginManifest = {
  // Identity
  pluginId: string;              // stable kebab-case, globally unique
  displayName: string;
  pluginCategory: PluginCategory;
  version: string;               // semver MAJOR.MINOR.PATCH
  schemaVersion: "epf-1";        // manifest schema revision

  // Provenance
  author: string;
  missionId: string;             // e.g. B6-06, G3-02, EA-006
  description: string;
  sourceModule: string;          // npm/workspace package path

  // Registry extension (Layer A)
  registryExtensions: RegistryExtension[];

  // Runtime (Layer B) — optional at register time
  runtime?: {
    entrypoint: string;        // module path exporting IRuntimePlugin
    capabilities: CapabilityDeclaration[];
    executionMode: ExecutionMode;
    certificationState: CertificationState;
  };

  // External tool (Layer B alt)
  toolExtension?: {
    brainToolNames: string[];
    mcpServerId?: string;
  };

  // Governance
  permissions: PermissionDeclaration[];
  dependencies: PluginDependency[];
  constraints: PluginConstraints;

  // Lifecycle metadata
  lifecycle: PluginLifecycleState;
  registeredAt?: string;
  contentHash?: string;
};
```

### 4.2 RegistryExtension

```typescript
type RegistryExtension = {
  targetRegistryId: RegistryId;  // EA-002 ID e.g. REG-MARKETPLACE
  rows: Record<string, unknown>[]; // one or more append rows
  rowSchemaRef: string;          // e.g. "ProviderEntry@b-006-v1"
};
```

**Rules:**
- One manifest may extend multiple registries (e.g. REG-MARKETPLACE + REG-PROVIDER + REG-CHANNEL).
- Rows must pass registry validator before acceptance.
- Duplicate `registryId` / `providerId` keys → registration rejected.

### 4.3 CapabilityDeclaration

```typescript
type CapabilityDeclaration = {
  capabilityId: string;          // e.g. catalog_sync, charge, evaluate
  displayName: string;
  support: "DECLARED" | "PARTIAL" | "UNSUPPORTED";
  executionMode: "ARCHITECTURE_ONLY" | "SIMULATED" | "READY" | "LIVE";
  requiresPermissions: PermissionType[];
  irreversible: boolean;         // triggers King approval gate if true
};
```

Aligns with existing `RuntimePluginCapability` in `runtime-plugin-types.ts`.

### 4.4 PermissionDeclaration

```typescript
type PermissionDeclaration = {
  permission: PermissionType;    // OAR-003: read, write, publish, order, ...
  scope: "platform" | "workspace" | "company";
  required: boolean;
  grantedBy: "oauth" | "api_key" | "king_approval" | "architecture_only";
};
```

### 4.5 PluginConstraints

```typescript
type PluginConstraints = {
  allowedDeploymentProfiles: string[];  // e.g. ["v1-production", "sandbox"]
  blockedModules: string[];               // modules plugin must not impersonate
  maxRateLimitPerMinute?: number;
  requiresCredentialVault: boolean;
  workspaceScoped: boolean;
};
```

### 4.6 Example — Marketplace plugin (Lazada SG)

```yaml
pluginId: lazada-sg-marketplace
pluginCategory: marketplace
version: 1.0.0
schemaVersion: epf-1
missionId: B6-XX
registryExtensions:
  - targetRegistryId: REG-MARKETPLACE
    rowSchemaRef: ProviderEntry@b-006-v1
    rows:
      - providerId: lazada-sg
        displayName: Lazada SG
        domain: marketplace
        countryCode: SG
  - targetRegistryId: REG-PROVIDER
    rows:
      - providerId: lazada
        displayName: Lazada Open Platform
        category: commerce
        capabilities: [catalog_sync, order_fulfillment]
runtime:
  entrypoint: "@empireai/plugin-lazada-sg/dist/index.js"
  executionMode: ARCHITECTURE_ONLY
  certificationState: UNCERTIFIED
  capabilities:
    - capabilityId: catalog_sync
      support: DECLARED
      executionMode: ARCHITECTURE_ONLY
      requiresPermissions: [read, write]
      irreversible: false
permissions:
  - permission: publish
    scope: workspace
    required: true
    grantedBy: king_approval
dependencies:
  - pluginId: empire-core-commerce
    versionRange: ">=1.0.0"
constraints:
  allowedDeploymentProfiles: [v1-production, sandbox]
  requiresCredentialVault: true
  workspaceScoped: true
```

---

## 5. Registration

### 5.1 Registration pipeline

```
Manifest submit
  → Schema validation (Zod epf-1)
  → Registry row validation (per targetRegistryId)
  → Dependency resolution (plugin graph acyclic)
  → Permission feasibility check (OAR matrix)
  → Guardian module boundary check (GVD)
  → Content hash + semver uniqueness
  → Layer A: RegistryLoader.inject(rows)
  → Layer B: RuntimePluginRegistry.register(IRuntimePlugin) [if runtime block present]
  → ToolRegistry.register [if toolExtension present]
  → State: REGISTERED
  → Audit: Brain plugin_registry table
```

### 5.2 Registration API (conceptual)

```typescript
PluginHost.register(manifest: EmpirePluginManifest): PluginRegistrationResult;
PluginHost.enable(pluginId: string, context: PluginEnableContext): PluginEnableResult;
PluginHost.disable(pluginId: string, reason: string): void;
PluginHost.unregister(pluginId: string): void;  // only if never LIVE-certified
```

### 5.3 Registration modes

| Mode | Who | Approval |
|------|-----|----------|
| **Built-in** | EmpireAI core packages at startup | Pre-certified in deployment bundle |
| **Deployment bundle** | `EMPIRE_PLUGIN_BUNDLE` env / config | Platform Architect |
| **Workspace extension** | Workspace Admin | Guardian + permission scope |
| **External** (future) | Third-party package | King + security review |

**V1 rule:** Only **built-in** and **deployment bundle** modes are permitted until external plugin sandbox exists.

### 5.4 Idempotency

- Same `pluginId` + same `version` + same `contentHash` → no-op success  
- Same `pluginId` + different `version` → new registration; old version DISABLED unless coexistence declared  
- Same `pluginId` + same `version` + different hash → **rejected** (tamper detection)

---

## 6. Lifecycle

### 6.1 State machine

```
                    register()
                        │
                        ▼
                  ┌───────────┐
                  │ REGISTERED │
                  └─────┬─────┘
                        │ enable() + validation pass
                        ▼
                  ┌───────────┐
           ┌──────│  ENABLED   │──────┐
           │      └─────┬─────┘      │
           │ disable()  │            │ health failure
           ▼            │ certify()  ▼
     ┌───────────┐      │      ┌───────────┐
     │  DISABLED │      │      │  DEGRADED │
     └───────────┘      │      └───────────┘
                        ▼
                  ┌───────────┐
                  │ CERTIFIED │ (optional gate for LIVE)
                  └───────────┘

     unregister() from REGISTERED or DISABLED only
                        │
                        ▼
                  ┌─────────────┐
                  │ UNREGISTERED │
                  └─────────────┘
```

### 6.2 Lifecycle × execution mode

| State | ARCHITECTURE_ONLY | SIMULATED | READY | LIVE |
|-------|-------------------|-----------|-------|------|
| REGISTERED | Catalog visible | — | — | — |
| ENABLED | Discovery + cockpit metadata | Mock dispatch | Pre-live checks | **Blocked** until CERTIFIED |
| CERTIFIED | Same | Same | Go-live eligible | King-approved live |
| DEGRADED | Read-only catalog | Dispatch blocked | Dispatch blocked | **Halted** |
| DISABLED | Hidden from discovery | — | — | — |

### 6.3 Hooks (runtime plugins)

| Hook | When |
|------|------|
| `onRegister` | After Layer A injected |
| `onEnable` | After ENABLED transition |
| `onDisable` | Before DISABLED |
| `onUnregister` | Cleanup credentials references |
| `onCertify` | After King/certification approval |
| `onHealthCheck` | Periodic; may transition to DEGRADED |

Existing `IRuntimePlugin` hooks (`onRegister`, `onEnable`, `onDisable`, `onUnregister`) map directly.

---

## 7. Versioning

### 7.1 Semver rules

| Change | Bump | Registry impact |
|--------|------|-----------------|
| New capability, backward compatible | MINOR | Optional new rows |
| Bug fix, same rows | PATCH | Row content hash update |
| Breaking capability / row schema | MAJOR | New rows; old DISABLED |
| Removed marketplace country | MAJOR | Deprecate rows; migration doc required |

### 7.2 Version pinning

| Pin level | Controlled by | Example |
|-----------|---------------|---------|
| **Platform** | Deployment profile | `amazon-sp-api@2.1.0` |
| **Workspace** | Workspace Admin | Allow patch updates only |
| **Mission** | `missionId` in manifest | Traceability to B6/G3 |

### 7.3 Coexistence

- Default: **one active version per `pluginId`**  
- Exception: explicit `coexistenceGroup` in manifest for blue/green adapter cutover (Platform Architect approval)

### 7.4 Manifest schema versioning

`schemaVersion: "epf-1"` — breaking changes to manifest shape increment EPF schema, not plugin semver.

---

## 8. Validation

### 8.1 Validation stages

| Stage | Validator | Fail action |
|-------|-----------|-------------|
| **V1 — Schema** | `EmpirePluginManifestSchema` (Zod) | Reject register |
| **V2 — Registry** | `RegistryLoader` row validator per `targetRegistryId` | Reject register |
| **V3 — Dependency** | Plugin DAG resolver | Reject register |
| **V4 — Permission** | OAR permission matrix feasibility | Reject enable |
| **V5 — Doctrine** | Guardian: plugin cannot bind forbidden modules (GVD-007–012) | Reject register |
| **V6 — Credential** | Vault schema present if `requiresCredentialVault` | Reject LIVE enable |
| **V7 — Certification** | `certificationState === CERTIFIED` for irreversible caps | Block dispatch |
| **V8 — Runtime** | `IRuntimePlugin.getHealth()` not BLOCKED | DEGRADED or reject enable |

### 8.2 Category-specific validation

| Category | Additional checks |
|----------|---------------------|
| Marketplace | `countryCode` exists in REG-COUNTRY; formatter/validator refs resolvable |
| Supplier | Fulfilment handoff schema; no duplicate sole-V1-supplier without ADR |
| Payment | PCI scope flag; no raw card storage declaration |
| Logistics | Carrier API region matches REG-COUNTRY |
| AI Engine | Must declare `evaluate` not `execute`; REG-AI-ENGINE row with route |
| Advertising | Spend cap metadata; no auto-publish without King flag |
| External Tool | Tool name namespace `pluginId.*`; no shadow Brain modules |

### 8.3 Validation on enable vs register

| Check | Register | Enable | LIVE dispatch |
|-------|----------|--------|---------------|
| V1–V3, V5 | ✅ | ✅ | ✅ |
| V4 | — | ✅ | ✅ |
| V6–V8 | — | partial | ✅ |

---

## 9. Permissions

### 9.1 Permission model (OAR-003 aligned)

Plugins **declare** permissions; Operational Access **grants** them via credentials + King approval.

```
Manifest permissions[] → Platform permission matrix → Credential vault → Dispatch allowed
```

### 9.2 Standard permission types

From `permission-matrix.ts`: `read`, `write`, `publish`, `delete`, `order`, `refund`, `fulfill`, `advertise`, `webhook`, `analytics`, `payout`.

### 9.3 Permission tiers

| Tier | Who grants | Examples |
|------|------------|----------|
| **Architecture** | Automatic at REGISTERED | Metadata visibility, ARCHITECTURE_ONLY caps |
| **OAuth / API key** | Founder one-time onboarding (REAL-051A) | Amazon SP-API, CJ, Stripe |
| **King approval** | Grand King explicit | First live publish, ad spend, irreversible |
| **Guardian** | Policy engine | Blocks publish if readiness fails |

### 9.4 AI engine plugin permissions

AI engine plugins may request:

| Permission | Scope | Constraint |
|------------|-------|------------|
| `read` | Workspace catalog | Always for evaluate/rank |
| `write` | Recommendations only | **Not** product publish |
| `analytics` | Engine telemetry | Cockpit visibility |

**GVD-007–008:** Supplier/Marketplace Intelligence plugins **evaluate only** — publish capability forbidden at validation V5.

### 9.5 External tool permissions

| Rule | Detail |
|------|--------|
| Namespace | `toolName` must be prefixed `{pluginId}.` |
| Scope ceiling | Tools inherit workspace Brain permissions, cannot exceed |
| MCP bridge | `mcpServerId` registered separately; plugin references, does not embed secrets |

---

## 10. Dispatch & Integration

### 10.1 Capability dispatch flow

```
Consumer (engine / commerce runtime)
  → PluginHost.dispatch({ pluginId, capabilityId, payload, context })
  → Permission check (V4)
  → Certification check (V7 if irreversible)
  → IRuntimePlugin.dispatch / adapter route
  → PluginDispatchResult { outcome, message, planId }
```

Aligns with existing `PluginDispatchResult` in `runtime-plugin-types.ts`.

### 10.2 Discovery integration

After Layer A registration:

- `DERIVED-DISCOVERY-SNAPSHOT` includes plugin-injected marketplaces automatically  
- `REG-INTEGRATION` derived view (future) lists plugin providers with activation state  
- Cockpit Integrations Hub reads derived view — **not** duplicate catalog flags  

### 10.3 Brain / agent integration

| Plugin category | Brain integration |
|-----------------|-------------------|
| AI Engine | Register read-only tools: `{pluginId}.explain`, `{pluginId}.context` |
| External Tool | Full tool registration via ToolRegistry |
| Marketplace/Supplier | **No** direct Brain tools — commerce runtime dispatches |

---

## 11. Security & Governance

| Requirement | Mechanism |
|-------------|-----------|
| No self-granted authority | GVD-026; manifest cannot include `grand-king` module |
| Auditable registration | Brain `plugin_registry` + `plugin_registry_history` |
| Content integrity | `contentHash` on manifest; reject hash mismatch |
| Secret handling | Credentials only via vault env schema in manifest — never in `extensions` JSON |
| Revocation | `certificationState: REVOKED` → immediate DEGRADED + dispatch block |
| Rollback | Disable plugin version; registry rows marked DEPRECATED (EA-004 lifecycle) |

### 11.1 King approval matrix (irreversible capabilities)

| Capability | Default |
|------------|---------|
| `listing_publish` | King approval required V1 |
| `charge`, `payout` | King approval + Stripe/live proof |
| `campaign_create` (live spend) | King approval |
| `order_submit` (live fulfilment) | Credential proof + readiness |

---

## 12. Implementation Roadmap (not EA-005)

| Mission | Deliverable |
|---------|-------------|
| **EA-006** | `EmpirePluginManifestSchema`, `PluginHost` skeleton |
| **EA-007** | Registry row injection in `RegistryLoader.registerPlugin()` |
| **EA-008** | Unify `RuntimePluginRegistry` under PluginHost |
| **EA-009** | First built-in plugin bundle (Lazada architecture-only) |
| **EA-010** | Workspace plugin enable + OAR permission binding |

**Explicitly out of scope for EA-005:** External npm plugins, marketplace store, runtime sandbox isolation.

---

## 13. Mapping — Requested Extension Types

| Future extension | Category | Layer A registries | Layer B interface |
|------------------|----------|--------------------|-------------------|
| Lazada, TikTok Shop, Walmart | `marketplace` | REG-MARKETPLACE, REG-CHANNEL, REG-PROVIDER | `IRuntimePlugin` |
| Zendrop, AliExpress | `supplier` | REG-SUPPLIER, REG-PROVIDER | `IRuntimePlugin` |
| PayPal, Adyen | `payment` | REG-PROVIDER | `IRuntimePlugin` |
| DHL, FedEx | `logistics` | REG-PROVIDER | `IRuntimePlugin` |
| G3-02 Market Intelligence Engine | `ai_engine` | REG-AI-ENGINE | Engine module + read tools |
| Meta Ads, Google Ads | `advertising` | REG-PROVIDER | `IRuntimePlugin` |
| MCP analytics, custom scrapers | `external_tool` | REG-PROVIDER (optional) | ToolRegistry + MCP |

---

## 14. Anti-Patterns

| Anti-pattern | Correct approach |
|--------------|------------------|
| Add `if (pluginId === "lazada")` in PIE scorer | Register marketplace row; discovery picks it up |
| Fork `cockpit-panel-views.ts` for new engine tab | REG-AI-ENGINE row + engine plugin |
| Hardcode new provider in `integrations-hub-catalog.ts` | Plugin registry extension + derived REG-INTEGRATION |
| Plugin ships scoring thresholds | Policy pack plugin → REG-SCORING-POLICY with King approval |
| Plugin bypasses RegistryLoader | All catalog consumption via loader (EA-004) |
| Two manifests for same `pluginId` without semver | Rejected at V1 |

---

## 15. Relationship to Prior Missions

| Mission | Relationship |
|---------|--------------|
| EA-002 | Plugins extend REG-* tiers; never new ad-hoc registries |
| EA-003 | `registerPlugin()` becomes Layer A entry point |
| EA-004 | Plugin registration follows migration waves; built-in plugins pre-wired |
| G3-02 | Market Intelligence = `ai_engine` category; discovery via loader, not hardcoded lists |
| B-001 Runtime plugins | Layer B execution contract — retained |
| ADR-052 / REAL-051A | Deployment profile + OAuth permission model |

---

## 16. Gate Status

| Item | Status |
|------|--------|
| Canonical plugin architecture defined | ✅ |
| Manifest, registration, lifecycle, versioning, validation, permissions | ✅ |
| All requested extension categories covered | ✅ |
| Implementation | ⛔ Deferred (EA-006+) |
| G3-02 | ⛔ Not started |

---

*EA-005 Plugin & Extension Framework · Architecture only · 2026-07-02*
