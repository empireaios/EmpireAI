# Founder Experience — EmpireAI Commerce

**Document type:** Product specification  
**Product:** EmpireAI Commerce  
**Version:** 1.0  
**Status:** Draft  
**Audience:** Product, design, engineering, marketing, and support

---

## Executive Summary

EmpireAI Commerce is an AI-operated dropshipping platform where a founder goes from signup to a live, advertising store with minimal manual effort. The founder makes three decisions—business name, product category, and which products to sell—sets an advertising budget, and then watches a unified dashboard while AI handles research, store creation, supplier connection, content production, and ad launch.

**Design north star:** The founder does as little work as possible.

**Founder-owned actions (only):**

1. Sign up
2. Choose business name
3. Choose product category
4. Select products from AI recommendations
5. Set advertising budget
6. Watch the dashboard

Everything else is automated by EmpireAI.

---

## Product Vision

Traditional e-commerce forces founders to research niches, find suppliers, build websites, write copy, create images, design ads, and manage campaigns across disconnected tools. EmpireAI Commerce replaces that stack with a single autonomous pipeline. The founder acts as an approver and observer—not an operator.

---

## Target Founder

**Primary persona: Jordan — Minimal-effort entrepreneur**

- Wants income from e-commerce without learning Shopify, ads managers, or supplier marketplaces
- Comfortable delegating decisions to AI when recommendations are explained clearly
- Willing to spend 15–20 minutes on setup, then monitor results passively
- Success means: a live store, running ads, and a dashboard that shows money in vs. money out

---

## Experience Principles

| Principle | Definition |
|-----------|------------|
| **Minimal input** | Every founder action must be essential. If AI can infer or default it, the founder never sees it. |
| **Approve, don't configure** | Founders select from AI-curated options; they do not fill forms, write copy, or connect integrations manually. |
| **Autonomous by default** | Suppliers, descriptions, images, creatives, and ad campaigns launch without founder intervention unless blocked. |
| **Single surface** | One guided setup flow, then one dashboard. No tool-hopping. |
| **Transparent automation** | The dashboard shows what AI did, why, and what it costs—so the founder trusts the system without micromanaging. |

---

## Journey Overview

```
Sign up → Business name → Category → AI product recommendations → Product selection
    → AI builds store → AI connects suppliers → AI writes descriptions → AI generates images
        → AI creates ad creatives → Set ad budget → AI launches ads → Dashboard (watch only)
```

| Step | Founder action | AI / platform action |
|------|------------------|----------------------|
| 1 | Sign up | Create account and commerce workspace |
| 2 | Choose business name | Validate availability; reserve store identity |
| 3 | Choose product category | Scope research and supplier search |
| 4 | — | Recommend winning products |
| 5 | Select products | Lock catalog and begin build pipeline |
| 6 | — | Create complete e-commerce website |
| 7 | — | Connect suppliers automatically |
| 8 | — | Create product descriptions |
| 9 | — | Create product images |
| 10 | — | Create advertising creatives |
| 11 | Set advertising budget | Prepare campaigns across channels |
| 12 | — | Launch Facebook, Instagram, and Google ads |
| 13 | Watch dashboard | Operate, fulfill, optimize autonomously |

**Target setup time:** Under 20 minutes of founder time from signup to ads live.

---

## Step 1: Sign Up

### Objective

Create an EmpireAI account with zero friction and route the founder immediately into store setup.

### Founder experience

1. Lands on EmpireAI Commerce with a single value proposition: *"Pick a name and category. AI builds and runs your store."*
2. Taps **Start my store**.
3. Creates account via email, Google, or Apple (one method only—no profile questionnaire).
4. Accepts terms of service and privacy policy inline.
5. Enters setup flow automatically—no empty dashboard, no onboarding survey.

### Platform requirements

- Create user record and empty **Commerce workspace**
- Send verification email for email signups (non-blocking—setup continues)
- Set journey state: `signed_up`
- Pre-provision payment onboarding in background (founder not prompted yet)

### Founder effort

~60 seconds. No optional fields.

### Success criteria

- 95% of signups reach Step 2 within the same session
- Zero required fields beyond authentication

---

## Step 2: Choose Business Name

### Objective

Capture the only branding decision the founder must make: what the business is called.

### Founder experience

1. Full-screen prompt: **"What do you want to call your store?"**
2. Single text input with real-time validation (length, profanity, availability).
3. AI suggests 3 alternative names below the input if the founder is undecided (optional—founder may ignore).
4. One button: **Continue**.
5. Brief confirmation: *"Great—[Store Name] it is."* Auto-advance to Step 3.

### Platform requirements

- Reserve store slug and display name
- Generate default logo mark from name (founder does not design or upload)
- Set journey state: `name_selected`
- No domain purchase flow at this step—EmpireAI subdomain assigned automatically

### Founder effort

~30 seconds. One required input.

### Success criteria

- Founder never asked for logo, tagline, color palette, or brand personality
- Name locked and visible in all subsequent steps as context

---

## Step 3: Choose Product Category

### Objective

Scope AI research to a single merchandising vertical so product recommendations are relevant and high-converting.

### Founder experience

1. Prompt: **"What type of products do you want to sell?"**
2. Visual grid of 12–20 categories (e.g., Home & Garden, Fitness, Pet Supplies, Beauty, Tech Accessories, Fashion, Outdoor, Baby, Kitchen, Phone Accessories, Jewelry, Health & Wellness).
3. Single selection only—no multi-category in v1.
4. Optional one-line tooltip per category showing example products (not demand data—keeps UI simple).
5. One button: **Find winning products**.

### Platform requirements

- Map selection to internal category taxonomy and supplier search filters
- Trigger **Product Research Agent** immediately on continue
- Set journey state: `category_selected`
- Show loading state with progress copy: *"AI is finding winning products in [Category]…"*

### Founder effort

~30 seconds. One tap selection.

### Success criteria

- No sub-category drill-down required in v1
- Research begins before founder sees Step 4 screen (perceived speed)

---

## Step 4: AI Recommends Winning Products

### Objective

Present a curated list of high-potential dropshipping products so the founder only chooses—not researches.

### Founder experience

1. Loading screen (if research not complete): animated progress with plain-language steps:
   - Scanning supplier catalogs
   - Analyzing demand and margins
   - Ranking winners for [Category]
2. Results screen: **"AI picked these winning products for [Store Name]"**
3. Each product card displays:
   - Product image (supplier or AI-enhanced thumbnail)
   - Product title (plain language)
   - Estimated profit per sale
   - Demand indicator (e.g., High / Medium with one-line reason)
   - Supplier fulfillment time
   - **AI confidence score** (visual, not numeric jargon)
4. Products pre-ranked; top 3 marked **AI Top Pick**.
5. Founder does not edit, search, or filter in v1—scroll and select only.

### AI responsibilities

| Agent | Task |
|-------|------|
| **Product Research Agent** | Scan supplier catalogs within category |
| **Market Analysis Agent** | Score demand, competition, trend velocity |
| **Margin Agent** | Calculate landed cost, retail price, profit per unit |
| **Ranking Agent** | Order results; flag top picks |

### Platform requirements

- Return 10–15 recommended products minimum
- Store research snapshot for dashboard transparency later
- Set journey state: `recommendations_ready`
- If research fails: auto-retry once, then show 8 fallback bestsellers for category (founder never sees an error wall)

### Founder effort

Zero input. Review only.

### Success criteria

- Every recommendation includes profit estimate and demand rationale
- Page loads within 30 seconds of category selection (P95)

---

## Step 5: Founder Selects Products

### Objective

Let the founder approve the catalog with the smallest possible interaction—tap to select, then confirm.

### Founder experience

1. Multi-select product cards (checkbox or tap-to-select).
2. Default: **AI Top 5 pre-selected**—founder can deselect or add more.
3. Sticky footer shows: `[N] products selected · Est. profit per order: $X–$Y`
4. One button: **Build my store** (disabled until ≥1 product selected; soft nudge toward ≥3).
5. Confirmation modal: *"AI will now build your store, connect suppliers, and prepare your ads. This takes about 10 minutes."*
6. Founder taps **Start build**—no further input required until Step 11.

### Platform requirements

- Lock selected SKUs and trigger autonomous build pipeline (Steps 6–10)
- Set journey state: `products_selected` → `build_in_progress`
- Redirect to **Build progress** screen (not dashboard yet)

### Founder effort

~2 minutes. Tap selections and confirm once.

### Success criteria

- Median selection count: 3–7 products
- 90% of founders accept at least one pre-selected Top Pick

---

## Steps 6–10: Autonomous Build Pipeline

Steps 6 through 10 run automatically after product selection. The founder sees a single **Build progress** screen—they do not perform separate actions for each step.

### Build progress screen (founder view)

Unified progress tracker with live status:

| Stage | Founder-facing label | Status |
|-------|------------------------|--------|
| 6 | Creating your store | ✓ / in progress |
| 7 | Connecting suppliers | ✓ / in progress |
| 8 | Writing product descriptions | ✓ / in progress |
| 9 | Generating product images | ✓ / in progress |
| 10 | Creating ad creatives | ✓ / in progress |

Estimated time remaining displayed. Optional: preview thumbnails appear as each stage completes. Founder waits or may leave—email sent when ready for Step 11.

---

## Step 6: AI Creates the Complete E-Commerce Website

### Objective

Generate a fully functional, customer-ready storefront without founder design or configuration.

### AI / platform deliverables

- Storefront theme derived from store name and category (no founder brand questionnaire)
- Homepage with hero, featured products, trust elements, and category navigation
- Individual product pages for every selected SKU
- Collection page, About page, Contact page, FAQ
- Cart and checkout flow
- Mobile-responsive layout
- Default policies (shipping, refund, privacy) generated for sell region
- EmpireAI subdomain live in preview (e.g., `storename.empireai.store`)

### AI responsibilities

| Agent | Task |
|-------|------|
| **Store Builder Agent** | Layout, navigation, page structure |
| **Design Agent** | Theme, typography, color system from category defaults |
| **Checkout Agent** | Cart, checkout, payment placeholder integration |

### Founder effort

None. Observer only on progress screen.

### Acceptance criteria (internal)

- All selected products have live product pages
- Checkout path complete in preview mode
- Lighthouse mobile performance score ≥80 (internal target)

---

## Step 7: AI Connects Suppliers Automatically

### Objective

Link each catalog product to a fulfillment-ready supplier so orders can be placed without founder manual sourcing.

### AI / platform deliverables

- Supplier match per SKU from integrated supplier network
- Verified product availability and variant mapping
- Cost, shipping zones, and estimated delivery windows stored per product
- Automatic order routing rules configured
- Supplier connection health status logged for dashboard

### AI responsibilities

| Agent | Task |
|-------|------|
| **Sourcing Agent** | Match SKUs to optimal supplier by cost, speed, reliability |
| **Integration Agent** | Establish API or platform connection to supplier |
| **Validation Agent** | Confirm SKU still available; flag mismatches for auto-remediation |

### Founder effort

None.

### Failure handling

- If supplier unavailable for a SKU: **Sourcing Agent** auto-swaps to next-best supplier and logs change on dashboard—founder not blocked.

---

## Step 8: AI Creates Product Descriptions

### Objective

Produce conversion-optimized, SEO-aware copy for every product and key store page without founder writing.

### AI / platform deliverables

- Product title (SEO-optimized variant stored separately if needed)
- Short description (cart / collection use)
- Long description (benefits, features, specs, objection handling)
- Bullet points for scannable mobile layout
- Meta title and meta description per product page
- About page and FAQ copy aligned to category and store name

### AI responsibilities

| Agent | Task |
|-------|------|
| **Copy Agent** | Write all customer-facing product and page copy |
| **SEO Agent** | Keywords, meta tags, URL slugs |
| **Compliance Agent** | Flag exaggerated claims; soften non-compliant language |

### Founder effort

None.

---

## Step 9: AI Creates Product Images

### Objective

Ensure every product has professional, consistent visuals without founder photography or design tools.

### AI / platform deliverables

- Hero image per product (supplier image enhanced or AI-generated lifestyle shot)
- 2–4 gallery images per product (angles, in-context use, scale reference)
- Consistent aspect ratios and background treatment across catalog
- Homepage and ad-ready crops generated from master assets
- Alt text for accessibility and SEO

### AI responsibilities

| Agent | Task |
|-------|------|
| **Image Agent** | Enhance supplier photos or generate lifestyle imagery |
| **Brand Consistency Agent** | Unify color grading and style across catalog |
| **Asset Agent** | Export web-optimized formats and store CDN upload |

### Founder effort

None.

### Quality guardrails

- No images published with visible AI artifacts (internal QA gate)
- Fallback to enhanced supplier image if generation fails

---

## Step 10: AI Creates Advertising Creatives

### Objective

Prepare ready-to-run ad assets for Facebook, Instagram, and Google before the founder sets budget.

### AI / platform deliverables

- **Facebook / Instagram:** 3–5 ad variants per hero product (image/video, primary text, headline, CTA)
- **Google:** Responsive search ad copy sets + Shopping feed assets where applicable
- Formats: square (1:1), vertical (9:16), landscape (1.91:1) as required per platform
- Ad copy aligned to product descriptions but optimized for click-through
- UTM-tagged destination URLs to store product pages
- Creative preview gallery stored for dashboard review (founder watches later—not approves pre-launch in v1)

### AI responsibilities

| Agent | Task |
|-------|------|
| **Creative Agent** | Visual ad assets from product images |
| **Ad Copy Agent** | Platform-specific copy variants |
| **Compliance Agent** | Platform policy checks (restricted claims, character limits) |

### Founder effort

None.

### Platform requirements

- Creatives staged in ad accounts (created in background during signup provisioning)
- Set journey state: `creatives_ready` when pipeline completes

---

## Step 11: Founder Sets Advertising Budget

### Objective

Capture the only financial decision the founder makes: how much to spend on ads.

### Founder experience

1. Build complete screen: **"Your store is ready. Set your ad budget to go live."**
2. Store preview link (optional—founder may skip and never visit storefront directly).
3. Simple budget control:
   - **Daily budget** slider or preset chips: $10 / $25 / $50 / $100 / Custom
   - Plain-language summary: *"$25/day ≈ $750/month across Facebook, Instagram, and Google"*
   - Estimated reach range (conservative band—not guaranteed ROAS promises)
4. Payment method on file (collected once via Stripe—card for ad spend + platform fee if applicable).
5. One button: **Launch ads and go live**.

No campaign structure, audience, keyword, or bid strategy exposed to founder.

### Platform requirements

- Split budget across Meta (Facebook + Instagram) and Google per internal allocation model (e.g., 60% Meta / 40% Google—configurable, not founder-facing)
- Set journey state: `budget_set`
- Trigger Step 12 immediately on confirm

### Founder effort

~2 minutes. One budget decision and payment method.

### Success criteria

- Zero ad-platform terminology on this screen (no CPM, CPC, lookalike, Quality Score)
- Founder can launch with default recommended budget ($25/day) in one tap

---

## Step 12: AI Launches Facebook, Instagram, and Google Ads Automatically

### Objective

Publish live campaigns across all three channels without founder entering Ads Manager or Google Ads.

### AI / platform deliverables

- **Facebook Ads:** Campaign + ad set + ads from Step 10 creatives; conversion objective (purchase)
- **Instagram Ads:** Placements via Meta Ads Manager (Feed, Stories, Reels as appropriate)
- **Google Ads:** Search and/or Shopping campaigns from generated copy and product feed
- Budget pacing synced to founder daily cap
- Conversion tracking pixel / tag installed on storefront automatically
- Campaign naming convention: `[Store Name] · EmpireAI · [Product]`

### AI responsibilities

| Agent | Task |
|-------|------|
| **Media Buying Agent** | Create campaigns, ad sets, ads, and keyword groups |
| **Targeting Agent** | Audience and geo targeting from category defaults + platform best practices |
| **Tracking Agent** | Install pixels, verify events, connect to dashboard |
| **Budget Agent** | Enforce daily cap; pause if payment fails |

### Founder experience

1. Launch confirmation animation: *"Ads are going live…"*
2. Live status per channel:
   - Facebook — Live
   - Instagram — Live
   - Google — Live
3. Auto-redirect to dashboard within 10 seconds.
4. Email: *"[Store Name] is live. Your ads are running."*

### Founder effort

None beyond Step 11 confirmation.

### Failure handling

- If one channel fails: launch remaining channels; retry failed channel automatically; surface status on dashboard—not a blocking modal.

### Platform requirements

- Set journey state: `ads_live` → `operating`
- Store status: `published`

---

## Step 13: Founder Watches the Dashboard

### Objective

Provide a single passive command center where the founder monitors performance without operating tools. AI continues to optimize, fulfill, and create—the founder observes.

### Design philosophy

The dashboard is not a workspace. It is a **monitoring screen**. No required actions. No daily tasks. No checklists the founder must complete. Optional drill-down for curiosity; default view optimized for at-a-glance confidence.

### First landing (post-launch)

Full-screen summary:

- **Store status:** Live
- **Ads status:** Running on Facebook, Instagram, Google
- **Today's spend:** $X / $[daily budget]
- **Today's revenue:** $X
- **Today's profit:** $X (revenue minus product cost minus ad spend)
- **Orders:** N

Plain-language AI summary (one sentence):

> *"Your store received 142 visits today. 3 orders placed. Ads performing best on Instagram for [Product Name]."*

### Dashboard regions

#### 1. Performance pulse (above the fold)

| Metric | Description |
|--------|-------------|
| Revenue | Gross sales today / 7d / 30d |
| Ad spend | Spend today vs. daily budget |
| Profit | Estimated net after COGS and ads |
| Orders | Count with average order value |
| ROAS | Return on ad spend (single number, trend arrow) |

Founder never configures widgets. Layout is fixed in v1.

#### 2. Live ads panel

- Per-channel status: Facebook · Instagram · Google
- Spend split visual (simple bar)
- Top-performing ad creative thumbnail
- AI note: *"Paused underperforming ad variant automatically"* (transparency log)

Founder cannot edit ads in v1. Read-only.

#### 3. Orders panel

- Real-time order feed: product, customer region, profit per order, fulfillment status
- Status labels: Processing · Shipped · Delivered
- Supplier fulfillment triggered automatically—founder does not click "fulfill"

#### 4. Store panel

- Store URL (copy button)
- Product count and quick thumbnails
- Store health: All products in stock · Payments active · SSL secure

Optional **View store** link. No store editor exposed in v1.

#### 5. AI activity log

Scrollable feed of autonomous actions:

- *"Connected backup supplier for [Product]"*
- *"Regenerated ad creative for Google—CTR improved 12%"*
- *"Increased budget allocation to Instagram based on ROAS"*
- *"Updated product description for SEO"*

Builds trust without requiring founder response.

#### 6. Budget control (only interactive element post-launch)

- Adjust daily ad budget via slider (same UX as Step 11)
- **Pause all ads** emergency toggle
- No other controls in v1

### What the founder never does post-launch

- Write or edit product copy
- Upload or swap images
- Connect or change suppliers
- Create or edit ad campaigns
- Process orders manually
- Respond to platform policy tasks (handled by AI + support escalation)

### AI ongoing responsibilities

| Agent | Dashboard-driven behavior |
|-------|---------------------------|
| **Media Buying Agent** | Bid optimization, creative rotation, pause losers |
| **Merchandising Agent** | Swap underperforming SKUs (within category, logged) |
| **Ops Agent** | Auto-fulfill orders via supplier API |
| **Analytics Agent** | Daily digest email and in-app summary |
| **Support Agent** | Handle tier-1 customer issues; escalate edge cases |

### Notifications (push / email)

- First order
- Daily summary (optional, on by default)
- Budget 80% consumed
- Ads paused (payment or policy issue—requires founder action only in these cases)

### Success criteria (30-day)

- Founder completes setup with ≤6 intentional actions total
- ≥70% of active founders log in ≤1x per week (passive check-in)
- Median founder time in-app post-launch: <5 minutes per session
- Zero support tickets for "how do I create an ad" or "how do I connect supplier"

---

## Founder Action Summary

| # | Action | Required? | Est. time |
|---|--------|-----------|-----------|
| 1 | Sign up | Yes | 1 min |
| 2 | Choose business name | Yes | 30 sec |
| 3 | Choose product category | Yes | 30 sec |
| 4 | Review AI product recommendations | Passive | 2 min |
| 5 | Select products | Yes | 2 min |
| 6–10 | Wait while AI builds | Passive | ~10 min |
| 11 | Set advertising budget | Yes | 2 min |
| 12 | Confirm ad launch | One tap | 5 sec |
| 13 | Watch dashboard | Passive | Ongoing |

**Total active founder time to go live:** ~8 minutes.

---

## Journey State Machine

```
signed_up
  → name_selected
  → category_selected
  → recommendations_ready
  → products_selected
  → build_in_progress
  → creatives_ready
  → budget_set
  → ads_live
  → operating
```

- Founders who abandon mid-build receive a resume link to the exact step.
- Build pipeline (Steps 6–10) is resumable and idempotent if interrupted.

---

## Out of Scope (v1)

- Founder-written copy, custom branding, or logo upload
- Manual supplier selection or negotiation
- Ad campaign editing, audience builder, or A/B test configuration
- Multi-store management
- Custom domain setup (EmpireAI subdomain only in v1)
- Product research outside selected category
- Founder-operated customer support inbox

---

## Key Metrics

### Funnel

| Metric | Target |
|--------|--------|
| Signup → name selected | ≥90% |
| Name → category selected | ≥95% |
| Category → products selected | ≥80% |
| Products → build complete | ≥95% (automated) |
| Build → budget set | ≥70% |
| Budget → ads live | ≥98% (automated) |

### Product health

| Metric | Target |
|--------|--------|
| Median time to ads live | <20 min founder clock; <45 min wall clock |
| Founder actions before dashboard | ≤6 |
| Stores with ads running at 7 days | ≥85% of published stores |
| Autonomous fulfillment rate | ≥99% of orders |

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Founder distrusts "black box" AI | AI activity log on dashboard; plain-language summaries |
| Ad account policy rejection | Pre-launch compliance agent; auto-resubmit; support escalation |
| Supplier stockout | Auto-swap supplier or substitute SKU; log on dashboard |
| Poor ROAS early | Media Buying Agent optimizes; optional budget pause toggle |
| Founder wants more control | Post-v1 "Advanced mode"—not exposed in v1 |

---

## Related Documents

- [Documentation index](./README.md)
- [EmpireAI platform vision](../README.md)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-06-21 | Product | Initial specification — minimal-founder 13-step journey |
