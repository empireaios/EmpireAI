# EMPIREAI PROJECT REALITY V1
## Executive Audit — Simulated → Real Commerce Transition

> **ROADMAP STATUS: SUPERSEDED**  
> This document is an **archived design iteration** (Project Reality / R001 context).  
> **Active direction:** [MARKETPLACE_OS_VISION.md](./MARKETPLACE_OS_VISION.md) · [EMPIREAI_ROADMAP.md](./EMPIREAI_ROADMAP.md)  
> Historical content preserved. Do not delete.

**Mission:** Replace placeholders with real execution capability  
**Governing Standard:** [EMPIREAI_COMMERCE_CANON.md](./EMPIREAI_COMMERCE_CANON.md) (C001)  
**Date:** 2026-06-21  
**Scope:** Audit + architecture design — no backend duplication, no orchestration replacement  

---

## Executive Summary

EmpireAI has a **complete commerce architecture on paper** and **partial live execution** in payment (Stripe), fulfillment (CJ), and advertising (Meta). The platform **cannot yet publish a real product, receive a real order end-to-end, or show real profit on Mission Control** because hard-coded execution blocks, local-only publishing, mock discovery data, and missing OAuth/webhook routes prevent irreversible external actions.

**Verdict:** Architecture is ready for Reality. Implementation must **extend existing modules** — not fork them — starting with Stripe checkout + CJ fulfillment + Shopify publish on the critical path to first real sale.

---

## 1. Reality Audit

### 1.1 Platform State

| Layer | Real Today | Simulated / Blocked |
|-------|------------|---------------------|
| Discovery | Pipeline orchestration | `SCOUT_MOCK_PRODUCTS` catalog |
| Brand / Build | Package generation, readiness | `preview://`, `build://`, `publishBlocked: true` |
| Connectors | Vault, governance, health center UI | No live API on connect; `executionBlocked: true` |
| Publishing | Local `catalog.json` + HTML | No marketplace Admin API |
| Payments | Stripe PI + webhook HMAC (env-gated) | Mock when keys missing |
| Orders | Full stage machine | Live fulfillment gated |
| Fulfillment | CJ live submit (env + founder gate) | Mock fallback |
| Ads | Meta OAuth + Graph API | Mock fallback |
| Metrics / OFD | REAL milestones enforced | KPI defaults to SIMULATED forecast |
| Grand King UI | Mission Engine, Command Center | Profit/revenue SIMULATED until FIRST_SALE |

### 1.2 Hard Execution Blocks (Schema-Enforced)

These are **not env flags** — they are **Zod literals** that reject any unlock without code change:

| Block | Location | Effect |
|-------|----------|--------|
| `executionBlocked: z.literal(true)` | `reality-integration/models/reality-integration.ts` | All connector runtime states block execution |
| `publishBlocked: z.literal(true)` | `execution-layer/models/execution-packages.ts`, `business-build-engine/models/business-build-package.ts` | All marketplace listings blocked |
| `executionBlocked: true` | Marketing + fulfillment execution packages | Campaign/fulfillment activation blocked |
| `transactionBlocked: true` | Revenue execution package | Payment capture blocked at package layer |
| `irreversibleActionsBlocked: true` | Provider catalog (all 30+ providers) | Canon-safe; must become governance-gated |
| `connectionOnly: true` | Provider catalog default | Connect without execute |

### 1.3 Reference Live Modules (Pattern to Replicate)

| Module | Path | Live Capability |
|--------|------|-----------------|
| Stripe | `backend/src/revenue/live-payment-engine/` | Checkout, PaymentIntent, webhook verify, idempotency |
| CJ | `backend/src/execution/live-cj-fulfillment/` | Order submit, tracking sync, env gate |
| Meta Ads | `backend/src/execution/meta-ads-connector/` | OAuth routes, token exchange, Graph API |
| Order Pipeline | `backend/src/revenue/customer-order-pipeline/` | CHECKOUT_CREATED → DELIVERED stages |
| Commerce Readiness | `backend/src/orchestration/commerce-readiness-engine/` | Launch decision, blockers |
| OFD | `backend/src/operation-first-dollar/` | Milestones, REAL vs SIMULATED enforcement |

---

## 2. Placeholder Inventory

### 2.1 Complete Inventory

| ID | Pattern / Signal | File(s) | Category | Severity |
|----|------------------|---------|----------|----------|
| P001 | `executionBlocked: true` | `connector-runtime.ts:171` | Connector | BLOCKING |
| P002 | `publishBlocked: true` | `execution-layer-service.ts`, generators | Publishing | BLOCKING |
| P003 | `transactionBlocked: true` | `execution-package-generators.ts:231` | Revenue | BLOCKING |
| P004 | `executionBlocked: true` (marketing/fulfillment) | `execution-package-generators.ts` | Execution | BLOCKING |
| P005 | `preview://` URLs | `business-preview-generator.ts` | Brand | HIGH |
| P006 | `build://` URLs | `business-build-package-generator.ts` | Build | HIGH |
| P007 | `placeholder://` | `business-opportunity-builder.ts` | Opportunity | MEDIUM |
| P008 | `mock://` product signals | `eye/connectors/amazon`, `google-trends` mappers | Intelligence | MEDIUM |
| P009 | `SCOUT_MOCK_PRODUCTS` | `product-discovery-pipeline-service.ts` | Discovery | HIGH |
| P010 | Synthetic health latency (45ms) | `connector-runtime.ts:40-47` | Health | MEDIUM |
| P011 | ~~"no live API calls" on connect~~ | `connector-runtime.ts` · REAL-002B live adapters | Connect | **RESOLVED (REAL-002B)** |
| P012 | OAuth lifecycle routes | `reality-integration-routes.ts` · REAL-002B | OAuth | **RESOLVED (REAL-002B)** |
| P013 | `unsupportedAutomationAreas: live_publishing` | `marketplace-connection-service.ts` | Marketplace | BLOCKING |
| P014 | Local filesystem publish only | `product-publishing-engine/services/` | Publishing | BLOCKING |
| P015 | `PRODUCT_PUBLISHING_MOCK` default path | `product-publishing-engine` env | Publishing | HIGH |
| P016 | `LIVE_PAYMENT_MOCK` fallback | `live-payment-engine` | Payment | ENV-GATED |
| P017 | `META_ADS_MOCK` fallback | `meta-ads-connector` | Ads | ENV-GATED |
| P018 | `LIVE_CJ_FULFILLMENT_ENABLED=false` gate | `live-cj-fulfillment` | Fulfillment | ENV-GATED |
| P019 | `CUSTOMER_ORDER_PIPELINE_LIVE_FULFILLMENT_ENABLED=false` | `customer-order-pipeline` | Orders | ENV-GATED |
| P020 | PayPal webhooks PLANNED only | `paypal-architecture.ts` | Payment | LOW |
| P021 | SIMULATED KPI when no FIRST_SALE | `operation-first-dollar-service.ts:279+` | Metrics | HIGH |
| P022 | Partial OFD auto-sync (3 of 10 milestones) | `syncPipelineMilestones()` | OFD | HIGH |
| P023 | No Shopify Admin API module | — | Commerce | BLOCKING |
| P024 | No unified webhook router (Stripe only) | `revenue-loop-routes`, `live-payment-routes` | Webhooks | HIGH |
| P025 | No dead-letter queue for webhooks | — | Webhooks | MEDIUM |
| P026 | Frontend `todayProfit: 0` hardcode | `DashboardLayout.tsx` (legacy) | UI | LOW |
| P027 | Eye Amazon/Google mock fixtures | `eye/connectors/*/mock/` | Intelligence | LOW |
| P028 | Supplier sync "stub catalogs" | Supplier sync tests / sandbox mode | Suppliers | MEDIUM |
| P029 | `GRAND_KINGS_REVENUE_ENGINE_MOCK` | Revenue engine env | Metrics | MEDIUM |
| P030 | Business simulation drives forecast | `business-simulation-engine` | Planning | BY DESIGN |

### 2.2 Replacement Priority (First Sale Path)

1. P011, P012, P023 — Connect + OAuth + Shopify execution adapter  
2. P014, P002, P013 — Real publish pipeline  
3. P016, P003 — Live checkout unlock via governance  
4. P018, P019 — Live fulfillment chain  
5. P021, P022 — Real OFD event hooks  

---

## 3. Connector Runtime (ONE Plugin Architecture)

Per Commerce Canon §5 — **single runtime, zero duplicated connector logic**.

### 3.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    reality-integration                         │
│  Provider Catalog │ Credential Vault │ Governance │ Health   │
│  connector-runtime.ts (orchestrator — NOT per-provider copy) │
└──────────────────────────┬──────────────────────────────────┘
                           │ dispatches to
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
 execution/shopify   execution/stripe    execution/live-cj
 execution/meta-ads  (future: woo, amz)   (future: tiktok)
```

### 3.2 Empire Connector Contract — Full Operation Map

Every provider implements **one adapter interface** registered in `provider-catalog.ts`. The runtime in `connector-runtime.ts` delegates; it does not embed provider logic.

| Operation | Owner Module | Existing Reuse | Project Reality Change |
|-----------|--------------|----------------|------------------------|
| **Connect** | `reality-integration/connector-runtime` | Vault, governance | Delegate to execution adapter OAuth/API handshake |
| **Validate** | Same + execution adapter | Structure check today | Live ping (`shop.json`, Stripe `/v1/account`) |
| **Health** | `buildConnectorHealthCenter` | Lifecycle mapping | Adapter-reported latency, rate limits, outage |
| **Publish** | `execution/{provider}-connector` | `product-publishing-engine` mapping | Admin API create listing |
| **Update** | Execution adapter | Local catalog update | External PATCH |
| **Delete** | Execution adapter | — | External DELETE + audit |
| **Sync** | Execution adapter + supplier sync | CJ/ supplier modules | Bidirectional inventory/price |
| **Webhook** | Unified webhook framework (§6) | Stripe pattern | Provider-specific verify + route |
| **Retry** | `connector-runtime.withRetry` | 3 attempts, 50ms | Extend with DLQ |
| **Recover** | Execution adapter + monitoring repo | Event logging | Idempotent replay |
| **Disconnect** | `connectorDisconnect` | Vault revoke | Token revoke + webhook cleanup |
| **Audit** | Brain audit logger + `connector_monitoring_events` | Existing | External event IDs |
| **Credential Vault** | `sqlite-credential-vault-repository` | Existing | No change |
| **Event Stream** | Monitoring repo → Soul Runtime | Partial | Emit `connector.*` soul events |

### 3.3 Provider Rollout Matrix

| Provider | Connection Catalog | Execution Module | Publish | Webhooks | Effort |
|----------|-------------------|------------------|---------|----------|--------|
| **Stripe** | ✅ stripe | ✅ `live-payment-engine` | N/A | ✅ HMAC | Extend OFD hooks |
| **CJ** | ✅ cj-dropshipping | ✅ `live-cj-fulfillment` | N/A | 🔲 tracking | Add CJ webhook route |
| **Shopify** | ✅ shopify | ❌ missing | ❌ | ❌ | **L — critical path** |
| **Meta Shops** | ✅ facebook-shop | Partial (meta-ads) | ❌ | ❌ | M |
| **WooCommerce** | 🔲 add to catalog | ❌ | ❌ | ❌ | M |
| **Amazon** | ✅ amazon-seller | ❌ | ❌ | ❌ | L |
| **TikTok Shop** | ✅ tiktok-shop | ❌ | ❌ | ❌ | L |
| **eBay** | ✅ ebay | ❌ | ❌ | ❌ | M |
| **Google Merchant** | ✅ google-merchant | ❌ feed | ❌ | ❌ | M |

**Rule:** New connector = register in catalog + add `execution/{id}-connector` implementing adapter interface. **Never** duplicate vault, governance, or health center.

### 3.4 Adapter Interface (Design)

```typescript
// backend/src/orchestration/reality-integration/adapters/connector-adapter.ts (NEW — single file)
interface EmpireConnectorAdapter {
  providerId: string;
  connect(ctx: ConnectContext): Promise<ConnectResult>;
  validate(ctx: ValidateContext): Promise<ValidateResult>;
  health(ctx: HealthContext): Promise<HealthProbe>;
  publish(ctx: PublishContext): Promise<PublishResult>;
  update(ctx: UpdateContext): Promise<UpdateResult>;
  delete(ctx: DeleteContext): Promise<DeleteResult>;
  sync(ctx: SyncContext): Promise<SyncResult>;
  handleWebhook(ctx: WebhookContext): Promise<WebhookResult>;
  recover(ctx: RecoverContext): Promise<RecoverResult>;
  disconnect(ctx: DisconnectContext): Promise<void>;
}
```

Runtime resolves adapter by `providerId` from a **single registry map** — same pattern as `meta-ads-connector` env gates.

---

## 4. Publication Pipeline

Reuse: `business-build-engine` → `product-publishing-engine` → `marketplace-connection-engine` → `commerce-readiness-engine` → `ecommerce-os-orchestrator`.

```
Product (discovery approval)
    ↓ product-discovery-opportunity-engine / business-opportunity-workspace
Brand (identity, margins)
    ↓ brand-identity-engine / business-build-engine
Assets (images, copy)
    ↓ product-publishing-engine (asset bundle) + creative modules
SEO (metadata, schema)
    ↓ seo-intelligence + product-publishing SEO step
Marketplace mapping
    ↓ marketplace-connection-engine + execution-layer listings
Validation
    ↓ commerce-readiness-engine + connector Validate
Publishing
    ↓ shopify-connector.publish (NEW) — replaces local-only write
Verification
    ↓ GET listing + health check + publish receipt in audit
Monitoring
    ↓ connector health center + OFD FIRST_LISTING_CREATED
Recovery
    ↓ retry + idempotent republish + rollback metadata
```

| Stage | Module | API / Tool | Blocker Today |
|-------|--------|------------|---------------|
| Product | `product-discovery-opportunity-engine` | `product_discovery.run` | Mock catalog |
| Brand | `business-build-engine` | `business_build.generate` | `publishBlocked` |
| Assets | `product-publishing-engine` | `product_publishing.publish` | Local FS only |
| SEO | `product-publishing-engine` | SEO fields in publish payload | No external feed |
| Mapping | `marketplace-connection-engine` | Connection record | `live_publishing` unsupported |
| Validation | `commerce-readiness-engine` | `commerce_readiness.launch_decision` | Infra not CONNECTED |
| Publishing | **NEW** `shopify-connector` | `shopify.publish_product` | Module missing |
| Verification | `reality-integration` monitoring | Publish receipt event | — |
| Monitoring | Health center + OFD | Auto milestone | Manual sync partial |
| Recovery | `connector-runtime.withRetry` + DLQ | Replay job | No DLQ |

---

## 5. Order Lifecycle

```
Visitor          → minimum-live-revenue-loop / storefront-deploy
Cart             → customer-order-pipeline (CHECKOUT_CREATED)
Checkout         → live-payment-engine (PaymentIntent / session)
Payment          → Stripe webhook → verifyPipelinePayment
Order            → customer-order-pipeline (ORDER_CREATED)
Supplier         → live-cj-fulfillment → CJ API
Tracking         → syncPipelineTracking + CJ webhook/poll
Delivery         → pipeline status DELIVERED
Refund           → live-payment-engine refund + pipeline CANCELLED
Repeat Purchase  → grand-kings-revenue-engine lifecycle collector
```

| Stage | Owning Module | Status Enum | Gate |
|-------|---------------|-------------|------|
| Visitor | `minimum-live-revenue-loop` | Store `DEPLOYED` / `CHECKOUT_ENABLED` | Storefront deploy |
| Cart | `customer-order-pipeline` | `CHECKOUT_CREATED` | — |
| Checkout | `live-payment-engine` | PI created | `LIVE_PAYMENT_ENABLED` |
| Payment | `live-payment-engine` + webhooks | `PAYMENT_VERIFIED` | Webhook HMAC |
| Order | `customer-order-pipeline` | `ORDER_CREATED` | — |
| Supplier | `live-cj-fulfillment` | Fulfillment record | `LIVE_CJ_FULFILLMENT_ENABLED` + founder approve |
| Tracking | `live-cj-fulfillment` + pipeline | `SHIPPED` / `IN_TRANSIT` | CJ API |
| Delivery | `customer-order-pipeline` | `DELIVERED` | Tracking webhook |
| Refund | `live-payment-engine` | `REFUNDED` / `CANCELLED` | Governance |
| Repeat | `grand-kings-revenue-engine` | Lifecycle metrics | REAL events |

**Gap:** No visitor/cart analytics bridge to OFD (FIRST_VISITOR, FIRST_ADD_TO_CART) from storefront.

---

## 6. Webhook Architecture

### 6.1 Unified Framework (Design — extend, don't fork)

**New module location:** `backend/src/foundation/webhook-gateway/` (or extend `live-payment-engine` webhook service as shared lib — prefer **shared lib** imported by all connectors).

| Requirement | Stripe Today | Target Standard |
|-------------|--------------|-----------------|
| Verification | HMAC SHA256 | Per-provider (HMAC, RSA, challenge) |
| Replay protection | Idempotent event ID in DB | Timestamp + nonce window (5 min) |
| Idempotency | `stripe_webhook_events` table | Generic `webhook_events` with `providerId` |
| Retry | Stripe automatic | Internal retry queue (3x backoff) |
| Dead-letter | ❌ | `webhook_dead_letter` table |
| Audit trail | Brain logger | `connector_monitoring_events` + audit |
| Soul Runtime event | Partial | Emit `webhook.received`, `webhook.processed`, `webhook.failed` |

### 6.2 Provider Routes (Target)

| Provider | Route | Verify Method | Events |
|----------|-------|---------------|--------|
| Stripe | `/webhooks/stripe` ✅ | HMAC | payment_intent.*, charge.refunded |
| Shopify | `/webhooks/shopify` | HMAC SHA256 base64 | orders/create, fulfillments/create |
| CJ | `/webhooks/cj` | API key header | order status, tracking |
| Meta | `/webhooks/meta` | X-Hub-Signature | commerce events |
| Amazon | `/webhooks/amazon` | SNS/RSA | order notifications |
| TikTok | `/webhooks/tiktok` | Signature header | order status |
| Google | `/webhooks/google-merchant` | Token | product status |

**Pattern:** Single Fastify plugin registers raw-body parser per route; dispatches to adapter `handleWebhook`.

---

## 7. Connector Health Center

**Existing:** `GET /reality-integration/health-center` → `buildConnectorHealthCenter()`.

### 7.1 Unified Health Model (Extend Existing Schema)

| State | Source Today | Reality Source |
|-------|--------------|----------------|
| Connected | Lifecycle `CONNECTED` | Live validate ping |
| Disconnected | Lifecycle `DISCONNECTED` | No credentials |
| Token expired | Vault `isExpired()` | ✅ Already partial |
| Permission missing | ❌ | Adapter scope check |
| Rate limited | Static `rateLimitRemaining: 100` | Adapter headers |
| Service outage | ❌ | Adapter 5xx / health endpoint |
| Sync delayed | `lastSync` field | Sync job timestamp vs SLA |
| Webhook failing | ❌ | DLQ depth > 0 |
| Recovery running | ❌ | Recover job in progress |

### 7.2 Mission Control Integration

- **Backend:** Extend `connectorHealthCenterEntrySchema` with `healthReasons: string[]`
- **Frontend:** `InfrastructurePage.tsx` + `EmpireCommandCenterPage.tsx` HealthGrid — already consumes health summary
- **Grand King:** `ecommerce-os-orchestrator/dashboard-status-service` aggregates into executive dashboard

**No new health module** — extend `reality-integration-service.buildConnectorHealthCenter`.

---

## 8. Execution Unlock Policy

### 8.1 Current (Hard Blocks)

All execution flags are **compile-time literals** — cannot be unlocked by config alone.

### 8.2 Target (Governance-Controlled Activation)

Replace literals with **runtime evaluation** from existing engines:

```typescript
type ExecutionUnlockDecision = {
  allowed: boolean;
  gates: {
    commerceReadiness: LaunchDecision;      // commerce-readiness-engine
    governance: GovernanceAssessment;       // connector-governance-service
    realityIntegration: ConnectorHealthState; // health center
    humanApproval: boolean;                 // human_action_queue / founder approval
    operationFirstDollar: OfDPhase;          // phase >= LAUNCH_PREP
  };
  blockers: ReadinessBlocker[];
};
```

**Unlock requires ALL:**

| Gate | Module | Pass Condition |
|------|--------|----------------|
| Commerce Readiness | `commerce-readiness-engine` | `launchDecision !== NOT_READY` |
| Governance | `connector-governance-service` | `assessConnectorGovernance` → approved |
| Reality Integration | `reality-integration` | Required providers `CONNECTED` + health `HEALTHY` |
| Human Approval | `account-infrastructure-engine` | Launch workflow approval recorded |
| Operation First Dollar | `operation-first-dollar` | Phase ≥ `LAUNCH_PREP`; REAL milestones for revenue actions |

**Implementation:** Change Zod schemas from `z.literal(true)` to `z.boolean()` with evaluator in `execution-layer-service` and `connector-runtime` calling shared `evaluateExecutionUnlock()`.

**Protect The Empire:** Irreversible actions still require explicit env gates (`LIVE_*_ENABLED`) as final safety net — canon aligned.

---

## 9. Operation First Dollar Integration

### 9.1 Milestones (Existing)

`FIRST_PRODUCT_SELECTED`, `FIRST_SUPPLIER_CONNECTED`, `FIRST_MARKETPLACE_CONNECTED`, `FIRST_LISTING_CREATED`, `FIRST_VISITOR`, `FIRST_ADD_TO_CART`, `FIRST_SALE`, `FIRST_SHIPMENT`, `FIRST_PAYOUT`, `FIRST_PROFIT`

### 9.2 Auto-Event Wiring (Required)

| Event | Trigger Source | Milestone | Status |
|-------|----------------|-----------|--------|
| First Listing | Shopify publish success webhook/response | `FIRST_LISTING_CREATED` | ❌ Manual |
| First Visitor | GA4 / storefront pixel | `FIRST_VISITOR` | ❌ Not wired |
| First Cart | Storefront cart API / Shopify webhook | `FIRST_ADD_TO_CART` | ❌ Not wired |
| First Checkout | `createPipelineCheckout` | (pre-sale) | Partial |
| First Sale | Stripe `payment_intent.succeeded` | `FIRST_SALE` | 🔲 Wire in webhook handler |
| First Shipment | CJ tracking / pipeline SHIPPED | `FIRST_SHIPMENT` | 🔲 Wire in fulfillment |
| First Refund | Stripe refund webhook | (extend milestones) | ❌ Add `FIRST_REFUND` |
| First Profit | Treasury ledger net positive | `FIRST_PROFIT` | 🔲 Wire in treasury |

**Existing partial sync:** `syncPipelineMilestones()` records first 3 from vault state only — not live proof.

**Pattern:** Each live module calls `recordMilestone({ source: "REAL", externalReference })` on first occurrence — idempotent by milestone type.

---

## 10. Founder Automation Report

### 10.1 Founder Should Only Do (Target)

1. Choose Brand  
2. Choose Category  
3. Approve Product  
4. Connect Accounts (OAuth)  
5. Approve Launch  

### 10.2 Remaining Manual Tasks

| Task | Screen | Automate? | Recommendation |
|------|--------|-----------|----------------|
| Run discovery pipeline | Intelligence | ✅ Auto on schedule | Cron + Mission Engine trigger |
| Filter/rank products | Intelligence | ✅ Auto top-N | AI rank + surface top 3 |
| Compare businesses | Brands | Optional | Auto-recommend winner |
| Approve business | Brands | Keep manual | Required approval |
| Generate preview | Preview | ✅ Auto on approve | Trigger on product approval |
| Regenerate preview | Preview | ✅ Auto on change | Debounced regen |
| Review readiness | Launch | ✅ Auto | Already computed |
| Start OAuth | Infrastructure | Keep manual | Human OAuth unavoidable |
| Launch workflow click | Launch | Keep manual | Final approval |
| Approve CJ submit | Backend | Keep manual | Irreversible — canon |
| Record milestones | — | ✅ Auto | Wire all REAL events |
| Connect Stripe keys | Settings | Semi-auto | Guided setup wizard |

---

## 11. Grand King Automation Report

### 11.1 Mission Control Capabilities (Existing)

- `mission-engine.ts` — prioritized actions from dashboard state  
- `EmpireCommandCenterPage` — revenue/profit with REAL/SIMULATED badge  
- `ecommerce-os-orchestrator` — executive dashboard aggregation  
- `commerce-readiness-engine` — blockers + launch decision  

### 11.2 CEO Questions → Data Sources

| Question | Source Module | Gap |
|----------|---------------|-----|
| What needs attention? | Mission Engine + readiness blockers | ✅ Works |
| What should launch? | `commerce_readiness.launch_decision` | Needs real infra scores |
| What should stop? | Governance + health FAILED states | Add auto-pause rules |
| Where are risks? | Connector warnings + simulation variance | Add live risk scoring |
| Where is profit? | OFD + treasury + Stripe ledger | SIMULATED until FIRST_SALE |
| What should EmpireAI do next? | Mission Engine priorities | Extend with agent tools |

### 11.3 Recommendations

1. Feed **REAL** metrics only to Grand King KPI cards when `FIRST_SALE` achieved  
2. Add **Risk Radar** panel: connector health + DLQ depth + inventory drift  
3. Auto-generate **Daily Brief** from OFD phase + blockers (backend tool exists — wire to UI)  

---

## 12. Risk Review

| Risk | Current Mitigation | Gap | Recovery Strategy |
|------|-------------------|-----|-------------------|
| Duplicate execution | Idempotent webhook IDs (Stripe) | Other providers | Generic idempotency table |
| Connector failure | Lifecycle → DEGRADED/FAILED | No auto-failover | Pause publish; alert Mission Control |
| Order loss | Pipeline persistence SQLite | No external reconcile | Nightly order sync job |
| Double publishing | `publishBlocked` literal | No idempotent publish key | External listing ID dedup |
| Inventory mismatch | Supplier sync sandbox | No live sync default | Enable `PRODUCT_PUBLISHING_LIVE_SUPPLIER_SYNC` |
| Payment mismatch | Stripe webhook verify | Single provider | Ledger reconcile job |
| Supplier outage | CJ mock fallback | Silent mock in prod | Fail loud when LIVE enabled |
| Webhook replay | Stripe idempotency | No timestamp window | Nonce + 5min TTL |
| Data corruption | SQLite transactions | No backup strategy | Document backup SOP |
| Recovery | 3-retry in connector-runtime | No DLQ | Add DLQ + manual replay tool |

---

## 13. Production Readiness

| Criterion | Status | Notes |
|-----------|--------|-------|
| Typecheck | ✅ PASS | Backend + frontend |
| Tests | ✅ 976/976 PASS | No regressions |
| Build | ✅ PASS | Backend tsc + frontend vite |
| Env documentation | ⚠️ Partial | LIVE_* gates scattered |
| Secrets management | ✅ Vault pattern | credential_vault |
| OAuth production URLs | ❌ | localhost defaults |
| HTTPS webhooks | ❌ | Needs deployment |
| First sale path E2E | ❌ | Blocked by P001-P014 |
| Monitoring | ⚠️ Partial | Connector events, no APM |
| Rollback | ⚠️ Partial | Publish rollback not implemented |

---

## 14. Remaining Blockers

1. **No Shopify execution module** — cannot publish real listing  
2. **Hard-coded execution blocks** — schema literals prevent any live action  
3. **OAuth routes missing** for account/marketplace infrastructure (except Meta)  
4. **Product discovery uses mock catalog** — not market reality  
5. **Publishing writes local files only** — no external marketplace  
6. **OFD missing auto-hooks** for visitor/cart/sale/shipment  
7. **Unified webhook gateway** not implemented (Stripe only)  
8. **Production env vars** not configured for live keys  
9. **Storefront visitor tracking** not connected to OFD  
10. **PayPal** not implemented (lower priority vs Stripe)  

---

## 15. Recommended Implementation Sequence

Each phase ends with **something usable**.

### Phase 1 — Unlock Foundation (2–3 weeks)
**Deliverable:** Governance-controlled execution unlock evaluator; OAuth route scaffolding  
- Replace `z.literal(true)` blocks with `evaluateExecutionUnlock()`  
- Add OAuth start/callback routes for Shopify (mirror meta-ads pattern)  
- Wire `recordMilestone(FIRST_SALE)` in Stripe webhook  
**Usable:** Stripe live payment + OFD FIRST_SALE on test transaction  

### Phase 2 — Shopify Publish (2–3 weeks)
**Deliverable:** `execution/shopify-connector` with Publish + Verify  
- Adapter registry in connector-runtime  
- Publish pipeline calls Shopify Admin API  
- OFD `FIRST_LISTING_CREATED` on publish success  
**Usable:** One real product live on Shopify dev store  

### Phase 3 — Order Loop (2 weeks)
**Deliverable:** End-to-end order on Shopify → Stripe → CJ  
- Shopify order webhooks → customer-order-pipeline  
- Enable live CJ with founder approval flow  
- Tracking sync → OFD FIRST_SHIPMENT  
**Usable:** First real fulfilled order  

### Phase 4 — Webhook Gateway + Health (1–2 weeks)
**Deliverable:** Unified webhook framework + enriched health center  
- DLQ, replay protection, Soul events  
- Health reasons in Mission Control  
**Usable:** Operational visibility for Grand King  

### Phase 5 — Discovery Reality (2 weeks)
**Deliverable:** Replace SCOUT_MOCK with live scout/API  
- Real product signals in discovery pipeline  
**Usable:** Real market opportunities  

### Phase 6 — Expand Connectors (ongoing)
WooCommerce, Google Merchant feed, Meta Shops — one adapter at a time per catalog registration.

**Priority rule:** Maximize P(first real sale) — Phase 1→2→3 before breadth.

---

## 16. Validation Results

Executed 2026-06-21:

| Command | Location | Result |
|---------|----------|--------|
| `npm run typecheck` | backend | ✅ PASS |
| `npm test` | backend | ✅ **976/976** pass (157 suites) |
| `npm run build` | backend | ✅ PASS |
| `npm run typecheck` | frontend | ✅ PASS |
| `npm run build` | frontend | ✅ PASS (vite, 1719 modules) |

No code changes were required for this audit mission. All validation green.

---

## Appendix A — Reality Replacement Map (Summary)

| Placeholder | Current | Real | Module Reused | Effort | Risk | Blocker |
|-------------|---------|------|---------------|--------|------|---------|
| executionBlocked | Literal true | Governance evaluator | reality-integration, commerce-readiness | M | Med | Schema change |
| publishBlocked | Literal true | Adapter publish | product-publishing, shopify-connector NEW | L | High | No Shopify module |
| OAuth URLs | String only | Fastify routes | meta-ads pattern | M | Med | No routes |
| Mock discovery | SCOUT_MOCK | Live scout API | product-scout | M | Low | API keys |
| Local publish | FS write | Admin API | product-publishing-engine | L | High | Phase 2 |
| SIMULATED KPI | Forecast fallback | REAL ledger | operation-first-dollar | S | Low | FIRST_SALE |
| Health latency | Hardcoded 45ms | Adapter probe | connector-runtime | S | Low | Adapter impl |
| Webhooks | Stripe only | Unified gateway | live-payment-engine pattern | M | Med | New shared lib |

---

## Appendix B — Document References

- [EMPIREAI_COMMERCE_CANON.md](./EMPIREAI_COMMERCE_CANON.md) — C001 governing standard  
- [EMPIREAI_DECISIONS.md](./EMPIREAI_DECISIONS.md) — ADR-005 (connector stub), ADR-011 (Canon)  
- Prior audit: R001 Reality Integration Shopify Production (conversation transcript)  

---

*End of Project Reality V1 Executive Audit*
