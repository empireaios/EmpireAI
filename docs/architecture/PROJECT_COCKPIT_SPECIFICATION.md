# Project Cockpit Specification

**Mission:** REAL-078  
**Status:** Official target specification  
**Version:** 1.0  
**Defines:** Cockpit as the Executive Operating System  

---

## 1. Definition

**Project Cockpit** is EmpireAI's Executive Operating System — the single interface through which a founder observes portfolio health, approves autonomous actions, navigates departments, and intervenes when required.

Cockpit is **not** a single folder today. It is a **logical product layer** that maps existing and future UI to nine departments with consistent KPIs, permissions, and data sources.

### Design goals

1. One mental model: departments, not 100 runtime module names.  
2. Live data labeled; demo/seed data labeled.  
3. Every action routes through Brain (dispatch or REST).  
4. Pillow companion available from every department with screen context.  
5. Approval queue visible globally for L3+ actions.  

---

## 2. Cockpit Shell (Global Chrome)

| Element | Responsibility | Data source |
|---------|----------------|-------------|
| **Top bar** | Workspace name, live status, today's profit snippet, notification bell, profile/logout | `finance:load`, `global-notifications/unread-count`, auth context |
| **Sidebar** | Department navigation (9 departments + settings) | `lib/platform/navigation.ts` (canonical nav registry) |
| **Mobile nav** | Same departments, role-filtered | permissions.ts |
| **SSE ticker** | Agent activity / event counter | `GET /api/brain/events` |
| **Approval bar** | Pending Pillow + L3 founder approvals | `api/pillow/approval`, AI CEO pending decisions |
| **Pillow companion** | Contextual chat panel | `api/pillow/*`, screen context |
| **Global Assistant** (optional panel) | Missions, why, audit | `global-assistant/*` |
| **Success-001 blocker bar** | V1 certification blockers | `version-1-activation`, ESIS |

**Permissions:** Shell visible to all authenticated roles; approval bar founder/admin only; admin department admin only.

---

## 3. Departments

### 3.1 Executive Command

| Field | Definition |
|-------|------------|
| **Responsibilities** | Portfolio overview; AI CEO briefing; strategic decisions; daily executive brief; mission home. |
| **Primary users** | Founder, Admin |
| **Canonical modules** | dashboard, ai-ceo, operation-first-dollar (brief), mission-command |

**Dashboard widgets**

| Widget | Data |
|--------|------|
| Portfolio revenue / margin / companies / agents | `dashboard:load` |
| Recent activity feed | `dashboard:load` → activity_events |
| AI CEO briefing + priorities | `ai-ceo:load` |
| Pending decisions (approve/deny) | `ai-ceo:load` → decisions |
| Daily executive brief | `operation-first-dollar:daily_executive_brief` |
| Mission board summary | `global-assistant/missions` or mission-engine |

**KPIs**

| KPI | Source | Target display |
|-----|--------|----------------|
| Portfolio GMV (MTD) | financial_ledger_events | Live |
| Net margin % | finance:load / ledger | Live |
| Active companies | companies table | Live |
| Pending founder decisions | decisions (pending) | Live |
| Agent activity (24h) | activity_events | Live |

**Navigation**

| Route (canonical) | Current mapping |
|-------------------|-----------------|
| `/cockpit/command` | `frontend/EmpireCommandCenterPage`, `empireai-web/platform/dashboard` |
| `/cockpit/command/ai-ceo` | `empireai-web/platform/ai-ceo` |
| `/cockpit/command/missions` | `frontend/MissionHomePage` |
| `/cockpit/command/brief` | `operation-first-dollar` daily brief |

**Permissions:** All authenticated; approve/deny founder+admin; admin console link admin only.

**Data sources:** Brain dispatch (`dashboard`, `ai-ceo`), REST (`operation-first-dollar/*`, `executive-council/headquarters`).

---

### 3.2 Development

| Field | Definition |
|-------|------------|
| **Responsibilities** | Pillow missions, Cursor approvals, ESIS self-inspection, version backlog, architecture reviews. |
| **Primary users** | Founder, Admin, Developer (via Pillow) |
| **Canonical modules** | pillow-*, empire-self-inspection, version-2-backlog-engine, architecture-review |

**Dashboard widgets**

| Widget | Data |
|--------|------|
| Open Cursor missions | `api/pillow/missions` |
| Approval queue | `api/pillow/approval` |
| ESIS dashboard / last scan | `empire-self-inspection/dashboard` |
| V2 backlog summary | `version-2-backlog-engine:dashboard` |
| Architecture review status | `architecture-review:dashboard` |

**KPIs**

| KPI | Source |
|-----|--------|
| Open approvals | pillow approval gate |
| Missions completed (7d) | pillow missions |
| ESIS findings (open) | ESIS run |
| Production blockers | version-1-activation |

**Navigation**

| Route | Current mapping |
|-------|-----------------|
| `/cockpit/development/approvals` | `frontend/ApprovalsPage` |
| `/cockpit/development/pillow` | `frontend/PillowChatPage` |
| `/cockpit/development/inspection` | ESIS (backend/frontend TBD) |
| `/cockpit/development/learning` | `frontend/ExecutiveLearningReviewPage` |

**Permissions:** Founder, admin; Cursor bridge requires Pillow session.

**Data sources:** Pillow host routes, ESIS, executive-learning.

---

### 3.3 AI Workforce

| Field | Definition |
|-------|------------|
| **Responsibilities** | View agent roster, activity, tool usage, fleet health; AI Team overview. |
| **Primary users** | Founder, Admin |
| **Canonical modules** | brain/agents, admin (fleet), ai-team page |

**Dashboard widgets**

| Widget | Data |
|--------|------|
| Agent roster (12) | `GET /brain/agents` |
| Agents online / activity | SSE + activity_events |
| Tool audit trail | `GET /brain/audit` |
| Admin fleet (synthetic → live) | `admin:load` → target real metrics |

**KPIs**

| KPI | Source |
|-----|--------|
| Agents registered | agent-manager |
| Dispatches (24h) | audit_logs |
| Guardian blocks (24h) | guardian_risks |
| Queue depth | task queue / admin metrics |

**Navigation**

| Route | Current mapping |
|-------|-----------------|
| `/cockpit/workforce` | `frontend/AiTeamPage` |
| `/cockpit/workforce/audit` | brain audit (admin) |

**Permissions:** Founder read; admin full (`/brain/agents`, `/brain/tools`).

**Data sources:** Brain admin routes, SSE, audit_logs.

---

### 3.4 Commerce

| Field | Definition |
|-------|------------|
| **Responsibilities** | Store builder, manufacture, deploy, catalog, checkout, orders, fulfillment, ads execution, marketing campaigns. **Launch path:** future product launches require CRIR commercial risk certification at READINESS (ADR-051; documentation phase). |
| **Primary users** | Founder, Operator |
| **Canonical modules** | store, orders, marketing, ads, revenue-loop, grand-king pipeline |

**Dashboard widgets**

| Widget | Data |
|--------|------|
| Build pipeline progress | `store:load`, build stages |
| Manufacture / create company | `store:create`, `store:manufacture` |
| Storefront preview | `store:get_storefront`, artifact getters |
| Active campaigns | `marketing:load` |
| Ad channel ROAS | `ads:load` |
| Order table + fulfillment panel | `orders:load`, fulfillment actions |
| Revenue loop status | `revenue-loop:list_orders` |
| Grand King pipeline | `grand-king-revenue-pipeline/headquarters` |

**KPIs**

| KPI | Source | Production target |
|-----|--------|-------------------|
| Companies in build | companies (building) | Live |
| Stores deployed | production_deployments | Live |
| Orders today | orders stats | Live |
| Blended ROAS | ads + analytics_roas | Live |
| Fulfillment rate | live_cj_fulfillments | Live |
| CRIR certification status (future) | CRIR artifact registry / governance | Governance-labeled until live |

**Navigation**

| Route | Current mapping |
|-------|-----------------|
| `/cockpit/commerce/store` | `empireai-web/platform/store` |
| `/cockpit/commerce/orders` | `empireai-web/platform/orders`, `frontend/OrdersPage` |
| `/cockpit/commerce/marketing` | `empireai-web/platform/marketing` |
| `/cockpit/commerce/ads` | `empireai-web/platform/ads`, `frontend/AdsPage` |
| `/cockpit/commerce/launch` | `frontend/LaunchCenterPage`, `ProductDiscoveryPage` |
| `/cockpit/commerce/workspace` | `frontend/BusinessWorkspacePage` |

**Permissions:** Founder full; operator read on orders/support; ads budget change requires founder approval (L3).

**Data sources:** Brain dispatch (store, orders, marketing, ads), REST (grand-king-revenue-pipeline, ecommerce-os).

---

### 3.5 Finance

| Field | Definition |
|-------|------------|
| **Responsibilities** | P&L, cash runway, treasury, billing, operating cost, profit dashboard. **CRI:** Finance owner sign-off on CRIR sections 8–10 (margin after all costs, worst-case exposure, survivability). |
| **Primary users** | Founder, Admin |
| **Canonical modules** | finance, treasury, live-payments, operation-first-dollar KPIs |

**Dashboard widgets**

| Widget | Data |
|--------|------|
| P&L waterfall | `finance:load` → ledger (target) |
| Profit today | orders stats + ledger |
| Cash runway | treasury_snapshots |
| Payment list | `live-payments/payments` |
| Operating cost panel | cost_dependencies |
| Billing / plan | workspace plan, Stripe billing (future) |

**KPIs**

| KPI | Source |
|-----|--------|
| Net profit MTD | financial_ledger_events |
| Net margin % | computed from ledger |
| Revenue MTD | live_payments + ledger |
| Ad spend MTD | analytics_ad_spend |
| Cash runway (months) | treasury |

**Navigation**

| Route | Current mapping |
|-------|-----------------|
| `/cockpit/finance` | `empireai-web/platform/finance` |
| `/cockpit/finance/profit` | `frontend/ProfitPage` |
| `/cockpit/finance/billing` | `frontend/BillingPage` |
| `/cockpit/finance/costs` | `frontend/OperatingCostPage` |

**Permissions:** Founder, admin; operator no access.

**Data sources:** finance:load, live-payments REST, treasury, cost module.

---

### 3.6 Intelligence

| Field | Definition |
|-------|------------|
| **Responsibilities** | Product scoring, market scan, supplier intel, discovery sessions, marketplace intelligence, commercial explorer. |
| **Primary users** | Founder, Operator (read) |
| **Canonical modules** | intelligence, product-scout, supplier-intelligence, eye-series, commerce-intelligence-core |

**Dashboard widgets**

| Widget | Data |
|--------|------|
| Product scoring table | `intelligence:load` (PIE) |
| Scan / full catalog | `intelligence:scan`, product-scout |
| Supplier cards + health | `suppliers:load`, `suppliers:health_check` |
| SIE evaluate/compare | `supplier-intelligence:*` |
| Discovery sessions | `product-discovery/sessions` |
| CIC mission queue | `commerce-intelligence-core/queue` |
| Eye dashboard | `eye-series/dashboard` |

**KPIs**

| KPI | Source |
|-----|--------|
| Products evaluated | PIE catalog count |
| Avg confidence | PIE stats |
| Active connector signals | pie signals (live) |
| Top opportunity score | product-scout recommend |
| Supplier trust avg | SIE evaluations |

**Navigation**

| Route | Current mapping |
|-------|-----------------|
| `/cockpit/intelligence/products` | `empireai-web/platform/intelligence` |
| `/cockpit/intelligence/suppliers` | `empireai-web/platform/suppliers` |
| `/cockpit/intelligence/discovery` | `frontend/ProductDiscoveryPage` |
| `/cockpit/intelligence/marketplace` | `frontend/MarketplaceIntelligencePage` |
| `/cockpit/intelligence/explorer` | `frontend/CommercialExplorerPage` |

**Permissions:** Founder full; operator read; CIC founder-only.

**Data sources:** dispatch (intelligence, suppliers), REST (discovery, CIC, eye-series).

---

### 3.7 Operations

| Field | Definition |
|-------|------------|
| **Responsibilities** | Order ops, support tickets, fulfillment health, first-order ops, post-purchase. |
| **Primary users** | Founder, Operator |
| **Canonical modules** | orders, support, live-cj-fulfillment, customer-orders |

**Dashboard widgets**

| Widget | Data |
|--------|------|
| Order pipeline status | `orders:load`, customer_order_pipelines |
| Fulfillment readiness | order fulfillment panel |
| CJ fulfillment list | `live-cj-fulfillment/list` |
| Support tickets | `support:load` |
| Tracking sync status | `customer-orders/sync_tracking` |

**KPIs**

| KPI | Source |
|-----|--------|
| Orders processing | orders stats |
| Fulfillment rate | CJ fulfillments |
| Avg resolution time | support tickets |
| Auto-resolved % | support stats |
| Failed fulfillments (24h) | live_cj_fulfillment_attempts |

**Navigation**

| Route | Current mapping |
|-------|-----------------|
| `/cockpit/operations/orders` | orders modules |
| `/cockpit/operations/support` | `empireai-web/platform/support` |

**Permissions:** Founder, operator read/write on support resolve; fulfillment submit founder-approved.

**Data sources:** orders dispatch, live-cj-fulfillment, support:load.

---

### 3.8 Infrastructure

| Field | Definition |
|-------|------------|
| **Responsibilities** | Integrations hub, deployment status, system health, admin console, infra page. |
| **Primary users** | Founder, Admin |
| **Canonical modules** | reality-integration, integrations-hub, operational-access, admin, production-deployment |

**Dashboard widgets**

| Widget | Data |
|--------|------|
| Integration connections | `integrations-hub/dashboard`, reality-integration/registry |
| Connector health | reality-integration/health |
| Deployment list | `production-deploy/list` |
| Platform metrics | admin:load (target: real) |
| Guardian health | `/guardian/health` |
| Redis / Brain health | `/health` |

**KPIs**

| KPI | Source |
|-----|--------|
| API uptime | metrics (target) |
| Open guardian risks | guardian_risks |
| Connectors healthy | connector_connections |
| Failed deploys | production_deployments |
| Queue depth | task queue |

**Navigation**

| Route | Current mapping |
|-------|-----------------|
| `/cockpit/infrastructure/integrations` | `frontend/IntegrationsHubPage` |
| `/cockpit/infrastructure/deployments` | production-deploy |
| `/cockpit/infrastructure/admin` | `empireai-web/platform/admin` |
| `/cockpit/infrastructure/health` | `frontend/InfrastructurePage` |

**Permissions:** Admin full; founder read integrations; connect actions founder.

**Data sources:** reality-integration, integrations-hub, admin, health routes.

---

### 3.9 Governance

| Field | Definition |
|-------|------------|
| **Responsibilities** | Soul file, decision history, executive council, surveillance, V1 certification, settings, policies. |
| **Primary users** | Founder (primary), Admin |
| **Canonical modules** | soul-file, decision-registry, executive-council, executive-surveillance, version-1-*, settings |

**Dashboard widgets**

| Widget | Data |
|--------|------|
| Soul decision chamber | `soul-decision-chamber:dashboard` |
| King decision history | `king-decision-history:dashboard` |
| Executive council HQ | `executive-council/headquarters` |
| Executive debate | `executive-visual-debate:dashboard` |
| V1 readiness / sign-off | version-1-readiness-audit, version-1-executive-sign-off |
| Settings (account, integrations, security) | `settings:load` |
| Policy / doctrine summary | doctrine-engine, policy-engine (admin) |

**KPIs**

| KPI | Source |
|-----|--------|
| V1 certification % | version-1-completion |
| Open governance blockers | version-1-activation |
| Decisions recorded (30d) | decision-registry |
| Promises in progress | promise-register |
| Soul file version | soul_file_snapshots |

**Navigation**

| Route | Current mapping |
|-------|-----------------|
| `/cockpit/governance/settings` | `empireai-web/platform/settings`, `frontend/SettingsPage` |
| `/cockpit/governance/soul` | `frontend/SoulDecisionChamberPage` |
| `/cockpit/governance/decisions` | `frontend/KingDecisionHistoryPage` |
| `/cockpit/governance/council` | `frontend/ExecutiveDebatePage` |
| `/cockpit/governance/v1` | `frontend/Success001CommandCenterPage` |

**Permissions:** Founder full; settings save founder; doctrine publish admin+founder.

**Data sources:** Foundation dispatch modules, executive-council REST, settings:load.

---

## 4. Department × Role Matrix

| Department | Founder | Admin | Operator |
|------------|---------|-------|----------|
| Executive Command | Full | Full | Read |
| Development | Full | Full | — |
| AI Workforce | Read | Full | — |
| Commerce | Full | Full | Read |
| Finance | Full | Full | — |
| Intelligence | Full | Full | Read |
| Operations | Full | Full | Read/Write support |
| Infrastructure | Integrations | Full | — |
| Governance | Full | Full | Read settings |

---

## 5. Navigation Registry (Canonical)

All routes register in a single `cockpit/navigation.ts` (future) exporting:

```typescript
{
  department: "commerce",
  label: "Store Builder",
  href: "/cockpit/commerce/store",
  brainModule: "store",
  requiredRole: "founder",
  dataMode: "live" | "demo",
}
```

Until merge, maintain parallel registries in `empireai-web/lib/platform/navigation.ts` and `frontend/src/routes/paths.ts` with ESIS cross-check.

---

## 6. Data Mode Labeling

| Mode | UI badge | Rule |
|------|----------|------|
| **Live** | Green "Live" | Backed by connector or ledger with `mock=0` |
| **Demo** | Amber "Demo" | Seed data or mock providers |
| **Sandbox** | Red "Sandbox" | Explicit sandbox tools (e.g. CJ sandbox submit) |

Every Cockpit widget must declare `dataMode` in the navigation registry.

---

## 7. Implementation Phases

| Phase | Deliverable |
|-------|-------------|
| **C0 (now)** | Logical department mapping (this spec) |
| **C1** | Unified nav registry + data mode badges |
| **C2** | Notification + approval bar in both frontends |
| **C3** | Route prefix `/cockpit/*` in single Next app |
| **C4** | Retire duplicate pages (merge Profit/Finance, etc.) |

---

*REAL-078 — Project Cockpit Specification v1.0*
