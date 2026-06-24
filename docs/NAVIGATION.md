# Navigation Map — EmpireAI Commerce

**Document type:** Product specification — information architecture & navigation  
**Product:** EmpireAI Commerce  
**Version:** 1.0  
**Status:** Draft  
**Audience:** Product, design, engineering, and QA  
**Companion docs:** [DASHBOARD_SCREENS.md](./DASHBOARD_SCREENS.md) · [FOUNDER_EXPERIENCE.md](./FOUNDER_EXPERIENCE.md) · [PRODUCT_INTELLIGENCE_ENGINE.md](./PRODUCT_INTELLIGENCE_ENGINE.md)

---

## Purpose

This document defines the complete navigation system for EmpireAI Commerce: every page, shell element (sidebar, top bar, mobile nav), onboarding flow, sub-page hierarchy, and cross-linking rules between pages.

**Design intent:** Founders never wonder where they are or how to get back. Setup is linear and guarded. The operating dashboard is persistent and reachable from any authenticated page.

---

## Navigation Architecture

EmpireAI Commerce has four navigation zones:

| Zone | Access | Shell | Primary nav |
|------|--------|-------|-------------|
| **Public** | Unauthenticated | Marketing header + footer | Header links only |
| **Auth** | Unauthenticated | Minimal centered layout | Back to landing |
| **Setup (onboarding)** | Authenticated, pre-launch | Setup header + step progress | Linear back/forward only |
| **Dashboard (operating)** | Authenticated, post-launch | Sidebar + top bar (+ mobile tabs) | Full sidebar |

```
                    ┌─────────────┐
                    │   PUBLIC    │
                    │  Landing    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
          /login      /signup      /support
              │            │
              └─────┬──────┘
                    ▼
              ┌─────────────┐
              │    SETUP    │  (linear, state-guarded)
              │  /setup/*   │
              └──────┬──────┘
                    │ publish
                    ▼
              ┌─────────────┐
              │  DASHBOARD  │  (persistent shell)
              │ /dashboard/*│
              └─────────────┘
```

---

## Complete Page Inventory

### Summary count

| Zone | Pages | Sub-pages | Total routes |
|------|-------|-----------|--------------|
| Public | 5 | 0 | 5 |
| Auth | 2 | 0 | 2 |
| Setup | 6 | 1 | 7 |
| Dashboard | 8 | 14 | 22 |
| External | 1 | 0 | 1 |
| **Total** | **22** | **15** | **37** |

---

### Public pages

| Page | Route | Description |
|------|-------|-------------|
| Landing page | `/` | Marketing home, primary acquisition |
| Pricing | `/pricing` | Plan summary and feature comparison |
| Terms of Service | `/terms` | Legal terms |
| Privacy Policy | `/privacy` | Privacy policy |
| Help center | `/support` | FAQ, contact support, setup guides |

---

### Auth pages

| Page | Route | Description |
|------|-------|-------------|
| Log in | `/login` | Returning founder authentication |
| Sign up | `/signup` | New account creation; entry to setup |

---

### Setup (founder onboarding) pages

| Page | Route | Journey step | State required |
|------|-------|--------------|----------------|
| Category selection | `/setup/category` | 1 | `signed_up` |
| AI product recommendations | `/setup/products` | 2 | `category_selected` |
| Product Intelligence loading | `/setup/products/research` | 2 (transient) | `category_selected` |
| Brand creation | `/setup/brand` | 3 | `products_selected` |
| Store build progress | `/setup/progress` | 4 | `brand_locked` |
| Launch & budget | `/setup/launch` | 5 | `creatives_ready` |

Setup pages use a **dedicated setup shell**—no dashboard sidebar until launch completes.

---

### Dashboard (operating) pages

| Page | Route | Sidebar label | Default? |
|------|-------|---------------|----------|
| Profit dashboard (Home) | `/dashboard/profit` | Home | Yes — post-launch default |
| Orders | `/dashboard/orders` | Orders | |
| Order detail | `/dashboard/orders/:orderId` | — (sub-page) | |
| Advertising | `/dashboard/ads` | Ads | |
| Suppliers | `/dashboard/suppliers` | Suppliers | |
| AI Team (roster) | `/dashboard/ai-team` | AI Team | |
| AI Employee profile | `/dashboard/ai-team/:agentSlug` | — (sub-page) | |
| Product Intelligence hub | `/dashboard/intelligence` | Intelligence | |
| Product Intelligence — catalog | `/dashboard/intelligence/products` | — (sub-page) | |
| Product Intelligence — detail | `/dashboard/intelligence/products/:productId` | — (sub-page) | |
| Billing | `/dashboard/billing` | Billing | |
| Settings | `/dashboard/settings` | Settings | |
| Settings — Account | `/dashboard/settings/account` | — (tab) | |
| Settings — Store | `/dashboard/settings/store` | — (tab) | |
| Settings — Notifications | `/dashboard/settings/notifications` | — (tab) | |
| Settings — Security | `/dashboard/settings/security` | — (tab) | |

**Route alias:** `/dashboard` redirects to `/dashboard/profit`.

---

### External pages

| Page | Route | Description |
|------|-------|-------------|
| Live storefront | `https://{store-slug}.empireai.store` | Customer-facing store; opens new tab |

---

### Overlays (not routes, but navigable surfaces)

| Surface | Triggered from | Behavior |
|---------|----------------|----------|
| Notification panel | Top bar bell | Slide-down panel; items deep-link to pages |
| Budget adjust modal | Profit, Ads, Billing | Modal; dismiss returns to origin page |
| Order detail drawer | Orders list | Drawer; URL updates to `/dashboard/orders/:orderId` |
| Ad creative preview modal | Ads dashboard | Modal only |
| Payment method modal | Billing, Setup launch | Modal |
| Pause store confirmation | Settings | Modal |
| Delete account flow | Settings → Security | Multi-step modal |

---

## Sidebar Navigation

Visible on all **dashboard** pages. Hidden during **setup** and **public/auth** zones.

### Desktop sidebar (expanded)

```
┌──────────────────────┐
│  [Store logo mark]   │
│  Store Name          │
│  ● Live              │
├──────────────────────┤
│  🏠  Home            │  → /dashboard/profit
│  📦  Orders          │  → /dashboard/orders
│  📊  Profit          │  → /dashboard/profit  (same as Home; label context)
│  📣  Ads             │  → /dashboard/ads
│  🏭  Suppliers       │  → /dashboard/suppliers
│  🤖  AI Team         │  → /dashboard/ai-team
│  🔍  Intelligence    │  → /dashboard/intelligence
│  💳  Billing         │  → /dashboard/billing
│  ⚙️  Settings        │  → /dashboard/settings
├──────────────────────┤
│  View store ↗        │  → external storefront (new tab)
│  Help                │  → /support
└──────────────────────┘
```

### Sidebar item specification

| Order | Label | Route | Icon | Badge rules |
|-------|-------|-------|------|---------------|
| 1 | Home | `/dashboard/profit` | Home | — |
| 2 | Orders | `/dashboard/orders` | Package | Unfulfilled count |
| 3 | Ads | `/dashboard/ads` | Megaphone | "Paused" if ads paused |
| 4 | Suppliers | `/dashboard/suppliers` | Factory | Alert count |
| 5 | AI Team | `/dashboard/ai-team` | Robot | — |
| 6 | Intelligence | `/dashboard/intelligence` | Search/chart | — |
| 7 | Billing | `/dashboard/billing` | Credit card | "!" if payment failed |
| 8 | Settings | `/dashboard/settings` | Gear | — |

**Note:** "Profit" and "Home" route to the same page. Sidebar shows **Home** only; "Profit" appears as the page title inside the content area. Avoid duplicate nav items.

### Collapsed sidebar (tablet)

Icons only; labels on hover tooltip. Same routes and order.

### Mobile navigation

Sidebar hidden. Replaced by **bottom tab bar**:

| Tab | Route | Label |
|-----|-------|-------|
| 1 | `/dashboard/profit` | Home |
| 2 | `/dashboard/orders` | Orders |
| 3 | `/dashboard/ads` | Ads |
| 4 | `/dashboard/ai-team` | AI |
| 5 | **More** menu | Opens sheet: Suppliers · Intelligence · Billing · Settings · View store · Help |

---

## Top Navigation

Present on all **dashboard** pages and **setup** pages (variants differ).

### Dashboard top bar

```
┌────────────────────────────────────────────────────────────────────────┐
│  [≡ collapse]   Store Name   [Live ●]   Today: +$42 profit   🔔  👤  │
└────────────────────────────────────────────────────────────────────────┘
```

| Element | Position | Action | Destination |
|---------|----------|--------|-------------|
| Sidebar collapse | Left | Toggle sidebar width | Same page |
| Store name | Left | Click | `/dashboard/settings/store` |
| Status pill | Left | Click | `/dashboard/settings/store` — Live / Building / Paused |
| Today profit snippet | Center-right | Click | `/dashboard/profit` |
| Notification bell | Right | Open panel | Notification overlay → deep links |
| Profile menu | Right | Open dropdown | See profile menu table |

### Profile dropdown menu

| Item | Destination |
|------|-------------|
| Account | `/dashboard/settings/account` |
| Billing | `/dashboard/billing` |
| Settings | `/dashboard/settings` |
| Help | `/support` |
| Log out | `/login` (session cleared) |

### Setup top bar (onboarding)

```
┌────────────────────────────────────────────────────────────────────────┐
│  EmpireAI Commerce          Step 2 of 5 · Category          🔔  👤  │
└────────────────────────────────────────────────────────────────────────┘
```

| Element | Action |
|---------|--------|
| Logo / product name | Click → `/` (marketing) if confirmed; else disabled during active setup |
| Step indicator | Shows current setup step; not clickable ahead |
| Notification bell | Setup progress emails + system notices |
| Profile menu | Account, Log out only (no dashboard links pre-launch) |

### Public top bar (marketing)

| Item | Destination |
|------|-------------|
| Logo | `/` |
| How it works | `/#how-it-works` |
| Pricing | `/pricing` |
| Help | `/support` |
| Log in | `/login` |
| Start my store | `/signup` |

---

## Founder Onboarding Flow

Linear flow with **state guards**. Founders cannot skip ahead; they may go **back** to prior completed steps only.

### Flow diagram

```
/signup
   │
   ▼
/setup/category          Step 1 · Choose category
   │
   ▼
/setup/products/research Step 2a · PIE loading (auto-advance)
   │
   ▼
/setup/products          Step 2b · Select products
   │
   ▼
/setup/brand             Step 3 · Name + brand direction
   │
   ▼
/setup/progress          Step 4 · AI build progress (auto)
   │
   ▼
/setup/launch            Step 5 · Budget + publish ads
   │
   ▼
/dashboard/profit        Operating · Home
```

### Step detail

| Step | Page | Founder action | Back allowed? | Forward trigger |
|------|------|----------------|---------------|-----------------|
| 0 | `/signup` | Create account | → `/` | Account created |
| 1 | `/setup/category` | Pick category | → `/signup` | **Find winning products** |
| 2a | `/setup/products/research` | Wait | → `/setup/category` | PIE completes (auto) |
| 2b | `/setup/products` | Select products | → `/setup/category` | **Continue with N products** |
| 3 | `/setup/brand` | Name + brand | → `/setup/products` | **Use this brand** |
| 4 | `/setup/progress` | Wait (optional preview) | → `/setup/brand` (disabled while building) | Build completes |
| 5 | `/setup/launch` | Set budget + launch | → `/setup/progress` (view only) | **Launch ads and go live** |
| — | `/dashboard/profit` | Watch dashboard | — | Auto after launch |

### Resume behavior

If a founder abandons mid-setup, email and login resume to the **last incomplete step**:

| State | Resume route |
|-------|--------------|
| `signed_up` | `/setup/category` |
| `category_selected` | `/setup/products/research` or `/setup/products` |
| `products_selected` | `/setup/brand` |
| `brand_locked` | `/setup/progress` |
| `build_in_progress` | `/setup/progress` |
| `creatives_ready` | `/setup/launch` |
| `ads_live` / `operating` | `/dashboard/profit` |

### Post-login routing

| Condition | Redirect |
|-----------|----------|
| New user, no setup progress | `/setup/category` |
| Setup in progress | Last incomplete setup route |
| Store published | `/dashboard/profit` |
| Payment failed (blocking) | `/dashboard/billing` |

---

## AI Employee Pages

### Hub page

**Route:** `/dashboard/ai-team`  
**Sidebar:** AI Team  
**Purpose:** Roster of all AI employees and global activity feed.

### Employee profile pages

| Agent | Name | Route | Role |
|-------|------|-------|------|
| Product Research | Morgan | `/dashboard/ai-team/morgan` | Product Research Lead |
| Store Builder | Casey | `/dashboard/ai-team/casey` | Store Builder |
| Copywriter | Riley | `/dashboard/ai-team/riley` | Copywriter |
| Creative Director | Jordan | `/dashboard/ai-team/jordan` | Creative Director |
| Media Buyer | Taylor | `/dashboard/ai-team/taylor` | Media Buyer |
| Sourcing Manager | Alex | `/dashboard/ai-team/alex` | Sourcing Manager |
| Operations | Sam | `/dashboard/ai-team/sam` | Operations |

### AI Team navigation hierarchy

```
/dashboard/ai-team
├── /dashboard/ai-team/morgan
├── /dashboard/ai-team/casey
├── /dashboard/ai-team/riley
├── /dashboard/ai-team/jordan
├── /dashboard/ai-team/taylor
├── /dashboard/ai-team/alex
└── /dashboard/ai-team/sam
```

### Profile page contents (each)

- Breadcrumb: AI Team → [Name]
- Status, role, responsibilities list
- Filtered activity feed (this agent only)
- **Related links** panel (varies by agent — see link matrix)

### In-page navigation (AI Team hub)

| Control | Behavior |
|---------|----------|
| Agent filter tabs | Filter feed on hub; no route change |
| Agent card click | Navigate to `/dashboard/ai-team/:agentSlug` |
| Feed item **See details** | Expand inline or modal |
| Feed item object link | Deep link to Orders, Ads, Suppliers, Intelligence |

---

## Product Intelligence Pages

Surfaces data from the [Product Intelligence Engine](./PRODUCT_INTELLIGENCE_ENGINE.md). Available during setup (selection) and post-launch (transparency).

### Page hierarchy

```
/setup/products                    ← Setup: recommendations (selection mode)
/setup/products/research         ← Setup: PIE loading state

/dashboard/intelligence            ← Hub: research summary + catalog overview
/dashboard/intelligence/products   ← Full catalog with scores (read-only)
/dashboard/intelligence/products/:productId  ← Single product PI breakdown
```

### `/dashboard/intelligence` (hub)

- Category chosen at setup
- Research run timestamp
- Summary: products analyzed, shortlisted, avg confidence
- Link to full catalog
- **Morgan** (Product Research) activity excerpt
- CTA: **View AI Team → Morgan**

### `/dashboard/intelligence/products` (catalog)

- All live store products with PI metadata
- Columns: product, rank at selection, confidence, profit est., demand, trend note
- Read-only in v1
- Row click → product detail

### `/dashboard/intelligence/products/:productId` (detail)

- Full PI breakdown: sub-scores (plain labels, not raw numbers), recommended price, profit model, seasonal note, risk flags (sanitized), "Why this product" rationale
- Links to: Suppliers (product row), Ads (if hero product), Storefront product URL

### Setup vs. dashboard mode

| Aspect | Setup (`/setup/products`) | Dashboard (`/dashboard/intelligence/*`) |
|--------|----------------------------|----------------------------------------|
| Purpose | Select products | Review why products were chosen |
| Selection | Enabled | Disabled (read-only) |
| Shell | Setup header | Dashboard sidebar |

---

## Orders Pages

### `/dashboard/orders`

- Order list with filters
- Sidebar: Orders
- Links: Profit (summary), Ads (empty state), Suppliers (fulfillment), AI Team → Sam

### `/dashboard/orders/:orderId`

- Sub-page or drawer; URL always reflects order ID
- Breadcrumb: Orders → #1042
- Links: Suppliers (supplier card), Intelligence (product), external tracking URL

---

## Advertising Pages

### `/dashboard/ads`

- Channel performance, budget, creatives, AI optimization log
- Sidebar: Ads
- Budget modal (overlay, not route)
- Links: Profit, Billing (ad spend ledger), AI Team → Taylor, Intelligence (hero products)

---

## Billing Pages

### `/dashboard/billing`

- Plan, payment method, invoices, ad spend summary
- Sidebar: Billing
- Links: Ads (spend detail), Settings (account), `/setup/launch` never (post-launch only)

---

## Settings Pages

### Tab navigation (horizontal tabs within settings)

```
/dashboard/settings              → redirects to /dashboard/settings/account
/dashboard/settings/account
/dashboard/settings/store
/dashboard/settings/notifications
/dashboard/settings/security
```

| Tab | Content | Key outbound links |
|-----|---------|-------------------|
| Account | Name, email, OAuth | Billing |
| Store | Name, URL, category, status | View store (external), Pause store |
| Notifications | Toggle matrix | — |
| Security | Password, sessions | — |

---

## Master Link Matrix

For each page, all outbound navigation targets.  
**Legend:** ● = primary nav · → = CTA/link · ↗ = new tab · — = not available

### Public & auth

| From → To | `/` | `/pricing` | `/terms` | `/privacy` | `/support` | `/login` | `/signup` |
|-----------|:---:|:----------:|:--------:|:----------:|:----------:|:--------:|:---------:|
| `/` | — | → | → footer | → footer | → | → header | → CTA |
| `/pricing` | → logo | — | → | → | → | → | → |
| `/terms` | → | — | — | → | → | — | — |
| `/privacy` | → | — | → | — | → | — | — |
| `/support` | → | → | — | — | — | → | → |
| `/login` | → | — | — | — | → | — | → |
| `/signup` | → | — | → | → | → | → | — |

After login/signup success: redirect per **Post-login routing** (not static footer links).

---

### Setup flow

| From → To | `/setup/category` | `/setup/products/research` | `/setup/products` | `/setup/brand` | `/setup/progress` | `/setup/launch` |
|-----------|:-------------------:|:--------------------------:|:-------------------:|:--------------:|:-----------------:|:---------------:|
| `/signup` | → auto | — | — | — | — | — |
| `/setup/category` | — | → on continue | — | — | — | — |
| `/setup/products/research` | ← back | — | → auto | — | — | — |
| `/setup/products` | ← change category | — | — | → continue | — | — |
| `/setup/brand` | — | — | ← back | — | → continue | — |
| `/setup/progress` | — | — | — | — | — | → on complete |
| `/setup/launch` | — | — | — | — | ← view | — |

Setup pages do **not** link to dashboard routes until launch completes. Profile menu: Account settings only via modal or `/dashboard/settings/account` if user had prior store (edge case).

---

### Dashboard — sidebar targets (all dashboard pages)

Every dashboard page includes sidebar links to:

| Target | Route |
|--------|-------|
| Home | `/dashboard/profit` |
| Orders | `/dashboard/orders` |
| Ads | `/dashboard/ads` |
| Suppliers | `/dashboard/suppliers` |
| AI Team | `/dashboard/ai-team` |
| Intelligence | `/dashboard/intelligence` |
| Billing | `/dashboard/billing` |
| Settings | `/dashboard/settings` |
| View store ↗ | External storefront |
| Help | `/support` |

Plus **top bar:** profit snippet → `/dashboard/profit`, notifications → deep links, profile menu → settings/billing/logout.

---

### Dashboard page-specific links

| Page | Additional outbound links (beyond sidebar + top bar) |
|------|------------------------------------------------------|
| **`/dashboard/profit`** | → Orders (view all) · → Ads (breakdown) · → product rows → Intelligence detail · Budget modal |
| **`/dashboard/orders`** | → Order detail `/dashboard/orders/:id` · → Ads (empty state) · → Suppliers · → AI Team → Sam |
| **`/dashboard/orders/:orderId`** | ← Orders · → Suppliers (supplier) · → Intelligence (product) · ↗ tracking URL |
| **`/dashboard/ads`** | → Profit · → Billing · → AI Team → Taylor · → Creative preview modal · Budget modal |
| **`/dashboard/suppliers`** | → Orders (alert rows) · → AI Team → Alex · → Intelligence (product row) |
| **`/dashboard/ai-team`** | → `/dashboard/ai-team/:slug` (×7) · Feed items → Orders / Ads / Suppliers / Intelligence |
| **`/dashboard/ai-team/morgan`** | ← AI Team · → Intelligence hub · → `/setup/products` (read-only snapshot link labeled "Original research") |
| **`/dashboard/ai-team/casey`** | ← AI Team · ↗ View store |
| **`/dashboard/ai-team/riley`** | ← AI Team · ↗ View store (content pages) |
| **`/dashboard/ai-team/jordan`** | ← AI Team · → Ads (creatives) |
| **`/dashboard/ai-team/taylor`** | ← AI Team · → Ads |
| **`/dashboard/ai-team/alex`** | ← AI Team · → Suppliers |
| **`/dashboard/ai-team/sam`** | ← AI Team · → Orders |
| **`/dashboard/intelligence`** | → Intelligence products · → AI Team → Morgan |
| **`/dashboard/intelligence/products`** | ← Intelligence · → Product detail |
| **`/dashboard/intelligence/products/:id`** | ← Products list · → Suppliers · → Ads · ↗ Storefront product |
| **`/dashboard/billing`** | → Ads (spend) · → Settings → Account · Payment modal |
| **`/dashboard/settings`** | Tab routes (account, store, notifications, security) · → Billing · ↗ View store · → `/support` |
| **`/dashboard/settings/store`** | ↗ View store · Pause store modal |

---

### Notification deep links

| Notification type | Destination |
|-------------------|-------------|
| New order | `/dashboard/orders/:orderId` |
| Daily profit summary | `/dashboard/profit` |
| Ad budget alert | `/dashboard/ads` |
| Payment failed | `/dashboard/billing` |
| Supplier issue | `/dashboard/suppliers` |
| AI action (generic) | `/dashboard/ai-team` |
| AI action (specific agent) | `/dashboard/ai-team/:agentSlug` |
| Product research complete (setup) | `/setup/products` |
| Build complete (setup) | `/setup/launch` |

---

## Full Platform Sitemap (tree)

```
/
├── pricing
├── terms
├── privacy
├── support
├── login
├── signup
├── setup/
│   ├── category
│   ├── products/
│   │   └── research
│   ├── brand
│   ├── progress
│   └── launch
└── dashboard/
    ├── profit                    [Home default]
    ├── orders/
    │   └── :orderId
    ├── ads
    ├── suppliers
    ├── ai-team/
    │   ├── morgan
    │   ├── casey
    │   ├── riley
    │   ├── jordan
    │   ├── taylor
    │   ├── alex
    │   └── sam
    ├── intelligence/
    │   ├── products/
    │   │   └── :productId
    │   └── (hub at /intelligence)
    ├── billing
    └── settings/
        ├── account
        ├── store
        ├── notifications
        └── security

External: https://{store-slug}.empireai.store
```

---

## Cross-Zone Linking Rules

| Rule | Description |
|------|-------------|
| **Setup isolation** | Setup pages never show dashboard sidebar. No links to `/dashboard/*` until `ads_live`. |
| **Dashboard lock** | Published founders hitting `/setup/*` redirect to `/dashboard/profit` (except read-only research snapshot links). |
| **Auth gates** | All `/setup/*` and `/dashboard/*` require authentication. Redirect to `/login?returnUrl=…` |
| **Public always open** | `/`, `/pricing`, `/terms`, `/privacy`, `/support` accessible logged out |
| **External new tab** | Storefront and ad platform previews open new tab (↗) |
| **Breadcrumb back** | Sub-pages always link back to parent (Orders → detail, AI Team → profile, Intelligence → detail) |
| **Modal dismiss** | Modals return focus to originating page; no route change on dismiss |
| **404** | Unknown routes → `/dashboard/profit` if authed + live; else `/` |

---

## Connectivity Summary Matrix

Compact view: which major sections connect (● = direct nav via sidebar, header, or primary CTA).

|  | Public | Setup | Profit | Orders | Ads | Suppliers | AI Team | Intelligence | Billing | Settings |
|--|:------:|:-----:|:------:|:------:|:---:|:---------:|:-------:|:------------:|:-------:|:--------:|
| **Public** | — | via signup | — | — | — | — | — | — | — | — |
| **Setup** | logo | linear | — | — | — | — | — | products | — | profile only |
| **Profit** | — | — | — | ● | ● | ● | ● | ● | ● | ● |
| **Orders** | — | — | → | — | → | → | → Sam | → product | — | ● |
| **Ads** | — | — | → | — | — | — | → Taylor | → product | → | ● |
| **Suppliers** | — | — | — | → | — | — | → Alex | → product | — | ● |
| **AI Team** | — | — | — | → | → | → | — | → Morgan | — | ● |
| **Intelligence** | — | snapshot | — | — | → | → | → Morgan | — | — | ● |
| **Billing** | — | — | — | — | → | — | — | — | — | ● |
| **Settings** | help | — | — | — | — | ↗ store | — | — | → | tabs |

Every dashboard section connects to **Settings**, **Billing**, and **Help** within two clicks via sidebar or profile menu.

---

## URL and State Conventions

| Convention | Rule |
|------------|------|
| Slugs | Lowercase, hyphenated (`ai-team`, not `aiTeam`) |
| Agent slugs | First name lowercase: `morgan`, `taylor` |
| IDs | Opaque UUIDs in URLs for orders and products |
| Query params | `?returnUrl=` on login; `?tab=` avoided—use path tabs for settings |
| History | Order drawer pushes URL; modal does not |
| Titles | Browser tab: `[Page] · [Store Name] · EmpireAI Commerce` |

---

## Accessibility & Navigation

- Skip link: "Skip to main content" on all pages
- Sidebar: `aria-current="page"` on active item
- Setup progress: announced to screen readers on step change
- Focus trap in modals; return focus on dismiss
- Keyboard: `G then O` shortcut to Orders (optional power-user, v2)

---

## Related Documents

- [DASHBOARD_SCREENS.md](./DASHBOARD_SCREENS.md) — Screen-level UI specification
- [FOUNDER_EXPERIENCE.md](./FOUNDER_EXPERIENCE.md) — Journey and state machine
- [PRODUCT_INTELLIGENCE_ENGINE.md](./PRODUCT_INTELLIGENCE_ENGINE.md) — Intelligence data surfaced on PI pages
- [Documentation index](./README.md)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-06-21 | Initial navigation map — 37 routes, full link matrix |
