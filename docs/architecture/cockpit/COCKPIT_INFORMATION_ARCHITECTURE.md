# Cockpit Information Architecture

**Mission:** REAL-079  
**Authority:** Grand King Executive Directive  
**Status:** V1 design — architecture + UI specification  
**Version:** 1.0  
**Depends on:** REAL-076, REAL-077, Hierarchy Audit, REAL-078  

---

## 1. What Project Cockpit Is

Project Cockpit is the **Executive Operating System (EOS)** of EmpireAI — not a dashboard, not a module list, not a runtime registry.

| Cockpit IS | Cockpit IS NOT |
|------------|----------------|
| The founder's command environment | A read-only metrics page |
| A department-organized operating model | 100 disconnected runtime URLs |
| An approval and intervention layer | A passive BI tool |
| The shell all Brain surfaces plug into | A replacement for Brain |
| Grand King's daily command post | Marketing landing or admin-only ops |

**Metaphor:** Cockpit = bridge of an aircraft carrier. Brain = engine room. Pillow = executive officer at your shoulder. AI Workforce = crew. Commerce = flight operations.

---

## 2. Information Architecture (Top Level)

```
EmpireAI (public)
└── Marketing / Auth
    └── Project Cockpit (authenticated EOS)
        ├── Executive Home          ← default landing (Command + pulse)
        ├── Command Centre          ← portfolio + AI CEO + decisions
        ├── Mission Centre          ← missions, approvals, blockers
        ├── Departments
        │   ├── Intelligence
        │   ├── Commerce
        │   ├── Operations
        │   ├── Finance
        │   ├── AI Workforce
        │   ├── Infrastructure
        │   ├── Governance
        │   └── Development
        └── Global Systems (persistent)
            ├── Pillow Companion
            ├── Notification Centre
            ├── Approval Queue
            └── Global Assistant
```

### 2.1 IA Principles

1. **Depth max 3 clicks** from Executive Home to any action screen.  
2. **Department-first** navigation — never expose runtime module names to founders.  
3. **Home = situational awareness** — not a duplicate of Command Centre.  
4. **Mission Centre = action queue** — what needs founder input today.  
5. **Panels are composable** — same widget may appear on Home and in a department.  

---

## 3. Navigation Hierarchy

### 3.1 Primary navigation (sidebar)

```
┌─────────────────────────────┐
│  EMPIREAI COCKPIT           │
│  ─────────────────────────  │
│  ◉ Executive Home           │  /cockpit
│  ◎ Command Centre           │  /cockpit/command
│  ◎ Mission Centre           │  /cockpit/missions
│  ─────────────────────────  │
│  DEPARTMENTS                │
│  ◎ Intelligence             │  /cockpit/intelligence
│  ◎ Commerce                 │  /cockpit/commerce
│  ◎ Operations               │  /cockpit/operations
│  ◎ Finance                  │  /cockpit/finance
│  ◎ AI Workforce             │  /cockpit/workforce
│  ◎ Infrastructure         │  /cockpit/infrastructure
│  ◎ Governance               │  /cockpit/governance
│  ◎ Development              │  /cockpit/development
│  ─────────────────────────  │
│  ⚙ Settings                 │  /cockpit/governance/settings
└─────────────────────────────┘
```

### 3.2 Secondary navigation (department tabs)

Each department exposes **2–5 tabs max**. Tabs are stable; screens within tabs may grow.

| Department | Tabs |
|------------|------|
| **Intelligence** | Products · Suppliers · Discovery · Marketplace |
| **Commerce** | Store · Launch · Marketing · Ads · Workspace |
| **Operations** | Orders · Fulfillment · Support |
| **Finance** | Profit · P&L · Billing · Costs |
| **AI Workforce** | Roster · Activity · Audit |
| **Infrastructure** | Integrations · Deployments · Health · Admin |
| **Governance** | Settings · Soul · Decisions · Council · V1 Certification |
| **Development** | Pillow · Approvals · Inspection · Learning |

### 3.3 Breadcrumb pattern

```
Cockpit  ›  {Department}  ›  {Tab}  ›  {Entity?}
Example:  Cockpit  ›  Commerce  ›  Store  ›  Acme Wireless Co.
```

### 3.4 Route registry (canonical)

| Route ID | Path | Nav level | Department |
|----------|------|-----------|------------|
| `home` | `/cockpit` | Primary | — |
| `command` | `/cockpit/command` | Primary | Executive Command |
| `missions` | `/cockpit/missions` | Primary | Mission Centre |
| `intel-products` | `/cockpit/intelligence/products` | Tab | Intelligence |
| `commerce-store` | `/cockpit/commerce/store` | Tab | Commerce |
| `ops-orders` | `/cockpit/operations/orders` | Tab | Operations |
| `finance-profit` | `/cockpit/finance/profit` | Tab | Finance |
| `workforce-roster` | `/cockpit/workforce` | Primary | AI Workforce |
| `infra-integrations` | `/cockpit/infrastructure/integrations` | Tab | Infrastructure |
| `gov-settings` | `/cockpit/governance/settings` | Tab | Governance |

**Current mapping (implementation phase):** See `COCKPIT_SCREEN_MAP.md` § Migration.

---

## 4. Executive Home Screen

Executive Home is the **situational awareness layer** — a 30-second answer to: *"Is the empire healthy, and what needs me?"*

### 4.1 Layout zones

```
┌──────────────────────────────────────────────────────────────────────────┐
│ TOP BAR: Workspace · Live badge · Profit today · Notifications · Profile   │
├──────────┬───────────────────────────────────────────────────────────────┤
│          │  EXECUTIVE HOME                                               │
│ SIDEBAR  │  ┌─────────────────────────────────────────────────────────┐  │
│          │  │ GRAND KING GREETING + DATE + V1 STATUS STRIP            │  │
│          │  └─────────────────────────────────────────────────────────┘  │
│          │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│          │  │ KPI      │ │ KPI      │ │ KPI      │ │ KPI      │        │
│          │  │ GMV MTD  │ │ Margin   │ │ Decisions│ │ Missions │        │
│          │  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│          │  ┌────────────────────────────┐ ┌──────────────────────────┐ │
│          │  │ COMMAND SNAPSHOT           │ │ MISSION QUEUE (top 5)    │ │
│          │  │ AI CEO headline + 3 prios  │ │ Approve · Review · Block │ │
│          │  └────────────────────────────┘ └──────────────────────────┘ │
│          │  ┌────────────────────────────┐ ┌──────────────────────────┐ │
│          │  │ PORTFOLIO PULSE            │ │ AGENT ACTIVITY (SSE)     │ │
│          │  │ Companies + build status   │ │ Live event stream        │ │
│          │  └────────────────────────────┘ └──────────────────────────┘ │
│          │  ┌─────────────────────────────────────────────────────────┐  │
│          │  │ DEPARTMENT HEALTH ROW (8 mini status cards)              │  │
│          │  └─────────────────────────────────────────────────────────┘  │
│          │  [ Open Command Centre ]  [ Open Mission Centre ]             │
└──────────┴───────────────────────────────────────────────────────────────┘
│ APPROVAL BAR (if pending) · PILLOW FAB                                    │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Home vs Command Centre

| Aspect | Executive Home | Command Centre |
|--------|----------------|----------------|
| Purpose | Pulse + routing | Deep command + decisions |
| Depth | Summary only | Full briefing, full company table |
| Actions | Navigate to departments | Approve/deny, export, drill-down |
| Refresh | 60s auto + SSE | On demand + SSE |
| Primary user | Grand King start of day | Grand King during command sessions |

---

## 5. Department Layout (Standard Template)

Every department screen uses the **Cockpit Department Template**:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ TOP BAR (global)                                                         │
├──────────┬───────────────────────────────────────────────────────────────┤
│ SIDEBAR  │  {Department Name}                    [Data mode badge]       │
│          │  {One-line department purpose}                                │
│          │  ┌─ Tab ─┬─ Tab ─┬─ Tab ─┐                                    │
│          │  └───────┴───────┴───────┘                                    │
│          │  ┌──────────┐ ┌──────────┐ ┌──────────┐  ← Department KPIs   │
│          │  │ KPI      │ │ KPI      │ │ KPI      │                        │
│          │  └──────────┘ └──────────┘ └──────────┘                        │
│          │  ┌────────────────────────────┐ ┌──────────────────────────┐   │
│          │  │ PRIMARY PANEL (60%)        │ │ SECONDARY PANEL (40%)    │   │
│          │  │ Main work surface          │ │ Context / actions        │   │
│          │  └────────────────────────────┘ └──────────────────────────┘   │
│          │  ┌─────────────────────────────────────────────────────────┐   │
│          │  │ OPTIONAL: Timeline / Activity strip                     │   │
│          │  └─────────────────────────────────────────────────────────┘   │
└──────────┴───────────────────────────────────────────────────────────────┘
```

**Data mode badge:** `Live` | `Demo` | `Sandbox` — required on every department header.

---

## 6. Command Centre

The **Command Centre** is Grand King's strategic operations room — portfolio command, AI CEO briefing, and executive decisions.

### 6.1 Structure

| Zone | Content |
|------|---------|
| Header | "Command Centre" + portfolio date range selector |
| KPI strip | GMV, margin, companies, agents online, profit today |
| Left column (50%) | AI CEO briefing card · Priority stack · Pending decisions table |
| Right column (50%) | Company portfolio table · Recent activity feed |
| Footer actions | Export report · Open AI CEO · Daily brief |

### 6.2 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│ COMMAND CENTRE                          Period: [ MTD ▼ ]       │
├─────────────────────────────────────────────────────────────────┤
│ [GMV $1.2M] [Margin 36%] [Companies 12] [Agents 18] [Profit +$4k]│
├──────────────────────────────┬──────────────────────────────────┤
│ AI CEO BRIEFING              │ PORTFOLIO                        │
│ ┌──────────────────────────┐ │ ┌──────────────────────────────┐ │
│ │ Headline + summary       │ │ │ Company │ Rev │ Margin │ St │ │
│ │                          │ │ │ Acme    │ ... │ 42%    │ ●  │ │
│ │ Priorities:              │ │ │ Nova    │ ... │ 38%    │ ◐  │ │
│ │ 1. Scale top revenue     │ │ └──────────────────────────────┘ │
│ │ 2. Launch ads — building │ │ RECENT ACTIVITY                  │
│ │ 3. Manufacture vertical  │ │ • Casey — store pipeline init    │
│ └──────────────────────────┘ │ • Morgan — scan wireless complete│
│ PENDING DECISIONS            │                                  │
│ ┌──────────────────────────┐ │                                  │
│ │ □ Scale ads    [Deny][OK]│ │                                  │
│ │ □ New supplier [Deny][OK]│ │                                  │
│ └──────────────────────────┘ │                                  │
└──────────────────────────────┴──────────────────────────────────┘
```

**Brain sources:** `dashboard:load`, `ai-ceo:load`, `ai-ceo:approve`, `operation-first-dollar:daily_executive_brief`

---

## 7. Mission Centre

The **Mission Centre** is the action queue — everything requiring Grand King attention across Pillow, Guardian L3+, blockers, and certifications.

### 7.1 Mission types

| Type | Source | Priority |
|------|--------|----------|
| Founder decision | AI CEO pending | High |
| Pillow Cursor approval | pillow/approval | High |
| Fulfillment approval | orders / CJ | High |
| Ad budget (L3) | ad-manager | Medium |
| V1 blocker | version-1-activation | Medium |
| Global Assistant command | global-assistant/commands | Medium |
| Notification ack | global-notifications | Low |

### 7.2 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│ MISSION CENTRE                    [ All │ Urgent │ Blockers ]   │
├─────────────────────────────────────────────────────────────────┤
│ Summary: 3 urgent · 7 pending · 1 blocker                       │
├─────────────────────────────────────────────────────────────────┤
│ ┌─ URGENT ────────────────────────────────────────────────────┐
│ │ 🔴 Approve CJ fulfillment — Order #1842        [Review][Approve]│
│ │ 🔴 Cursor mission: REAL-080 store wiring       [Review][Deny][OK]│
│ │ 🟠 AI CEO: Scale Meta budget +$500/day         [Deny][Approve]   │
│ └───────────────────────────────────────────────────────────────┘
│ ┌─ PENDING ─────────────────────────────────────────────────────┐
│ │ 🟡 V1 blocker: CJ credentials missing        [Integrations →] │
│ │ 🟡 Assistant: Generate audit for Commerce    [Open]            │
│ └───────────────────────────────────────────────────────────────┘
│ ┌─ COMPLETED TODAY ─────────────────────────────────────────────┐
│ │ ✓ Approved manufacture — Nova Home                           │
│ └───────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

**Unified queue:** Mission Centre aggregates from AI CEO, Pillow, notifications, V1 activation — single sort by priority + age.

---

## 8. Panel Specifications

### 8.1 AI Workforce Panel

**Location:** `/cockpit/workforce` (department) + mini widget on Home

| Zone | Widget | Data |
|------|--------|------|
| KPI strip | Agents online, dispatches 24h, guardian blocks, queue depth | audit, SSE |
| Primary | Agent roster grid (12 cards: name, role, module, status) | brain/agents |
| Secondary | Live activity stream | SSE /brain/events |
| Tab: Audit | Tool execution log (filterable) | brain/audit |

```
┌─────────────────────────────────────────────────────────┐
│ AI WORKFORCE                                            │
├─────────────────────────────────────────────────────────┤
│ [18 Active] [142 Dispatches] [0 Blocks] [Queue: 12]     │
├──────────────────────────────┬──────────────────────────┤
│ AGENT ROSTER                 │ LIVE ACTIVITY            │
│ ┌──────┐ ┌──────┐ ┌──────┐  │ 14:02 Morgan — scan      │
│ │Victoria│ │Morgan│ │Casey│  │ 14:01 Casey — manufacture│
│ │ AI CEO │ │ PIE  │ │Store│  │ 13:58 Sam — order review │
│ └──────┘ └──────┘ └──────┘  │                          │
│ ... (12 agents)              │                          │
└──────────────────────────────┴──────────────────────────┘
```

### 8.2 Commerce Panel

**Location:** `/cockpit/commerce/*` tabs

| Tab | Primary surface | Key actions |
|-----|-----------------|-------------|
| Store | Build pipeline + company list | Create, Manufacture, Preview |
| Launch | Discovery → preview → build | Start session, Approve |
| Marketing | Campaign table | Generate campaign |
| Ads | ROAS by channel | Pause all, Adjust budget |
| Workspace | Opportunity compare | Approve, Reject |

Commerce panel emphasizes **venture lifecycle stage** per company (Discover → Build → Deploy → Sell → Scale).

### 8.3 Finance Panel

**Location:** `/cockpit/finance/*`

| Tab | Primary surface |
|-----|-----------------|
| Profit | Today / MTD profit, margin trend |
| P&L | Waterfall: revenue → COGS → ads → fees → net |
| Billing | Workspace plan, payment methods |
| Costs | Operating cost dependencies |

Grand King default tab: **Profit** (founder's primary question).

### 8.4 Infrastructure Panel

**Location:** `/cockpit/infrastructure/*`

| Tab | Primary surface |
|-----|-----------------|
| Integrations | Connection grid (Stripe, CJ, Meta, Vercel, Amazon) |
| Deployments | production_deployments list + status |
| Health | Guardian + Brain health + Redis |
| Admin | Tenant/fleet metrics (admin role) |

Integration card states: `Connected` · `Degraded` · `Not configured` · `Mock`

### 8.5 Governance Panel

**Location:** `/cockpit/governance/*`

| Tab | Primary surface |
|-----|-----------------|
| Settings | Account, workspace, notifications, security |
| Soul | Soul decision chamber |
| Decisions | King decision history |
| Council | Executive debate / council HQ |
| V1 Certification | Success-001 command center, blockers |

---

## 9. Widget Catalogue

Widgets are reusable UI units registered in `cockpit/widgets/registry` (future). Each widget declares: id, department, data sources, dataMode, min role.

### 9.1 Global widgets (any screen)

| Widget ID | Name | Size | Data source |
|-----------|------|------|-------------|
| `W-G-001` | Profit Today Snippet | XS | finance / ledger |
| `W-G-002` | Notification Bell | XS | global-notifications |
| `W-G-003` | Approval Bar | Full width | missions aggregate |
| `W-G-004` | SSE Activity Ticker | M | brain/events |
| `W-G-005` | Data Mode Badge | XS | env + source meta |
| `W-G-006` | V1 Blocker Strip | Full width | version-1-activation |
| `W-G-007` | Pillow FAB | Fixed | pillow/status |

### 9.2 Executive widgets

| Widget ID | Name | Size | Screen(s) |
|-----------|------|------|-----------|
| `W-E-001` | Grand King Greeting | M | Home |
| `W-E-002` | Command Snapshot | L | Home, Command |
| `W-E-003` | Mission Queue Preview | M | Home, Missions |
| `W-E-004` | Portfolio Pulse | M | Home, Command |
| `W-E-005` | Department Health Row | Full | Home |
| `W-E-006` | AI CEO Briefing | L | Command |
| `W-E-007` | Pending Decisions Table | L | Command, Missions |
| `W-E-008` | Company Portfolio Table | L | Command |
| `W-E-009` | Activity Feed | M | Command |
| `W-E-010` | Daily Executive Brief | L | Command |

### 9.3 Department widgets

| Widget ID | Name | Department |
|-----------|------|------------|
| `W-I-001` | Product Scoring Table | Intelligence |
| `W-I-002` | Supplier Reliability Grid | Intelligence |
| `W-I-003` | Discovery Session List | Intelligence |
| `W-C-001` | Build Pipeline Progress | Commerce |
| `W-C-002` | Campaign Table | Commerce |
| `W-C-003` | Ad ROAS Cards | Commerce |
| `W-C-004` | Storefront Preview Frame | Commerce |
| `W-O-001` | Order Table | Operations |
| `W-O-002` | Fulfillment Readiness Panel | Operations |
| `W-O-003` | Support Ticket Table | Operations |
| `W-F-001` | P&L Waterfall | Finance |
| `W-F-002` | Profit Stat Grid | Finance |
| `W-F-003` | Operating Cost Panel | Finance |
| `W-W-001` | Agent Roster Grid | AI Workforce |
| `W-W-002` | Tool Audit Log | AI Workforce |
| `W-N-001` | Integration Connection Grid | Infrastructure |
| `W-N-002` | Deployment Status List | Infrastructure |
| `W-N-003` | Guardian Health Grid | Infrastructure |
| `W-GV-001` | Settings Form Tabs | Governance |
| `W-GV-002` | V1 Certification Progress | Governance |
| `W-GV-003` | Soul Decision Chamber | Governance |
| `W-D-001` | Pillow Mission Board | Development |
| `W-D-002` | Cursor Approval Queue | Development |

---

## 10. KPI Catalogue

### 10.1 Executive KPIs (Home + Command)

| KPI ID | Label | Formula / source | Target mode | Refresh |
|--------|-------|------------------|-------------|---------|
| `K-E-001` | Portfolio GMV (MTD) | Σ ledger revenue events | Live | 5 min |
| `K-E-002` | Net Margin % | (revenue − costs) / revenue | Live | 5 min |
| `K-E-003` | Profit Today | ledger + orders profit_today | Live | 1 min |
| `K-E-004` | Active Companies | count companies active | Live | 5 min |
| `K-E-005` | Companies Building | count status=building | Live | 1 min |
| `K-E-006` | Agents Online | agent-manager count | Live | SSE |
| `K-E-007` | Pending Decisions | decisions pending | Live | 1 min |
| `K-E-008` | Open Missions | mission centre count | Live | 1 min |
| `K-E-009` | V1 Readiness % | version-1-completion | Demo→Live | 15 min |
| `K-E-010` | Fulfillment Rate | CJ success / total | Live | 5 min |

### 10.2 Department KPIs

| KPI ID | Label | Department | Source |
|--------|-------|------------|--------|
| `K-I-001` | Products Evaluated | Intelligence | PIE stats |
| `K-I-002` | Avg Confidence | Intelligence | PIE stats |
| `K-I-003` | Active Signals | Intelligence | pie signals |
| `K-I-004` | Supplier Trust Avg | Intelligence | SIE |
| `K-C-001` | Stores Deployed | Commerce | production_deployments |
| `K-C-002` | Blended ROAS | Commerce | ads + analytics |
| `K-C-003` | Active Campaigns | Commerce | marketing_campaigns |
| `K-C-004` | Build Progress % | Commerce | build_stages |
| `K-O-001` | Orders Today | Operations | orders stats |
| `K-O-002` | Processing | Operations | orders stats |
| `K-O-003` | Auto-Resolved % | Operations | support stats |
| `K-F-001` | Net Profit MTD | Finance | ledger |
| `K-F-002` | Cash Runway | Finance | treasury |
| `K-F-003` | Ad Spend MTD | Finance | analytics_ad_spend |
| `K-W-001` | Dispatches 24h | AI Workforce | audit_logs |
| `K-W-002` | Guardian Blocks 24h | AI Workforce | guardian_risks |
| `K-W-003` | Queue Depth | AI Workforce | task queue |
| `K-N-001` | Connectors Healthy | Infrastructure | connector_connections |
| `K-N-002` | API Uptime | Infrastructure | metrics |
| `K-N-003` | Failed Deploys | Infrastructure | production_deployments |
| `K-GV-001` | V1 Blockers Open | Governance | version-1-activation |
| `K-GV-002` | Decisions Recorded 30d | Governance | decision-registry |

### 10.3 KPI display rules

- **Live** KPIs: solid gold accent, no disclaimer.  
- **Demo** KPIs: amber badge + tooltip "Seeded demo data".  
- **Unavailable** KPIs: em dash + "Connect {integration}" CTA.  
- Grand King Home shows max **4 primary KPIs** + expandable row.  

---

## 11. Global Chrome Specification

### 11.1 Top bar

| Element | Width | Behavior |
|---------|-------|----------|
| Workspace selector | 180px | Future multi-tenant |
| Live status pill | 80px | Green/amber/red from health |
| Profit today | 120px | K-E-003 |
| SSE counter | 60px | Event count rolling |
| Notifications | icon | Opens drawer |
| Profile menu | icon | Settings, logout |

### 11.2 Persistent overlays

| Overlay | Trigger | Position |
|---------|---------|----------|
| Pillow Companion | FAB or ⌘K | Right drawer 400px |
| Notification Drawer | Bell | Right drawer 360px |
| Approval Bar | pending > 0 | Bottom sticky |
| Mission Quick View | ⌘M | Modal |

---

## 12. Permissions Matrix (Cockpit V1)

| Surface | Founder | Admin | Operator |
|---------|---------|-------|----------|
| Executive Home | ✓ | ✓ | ✓ |
| Command Centre | ✓ | ✓ | Read |
| Mission Centre | ✓ | ✓ | — |
| Approve L3 actions | ✓ | ✓ | — |
| Commerce write | ✓ | ✓ | Read |
| Finance | ✓ | ✓ | — |
| Infrastructure Admin tab | ✓ | ✓ | — |
| Governance V1 | ✓ | ✓ | — |
| Development / Pillow | ✓ | ✓ | — |

---

## 13. Implementation Phases (UI only)

| Phase | Scope | REAL target |
|-------|-------|-------------|
| **Cockpit V0** | Nav registry + route mapping doc | REAL-079 (this) |
| **Cockpit V1** | Shell + Home + Command + Missions in one app | REAL-080+ |
| **Cockpit V1.1** | Department panels with data mode badges | REAL-081+ |
| **Cockpit V2** | Merge frontend + empireai-web under `/cockpit` | REAL-090+ |

---

## 14. Relation to REAL-078

| REAL-078 artifact | REAL-079 extension |
|-------------------|-------------------|
| 9 departments | + Executive Home, Command Centre, Mission Centre as first-class IA |
| Widget list in dept spec | Full widget catalogue with IDs |
| KPI list in dept spec | Full KPI catalogue with IDs |
| Route mapping | Canonical `/cockpit/*` hierarchy |
| Shell elements | Wireframes + overlay spec |

---

*REAL-079 — Cockpit Information Architecture v1.0*
