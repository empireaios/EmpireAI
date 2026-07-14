# EmpireAI Hardcode Governance Audit

**Mission:** EmpireAI Hardcode Governance Audit  
**Authority:** Grand King Architecture Directive  
**Date:** 2026-07-02  
**Status:** **COMPLETE**  
**Scope:** Full repository audit · **No code modified**

---

## Executive Summary

EmpireAI contains **hundreds of hardcoded values** across backend, frontend, and cockpit layers. Most are **acceptable** (infrastructure endpoints, security env keys, technical enums, test fixtures). A **material subset** embeds **business assumptions** — countries, marketplaces, suppliers, scoring thresholds, V1 engine topology, workflows, and demo catalogue data — **inside engine logic, evaluators, and UI** rather than in governed registries.

**Key finding:** The platform already has **canonical registry files** (`global-commerce-registry-data.ts`, `V1_MARKETPLACE_CHANNEL_REGISTRY.md`, `provider-catalog.ts`, `integrations-hub-catalog.ts`, `gvd-catalog.ts`). The governance gap is **inconsistent consumption**: many modules still duplicate V1 assumptions locally instead of reading registries.

| Classification | Approx. count | Action |
|----------------|---------------|--------|
| **Infrastructure Constant** | ~120 rows | Retain in adapter/config layers |
| **Security Constant** | ~45 rows | Retain; vault/env naming only |
| **Technical Constant** | ~200+ rows | Retain; screen IDs, HTTP, schema enums |
| **Business Hardcode** | **~85 significant** | Remove, extract to registry, or **King approval** |

**Highest-risk business hardcodes:** V1 marketplace/supplier scope in activation gates, duplicated score thresholds (50/70/72), commerce-intelligence `amazon-us` literals, frontend default mission path **CJ → Amazon US**, fixed PROOF-001 critical path, and cockpit demo data (**Nova Home**) presented alongside live panels.

**Prior G3 correction:** Product Intelligence Engine now uses `intelligence-market-discovery.ts` — documented as the **reference pattern** for future Intelligence Engines.

---

## 1. Audit Methodology

### 1.1 Scope

| Area | Paths scanned |
|------|----------------|
| Backend runtime & orchestration | `backend/src/**` (~1,400+ TS modules) |
| Grand King Cockpit | `empireai-web/components/cockpit/**` |
| Legacy dashboard | `frontend/src/**` |
| Governance & artifacts | `docs/governance/**`, `artifacts/**` (cross-reference only) |

### 1.2 Search dimensions

Countries · Marketplaces · Suppliers · Channels · Products · Brands · Categories · AI Engines · Workflows · Dashboards · Business rules · Thresholds · Statuses · Providers · Integrations · Version assumptions (V1, B6, G3, G4, PROOF-001, SUCCESS-001)

### 1.3 Classification framework

| Class | Definition | Examples |
|-------|------------|----------|
| **1. Infrastructure Constant** | Platform wiring: API base URLs, marketplace native IDs, adapter formatter IDs, rate limits, plugin registration | SP-API endpoint `sellingpartnerapi-na.amazon.com`, Amazon marketplace ID `ATVPDKIKX0DER` |
| **2. Security Constant** | Credential env var names, vault key requirements, OAuth scopes, `sk_live` prefix checks | `AMAZON_SP_API_REFRESH_TOKEN_NA`, vault min 32 chars |
| **3. Technical Constant** | Schema enums, screen IDs, module boundaries, mission ref labels, test fixtures | `SCR-100`, `G3-01`, `ARCHITECTURE_READY` adapter enum |
| **4. Business Hardcode** | Commercial scope, scoring policy, engine topology, default tenant/objectives, demo catalogue, routing heuristics that change with King strategy | `sellOverallMin: 72`, default `marketplace: "amazon-us"`, `V1_ENGINE_IDS` |

**Rule:** Business Hardcodes require **removal**, **registry extraction**, or **explicit King approval** documented in `EMPIREAI_DECISIONS.md`.

**Exception:** Values in **designated canonical registry files** (see §6) are deployment configuration — not engine logic — when engines **read** them dynamically.

---

## 2. Summary Statistics

### 2.1 Registry vs duplication

```
┌─────────────────────────────────────────────────────────────┐
│  CANONICAL REGISTRIES (approved deployment config)          │
│  global-commerce-registry · marketplace-channel-registry    │
│  provider-catalog · integrations-hub · empire-platform      │
└───────────────────────────┬─────────────────────────────────┘
                            │ should be sole source
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  BUSINESS HARDCODE ZONES (duplicate or bypass registries)   │
│  version-1-activation-config · commerce-intelligence-core   │
│  cockpit-panel-views progress · frontend LaunchCenter       │
│  recommendation-engine thresholds · objective defaults      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Hardcode density by layer

| Layer | Business | Technical | Infrastructure | Security |
|-------|----------|-----------|----------------|----------|
| Intelligence (`backend/src/intelligence`) | **22** | 18 | 8 | 2 |
| Orchestration | **18** | 35 | 25 | 12 |
| Domain / Cockpit services | **14** | 28 | 5 | 1 |
| Runtime / Global commerce | **8** (seed scores) | 15 | **40** | 3 |
| Operational access | **6** | 10 | 12 | 5 |
| Frontend dashboard | **12** | 8 | 4 | 0 |
| empireai-web cockpit | **11** (demo) | 22 | 2 | 0 |
| Validation tests | 0 (fixtures mirror prod) | **80+** | 20 | 8 |

---

## 3. Findings by Domain

### 3.1 Countries

| Location | Hardcoded | Class | Notes |
|----------|-----------|-------|-------|
| `runtime/global-commerce/data/global-commerce-registry-data.ts` | 19 countries, 3 regions | **Business** (registry) | **Approved registry** — canonical country catalog |
| `runtime/global-commerce-intelligence/data/country-intelligence-seed-data.ts` | Maturity/tax scores per ISO code | **Business** | Seed intelligence — should be `country-intelligence-registry` with King-approved baselines |
| `runtime/global-commerce-infrastructure/data/infrastructure-seed-data.ts` | SG/US/GB/MY dependency rules | **Business** + Infra | Per-country fulfilment/payment dependencies |
| `frontend/src/api/discovery.ts` | `targetMarket: "US"` default | **Business** | Should default from workspace primary market registry |
| `frontend/src/pages/dashboard/ProductDiscoveryPage.tsx` | Default `"US"` | **Business** | Same |
| `intelligence/commerce-intelligence-core/*` | US-centric study assumptions | **Business** | Not registry-driven |

### 3.2 Marketplaces & channels

| Location | Hardcoded | Class | Notes |
|----------|-----------|-------|-------|
| `intelligence/shared/marketplace-channel-registry.ts` | V1: amazon-us, amazon-sg, shopee-sg, shopify | **Business** (registry) | **Approved** post-G3 correction |
| `orchestration/version-1-activation/version-1-activation-config.ts` | `V1_PRODUCTION_MARKETPLACE_IDS = ["amazon-us","amazon-sg"]` | **Business** | Duplicates channel registry — consolidate |
| `orchestration/reality-integration/live-commerce/config.ts` | Marketplaces = Amazon US/SG only | **Business** | Live boundary — should read deployment registry |
| `orchestration/reality-integration/live-commerce/adapters/registry.ts` | 3 live adapters only | **Technical** | Implementation boundary OK if registry-driven |
| `orchestration/reality-integration/live-commerce/amazon-marketplace-profiles.ts` | amazon-us, amazon-sg profiles | **Infrastructure** + Security | Amazon adapter layer — OK |
| `runtime/marketplace-publishing/models/marketplace-adapter.ts` | 9 publish adapter slots | **Business** (registry) | Adapter catalog — engines should not duplicate |
| `intelligence/commerce-intelligence-core/models/commerce-intelligence-core.ts` | `marketplaceId: z.literal("amazon-us")` | **Business** | **Remove** — use registry-resolved id |
| `intelligence/commerce-intelligence-core/services/marketplace-study-service.ts` | `marketplaceId: "amazon-us"` | **Business** | **Remove** |
| `domain/services/cockpit-panel-views.ts` → `loadMarketplaceEnginePanel` | Amazon-only channel rows + shopee/shopify literals | **Business** | Should use `listAvailableChannels()` |
| `frontend/src/pages/dashboard/LaunchCenterPage.tsx` | `marketplace: "amazon-us"` | **Business** | Default mission path |
| `frontend/src/lib/mission-engine.ts` | Shopify connection steps | **Business** | Platform-specific mission template |

**Expansion marketplaces** (Lazada, TikTok Shop, Walmart, Etsy, eBay, Mercado Libre, Rakuten) are pre-registered in `global-commerce-registry-data.ts` (~70 rows) but **not** duplicated in G3 PIE after G3 dynamic-discovery correction.

### 3.3 Suppliers

| Location | Hardcoded | Class | Notes |
|----------|-----------|-------|-------|
| `intelligence/shared/marketplace-channel-registry.ts` | `cj-dropshipping` sole V1 supplier | **Business** (registry) | **Approved** deployment row |
| `orchestration/version-1-activation/version-1-activation-config.ts` | `V1_PRODUCTION_REALITY_SUPPLIER = "cj-dropshipping"` | **Business** | Duplicate — read supplier registry |
| `connectors/catalog.ts` | CJ, AliExpress, Zendrop, AutoDS, Spocket | **Business** (registry) | Connector catalog |
| `suppliers/supplier-connector-framework/adapters/supplier-adapter-registry.ts` | 4 supplier templates | **Infrastructure** + Business | Adapter registry |
| `frontend/src/pages/dashboard/InfrastructurePage.tsx` | Filter `["cj-dropshipping","aliexpress","zendrop","spocket"]` | **Business** | Should load from supplier registry API |
| `frontend/src/api/discovery.ts` | `existingSupplierNetwork: ["cj-dropshipping"]` | **Business** | Default supplier assumption |

### 3.4 Products, brands, categories

| Location | Hardcoded | Class | Notes |
|----------|-----------|-------|-------|
| `intelligence/commerce-intelligence-core/services/product-fit-service.ts` | Categories: accessory/kitchen/appliance; cost ≥ $22 → Shopify | **Business** | Routing heuristics need policy registry |
| `empireai-web/components/cockpit/widgets/intelligence/intelligenceDemoData.ts` | Home/Electronics/Mobile; sample SKUs | **Business** (demo) | Label as demo-only |
| `empireai-web/components/cockpit/widgets/store/commerceStoreDemoData.ts` | Brand **Nova Home**; Ambient Lamp Pro | **Business** (demo) | 11 `*DemoData.ts` files share Nova Home |
| `intelligence/product-intelligence-engine/mock-catalog.ts` | Seeded product names | **Technical** (test/mock) | OK in mock layer |

### 3.5 AI Engines

| Location | Hardcoded | Class | Notes |
|----------|-----------|-------|-------|
| `domain/services/cockpit-panel-views.ts` | `COCKPIT_ENGINE_IDS` (6 engines) | **Business** | V1 engine set — needs `engine-registry` |
| `domain/services/executive-dashboard-integration.ts` | `V1_ENGINE_IDS` (9), `V1_DEPENDENCY_EDGES` (12) | **Business** | Commercial spine graph — governance artifact |
| `domain/services/engine-center-views.ts` | Routes + `FUTURE_EXPANSION_SLOTS` | **Business** + Technical | Expansion slots are business roadmap |
| `intelligence/product-intelligence-engine/engine-architecture.ts` | 5 integration engine IDs | **Business** | Should read engine relationship registry |
| `orchestration/master-completion-ledger/models/program-catalog.ts` | Program names including Marketplace Intelligence | **Business** (catalog) | MCL program registry |

### 3.6 Workflows

| Location | Hardcoded | Class | Notes |
|----------|-----------|-------|-------|
| `runtime/product-launch-commander/services/product-launch-commander-service.ts` | 10-step `LAUNCH_STEPS` with score gates | **Business** | Workflow template registry |
| `orchestration/objective-management-engine/services/objective-default-objectives.ts` | PROOF-001 critical path B5→B6→B7→B8 | **Business** | King mission config — document as approved or externalize |
| `orchestration/version-1-activation/b6-credential-implementation.ts` | Fixed B6-01a…B6-05 items | **Infrastructure** + Business | Credential tracker — mission metadata |
| `domain/services/executive-dashboard-integration.ts` | Fixed dependency edges + approval routes | **Business** | G4-05 spine — belongs in governance JSON |

### 3.7 Dashboards & widgets

| Location | Hardcoded | Class | Notes |
|----------|-----------|-------|-------|
| `domain/services/cockpit-panel-views.ts` | G4-06-W01…W10 widget registry, refresh `45s`, B6 copy | **Business** + Technical | Widget contract registry |
| `domain/services/cockpit-interaction-layer.ts` | SCR-001…SCR-801 screen registry | **Technical** | Screen routing — OK as technical registry |
| `empireai-web/components/cockpit/shell/ExecutiveCommandStrip.tsx` | Blocker keys B5/B6/B7/B8 | **Business** | V1 certification UX |
| `empireai-web/components/cockpit/widgets/IntelligenceEnginePanels.tsx` | `score >= 70` filter | **Business** | Duplicates threshold policy |
| 11 × `*DemoData.ts` | Nova Home, fixed scores, policies | **Business** (demo) | Must not feed live metrics |

### 3.8 Business rules & thresholds

| Location | Thresholds | Class |
|----------|------------|-------|
| `intelligence/product-intelligence-engine/recommendation-engine.ts` | sell 72/62/55; reject 42/28/28/35 | **Business** |
| `intelligence/supplier-intelligence-engine/recommendation-engine.ts` | sell trust 72, reliability 70; reject fake 65 | **Business** |
| `intelligence/supplier-intelligence-engine/supplier-guard.ts` | `SUPPLIER_GUARD_THRESHOLDS` object | **Business** |
| `intelligence/product-intelligence-engine/score-computers.ts` | Margin tiers 70/50; seasonality ±8/−5 | **Business** |
| `intelligence/product-intelligence-engine/engine-architecture.ts` | Lifecycle 70/50 gates | **Business** |
| `intelligence/commerce-intelligence-core/services/product-fit-service.ts` | premium ≥ 70, cost ≥ 22 | **Business** |
| `orchestration/commerce-readiness-engine/services/commerce-readiness-evaluator.ts` | Governance 70, treasury 30/50, cap 100_000 | **Business** |
| `orchestration/objective-management-engine/services/objective-management-service.ts` | Confidence 35/70; urgency 14d/30d weights | **Business** |
| `global-notifications/services/notification-ingestion-service.ts` | Readiness 35/50/70 severity bands | **Business** |
| `domain/services/cockpit-panel-views.ts` | Health 80/40; per-engine progress literals | **Business** |
| `runtime/global-commerce/services/onboarding-readiness-service.ts` | Risk bands 70/40 | **Business** |
| `orchestration/reality-integration/live-commerce/services/live-commerce-integration-service.ts` | Go-live `score >= 70` | **Business** |

**Anti-pattern:** Score bands **50 / 70 / 72** appear independently in **12+ modules** with no shared policy registry.

### 3.9 Statuses

| Location | Status enum | Class | Notes |
|----------|-------------|-------|-------|
| `orchestration/commerce-readiness-engine/models/commerce-readiness.ts` | NOT_READY / READY_WITH_WARNINGS / READY_TO_LAUNCH | **Business** | Launch governance — OK as domain enum if centralized |
| `runtime/marketplace-publishing/models/marketplace-adapter.ts` | ARCHITECTURE_READY → LIVE_BLOCKED | **Business** | Publishing lifecycle |
| `orchestration/version-1-activation/b6-credential-implementation.ts` | PENDING / CONFIGURED / VERIFIED | **Business** + Security | Credential lifecycle |
| `intelligence/*/recommendation-engine.ts` | SELL / REVIEW / DO_NOT_SELL | **Business** | Decision outcomes — doctrine-aligned |

### 3.10 Supported providers & integrations

| Location | Content | Class |
|----------|---------|-------|
| `orchestration/reality-integration/models/provider-catalog.ts` | 38 reality providers | **Business** (registry) + Infra |
| `operational-access/integrations-hub/models/integrations-hub-catalog.ts` | 31 integrations; live vs future flags | **Business** (registry) |
| `operational-access/models/empire-platform-catalog.ts` | 20 platforms; revenue-blocking flags | **Business** (registry) |
| `connectors/catalog.ts` | Connector replaceability graph | **Business** (registry) |
| `intelligence/connectors/mock-providers.ts` | Mock provider name list | **Technical** |

### 3.11 Version-specific assumptions

| Assumption | Primary locations | Class |
|------------|-------------------|-------|
| V1 marketplaces Amazon US/SG | `version-1-activation-config.ts`, live-commerce | **Business** |
| V1 supplier CJ only | Same + channel registry | **Business** |
| B6 credential mission items | `b6-credential-implementation.ts`, cockpit panels | **Business** + Infra |
| PROOF-001 / SUCCESS-001 | objective defaults, frontend Success001 page, command strip | **Business** |
| G3/G4 mission refs | engine-architecture, widget IDs | **Technical** (labels) |
| `co-grand-king` default company | 15+ domain/OBJ routes | **Business** | Tenant default — workspace registry |
| `ws_empire_1` default workspace | brain init, OBJ routes | **Business** |

---

## 4. Business Hardcode Register

Each entry: **why it exists**, **dynamic architecture**, **registry replacement**.

### 4.1 Critical — commercial scope (P0)

| ID | Location | Why it exists | Dynamic architecture | Registry replacement |
|----|----------|---------------|----------------------|---------------------|
| BH-001 | `version-1-activation-config.ts` — `V1_PRODUCTION_MARKETPLACE_IDS` | V1 go-live gate for PROOF-001 | Activation service queries deployment registry + credential state | `marketplace-channel-registry.ts` + `V1_MARKETPLACE_CHANNEL_REGISTRY.md` |
| BH-002 | `version-1-activation-config.ts` — `V1_PRODUCTION_REALITY_SUPPLIER` | Single V1 fulfilment path | Supplier activation from supplier deployment registry | `SUPPLIER_CHANNEL_DEPLOYMENT_PROFILES` |
| BH-003 | `commerce-intelligence-core` — `amazon-us` literal | Early mission prototype for first SKU path | Study service accepts `registryId` from discovery snapshot | `intelligence-market-discovery.ts` |
| BH-004 | `frontend/LaunchCenterPage.tsx` — CJ + amazon-us defaults | UX shortcut for V1 demo mission | Mission API returns workspace default route from registry | `mission-defaults-registry` (workspace-scoped) |
| BH-005 | `cockpit-panel-views.ts` — `loadMarketplaceEnginePanel` Amazon-only rows | B6-01D scope at panel build time | Panel loader maps all deployment channels | `listAvailableChannels()` + credential assessor |
| BH-006 | `live-commerce/config.ts` — closed marketplace list | Live adapter safety boundary | Config derived from deployment registry ∩ live adapters | `marketplace-channel-registry` + `adapters/registry.ts` |

### 4.2 High — scoring & decision policy (P1)

| ID | Location | Why it exists | Dynamic architecture | Registry replacement |
|----|----------|---------------|----------------------|---------------------|
| BH-010 | `product-intelligence-engine/recommendation-engine.ts` — DEFAULT thresholds | PIE sell/reject policy from Mission 005 | `deriveRecommendation({ thresholds })` loads workspace policy | `executive-scoring-policy-registry` (King-approved JSON/YAML) |
| BH-011 | `supplier-intelligence-engine/supplier-guard.ts` | Guardian fake-supplier protection | Guard reads policy version from registry | Same scoring policy registry · GVD-linked |
| BH-012 | `commerce-readiness-evaluator.ts` — 70/75/30/50/100_000 | Launch readiness heuristics | Evaluator loads dimension weights per company tier | `commerce-readiness-policy-registry` |
| BH-013 | `objective-management-service.ts` — confidence 35/70, urgency weights | Executive health UX | OMS reads objective policy pack | `objective-management-policy-registry` |
| BH-014 | Duplicated `>= 70` in cockpit UI + 8 backend modules | Copy-paste threshold bands | Single `resolveThreshold(band, context)` | Central `EMPIRE_SCORE_BANDS` registry |
| BH-015 | `product-fit-service.ts` — category boosts, $22 Shopify gate | Premium vs marketplace routing heuristic | Fit engine loads route rules by category registry | `product-route-policy-registry` |

### 4.3 High — engine & workflow topology (P1)

| ID | Location | Why it exists | Dynamic architecture | Registry replacement |
|----|----------|---------------|----------------------|---------------------|
| BH-020 | `executive-dashboard-integration.ts` — `V1_ENGINE_IDS`, `V1_DEPENDENCY_EDGES` | G4-05 commercial spine visualization | Graph builder loads nodes/edges from registry | `engine-topology-registry.json` (versioned) |
| BH-021 | `cockpit-panel-views.ts` — `COCKPIT_ENGINE_IDS` | V1 cockpit engine tabs | Shell reads engine registry | Same engine topology registry |
| BH-022 | `product-launch-commander-service.ts` — `LAUNCH_STEPS` | Canonical launch pipeline | Workflow engine interprets step definitions | `workflow-template-registry` (REAL-013 aligned) |
| BH-023 | `objective-default-objectives.ts` — PROOF-001 critical path | OBJ-001 seed for Grand King account | Objectives loaded from mission config store | `executive-mission-registry` (King-approved) |
| BH-024 | `engine-center-views.ts` — `FUTURE_EXPANSION_SLOTS` | Roadmap placeholders in UI | Expansion slots from MCL/program catalog | `master-completion-ledger/program-catalog.ts` |

### 4.4 Medium — tenant, demo, UI defaults (P2)

| ID | Location | Why it exists | Dynamic architecture | Registry replacement |
|----|----------|---------------|----------------------|---------------------|
| BH-030 | `co-grand-king` / `ws_empire_1` defaults (15+ files) | Single-tenant V1 dev default | API requires explicit workspace; no silent default in prod | `workspace-tenant-registry` |
| BH-031 | 11 × cockpit `*DemoData.ts` — Nova Home | G4 placeholder UX before live data | Demo flag gates all demo files; live panels never import demo | `cockpit-data-mode: live|demo` env + API-only live path |
| BH-032 | `frontend/discovery.ts` — US + CJ defaults | Client-side mission bootstrap | Discovery API returns workspace profile | Workspace commerce profile registry |
| BH-033 | `country-intelligence-seed-data.ts` | Expansion scoring bootstrap | Intelligence loads country profiles from DB/registry | `country-intelligence-registry` with King baseline approval |
| BH-034 | `integrations-hub-catalog.ts` — live/future flags | IH-001 UX catalog | Flags computed from adapter activation state | Derive from `empire-platform-catalog` + runtime activation |
| BH-035 | `ExecutiveCommandStrip.tsx` — B5/B6/B7/B8 only | V1 cert strip | Certification registry drives visible blockers | `VERSION_1_CERTIFICATION_BLOCKER_REGISTER.md` → runtime |

### 4.5 Low — acceptable with documentation (P3)

| ID | Location | Why it exists | Recommendation |
|----|----------|---------------|----------------|
| BH-040 | `global-commerce-registry-data.ts` — 19 countries, ~70 marketplaces | B-006 architecture catalog | **King-approved registry** — do not duplicate elsewhere |
| BH-041 | `marketplace-channel-registry.ts` — V1 deployment rows | ADR-052 deployment config | **Approved** — engines must read, not copy |
| BH-042 | `provider-catalog.ts` — 38 providers | Reality integration catalog | **Approved registry** — add providers by row insertion |
| BH-043 | `gvd-catalog.ts` — GVD-001…030 | Immutable governance doctrine | **Not runtime business logic** — constitutional |
| BH-044 | `amazon-marketplace-profiles.ts` | Amazon SP-API adapter | **Infrastructure** at adapter layer — OK |
| BH-045 | Validation test fixtures (Amazon/CJ/US/SG) | Test parity with V1 | **Technical** — keep; must track registry changes |

---

## 5. Acceptable Constants Inventory (Summary)

### 5.1 Infrastructure Constant (retain)

- SP-API / Shopee / Shopify API base URLs and marketplace native IDs  
- Adapter `formatterId` / `validatorId` mappings  
- Runtime plugin IDs (`shopify`, `amazon`)  
- Rate limits in `provider-catalog.ts`  
- Database schema defaults (`low_balance_threshold_cents DEFAULT 0`)  
- Launch step **technical** state machine enums (when separated from business gates)

### 5.2 Security Constant (retain)

- Env var names: `AMAZON_SP_API_*`, `CJ_API_KEY`, `CREDENTIAL_VAULT_KEY`, `STRIPE_*`  
- Vault minimum length (32)  
- Stripe `sk_live` prefix verification  
- OAuth lifecycle states gated on CONNECTED/VERIFIED  
- Permission matrix role bindings (`operational-access/models/permission-matrix.ts`)

### 5.3 Technical Constant (retain)

- Cockpit screen IDs (`SCR-*`), widget IDs (`G4-06-W*`), module names  
- Mission reference strings (`G3-01`, `B6-01a`) as **labels only**  
- Zod schema enums for API contracts (when generated from registry)  
- Test harness workspace IDs  
- `en-US` / `en-GB` locale formatting  
- Brain SQL migrations and table names

---

## 6. Approved Registry Pattern (Target Architecture)

EmpireAI should converge on **read-only registry consumption**:

```
┌──────────────────────────────────────────────────────────────────┐
│ GOVERNANCE (King-approved, versioned)                            │
│ V1_MARKETPLACE_CHANNEL_REGISTRY.md · EMPIREAI_DECISIONS.md       │
│ VERSION_1_CERTIFICATION_BLOCKER_REGISTER.md                      │
└────────────────────────────┬─────────────────────────────────────┘
                             │ mirrored at deploy time
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ RUNTIME REGISTRIES (deployment configuration)                    │
│ marketplace-channel-registry · global-commerce-registry-data     │
│ provider-catalog · integrations-hub-catalog · empire-platform    │
│ engine-topology-registry (proposed) · scoring-policy-registry    │
└────────────────────────────┬─────────────────────────────────────┘
                             │ read by
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ ENGINES · EVALUATORS · COCKPIT LOADERS (no business literals)    │
│ intelligence-market-discovery · commerce-readiness-evaluator     │
│ cockpit-panel-views · objective-management-service               │
└──────────────────────────────────────────────────────────────────┘
```

### 6.1 Proposed new registries (not yet implemented)

| Registry | Purpose | Replaces |
|----------|---------|----------|
| `executive-scoring-policy-registry` | Sell/reject thresholds, health bands | BH-010…BH-014 |
| `engine-topology-registry` | V1 engine IDs, dependency edges, routes | BH-020, BH-021 |
| `workflow-template-registry` | Launch steps, PROOF critical path | BH-022, BH-023 |
| `workspace-commerce-profile-registry` | Default market, supplier, company | BH-030, BH-032 |
| `mission-defaults-registry` | PROOF-001, SUCCESS-001 parameters | BH-023, frontend milestones |

---

## 7. Cross-Cutting Anti-Patterns

| Anti-pattern | Occurrences | Remediation |
|--------------|-------------|-------------|
| **Registry duplication** | V1 channels in 4+ files | Single `marketplace-channel-registry`; others import |
| **Threshold sprawl** | 50/70/72 in 12+ modules | Central scoring policy registry |
| **Default tenant** | `co-grand-king` silent default | Require workspace context in prod |
| **Demo/live bleed** | Nova Home in 11 demo files | Strict demo mode gate in Cockpit shell |
| **Closed union types** for marketplace IDs | commerce-intelligence-core Zod | `z.string()` + registry validation |
| **Engine assumes platform names** | Amazon/Shopee in summaries | Dynamic `formatIntelligenceSourceSummary()` (G3 fixed) |
| **Version constants in evaluators** | B6 strings in health % | Mission metadata registry |

---

## 8. Governance Recommendations

### 8.1 Immediate (architecture — no code required for audit)

1. **Adopt this audit** as the hardcode governance baseline.  
2. **Classify** any new hardcode in PR review using the four-class framework.  
3. **Block merges** that add marketplace/country/supplier literals outside designated registry paths.  
4. **King approval queue:** Document approved business constants in `EMPIREAI_DECISIONS.md` (e.g. PROOF-001 critical path, default scoring thresholds).

### 8.2 Engineering (future missions)

| Priority | Action |
|----------|--------|
| P0 | Consolidate V1 activation IDs to read `marketplace-channel-registry` only |
| P0 | Extract `executive-scoring-policy-registry`; wire PIE + supplier + cockpit filters |
| P1 | Refactor `commerce-intelligence-core` to registry discovery |
| P1 | Cockpit marketplace panel → dynamic channels |
| P1 | Demo data isolation — `dataMode: demo` cannot render as live metrics |
| P2 | Engine topology externalization for G4-05 graph |
| P2 | Workspace profile registry replaces `co-grand-king` defaults |
| P3 | Country intelligence seed → governed baseline registry with version stamps |

### 8.3 CI guardrails (proposed)

- Lint rule: forbid `amazon-us`, `shopee-sg`, `cj-dropshipping` string literals outside `**/registry/**`, `**/data/*-registry*`, `**/tests/**`, `docs/**`  
- Contract test: `resolveIntelligenceSources()` ids ⊆ deployment registry  
- Registry parity test: governance doc V1 table ↔ `MARKETPLACE_CHANNEL_DEPLOYMENT_PROFILES`

---

## 9. King Approval Queue

Business hardcodes that may be **intentionally fixed** pending explicit King approval:

| Item | Current value | Approval question |
|------|---------------|-------------------|
| V1 live marketplaces | amazon-us, amazon-sg | Confirm ADR-052 still authoritative |
| V1 supplier | cj-dropshipping | Confirm sole V1 fulfilment supplier |
| PIE sell threshold | overall ≥ 72 | Approve as empire default scoring policy |
| PROOF-001 target | +70 days, 12 stages | Approve as default executive objective |
| SUCCESS-001 milestone | USD 100K net profit | Approve or externalize to objective registry |
| Default demo brand | Nova Home | Approve for demo-only mode |
| Grand King tenant | co-grand-king | Approve as platform owner workspace |

---

## 10. Relationship to Prior Audits

| Artifact | Relationship |
|----------|--------------|
| `artifacts/g3-architecture-dynamic-market-discovery-executive-audit.md` | **Implements** BH-001 partial fix for G3 PIE |
| `docs/governance/V1_MARKETPLACE_CHANNEL_REGISTRY.md` | **Authoritative** for BH-040/BH-041 |
| `artifacts/g3-01-product-intelligence-engine-executive-audit.md` | **Superseded** for source hardcoding section |
| `artifacts/g4-10-cockpit-production-readiness-executive-audit.md` | Demo data risk aligns with BH-031 |

---

## 11. Conclusion

EmpireAI's hardcode problem is **not** missing registries — it is **inconsistent use** of them. The platform correctly centralizes countries, marketplaces, and providers in catalog files, but **activation gates, intelligence evaluators, cockpit progress math, and frontend mission defaults** still embed V1 commercial assumptions as code literals.

**Business Hardcodes requiring action:** **~45** (P0–P2) plus **~11** demo-specific (P2).  
**Approved registries to preserve:** **6** primary catalogs.  
**Reference implementation:** `intelligence-market-discovery.ts` + `marketplace-channel-registry.ts`.

**G3-02 gate:** Remains blocked until King accepts hardcode governance direction and P0 registry consolidation is scheduled.

---

*EmpireAI Hardcode Governance Audit · Architecture-only · 2026-07-02 · No code modified*
