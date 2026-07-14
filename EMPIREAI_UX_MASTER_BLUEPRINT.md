# EMPIREAI UX MASTER BLUEPRINT — UX-000

> Mission: UX-000 — EmpireAI UX Master Blueprint (Version 1)
> Status: **BLUEPRINT ONLY — NOT IMPLEMENTATION**
> Date: 2026-06-28
> Scope guard: No new REAL missions · No new doctrine · No new architecture · No new runtime frameworks · No backend redesign
> Grounded in: `frontend/src/routes/*`, `frontend/src/pages/*`, `frontend/src/components/*`, `backend/src/auth/permissions.ts`, 229 runtime modules (REAL-013 → REAL-100 + foundation)

This document defines the **complete UX architecture** for EmpireAI Version 1 before any screen is built. Every weakness is assigned to an **existing owner module**. No owner is invented.

---

## PART 1 — Global UX Philosophy

### What EmpireAI must feel like
EmpireAI is an **Executive Operating System**, not a SaaS dashboard. The user is the **Grand King** of a commercial empire. The product is the chief of staff: it observes, analyses, debates, recommends — and then waits for the King's decision. The interface must feel **calm, commanding, and decisive**, never noisy.

### Core principles
1. **Business-first.** Every surface speaks money, products, suppliers, markets, and decisions — never internal module names or REAL IDs (those live in this blueprint, not the UI).
2. **Action-first.** Every page leads with the single most important decision available right now, then supporting evidence.
3. **"Don't tell me. Show me."** No raw data dumps. Show visual state, trend, and consequence. Numbers always carry a verdict (good / watch / act).
4. **Governed autonomy.** The UI must always make the chain visible: *Observe → Analyse → Debate → Soul recommends → Grand King decides.* The system **never executes** money-moving actions without explicit King approval. Approval surfaces are first-class.
5. **One brain, many windows.** Mission Home is the morning briefing; specialist surfaces are the deep desks. Nothing important should require hunting.

### The three questions every page must answer
Every screen, above the fold, must answer:
- **What happened?** (state + change since last visit)
- **Why?** (the evidence / driver)
- **What should I do next?** (one primary action, governed)

If a page cannot answer all three, it is logged in the **UX Debt Register (Part 8)** against its owner module.

### Sensory / interaction language
- **Verdict color system:** HEALTHY (green), WATCH (amber), ACT/BLOCKED (red), NEUTRAL (slate). Reuse existing `StatusBadge` / `HealthGrid` semantics.
- **Evidence on demand:** every metric expands to "why" without leaving the page.
- **Decisions are explicit:** approve / reject / defer are buttons with consequences shown, never silent toggles.

---

## PART 2 — Complete Navigation Tree

Current implemented shell = 9 workspace items in 3 sections (`frontend/src/routes/paths.ts`). The blueprint **keeps this spine** and organizes every backend surface beneath it. Items marked **[NEW SURFACE]** are blueprint targets that have an existing owner module but no screen yet; items marked **[EXISTS]** are already routed; **[UNROUTED ASSET]** are page components that exist in `frontend/src/pages` but are not mounted in `routes/index.tsx`.

```
PUBLIC
├── / ............................... Landing                         [EXISTS] LandingPage
└── /login .......................... Login                           [EXISTS] LoginPage

DASHBOARD (ProtectedRoute → DashboardLayout)
│
├─ COMMAND
│  ├── /dashboard ................... Mission Home / Executive HQ     [EXISTS] MissionHomePage
│  │   └── (drill-ins surfaced as panels today → promoted to tabs)
│  │       ├── World Operations Map ............... [NEW SURFACE] owner REAL-052
│  │       ├── Global Business Health ............. [NEW SURFACE] owner REAL-061
│  │       └── Empire KPIs ........................ [NEW SURFACE] owner REAL-062
│  ├── /dashboard/command ........... Empire Command Center           [EXISTS] EmpireCommandCenterPage
│  │   ├── Executive Council ...................... panel, owner EC (executive-council)
│  │   ├── Executive Surveillance ................. panel, owner ESS (executive-surveillance)
│  │   ├── Executive Debate (Visual) .............. [NEW SURFACE] owner REAL-055 / executive-visual-debate
│  │   ├── Soul Decision Chamber .................. [NEW SURFACE] owner REAL-056
│  │   ├── Strategic Center ....................... [NEW SURFACE] owner REAL-067
│  │   ├── Mission Command (next missions) ........ [NEW SURFACE] owner REAL-057
│  │   ├── Execution Timeline ..................... [NEW SURFACE] owner REAL-058
│  │   ├── King Decision History .................. [NEW SURFACE] owner REAL-086
│  │   └── Approvals Center ....................... [NEW SURFACE] owner GKR + EC + REAL-086
│  └── /dashboard/success-001 ....... SUCCESS-001 (USD 100K)          [EXISTS] Success001CommandCenterPage
│      └── Readiness Review ....................... panel, owner REAL-069
│
├─ WORKSPACES
│  ├── /dashboard/intelligence ...... Business Intelligence           [EXISTS] ProductDiscoveryPage
│  │   ├── Product Discovery ...................... owner product-discovery-opportunity-engine
│  │   ├── Eye Series signals ..................... owner eye-series
│  │   ├── Live Product Intelligence .............. [NEW SURFACE] owner REAL-013
│  │   ├── Commerce Intelligence Studio ........... [NEW SURFACE] owner CIS
│  │   ├── Customer Intelligence .................. [NEW SURFACE] owner REAL-026
│  │   ├── Customer Psychology .................... [NEW SURFACE] owner REAL-028
│  │   ├── Competitor Intelligence ................ [NEW SURFACE] owner REAL-027
│  │   └── Commercial Explorer (global search) .... [NEW SURFACE] owner REAL-066
│  ├── Supplier Intelligence ....................... [NEW SURFACE / UNROUTED ASSET SuppliersPage]
│  │   ├── Supplier Intelligence .................. owner supplier-intelligence (SUP)
│  │   ├── Supplier Loop .......................... owner REAL-015
│  │   └── Global Supplier Market ................. owner REAL-071
│  ├── Marketplace Intelligence .................... [NEW SURFACE]
│  │   ├── Global Marketplace Operations .......... owner global-marketplace-operations
│  │   ├── Marketplace Difference Engine .......... owner REAL-073
│  │   ├── Country Difference Engine .............. owner REAL-074
│  │   ├── Global Price Intelligence .............. owner REAL-075
│  │   ├── Shipping Intelligence .................. owner REAL-076
│  │   └── Marketplace Adapter Framework .......... owner REAL-072
│  ├── Product Portfolio ........................... [NEW SURFACE] owner REAL-054
│  ├── Market Share ................................ [NEW SURFACE] owner REAL-053
│  ├── /dashboard/brands ............ Brand Workspace                 [EXISTS] BusinessWorkspacePage
│  │   ├── /dashboard/brands/:id ............. Brand Detail           [EXISTS] BusinessDetailPage
│  │   └── /dashboard/brands/:id/preview ..... Brand Preview          [EXISTS] BusinessPreviewPage
│  ├── /dashboard/launch ............ Launch Mission                  [EXISTS] LaunchCenterPage
│  │   ├── Product Launch Commander ............... owner REAL-077
│  │   ├── Post-Launch Commander .................. owner REAL-078
│  │   ├── Product Scale Engine ................... owner REAL-079
│  │   ├── Product Retirement Engine .............. owner REAL-080
│  │   ├── Go-Live Checklist ...................... owner REAL-049
│  │   └── Live Operations Mode ................... owner REAL-036
│  ├── /dashboard/operations ........ Commerce Operations (Orders)    [EXISTS] OrdersPage
│  │   ├── First Order Operations ................. owner REAL-039
│  │   ├── Global Order Intelligence .............. owner REAL-040
│  │   ├── Post-Purchase Intelligence ............. owner REAL-041
│  │   ├── Global Operational Command Center ...... owner REAL-037
│  │   └── Live Commercial Investigations ......... owner REAL-063
│  ├── Advertising ................................. [NEW SURFACE / UNROUTED ASSET AdsPage] owner REAL-038
│  ├── Profit & Operating Cost ..................... [NEW SURFACE / UNROUTED ASSET ProfitPage]
│  │   ├── Empire Economics ....................... owner REAL-019
│  │   ├── Financial Command Center ............... owner REAL-020
│  │   ├── Revenue Forecast ....................... owner REAL-081
│  │   ├── Cashflow Engine ........................ owner REAL-082
│  │   └── Investment Engine ...................... owner REAL-083
│  ├── Expansion ................................... [NEW SURFACE]
│  │   ├── Global Expansion Command ............... owner REAL-065
│  │   ├── Global Expansion Score ................. owner REAL-089
│  │   └── Category Expansion Engine .............. owner REAL-029
│  ├── AI Team ..................................... [UNROUTED ASSET AiTeamPage]
│  │   ├── AI Chief of Commerce ................... owner REAL-031
│  │   ├── AI Chief of Growth ..................... owner REAL-032
│  │   └── AI Chief of Customer ................... owner REAL-033
│  └── Reports ..................................... [NEW SURFACE]
│      ├── Master Completion Ledger ............... owner MCL (master-completion-ledger)
│      ├── ESIS Review Package .................... owner empire-self-inspection
│      ├── V1 Completion / Sign-Off ............... owner REAL-070 / version-1-completion
│      └── Strategic / Commercial Memory .......... owner REAL-060 / REAL-043
│
└─ SYSTEM
   ├── /dashboard/infrastructure .... Infrastructure                  [EXISTS] InfrastructurePage
   │   ├── /infrastructure/marketplaces ......... owner marketplace-connection-engine
   │   ├── /infrastructure/suppliers ............ owner supplier-intelligence / CJ
   │   ├── /infrastructure/payments ............. owner live-payment-engine
   │   └── Operational Access (OAR) ............... owner operational-access
   ├── Billing ...................................... [UNROUTED ASSET BillingPage] owner empire-economics / live-payments
   └── /dashboard/settings .......... Empire Settings                 [EXISTS] SettingsPage
       ├── /settings/profile ..................... owner identity-registry / auth
       ├── Platform Preparation .................. owner REAL-021
       └── Governance & Doctrine (read-only) ..... owner empire-governance-doctrine + constitution
```

**Navigation rule:** Specialist surfaces are reached from their **section hub**, never as 20 stacked panels on Mission Home. Mission Home becomes a *briefing + routing* surface (see Part 8 debt item D-1).

---

## PART 3 — Grand King Experience (`founder` / `admin` role)

The Grand King has full empire authority. Journey, end to end:

```
Login
  → recognized via platformIdentity as Grand King (owner empire-ux-identity-doctrine + auth)
  ↓
Mission Home (Executive Headquarters)
  → "What happened overnight?" CEO morning brief (ESS) + top mission + blockers
  → single primary action: Execute today's mission
  ↓
Empire Command Center
  → full executive view: Council debate, surveillance signals, global ops, financial command
  ↓
SUCCESS-001
  → the one number that matters: progress to USD 100K net profit + blocking programs
  ↓
Product Discovery / Business Intelligence
  → what should we sell? Eye signals → candidates → commercial scores
  ↓
Supplier Intelligence
  → who supplies it, at what cost, what risk
  ↓
Marketplace Intelligence
  → where to sell: country/marketplace differences, price, shipping
  ↓
Executive Debate (Visual)
  → chiefs argue the case visually; Soul synthesizes a single recommendation (never executes)
  ↓
Approvals Center
  → King approves / rejects / defers: listings, spend, expansion, scale
  ↓
Operating Cost / Profit
  → unit economics, cashflow, net-profit-before-vanity verdict
  ↓
Reports
  → MCL completion, ESIS review, decision history, strategic memory
  ↓
Settings
  → identity, platform prep, connectors, read-only governance
```

**Governance is visible at every hop:** debate and approval surfaces always show "Soul recommends → King decides," and money-moving actions are gated behind the Approval Bar (Part 6).

---

## PART 4 — Founder / Brand-Builder Experience (`operator` role)

A **separate, minimal** experience for a brand operator who builds and runs a single brand workspace — **not** the empire.

- **Entry:** same Login; role `operator` resolves to a reduced shell.
- **Default surface:** **Brand Workspace** (`/dashboard/brands`), not Executive HQ.
- **Visible sections:** Brand Workspace, Brand Detail/Preview, Launch (their brand only), Commerce Operations (their orders), Profit (their brand), Settings/Profile.
- **Hidden / removed:** Empire Command Center, SUCCESS-001 empire view, Executive Debate, Soul Decision Chamber, Approvals Center (empire-level), Strategic Center, Reports (empire), World Map, Market Share, Expansion command, AI Team governance, Infrastructure/OAR admin, Governance doctrine editing.
- **No Grand King controls:** operators can *propose* but cannot *approve* empire-level money-moving actions; those route up to the Grand King's Approval Center.
- **Complexity budget:** at most 6 nav items; every page answers the 3 questions with one KPI and one action.
- **Owner of role gating:** `backend/src/auth/permissions.ts` (`ROLE_PERMISSIONS.operator`) + `empire-ux-identity-doctrine` for visual identity.

> **Terminology note / debt:** in code `founder` is the Grand King superuser; the "brand builder" persona maps to `operator`. The collision is logged as debt item D-9 (owner: empire-ux-identity-doctrine + auth).

---

## PART 5 — Every Screen

For each screen: **Purpose · Primary decision · Primary KPI · Primary action · Widgets/Panels/Cards · Buttons · Navigation · Dependencies · Owner module.**

### 5.1 Landing (`/`) — [EXISTS]
- **Purpose:** Convert visitor → login; state what EmpireAI is.
- **Primary decision:** Enter the empire (sign in).
- **Primary KPI:** n/a (marketing).
- **Primary action:** "Enter Command" → `/login`.
- **Widgets:** hero, value props, CTA.
- **Buttons:** Sign in.
- **Navigation:** → Login.
- **Dependencies:** none (static).
- **Owner:** `frontend` (LandingPage) · identity copy owner empire-ux-identity-doctrine.

### 5.2 Login (`/login`) — [EXISTS]
- **Purpose:** Authenticate; resolve role + platformIdentity.
- **Primary decision:** Authenticate.
- **Primary KPI:** n/a.
- **Primary action:** Sign in.
- **Widgets:** credential form, error state.
- **Buttons:** Sign in.
- **Navigation:** success → Mission Home (Grand King) or Brand Workspace (operator).
- **Dependencies:** `/auth`, AuthContext, session-store.
- **Owner:** auth + identity-registry.

### 5.3 Mission Home / Executive Headquarters (`/dashboard`) — [EXISTS]
- **Purpose:** Morning briefing + route to the day's work.
- **Primary decision:** What is today's single most important mission?
- **Primary KPI:** Progress to USD 100K net profit (from SUCCESS-001 / MCL) + Revenue/Profit today.
- **Primary action:** "Execute mission" (top mission).
- **Widgets/Panels:** CEO morning brief (ESS), Today's Mission hero, Blocker panel, Operation First Dollar progress, Recommended Next Actions (MissionPanel), Empire Health (Stripe/Shopify/CJ), Launch Queue, Eye Alerts, Executive Brief.
- **Buttons:** Execute mission · Open Command Center · Generate brief.
- **Navigation:** → Command Center, Launch, specialist hubs.
- **Dependencies:** `useEmpireDashboard` aggregates many endpoints.
- **Owner:** **REAL-051 (unified-grand-king-headquarters)** as the Mission Home aggregator; polish owner REAL-091.
- **Note:** currently overloaded with ~20 panels → see debt D-1.

### 5.4 Empire Command Center (`/dashboard/command`) — [EXISTS]
- **Purpose:** Full executive operating view across council, surveillance, global ops, finance.
- **Primary decision:** Where to intervene across the empire today.
- **Primary KPI:** Empire health score + commercial confidence.
- **Primary action:** Drill into the highest-severity signal / open the active debate.
- **Widgets:** Executive Council, Executive Surveillance, Global Command Center, Global Operational Command Center, Financial Command Center, Global Marketplace Distribution.
- **Buttons:** Open debate · Review approvals · Open module surface.
- **Navigation:** → Executive Debate, Approvals, Operations, Finance.
- **Dependencies:** executive-council, executive-surveillance, global-command-center.
- **Owner:** global-command-center + EC + ESS; polish REAL-091.

### 5.5 SUCCESS-001 (`/dashboard/success-001`) — [EXISTS]
- **Purpose:** The one mission — USD 100K net profit.
- **Primary decision:** What unblocks the next dollar?
- **Primary KPI:** Net-profit progress %, phase, blocking programs.
- **Primary action:** Open the next blocking program's action.
- **Widgets:** progress hero, blocking-programs list, readiness review (REAL-069), milestone tracker.
- **Buttons:** Resolve blocker · View readiness.
- **Navigation:** → blocking owner surfaces (OAR, supplier, commerce).
- **Dependencies:** success-001-command-center, MCL, operational-access.
- **Owner:** **REAL-035** (+ readiness REAL-069).

### 5.6 Business Intelligence / Product Discovery (`/dashboard/intelligence`) — [EXISTS]
- **Purpose:** Decide what to sell.
- **Primary decision:** Which product candidate advances to supplier/debate.
- **Primary KPI:** Commercial score of top candidate.
- **Primary action:** Advance candidate → pipeline.
- **Widgets:** candidate list, Eye signals, scores, CIS opportunities, watchlist.
- **Buttons:** Advance · Watch · Dismiss.
- **Navigation:** → Supplier Intelligence, Executive Debate.
- **Dependencies:** product-discovery-opportunity-engine, eye-series, CIS, live-product-intelligence (REAL-013).
- **Owner:** product-discovery-opportunity-engine (+ CIS, REAL-013).

### 5.7 Brand Workspace (`/dashboard/brands`) + Detail + Preview — [EXISTS]
- **Purpose:** Build/manage brand portfolios (primary surface for operators).
- **Primary decision:** Which brand to advance / preview / launch.
- **Primary KPI:** Brand readiness %, approved vs needs-attention count.
- **Primary action:** Open brand → preview → launch.
- **Widgets:** brand cards, readiness, preview studio, build package.
- **Buttons:** Open · Preview · Request approval.
- **Navigation:** → Brand Detail → Brand Preview → Launch.
- **Dependencies:** business-opportunity-workspace, business-preview-studio, business-build-engine.
- **Owner:** business-opportunity-workspace (+ preview/build studios).

### 5.8 Launch Mission (`/dashboard/launch`) — [EXISTS]
- **Purpose:** Take an approved product live and operate it.
- **Primary decision:** Approve go-live / scale / retire.
- **Primary KPI:** Launch readiness %, products ready vs blocked.
- **Primary action:** Approve launch (governed).
- **Widgets:** launch queue, go-live checklist, scale candidates, retirement recommendations, live operations mode.
- **Buttons:** Approve go-live · Scale · Retire (all gated).
- **Navigation:** → Approvals, Operations.
- **Dependencies:** REAL-077/078/079/080/049/036.
- **Owner:** product-launch-commander (REAL-077) hub.

### 5.9 Commerce Operations / Orders (`/dashboard/operations`) — [EXISTS]
- **Purpose:** Run live orders, fulfillment, post-purchase.
- **Primary decision:** Which operational gap/investigation to act on.
- **Primary KPI:** Orders today, fulfillment health, open investigations.
- **Primary action:** Resolve top operational investigation.
- **Widgets:** order list, first-order ops, order intelligence, post-purchase, operational command center, live investigations.
- **Buttons:** Resolve · Contact supplier · Refund review.
- **Navigation:** → Infrastructure (connectors), Profit.
- **Dependencies:** REAL-039/040/041/037/063, customer-order-pipeline, live-cj-fulfillment.
- **Owner:** global-operational-command-center (REAL-037) hub.

### 5.10 Infrastructure (`/dashboard/infrastructure/*`) — [EXISTS]
- **Purpose:** Connect and govern external systems.
- **Primary decision:** Which connector to connect/fix to unblock revenue.
- **Primary KPI:** Real-commerce readiness %, revenue-blocking gaps.
- **Primary action:** Connect / verify the highest-priority access.
- **Widgets:** marketplaces, suppliers, payments tabs; OAR registry; credential health.
- **Buttons:** Connect · Verify · Rotate credential.
- **Navigation:** sub-tabs marketplaces/suppliers/payments.
- **Dependencies:** operational-access, marketplace-connection-engine, live-payment-engine, reality-integration.
- **Owner:** operational-access (OAR) + connection engines.

### 5.11 Empire Settings (`/dashboard/settings`, `/settings/profile`) — [EXISTS]
- **Purpose:** Identity, platform prep, governance (read-only).
- **Primary decision:** Configure identity/platform; review doctrine.
- **Primary KPI:** Platform preparation readiness %.
- **Primary action:** Complete next platform-prep step.
- **Widgets:** profile, platform prep checklist, governance/doctrine viewer (read-only).
- **Buttons:** Save · Mark step done.
- **Navigation:** profile sub-route.
- **Dependencies:** identity-registry, founder-platform-preparation (REAL-021), doctrine catalogs.
- **Owner:** identity-registry + REAL-021.

### 5.12 Command surfaces to promote from panels → screens [NEW SURFACE]
Each already has a backend owner and is currently only a Mission Home/Command panel or dispatch-only. Spec pattern: **Purpose = make the owner's decision; Primary KPI = owner's headline metric; Primary action = the governed decision; Owner = listed.**

| Screen | Purpose | Primary decision | Primary KPI | Primary action | Owner |
|---|---|---|---|---|---|
| Executive Debate (Visual) | See chiefs debate a case | Accept/route Soul recommendation | Consensus / confidence | Send to Approvals | REAL-055 / executive-visual-debate |
| Soul Decision Chamber | Single synthesized recommendation | Trust / defer recommendation | Soul recommendation strength | Defer to King | REAL-056 |
| Approvals Center | Decide pending money-moving items | Approve / reject / defer | # awaiting King | Approve (gated) | GKR + EC + REAL-086 |
| Strategic Center | Long-term roadmaps | Pick strategic priority | Roadmap progress | Set priority | REAL-067 |
| Mission Command | Generated missions | Queue / approve mission | Expected ROI · confidence | Approve mission | REAL-057 |
| Execution Timeline | Sequence of events | Re-sequence / unblock | Upcoming events | Open event | REAL-058 |
| King Decision History | Audit prior decisions | Review/learn | Decisions logged | Re-open decision | REAL-086 |
| World Operations Map | Geographic state | Where to expand/fix | Profit by country | Drill country | REAL-052 |
| Global Business Health | 8-dimension health | Worst dimension to fix | Overall health score | Open weakest | REAL-061 |
| Market Share | Share vs potential | Where to capture share | Current vs potential share | Open opportunity | REAL-053 |
| Product Portfolio | Group/curate products | Scale/retire grouping | Portfolio profit | Act on group | REAL-054 |
| Supplier Intelligence | Supplier choice/risk | Switch/keep supplier | CJ readiness · risk count | Resolve risk | SUP / REAL-015 / REAL-071 |
| Marketplace Intelligence | Where/how to sell | Country/marketplace pick | Price/shipping advantage | Open market | REAL-073/074/075/076/072 |
| Advertising | Ad efficiency | Pause/scale spend | ROAS / spend efficiency | Adjust (gated) | REAL-038 |
| Profit & Operating Cost | Unit economics | Spend before/after profit | Net profit · margin | Approve spend (gated) | REAL-019 / REAL-020 |
| Expansion | Next market/category | Approve expansion | Expansion score | Approve (gated) | REAL-065/089/029 |
| AI Team | Chief recommendations | Accept chief advice | Chief confidence | Route to debate | REAL-031/032/033 |
| Reports | Empire truth | Read/sign off | Completion % · review verdict | Export / sign-off | MCL / ESIS / REAL-070 |
| Commercial Explorer (global search) | Explore everything | Navigate to entity | n/a | Open entity | REAL-066 |

> **Built-but-unrouted page components** found in `frontend/src/pages` (reuse, do not rebuild): `ProfitPage`, `AdsPage`, `SuppliersPage`, `AiTeamPage`, `BillingPage`, `IntelligencePage`. These are existing assets to wire into the tree above (debt D-2).

---

## PART 6 — Global Components

Reuse existing chrome; specify gaps with existing owners. No new framework.

| Component | State today | Spec | Owner |
|---|---|---|---|
| **Executive Header (TopNav)** | EXISTS | Store name, store status pill, today's profit snippet, notifications bell, profile menu | command-center-polish (REAL-091) |
| **Sidebar** | EXISTS | 3 sections (Command/Workspaces/System), collapsible, icons | REAL-091 |
| **Mobile Nav** | EXISTS | primary 4 + "more" sheet | REAL-091 |
| **Notifications** | **STUB** (bell has no handler) | Notification center fed by ESS signals + Eye alerts + credential expiry; grouped by severity | executive-surveillance (ESS) + eye-series; wiring REAL-091 |
| **Mission Panel** | EXISTS | "Recommended Next Actions" list with execute links | mission-engine (frontend) + REAL-057 source |
| **Next Actions** | PARTIAL | Prioritized, deduped, governed action queue | empire-priority-engine (REAL-090) + REAL-057 |
| **Search** | **MISSING** | Global entity search (product/supplier/country/marketplace) | commercial-explorer (REAL-066) |
| **Command Palette** | **MISSING** | Keyboard ⌘K nav + actions, role-filtered | REAL-091 (chrome) sourcing routes/paths |
| **Quick Actions** | **MISSING** | Context action cluster per surface (approve, launch, connect) | REAL-091 + owning module per action |
| **Approval Bar** | **MISSING (first-class need)** | Persistent governed bar: pending count, approve/reject/defer, shows "Soul recommends → King decides" | grand-king-revenue-pipeline (GKR) + executive-council; history REAL-086 |
| **AI Assistant Panel** | **MISSING** | Ask-the-brain side panel via `/brain/dispatch`; read-only suggestions, never auto-executes | brain dispatch + ai-chief-of-* (REAL-031/032/033) |

**Component law:** the Approval Bar and AI Assistant Panel must visually reinforce governance — assistant proposes, King disposes; nothing executes from chrome.

---

## PART 7 — Business Workflow (end-to-end user journey)

```
Idea
  → Business Intelligence: signals → candidate         owner product-discovery + eye-series + REAL-013
  ↓
Product
  → candidate scored, advanced to pipeline             owner CIS + grand-king-revenue-pipeline (GKR)
  ↓
Supplier
  → sourcing, cost, risk, CJ readiness                 owner supplier-intelligence + REAL-015 + REAL-071
  ↓
Pricing
  → price/margin by market, shipping cost              owner REAL-075 + REAL-076 + empire-economics (REAL-019)
  ↓
Marketplace
  → where to list; country/marketplace differences     owner global-marketplace-operations + REAL-073/074/072
  ↓
[ Executive Debate → Soul recommends → King approves ]  owner REAL-055 / REAL-056 / EC / GKR   (GOVERNANCE GATE)
  ↓
Advertising
  → launch spend, ROAS, scale/pause                    owner REAL-038
  ↓
Orders
  → fulfillment, post-purchase, investigations         owner REAL-039/040/041/037/063
  ↓
Profit
  → net profit before vanity; cashflow verdict         owner REAL-019/020/082/083
  ↓
Expansion
  → next product/category/country/marketplace          owner REAL-065/089/029 + REAL-052/053
  ↺ (feeds back into Idea via strategic + commercial memory: REAL-067 / REAL-060 / REAL-043)
```

Every stage maps to an existing surface in Part 2; the **single governance gate** (debate → soul → King) sits between Marketplace and Advertising and is reinforced by the Approval Bar everywhere money moves.

---

## PART 8 — UX Debt Register

Every weakness → an **existing** owner. No invented modules.

| ID | Weakness | Consequence | Owner |
|---|---|---|---|
| **D-1** | Mission Home overloaded (~20 stacked panels) | Violates "action-first"; user cannot find the one decision | **REAL-051** (unified-grand-king-headquarters) + polish **REAL-091** |
| **D-2** | Built page components unrouted (`ProfitPage`, `AdsPage`, `SuppliersPage`, `AiTeamPage`, `BillingPage`, `IntelligencePage`) | Backend value invisible; dead frontend assets | **REAL-091** (chrome/routing) + owners REAL-038/019/020 (Profit/Ads), SUP (Suppliers), REAL-031–033 (AI Team) |
| **D-3** | Notifications bell is a stub (no handler) | "What happened?" unanswered between sessions | **ESS** (executive-surveillance) + eye-series; wiring REAL-091 |
| **D-4** | No global Search | Cannot jump to an entity; forces panel hunting | **REAL-066** (commercial-explorer) |
| **D-5** | No Command Palette / Quick Actions | Slow navigation; actions buried | **REAL-091** |
| **D-6** | No persistent Approval Bar | Governance gate not first-class; approvals scattered | **GKR** + **EC** + history **REAL-086** |
| **D-7** | No AI Assistant Panel | "Why?" requires manual digging | brain dispatch + **REAL-031/032/033** |
| **D-8** | Many command modules are panel-only/dispatch-only (no screen) — Debate, Soul, Strategic Center, Timeline, World Map, Market Share, Portfolio | Deep desks missing; everything crammed on Home | owners REAL-055/056/067/058/052/053/054 |
| **D-9** | Role terminology collision (`founder` = Grand King; brand builder = `operator`) | Confusing identity/permission model | empire-ux-identity-doctrine + auth (`permissions.ts`) |
| **D-10** | Operating Cost / Profit has no dedicated surface (panel only) | Profit-before-vanity hard to enforce visually | **REAL-019** + **REAL-020** |
| **D-11** | Reports scattered (MCL, ESIS, sign-off live in markdown/panels) | No single executive truth surface | MCL + empire-self-inspection + **REAL-070** |
| **D-12** | Marketplace/Supplier intelligence depth not navigable | Where/who-to-sell decisions shallow in UI | global-marketplace-operations + SUP + REAL-073/074/075/076/071 |
| **D-13** | Mission Home metric verdicts inconsistent (raw values without verdict in places) | Violates "show me, don't tell me" | **REAL-091** + HealthGrid usage |
| **D-14** | No empty/loading/error consistency guarantee across new surfaces | Fragile perceived quality | **REAL-092** (ux-review-preparation) via `PageStates` |
| **D-15** | Operator (brand) experience not separated in shell | Operators see empire controls they cannot use | auth `permissions.ts` + empire-ux-identity-doctrine |

---

## PART 9 — Implementation Roadmap (queueable UX missions — DO NOT IMPLEMENT)

Each mission is a self-contained, reviewable UX increment. **Roadmap only.**

| Mission | Title | Outcome | Primary debt closed | Primary owner(s) |
|---|---|---|---|---|
| **UX-001** | Mission Home decomposition | Home = brief + top mission + blockers + next actions only; heavy panels move to hubs | D-1, D-13 | REAL-051, REAL-091 |
| **UX-002** | Global chrome: Approval Bar | Persistent governed approve/reject/defer bar | D-6 | GKR, EC, REAL-086 |
| **UX-003** | Notifications center | Bell → grouped ESS/Eye/credential alerts | D-3 | ESS, eye-series |
| **UX-004** | Command Palette + Quick Actions | ⌘K nav + context actions, role-filtered | D-5 | REAL-091 |
| **UX-005** | Global Search surface | Commercial Explorer as global search | D-4 | REAL-066 |
| **UX-006** | Route the unrouted assets | Wire Profit/Ads/Suppliers/AI Team/Billing/Intelligence pages | D-2 | REAL-091 + owners |
| **UX-007** | Executive Debate + Soul screens | Promote debate/soul panels to surfaces | D-8 | REAL-055, REAL-056 |
| **UX-008** | Approvals Center screen | Full pending-decisions desk + history | D-6 | GKR, EC, REAL-086 |
| **UX-009** | Profit & Operating Cost surface | Economics + financial command + cashflow | D-10 | REAL-019, REAL-020, REAL-082/083 |
| **UX-010** | Marketplace Intelligence hub | Country/marketplace/price/shipping desks | D-12 | global-marketplace-operations, REAL-073/074/075/076 |
| **UX-011** | Supplier Intelligence hub | SUP + loop + global supplier market | D-12 | SUP, REAL-015, REAL-071 |
| **UX-012** | World Map + Market Share + Portfolio | Geographic + share + portfolio surfaces | D-8 | REAL-052, REAL-053, REAL-054 |
| **UX-013** | Strategic Center + Mission Command + Timeline | Long-term planning desks | D-8 | REAL-067, REAL-057, REAL-058 |
| **UX-014** | Reports surface | MCL + ESIS + V1 sign-off + memory in one desk | D-11 | MCL, ESIS, REAL-070, REAL-060/043 |
| **UX-015** | AI Assistant Panel | Ask-the-brain side panel (read-only) | D-7 | brain dispatch, REAL-031/032/033 |
| **UX-016** | Operator (Brand) experience split | Reduced shell + permission-gated nav | D-9, D-15 | auth, empire-ux-identity-doctrine |
| **UX-017** | Verdict + state consistency pass | HealthGrid verdicts + PageStates everywhere | D-13, D-14 | REAL-091, REAL-092 |

Suggested sequencing: UX-001 → UX-002 → UX-003/004/005 (chrome) → UX-006 → desks (UX-007…UX-014) → UX-015 → UX-016 → UX-017 (final consistency pass).

---

## PART 10 — Version 1 UX Completion Definition

**"UX Complete (V1)"** means all of the following are true — verified by review, not by new architecture:

1. **Three-question rule:** every routed screen answers *What happened? / Why? / What next?* above the fold (verified by REAL-092 ux-review-preparation).
2. **One primary action per screen**, and every money-moving action is gated through the **Approval Bar** with visible "Soul recommends → King decides."
3. **No orphan surfaces:** every built page component is routed or intentionally removed (D-2 closed); every command module with user value has a reachable surface or is consciously panel-scoped.
4. **Mission Home is a briefing, not a dumping ground** (D-1 closed): ≤ the brief, top mission, blockers, next actions, and links to hubs.
5. **Global chrome complete:** Header, Sidebar, Mobile Nav, Notifications, Search, Command Palette, Quick Actions, Approval Bar, AI Assistant Panel all functional (no stubs).
6. **Two coherent role experiences:** Grand King (full) and Operator/Brand (reduced), permission-gated in `auth/permissions.ts`, visually governed by empire-ux-identity-doctrine.
7. **Verdict consistency:** every KPI carries a verdict (HEALTHY/WATCH/ACT) via HealthGrid/StatusBadge; no raw numbers without meaning (D-13 closed).
8. **State consistency:** every surface has loading/empty/error states via `PageStates` (D-14 closed).
9. **Governance never bypassed in UI:** debate → soul → approval chain visible wherever execution is possible.
10. **Debt register burned down:** D-1 … D-15 each resolved or explicitly deferred to V2 by an owner, with no invented modules.

**Out of scope for V1 UX Complete:** new visual design system rebuilds, animation frameworks, net-new backend modules, and any live-integration work (those remain commercial/engineering tracks, not UX-000).

---

*This is the master UX architecture. No screens were implemented. Implementation proceeds only via the queued UX-001 … UX-017 missions above.*
*STOP.*
