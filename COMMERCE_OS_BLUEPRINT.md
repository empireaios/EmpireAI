# EMPIREAI COMMERCE OPERATING SYSTEM BLUEPRINT
## COS-001 — Permanent Kernel Architecture

> **Status:** CANONICAL BLUEPRINT · **Mission:** COS-001  
> **Hierarchy:** Soul File → [Commerce Canon](./EMPIREAI_COMMERCE_CANON.md) (C001) → **This document (COS Kernel)** → Connectors (future)  
> **Scope:** Architecture only — no live execution, no OAuth, no API integrations  
> **Date:** 2026-06-21

---

## 0. Executive Summary

EmpireAI is a **Commerce Operating System (COS)** — not a marketplace platform, not a store builder. EmpireAI is the **permanent kernel** through which unlimited external commerce providers (marketplaces, suppliers, payments, ads, logistics, customer service, analytics) connect, orchestrate, and operate businesses under human and AI authority.

This blueprint defines **fourteen kernels**, one **universal object model**, one **universal event bus**, one **adapter contract (Connector SDK)**, cross-platform orchestration, capability matrices, certification, and integration with every existing module — **without duplication**.

---

## 1. Document Hierarchy

| Layer | Document / System | Role |
|-------|-------------------|------|
| 1 | Soul File + Soul Runtime | Permanent identity, memory, doctrine |
| 2 | Commerce Canon (C001) | Lifecycle phases, state machine, journeys |
| 3 | **Commerce OS Blueprint (this doc)** | Kernel architecture, objects, events, adapters |
| 4 | Reality Integration + Execution modules | Connection + live execution (today) |
| 5 | Connectors (future) | Provider-specific adapter implementations |

**Rule:** Connectors inherit the COS kernel. They never redefine lifecycle, vault, governance, or object model.

---

## 2. COS Kernel Architecture

The COS kernel is **not a monolith**. It is a **constellation of domain kernels** orchestrated by Brain, unified by shared interfaces, objects, and events.

```
                    ┌─────────────────────────────────┐
                    │         BRAIN / AGENT           │
                    │    Guardian · Governance        │
                    └───────────────┬─────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │              COMMERCE OS KERNEL (COS)                  │
        │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
        │  │Workflow │ │Connector│ │  Event  │ │Knowledge│      │
        │  │ Kernel  │ │ Kernel  │ │ Kernel  │ │ Kernel  │      │
        │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘      │
        │       │    ┌──────┴──────┐    │           │           │
        │  ┌────┴────┐         ┌────┴────┐    ┌────┴────┐      │
        │  │Marketplace│ ...   │ Payment │    │  Agent  │      │
        │  │ Supplier  │       │  Ads    │    │ Identity│      │
        │  │ Logistics │       │Analytics│    │Automation│     │
        │  │    CS     │       └─────────┘    └─────────┘      │
        │  └───────────┘                                        │
        └───────────────────────────┬───────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │   ADAPTERS (external providers)  │
                    │ Amazon · Shopify · Stripe · CJ … │
                    └─────────────────────────────────┘
```

### 2.1 Kernel Template (applies to every kernel below)

Each kernel defines:

| Dimension | Specification |
|-----------|---------------|
| **Purpose** | Why this kernel exists in COS |
| **Responsibilities** | What it owns vs delegates |
| **Inputs** | Universal objects, events, credentials, governance decisions |
| **Outputs** | Universal objects, events, audit records, health signals |
| **Shared interfaces** | Contracts other kernels call |
| **Lifecycle** | States the kernel manages |
| **Events** | Emits/consumes on universal event bus |
| **Failure handling** | Degrade, block, alert — never silent corruption |
| **Retry strategy** | 3 attempts, exponential backoff; idempotent operations |
| **Rollback strategy** | Compensating actions + metadata for human recovery |
| **Security model** | Vault-only credentials; least privilege scopes |
| **Governance hooks** | Pre-action assessment; irreversible action gates |
| **ESIS inspection hooks** | Health, placeholders, capability coverage |
| **Soul integration** | Milestone capture; lesson recording on material outcomes |
| **Existing module reuse** | No duplication — extend only |

---

## 3. Domain Kernels (Part 2 + Part 3)

### 3.1 Marketplace Kernel

| Dimension | Definition |
|-----------|------------|
| **Purpose** | Operate businesses on external marketplaces (Shopify, Amazon, eBay, Shopee, Lazada, TikTok Shop, Walmart, Etsy, WooCommerce, Meta Shops, Google Merchant). |
| **Responsibilities** | Listing lifecycle, marketplace account health, marketplace-specific constraints, publish orchestration. |
| **Inputs** | `Product`, `Variant`, `Brand`, `Listing`, marketplace credentials, readiness evaluation. |
| **Outputs** | `Listing`, inventory sync requests, marketplace events, health metrics. |
| **Shared interfaces** | `IMarketplaceAdapter` (via Connector Kernel), `PublishRequest`, `ListingReceipt`. |
| **Lifecycle** | `DISCONNECTED → CONNECTING → CONNECTED → VALIDATING → READY → PUBLISHING → LIVE → DEGRADED → FAILED`. |
| **Events** | `ListingPublished`, `ListingUpdated`, `ListingRemoved`, `ConnectorOffline`, `InventoryChanged`. |
| **Failure** | Block publish on health FAILED; surface in Mission Control; no partial silent publish. |
| **Retry** | Idempotent publish by `externalListingId`; 3× backoff on 429/5xx. |
| **Rollback** | Unpublish or mark listing `SUSPENDED`; store rollback receipt in audit. |
| **Security** | OAuth tokens in `credential_vault` only; scope verification on connect. |
| **Governance** | `assessConnectorGovernance` before connect; human approval before first live publish. |
| **ESIS** | Capability matrix row per marketplace; health center entry. |
| **Soul** | Capture first listing, first marketplace connected milestones. |
| **Reuse** | `reality-integration`, `marketplace-infrastructure-engine`, `marketplace-connection-engine`, `product-publishing-engine` (local/staging). |

### 3.2 Supplier Kernel

| Dimension | Definition |
|-----------|------------|
| **Purpose** | Source products, inventory, pricing, and fulfillment from supplier networks. |
| **Responsibilities** | Catalog sync, supplier mapping, order submission handoff to Logistics Kernel. |
| **Inputs** | `Product`, `Variant`, `Supplier`, supplier credentials, order line items. |
| **Outputs** | Supplier catalog records, `Inventory` updates, supplier order IDs. |
| **Shared interfaces** | `ISupplierAdapter`, `SupplierOrderRequest`, `SupplierCatalogSync`. |
| **Lifecycle** | Same connector lifecycle as Marketplace Kernel. |
| **Events** | `InventoryChanged`, `SupplierOrderSubmitted`, `SupplierOutage`. |
| **Failure** | Fail loud when LIVE enabled; mock only when explicitly gated. |
| **Retry** | Idempotent submit by `idempotencyKey` + order ID. |
| **Rollback** | Cancel supplier order where API supports; audit + human queue otherwise. |
| **Security** | API keys in vault; never log secrets. |
| **Governance** | Founder approval for irreversible supplier submit. |
| **ESIS** | Supplier health in connector graph. |
| **Soul** | First supplier connected, first shipment milestones. |
| **Reuse** | `live-cj-fulfillment`, supplier sync, `cj-dropshipping` module. |

### 3.3 Payment Kernel

| Dimension | Definition |
|-----------|------------|
| **Purpose** | Capture, verify, refund, and reconcile payments across providers. |
| **Responsibilities** | PaymentIntent/CheckoutSession abstraction, webhook verification, ledger integration. |
| **Inputs** | `Order`, `Customer`, amount, currency, payment method config. |
| **Outputs** | `Payment`, ledger events, OFD REAL sale events. |
| **Shared interfaces** | `IPaymentAdapter`, `CheckoutRequest`, `PaymentReceipt`, `RefundRequest`. |
| **Lifecycle** | `CREATED → PENDING → SUCCEEDED → SETTLED → REFUNDED → FAILED`. |
| **Events** | `PaymentSucceeded`, `PaymentFailed`, `RefundCreated`. |
| **Failure** | Webhook signature failure → reject; no order advancement. |
| **Retry** | Stripe automatic; internal DLQ for webhook processing. |
| **Rollback** | Refund path; pipeline `CANCELLED`. |
| **Security** | Webhook HMAC; PCI scope minimization (Stripe-hosted checkout). |
| **Governance** | `LIVE_PAYMENT_ENABLED` env gate + readiness. |
| **ESIS** | Payment adapter certification checklist. |
| **Soul** | First sale, first payout, first profit. |
| **Reuse** | `live-payment-engine`, `customer-order-pipeline`, treasury/ledger. |

### 3.4 Advertising Kernel

| Dimension | Definition |
|-----------|------------|
| **Purpose** | Create, launch, monitor, and optimize ads across platforms. |
| **Responsibilities** | Campaign lifecycle, creative upload, budget, ROAS feedback to Analytics Kernel. |
| **Inputs** | `Campaign`, `Asset`, `Product`, ad account credentials. |
| **Outputs** | Campaign status, spend records, `Analytics Event`. |
| **Shared interfaces** | `IAdvertisingAdapter`, `CampaignRequest`, `CreativeUpload`. |
| **Lifecycle** | `DRAFT → PENDING_APPROVAL → ACTIVE → PAUSED → STOPPED → FAILED`. |
| **Events** | `CampaignStarted`, `CampaignStopped`, `AdSpendRecorded`. |
| **Failure** | Block launch without OAuth; degrade to package-only mode. |
| **Retry** | Graph API rate limit backoff. |
| **Rollback** | Pause campaign; archive creatives. |
| **Security** | OAuth in vault; ad account scope validation. |
| **Governance** | Founder approve + launch for live spend. |
| **ESIS** | Meta/TikTok/Google capability rows. |
| **Soul** | First campaign launched lesson. |
| **Reuse** | `meta-ads-connector`, `execution-layer` marketing packages, `analytics-conversion-engine`. |

### 3.5 Logistics Kernel

| Dimension | Definition |
|-----------|------------|
| **Purpose** | Shipments, tracking, delivery confirmation across carriers and marketplace fulfillment. |
| **Responsibilities** | Tracking sync, delivery state, carrier handoff. |
| **Inputs** | `Order`, `Shipment`, supplier/marketplace tracking IDs. |
| **Outputs** | Updated `Shipment`, delivery events. |
| **Shared interfaces** | `ILogisticsAdapter`, `TrackingSyncRequest`. |
| **Lifecycle** | `CREATED → LABELLED → IN_TRANSIT → DELIVERED → EXCEPTION → RETURNED`. |
| **Events** | `ShipmentCreated`, `ShipmentDelivered`, `CustomerReturned`. |
| **Failure** | Mark pipeline exception; alert Mission Control. |
| **Retry** | Poll tracking with backoff; webhook preferred. |
| **Rollback** | Return initiation via marketplace or supplier adapter. |
| **Security** | PII minimization in logs. |
| **Governance** | Irreversible submit gated. |
| **ESIS** | Logistics adapter health. |
| **Soul** | First shipment milestone. |
| **Reuse** | `live-cj-fulfillment`, `customer-order-pipeline` tracking stages. |

### 3.6 Customer Service Kernel

| Dimension | Definition |
|-----------|------------|
| **Purpose** | Messaging, returns, disputes, reviews across marketplace CS APIs. |
| **Responsibilities** | Thread sync, return authorization, review ingestion. |
| **Inputs** | `Customer`, `Order`, marketplace message webhooks. |
| **Outputs** | CS tickets, return records, sentiment signals to Knowledge Kernel. |
| **Shared interfaces** | `ICustomerServiceAdapter`, `MessageThread`, `ReturnRequest`. |
| **Lifecycle** | `OPEN → AWAITING_CUSTOMER → AWAITING_MERCHANT → RESOLVED → ESCALATED`. |
| **Events** | `CustomerReturned`, `ReviewReceived`, `MessageReceived`. |
| **Failure** | Queue for retry; never drop messages. |
| **Retry** | Webhook + poll fallback. |
| **Rollback** | N/A — compensating customer communication. |
| **Security** | Customer PII encrypted at rest. |
| **Governance** | Refund/return above threshold → human approval. |
| **ESIS** | CS capability per marketplace matrix. |
| **Soul** | Retention lessons from CS patterns. |
| **Reuse** | `execution-layer` customer-lifetime package; future helpdesk adapters. |

### 3.7 Analytics Kernel

| Dimension | Definition |
|-----------|------------|
| **Purpose** | Unify metrics from marketplaces, ads, storefront, OFD into one analytics model. |
| **Responsibilities** | REAL vs SIMULATED labeling, conversion funnels, ROAS, visitor counts. |
| **Inputs** | `Analytics Event`, pixel configs, marketplace reports, ledger. |
| **Outputs** | KPI snapshots, funnel stages, Mission Control metrics. |
| **Shared interfaces** | `IAnalyticsAdapter`, `MetricIngest`, `FunnelStage`. |
| **Lifecycle** | `CONFIGURED → COLLECTING → AGGREGATING → REPORTING`. |
| **Events** | All commerce events consumable; emits `AnalyticsSnapshot`. |
| **Failure** | Fall back to SIMULATED with explicit label. |
| **Retry** | Batch ingest retry. |
| **Rollback** | Invalidate snapshot; recompute from event log. |
| **Security** | No PII in aggregate exports without governance. |
| **Governance** | Data retention policies. |
| **ESIS** | Validation health feeds analytics confidence score. |
| **Soul** | Strategic memory from performance trends. |
| **Reuse** | `analytics-conversion-engine`, `operation-first-dollar`, `kpi-engine`, `grand-kings-revenue-engine`. |

### 3.8 Automation Kernel

| Dimension | Definition |
|-----------|------------|
| **Purpose** | Cross-kernel workflows: publish everywhere, sync inventory, recover failures. |
| **Responsibilities** | Scheduled jobs, workflow triggers, agent tool dispatch. |
| **Inputs** | Workflow definitions, event subscriptions, governance policies. |
| **Outputs** | Workflow runs, task queue jobs, automation audit. |
| **Shared interfaces** | `IAutomationRule`, `WorkflowTrigger`, `ScheduledSync`. |
| **Lifecycle** | `IDLE → RUNNING → COMPLETED → FAILED → PAUSED`. |
| **Events** | Subscribes to all universal events; emits `AutomationExecuted`. |
| **Failure** | Dead-letter queue; Mission Control alert. |
| **Retry** | BullMQ / degraded queue pattern. |
| **Rollback** | Workflow compensation steps defined per template. |
| **Security** | Automation cannot bypass governance. |
| **Governance** | L2+ authority for irreversible automation. |
| **ESIS** | Automation coverage in inspection. |
| **Soul** | Record automation outcomes as lessons. |
| **Reuse** | `ecommerce-os-orchestrator`, Brain `WorkflowEngine`, `TaskQueue`. |

### 3.9 Identity Kernel

| Dimension | Definition |
|-----------|------------|
| **Purpose** | Businesses, brands, accounts, and external identity mapping. |
| **Responsibilities** | `workspaceId`, `companyId`, marketplace seller IDs, customer identity resolution. |
| **Inputs** | Registration events, OAuth account profiles. |
| **Outputs** | `Business`, `Brand`, `Customer` universal objects. |
| **Shared interfaces** | `IIdentityResolver`, `ExternalAccountMapping`. |
| **Lifecycle** | Entity lifecycle per `identity-registry`. |
| **Events** | `BusinessCreated`, `BrandUpdated`. |
| **Failure** | Block connect on identity mismatch. |
| **Retry** | Idempotent registration. |
| **Rollback** | Soft-delete + archive. |
| **Security** | RBAC via `permissions.ts`; session cookies. |
| **Governance** | Identity changes audited. |
| **ESIS** | Identity module health. |
| **Soul** | Brand soul tied to identity registry. |
| **Reuse** | `identity-registry`, `account-infrastructure-engine`, auth module. |

### 3.10 Workflow Kernel

| Dimension | Definition |
|-----------|------------|
| **Purpose** | Canon-aligned business lifecycle orchestration (IDEA → ARCHIVE). |
| **Responsibilities** | Stage transitions, approval chains, launch workflows. |
| **Inputs** | Canon phase, readiness evaluation, human approvals. |
| **Outputs** | Workflow state, blockers, next actions. |
| **Shared interfaces** | `IWorkflowStage`, `ApprovalGate`. |
| **Lifecycle** | Maps 1:1 to Commerce Canon §2 and §3. |
| **Events** | `ProductApproved`, `LaunchReady`, `GovernanceBlocked`. |
| **Failure** | Block transition; surface blockers. |
| **Retry** | Human-triggered retry only for failed stages. |
| **Rollback** | `PAUSED`, `ARCHIVE` paths. |
| **Security** | Role-based approval. |
| **Governance** | Every irreversible transition assessed. **Future product launches:** CRIR commercial risk certification required (ADR-051; documentation criterion at READINESS). |
| **ESIS** | Commerce pipeline stage inspection. |
| **Soul** | Workflow milestones captured. |
| **Reuse** | `ecommerce-os-orchestrator`, all orchestration engines mapped in canon. |

### 3.11 Connector Kernel

| Dimension | Definition |
|-----------|------------|
| **Purpose** | **Single runtime** for all external providers — the heart of COS adapter architecture. |
| **Responsibilities** | Adapter registry, dispatch, vault binding, health aggregation, webhook routing. |
| **Inputs** | Adapter registration, credentials, operation requests. |
| **Outputs** | Adapter responses, monitoring events, health center. |
| **Shared interfaces** | `ICommerceAdapter` (Connector SDK — §8). |
| **Lifecycle** | Connector lifecycle from `reality-integration` (DISCONNECTED → CONNECTED → DEGRADED → FAILED). |
| **Events** | `ConnectorOffline`, provider-specific → universal translation. |
| **Failure** | Lifecycle → DEGRADED/FAILED; dependent kernels blocked. |
| **Retry** | `withRetry` 3× 50ms (existing); extend with DLQ for webhooks. |
| **Rollback** | Disconnect + token revoke + webhook cleanup. |
| **Security** | Vault-only; HMAC webhooks. |
| **Governance** | Connect/disconnect assessed. |
| **ESIS** | Full connector graph inspection. |
| **Soul** | Connection milestones. |
| **Reuse** | **`reality-integration`** (catalog, vault, health center, governance) — **do not duplicate**. |

### 3.12 Event Kernel

| Dimension | Definition |
|-----------|------------|
| **Purpose** | Universal event bus — provider events → Empire events. |
| **Responsibilities** | Schema registry, idempotency, replay protection, fan-out to kernels. |
| **Inputs** | Webhooks, adapter emissions, internal service events. |
| **Outputs** | Universal events to subscribers (OFD, Soul, Analytics, ESIS). |
| **Shared interfaces** | `IUniversalEvent`, `EventEnvelope`, `EventSubscriber`. |
| **Lifecycle** | `RECEIVED → VERIFIED → PROCESSED → ARCHIVED` / `DEAD_LETTER`. |
| **Events** | See §7 Universal Event Model. |
| **Failure** | DLQ + audit; no silent drop. |
| **Retry** | Exponential backoff; max 3 internal retries. |
| **Rollback** | Compensating event emission. |
| **Security** | Signature verification per provider. |
| **Governance** | `GovernanceBlocked` event on policy violation. |
| **ESIS** | Event processing health. |
| **Soul** | Material events captured automatically. |
| **Reuse** | Brain `EventBus`, `soul-runtime`, Stripe webhook pattern, `connector_monitoring_events`. |

### 3.13 Knowledge Kernel

| Dimension | Definition |
|-----------|------------|
| **Purpose** | Intelligence, graph, Eye, strategic memory — informed commerce decisions. |
| **Responsibilities** | Product intelligence, competitor signals, lessons, recommendations. |
| **Inputs** | Scout data, Eye reports, OFD learning, adapter metrics. |
| **Outputs** | Recommendations, blockers, enrichment for Workflow Kernel. |
| **Shared interfaces** | `IKnowledgeQuery`, `Recommendation`. |
| **Lifecycle** | Per Eye/investigation modules. |
| **Events** | Consumes discovery + performance events. |
| **Failure** | Degrade to mock with SIMULATED label. |
| **Retry** | Scout poll retry. |
| **Rollback** | Invalidate stale recommendations. |
| **Security** | No credential storage. |
| **Governance** | Intelligence does not auto-execute irreversible actions. |
| **ESIS** | Intelligence module inventory. |
| **Soul** | `strategic-memory-engine`, lessons. |
| **Reuse** | Eye series, product scout, PIE, supplier intelligence, `empire_knowledge_graph`. |

### 3.14 Agent Kernel

| Dimension | Definition |
|-----------|------------|
| **Purpose** | AI workforce executes commerce operations via Brain tools under authority levels. |
| **Responsibilities** | Tool dispatch, LLM routing, agent workflows, Mission Engine recommendations. |
| **Inputs** | Dashboard state, blockers, user prompts, universal events. |
| **Outputs** | Tool executions, agent responses, mission actions. |
| **Shared interfaces** | `RegisteredTool`, `BrainDispatch`, authority L1–L3. |
| **Lifecycle** | Agent run: `QUEUED → RUNNING → COMPLETED → BLOCKED`. |
| **Events** | Emits via audit logger; consumes all kernels via tools. |
| **Failure** | Guardian block → `GovernanceBlocked`. |
| **Retry** | Task queue retry. |
| **Rollback** | No auto-rollback of agent actions — audit + human. |
| **Security** | Guardian + permissions per module. |
| **Governance** | Pre-dispatch assessment mandatory. |
| **ESIS** | Tool registry inspection. |
| **Soul** | Agent decisions logged. |
| **Reuse** | Brain, `AgentManager`, `module-routes`, Mission Engine frontend. |

---

## 4. Adapter Architecture (Part 4)

Every external platform **inherits** the same adapter contract. Adapters are **thin** — map universal objects ↔ provider APIs. They **never** implement orchestration logic owned by kernels.

### 4.1 Adapter Categories

| Category | Providers (examples) | Existing reference module |
|----------|---------------------|---------------------------|
| Marketplace | Amazon, eBay, Shopee, Lazada, Shopify, TikTok Shop, Walmart, WooCommerce, Etsy, Meta Shops, Google Merchant | `reality-integration` catalog |
| Payment | Stripe, PayPal | `live-payment-engine` |
| Supplier | CJ, AliExpress, AutoDS, Zendrop | `live-cj-fulfillment` |
| Logistics | DHL, FedEx, marketplace fulfillment APIs | Extend Logistics Kernel |
| Advertising | Meta, Google, TikTok, Pinterest | `meta-ads-connector` |
| Analytics | GA4, Meta Pixel, marketplace analytics | `analytics-conversion-engine` |
| Customer Service | Marketplace messaging, Zendesk (future) | — |

### 4.2 Required Adapter Surface

Every adapter implements:

| Operation | Description |
|-----------|-------------|
| **Connection** | Register in provider catalog; store credentials in vault |
| **Authentication** | OAuth2 / API key / refresh token per provider |
| **Health** | Live probe; rate limit headers; outage detection |
| **Capabilities** | Declare supported operations (publish, orders, etc.) |
| **Publishing** | Create/update/delete listings → `Listing` objects |
| **Orders** | Ingest/sync orders → `Order` objects |
| **Inventory** | Bidirectional sync → `Inventory` objects |
| **Events** | Webhook ingest → universal events |
| **Monitoring** | Emit to `connector_monitoring_events` |
| **Recovery** | Idempotent replay; rollback metadata |

### 4.3 Adapter Registration Flow

```
1. Register in reality-integration/provider-catalog.ts (single catalog)
2. Implement execution adapter module (execution/{provider}-adapter)
3. Bind to Connector Kernel dispatch table
4. Add capability matrix row (§9)
5. Pass certification (§10)
6. ESIS inspection entry auto-discovered
```

**No second catalog. No duplicate vault.**

---

## 5. Cross-Platform Orchestration (Part 5)

When Brain or Automation Kernel receives **Publish Product**:

```
Publish Product (universal Product + Variant)
        │
        ▼
┌───────────────────┐
│ Workflow Kernel   │ ← Canon READINESS gate passed?
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Which marketplaces?│ ← Marketplace Kernel: user selection + readiness
│ (Amazon, Shopify…) │
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Which suppliers?   │ ← Supplier Kernel: SKU mapping, inventory source
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Which logistics?   │ ← Logistics Kernel: carrier rules per marketplace
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Which ads?         │ ← Advertising Kernel: optional campaign bootstrap
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Which payments?    │ ← Payment Kernel: marketplace-native vs Stripe
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Execute (parallel  │ ← Connector Kernel dispatches adapters
│  where safe)       │
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Failure coord.     │ ← Partial success policy:
│                    │   - All-or-nothing (default for first publish)
│                    │   - Best-effort + rollback manifest (scale phase)
│                    │   - Human approval on partial (governance)
└───────────────────┘
```

**Failure coordination rules:**

1. **Dependency order:** Payment + marketplace account before publish; supplier before fulfillment.
2. **Partial publish:** Record per-marketplace receipt; block LIVE state until all required channels succeed.
3. **Compensation:** Unpublish successful listings if critical channel fails (configurable).
4. **Audit:** Every step → Brain audit + universal event + Soul if material.

**Reuse:** `ecommerce-os-orchestrator` prepare flow, `commerce-readiness-engine`, `execution-layer` packages — orchestration logic extends, not replaces.

---

## 6. Universal Commerce Object Model (Part 6)

Every connector maps provider-specific data into these **canonical entities**:

| Entity | Key fields | Owner kernel | Existing storage (reuse) |
|--------|------------|--------------|--------------------------|
| **Business** | `businessId`, `workspaceId`, `companyId`, `state` | Identity / Workflow | `business_opportunity_workspace`, workflows |
| **Brand** | `brandId`, `name`, `story`, `assets` | Identity | brand-genesis, preview studio |
| **Product** | `productId`, `sku`, `title`, `category` | Marketplace | `products`, build packages |
| **Variant** | `variantId`, `productId`, `options`, `price` | Marketplace | build/listing packages |
| **Supplier** | `supplierId`, `providerId`, `trustScore` | Supplier | `suppliers`, supplier intelligence |
| **Marketplace** | `marketplaceId`, `providerId`, `region` | Marketplace | `marketplace_connections` |
| **Listing** | `listingId`, `externalListingId`, `marketplaceId`, `status` | Marketplace | `published_store_products`, catalog publishes |
| **Inventory** | `sku`, `quantity`, `reserved`, `source` | Supplier / Marketplace | reservations, supplier sync |
| **Order** | `orderId`, `externalOrderId`, `status`, `lines` | Workflow / Payment | `customer_order_pipelines`, `orders` |
| **Customer** | `customerId`, `email`, `marketplaceBuyerId` | Identity / CS | pipeline customer fields |
| **Payment** | `paymentId`, `externalReference`, `amount`, `status` | Payment | `live_payments`, ledger |
| **Shipment** | `shipmentId`, `trackingNumber`, `carrier`, `status` | Logistics | CJ fulfillment, pipeline tracking |
| **Refund** | `refundId`, `orderId`, `amount`, `reason` | Payment | live payment refund |
| **Campaign** | `campaignId`, `platform`, `budget`, `status` | Advertising | `meta_ads_campaigns` |
| **Asset** | `assetId`, `type`, `url`, `hash` | Marketplace / Ads | creative assets, publish bundles |
| **Analytics Event** | `eventId`, `name`, `source`, `payload`, `REAL\|SIMULATED` | Analytics | `analytics_server_events`, OFD |

**Mapping rule:** Adapters implement `toUniversal(providerPayload) → Entity` and `fromUniversal(Entity) → providerPayload`. Kernels never consume raw provider JSON.

---

## 7. Universal Event Bus (Part 7)

### 7.1 Event Envelope

```typescript
// Architecture only — not implemented in COS-001
interface UniversalEventEnvelope {
  eventId: string;           // UUID, idempotency key
  eventType: UniversalEventType;
  workspaceId: string;
  companyId: string;
  source: { adapterId: string; providerEventId?: string };
  entityRefs: { type: string; id: string }[];
  payload: Record<string, unknown>;
  occurredAt: string;        // ISO-8601
  recordedAt: string;
  verification: "REAL" | "SIMULATED";
  correlationId?: string;
}
```

### 7.2 Standard Event Catalog

| Event | Emitting kernel | Primary subscribers |
|-------|-----------------|---------------------|
| `BusinessCreated` | Identity | Workflow, Soul, ESIS |
| `ProductApproved` | Workflow | Marketplace, Knowledge |
| `ListingPublished` | Marketplace | OFD, Analytics, Soul |
| `InventoryChanged` | Supplier / Marketplace | Marketplace, Automation |
| `OrderPlaced` | Marketplace / Payment | Workflow, Supplier, Analytics |
| `PaymentSucceeded` | Payment | OFD, Order, Ledger, Soul |
| `ShipmentCreated` | Logistics | Order, Analytics |
| `ShipmentDelivered` | Logistics | OFD, CS, Soul |
| `RefundCreated` | Payment | Order, Ledger, Analytics |
| `CampaignStarted` | Advertising | Analytics |
| `CampaignStopped` | Advertising | Analytics |
| `CustomerReturned` | CS / Logistics | Order, Analytics |
| `ConnectorOffline` | Connector | ESIS, Mission Control, Automation |
| `GovernanceBlocked` | Agent / Governance | Workflow, Soul, Mission Control |

**Translation rule:** Adapter receives provider webhook → validates → maps to `UniversalEventEnvelope` → Event Kernel fan-out.

**Reuse:** Brain `EventBus`, `soul_runtime_events`, `connector_monitoring_events`, OFD `recordRealBusinessEvent`.

---

## 8. Connector SDK (Part 8)

Architecture-only interface every future connector must implement:

```typescript
// COS Connector SDK — specification only (COS-001)

type AdapterCategory =
  | "marketplace" | "supplier" | "payment" | "advertising"
  | "logistics" | "customer_service" | "analytics";

interface ICommerceAdapter {
  readonly adapterId: string;          // e.g. "shopify", "amazon-seller"
  readonly category: AdapterCategory;
  readonly version: string;
  readonly capabilities: AdapterCapability[];

  // Connection layer (delegates vault to Connector Kernel)
  connect(ctx: ConnectContext): Promise<ConnectResult>;
  validate(ctx: ValidateContext): Promise<ValidateResult>;
  disconnect(ctx: DisconnectContext): Promise<void>;

  // Health & monitoring
  health(ctx: HealthContext): Promise<HealthProbe>;

  // Domain operations (category-dependent — unsupported throws CapabilityError)
  publish?(ctx: PublishContext): Promise<PublishResult>;
  updateListing?(ctx: UpdateListingContext): Promise<ListingResult>;
  deleteListing?(ctx: DeleteListingContext): Promise<void>;
  syncInventory?(ctx: InventorySyncContext): Promise<InventorySyncResult>;
  ingestOrder?(ctx: OrderIngestContext): Promise<Order>;
  submitSupplierOrder?(ctx: SupplierOrderContext): Promise<SupplierOrderResult>;
  createCheckout?(ctx: CheckoutContext): Promise<CheckoutResult>;
  processWebhook?(ctx: WebhookContext): Promise<UniversalEventEnvelope[]>;
  syncTracking?(ctx: TrackingSyncContext): Promise<Shipment>;

  // Cross-cutting
  recover?(ctx: RecoverContext): Promise<RecoverResult>;
}

type AdapterCapability =
  | "connect" | "publish" | "orders" | "inventory" | "webhooks"
  | "payments" | "refunds" | "ads" | "messaging" | "returns" | "bulk";
```

**SDK rules:**

1. Adapters are **stateless** — state in SQLite via kernel repositories.
2. Adapters **never** call other adapters directly — only through Connector Kernel orchestration.
3. Adapters **must** map to universal objects (§6) and events (§7).
4. Unsupported capabilities omitted from `capabilities[]` — kernels check before dispatch.
5. Execution remains **gated** until certification (§10) + governance unlock.

---

## 9. Marketplace Capability Matrix (Part 9)

Legend: ✅ Supported (target) · 🔲 Planned · ⚠️ Constraint · — N/A

| Marketplace | Publish | Inventory | Orders | Returns | Messaging | Ads | Analytics | Webhooks | Bulk | Rate limits | Known constraints | Future |
|-------------|---------|-----------|--------|---------|-----------|-----|-----------|----------|------|-------------|-------------------|--------|
| **Shopify** | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | — | 🔲 | 🔲 | 🔲 | 120/min | OAuth required; Admin API version pinning | COS-002 ref adapter |
| **Amazon** | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | 60/min | SP-API complexity; regional accounts | Phase 2 |
| **eBay** | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | — | 🔲 | 🔲 | 🔲 | 60/min | Sandbox vs production keys | Phase 2 |
| **Shopee** | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | — | 🔲 | 🔲 | 🔲 | 100/min | Regional API endpoints | Phase 3 |
| **Lazada** | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | — | 🔲 | 🔲 | 🔲 | 100/min | Southeast Asia focus | Phase 3 |
| **TikTok Shop** | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | 120/min | Seller verification | Phase 2 |
| **Walmart** | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | — | 🔲 | 🔲 | 🔲 | 40/min | Seller approval required | Phase 3 |
| **WooCommerce** | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | — | 🔲 | 🔲 | 🔲 | Self-hosted | REST + webhooks; store URL per tenant | Phase 2 |
| **Etsy** | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | — | 🔲 | 🔲 | 🔲 | 60/min | Handmade/vintage rules | Phase 3 |
| **Meta Shops** | 🔲 | 🔲 | 🔲 | — | 🔲 | 🔲 | 🔲 | 🔲 | 🔲 | 80/min | Depends on Meta Commerce | Phase 2 |
| **Google Merchant** | 🔲 | 🔲 | — | — | — | — | 🔲 | 🔲 | 🔲 | 100/min | Feed-based; not full marketplace | Phase 2 |

**Non-marketplace adapters (same matrix pattern, abbreviated):**

| Provider | Category | Key capabilities | Reuse module |
|----------|----------|------------------|--------------|
| Stripe | Payment | Checkout, PI, webhooks, refunds | `live-payment-engine` |
| PayPal | Payment | OAuth, webhooks | Planned |
| CJ | Supplier | Catalog, order submit, tracking | `live-cj-fulfillment` |
| DHL / FedEx | Logistics | Tracking, labels | Planned |
| Meta Ads | Advertising | OAuth, campaigns | `meta-ads-connector` |
| Google Ads | Advertising | Campaigns | Planned |

---

## 10. Adapter Certification (Part 10)

Before any connector becomes **production ready**, it must pass:

| Gate | Owner | Pass criteria |
|------|-------|---------------|
| **Commerce Canon** | Workflow Kernel | Maps to canon phases; no parallel lifecycle |
| **Soul** | Soul Runtime | Material events captured |
| **Governance** | `empire-governance` | Connect/disconnect/irreversible actions assessed |
| **ESIS** | `empire-self-inspection` | Appears in connector graph; health probes documented |
| **Operation First Dollar** | OFD | REAL events require `externalReference` |
| **Reality Integration** | Connector Kernel | Registered in single catalog; vault-only credentials |
| **Security** | Guardian | Webhook verification; no secret leakage |
| **Validation** | Test suite | Adapter contract tests pass |
| **Monitoring** | Connector Kernel | Heartbeat + monitoring events |
| **Rollback** | Adapter spec | Documented compensating actions |

**Certification states:** `DRAFT → ARCHITECTURE → STAGING → CERTIFIED → LIVE`

COS-001 adapters remain at **ARCHITECTURE** — no LIVE certification until COS-002+.

---

## 11. Integration Map (Part 11)

```
┌─────────────────────────────────────────────────────────────────┐
│ SOUL FILE · SOUL RUNTIME                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ COMMERCE CANON (C001) — lifecycle · state machine · journeys     │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ COMMERCE OS BLUEPRINT (this doc) — kernels · objects · events    │
└────────────────────────────┬────────────────────────────────────┘
                             │
     ┌───────────────────────┼───────────────────────┐
     │                       │                       │
┌────▼─────┐  ┌──────────────▼──────────────┐  ┌────▼─────┐
│  BRAIN   │  │     CONNECTOR KERNEL        │  │  ESIS    │
│ Agent    │  │  (reality-integration)        │  │ inspect  │
│ Guardian │  │  vault · health · catalog   │  │          │
└────┬─────┘  └──────────────┬──────────────┘  └────┬─────┘
     │                       │                       │
     │    ┌──────────────────┼──────────────────┐    │
     │    │                  │                  │    │
┌────▼────▼───┐  ┌───────────▼────────┐  ┌─────▼────▼─────┐
│ Workflow    │  │ Execution Layer    │  │ OFD            │
│ (ecommerce- │  │ (packages · ads ·  │  │ REAL/SIMULATED │
│  os-orchestr)│  │  fulfillment pkg)  │  │ milestones     │
└─────┬───────┘  └─────────┬──────────┘  └───────┬────────┘
      │                    │                      │
┌─────▼───────┐  ┌─────────▼──────────┐  ┌───────▼────────┐
│ Marketplace │  │ Live execution      │  │ Grand King     │
│ Connection  │  │ modules (Stripe,    │  │ Dashboard      │
│ engine      │  │ CJ, Meta, publish)  │  │ Mission Control│
└─────────────┘  └─────────────────────┘  └────────────────┘
```

### 11.1 Module Reuse Matrix (no duplication)

| COS kernel | Existing module(s) | Integration |
|------------|-------------------|-------------|
| Connector | `reality-integration` | Catalog, vault, health, connect |
| Workflow | `ecommerce-os-orchestrator`, canon-mapped engines | Launch workflow, approvals |
| Marketplace | `marketplace-connection-engine`, `marketplace-infrastructure-engine` | Connection records, OAuth scaffolding |
| Supplier | `live-cj-fulfillment`, supplier sync | Fulfillment submit |
| Payment | `live-payment-engine` | Checkout, webhooks |
| Advertising | `meta-ads-connector` | OAuth, campaigns |
| Analytics | `operation-first-dollar`, `analytics-conversion-engine` | KPIs, pixels |
| Knowledge | `eye-series`, product scout, PIE | Intelligence |
| Agent | Brain, `module-routes`, tools | Dispatch |
| Event | Brain `EventBus`, Soul Runtime | Fan-out |
| Identity | `identity-registry`, auth | RBAC |
| Automation | Brain `WorkflowEngine`, TaskQueue | Jobs |
| Logistics | `customer-order-pipeline`, CJ tracking | Shipment states |
| ESIS | `empire-self-inspection` | Self-inspection |

**Grand King Dashboard** (`ecommerce-os-orchestrator` + Mission Control) consumes kernel health via existing dashboard builders — Live Operations Center (future) extends without replacing.

---

## 12. Implementation Phases (Future — Not COS-001)

| Phase | Mission | Scope |
|-------|---------|-------|
| COS-002 | Connector SDK implementation | TypeScript interfaces + Connector Kernel dispatch |
| COS-003 | Reference marketplace adapter | Shopify architecture → staging |
| COS-004 | Universal event bus | Event Kernel SQLite + webhook gateway |
| COS-005 | Cross-platform publish orchestration | Automation Kernel templates |
| COS-006 | Live Operations Center | Mission Control multi-channel metrics |

---

## 13. Glossary

| Term | Definition |
|------|------------|
| **COS** | Commerce Operating System — this kernel architecture |
| **Kernel** | Domain owner within COS (14 kernels) |
| **Adapter** | Provider-specific implementation of Connector SDK |
| **Universal object** | Canonical entity all adapters map into |
| **Universal event** | Canonical event all adapters emit |
| **Certification** | Gate before LIVE execution |

---

*End of Commerce OS Blueprint — COS-001*
