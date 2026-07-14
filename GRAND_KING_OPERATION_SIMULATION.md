# GRAND KING OPERATION SIMULATION — EmpireAI Version 1 (UX-002A)

> **Mission:** Treat EmpireAI V1 as if it launches tomorrow. Walk the complete Grand King operating journey on the **current** implementation, find every friction point, and register each fix against an **existing owner**. No new features, no architecture, no backend redesign.
>
> **Method:** Simulation is grounded in the live code as of this mission — routed pages (`frontend/src/routes/index.tsx`), navigation (`paths.ts` / `Sidebar.tsx`), and each page's actual actions and data sources. Nothing below is hypothetical UI.

---

## 1. Executive Summary

The Grand King **command and governance spine is real and navigable today**: Login → Mission Home → SUCCESS-001 → Executive Debate → Approvals → Operating Cost → Reports all exist, each answers the four executive questions (What happened / Why / What's next / What decision is required), and they cross-link cleanly. This is launch-grade.

The **commercial money-loop is not yet operable end-to-end**. Three core steps a Grand King must perform to make the first dollar are missing or unreachable on the current build:

- **Compare suppliers** — no decision screen. `SuppliersPage.tsx` is an unrouted "coming soon" stub; Infrastructure → Suppliers is read-only connector status. The `supplier-intelligence` backend exists but is not surfaced as a choose-a-supplier screen.
- **Determine pricing** — no pricing workspace anywhere. Margin is shown read-only on discovery cards; there is no place to set price, COGS, fees, or shipping and see resulting net.
- **Launch advertising** — `AdsPage.tsx` is an unrouted stub with no nav entry and no live data feed.

Additionally: **approval verdicts do not persist** (they are recorded in component state only), **six built page files are dead/unrouted** (Profit, Ads, Suppliers, Billing, AiTeam, Intelligence), **every dashboard page re-fetches ~34 endpoints** via `useEmpireDashboard` (slow first paint), and **navigation labels drift** from the doctrine vocabulary ("Business Intelligence" = Product Discovery; "Commerce Operations" = Orders).

**Verdict on launching the full journey tomorrow: NO.** The governance spine is ready; the commercial spine requires clearing the P0/P1 backlog below first. Every item maps to an existing owner — no new architecture is required.

---

## 2. Workflow Map (routed reality)

Legend: ✅ works · 🟡 partial / read-only · 🔴 missing or unreachable

```
Login ✅  (auth, session persists)
  ↓
Mission Home ✅  /dashboard
  ↓
Find winning product ✅  /dashboard/intelligence  (ProductDiscoveryPage: Run discovery, Approve)
  ↓
Approve product → Brand Workspace ✅  /dashboard/brands  (compare/approve/reject opportunities)
  ↓
Compare suppliers 🔴  (no screen — SuppliersPage stub unrouted; Infra→Suppliers read-only)
  ↓
Determine pricing 🔴  (no pricing workspace anywhere)
  ↓
Select marketplace 🟡  /dashboard/infrastructure/marketplaces  (connect/status, not a launch picker)
  ↓
Publish ✅  /dashboard/launch  (LaunchCenterPage: Publish Business)
  ↓
Launch advertising 🔴  (AdsPage stub unrouted; no nav; no feed)
  ↓
Monitor orders 🟡  /dashboard/operations  (read-only; no fulfillment/finance trace)
  ↓
Monitor operating cost ✅  /dashboard/operating-cost  (editable; manual entry, no live feed)
  ↓
Review executive debate 🟡  /dashboard/debate  (council identity + recs; no per-topic chief stance cards)
  ↓
Approve decisions 🟡  /dashboard/approvals  (full UI; verdicts not persisted to backend)
  ↓
Track SUCCESS-001 ✅  /dashboard/success-001
  ↓
Expand 🟡  (recommendations exist; no dedicated Expansion screen; profit verification loop weak)
```

---

## 3. Step-by-Step Simulation

For each step: (1) Can the King perform it? (2) Is the next action obvious? (3) Are business decisions visible? (4) Unnecessary clicks? (5) Confusing? (6) Missing information? (7) What should be automated?

### Step 1 — Login
1. Yes. 2. Yes — lands on Mission Home. 3. n/a. 4. No. 5. No. 6. No "what changed since last login" digest. 7. Session persistence (already done); optional auto-login digest.
**Owner:** `auth`. **Severity:** P3.

### Step 2 — Mission Home (`/dashboard`)
1. Yes — true launchpad (executive summary, KPIs, shortcuts, next actions). 2. Yes — "Today's Mission" + shortcuts. 3. Yes — pending approvals, alerts, blockers as cards. 4. No. 5. No. 6. Shortcuts omit **Orders, Launch, Approvals** as one-tap buttons (Approvals reachable only via summary card). The **Ads KPI renders "—" with no destination** (dangling). 7. Daily brief should auto-generate rather than needing the "Generate brief" button.
**Owner:** Mission Home (`REAL-051`) + `operation-first-dollar` (brief). **Severity:** P2.

### Step 3 — Find winning product (`/dashboard/intelligence`)
1. Yes — "Run discovery" + "Approve Product" both work against `@/api/discovery`. 2. Yes — Approve → Brand Workspace. 3. Partial — score and margin shown, but **no "Why?" evidence** for why the AI ranked a product (the `IntelligencePage` transparency stub that would explain this is unrouted). 4. No. 5. Mild — page is titled **"Business Intelligence"** in nav but is functionally Product Discovery (vocabulary drift). 6. Per-product rationale; supplier preview; expected demand. 7. Scheduled auto-discovery so candidates are waiting each morning.
**Owner:** `product-discovery` / `REAL-066`; transparency = `IntelligencePage` (existing stub). **Severity:** P1 (evidence) / P2 (naming).

### Step 4 — Compare suppliers 🔴
1. **No.** There is no supplier-comparison decision screen. `SuppliersPage.tsx` is an unrouted "coming soon" stub; `/dashboard/infrastructure/suppliers` only shows connector status (read-only). 2. No — the King hits a dead end after approving a product. 3. No — supplier risk, landed cost, and shipping time are not shown side-by-side. 4. n/a (cannot proceed). 5. Yes — the journey silently breaks here. 6. Supplier options, risk score, landed cost, lead time, switch/keep action — all absent from the UI (data exists in `supplier-intelligence`). 7. Auto-flag risky suppliers into the approval queue.
**Owner:** `supplier-intelligence` (`SUP` / `REAL-071`) + route `SuppliersPage`. **Severity:** P0.

### Step 5 — Determine pricing 🔴
1. **No.** No pricing workspace exists anywhere; margin is display-only. 2. No. 3. No — there is no surface to set price and see COGS → fees → shipping → margin → net. 4. n/a. 5. Yes — pricing is the hinge of net profit yet has no home. 6. A pricing editor that computes landed cost and projected net per product/marketplace. 7. Auto-suggest a price band from margin target + competitor data.
**Owner:** `product-discovery` (margin) + `global-commerce-intelligence` (pricing intelligence) / `commerce-runtime`. **Severity:** P0. *(Matches "Supplier → Pricing" weak-transition flagged in `UX_BLUEPRINT_VALIDATION.md`.)*

### Step 6 — Select marketplace (`/dashboard/infrastructure/marketplaces`) 🟡
1. Partial — can connect/see marketplace status. 2. Mostly — "Start connect" is clear. 3. No — there is no country/marketplace **comparison** (price advantage, shipping, demand) to *decide where to sell*; only connection state. 4. No. 5. Mild — "connect a marketplace" is conflated with "choose the best market for this product." 6. Marketplace Intelligence (the UX-007 country/marketplace comparison) is not implemented. 7. Auto-rank best market per product.
**Owner:** `global-marketplace-operations` (`REAL-072`–`076`). **Severity:** P1.

### Step 7 — Publish (`/dashboard/launch`)
1. Yes — "Publish Business" works. 2. Yes. 3. Yes — launch readiness gate is visible. 4. No. 5. Yes (cross-step) — there is **no breadcrumb/stepper** linking product → supplier → price → marketplace → publish, so the King can publish without an explicit pre-flight checklist. 6. A consolidated pre-publish checklist. 7. Auto-prepare launch workflow once readiness = green.
**Owner:** `operation-first-dollar` / launch + launch-readiness. **Severity:** P2.

### Step 8 — Launch advertising 🔴
1. **No.** `AdsPage.tsx` is an unrouted stub; no sidebar entry; no data feed. 2. No — unreachable. 3. No — ad spend/ROAS/budget invisible. 4. n/a. 5. Yes — Mission Home shows an "Ads" KPI that leads nowhere. 6. Entire ad surface (spend, ROAS, budget control) + backend feed. 7. Auto-pause underperforming campaigns.
**Owner:** route `AdsPage` + owning execution module (`commerce-runtime` / marketing chief in `executive-council`). **Severity:** P1. *(If advertising is out of V1 scope per the contract, register as backlog and remove the dangling Ads KPI link — do not leave a dead destination.)*

### Step 9 — Monitor orders (`/dashboard/operations`) 🟡
1. Yes (view only). 2. Weak — no action from an order (acceptable for V1 dropship). 3. Partial — orders/revenue shown; no fulfillment or finance trace. 4. No. 5. No. 6. Order → fulfillment → finance reconciliation trace. 7. Auto-sync orders + status from marketplaces.
**Owner:** `commerce-runtime` / orders. **Severity:** P2. *(Matches "Orders → Finance trace" weak transition in validation.)*

### Step 10 — Monitor operating cost (`/dashboard/operating-cost`)
1. Yes — editable table, Infra/AI/Overall totals (UX-002). 2. Yes. 3. Yes — cost drivers visible and editable. 4. No. 5. No. 6. Costs are **manual** (localStorage); no live provider feed; no cost-vs-revenue trend. 7. Live cost feed from infrastructure/AI providers.
**Owner:** Operating Cost (`REAL-051` / economics). **Severity:** P2.

### Step 11 — Review executive debate (`/dashboard/debate`) 🟡
1. Yes (view). 2. Yes — "Go to Approvals". 3. Partial — consensus, confidence, and recommendations-awaiting-King are shown, but the **per-topic chief stance cards** (stance / confidence / expected profit / risk) are not in the dashboard payload, so the visual debate reads as a roster, not a debate. 4. No. 5. Mild. 6. Per-topic `chiefCards` (exist in `executive-visual-debate`/`executive-war-room` backend but not exposed via the headquarters dashboard the frontend consumes). 7. Auto-surface the highest-confidence recommendation to Mission Home.
**Owner:** `executive-council` (headquarters dashboard payload) + `ExecutiveVisualDebatePanel`. **Severity:** P2.

### Step 12 — Approve decisions (`/dashboard/approvals`) 🟡
1. Yes — full Approve / Reject / Investigate UI (UX-002) aggregating Council + SUCCESS-001 + Revenue Pipeline queues. 2. Yes. 3. Yes. 4. No. 5. No. 6. **Verdicts are not persisted** — Approve/Reject update local state only; on reload the queue returns. There is no audit trail. For an *operating* system this is a real gap. 7. Persisted approve/reject mutation + audit log.
**Owner:** `executive-council` / `grand-king` (approval mutation endpoint — wire existing `brainDispatch`, no new architecture). **Severity:** P1.

### Step 13 — Track SUCCESS-001 (`/dashboard/success-001`)
1. Yes — progress, distance, blockers, recommendations, approval queue (UX-002). 2. Yes. 3. Yes. 4. No. 5. No. 6. Could state more explicitly "the single action that moves the % today." 7. Auto-recompute progress on data change.
**Owner:** `success-001-command-center` (`REAL-035`). **Severity:** P3.

### Step 14 — Expand 🟡
1. Partial — expansion recommendations exist (`executive-council.expansionRecommendations`, `global-opportunity-board`) but there is **no dedicated Expansion screen**; they surface only inside Command Center/Reports. 2. Weak. 3. Partial. 4. No. 5. Mild — "where do I expand next, and did the last expansion actually add net profit?" has no single home. 6. Expansion decision surface + profit-verification loop (did expansion #1 increase net?). 7. Auto-propose next country/market when current is profitable.
**Owner:** `global-opportunity-board` + `grand-king-revenue-pipeline`. **Severity:** P2. *(Matches "Expansion → Profit verification" weak transition in validation.)*

---

## 4. Pain Points (ranked)

| # | Pain point | Where | Owner | Priority |
|---|---|---|---|---|
| 1 | Supplier comparison has no decision screen — journey dead-ends after product approval | Step 4 | `supplier-intelligence` (`REAL-071`) + `SuppliersPage` | **P0** |
| 2 | No pricing workspace — net-profit hinge has no home | Step 5 | `product-discovery` + `global-commerce-intelligence` | **P0** |
| 3 | Approval verdicts don't persist (vanish on reload) | Step 12 | `executive-council` / `grand-king` | **P1** |
| 4 | Advertising unreachable; dangling "Ads" KPI on Mission Home | Step 8 | route `AdsPage` + `commerce-runtime` | **P1** |
| 5 | Every page refetches ~34 endpoints → slow first paint | All | `useEmpireDashboard` (data layer) | **P1** |
| 6 | Six built page files are dead/unrouted (Profit, Ads, Suppliers, Billing, AiTeam, Intelligence) | All | each existing page file | **P1** |
| 7 | Marketplace "select" is connection status, not a choose-market comparison | Step 6 | `global-marketplace-operations` | **P1** |
| 8 | No breadcrumb/stepper across product→supplier→price→market→publish | Steps 3–7 | GC-01 Global Shell | **P2** |
| 9 | Nav vocabulary drift ("Business Intelligence", "Commerce Operations") | Nav | `paths.ts` / Sidebar | **P2** |
| 10 | Executive Debate shows roster, not per-topic chief stance cards | Step 11 | `executive-council` payload | **P2** |
| 11 | Orders → fulfillment → finance trace missing | Step 9 | `commerce-runtime` | **P2** |
| 12 | Expansion has no dedicated screen / profit-verification loop | Step 14 | `global-opportunity-board` + `grand-king-revenue-pipeline` | **P2** |

---

## 5. Missing Information

| Missing data on screen | Step | Exists in backend? | Owner |
|---|---|---|---|
| Per-product "Why?" evidence / ranking rationale | 3 | Partially (`product-discovery`) | `product-discovery` / `IntelligencePage` |
| Supplier options + risk + landed cost + lead time (side-by-side) | 4 | Yes (`supplier-intelligence`) | `supplier-intelligence` |
| Pricing math: price → COGS → fees → shipping → margin → net | 5 | Partial (margin) | `global-commerce-intelligence` |
| Country/marketplace comparison (price/shipping/demand advantage) | 6 | Yes (`global-marketplace-operations`) | `global-marketplace-operations` |
| Ad spend / ROAS / budget | 8 | No live feed | `commerce-runtime` |
| Order → fulfillment → finance reconciliation | 9 | Partial | `commerce-runtime` |
| Live operating-cost feed (vs manual) | 10 | No | Operating Cost / economics |
| Per-topic chief stance/confidence/expected-profit cards | 11 | Yes (`executive-visual-debate`) not in HQ payload | `executive-council` |
| Persisted approval verdicts + audit trail | 12 | Endpoint not wired | `executive-council` / `grand-king` |
| Expansion profit-verification (did expansion add net?) | 14 | Partial | `grand-king-revenue-pipeline` |

---

## 6. Missing UX (screens/surfaces that should exist but don't, mapped to existing owners)

| Missing surface | Owner (existing) | Notes |
|---|---|---|
| **Supplier Compare** decision screen | `supplier-intelligence` + `SuppliersPage` (route the stub) | Choose/keep supplier with risk + landed cost |
| **Pricing Workspace** | `global-commerce-intelligence` / `product-discovery` | Price → net per product/marketplace |
| **Advertising** screen | `AdsPage` (route the stub) + `commerce-runtime` | Or formally backlog + remove dangling KPI |
| **Marketplace Intelligence** (country compare) | `global-marketplace-operations` | UX-007 from the contract |
| **Profit** screen | `ProfitPage` (route the stub) + `grand-king-financial-command-center` | Net-profit view in one place |
| **Expansion** screen | `global-opportunity-board` | Next-market decisions |
| Pre-publish **checklist/stepper** | GC-01 shell + launch | Ties the commercial chain together |

> Per the freeze in `UX_IMPLEMENTATION_CONTRACT.md`, these are **enhancements to existing owners**, not new architecture. Several (Supplier Compare = UX-006, Marketplace Intelligence = UX-007) are already in the V1 contract and simply not yet implemented.

---

## 7. Automation Opportunities

| Automation | Owner | Payoff |
|---|---|---|
| Scheduled auto product discovery (candidates ready each morning) | `product-discovery` | Removes manual "Run discovery" |
| Auto-generate daily brief | `operation-first-dollar` | Mission Home self-populates |
| Auto-flag risky suppliers into approval queue | `supplier-intelligence` | Surfaces decisions proactively |
| Suggested price band from margin target + competitor data | `global-commerce-intelligence` | Speeds pricing |
| Auto-rank best marketplace per product | `global-marketplace-operations` | Removes guesswork |
| Auto-sync orders + marketplace status | `commerce-runtime` | Live ops without refresh |
| Live operating-cost feed from providers | economics / Operating Cost | Removes manual entry |
| Auto-surface top recommendation to Mission Home | `executive-council` | One-glance decisioning |
| Auto-recompute SUCCESS-001 progress on data change | `success-001-command-center` | Always-current % |
| Auto-propose next expansion when current market is profitable | `global-opportunity-board` | Growth loop |

---

## 8. UX Backlog Register

All items are enhancements to existing owners. None require new architecture.

| ID | Item | Owner (existing) | Priority |
|---|---|---|---|
| GKS-01 | Supplier Compare decision screen (route `SuppliersPage`, surface `supplier-intelligence`) | `supplier-intelligence` / `REAL-071` | **P0** |
| GKS-02 | Pricing Workspace (price→net) | `global-commerce-intelligence` / `product-discovery` | **P0** |
| GKS-03 | Persist approval verdicts + audit trail (wire `brainDispatch`) | `executive-council` / `grand-king` | **P1** |
| GKS-04 | Route Advertising (or backlog + remove dangling Ads KPI) | `AdsPage` + `commerce-runtime` | **P1** |
| GKS-05 | Optimize `useEmpireDashboard` (per-page fetch / caching) | data layer | **P1** |
| GKS-06 | Resolve 6 dead stub routes (route or remove) | each page file | **P1** |
| GKS-07 | Marketplace Intelligence comparison (UX-007) | `global-marketplace-operations` | **P1** |
| GKS-08 | Per-product "Why?" evidence (route `IntelligencePage`) | `product-discovery` | **P1** |
| GKS-09 | Pre-publish checklist / commercial stepper + breadcrumbs | GC-01 shell + launch | **P2** |
| GKS-10 | Nav vocabulary alignment ("Product Discovery", "Orders") | `paths.ts` / Sidebar | **P2** |
| GKS-11 | Per-topic chief stance cards in Debate | `executive-council` payload | **P2** |
| GKS-12 | Orders → fulfillment → finance trace | `commerce-runtime` | **P2** |
| GKS-13 | Expansion screen + profit verification loop | `global-opportunity-board` / `grand-king-revenue-pipeline` | **P2** |
| GKS-14 | Live operating-cost feed | economics / Operating Cost | **P2** |
| GKS-15 | Profit screen (route `ProfitPage`) | `grand-king-financial-command-center` | **P2** |
| GKS-16 | Mission Home shortcuts for Orders/Launch/Approvals | Mission Home (`REAL-051`) | **P3** |
| GKS-17 | Login "what changed since last visit" digest | `auth` / `operation-first-dollar` | **P3** |

---

## 9. Readiness Gate

**Governance & command spine (Login → Mission Home → SUCCESS-001 → Debate → Approvals → Operating Cost → Reports):** ready.

**Full commercial money-loop (discover → supplier → price → market → publish → ads → orders → expand):** not ready — blocked by **GKS-01 (supplier compare)** and **GKS-02 (pricing)** at P0, with **GKS-03/04/05/06** at P1.

### Ready for implementation: **NO**

The Grand King cannot complete a full commercial cycle tomorrow because supplier selection and pricing have no screen, and approvals don't persist. The **backlog itself is implementation-ready** — every fix is scoped to an existing owner with a clear priority. Clear the **P0 + P1** items (GKS-01 → GKS-08) and the journey becomes launch-ready end-to-end.

**Recommended next mission:** UX-003 — implement **GKS-01 (Supplier Compare)** and **GKS-02 (Pricing Workspace)** to close the commercial spine, since both are already V1-scoped (UX-006/UX-007 territory) in `UX_IMPLEMENTATION_CONTRACT.md`.
