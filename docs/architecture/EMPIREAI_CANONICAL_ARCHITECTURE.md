# EmpireAI Canonical Architecture

> **Classification:** CANONICAL — Tier 5 Normative Architecture (Target Structure)  
> **Document ID:** REAL-078 · subordinate to **Architecture Law** (P2-05)  
> **Architecture Law:** [`EMPIREAI_ARCHITECTURE_LAW.md`](./EMPIREAI_ARCHITECTURE_LAW.md) (P2-05) — lifecycle · drift · acceptance  
> **Constraints:** [`EMPIREAI_ARCHITECTURE_CONSTRAINTS_ACD.md`](../../EMPIREAI_ARCHITECTURE_CONSTRAINTS_ACD.md) (ACD-001→030)  
> **Owner:** Chief Architect  
> **Status:** Official target architecture (normative) — **not** implementation snapshot  
> **Version:** 1.0  
> **Audience:** Founders, engineering, product, operations  

This document defines the architecture EmpireAI **should** follow. **Operational current state:** [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md). EmpireAI is an **AI-powered e-commerce operating system** whose first commercial model is **global dropshipping**. It is derived from the hierarchy audit (REAL-076/077) and production gap analysis (REAL-077), and supersedes ad-hoc folder layout as the source of truth for future REAL missions.

**Commercial Risk Intelligence (CRI)** is a permanent cross-cutting capability — see §3.7A and `docs/governance/COMMERCIAL_RISK_INTELLIGENCE_DOCTRINE.md`.

---

## 1. Architecture Principles

1. **Pillow owns all technical subsystems** — Pillow is the sole technical owner of EmpireAI. Brain, EKLS, Executive AI Engines, Business Engines, Grand King Cockpit, Registry, Mission System, Executive Audit System, Guardian, and future platform services are Pillow-owned. Brain is **not** a peer of Pillow. See `EMPIREAI_PILLOW_CONSTITUTION.md` §17.
2. **Single Brain execution path, many surfaces** — All autonomous action flows through the Brain orchestrator (a Pillow-owned subsystem). No frontend calls LLMs or external APIs directly.
3. **One canonical owner per capability** — Each business capability has exactly one owning Pillow subsystem. Duplicates are deprecated, not extended.
4. **Cockpit is the executive shell** — Grand King Cockpit (Pillow-owned) is how founders operate; it visualises and approves — it is never the source of truth for knowledge or configuration.
5. **Live data over seed data** — Domain views read from ledger and connector-backed tables in production; seed data is dev/demo only.
6. **Integration at the connector boundary** — External systems connect through Connectors + Reality Integration, not scattered per module.
7. **Foundation governs; Runtime advises** — Governance and policy live in Foundation. Runtime modules produce dashboards and recommendations only unless explicitly promoted to Commerce or Intelligence.
8. **Survival over speculative profit** — Commercial Risk Intelligence (CRI) gates future product launches; survivability takes precedence over upside when refund/dispute structures can cause systematic loss (CRI-001, ADR-051).

---

## 2. Canonical Platform Hierarchy

**Normative authority:** `EMPIREAI_PILLOW_CONSTITUTION.md` §17 · `CANONICAL_EKLS_SPECIFICATION.md`

```
Grand King
    │
EmpireAI
    │
Pillow                          ← sole technical owner
    │
    ├── Brain                     ← orchestration execution (not a peer of Pillow)
    ├── EKLS
    ├── Registry System
    ├── Mission System
    ├── Executive Audit System
    ├── Guardian
    ├── Executive AI Engines
    │     ├── Product Intelligence
    │     ├── Market Intelligence
    │     ├── Supplier Intelligence
    │     ├── Financial Intelligence
    │     ├── Quantitative Intelligence
    │     ├── Advertising Intelligence
    │     ├── Customer Intelligence
    │     ├── Risk Intelligence
    │     ├── Decision Intelligence
    │     └── Executive Intelligence Orchestrator
    ├── Business Engines
    │     ├── Marketplace Engine
    │     ├── Supplier Engine
    │     ├── Storefront Engine
    │     ├── Advertising Engine
    │     ├── Payment Engine
    │     ├── Logistics Engine
    │     └── Analytics Engine
    ├── Grand King Cockpit
    └── Future Platform Services
```

### 2.1 Functional domain mapping (implementation layout)

Repository folders for Commerce, Intelligence, Foundation, Connectors, and Infrastructure **implement** Pillow-owned subsystems above. They are not parallel authorities to Pillow.

| Functional domain | Maps to Pillow-owned subsystems |
|-------------------|--------------------------------|
| Executive Layer (auth, roles) | Brain → Auth (Pillow-owned) |
| Grand King Cockpit | Grand King Cockpit |
| Brain / AI Workforce | Brain |
| Pillow runtime | Pillow (governance + host) |
| Intelligence (G3 suite) | Executive AI Engines |
| Commerce / execution | Business Engines |
| EKLS / memory | EKLS |
| Guardian | Guardian |
| Foundation / governance docs | Pillow governance artifacts |
| Connectors | Business Engine + Brain integration boundary |
| Deployment / Infrastructure | Pillow-owned platform services |

---

## 3. Subsystem Definitions

### 3.1 Executive Layer

| Field | Definition |
|-------|------------|
| **Purpose** | Define who may act, at what authority level, and over which workspace/company scope. |
| **Owner** | Pillow (Auth subsystem under Brain) |
| **Responsibilities** | Roles (founder, admin, operator); session lifecycle; module access matrix; founder approval gates (L3/L4); audit identity on every dispatch. |
| **Parent** | Pillow → Brain |
| **Children** | Auth service, Permissions registry, Session store, Approval tokens |
| **Dependencies** | Brain (middleware), Redis (sessions), SQLite (users) |
| **Future growth rules** | New roles require updates to `permissions.ts` and Cockpit nav filters. No module may implement its own auth. OAuth/2FA extend Auth only. |

**Canonical mapping (current → target):**

| Target | Current location |
|--------|------------------|
| Auth service | `backend/src/auth/` |
| Permissions | `backend/src/auth/permissions.ts` |
| Platform middleware | `empireai-web/middleware.ts` (must validate session server-side) |

---

### 3.2 Grand King Cockpit

> **Canonical Cockpit Architecture (P3-03):** [`EMPIREAI_COCKPIT_ARCHITECTURE.md`](./EMPIREAI_COCKPIT_ARCHITECTURE.md) — Executive Operating System.

| Field | Definition |
|-------|------------|
| **Purpose** | The Executive Operating System — single shell for founder decisions, portfolio view, and department navigation. Visualises Pillow-owned subsystems; never owns knowledge or configuration. |
| **Owner** | Pillow |
| **Responsibilities** | Department layout, KPI surfaces, notifications, global assistant entry, approval queue, live vs demo data labeling. |
| **Parent** | Pillow |
| **Children** | 9 departments (see `PROJECT_COCKPIT_SPECIFICATION.md`), Platform shell, Notification center, Global Assistant panel |
| **Dependencies** | Brain dispatch, Brain REST, Pillow host, Global Notifications |
| **Future growth rules** | New screens must declare a Cockpit department. No third production frontend surface. `frontend/` = executive depth; `empireai-web/` = platform modules — both render inside Cockpit chrome by V2. |

**Canonical mapping:**

| Target | Current location |
|--------|------------------|
| Executive Cockpit (deep ops) | `frontend/src/pages/dashboard/*` |
| Platform modules (12) | `empireai-web/app/(platform)/` |
| Cockpit package (future) | Not yet a folder — consolidate under `cockpit/` or unified app |

---

### 3.3 Brain

> **Canonical Brain Architecture (P3-01):** [`EMPIREAI_BRAIN_ARCHITECTURE.md`](./EMPIREAI_BRAIN_ARCHITECTURE.md) — permanent execution engine documentation.

| Field | Definition |
|-------|------------|
| **Purpose** | Orchestration execution kernel — the mandatory dispatch path for tools, agents, and workflows. Pillow-owned; not a peer of Pillow. |
| **Owner** | Pillow |
| **Responsibilities** | `POST /brain/dispatch`, SSE events, Guardian pre-checks, Orchestrator routing, Tool registry, Workflow engine, Task queue, Audit log, LLM router, session memory (ephemeral — long-term memory via EKLS). |
| **Parent** | Pillow |
| **Children** | Orchestrator, Agent Manager, Workflow Engine, Task Queue, Guardian, Tool Registry, Event Bus, Database layer, Contract layer |
| **Dependencies** | Redis (queue, sessions, pub/sub), SQLite/Postgres (domain + audit), Anthropic (LLM) |
| **Future growth rules** | New capabilities register as tools + module routes, not new HTTP surfaces unless REST is required for non-dispatch clients. Max one dispatch entry point per frontend. |

**Canonical mapping:**

| Target | Current location |
|--------|------------------|
| Brain core | `backend/src/brain/` |
| Dispatch routes | `backend/src/agents/routes/module-routes.ts` |
| App registration | `backend/src/app.ts` |

---

### 3.4 Pillow

> **Canonical Pillow Architecture (P3-02):** [`EMPIREAI_PILLOW_ARCHITECTURE.md`](./EMPIREAI_PILLOW_ARCHITECTURE.md) — constitutional operating intelligence.

| Field | Definition |
|-------|------------|
| **Purpose** | Sole technical owner of EmpireAI — Executive Intelligence, EKLS governance, Cursor bridge, approval gate, and ownership of all technical subsystems. |
| **Owner** | Pillow |
| **Responsibilities** | Session chat (stream), workspace screen context, approval queue for Cursor missions, executive learning review, executive council debate (Pillow-scoped), **EKLS knowledge/memory/learning governance**, ownership of Brain, Cockpit, engines, Guardian, Registry, Mission System, Executive Audit System. |
| **Parent** | EmpireAI |
| **Children** | Pillow package (library), Pillow Host (Brain routes), Pillow Approval, Pillow Executive Council, Executive Learning, **EKLS** (`backend/src/orchestration/pillow/ekls/`) |
| **Dependencies** | Brain LLM adapter, OpenAI (Pillow package), Auth (pillowAuth or session) |
| **Future growth rules** | Pillow package remains library; Brain hosts HTTP. No duplicate council implementations — Brain `executive-council/` is runtime; Pillow council is companion-scoped. |

**Canonical mapping:**

| Target | Current location |
|--------|------------------|
| Pillow library | `pillow/src/` |
| Pillow host | `backend/src/orchestration/pillow-host/` |
| Approval gate | `backend/src/orchestration/pillow-approval/` |
| Frontend embed | `frontend/src/components/pillow/` |

---

### 3.4A Builder

> **Canonical Builder Architecture (P3-04):** [`EMPIREAI_BUILDER_ARCHITECTURE.md`](./EMPIREAI_BUILDER_ARCHITECTURE.md) — constitutional engineering execution engine.

| Field | Definition |
|-------|------------|
| **Purpose** | Converts approved constitutional intent into validated implementation — mission execution, repository modification, tests, evidence, deployment preparation. |
| **Owner** | Grand King (mission scope) · Pillow (supervision governance) |
| **Responsibilities** | Vision Synchronization → implementation pipeline · `.cursor/missions/` artifacts · Cursor Bridge handoff · Supervisor telemetry · Repository Acceptance evidence · Lessons Learned. |
| **Parent** | Pillow |
| **Children** | Cursor IDE worker · Cursor Bridge · Supervisor lifecycle · Approval Gate persistence |
| **Dependencies** | Engineering Constitution §8–§9 · Supervisor Governance · Cursor Output Standard · Recovery Doctrine |
| **Future growth rules** | No autonomous scope expansion · no production deploy without authorization · all missions through approval gate. Builder modifies Brain; Builder ≠ Brain. |

**Canonical mapping:**

| Target | Current location |
|--------|------------------|
| Cursor Bridge | `pillow/src/cursor-bridge/` |
| Supervisor | `pillow/src/supervisor/` |
| Mission queue | `.cursor/missions/pending/` |
| Approval persistence | `backend/src/orchestration/pillow-approval/` |

---

### 3.5 AI Workforce

| Field | Definition |
|-------|------------|
| **Purpose** | Named autonomous agents with tools, authority levels, and module ownership. |
| **Owner** | Pillow (via Brain) |
| **Responsibilities** | 12 canonical agents (Victoria, Morgan, Jordan, Alex, Quinn, Casey, Riley, Taylor, Blake, Sam, Nova, Avery, Sentinel); tool binding; workflow triggers; founder approval for L3+. |
| **Parent** | Pillow → Brain |
| **Children** | Agent definitions, Module tools, Workflows, Execution bridges (order, store) |
| **Dependencies** | Tool registry, LLM providers, Guardian authority checks |
| **Future growth rules** | New agent = one definition + tools + module route + Cockpit department assignment. No agent without registered tools. `ai-agents/` repo folder is documentation only; definitions live in `backend/src/agents/definitions/`. |

**Canonical agent roster:**

| Agent ID | Name | Department | Authority |
|----------|------|------------|-----------|
| ai-ceo | Victoria | Executive Command | L2 |
| founder-dashboard | Avery | Executive Command | L0 |
| product-intelligence | Morgan | Intelligence | L0 |
| product-scout | Jordan | Intelligence | L0 |
| supplier-network | Alex | Commerce / Operations | L1 |
| supplier-intelligence | Quinn | Intelligence | L0 |
| store-builder | Casey | Commerce | L1 |
| marketing-ai | Riley | Commerce | L1 |
| ad-manager | Taylor | Commerce | L3 |
| finance-analyst | Blake | Finance | L0 |
| order-ops | Sam | Operations | L0 |
| support-ai | Nova | Operations | L1 |
| admin-console | Sentinel | Infrastructure | L0 |

---

### 3.6 Business Engines

| Field | Definition |
|-------|------------|
| **Purpose** | End-to-end venture lifecycle: discover → manufacture → deploy → sell → fulfill → record profit. Implemented as Marketplace, Supplier, Storefront, Advertising, Payment, Logistics, and Analytics engines under Pillow. |
| **Owner** | Pillow |
| **Responsibilities** | Company manufacturing, store generation, Vercel deploy, Stripe checkout, CJ fulfillment, order pipeline, revenue loop, Grand King automation, product publishing, Meta ads execution. **Future launches:** require CRIR commercial risk certification at READINESS gate (documentation; runtime enforcement deferred). |
| **Parent** | Pillow |
| **Children** | Manufacturing, Store Builder, Deployment, Payments, Fulfillment, Orders, Revenue Loop, Grand King, Ads Execution, Catalog Publishing |
| **Dependencies** | Intelligence (product selection), Connectors (Stripe, CJ, Meta, Vercel), Brain dispatch, SQLite ledger |
| **Future growth rules** | Consolidate scattered folders under canonical `commerce/` namespace over time. One revenue path: payment → pipeline → fulfillment → ledger. Sandbox tools (`*_sandbox_only`, `mock=1`) forbidden in production env. |

**Canonical mapping (current scattered → target tree):**

```
Commerce (target)
├── manufacture/     ← execution/autonomous-company-manufacturing-loop, agents/store
├── storefront/      ← execution/store-*, project-materialization
├── deploy/          ← execution/production-store-deployment, production-deploy tools
├── payments/        ← revenue/live-payment-engine
├── orders/          ← revenue/customer-order-pipeline, orders/, agents/order-execution-bridge
├── fulfillment/     ← execution/live-cj-fulfillment, fulfillment/
├── revenue/         ← revenue/minimum-live-revenue-loop, grand-kings-revenue-engine
├── grand-king/      ← grand-king/, grand-king-revenue-pipeline/
├── ads/             ← execution/meta-ads-connector
└── publishing/      ← execution/product-publishing-engine
```

---

### 3.6A Commerce Architecture (P3-05)

> **Canonical Commerce Architecture (P3-05):** [`EMPIREAI_COMMERCE_ARCHITECTURE.md`](./EMPIREAI_COMMERCE_ARCHITECTURE.md) — constitutional business operating layer.

| Field | Definition |
|-------|------------|
| **Purpose** | Manufacture, operate, monitor, and continuously improve businesses — Business Factory through replication under Grand King-first governance. |
| **Owner** | Pillow (stewardship) · Grand King (irreversible commercial authority) |
| **Responsibilities** | Business Factory · product/supplier/marketplace/marketing/financial domains · CRIR gates · revenue loop · portfolio expansion path. |
| **Parent** | Pillow |
| **Children** | Business Engines (§3.6) · Executive AI Engines (§3.7) · G2 integration fabric · Commerce Canon (C001) · COS kernels |
| **Dependencies** | CTD · CBD · CRI · Brain dispatch · Registry REG-* · Production Truth |
| **Future growth rules** | One Commerce architecture — C001/COS/G2 are companions, not competitors. Consolidate scattered modules under `commerce/` namespace. |

**Companion docs:** [`EMPIREAI_COMMERCE_CANON.md`](../../EMPIREAI_COMMERCE_CANON.md) (lifecycle) · [`COMMERCE_OS_BLUEPRINT.md`](../../COMMERCE_OS_BLUEPRINT.md) (kernels) · [`artifacts/g2-infrastructure-commerce-architecture.md`](../../artifacts/g2-infrastructure-commerce-architecture.md) (fabric)

---

### 3.7 Executive AI Engines

| Field | Definition |
|-------|------------|
| **Purpose** | Signal ingestion, scoring, and recommendations for products, suppliers, markets, buyers, finance, risk, and executive decisions. G3 suite (G3-01–G3-10) under Pillow. |
| **Owner** | Pillow |
| **Responsibilities** | Product, Market, Supplier, Financial, Quantitative, Advertising, Customer, Risk, and Decision Intelligence engines; Executive Intelligence Orchestrator (G3-10). **CRI feed:** continuous supplier + marketplace policy, fee, refund, dispute, shipping, regional restriction, pricing/arbitrage, and commercial risk analysis for CRIR sections 1–2, 5–7. |
| **Parent** | Pillow |
| **Children** | Product Intelligence Engine, Supplier Intelligence Engine, Product Scout, Eye Series, Commerce Intelligence Core, Scoring engines, Knowledge graph |
| **Dependencies** | Connectors (Amazon, Trends, CJ catalog), SQLite catalog tables, Brain contract layer |
| **Future growth rules** | Live connector data replaces mock providers in production. One scoring pipeline (PIE) — runtime `live-product-intelligence` consumes PIE, does not duplicate it. Intelligence outputs feed Commerce manufacture gate. |

**Canonical mapping:**

| Target | Current location |
|--------|------------------|
| PIE | `backend/src/intelligence/product-intelligence-engine/` |
| SIE | `backend/src/intelligence/supplier-intelligence-engine/` |
| Eye | `backend/src/eye/` |
| CIC | `backend/src/intelligence/commerce-intelligence-core/` |

---

### 3.7A Commercial Risk Intelligence (CRI)

| Field | Definition |
|-------|------------|
| **Purpose** | Permanent platform capability for continuous commercial risk analysis across **suppliers** and **marketplaces**; pre-launch **Commercial Risk Intelligence Reports (CRIR)** and commercial risk certification before product launch. |
| **Owner** | Pillow (cross-cutting governance capability) |
| **Responsibilities** | Dual-domain intelligence (supplier capabilities, marketplace policies, fees, refunds, disputes, shipping, restrictions, pricing/arbitrage, commercial risks); CRIR production; Finance sign-off on exposure; Governance certification audit trail; survivability assessment (CRI-001). |
| **Parent** | Pillow → Executive AI Engines / Business Engines |
| **Children** | CRIR artifacts (repository), policy intelligence feeds (future runtime), finance exposure models (future runtime) |
| **Dependencies** | Intelligence (SIE, marketplace intel), Finance (margin/exposure), Governance (`empire-governance`), Commerce Canon READINESS |
| **Future growth rules** | Documentation-first in this phase. Runtime enforcement in `commerce-readiness-engine` and Cockpit Governance deferred to future REAL missions. Never bypass CBD-018 triple approval chain. |

**Canonical doctrine:** `docs/governance/COMMERCIAL_RISK_INTELLIGENCE_DOCTRINE.md` · `docs/governance/COMMERCIAL_RISK_INTELLIGENCE_REPORT_SPECIFICATION.md` · ADR-051

---

### 3.8 Foundation

| Field | Definition |
|-------|------------|
| **Purpose** | Long-lived governance, identity, doctrine, and strategic memory — the constitution of the empire. |
| **Parent** | Pillow |
| **Owner** | Pillow (governance artifacts) |
| **Responsibilities** | Soul file, doctrines, policies, promise register, decision registry, strategic memory, KPI engine (governance), identity registry, empire governance engine (Guardian integration). |
| **Children** | Soul, Doctrine, Policy, Promise, Decision, Strategic Memory, KPI (governance), Identity, Governance engine, Constitution doctypes |
| **Dependencies** | SQLite governance tables, Guardian, Brain audit |
| **Future growth rules** | Foundation REST routes are secondary to dispatch for founder UX. New governance rules go through `empire-governance` assess before new autonomous actions. Certification doctypes (constitution, UX doctrine) are read-only in production. |

**Canonical mapping:** `backend/src/foundation/` (15 subsystems)

---

### 3.9 Runtime

| Field | Definition |
|-------|------------|
| **Purpose** | Advisory dashboards, certification artifacts, and ops visibility — **not** primary execution paths. |
| **Owner** | Pillow |
| **Responsibilities** | Tiered dashboard modules; V1 certification reviews; command-center visualizations; health endpoints for ops. |
| **Parent** | Pillow → Grand King Cockpit (advisory surfaces) |
| **Children** | Tier A (wired to Cockpit), Tier B (certification), Tier C (archive/candidate removal) |
| **Dependencies** | Seed/computed data, Brain registration, optional SQLite |
| **Future growth rules** | **No new Runtime module without Cockpit department + frontend binding documented in ESIS.** Default pattern `dashboard + health` alone is insufficient for promotion. 100 current modules collapse to ~15 Tier A, ~20 Tier B, remainder Tier C. |

**Runtime tiers (canonical):**

| Tier | Purpose | Examples |
|------|---------|----------|
| **A — Wired** | Linked from Cockpit or frontend REST | global-operational-command-center, success-001-command-center, unified-grand-king-headquarters |
| **B — Certification** | V1 lifecycle evidence | version-1-readiness-audit, version-1-executive-sign-off |
| **C — Archive** | No UI, no dispatch use | Duplicates of Intelligence/Commerce dashboards |

---

### 3.10 Infrastructure

> **Canonical Infrastructure Architecture (P3-06):** [`EMPIREAI_INFRASTRUCTURE_ARCHITECTURE.md`](./EMPIREAI_INFRASTRUCTURE_ARCHITECTURE.md) — operational foundation · V1 current · target · environments.

| Field | Definition |
|-------|------------|
| **Purpose** | Cross-cutting platform services — config, persistence, observability, cost, retention. |
| **Owner** | Pillow (Future Platform Services) |
| **Responsibilities** | Env validation, Redis client, logging, observability, cost dependencies, database migrations (target: Postgres), Guardian health probes, ESIS repo scanner. |
| **Parent** | Pillow |
| **Children** | Config, Database, Observability, Cost, Retention, Validation/tests, Guardian health |
| **Dependencies** | Railway, Vercel, Redis, future Postgres |
| **Future growth rules** | Schema migrations move from `brain/database.ts` inline to `database/migrations/`. All production secrets via env + credential vault only. |

---

### 3.11 Connectors

| Field | Definition |
|-------|------------|
| **Purpose** | Unified external provider boundary — catalog, connection state, live invocation. |
| **Owner** | Pillow (Business Engine integration boundary) |
| **Responsibilities** | 22-provider catalog; connection repository; Reality Integration vault; live vs stub selection; OAuth flows; webhook ingestion. |
| **Parent** | Pillow → Business Engines / Brain |
| **Children** | Catalog, Registry, Mock providers (dev only), Live implementations (Stripe, CJ, Meta, Amazon, GA4), Reality Integration |
| **Dependencies** | Credential vault, `LIVE_COMMERCE_INTEGRATION_MODE`, env keys |
| **Future growth rules** | One live implementation per catalog ID. Stubs (`mock-providers.ts`) disabled when `production` mode. New provider = catalog entry + live adapter + Cockpit Integrations UI + readiness gate. |

---

### 3.12 Deployment

> **Deploy companion:** [`deployment/MANAGED_DEPLOYMENT.md`](../../deployment/MANAGED_DEPLOYMENT.md) · **Architecture:** P3-06 §6–§8.

| Field | Definition |
|-------|------------|
| **Purpose** | How EmpireAI runs in production — Brain on Railway, frontends on Vercel, optional Pillow host. |
| **Owner** | Pillow (Future Platform Services) |
| **Responsibilities** | `deployment/` docs; env templates; Railway Brain; Vercel `empireai-web` + root `frontend`; `BRAIN_API_URL`, `VITE_API_BASE_URL`; Redis; standalone Next output. |
| **Parent** | Pillow |
| **Children** | Railway (Brain), Vercel (frontends), Docker/K8s (future), CI (automation/) |
| **Dependencies** | Infrastructure config |
| **Future growth rules** | Every frontend must document required env vars in `.env.example`. Post-deploy smoke: auth, dispatch load, health. No frontend defaulting to `window.location.origin` for API. |

---

## 4. Control Flow (Canonical)

```
Founder
  → Project Cockpit (department UI)
    → BFF (/api/*) or REST (frontend/api/*)
      → Brain Auth + Guardian
        → Orchestrator (module:action)
          → Tool | Agent | Workflow
            → Connectors | Domain DB | LLM
              → Audit + SSE Event
                → Cockpit KPI update
```

**Forbidden paths:**

- Frontend → LLM provider directly  
- Frontend → Stripe/CJ/Meta directly  
- New HTTP route without Brain registration or ESIS entry  
- Runtime dashboard as sole implementation of a commerce action  

---

## 5. Data Architecture (Canonical)

| Layer | Technology (target) | Owner |
|-------|---------------------|-------|
| Domain + ledger | Postgres (migrate from sql.js) | Brain / Domain |
| Sessions + queue | Redis | Infrastructure |
| Credential secrets | Reality Integration vault | Connectors |
| Artifacts / codegen | Object storage (future S3/R2) | Commerce |
| Audit | Append-only audit_logs | Brain |

**Canonical domain entities:** Workspace, Company, BuildStage, Order, Product, Supplier, Campaign, AdChannel, Ticket, LedgerEvent, Payment, Pipeline, Fulfillment.

---

## 6. Frontend Architecture (Canonical)

| Surface | Role | API pattern |
|---------|------|-------------|
| **Cockpit shell** | Navigation, KPIs, notifications, approvals | Mixed |
| **Platform modules** | 12 founder modules (dashboard, store, orders, …) | Brain dispatch |
| **Executive depth pages** | Discovery, Grand King, council, integrations | Brain REST + dispatch |
| **Marketing** | Acquisition only | Static |

**Merge target (V2):** Single Next.js app with Cockpit shell wrapping all departments; Vite frontend pages migrate into route groups.

---

## 7. Relationship to Current Repository

| Canonical layer | Current state | Gap |
|-----------------|---------------|-----|
| Cockpit | Distributed across `frontend/` + `empireai-web/` | No unified package |
| Commerce | 6+ top-level backend folders | Needs namespace consolidation |
| Runtime | 100 modules, ~85% unwired | Tier and archive |
| Connectors | Stubs default | Production live adapters |
| Database | sql.js SQLite | Postgres migration |
| Executive Layer | Cookie presence middleware on Next | Server-side session validation |

---

## 8. REAL Mission Alignment

Future REAL missions must declare:

1. **Canonical subsystem** affected (from Section 3)  
2. **Cockpit department** (from Cockpit spec)  
3. **Tier** (if Runtime)  
4. **Connector** (if external)  
5. **No duplicate** — deprecate old owner if moving capability  

---

*REAL-078 — EmpireAI Canonical Architecture v1.0*
