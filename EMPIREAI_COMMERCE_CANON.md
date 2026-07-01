# EMPIREAI COMMERCE CANON

> **C001 — Single Source of Truth**  
> Permanent orchestration standard for Grand King, Founder Accounts, AI agents, and future connectors.  
> **Status:** Canonical · **Version:** 1.0 · **Date:** 2026-06-21

> **Roadmap note:** Active kernel architecture: [COMMERCE_OS_BLUEPRINT.md](./COMMERCE_OS_BLUEPRINT.md) (COS-001). This canon remains **ACTIVE** for lifecycle mapping. COS implements canon phases through domain kernels and adapters.

This document **does not replace** any existing module. It **maps** the one canonical commerce lifecycle onto modules, APIs, tools, tables, and UI that already exist. Live commerce execution extends this canon through **COS adapters** — it does not fork it.

---

## 1. Commerce Canon (Doctrine)

### 1.1 What EmpireAI Commerce Is

EmpireAI is an **AI-powered e-commerce operating system** whose **first commercial model** is **global dropshipping** — discover products, evaluate suppliers and marketplaces, publish listings, fulfill orders, and record profit through a **single canonical lifecycle**.

Every business:

1. Is **discovered** from market intelligence  
2. Is **evaluated and approved** by human authority (Founder / Grand King)  
3. Is **built** as packages (brand, product, listings, strategy) — never live-executed until readiness gates pass  
4. Is **validated** against commerce readiness (accounts, marketplaces, suppliers, payments, governance)  
5. Is **published, marketed, and sold** through gated live execution modules  
6. Is **fulfilled, retained, and optimized** through order pipeline + intelligence  
7. Is **scaled or archived** with permanent soul-memory and OFD milestones  

### 1.2 Non-Negotiable Rules

| Rule | Enforcement |
|------|-------------|
| **One lifecycle** | All modules align to §2 phases; no alternate business-creation paths |
| **Reuse, never duplicate** | New work extends existing modules; no parallel orchestrators |
| **Connection ≠ Execution** | `reality-integration` connects; execution modules (`live-payment`, `live-cj`, `meta-ads`, future Shopify) act |
| **Build-only until ready** | `business-build-engine`, `execution-layer` packages have `publishBlocked` / protection flags until Project Reality |
| **Human approval gates** | Founder/Grand King for approve, launch, live fulfillment, live ads, live payments |
| **Marketplace autonomy** | After one-time founder onboarding and approved credentials, EmpireAI executes publish · sync · route · fulfil · monitor per **REAL-051A** — subject to approval chain (CBD-018) |
| **REAL vs SIMULATED** | OFD milestones after first visitor require `externalReference`; metrics labeled by source |
| **Governance first** | `empire-governance` evaluates before connector connect and destructive dispatch |
| **Commercial Risk Intelligence (CRI)** | Before launch: CRIR required — supplier + marketplace refund/dispute/shipping/margin/survivability analysis (`docs/governance/COMMERCIAL_RISK_INTELLIGENCE_DOCTRINE.md`) |
| **Survival over speculative profit** | No launch whose refund/dispute structure can reasonably cause systematic financial loss (CRI-003) |
| **Soul memory permanent** | `soul-runtime` captures milestones, lessons, doctrine — never deleted on archive |

### 1.3 Authority Model

| Actor | Scope |
|-------|--------|
| **Grand King** | Flagship account (`co-grand-king`); full launch authority; Operation First Dollar |
| **Founder** | Portfolio companies; same module stack, scoped by `workspaceId` / `companyId` |
| **AI Agents (Brain)** | Orchestrate via registered tools; L2 authority; Guardian + Governance pre-dispatch |
| **Connectors** | Implement Empire Connector Contract (§5); never bypass vault or governance |

---

## 2. Canonical Commerce Lifecycle

Every business follows **one** lifecycle. Stages below map 1:1 to existing modules — no new workflows.

```
IDEA → DISCOVERY → EVALUATION → APPROVAL → BRANDING → BUILD → SIMULATION
  → READINESS → PUBLICATION → MARKETING → ORDER → FULFILLMENT → CUSTOMER
  → RETENTION → OPTIMIZATION → SCALING → ARCHIVE
```

### Stage Reference

| Phase | Purpose | Required Inputs | Required Outputs | Responsible Modules | Blocking Conditions | Approval Rules | Exit Conditions |
|-------|---------|-----------------|------------------|---------------------|---------------------|----------------|-----------------|
| **IDEA** | Capture brand/category intent | `brand`, `category`, `targetMarket`, `companyId` | Discovery session created | `product-discovery-opportunity-engine`, `ecommerce-os-orchestrator` | None | None | Session at `BRAND_CHOSEN` |
| **DISCOVERY** | Find ranked product opportunities | Discovery input, supplier network | `ProductOpportunity[]`, session `OPPORTUNITIES_READY` | `product-discovery-opportunity-engine` | Empty category/brand | None | Scout scores computed; opportunities ranked |
| **EVALUATION** | Compare economics, strategy, risk | Approved discovery opportunities | Business opportunity records, strategy doc, simulation | `business-opportunity-workspace`, `market-domination-strategy-engine`, `business-simulation-engine` | No opportunities | None | Opportunities synced to workspace |
| **APPROVAL** | Human commit to build | Ranked opportunities, previews | `APPROVED` opportunity, preview `APPROVED_FOR_BUILD`, workflow `APPROVED` | `business-opportunity-workspace`, `business-preview-studio`, `ecommerce-os-orchestrator` | Domination score / scout `REJECT` | **Founder/Grand King:** approve product, approve preview, approve workflow products | Status `APPROVED` / `READY_FOR_BUILD` |
| **BRANDING** | Visual + narrative identity | Approved opportunity | Brand preview, palette, story, marketplace preview URLs | `business-preview-studio` | Preview not generated | Optional regenerate | Preview `GENERATED` or `APPROVED_FOR BUILD` |
| **BUILD** | Assemble build packages (no live publish) | Approved opportunity + preview + strategy | `BusinessBuildPackage` `READY_FOR_PUBLICATION` | `business-build-engine` | Missing preview/strategy | None | Build validate passes |
| **SIMULATION** | Financial/commercial projection | Build package | Simulation + launch recommendation | `business-simulation-engine` | Build not ready | None | Recommendation `READY_FOR_LAUNCH` or `LAUNCH_WITH_CAUTION` |
| **READINESS** | Gate before any live action | Build, simulation, connections, **CRIR certification** | `CommerceReadinessEvaluation`, launch decision | `commerce-readiness-engine`, `marketplace-connection-engine`, `account-infrastructure-engine`, `reality-integration` | BLOCKING readiness blockers; connectors not CONNECTED; **CRIR not GOVERNANCE_CERTIFIED or survivability FAIL** | Governance policies; human steps in human-action queue | `launchDecision`: `READY_TO_LAUNCH` |
| **PUBLICATION** | Prepare listings (packages + local storefront) | Build package, store record | `PublicationPackage`, catalog publish record | `execution-layer`, `product-publishing-engine`, `minimum-live-revenue-loop`, `production-store-deployment` | `publishBlocked: true` until Project Reality; commerce readiness NOT_READY | **Grand King:** production deployment approval | Package complete; local/Vercel storefront deployed |
| **MARKETING** | Campaign packages + live ads (gated) | Publication package, Meta OAuth | Marketing package; Meta campaign (if live) | `execution-layer`, `meta-ads-connector` | `executionBlocked` on ads without OAuth; `MetaAdsBlockedError` | **Founder:** campaign approve + launch | Campaign `ACTIVE` or package ready |
| **ORDER** | Checkout → payment → order record | Live/m mock storefront, Stripe | `CustomerOrderPipelineRecord`, ledger event | `live-payment-engine`, `customer-order-pipeline`, `minimum-live-revenue-loop` | Stripe not configured; `LIVE_PAYMENT_ENABLED` | Webhook verification | Status `ORDER_CREATED` or beyond |
| **FULFILLMENT** | Supplier submit → tracking → delivery | Paid order, CJ connection | CJ fulfillment record, tracking | `live-cj-fulfillment`, `customer-order-pipeline` | `CUSTOMER_ORDER_PIPELINE_LIVE_FULFILLMENT_ENABLED`; CJ not connected | **Founder:** fulfillment approve + submit | `DELIVERED` or terminal failure |
| **CUSTOMER** | Post-sale customer state | Order pipeline | Customer lifetime record | `execution-layer` (customer-lifetime package) | None | None | Customer profile linked |
| **RETENTION** | Repeat purchase / engagement | Customer + Eye intel | Retention recommendations | `execution-layer`, `eye-series` (customer eye) | None | None | Recommendations generated |
| **OPTIMIZATION** | Pricing, ads, catalog tuning | KPIs, Eye reports, OFD learning | Growth optimization record | `execution-layer`, `eye-series`, `operation-first-dollar` | None | Founder for material changes | Optimization package updated |
| **SCALING** | Multi-channel, multi-product growth | LIVE business + OFD milestones | OFD phase `SCALING`, expanded listings | `operation-first-dollar`, `execution-layer`, `ecommerce-os-orchestrator` | First dollar not achieved | Grand King strategic approval for scale | OFD phase transition |
| **ARCHIVE** | Retire business with memory | Founder decision | `REJECTED` / history record; soul lesson | `business-opportunity-workspace`, `soul-runtime` | Active orders in flight | **Founder/Grand King:** explicit reject/archive | No pending pipelines; archived in history |

---

## 3. Commerce State Machine

Every business is in **exactly one** canonical state. Module-level statuses map into this machine — agents MUST NOT invent parallel states.

### 3.1 Canonical States

| State | Meaning | Maps From (existing enums) |
|-------|---------|---------------------------|
| `DRAFT` | Intent only; no discovery session | No session / workflow |
| `DISCOVERING` | Active product discovery | `DISCOVERY_SESSION_STAGES`: `BRAND_CHOSEN` → `DISCOVERING` → `OPPORTUNITIES_READY` |
| `UNDER_REVIEW` | Portfolio evaluation | `BUSINESS_OPPORTUNITY_STATUSES.UNDER_REVIEW`; workflow `AWAITING_APPROVAL` |
| `APPROVED` | Human approved; pre-build | `APPROVED`, `READY_FOR_BUILD`; workflow `APPROVED` |
| `BUILDING` | Package assembly in progress | `BUSINESS_BUILD_STATUSES.BUILDING`; workflow `PREPARING_ASSETS` |
| `READY` | Built + readiness passed | `READY_FOR_PUBLICATION`; `READY_TO_LAUNCH`; `launchDecision.READY_TO_LAUNCH` |
| `PUBLISHING` | Publication/deploy in progress | Product publish `DRAFT`→`PUBLISHED`; deployment `PENDING_APPROVAL` |
| `LIVE` | Accepting orders | Workflow `LAUNCHED`; OFD `LIVE_TRADING`+; pipeline active |
| `SCALING` | Growth phase | OFD `SCALING` |
| `PAUSED` | Intentionally halted | Connector `DISABLED`; workflow blocked; `PAUSED` metadata |
| `ARCHIVED` | Retired | `REJECTED`; history record |
| `FAILED` | Terminal error | Build `FAILED`; pipeline `FAILED`; connector `FAILED` |

### 3.2 State Transitions

```
DRAFT ──start discovery──► DISCOVERING
DISCOVERING ──opportunities ready──► UNDER_REVIEW
UNDER_REVIEW ──approve──► APPROVED
UNDER_REVIEW ──reject──► ARCHIVED
APPROVED ──start build──► BUILDING
BUILDING ──build complete──► READY (if readiness OK)
BUILDING ──build fail──► FAILED
READY ──publish/deploy──► PUBLISHING
PUBLISHING ──go live──► LIVE
LIVE ──first dollar achieved──► LIVE (OFD sub-phase advances)
LIVE ──scale trigger──► SCALING
SCALING ──continue──► SCALING
LIVE/SCALING ──pause──► PAUSED
PAUSED ──resume──► LIVE
LIVE/SCALING/PAUSED ──archive──► ARCHIVED
FAILED ──recover/retry──► BUILDING or READY (module-dependent)
```

### 3.3 Per-State Rules

| State | Allowed Actions | Blocked Actions |
|-------|-----------------|-----------------|
| `DRAFT` | Start discovery, configure brand/category | Build, publish, charge, fulfill |
| `DISCOVERING` | Run discovery, rank, filter | Approve without opportunities |
| `UNDER_REVIEW` | Compare, save, reject, approve | Live publish, payments |
| `APPROVED` | Generate preview, start build, strategy | Live marketplace API calls |
| `BUILDING` | Build validate, simulation | Live ads, live fulfillment |
| `READY` | Readiness evaluate, prepare launch, local publish | Live connector execution (Project Reality) |
| `PUBLISHING` | Deploy storefront, prepare catalog | Skip readiness gates |
| `LIVE` | Orders, marketing (gated), fulfillment (gated) | Archive with open pipelines |
| `SCALING` | Multi-listing, optimization, OFD sync | Bypass governance |
| `PAUSED` | Resume, archive | New orders (should gate at checkout) |
| `ARCHIVED` | View history, soul lessons | All live operations |
| `FAILED` | Retry, diagnose, reject | Silent auto-retry without audit |

---

## 4. Commerce Orchestration Map

### 4.1 Lifecycle Phase → Module Matrix

| Phase | Primary Module | Supporting Modules |
|-------|----------------|-------------------|
| IDEA | `ecommerce-os-orchestrator` | `product-discovery-opportunity-engine` |
| DISCOVERY | `product-discovery-opportunity-engine` | `eye-series` (product eye) |
| EVALUATION | `business-opportunity-workspace` | `market-domination-strategy-engine`, `business-simulation-engine` |
| APPROVAL | `business-opportunity-workspace` | `business-preview-studio`, `ecommerce-os-orchestrator` |
| BRANDING | `business-preview-studio` | `business-build-engine` (brand assets) |
| BUILD | `business-build-engine` | `business-preview-studio`, `market-domination-strategy-engine` |
| SIMULATION | `business-simulation-engine` | `business-build-engine` |
| READINESS | `commerce-readiness-engine` | `marketplace-connection-engine`, `account-infrastructure-engine`, `reality-integration`, `empire-governance` |
| PUBLICATION | `execution-layer` | `product-publishing-engine`, `minimum-live-revenue-loop`, `production-store-deployment` |
| MARKETING | `execution-layer` | `meta-ads-connector`, `analytics-conversion-engine` |
| ORDER | `customer-order-pipeline` | `live-payment-engine`, `minimum-live-revenue-loop` |
| FULFILLMENT | `live-cj-fulfillment` | `customer-order-pipeline` |
| CUSTOMER | `execution-layer` | `grand-kings-revenue-engine` |
| RETENTION | `execution-layer` | `eye-series` |
| OPTIMIZATION | `execution-layer` | `eye-series`, `operation-first-dollar` |
| SCALING | `operation-first-dollar` | `ecommerce-os-orchestrator`, `execution-layer` |
| ARCHIVE | `business-opportunity-workspace` | `soul-runtime` |

### 4.2 APIs Reused (REST — no duplication)

| Phase | Endpoints |
|-------|-----------|
| DISCOVERY | `POST /product-discovery/sessions/start`, `/sessions/:id/discover`, `/sessions/:id/approve` |
| EVALUATION/APPROVAL | `GET /business-workspace/opportunities`, `POST /:id/approve`, `/compare` |
| BRANDING | Brain dispatch `business-preview-studio.generate/get/approve` |
| BUILD | `POST /business-build/start`, `GET /:buildId/package` |
| SIMULATION | `POST /business-simulation/run`, `GET /:id/recommendation` |
| READINESS | `GET /commerce-readiness/evaluate`, `/launch-decision` |
| PUBLICATION | `POST /execution-layer/publication/*`, `/product-publishing/*`, `/revenue-loop/*` |
| MARKETING | `/execution-layer/marketing/*`, `/meta-ads/*` |
| ORDER | `/live-payments/*`, `/customer-order-pipeline/*`, `/webhooks/stripe` |
| FULFILLMENT | `/live-cj-fulfillment/*` |
| INFRASTRUCTURE | `/reality-integration/*`, `/marketplace-connection/*`, `/account-infrastructure/*` |
| COMMAND | `/ecommerce-os/dashboard`, `/operation-first-dollar/*`, `/execution-layer/executive-command` |
| INTELLIGENCE | `/eye-series/*` |

### 4.3 Brain Tools Reused (representative)

| Module | Tool prefix | Count |
|--------|-------------|-------|
| product-discovery | `product_discovery.*` | 6 |
| business-workspace | `business_workspace.*` | 6 |
| business-preview | `business_preview.*` | 5 |
| market-strategy | `market_strategy.*` | 5 |
| business-build | `business_build.*` | 5 |
| business-simulation | `business_simulation.*` | 5 |
| commerce-readiness | `commerce_readiness.*` | 4 |
| execution-layer | `publication_package.*`, `marketing_campaign.*`, etc. | 18 |
| operation-first-dollar | `ofd.*` | 12 |
| reality-integration | `reality_integration.*` | 17 |
| marketplace-connection | `marketplace_connection.*` | 8 |
| account-infrastructure | `account_infrastructure.*` | 6+ |
| ecommerce-os | `ecommerce_os.*` | 8 |
| eye-series | `eye_*`, `eye_series.*` | 30+ |
| soul-runtime | `soul_runtime.*` | 8 |
| live-payment | `live_payment.*` | 8 |
| live-cj | `live_cj_fulfillment.*` | 7 |
| meta-ads | `meta_ads.*` | 10 |
| customer-order | `customer_order.*` | 6+ |
| governance | `governance.*` | 7 |

### 4.4 Database Tables Reused

| Table | Module |
|-------|--------|
| `product_discovery_sessions` | product-discovery |
| `business_opportunity_workspace`, `business_opportunity_history` | business-workspace |
| `business_preview_studio` | business-preview-studio |
| `market_domination_strategies` | market-domination-strategy |
| `business_build_packages` | business-build |
| `business_simulations` | business-simulation |
| `execution_layer_packages` | execution-layer |
| `ecommerce_os_workflows` | ecommerce-os |
| `marketplace_connections` | marketplace-infrastructure |
| `marketplace_connection_registry` | marketplace-connection |
| `external_account_registry`, `human_action_queue` | account-infrastructure |
| `credential_vault`, `connector_monitoring_events` | reality-integration |
| `ofd_milestones`, `ofd_kpi_snapshots`, `ofd_learning_records`, `ofd_executive_briefs` | operation-first-dollar |
| `empire_knowledge_graph`, `eye_series_reports` | eye-series |
| `soul_runtime_events` | soul-runtime |
| `governance_policies`, `governance_decisions` | empire-governance |
| `live_payments`, revenue loop stores/orders | live-payment / revenue-loop |
| `live_cj_fulfillments` | live-cj |
| `customer_order_pipelines` | customer-order-pipeline |
| `meta_ads_oauth`, `meta_ads_campaigns` | meta-ads |

### 4.5 Frontend Pages Reused

| Workspace UI | Route | Backend |
|--------------|-------|---------|
| Mission Control | `/dashboard` | ecommerce-os, OFD, eye-series |
| Empire Command Center | `/dashboard/command` | execution-layer executive-command |
| Business Intelligence | `/dashboard/intelligence` | product-discovery |
| Brand Workspace | `/dashboard/brands` | business-workspace |
| Brand HQ | `/dashboard/brands/:id` | business-workspace |
| Preview | `/dashboard/brands/:id/preview` | business-preview-studio |
| Launch Mission | `/dashboard/launch` | commerce-readiness, ecommerce-os |
| Commerce Operations | `/dashboard/operations` | customer-order-pipeline |
| Infrastructure | `/dashboard/infrastructure` | marketplace-infrastructure, reality-integration |
| Empire Settings | `/dashboard/settings` | auth/profile |

### 4.6 Validation Reused

Existing test suites validate each module independently — canon validation (§8) confirms no conflicts. Key test files: `reality-integration.test.ts`, `marketplace-connection-engine.test.ts`, `commerce-readiness-engine.test.ts`, `execution-layer.test.ts`, `operation-first-dollar.test.ts`, `customer-order-pipeline.test.ts`, `live-payment-engine.test.ts`, `live-cj-fulfillment.test.ts`, `ecommerce-os-orchestrator.test.ts`.

---

## 5. Empire Connector Contract

Every connector (Shopify, Amazon, TikTok, WooCommerce, Stripe, CJ, Meta, Google Merchant, future) implements **one** contract. Today: **connection layer** is unified in `reality-integration`; **execution layer** uses module-specific live connectors. Project Reality adds execution adapters that implement the full contract below.

### 5.1 Required Operations

| Operation | Connection Layer (today) | Execution Layer (Project Reality+) |
|-----------|--------------------------|-------------------------------------|
| **Connect** | `reality_integration.connect` — vault store, `executionBlocked: true` | OAuth/API handshake + live `shop.json`-style validation |
| **Validate** | `connectorValidate` — structure + expiry | Live API ping + scope verification |
| **Publish** | ❌ blocked (`noPublishing: true`) | Product/listing create via Admin API |
| **Sync** | `connectorRefresh` — credential rotate only | Inventory/price/order bidirectional sync |
| **Monitor** | `connectorHeartbeat`, monitoring events | Rate limit + latency metrics from live API |
| **Recover** | Retry wrapper (3 attempts, 50ms backoff) | Idempotent replay + dead-letter queue |
| **Disconnect** | `connectorDisconnect` — vault revoke | Token revoke + webhook cleanup |
| **Health** | `connectorHealth`, health center | Live health probe |
| **Events** | Monitoring repository | Webhook ingest + HMAC verify |
| **Audit** | Brain audit logger + connector events | Same + external event IDs |

### 5.2 Cross-Cutting Policies

| Policy | Standard |
|--------|----------|
| **Credential handling** | `credential_vault` only; never plaintext in logs; `credentialsRef` in connection records |
| **Webhook handling** | HMAC verification (pattern: `live-payment-engine` Stripe); idempotent event IDs |
| **Retry policy** | 3 attempts, exponential backoff; record in `connector_monitoring_events` |
| **Failure policy** | Lifecycle → `DEGRADED` / `FAILED`; block dependent publish/order; surface in readiness blockers |
| **Governance** | `assessConnectorGovernance` before connect/disconnect |
| **Human actions** | `human_action_queue` for account creation, OAuth, banking — never store passwords |

### 5.3 Connector Catalog Source

Single registry: `reality-integration/models/provider-catalog.ts` + `connectors/catalog.ts` + `connectors/metadata.ts`. New connectors register here first — never create a second catalog.

### 5.4 Live Execution Module Pattern (reference)

Modules that **execute** (not just connect) follow: `meta-ads-connector`, `live-cj-fulfillment`, `live-payment-engine`:

- Own SQLite tables  
- Env gates (`*_ENABLED`, `is*LiveConfigured`)  
- Founder approval for irreversible actions  
- Brain tools + REST routes  
- Listed in `reality-integration` catalog as connection target  

Future **Shopify connector** = new `execution/shopify-connector` implementing Publish/Sync/Events — **reuses** vault from `reality-integration`, **does not** duplicate marketplace-connection state machine.

---

## 6. Founder Journey

From signup to first profit — every screen, approval, and action.

| Step | Screen | Action | Auto / Manual | Approval |
|------|--------|--------|---------------|----------|
| 1 | Landing `/` | Learn positioning | Manual | — |
| 2 | Login `/login` | Authenticate (Founder preset) | Manual | — |
| 3 | Mission Control `/dashboard` | View today's mission, blockers | Auto (Mission Engine) | — |
| 4 | Business Intelligence `/dashboard/intelligence` | Run discovery | Manual click | — |
| 5 | Business Intelligence | Filter/rank products | Manual | — |
| 6 | Business Intelligence | Approve product | Manual | **Founder: Approve Product** |
| 7 | Brand Workspace `/dashboard/brands` | Review opportunities | Auto-sync from discovery | — |
| 8 | Brand Workspace | Compare two businesses | Manual | — |
| 9 | Brand Workspace | Approve business | Manual | **Founder: Approve Business** |
| 10 | Brand HQ `/dashboard/brands/:id` | Review brand, margins, marketplaces | Manual | — |
| 11 | Preview `/dashboard/brands/:id/preview` | Generate/regenerate preview | Manual | — |
| 12 | Preview | Approve for build (brain tool) | Manual | **Founder: Approve Preview** |
| 13 | Launch Mission `/dashboard/launch` | View readiness score | Auto | — |
| 14 | Infrastructure `/dashboard/infrastructure` | Start marketplace/supplier connect | Manual | Human OAuth steps (Project Reality) |
| 15 | Launch Mission | Launch Business / prepare workflow | Manual | **Founder: Launch approval chain** |
| 16 | Commerce Operations `/dashboard/operations` | Monitor first orders | Auto when sale occurs | — |
| 17 | (Backend) | Stripe checkout + webhook | Auto on payment | Webhook signature |
| 18 | (Backend) | Fulfillment prepare | Auto | **Founder: Approve CJ submit** |
| 19 | Mission Control | OFD milestones advance | Auto on REAL events | REAL milestones need `externalReference` |
| 20 | Empire Command Center | First profit visible | Auto KPI snapshot | — |

---

## 7. Grand King Journey

| Step | Screen | Grand King Action | System Response |
|------|--------|-------------------|-----------------|
| 1 | Login | Sign in as Grand King | Full authority role |
| 2 | Mission Control | "Good morning, King" briefing | OFD + Eye + blockers + top mission |
| 3 | Command Center | Review empire metrics | Revenue, profit, infrastructure health |
| 4 | Intelligence | Run discovery for flagship category | Session + ranked products |
| 5 | Brand Workspace | Approve flagship business | Opportunity → APPROVED |
| 6 | Brand HQ | Enter headquarters | Full business dossier |
| 7 | Preview | Generate marketplace previews | Synthetic + structured assets |
| 8 | Launch Mission | Execute launch workflow | Readiness gating |
| 9 | Infrastructure | Connect Stripe/CJ/Shopify (start) | Connection state only until Reality |
| 10 | Command Center | Monitor Operation First Dollar | Phase progression PRE_LAUNCH → FIRST_DOLLAR |
| 11 | Operations | Watch order pipeline | Checkout → fulfillment stages |
| 12 | Command Center | Generate executive brief | Daily priorities |
| 13 | Intelligence (Eye) | Review Eye alerts | Executive recommendations |
| 14 | Launch → Scale | Advance OFD to SCALING | Milestone-driven |
| 15 | Soul (backend) | Lessons captured | Permanent empire memory |

Grand King uses **same modules** as Founder; difference is `companyId` (`co-grand-king`), flagship KPIs on Command Center, and Operation First Dollar as north star (USD 100,000 objective).

---

## 8. Canon Validation Checklist

| Check | Result |
|-------|--------|
| No duplicated workflows | ✅ Single lifecycle §2; modules are stages, not alternate paths |
| No conflicting lifecycle | ✅ Launch workflow stages align with discovery stages (shared vocabulary, different records) |
| No conflicting states | ✅ Canonical states §3 map to module enums; `FAILED`/`ARCHIVED` terminal |
| No orphan modules | ✅ All 20+ commerce modules mapped in §4; revenue/execution modules assigned to ORDER/FULFILLMENT phases |
| No missing approvals | ✅ Approve gates documented: product, business, preview, launch, fulfillment, ads, deployment |
| No unreachable states | ✅ All states reachable from `DRAFT`; `ARCHIVED`/`FAILED` have exit paths documented |

### Known Overlaps (Intentional, Not Duplicates)

| Overlap | Resolution |
|---------|------------|
| Discovery session stages vs Launch workflow stages | Same vocabulary, different aggregates — ecommerce-os orchestrates both |
| `marketplace-infrastructure` vs `marketplace-connection` | Infra = connection JSON; Connection = rich OAuth/permission/readiness record |
| `reality-integration` vs live execution modules | Connect vs execute — canon §5.1 |
| Local `product-publishing-engine` vs `execution-layer` publication packages | Local deploy vs marketplace listing packages — both required for PUBLICATION phase |
| Mission Control vs Command Center UI | Daily missions vs full metrics — complementary views |

---

## 9. Module Reuse Report

**100% reuse.** C001 created **zero** new backend modules, **zero** new workflows, **zero** API duplicates.

| Category | Modules Reused | New Modules |
|----------|----------------|-------------|
| Orchestration | 12 | 0 |
| Foundation | 2 (governance, soul) | 0 |
| Operation | 1 (OFD) | 0 |
| Execution/Revenue | 6+ | 0 |
| Frontend workspaces | 10 | 0 |
| Connector registry | 3 files | 0 |

This document (`EMPIREAI_COMMERCE_CANON.md`) is the **only** new artifact — the permanent standard.

---

## 10. Duplication Report

| Item | Verdict | Notes |
|------|---------|-------|
| Alternate product discovery path | **None** | Single `product-discovery-opportunity-engine` |
| Alternate business approval path | **None** | `business-opportunity-workspace` only |
| Duplicate connector vaults | **None** | Single `credential_vault` |
| Duplicate marketplace state | **Complementary** | infra + connection — merge at readiness evaluator |
| Duplicate dashboards | **Complementary** | ecommerce-os aggregates; execution-layer executive-command |
| Duplicate publish paths | **Layered** | execution packages (content) + product-publishing (local deploy) — not duplicates |
| Shopify stub vs future live module | **Planned extension** | Reality adds execution adapter; does not replace connection engine |
| Parallel OAuth implementations | **Risk for Reality** | Meta has live OAuth; Shopify/Stripe catalog-only — must extend, not fork |

**Conflicts requiring Project Reality resolution (not canon conflicts):**

- `executionBlocked: true` on all reality-integration connectors vs need for live Publish/Sync  
- `publishBlocked: true` on all execution-layer listings vs live marketplace publish  
- Placeholder OAuth URLs without route handlers  

These are **implementation gaps**, not duplicate workflows.

---

## 11. Amendment Process

1. Propose change as ADR entry in `EMPIREAI_DECISIONS.md`  
2. Demonstrate which existing module absorbs new behavior  
3. Update this canon document version  
4. No new module without PDR approval  

---

*End of Commerce Canon v1.0*
