# System Architecture — EmpireAI Commerce

**Document type:** Technical architecture specification  
**Product:** EmpireAI Commerce  
**Version:** 1.0  
**Status:** Draft  
**Audience:** Engineering, platform, security, and DevOps  
**Companion docs:** [AI_EMPLOYEES.md](./AI_EMPLOYEES.md) · [FOUNDER_EXPERIENCE.md](./FOUNDER_EXPERIENCE.md) · [PRODUCT_INTELLIGENCE_ENGINE.md](./PRODUCT_INTELLIGENCE_ENGINE.md) · [NAVIGATION.md](./NAVIGATION.md)

---

## Executive Summary

EmpireAI Commerce is a multi-tenant SaaS platform that provisions AI-operated dropshipping stores, connects suppliers and ad platforms, and exposes a passive monitoring dashboard to founders. The architecture separates **founder-facing application services**, **commerce infrastructure (Shopify)**, **integration adapters**, and an **AI orchestration layer** that drives autonomous operation after setup.

**Core design choices:**

- **Modular monolith** for core backend (v1) with clear module boundaries, extractable to services later
- **Shopify** as the commerce engine for storefront, cart, checkout, and order capture
- **Event-driven** communication between backend modules and AI orchestration
- **Adapter pattern** for suppliers and ad platforms (Meta, Google, TikTok)
- **PostgreSQL** as system of record; **Redis** for cache, queues, and sessions
- **Object storage** for assets, creatives, and exports

---

## Architecture Principles

| Principle | Implementation |
|-----------|----------------|
| **Founder API is thin** | Frontend calls a single backend API; no direct integration access from browser |
| **Secrets never in frontend** | OAuth tokens, API keys, and supplier credentials stored server-side only |
| **AI acts via tools** | Orchestration layer invokes backend APIs—agents do not hold database credentials |
| **Idempotent integrations** | Webhooks and jobs safe to retry; deduplication keys on all inbound events |
| **Tenant isolation** | Every record scoped by `workspace_id` / `store_id`; row-level enforcement |
| **Observable by default** | Structured logs, traces, and metrics on every cross-component call |

---

## High-Level Architecture

```
                                    ┌─────────────────────────────────┐
                                    │         FOUNDERS / CDN          │
                                    └───────────────┬─────────────────┘
                                                    │ HTTPS
                    ┌───────────────────────────────▼───────────────────────────────┐
                    │                      FRONTEND (Web App)                        │
                    │   Marketing · Setup wizard · Dashboard · Auth UI               │
                    └───────────────────────────────┬───────────────────────────────┘
                                                    │ REST / WebSocket
                    ┌───────────────────────────────▼───────────────────────────────┐
                    │                    API GATEWAY / BACKEND API                     │
                    │         Auth · Stores · Orders · Billing · Dashboard agg       │
                    └─┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────────┘
                      │         │         │         │         │         │
         ┌────────────▼──┐  ┌───▼───┐  ┌──▼──┐  ┌───▼───┐  ┌──▼──┐  ┌──▼──────────┐
         │  PostgreSQL   │  │ Redis │  │ S3  │  │Worker │  │ AI  │  │ Notification│
         │  (primary DB) │  │cache/ │  │files│  │queue  │  │Orch.│  │  service    │
         └───────────────┘  │ queue │  └─────┘  └───┬───┘  └──┬──┘  └──────┬──────┘
                            └───────┘               │         │            │
                                                    └────┬────┘            │
                                                         │                 │
                    ┌────────────────────────────────────▼─────────────────▼──┐
                    │              INTEGRATION ADAPTER LAYER                   │
                    ├──────────┬──────────┬───────────┬──────────┬─────────────┤
                    │ Shopify  │ Suppliers│ Meta Ads  │Google Ads│ TikTok Ads  │
                    │          │          │           │          │             │
                    └──────────┴──────────┴───────────┴──────────┴─────────────┘
                                         │ Stripe │
                                         └────────┘
```

---

## Component Catalog

| Component | Repository path | Role |
|-----------|-----------------|------|
| Frontend | `frontend/` | Web UI for marketing, setup, dashboard |
| Backend API | `backend/` | Business logic, REST/WebSocket API, webhooks |
| Database | `database/` | Migrations, schemas, seeds |
| AI agents | `ai-agents/` | Agent definitions, prompts, tool contracts |
| API contracts | `api/` | OpenAPI specs, shared schemas |
| Automation | `automation/` | Scheduled jobs, CI helpers |
| Deployment | `deployment/` | Docker, K8s, IaC |

---

## 1. Frontend

### Purpose

Single web application serving public marketing pages, authenticated setup wizard, and post-launch dashboard. No server-side business logic beyond rendering and client-side state.

### Technology profile (target)

| Aspect | Choice |
|--------|--------|
| Framework | React with SSR/SSG (e.g., Next.js) |
| State | Server state via API client; local UI state in components |
| Auth session | HTTP-only cookies; no tokens in localStorage |
| Real-time | WebSocket for build progress, order alerts, AI activity feed |
| Styling | Component library aligned with design system |

### Modules

| Module | Routes | Backend dependency |
|--------|--------|-------------------|
| Marketing | `/`, `/pricing`, `/support` | Public CMS/content API (optional) |
| Auth | `/login`, `/signup` | Auth service |
| Setup wizard | `/setup/*` | Store setup API, WebSocket |
| Dashboard | `/dashboard/*` | Aggregated dashboard API, WebSocket |
| Embedded payments | Billing, launch modals | Stripe Elements via setup intent API |

### Communication

| Target | Protocol | Purpose |
|--------|----------|---------|
| Backend API | HTTPS REST (JSON) | All CRUD and commands |
| Backend API | WebSocket | Build progress, live orders, notifications |
| Stripe.js | HTTPS (client SDK) | Payment method collection; tokens to backend only |
| Shopify storefront | HTTPS (new tab) | Customer-facing store (founder preview link) |
| CDN | HTTPS | Static assets |

**Does not communicate with:** Database, AI orchestration, supplier APIs, ad platforms, or object storage directly.

---

## 2. Backend

### Purpose

Central application layer: authentication, multi-tenant store lifecycle, integration orchestration, webhook ingestion, dashboard aggregation, and AI tool endpoints.

### Structure (modular monolith)

```
backend/
├── api/              # HTTP handlers, request validation
├── modules/
│   ├── auth/
│   ├── workspace/
│   ├── store/
│   ├── setup/
│   ├── catalog/
│   ├── orders/
│   ├── billing/
│   ├── integrations/
│   │   ├── shopify/
│   │   ├── suppliers/
│   │   ├── meta/
│   │   ├── google/
│   │   └── tiktok/
│   ├── analytics/
│   ├── notifications/
│   └── ai-bridge/    # Tool endpoints for orchestration layer
├── workers/          # Async job processors
└── webhooks/         # Inbound webhook routers
```

### Core services (logical)

| Service | Responsibility |
|---------|----------------|
| **Auth service** | Login, signup, OAuth, sessions, JWT issuance |
| **Workspace service** | Tenant, founder profile, journey state machine |
| **Store service** | Store metadata, brand kit, publish state |
| **Setup service** | Onboarding pipeline coordination |
| **Catalog service** | Products, PIE results, pricing |
| **Order service** | Order sync from Shopify, fulfillment routing |
| **Billing service** | Stripe subscriptions, ad spend ledger, invoices |
| **Integration service** | Adapter registry, credential vault, health checks |
| **Analytics service** | Metric aggregation, dashboard queries |
| **Notification service** | Enqueue email/push/in-app |
| **AI bridge** | Tool API surface for orchestration layer |
| **Webhook router** | Verify signatures, dedupe, dispatch to modules |

### External API surface

| API group | Consumers |
|-----------|-----------|
| `POST /auth/*` | Frontend |
| `GET/POST /setup/*` | Frontend (setup wizard) |
| `GET /dashboard/*` | Frontend (aggregated reads) |
| `POST /webhooks/*` | Shopify, Stripe, suppliers |
| `POST /internal/ai/tools/*` | AI orchestration layer (mTLS / service token) |
| `GET /health` | Load balancer, K8s probes |

### Communication

| Target | Protocol | Purpose |
|--------|----------|---------|
| PostgreSQL | TCP (SQL) | Read/write all persistent data |
| Redis | TCP | Cache, session store, pub/sub, job queue |
| Object storage | HTTPS (S3 API) | Upload/download assets |
| Worker processes | Redis queue | Async jobs |
| AI orchestration | HTTP (internal) | Trigger agent runs; receive completion events |
| Shopify Admin API | HTTPS REST/GraphQL | Store, products, orders |
| Supplier APIs | HTTPS | Catalog, fulfill, track |
| Meta Marketing API | HTTPS | Campaigns, insights |
| Google Ads API | HTTPS | Campaigns, conversions |
| TikTok Marketing API | HTTPS | Campaigns, insights |
| Stripe API | HTTPS | Customers, payment methods, charges |
| Email provider | HTTPS (API) | Transactional email |
| LLM providers | HTTPS | Via AI orchestration only (not direct from API modules) |

---

## 3. Database

### Purpose

System of record for tenants, stores, products, orders, integrations, AI activity, billing, and analytics snapshots.

### Primary store: PostgreSQL

| Schema area | Key entities |
|-------------|--------------|
| **Identity** | `users`, `sessions`, `oauth_accounts` |
| **Tenant** | `workspaces`, `workspace_members` |
| **Store** | `stores`, `brand_kits`, `journey_states` |
| **Catalog** | `products`, `product_research_runs`, `product_scores`, `suppliers`, `supplier_skus` |
| **Commerce** | `orders`, `order_line_items`, `fulfillments`, `refunds` |
| **Integrations** | `integration_connections`, `oauth_tokens` (encrypted), `webhook_events` |
| **Advertising** | `ad_accounts`, `campaigns`, `ad_creatives`, `ad_insights_daily` |
| **Billing** | `subscriptions`, `payment_methods`, `invoices`, `ad_spend_ledger` |
| **AI** | `agent_runs`, `agent_events`, `tool_invocations` |
| **Analytics** | `metrics_daily`, `metrics_hourly` (rollup tables) |
| **Notifications** | `notification_preferences`, `notifications` |

### Secondary stores

| Store | Use |
|-------|-----|
| **Redis** | Sessions, rate limits, job queues, real-time pub/sub, hot cache |
| **Object storage metadata** | `assets` table in PostgreSQL points to S3 keys |

### Data flow rules

- Shopify order IDs stored as external reference; EmpireAI `orders.id` is canonical internally
- Integration tokens encrypted at rest (AES-256); encryption keys in secrets manager
- PIE research snapshots immutable once founder selects products
- Analytics rollups written by workers; dashboard reads rollups, not raw events

### Communication

| Consumer | Protocol |
|----------|----------|
| Backend API | SQL read/write |
| Workers | SQL read/write |
| AI orchestration | SQL via backend tool APIs only (no direct DB access) |
| Analytics jobs | SQL batch reads/writes |

---

## 4. AI Orchestration Layer

### Purpose

Run the eight [AI employees](./AI_EMPLOYEES.md), coordinate multi-step workflows (setup pipeline, daily ops), invoke LLMs, and execute **tools** against the backend API.

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                   AI ORCHESTRATION LAYER                     │
├─────────────────────────────────────────────────────────────┤
│  Agent Runtime      │  Loads agent defs from ai-agents/     │
│  Workflow Engine    │  Setup pipeline, launch, daily cron     │
│  Event Bus          │  Inter-agent events (see AI_EMPLOYEES)│
│  Tool Executor      │  Calls backend /internal/ai/tools/*   │
│  LLM Gateway        │  OpenAI / Anthropic / routing         │
│  Memory Store       │  Run context, RAG over store data     │
└─────────────────────────────────────────────────────────────┘
```

| Component | Responsibility |
|-----------|----------------|
| **Agent runtime** | Executes agent loop: plan → tool calls → observe → complete |
| **Workflow engine** | DAG for setup (category → PIE → brand → build → launch) |
| **Event bus** | Redis Streams or internal queue; event types from AI_EMPLOYEES doc |
| **Tool executor** | Typed tools: `research_products`, `create_shopify_product`, `launch_meta_campaign`, etc. |
| **LLM gateway** | Model selection, prompt rendering, token budgets, audit logging |
| **Memory store** | Short-term run state in Redis; long-term summaries in PostgreSQL via backend |

### Agent ↔ backend boundary

AI orchestration **never** holds Shopify, Meta, or supplier credentials. All external actions go through backend integration adapters via tools:

```
Agent → Tool call → Backend AI bridge → Integration adapter → External API
                         ↓
                    PostgreSQL (audit log)
```

### Trigger sources

| Trigger | Workflow |
|---------|----------|
| Founder selects category | PIE run (Product Research AI) |
| Founder selects products | Store build pipeline |
| Build complete | Creative + launch prep |
| Founder sets budget | Ad launch workflow |
| Cron (hourly/daily) | Optimization, analytics digest, supplier health |
| Webhook events | Order placed → Ops AI; payment failed → CFO AI |
| Event bus signals | Cross-agent coordination |

### Communication

| Target | Protocol | Purpose |
|--------|----------|---------|
| Backend AI bridge | HTTPS (internal, service auth) | All tools and data reads |
| LLM providers | HTTPS | Inference |
| Redis | TCP | Event bus, run state, locks |
| PostgreSQL | — | **No direct access** |
| Frontend | — | **No direct access**; founder sees results via backend WebSocket |

---

## 5. Authentication

### Purpose

Secure founder access; separate credentials for internal services and integration OAuth.

### Founder authentication

| Method | Flow |
|--------|------|
| Email + password | Signup → bcrypt hash → session cookie |
| Google OAuth | OAuth 2.0 → link/create user → session |
| Apple OAuth | OAuth 2.0 → link/create user → session |

| Artifact | Storage |
|----------|---------|
| Session ID | HTTP-only secure cookie |
| Session data | Redis (TTL sliding) |
| Refresh rotation | Optional v2 |

### Authorization model

| Layer | Model |
|-------|-------|
| API | Session validation middleware; `workspace_id` scope on every request |
| AI tools | Service account JWT + run-scoped `store_id` claim |
| Webhooks | HMAC signature verification per provider |
| Internal admin | Separate admin SSO (future) |

### Integration OAuth (distinct from founder auth)

Stored in `integration_connections` per store:

| Integration | OAuth owner |
|-------------|-------------|
| Shopify | Per-store Admin API token via OAuth install |
| Meta Ads | Business Manager OAuth |
| Google Ads | Google OAuth + MCC linking |
| TikTok Ads | TikTok Marketing API OAuth |
| Stripe Connect (future) | Platform Connect onboarding |

### Communication

| Component | Interaction |
|-----------|-------------|
| Frontend ↔ Backend | Session cookie on all API requests |
| Backend ↔ Redis | Session read/write |
| Backend ↔ PostgreSQL | User and OAuth account records |
| Backend ↔ Google/Apple | OAuth token exchange |
| Integration adapters ↔ Providers | Per-store OAuth tokens refreshed by workers |

---

## 6. Payments

### Purpose

Collect platform subscription fees, store payment methods for ad spend pass-through, and ledger ad charges.

### Provider: Stripe

| Capability | Use |
|------------|-----|
| **Customers** | One Stripe customer per workspace |
| **Payment Methods** | Card on file at setup launch |
| **Subscriptions** | EmpireAI Commerce plan billing |
| **PaymentIntents / Charges** | Ad spend pass-through (where applicable) |
| **Invoices** | Monthly platform + ad spend summary |
| **Webhooks** | `payment_intent.succeeded`, `invoice.paid`, `payment_failed` |

### Payment flows

| Flow | Path |
|------|------|
| Add payment method | Frontend Stripe Elements → Backend SetupIntent → Stripe |
| Platform subscription | Backend creates Subscription on plan select |
| Ad spend tracking | Advertising adapters report spend → Backend ledger → Stripe charge (batch daily) |
| Checkout (end customer) | **Shopify Payments / Shopify checkout** — not EmpireAI Stripe |

**Important:** End-customer product payments flow through **Shopify checkout**. EmpireAI Stripe handles **founder → EmpireAI** billing only.

### Communication

| Component | Interaction |
|-----------|-------------|
| Frontend | Stripe.js → Backend (setup intent client secret) |
| Backend ↔ Stripe | REST API + webhooks |
| Backend ↔ PostgreSQL | Billing tables, ledger |
| CFO AI (via tools) | Read ledger, pause ads on `payment_failed` |
| Notification service | Payment failure alerts |

---

## 7. Shopify Integration

### Purpose

Commerce engine for AI-built stores: themes, products, collections, cart, checkout, and order capture.

### Integration model

| Aspect | Approach |
|--------|----------|
| Provisioning | Backend creates Shopify store or sub-shop via Partner API / clone template |
| Theme | Pre-built EmpireAI theme + AI-generated content injected via Admin API |
| Products | Synced from EmpireAI catalog after founder selection |
| Orders | Shopify webhook → Backend order service |
| Inventory | Supplier-driven; Shopify inventory API updated by Operations workers |
| Domain | `{slug}.myshopify.com` or custom domain (v2) |

### Shopify APIs used

| API | Purpose |
|-----|---------|
| Admin REST/GraphQL | Products, collections, pages, theme assets |
| Storefront API | Optional headless preview in dashboard |
| Webhooks | `orders/create`, `orders/paid`, `orders/fulfilled`, `app/uninstalled` |

### Data sync direction

```
EmpireAI Catalog  ──write──►  Shopify Products
Shopify Orders    ──webhook──►  EmpireAI Orders  ──►  Supplier fulfill
Supplier tracking ──write──►  Shopify Fulfillment API
```

### Communication

| Component | Interaction |
|-----------|-------------|
| Backend adapter ↔ Shopify | Admin API (rate-limited, queued) |
| Shopify ↔ Backend | Signed webhooks to `/webhooks/shopify` |
| Operations AI | Tools: `sync_product`, `update_theme`, `create_page` |
| Marketing AI | Tools: `update_product_copy`, `update_metafields` |
| Frontend | Preview links only (no Admin API) |
| End customers | Shopify storefront directly |

---

## 8. Supplier Integration

### Purpose

Source products, submit fulfillment orders, receive tracking, and monitor stock.

### Adapter architecture

Each supplier implements a common interface:

| Operation | Description |
|-----------|-------------|
| `search_catalog` | Category-scoped SKU discovery (PIE ingest) |
| `get_product` | Cost, variants, shipping, images |
| `check_stock` | Availability verification |
| `create_order` | Submit fulfillment on EmpireAI order |
| `get_tracking` | Poll or webhook for shipment status |

### Supported suppliers (v1 target)

| Supplier | Integration type |
|----------|------------------|
| CJ Dropshipping | REST API |
| Zendrop / Spocket-class | REST API |
| AliExpress partners | API or approved middleware |
| Manual fallback queue | CSV/email for edge cases |

### Fulfillment flow

```
Shopify order paid
  → Webhook → Backend order service
  → Worker → Supplier adapter.create_order
  → Supplier ships → tracking webhook/poll
  → Backend → Shopify fulfillment API
  → Notification → Founder dashboard + Support AI
```

### Communication

| Component | Interaction |
|-----------|-------------|
| PIE / Product Research AI | `search_catalog`, `get_product` during research |
| Operations AI | `create_order`, `check_stock`, swap supplier |
| Backend workers | Polling, retry, idempotency keys |
| Suppliers | HTTPS API + inbound webhooks where supported |
| PostgreSQL | `supplier_skus`, `fulfillments`, connection credentials |
| Orders dashboard | Read-only via backend API |

---

## 9. Advertising Integrations

### Purpose

Create, launch, and optimize paid campaigns on **Meta (Facebook + Instagram)**, **Google**, and **TikTok**. Read performance data for dashboard and analytics.

### Adapter architecture

Common interface per platform:

| Operation | Meta | Google | TikTok |
|-----------|------|--------|--------|
| OAuth connect | ✓ | ✓ | ✓ |
| Create campaign | ✓ | ✓ | ✓ |
| Upload creatives | ✓ | ✓ | ✓ |
| Set budget / bids | ✓ | ✓ | ✓ |
| Pull insights | ✓ | ✓ | ✓ |
| Pause / enable | ✓ | ✓ | ✓ |
| Conversion tracking | Pixel + CAPI | gtag + conversions API | TikTok Pixel |

### Account structure

| Platform | Provisioning |
|----------|--------------|
| **Meta** | EmpireAI Business Manager; per-store ad account or shared pool with naming convention |
| **Google** | EmpireAI MCC; per-store client account |
| **TikTok** | EmpireAI Business Center; per-store advertiser account |

Founder does not connect ad accounts manually in v1—provisioned during signup background process.

### Budget enforcement

```
Founder daily budget (PostgreSQL)
  → CFO AI / Billing module enforces cap
  → Advertising adapter sets platform budget
  → Insights polled hourly → ad_spend_ledger
  → Over-cap → pause campaigns via adapter
```

### Launch phasing

| Phase | Channels |
|-------|----------|
| v1 launch | Meta + Google (per FOUNDER_EXPERIENCE) |
| v1 architecture | TikTok adapter built; enabled per store via feature flag |

### Communication

| Component | Interaction |
|-----------|-------------|
| Advertising AI | Tools: `create_campaign`, `update_budget`, `pause_ad`, `get_insights` |
| Marketing AI | Provides creative assets → stored in S3 → adapter upload |
| CFO AI | Spend authorization gate before budget increases |
| Analytics AI | Ingests insights into rollups |
| Backend workers | Scheduled insight sync, creative fatigue detection |
| Meta / Google / TikTok | HTTPS Marketing APIs |
| Shopify | Conversion events via pixel + server-side API (deduped) |

---

## 10. Analytics

### Purpose

Aggregate operational, financial, and marketing data into dashboard KPIs, AI summaries, and PIE calibration feedback.

### Data sources

| Source | Events / metrics |
|--------|------------------|
| Shopify webhooks | Orders, revenue, refunds |
| Ad platform adapters | Spend, impressions, clicks, conversions, ROAS |
| Supplier adapters | Fulfillment time, success rate |
| Storefront (Shopify + pixel) | Traffic, product views (via Shopify Analytics or GA4) |
| Support system | Ticket volume, CSAT |
| AI activity log | Agent actions, outcomes |
| Backend application | Journey funnel, setup completion |

### Processing pipeline

```
External events / webhooks
  → Backend ingestion (validate, dedupe)
  → Raw events table (PostgreSQL, short retention)
  → Worker rollups (hourly, daily)
  → metrics_hourly / metrics_daily
  → Dashboard API + Analytics AI reads
```

### Communication

| Component | Interaction |
|-----------|-------------|
| Backend webhook router | Ingest from Shopify, Stripe, suppliers |
| Workers | Rollup jobs → PostgreSQL |
| Analytics AI | Read rollups; write digest to notification + CEO summary |
| Product Research AI | Read aggregate benchmarks (anonymized cross-tenant) |
| Frontend | Dashboard charts via `/dashboard/*` API |
| Object storage | Optional export CSV archives |

---

## 11. Notification System

### Purpose

Deliver email, in-app, and optional push alerts to founders for orders, billing, ads, and AI actions.

### Components

| Component | Role |
|-----------|------|
| **Notification service** (backend module) | Create, route, preference-check, enqueue |
| **Template engine** | Handlebars/React Email templates |
| **Email provider** | SendGrid / Postmark / SES |
| **Push provider** | FCM/APNs (v2) |
| **In-app feed** | PostgreSQL `notifications` + WebSocket push to frontend |
| **Digest scheduler** | Daily profit/ad summary cron |

### Notification types

| Type | Channel | Trigger |
|------|---------|---------|
| Setup progress | Email | Build complete |
| First order | Email + in-app | Shopify webhook |
| Daily profit digest | Email | Cron |
| Budget 80% | Email + in-app | Billing worker |
| Payment failed | Email + in-app | Stripe webhook |
| Supplier issue | In-app | Operations worker |
| AI significant action | In-app | Event bus |

### Communication

| Component | Interaction |
|-----------|-------------|
| All backend modules | Publish notification events (internal) |
| Notification service ↔ PostgreSQL | Persist, mark read |
| Notification service ↔ Email provider | HTTPS API |
| Notification service ↔ Redis pub/sub | Real-time to WebSocket gateway |
| Frontend | WebSocket + notification bell UI |
| CEO / Analytics AI | Generate digest content via tools |

---

## 12. File Storage

### Purpose

Store product images, ad creatives, brand assets, exports, and generated AI media.

### Provider

S3-compatible object storage (AWS S3, Cloudflare R2, or MinIO in dev).

### Bucket structure (logical)

| Prefix | Content |
|--------|---------|
| `stores/{store_id}/brand/` | Logos, mood boards |
| `stores/{store_id}/products/` | Product images (AI-generated + supplier) |
| `stores/{store_id}/creatives/` | Ad images and video |
| `stores/{store_id}/exports/` | CSV order exports |
| `platform/templates/` | Shopify theme templates |

### Access pattern

| Operation | Path |
|-----------|------|
| Upload | Backend generates presigned PUT URL → worker or tool uploads |
| Serve (public) | CDN in front of public product/creative assets |
| Serve (private) | Presigned GET URL from backend API |
| Shopify sync | Backend pushes public URLs to Shopify CDN or uploads to Shopify Files |

### Communication

| Component | Interaction |
|-----------|-------------|
| Backend / workers | S3 API upload, delete, list |
| Marketing / Image tools (AI) | Upload via backend presigned URLs |
| Shopify adapter | Reference CDN URLs in product media |
| Ad adapters | Upload creatives from S3 to platform media libraries |
| Frontend | CDN URLs for dashboard thumbnails; presigned for exports |
| CDN | Public asset edge cache |

---

## 13. Deployment Architecture

### Purpose

Run EmpireAI Commerce in development, staging, and production with reproducible builds, secrets management, and horizontal scaling.

### Environment tiers

| Environment | Purpose |
|-------------|---------|
| **Local** | Docker Compose: API, worker, Postgres, Redis, MinIO, mock adapters |
| **Staging** | Full integrations with sandbox/test ad and Shopify partner stores |
| **Production** | Multi-AZ, autoscaling, live integrations |

### Production topology

```
                         ┌──────────────┐
                         │  Cloudflare  │
                         │  DNS + WAF   │
                         └──────┬───────┘
                                │
              ┌─────────────────▼─────────────────┐
              │           Load Balancer            │
              └─────────┬───────────────┬─────────┘
                        │               │
           ┌────────────▼──┐    ┌───────▼────────┐
           │  Frontend pods │    │  Backend API    │
           │  (static/SSR)  │    │  pods (N replicas)│
           └────────────────┘    └───────┬─────────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              │                          │                          │
     ┌────────▼────────┐       ┌─────────▼────────┐       ┌────────▼────────┐
     │ Worker pods     │       │ AI orchestration │       │ WebSocket pods  │
     │ (job consumers) │       │ pods             │       │ (optional)      │
     └────────┬────────┘       └─────────┬────────┘       └────────┬────────┘
              │                          │                          │
              └──────────────────────────┼──────────────────────────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              │              │           │           │              │
     ┌────────▼────┐  ┌──────▼─────┐ ┌───▼───┐  ┌────▼────┐  ┌─────▼─────┐
     │ PostgreSQL  │  │   Redis    │ │  S3   │  │ Secrets │  │ Observability│
     │ (managed)   │  │ (managed)  │ │ + CDN │  │ Manager │  │ (logs/metrics)│
     └─────────────┘  └────────────┘ └───────┘  └─────────┘  └────────────┘
```

### Container images

| Image | Source |
|-------|--------|
| `empireai-frontend` | `frontend/` |
| `empireai-api` | `backend/` |
| `empireai-worker` | `backend/workers` |
| `empireai-ai-orchestrator` | `ai-agents/` + runtime |

### CI/CD pipeline

| Stage | Action |
|-------|--------|
| Build | Docker build on merge to main |
| Test | Unit, integration, contract tests |
| Migrate | `database/migrations` against staging DB |
| Deploy staging | Auto deploy |
| Deploy production | Manual approval gate |
| Rollback | Previous image tag + migration down if needed |

### Secrets and config

| Secret | Storage |
|--------|---------|
| Database credentials | Secrets manager |
| Stripe keys | Secrets manager |
| Shopify Partner token | Secrets manager |
| Meta / Google / TikTok app secrets | Secrets manager |
| Supplier API keys | Secrets manager |
| LLM API keys | Secrets manager |
| JWT signing keys | Secrets manager |
| Per-store OAuth tokens | PostgreSQL encrypted + KMS |

### Communication (infra)

| From | To | Notes |
|------|-----|-------|
| Internet | CDN / LB | TLS termination |
| API pods | PostgreSQL, Redis | Private VPC |
| Worker pods | Same as API | Shared network |
| AI pods | Backend internal API | mTLS, no public ingress |
| All pods | Secrets manager | Boot-time injection |
| All pods | Observability | OpenTelemetry export |

---

## Master Communication Matrix

Rows = source, columns = destination. **●** = direct communication, **○** = indirect (via intermediary), **—** = no communication.

| From ↓ / To → | Frontend | Backend | PostgreSQL | Redis | S3 | Workers | AI Orch | Shopify | Suppliers | Meta | Google | TikTok | Stripe | Email | CDN | LLM |
|---------------|:--------:|:-------:|:----------:|:-----:|:--:|:-------:|:-------:|:-------:|:---------:|:----:|:------:|:------:|:------:|:-----:|:---:|:---:|
| **Frontend** | — | ● | — | — | ○ | — | — | ○ | — | — | — | — | ○ | — | ● | — |
| **Backend** | ● | — | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ○ | — |
| **PostgreSQL** | — | ○ | — | — | — | ○ | — | — | — | — | — | — | — | — | — | — |
| **Redis** | ○ | ○ | — | — | — | ○ | ● | — | — | — | — | — | — | — | — | — |
| **Workers** | — | ○ | ● | ● | ● | — | ○ | ● | ● | ● | ● | ● | ● | ● | — | — |
| **AI Orch** | — | ● | — | ● | ○ | — | — | — | — | — | — | — | — | — | — | ● |
| **Shopify** | ● | ● | — | — | — | — | — | — | — | — | — | — | ○ | — | ● | — |
| **Suppliers** | — | ● | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **Meta/Google/TikTok** | — | ● | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **Stripe** | ○ | ● | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **End customer** | — | — | — | — | — | — | — | ● | — | — | — | — | ○ | — | ● | — |

**Legend:** Frontend → Stripe = Stripe.js only. Frontend → Shopify = storefront browse. Backend → CDN = asset URL generation.

---

## Component Communication Details

### Frontend ↔ Backend

| Channel | Data |
|---------|------|
| REST API | Setup steps, dashboard aggregates, settings, billing |
| WebSocket | Build progress, new orders, notifications, AI activity |
| Cookies | Session ID |

### Backend ↔ AI Orchestration

| Direction | Mechanism | Examples |
|-----------|-----------|----------|
| Backend → AI | Event publish + workflow trigger | `category_selected`, `order_paid` |
| AI → Backend | Tool HTTP calls | `research_products`, `launch_ads` |
| AI → Backend | Completion webhooks | `workflow_complete`, `agent_run_failed` |

### Backend ↔ Shopify

| Direction | Mechanism |
|-----------|-----------|
| EmpireAI → Shopify | Admin API jobs (queued, rate-limited) |
| Shopify → EmpireAI | Signed webhooks |

### Backend ↔ Suppliers

| Direction | Mechanism |
|-----------|-----------|
| EmpireAI → Supplier | REST fulfill, stock check |
| Supplier → EmpireAI | Webhooks (tracking) or poll |

### Backend ↔ Ad platforms

| Direction | Mechanism |
|-----------|-----------|
| EmpireAI → Ads | Campaign CRUD, creative upload, insights pull |
| Ads → EmpireAI | OAuth callbacks; optional conversion webhooks |

### AI Orchestration ↔ External (indirect)

AI never calls Shopify, suppliers, or ads directly. All paths:

```
AI Orchestration → Backend tool → Adapter → External API
```

---

## Critical End-to-End Flows

### Flow A: Founder setup → live store

```
Frontend (setup wizard)
  → Backend setup API (state machine)
  → AI Orchestration (PIE workflow)
  → Backend tools → Supplier APIs (research)
  → PostgreSQL (research results)
  → Frontend (product picker)

Frontend (product + brand confirm)
  → AI Orchestration (build workflow)
  → Backend → S3 (assets)
  → Backend → Shopify Admin API (store, theme, products)
  → Backend → Supplier APIs (link SKUs)
  → WebSocket → Frontend (progress)

Frontend (budget + launch)
  → Backend billing → Stripe (payment method)
  → AI Orchestration (launch workflow)
  → Backend → Meta / Google / TikTok APIs
  → PostgreSQL (campaigns)
  → Frontend redirect → Dashboard
```

### Flow B: Customer order → fulfillment

```
Customer → Shopify checkout → payment
  → Shopify webhook → Backend webhook router
  → PostgreSQL (order)
  → Worker → Supplier adapter (create_order)
  → Supplier API → fulfillment
  → Supplier webhook/poll → tracking
  → Backend → Shopify fulfillment API
  → WebSocket + Notification → Frontend
  → Event → AI Orchestration (Ops AI log, Analytics rollup)
```

### Flow C: Daily optimization loop

```
Cron → AI Orchestration (daily workflow)
  → Backend tools → Ad adapters (pull insights)
  → PostgreSQL (metrics rollups)
  → Analytics AI (summarize)
  → Advertising AI (pause/scale decisions via tools)
  → Backend → Ad adapters (apply changes)
  → Notification service → Email digest
  → Frontend (dashboard updated on next load / WebSocket)
```

---

## Security Architecture

| Layer | Control |
|-------|---------|
| Transport | TLS 1.2+ everywhere external |
| Authentication | Session cookies; HttpOnly, Secure, SameSite |
| Authorization | Workspace-scoped RBAC; store-level for integrations |
| Secrets | KMS + encrypted columns; no secrets in logs |
| Webhooks | HMAC verification, timestamp tolerance, idempotency keys |
| AI tools | Service JWT, store-scoped, audit every invocation |
| Rate limiting | Redis sliding window per IP and per user |
| PII | Customer email masked in dashboard list; full in order detail with audit |
| Compliance | GDPR delete propagates to Shopify, Stripe, PostgreSQL |

---

## Observability

| Signal | Tooling (target) |
|--------|------------------|
| Logs | Structured JSON → centralized log store |
| Metrics | Prometheus-compatible; RED metrics per service |
| Traces | OpenTelemetry across API → worker → adapter |
| Alerts | PagerDuty on payment failures, webhook backlog, AI run failure rate |
| Dashboards | Grafana: API latency, queue depth, ad sync lag, PIE duration |

---

## Scalability Notes (v1 → v2)

| Bottleneck | v1 | v2 path |
|------------|-----|---------|
| API monolith | Single deploy, horizontal pods | Extract integration service |
| PIE research | Sync with 30s target | Dedicated research worker pool |
| Shopify rate limits | Central queue + backoff | Per-store queue sharding |
| AI orchestration | Shared runtime | Per-tenant concurrency limits |
| Analytics | PostgreSQL rollups | ClickHouse or BigQuery export |

---

## Repository to Runtime Mapping

| Repo folder | Runtime artifact |
|-------------|------------------|
| `frontend/` | Frontend container / static host |
| `backend/` | API + worker containers |
| `ai-agents/` | Orchestrator container (agent defs mounted as config) |
| `database/migrations/` | Migration job in CI/CD |
| `api/openapi/` | Contract tests, SDK generation |
| `deployment/docker/` | Compose for local |
| `deployment/kubernetes/` | Production manifests |
| `deployment/infrastructure/` | Terraform: VPC, RDS, Redis, S3, IAM |

---

## Related Documents

- [AI_EMPLOYEES.md](./AI_EMPLOYEES.md) — AI orchestration behavior and event bus
- [PRODUCT_INTELLIGENCE_ENGINE.md](./PRODUCT_INTELLIGENCE_ENGINE.md) — PIE data sources and scoring
- [FOUNDER_EXPERIENCE.md](./FOUNDER_EXPERIENCE.md) — User-facing flows driving architecture
- [NAVIGATION.md](./NAVIGATION.md) — Frontend routes
- [Documentation index](./README.md)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-06-21 | Initial system architecture specification |
