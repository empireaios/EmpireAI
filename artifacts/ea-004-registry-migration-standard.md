# EA-004 — Registry Migration Standard

**Mission:** EA-004 — Registry Migration Standard  
**Authority:** EA-002 Canonical Registry Architecture · EA-003 RegistryLoader Foundation  
**Date:** 2026-07-02  
**Status:** **COMPLETE**  
**Scope:** Migration methodology + consumer audit · **No mass migration performed**

---

## Executive Summary

RegistryLoader exists (`backend/src/registry/`). EA-004 defines the **single canonical migration standard** every future registry migration must follow. No module may invent its own migration path.

**Consumer audit summary** (registry-relevant business knowledge paths):

| Classification | Count | Meaning |
|----------------|-------|---------|
| **READY** | 8 | Uses RegistryLoader or is an approved loader source adapter |
| **PARTIAL** | 4 | Loader-backed wrapper with residual direct seed access |
| **LEGACY** | 52+ | Direct seeds, parallel services, or hardcoded assumptions |

**Rule going forward:** New code **READY-only**. LEGACY modules migrate one registry domain per mission using the sequence in §2.

---

## 1. Migration Principles

| # | Principle |
|---|-----------|
| M1 | **One registry domain per mission** — never migrate unrelated registries in one PR |
| M2 | **Loader sources are the only seed importers** — after migration, seeds import only from `registry/sources/` |
| M3 | **Consumers call `getRegistryLoader()`** — or an approved derived-view helper that delegates to it |
| M4 | **Behaviour parity before deletion** — legacy path stays until parity tests pass |
| M5 | **Governance before activation** — Tier 0–2 row changes require ADR/King traceability |
| M6 | **No silent rollback** — rollback uses version pin or feature flag, always audited |
| M7 | **Derived before duplicate** — prefer `resolveDerivedView()` over copying rows into a second catalog |

---

## 2. Canonical Migration Sequence

Every migration mission **must** execute these phases in order. Skip none.

```
Phase 0 — Charter
Phase 1 — Wire source adapter (if not already in registry/sources/)
Phase 2 — Wire RegistryLoader resolve path
Phase 3 — Dual-read parity (legacy + loader)
Phase 4 — Consumer cutover
Phase 5 — Remove legacy direct imports
Phase 6 — Governance + audit artifact
```

### Phase 0 — Charter

| Step | Deliverable |
|------|-------------|
| 0.1 | Name target `RegistryId` / `DerivedViewId` from EA-002 |
| 0.2 | List LEGACY consumers from §5 audit (this document updated) |
| 0.3 | Confirm dependency order (§4) — upstream registries wired first |
| 0.4 | King/ADR requirement assessment (§7) |

### Phase 1 — Source adapter

Add or extend `registry/sources/<tier>-source.ts` to load seed data. **Consumers must not import seeds after Phase 5.**

| Check | Pass criteria |
|-------|---------------|
| Single adapter owns seed import | Only one file imports the seed module |
| Version constant exported | `*_REGISTRY_VERSION` set for snapshot meta |
| Query filters supported | `countryCode`, `registryRowId` where applicable |

### Phase 2 — Loader resolve path

| Step | Action |
|------|--------|
| 2.1 | Implement `RegistryLoader.resolve()` case or `resolveDerivedView()` builder |
| 2.2 | Set `meta.wired = true` in `listFoundationStatus()` |
| 2.3 | Apply cache policy from EA-002 (`CACHE_POLICY_BY_REGISTRY`) |
| 2.4 | Add validation rules in `registry-validator.ts` if context required |

### Phase 3 — Dual-read parity

Run legacy and loader paths **in parallel** in tests (not necessarily in production):

```typescript
// Pattern: parity assertion in validation test
const legacy = legacyFunction();
const loaded = getRegistryLoader().resolve({}, REG_XXX);
assert.deepEqual(normalize(legacy), normalize(loaded.rows));
```

| Requirement | Detail |
|-------------|--------|
| Row count parity | `legacy.length === meta.rowCount` |
| Key field parity | IDs, labels, country codes match |
| Derived view parity | Snapshot hash stable for same deployment profile |
| No production dual-write | Parity is test-only unless explicitly flagged |

### Phase 4 — Consumer cutover

| Step | Action |
|------|--------|
| 4.1 | Replace direct seed imports with loader calls |
| 4.2 | Replace parallel service wrappers with loader delegation **or** make wrapper thin delegate |
| 4.3 | Update `registrySource` / audit strings to cite `RegistryLoader:<id>` |
| 4.4 | Mark consumer **READY** in §5 inventory |

**Allowed consumer patterns:**

```typescript
// Direct (preferred for engines)
getRegistryLoader().resolve(context, REG_COUNTRY, { countryCode: "SG" });

// Derived view (preferred for intelligence)
getRegistryLoader().resolveDerivedView(context, DERIVED_DISCOVERY_SNAPSHOT);

// Approved wrapper (intelligence layer — must delegate 100% to loader)
buildIntelligenceMarketDiscoverySnapshot();
```

### Phase 5 — Legacy removal

| Step | Action |
|------|--------|
| 5.1 | Delete direct seed imports from cutover consumers |
| 5.2 | Deprecate duplicate constants (e.g. `V1_PRODUCTION_MARKETPLACE_IDS`) with comment pointing to REG-DEPLOYMENT-PROFILE |
| 5.3 | Remove dual-read test branch after one release cycle **or** keep permanent loader regression test |
| 5.4 | Run hardcode lint (§6.3) |

### Phase 6 — Governance + audit

| Deliverable | Location |
|-------------|----------|
| Migration mission audit | `artifacts/ea-NNN-<mission>-registry-migration-audit.md` |
| Update EA-004 §5 consumer status | READY / remove from LEGACY |
| ADR entry if Tier 0–2 | `EMPIREAI_DECISIONS.md` |
| EA-003 foundation status | `listFoundationStatus()` wired = true |

---

## 3. Validation Strategy

### 3.1 Pre-cutover validation

| Gate | Validation |
|------|------------|
| **Schema** | Row shape matches existing TypeScript types or Zod schema in `registry/types/` |
| **Registry ID** | `assertRegistryId()` passes; unknown IDs rejected |
| **Context** | Workspace-required registries fail fast without `workspaceId` |
| **Wiring** | `listFoundationStatus().wired === true` for target ID |
| **Parity** | Dual-read tests green (Phase 3) |
| **Cache** | Second resolve returns identical `contentHash` within TTL |

### 3.2 Post-cutover validation

| Gate | Validation |
|------|------------|
| **Import lint** | No seed import in consumer file (grep CI) |
| **Regression** | Existing validation tests for domain pass |
| **Loader regression** | New test in `ea-00N-registry-loader-*.test.ts` |
| **Executive audit** | Artifact lists files changed + remaining LEGACY |

### 3.3 Validation test naming

```
backend/src/validation/tests/registry-migration-<registry-id-slug>.test.ts
```

Example: `registry-migration-reg-country.test.ts`

---

## 4. Dependency Ordering

Migrations **must** respect tier dependencies (EA-002 §5). Downstream registry migration is blocked until upstream is **wired**.

```
Tier 0: REG-DOCTRINE → REG-BUSINESS-RULE
           ↓
Tier 1: REG-REGION → REG-COUNTRY → REG-MARKETPLACE / REG-SUPPLIER
           ↓
Tier 2: REG-PROVIDER → REG-CHANNEL → REG-DEPLOYMENT-PROFILE
           ↓              ↘
           ↓         REG-INTEGRATION (derived — after PROVIDER + activation)
Tier 3: REG-SCORING-POLICY / REG-PRICING-POLICY / REG-AI-ENGINE / REG-WORKFLOW
           ↓
Tier 4: REG-TENANT → REG-COMPANY → REG-BRAND / REG-CATEGORY / REG-PRODUCT
           ↓
Tier 5: DERIVED-* views (after upstream tiers wired)
```

### 4.1 Recommended migration waves

| Wave | Registry IDs | Unblocks |
|------|--------------|----------|
| **W0** (done EA-003) | REG-DOCTRINE, REG-REGION/COUNTRY/MARKETPLACE/SUPPLIER, REG-CHANNEL, REG-DEPLOYMENT-PROFILE, DERIVED-DISCOVERY-SNAPSHOT | PIE, G3-02 discovery |
| **W1** | REG-PROVIDER, DERIVED-ACTIVATION-SNAPSHOT | version-1-activation, live-commerce |
| **W2** | REG-SCORING-POLICY | PIE/supplier recommenders, cockpit health bands |
| **W3** | REG-AI-ENGINE, REG-WORKFLOW | cockpit spine, launch commander |
| **W4** | REG-INTEGRATION (derived) | integrations-hub, empire-access |
| **W5** | REG-TENANT, REG-COMPANY, REG-PRODUCT | workspace defaults, Brain catalog |
| **W6** | REG-PRICING-POLICY, REG-BUSINESS-RULE | commerce readiness, Guardian |

**Parallel rule:** Same-tier registries with no cross-dependency may migrate in parallel (e.g. REG-MARKETPLACE and REG-SUPPLIER — already wired).

---

## 5. Rollback Strategy

### 5.1 Rollback triggers

- Parity test failure in CI after cutover
- Production readiness regression on activation gates
- King directive to revert deployment profile row

### 5.2 Rollback mechanisms (in order of preference)

| Mechanism | When | Action |
|-----------|------|--------|
| **R1 — Consumer feature flag** | Phase 4 cutover | `REGISTRY_LOADER_<ID>_ENABLED=false` → legacy path (temporary bridge only during migration) |
| **R2 — Deployment profile pin** | Channel/marketplace scope error | Revert `EMPIRE_DEPLOYMENT_PROFILE` or row in REG-DEPLOYMENT-PROFILE seed |
| **R3 — Git revert** | Broken loader wiring | Revert migration PR; loader `wired` returns false |
| **R4 — Cache invalidate** | Stale snapshot | `defaultRegistryCache.invalidate()` + process restart |

### 5.3 Rollback rules

| Rule | Detail |
|------|--------|
| No rollback of REG-DOCTRINE without governance amendment | Constitutional tier |
| Rollback PR must reference migration mission audit | Traceability |
| Feature flags removed after Phase 5 complete | No permanent dual paths |
| `contentHash` logged on rollback incident | Brain audit entry |

---

## 6. Testing Requirements

### 6.1 Mandatory tests per migration

| Test type | Purpose |
|-----------|---------|
| **Parity test** | Legacy output ≡ loader output (Phase 3) |
| **Loader wiring test** | `meta.wired`, `meta.tier`, `rowCount` |
| **Query filter test** | `countryCode`, `registryRowId` filters |
| **Cache test** | Stable hash within TTL |
| **Consumer smoke test** | At least one downstream module end-to-end |

### 6.2 Existing test suites to keep green

| Suite | Scope |
|-------|-------|
| `ea-003-registry-loader-foundation.test.ts` | Loader core |
| `g3-architecture-dynamic-market-discovery.test.ts` | Discovery derived view |
| `g3-01-product-intelligence-engine.test.ts` | PIE architecture |
| Domain-specific validation tests | Unchanged behaviour |

### 6.3 Proposed CI guards (future implementation)

```text
# Forbidden outside registry/sources/ and **/tests/**
global-commerce-registry-data
marketplace-channel-registry (direct import)
V1_PRODUCTION_MARKETPLACE_IDS
```

---

## 7. Governance Requirements

### 7.1 Tier → approval matrix

| Tier | Change type | Approval |
|------|-------------|----------|
| **0 — Constitutional** | Doctrine row | Grand King + GVD amendment |
| **1 — Platform catalog** | New country/marketplace | Platform Architect + EA review |
| **2 — Deployment** | V1 channel activation | King ADR (ADR-052 pattern) |
| **3 — Policy** | Scoring threshold default | King + `EMPIREAI_DECISIONS.md` |
| **4 — Workspace** | Tenant/product data | Workspace Admin + audit |
| **5 — Derived** | New view formula | EA review + parity tests |

### 7.2 Migration mission checklist

- [ ] Target registry ID documented in mission charter  
- [ ] Dependency wave satisfied (§4)  
- [ ] Parity tests added  
- [ ] Consumer inventory updated in EA-004 §5  
- [ ] Audit artifact published under `artifacts/`  
- [ ] No Tier 0–2 change without governance doc mirror  
- [ ] G3-02 / PROOF gates respected (no scope creep)  

### 7.3 Documentation updates

| Change | Update |
|--------|--------|
| New wired registry | EA-003 §3 registries supported (or successor audit) |
| Consumer READY | EA-004 §5 inventory |
| New deployment channel | `V1_MARKETPLACE_CHANNEL_REGISTRY.md` + seed row |

---

## 8. Classification Definitions

| Status | Definition |
|--------|------------|
| **READY** | Business knowledge accessed **only** via `getRegistryLoader()` / approved derived helper; **or** file is an approved `registry/sources/*` adapter |
| **PARTIAL** | Primary path uses RegistryLoader (directly or via `intelligence-market-discovery`), but **≥1** direct seed import, duplicate constant, or legacy fallback remains |
| **LEGACY** | No RegistryLoader path; imports seeds, parallel catalog services, or embeds hardcoded business assumptions |

**Excluded from migration audit:** Technical registries (ToolRegistry, Brain module registry, Eye connector registry, workforce registry) — not EA-002 business domain registries.

---

## 9. Registry Consumer Audit

### 9.1 READY — RegistryLoader compliant

| Consumer | Registry domain | Path | Notes |
|----------|-----------------|------|-------|
| `registry/registry-loader.ts` | All wired IDs | Loader facade | Authority |
| `registry/sources/constitutional-source.ts` | REG-DOCTRINE | Adapter | Only GVD importer for loader |
| `registry/sources/platform-catalog-source.ts` | REG-REGION/COUNTRY/MARKETPLACE/SUPPLIER | Adapter | Only global-commerce seed importer for loader |
| `registry/sources/deployment-source.ts` | REG-CHANNEL, REG-DEPLOYMENT-PROFILE | Adapter | Only channel seed importer for loader |
| `registry/derived/discovery-view.ts` | DERIVED-DISCOVERY-SNAPSHOT | Derived builder | Uses sources only |
| `validation/tests/ea-003-registry-loader-foundation.test.ts` | Loader + discovery | Tests | Regression gate |
| `intelligence/product-intelligence-engine/engine-architecture.ts` | Discovery sources | Via `intelligence-market-discovery` | No direct seed imports |
| `validation/tests/g3-01-product-intelligence-engine.test.ts` | PIE architecture | Indirect | Exercises loader-backed architecture |

### 9.2 PARTIAL — Loader primary, legacy residual

| Consumer | Registry domain | Gap | Migration mission |
|----------|-----------------|-----|-------------------|
| `intelligence/shared/intelligence-market-discovery.ts` | DERIVED-DISCOVERY-SNAPSHOT | Still imports `getDeploymentChannelProfile` from seed for `isRegisteredIntelligenceSource` | EA-005: use `REG_CHANNEL` query only |
| `validation/tests/g3-architecture-dynamic-market-discovery.test.ts` | Channels | Imports `marketplace-channel-registry` for assertions | Point tests at loader only |
| `registry/derived/discovery-view.ts` | Channel types | Imports types from `marketplace-channel-registry` | Acceptable type import; move types to `registry/types/` in W1 |
| `registry/sources/deployment-source.ts` | Deployment | Imports channel seed (approved adapter) | **READY as adapter** — listed PARTIAL only for type coupling to intelligence folder |

### 9.3 LEGACY — Requires migration

#### Platform geography & commerce catalog

| Consumer | Registry domain | Current pattern | Target | Wave |
|----------|-----------------|-----------------|--------|------|
| `runtime/global-commerce/services/global-commerce-registry-service.ts` | REG-REGION/COUNTRY/MARKETPLACE | Direct `global-commerce-registry-data` | Thin delegate to RegistryLoader | W0-ext |
| `runtime/global-commerce/routes/global-commerce-routes.ts` | Platform catalog | Uses registry service | Loader API | W0-ext |
| `runtime/global-commerce/tools/global-commerce-tools.ts` | Platform catalog | Uses registry service | Loader API | W0-ext |
| `runtime/global-commerce/services/global-expansion-planner-service.ts` | REG-COUNTRY/MARKETPLACE | Direct seed import + service | Loader | W0-ext |
| `runtime/global-commerce/services/onboarding-readiness-service.ts` | REG-MARKETPLACE | `getMarketplacesByCountry` | Loader | W0-ext |
| `runtime/global-commerce/services/global-commerce-dashboard-service.ts` | Platform catalog | Registry service | Loader | W0-ext |
| `runtime/global-commerce/services/global-commerce-identity-service.ts` | REG-COUNTRY | Registry service | Loader | W0-ext |
| `runtime/global-commerce-intelligence/services/*` (6 services) | Country intelligence | Seeds + registry service | REG-COUNTRY + future intelligence overlay | W0-ext |
| `runtime/global-commerce-infrastructure/services/*` (4 services) | Infrastructure deps | Seed data | Derived infrastructure view (future) | W6 |
| `runtime/global-marketplace-operations/services/country-marketplace-operations-service.ts` | REG-MARKETPLACE | Direct seed + platform catalog | Loader | W0-ext |
| `runtime/global-marketplace-operations/services/global-product-distribution-engine-service.ts` | REG-MARKETPLACE | `getMarketplacesByCountry` | Loader | W0-ext |
| `runtime/country-difference-engine/services/country-difference-engine-service.ts` | REG-COUNTRY | Registry service | Loader | W0-ext |

#### Deployment & activation

| Consumer | Registry domain | Current pattern | Target | Wave |
|----------|-----------------|-----------------|--------|------|
| `orchestration/version-1-activation/version-1-activation-config.ts` | REG-DEPLOYMENT-PROFILE | `V1_PRODUCTION_MARKETPLACE_IDS` constants | Loader deployment profile | W1 |
| `orchestration/version-1-activation/b6-credential-implementation.ts` | REG-CHANNEL / workflow | Hardcoded B6 items | REG-WORKFLOW + deployment | W1/W3 |
| `orchestration/version-1-activation/go-live-preparation.ts` | Deployment | V1 constants | Loader | W1 |
| `orchestration/version-1-activation/production-infrastructure-readiness.ts` | Deployment | V1 activation config | Loader | W1 |
| `orchestration/reality-integration/live-commerce/config.ts` | REG-CHANNEL | Closed marketplace list | Deployment profile ∩ adapters | W1 |
| `orchestration/reality-integration/live-commerce/adapters/registry.ts` | REG-PROVIDER | Hardcoded adapter list | REG-PROVIDER | W1 |
| `domain/services/cockpit-panel-views.ts` | REG-CHANNEL | `AMAZON_MARKETPLACE_REGISTRY_IDS` | DERIVED-DISCOVERY or REG-CHANNEL | W1 |
| `runtime/marketplace-publishing/models/marketplace-adapter.ts` | REG-MARKETPLACE | `MARKETPLACE_ADAPTERS` array | REG-PROVIDER/MARKETPLACE | W1 |

#### Providers & integrations

| Consumer | Registry domain | Current pattern | Target | Wave |
|----------|-----------------|-----------------|--------|------|
| `orchestration/reality-integration/models/provider-catalog.ts` | REG-PROVIDER | Seed catalog | Loader source adapter | W1 |
| `orchestration/reality-integration/services/reality-integration-service.ts` | REG-PROVIDER | provider-catalog | Loader | W1 |
| `orchestration/reality-integration/services/operational-access-registry-service.ts` | REG-INTEGRATION | provider-catalog + platform | Derived view | W4 |
| `orchestration/reality-integration/services/connector-runtime.ts` | REG-PROVIDER | provider-catalog | Loader | W1 |
| `orchestration/reality-integration/services/provider-capability-matrix-service.ts` | REG-PROVIDER | provider-catalog | Loader | W1 |
| `operational-access/integrations-hub/services/integrations-hub-service.ts` | REG-INTEGRATION | `integrations-hub-catalog` | Derived REG-INTEGRATION | W4 |
| `operational-access/integrations-hub/models/integrations-hub-catalog.ts` | REG-INTEGRATION | Duplicate catalog | Deprecate for derived view | W4 |
| `operational-access/models/empire-platform-catalog.ts` | REG-INTEGRATION | Platform list | Derived view | W4 |
| `operational-access/services/empire-access-registry-service.ts` | REG-INTEGRATION | Platform catalog | Derived view | W4 |
| `runtime/commerce-runtime/services/runtime-registry-service.ts` | REG-PROVIDER | provider-catalog | Loader | W1 |

#### Intelligence & scoring (non-discovery)

| Consumer | Registry domain | Current pattern | Target | Wave |
|----------|-----------------|-----------------|--------|------|
| `intelligence/commerce-intelligence-core/services/marketplace-study-service.ts` | REG-CHANNEL | `amazon-us` literal | DERIVED-DISCOVERY-SNAPSHOT | W0-ext |
| `intelligence/commerce-intelligence-core/models/commerce-intelligence-core.ts` | REG-CHANNEL | `z.literal("amazon-us")` | Registry-resolved id | W0-ext |
| `intelligence/commerce-intelligence-core/services/mission-service.ts` | REG-CHANNEL | Hardcoded marketplace | Loader context | W0-ext |
| `intelligence/commerce-intelligence-core/services/product-fit-service.ts` | REG-CATEGORY / policy | Category heuristics | REG-SCORING-POLICY | W2 |
| `intelligence/product-intelligence-engine/recommendation-engine.ts` | REG-SCORING-POLICY | `DEFAULT_RECOMMENDATION_THRESHOLDS` | Policy pack | W2 |
| `intelligence/supplier-intelligence-engine/supplier-guard.ts` | REG-SCORING-POLICY | `SUPPLIER_GUARD_THRESHOLDS` | Policy pack | W2 |
| `orchestration/commerce-readiness-engine/services/commerce-readiness-evaluator.ts` | REG-SCORING-POLICY | Inline 70/75/30/50 | Policy pack | W2 |

#### Engine topology & cockpit

| Consumer | Registry domain | Current pattern | Target | Wave |
|----------|-----------------|-----------------|--------|------|
| `domain/services/executive-dashboard-integration.ts` | REG-AI-ENGINE | `V1_ENGINE_IDS`, edges | Engine topology registry | W3 |
| `domain/services/cockpit-panel-views.ts` | REG-AI-ENGINE | `COCKPIT_ENGINE_IDS` | Loader | W3 |
| `domain/services/engine-center-views.ts` | REG-AI-ENGINE | Routes + expansion slots | Loader | W3 |
| `domain/services/executive-relationship-graph.ts` | REG-AI-ENGINE | Imports V1_ENGINE_IDS | Loader | W3 |
| `runtime/product-launch-commander/services/product-launch-commander-service.ts` | REG-WORKFLOW | `LAUNCH_STEPS` | Workflow registry | W3 |
| `orchestration/objective-management-engine/services/objective-default-objectives.ts` | REG-WORKFLOW | PROOF-001 path | Workflow registry | W3 |

#### Doctrine (wired but parallel consumers)

| Consumer | Registry domain | Current pattern | Target | Wave |
|----------|-----------------|-----------------|--------|------|
| `foundation/empire-governance-doctrine/services/empire-governance-doctrine-service.ts` | REG-DOCTRINE | Direct `gvd-catalog` | Optional delegate to loader | W6 |
| `foundation/empire-governance-doctrine/services/governance-compliance-audit.ts` | REG-DOCTRINE | Direct catalog | Loader | W6 |

#### Frontend (legacy dashboard)

| Consumer | Registry domain | Current pattern | Target | Wave |
|----------|-----------------|-----------------|--------|------|
| `frontend/src/pages/dashboard/LaunchCenterPage.tsx` | REG-CHANNEL / mission | `amazon-us`, CJ defaults | Brain API + workspace profile | W5 |
| `frontend/src/api/discovery.ts` | REG-COUNTRY / supplier | US + CJ defaults | Workspace commerce profile | W5 |
| `frontend/src/pages/dashboard/InfrastructurePage.tsx` | REG-SUPPLIER | Hardcoded supplier filter | Integrations API | W4 |
| `empireai-web/components/cockpit/widgets/*DemoData.ts` (11 files) | REG-PRODUCT/BRAND | Nova Home demo | Demo mode gate only | W5 |

#### Amazon adapter layer (infrastructure — migrate metadata only)

| Consumer | Registry domain | Current pattern | Target | Wave |
|----------|-----------------|-----------------|--------|------|
| `orchestration/reality-integration/live-commerce/amazon-marketplace-profiles.ts` | REG-PROVIDER metadata | Amazon-specific profiles | Provider plugin metadata | W1 |
| `orchestration/reality-integration/live-commerce/adapters/amazon-sp-api-adapter.ts` | REG-PROVIDER | Profile registry | Loader + adapter | W1 |

*Adapter endpoints/credentials remain **Infrastructure Constants** (EA-001); only **business scope lists** migrate.*

---

## 10. Consumer Summary Matrix

| Domain | READY | PARTIAL | LEGACY |
|--------|-------|---------|--------|
| RegistryLoader module | 6 | 0 | 0 |
| Intelligence discovery (G3) | 1 | 2 | 0 |
| Platform geography / global-commerce | 0 | 0 | 14 |
| Deployment / V1 activation | 0 | 0 | 8 |
| Providers / integrations | 0 | 0 | 10 |
| Intelligence scoring / CIC | 0 | 0 | 7 |
| Cockpit / engine topology | 0 | 0 | 5 |
| Doctrine parallel paths | 0 | 0 | 2 |
| Frontend / demo | 0 | 0 | 15 |
| **Totals** | **8** | **4** | **52+** |

---

## 11. Migration Mission Template

Use this template for EA-005+ missions:

```markdown
# EA-NNN — REG-<ID> Migration

## Charter
- Registry ID:
- Wave:
- LEGACY consumers (from EA-004 §9.3):

## Phases completed
- [ ] Phase 1 Source adapter
- [ ] Phase 2 Loader wired
- [ ] Phase 3 Parity tests
- [ ] Phase 4 Consumer cutover
- [ ] Phase 5 Legacy removal
- [ ] Phase 6 Audit + governance

## Parity evidence
- Test file:
- rowCount:
- contentHash sample:

## Rollback
- Flag / revert plan:

## Consumer status updates
- module → READY
```

---

## 12. Relationship to Prior Missions

| Mission | Relationship |
|---------|--------------|
| EA-001 | Identified LEGACY hardcodes — §9.3 inventory |
| EA-002 | Registry hierarchy — §4 dependency ordering |
| EA-003 | Loader implementation — §2 Phase 2 baseline |
| G3-02 | **Blocked** until W0-ext CIC migration or explicit King gate; discovery path READY |

---

## 13. Gate Status

| Item | Status |
|------|--------|
| Migration standard defined | ✅ |
| Sequence, validation, rollback, ordering, testing, governance | ✅ |
| Consumer audit complete | ✅ |
| Mass migration | ⛔ Not performed |
| G3-02 | ⛔ Not started |

---

*EA-004 Registry Migration Standard · Architecture only · 2026-07-02*
