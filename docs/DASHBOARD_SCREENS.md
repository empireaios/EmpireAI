# Dashboard & Screen Specification — EmpireAI Commerce

**Document type:** UI/UX product specification  
**Product:** EmpireAI Commerce  
**Version:** 1.0  
**Status:** Draft  
**Audience:** Product, design, engineering, and QA  
**Companion doc:** [FOUNDER_EXPERIENCE.md](./FOUNDER_EXPERIENCE.md)

---

## Overview

This document defines every screen in EmpireAI Commerce—from the public landing page through the post-launch dashboard suite. Screens are grouped into two zones:

| Zone | Screens | Founder mode |
|------|---------|--------------|
| **Acquisition & setup** | Landing, Signup, Category, Recommendations, Brand, Store progress | Active (minimal input) |
| **Operating dashboard** | Orders, Profit, Advertising, Suppliers, AI Employees, Billing, Settings | Passive (watch & adjust) |

### Global layout (post-setup dashboard)

All operating screens share a persistent shell:

```
┌─────────────────────────────────────────────────────────────┐
│  Top bar: Store name · Live badge · Notifications · Profile   │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│  Side    │              Screen content area                 │
│  nav     │                                                  │
│          │                                                  │
│  · Home  │                                                  │
│  · Orders│                                                  │
│  · Profit│                                                  │
│  · Ads   │                                                  │
│  · Supply│                                                  │
│  · AI    │                                                  │
│  · Bill  │                                                  │
│  · Set   │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

**Side nav labels:** Home · Orders · Profit · Ads · Suppliers · AI Team · Billing · Settings

**Top bar (always visible in dashboard):** Store name, status pill (Live / Building / Paused), today's profit snippet, notification bell, account menu.

---

## Screen Index

| # | Screen | Route (reference) | Phase |
|---|--------|-------------------|-------|
| 1 | Landing page | `/` | Acquisition |
| 2 | Founder signup | `/signup` | Setup |
| 3 | Product category selection | `/setup/category` | Setup |
| 4 | AI product recommendations | `/setup/products` | Setup |
| 5 | Brand creation | `/setup/brand` | Setup |
| 6 | Store progress dashboard | `/setup/progress` | Setup |
| 7 | Orders | `/dashboard/orders` | Operating |
| 8 | Profit dashboard | `/dashboard/profit` | Operating |
| 9 | Advertising dashboard | `/dashboard/ads` | Operating |
| 10 | Supplier dashboard | `/dashboard/suppliers` | Operating |
| 11 | AI employee dashboard | `/dashboard/ai-team` | Operating |
| 12 | Billing | `/dashboard/billing` | Operating |
| 13 | Settings | `/dashboard/settings` | Operating |

**Default home after launch:** Profit dashboard (founder's primary question is *"Am I making money?"*).

---

## 1. Landing Page

### Purpose

Convert visitors into signups by communicating that EmpireAI Commerce builds and runs a dropshipping store with almost no effort—research, store, suppliers, content, and ads included.

### UI components

| Component | Description |
|-----------|-------------|
| **Hero section** | Headline, subheadline, primary CTA, hero illustration or product mockup animation |
| **Value prop strip** | 3–4 icon cards: AI picks products · AI builds store · AI runs ads · You watch dashboard |
| **How it works** | Horizontal 4-step timeline matching founder journey |
| **Social proof row** | Testimonial cards, store count, revenue processed (when available) |
| **Feature highlights** | Scroll sections: Product AI, Store AI, Ad AI, Dashboard |
| **Pricing teaser** | Simple plan summary with link to signup (no complex plan builder on landing) |
| **FAQ accordion** | 6–8 common questions |
| **Footer** | Links: Terms, Privacy, Support, Login |

### Buttons

| Button | Label | Action |
|--------|-------|--------|
| Primary CTA | **Start my store** | Navigate to signup |
| Secondary CTA | **See how it works** | Scroll to How it works section |
| Header | **Log in** | Navigate to login (returning users) |
| Footer | **Start my store** | Navigate to signup |

### Data displayed

- Marketing copy (static CMS content)
- Live counters if available: stores launched, orders fulfilled, ad spend managed
- No personalized or authenticated data

### User actions

- Read marketing content
- Scroll and expand FAQ items
- Click **Start my store** to begin signup
- Click **Log in** if existing account

---

## 2. Founder Signup

### Purpose

Create an EmpireAI account in under 60 seconds and drop the founder directly into setup—no empty dashboard, no lengthy questionnaire.

### UI components

| Component | Description |
|-----------|-------------|
| **Split layout** | Left: signup form. Right: animated preview of dashboard/store being built by AI |
| **Auth method tabs** | Email · Google · Apple |
| **Email form** | Email input, password input (with strength hint) |
| **Social auth buttons** | Google and Apple branded buttons |
| **Terms inline** | Checkbox + linked Terms of Service and Privacy Policy |
| **Progress indicator** | Step dots: Sign up → Category → Products → Brand → Launch |
| **Trust line** | "No credit card required to start" |

### Buttons

| Button | Label | Action |
|--------|-------|--------|
| Primary | **Continue** | Submit signup; create account; route to category selection |
| Social | **Continue with Google** | OAuth signup |
| Social | **Continue with Apple** | OAuth signup |
| Link | **Already have an account? Log in** | Navigate to login |
| Back | *(none on this screen)* | — |

### Data displayed

- Form validation messages (inline, below fields)
- Password requirements (minimal: 8+ characters)
- OAuth provider branding
- Current setup step (1 of 5)

### User actions

- Enter email and password OR use social auth
- Accept terms checkbox
- Submit to create account
- Switch to login if returning user

---

## 3. Product Category Selection

### Purpose

Capture the single merchandising scope input needed for AI product research. One tap selects the vertical; no sub-categories or free text in v1.

### UI components

| Component | Description |
|-----------|-------------|
| **Page header** | Title, one-line instruction, progress step (2 of 5) |
| **Category grid** | 12–20 cards in responsive grid (3–4 columns desktop, 2 mobile) |
| **Category card** | Icon/photo, category name, 2 example product names |
| **Selection state** | Highlight border + checkmark on selected card |
| **Sticky footer bar** | Selected category label + continue button |
| **Back link** | Return to signup (rare; session preserved) |

### Buttons

| Button | Label | Action |
|--------|-------|--------|
| Primary | **Find winning products** | Lock category; trigger AI research; navigate to recommendations (with loading) |
| Card tap | *(entire card)* | Select category (single select) |
| Secondary | **Back** | Previous step (signup) |

### Data displayed

- Category list with display names and example products
- Selected category name in footer
- Progress: Step 2 of 5
- Optional: store name from prior step shown in header breadcrumb if name collected before category in flow variant

### User actions

- Tap one category card to select
- Tap **Find winning products** to confirm
- Tap **Back** to return (optional)

---

## 4. AI Product Recommendations

### Purpose

Present AI-ranked winning products for the chosen category so the founder approves a catalog—not researches one.

### UI components

| Component | Description |
|-----------|-------------|
| **Loading state** | Full-screen or inline skeleton with animated steps: Scanning suppliers · Analyzing demand · Ranking winners |
| **Results header** | Category name, product count, estimated profit range for full selection |
| **Product card grid** | Scrollable list/grid of recommended products |
| **Product card** | Image, title, profit per sale, demand badge (High/Medium), ship time, AI Top Pick ribbon, checkbox |
| **Selection summary bar** | Sticky footer: `[N] selected · Est. profit per order $X–$Y` |
| **AI insight panel** | Collapsible sidebar (desktop) or bottom sheet (mobile): "Why these products?" summary |
| **Empty/error fallback** | Retry state with reassuring copy (never raw errors) |

### Buttons

| Button | Label | Action |
|--------|-------|--------|
| Primary | **Continue with [N] products** | Lock selection; navigate to brand creation |
| Card checkbox | *(toggle)* | Add/remove product from selection |
| Secondary | **Select AI top picks** | Pre-select top 5 ranked products |
| Link | **Change category** | Return to category selection |
| Tertiary | **Refresh recommendations** | Re-run research (rate-limited) |

### Data displayed

Per product card:

- Product thumbnail
- Product title
- Estimated profit per sale ($)
- Demand level + one-line reason (e.g., "Trending on Meta")
- Supplier fulfillment time (e.g., "5–9 days")
- AI confidence indicator (visual bar or badge)
- AI Top Pick flag (top 3–5)

Summary bar:

- Count of selected products
- Aggregate estimated profit range

### User actions

- Review AI recommendations
- Select/deselect products (default: top 5 pre-selected)
- Tap **Continue** with at least 1 product
- Optionally change category or refresh list

---

## 5. Brand Creation

### Purpose

Establish store identity with minimal founder input. Founder confirms a business name and picks from AI-generated brand directions—no manual design work.

### UI components

| Component | Description |
|-----------|-------------|
| **Page header** | Step 3 of 5, instruction: "Name your store and pick a look" |
| **Store name input** | Text field with availability check and AI name suggestions chips |
| **Brand direction carousel** | 3 AI-generated brand previews (logo mark, colors, sample hero) |
| **Brand preview card** | Mini storefront mock showing name + hero headline in selected style |
| **Live preview panel** | Larger preview updates on name or direction change |
| **AI copy snippet** | Sample tagline generated for selected direction |

### Buttons

| Button | Label | Action |
|--------|-------|--------|
| Primary | **Use this brand** | Lock name + visual direction; start store build pipeline |
| Chip | Suggested name chips | Fill store name input |
| Carousel nav | **Previous / Next** brand direction | Cycle AI brand options |
| Secondary | **Back** | Return to product selection (catalog preserved) |
| Link | **Regenerate looks** | Request 3 new brand directions from AI |

### Data displayed

- Store name (editable) with availability status (Available / Taken)
- 3 brand direction options: primary color, accent, logo mark, font style label
- Preview: store name, tagline, sample hero text
- Selected product count (context reminder)
- Progress: Step 3 of 5 (or 4 of 5 if name was earlier step)

### User actions

- Enter or select store name
- Swipe/select one of 3 brand directions
- Preview brand applied to sample storefront
- Confirm with **Use this brand**
- Optionally regenerate brand options or go back

---

## 6. Store Progress Dashboard

### Purpose

Show transparent autonomous build status while AI creates the store, connects suppliers, writes copy, generates images, and prepares ad creatives. Bridge between setup and budget/launch.

### UI components

| Component | Description |
|-----------|-------------|
| **Progress hero** | Circular or linear overall progress (0–100%) |
| **Stage checklist** | Vertical list of build stages with status icons |
| **Stage row** | Label, status (Pending / In progress / Complete / Auto-fixed), optional thumbnail preview |
| **Live preview embed** | iframe or screenshot of storefront as it builds (unlocks when store stage complete) |
| **Time estimate** | "~8 minutes remaining" dynamic countdown |
| **Completion panel** | Appears when done: store preview link + budget prompt |
| **Email capture reminder** | "We'll email you when ready" if founder leaves |
| **AI activity ticker** | Scrolling log of completed micro-tasks |

### Build stages displayed

1. Creating your e-commerce website
2. Connecting suppliers automatically
3. Writing product descriptions
4. Generating product images
5. Creating advertising creatives

### Buttons

| Button | Label | Action |
|--------|-------|--------|
| Primary (when complete) | **Set ad budget & launch** | Navigate to budget step (may live on Advertising screen or modal) |
| Secondary | **Preview store** | Open storefront preview in new tab (enabled after stage 1) |
| Tertiary | **Leave — notify me** | Confirm email; allow exit (build continues) |
| Link | **View details** per stage | Expand stage to show sub-task log |

### Data displayed

- Overall build progress percentage
- Per-stage status and timestamp
- Store name and product count
- Preview URL when available
- Sub-task log entries (e.g., "Connected supplier: AliExpress partner · SKU-4421")
- Elapsed time / estimated time remaining

### User actions

- Watch build progress (passive)
- Expand stage details for transparency
- Preview store when available
- Proceed to budget/launch when build completes
- Leave session; receive email notification

---

## 7. Orders

### Purpose

Give the founder a read-only view of every customer order and fulfillment status. Orders are processed automatically—no manual fulfill button in v1.

### UI components

| Component | Description |
|-----------|-------------|
| **Summary stat row** | Today · 7 days · 30 days order counts |
| **Filter bar** | Status tabs: All · Processing · Shipped · Delivered · Issues |
| **Search input** | Search by order ID or product name |
| **Orders table / list** | Sortable columns on desktop; card list on mobile |
| **Order row** | Order ID, date, product thumbnail, customer region, total, profit, status badge |
| **Order detail drawer** | Slide-over with line items, tracking, supplier, timeline |
| **Empty state** | Illustration + "No orders yet — ads are driving traffic" + link to Ads dashboard |
| **Issue banner** | Highlighted orders needing attention (supplier delay, address problem) |

### Buttons

| Button | Label | Action |
|--------|-------|--------|
| Tab | **All / Processing / Shipped / Delivered / Issues** | Filter list |
| Row click | *(entire row)* | Open order detail drawer |
| Drawer | **Copy tracking number** | Clipboard copy |
| Drawer | **View on store** | Open customer-facing product page |
| Export | **Export CSV** | Download orders for date range |
| Empty state | **View ad performance** | Navigate to Advertising dashboard |

### Data displayed

Summary:

- Order count (today, 7d, 30d)
- Total revenue for selected period
- Average order value

Per order:

- Order ID
- Date and time
- Product name(s) and thumbnail
- Quantity
- Customer country/region (no full PII in list view)
- Order total ($)
- Estimated profit ($)
- Fulfillment status
- Supplier name
- Tracking number (when shipped)
- Status timeline (ordered → sent to supplier → shipped → delivered)

### User actions

- Filter and search orders
- Open order details
- Copy tracking number
- Export CSV
- Navigate to ads if no orders

---

## 8. Profit Dashboard

### Purpose

Primary home screen after launch. Answer *"Am I making money?"* in one glance—revenue, costs, ad spend, and net profit with trends.

### UI components

| Component | Description |
|-----------|-------------|
| **Profit hero card** | Large net profit figure (today default) with trend vs. yesterday |
| **Period toggle** | Today · 7D · 30D · All time |
| **Metric cards row** | Revenue · Ad spend · Product costs · Net profit |
| **Profit chart** | Line or bar chart: profit over selected period |
| **Waterfall breakdown** | Visual: Revenue → minus COGS → minus ad spend → Net profit |
| **Top products by profit** | Ranked list with units sold and margin |
| **AI daily summary** | One-sentence plain-language insight |
| **Budget quick control** | Mini slider for daily ad budget (same as Advertising) |

### Buttons

| Button | Label | Action |
|--------|-------|--------|
| Toggle | **Today / 7D / 30D / All** | Change chart and metrics period |
| Link | **View all orders** | Navigate to Orders |
| Link | **View ad breakdown** | Navigate to Advertising dashboard |
| Budget | **Adjust budget** | Open budget modal or inline slider |
| Product row | **View product** | Open product detail in store preview |

### Data displayed

- Net profit (highlighted)
- Gross revenue
- Total ad spend (Meta + Google combined)
- Total product/fulfillment costs (COGS)
- Profit margin (%)
- Trend deltas vs. prior period (↑↓ with %)
- Chart data points for selected period
- Top 5 products by profit contribution
- AI summary text (e.g., "Profit up 18% — Instagram ads for [Product] leading")

### User actions

- Switch time period
- Read AI summary
- Adjust ad budget (optional quick action)
- Drill to Orders or Ads for detail
- Review top products

---

## 9. Advertising Dashboard

### Purpose

Show founders that ads are running and performing across Facebook, Instagram, and Google—without exposing campaign editors. Read-only performance + budget control only.

### UI components

| Component | Description |
|-----------|-------------|
| **Ads status banner** | Running (green) / Paused / Issue — with channel icons |
| **Budget card** | Daily budget, spent today, pacing bar (% of daily budget used) |
| **Channel performance row** | 3 cards: Facebook · Instagram · Google |
| **Channel card** | Spend, clicks, conversions, ROAS, status dot |
| **Top creatives gallery** | Thumbnails of best-performing ad creatives |
| **Spend chart** | Stacked area: spend by channel over 7/30 days |
| **ROAS chart** | Return on ad spend trend |
| **AI optimization log** | Recent autonomous actions (paused ad, shifted budget, new creative) |
| **Launch modal** *(setup only)* | Budget slider + payment method + confirm launch |

### Buttons

| Button | Label | Action |
|--------|-------|--------|
| Primary | **Adjust daily budget** | Open budget slider modal |
| Toggle | **Pause all ads** / **Resume ads** | Pause or resume all channels |
| Channel card | **View details** | Expand channel breakdown (still read-only) |
| Creative thumb | **Preview ad** | Modal with ad copy + image as seen on platform |
| Setup | **Launch ads** | Confirm budget and go live (first-time only) |
| Link | **View profit impact** | Navigate to Profit dashboard |

### Data displayed

Global:

- Ads status (Running / Paused / Error)
- Daily budget cap
- Spend today / remaining budget
- Total impressions, clicks, conversions (period)
- Blended ROAS

Per channel (Facebook, Instagram, Google):

- Status (Live / Paused / Error)
- Spend (today and period)
- Impressions
- Clicks
- CTR
- Conversions
- ROAS
- Budget allocation (% of daily total)

Creatives:

- Thumbnail, format, channel, CTR, conversions

AI log:

- Timestamp, action description, result metric

### User actions

- Monitor ad performance (passive)
- Adjust daily budget
- Pause or resume all ads
- Preview top creatives
- Launch ads (during setup completion)
- Review AI optimization log

---

## 10. Supplier Dashboard

### Purpose

Show that suppliers are connected, healthy, and fulfilling orders automatically. Transparency without requiring founder to manage supplier relationships.

### UI components

| Component | Description |
|-----------|-------------|
| **Health summary banner** | "All suppliers connected" or alert count |
| **Supplier cards grid** | One card per unique supplier linked to catalog |
| **Supplier card** | Name, logo, products linked count, avg ship time, reliability score |
| **Product-supplier table** | Product ↔ supplier mapping with status |
| **Fulfillment stats row** | Orders sent today · Avg processing time · Success rate |
| **Alert list** | Stock issues, slow shipments, auto-swaps performed |
| **Connection status indicator** | API connected / Degraded / Auto-recovered |

### Buttons

| Button | Label | Action |
|--------|-------|--------|
| Card | **View products** | Filter table to that supplier |
| Alert row | **View order** | Navigate to related order in Orders |
| Link | **View AI swap log** | Jump to AI Team log filtered to Sourcing Agent |
| Refresh | **Refresh status** | Manual health check (rate-limited) |

### Data displayed

Per supplier:

- Supplier name and platform
- Number of linked SKUs
- Average shipping time
- Reliability score (AI-calculated)
- Connection status
- Orders fulfilled (30d)
- Issue count (30d)

Per product-supplier row:

- Product name and thumbnail
- Supplier name
- Unit cost
- Stock status (In stock / Low / Auto-swapped)
- Last verified timestamp

Alerts:

- Alert type, product, timestamp, resolution (auto or pending)

### User actions

- Review supplier health (passive)
- View products per supplier
- Jump to affected orders or AI logs
- Manually refresh status

---

## 11. AI Employee Dashboard

### Purpose

Personify autonomous agents as an "AI team" so founders understand who is working on their store. Builds trust in black-box automation.

### UI components

| Component | Description |
|-----------|-------------|
| **Team roster grid** | Cards for each AI employee (agent) |
| **AI employee card** | Avatar, name, role title, status (Active / Idle / Working), last action |
| **Activity feed** | Chronological log of all agent actions across store |
| **Feed item** | Agent avatar, action description, timestamp, outcome metric |
| **Filter bar** | Filter by agent: All · Research · Store · Copy · Ads · Sourcing · Ops |
| **Performance summary** | Tasks completed (24h), issues auto-resolved, hours saved estimate |
| **Agent detail panel** | Expanded view: responsibilities, recent tasks, success rate |

### AI employees (roster)

| Name | Role | Agent |
|------|------|-------|
| **Morgan** | Product Research Lead | Product Research Agent |
| **Casey** | Store Builder | Store Builder Agent |
| **Riley** | Copywriter | Copy Agent |
| **Jordan** | Creative Director | Image + Creative Agent |
| **Taylor** | Media Buyer | Media Buying Agent |
| **Alex** | Sourcing Manager | Sourcing Agent |
| **Sam** | Operations | Ops / Fulfillment Agent |

### Buttons

| Button | Label | Action |
|--------|-------|--------|
| Card click | **View [Name]'s activity** | Filter feed to that agent |
| Filter tab | Agent name tabs | Filter activity feed |
| Feed item | **See details** | Expand task detail (before/after if applicable) |
| Link | **View related order/ad/product** | Deep link to relevant dashboard |

### Data displayed

Per AI employee:

- Name, role, avatar
- Current status (Working on X / Idle)
- Last action one-liner and timestamp
- Tasks completed (24h / 7d)

Activity feed item:

- Agent name
- Action type (Created, Updated, Paused, Swapped, Connected, Optimized)
- Object (product, ad, supplier, order)
- Plain-language description
- Timestamp
- Result (optional metric)

Summary:

- Total autonomous actions (24h)
- Issues auto-resolved count
- Estimated founder hours saved

### User actions

- Browse AI team roster (passive)
- Filter activity by agent
- Expand action details
- Navigate to related screens (orders, ads, suppliers)

---

## 12. Billing

### Purpose

Centralize payment methods, subscription/plan fees, ad spend charges, and invoices. Founder understands what they pay EmpireAI vs. what goes to ads.

### UI components

| Component | Description |
|-----------|-------------|
| **Plan summary card** | Current plan name, renewal date, included features |
| **Payment method card** | Card on file (last 4 digits), expiry, default badge |
| **Spend summary row** | This month: Platform fee · Ad spend · Total charged |
| **Upcoming charge preview** | Next billing date and estimated amount |
| **Invoices table** | Date, description, amount, status, download |
| **Ad spend ledger** | Daily ad spend charges linked to Advertising dashboard |
| **Add/update payment modal** | Stripe-style embedded form |

### Buttons

| Button | Label | Action |
|--------|-------|--------|
| Primary | **Update payment method** | Open payment modal |
| Primary | **Add payment method** | Open payment modal (if none on file) |
| Invoice row | **Download PDF** | Download invoice |
| Link | **View ad spend detail** | Navigate to Advertising dashboard |
| Link | **Change plan** | Open plan comparison modal (if tiers exist) |
| Toggle | **Email me receipts** | Opt in/out of receipt emails |

### Data displayed

- Current plan name and price
- Billing cycle and next charge date
- Payment method (type, last 4, expiry)
- Month-to-date: platform fees, ad spend pass-through, total
- Invoice history: date, invoice ID, line items summary, amount, paid status
- Failed payment alert if applicable

### User actions

- View plan and charges (passive)
- Add or update payment method
- Download invoices
- Toggle receipt emails
- Navigate to ad spend for detail
- Upgrade/downgrade plan (if available)

---

## 13. Settings

### Purpose

Manage account, store identity, notifications, and security. Minimal options—no advanced store or ad configuration in v1.

### UI components

| Component | Description |
|-----------|-------------|
| **Settings nav tabs** | Account · Store · Notifications · Security |
| **Account section** | Name, email, profile photo |
| **Store section** | Store name (read-only v1), store URL, category, timezone |
| **Notifications section** | Toggle list for email/push events |
| **Security section** | Change password, connected OAuth accounts, 2FA (future) |
| **Danger zone** | Pause store, delete account (with confirmation modals) |
| **Support link block** | Contact support, help center |

### Buttons

| Button | Label | Action |
|--------|-------|--------|
| Primary | **Save changes** | Save edited account/notification settings |
| Secondary | **Change password** | Open password modal |
| Link | **Disconnect Google/Apple** | Remove OAuth provider |
| Toggle | Per notification type | Enable/disable notification |
| Link | **Copy store URL** | Clipboard copy |
| Link | **View store** | Open live storefront |
| Danger | **Pause store** | Pause ads + hide storefront (confirm modal) |
| Danger | **Delete account** | Multi-step delete confirmation |

### Data displayed

Account:

- Full name
- Email address
- Auth providers connected
- Account created date

Store:

- Store name
- Store URL (subdomain)
- Product category
- Product count
- Store status (Live / Paused / Building)
- Created date

Notifications (each with on/off):

- First order
- Daily profit summary
- Daily ad summary
- Budget 80% alert
- Payment failure
- Supplier issue
- AI significant action digest

Security:

- Last login timestamp
- Active sessions count (future)

### User actions

- Edit name and notification preferences
- Change password
- Copy store URL or view live store
- Pause store or delete account (destructive, confirmed)
- Contact support

---

## Cross-Screen Patterns

### Empty states

Every operating screen uses consistent empty-state pattern when no data exists:

- Friendly illustration
- One-line explanation
- Single suggested action (link to Ads, AI Team, or help)

### Loading states

- Skeleton placeholders matching final layout
- Never spinners alone on full pages
- Build progress uses determinate progress when stage completion is known

### Notifications (bell icon)

| Type | Example |
|------|---------|
| Order | "New order #1042 — $34 profit" |
| Ads | "Daily budget 80% used" |
| Supplier | "Auto-swapped supplier for [Product]" |
| Billing | "Payment failed — update card" |
| AI | "Taylor paused underperforming ad" |

### Responsive behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (≥1024px) | Side nav expanded, multi-column grids |
| Tablet (768–1023px) | Side nav collapsed to icons |
| Mobile (<768px) | Bottom tab bar (Home, Orders, Ads, More), stacked cards |

### Accessibility

- Minimum 4.5:1 contrast on text
- All buttons and cards keyboard-focusable
- Status not conveyed by color alone (icons + labels)
- Chart data available in table fallback

---

## Screen Flow Diagram

```
Landing ──► Signup ──► Category ──► Recommendations ──► Brand ──► Store Progress
                                                                        │
                                        Set budget & launch ◄───────────┘
                                                │
                                                ▼
                                         Profit Dashboard (home)
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    ▼                           ▼                           ▼
                 Orders                    Advertising                  Suppliers
                    │                           │                           │
                    └───────────────────────────┼───────────────────────────┘
                                                ▼
                                          AI Employee
                                                │
                                    ┌───────────┴───────────┐
                                    ▼                       ▼
                                 Billing                Settings
```

---

## Related Documents

- [FOUNDER_EXPERIENCE.md](./FOUNDER_EXPERIENCE.md) — End-to-end founder journey
- [Documentation index](./README.md)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-06-21 | Initial screen specification for all 13 screens |
