# AI Employees — EmpireAI Commerce

**Document type:** Product specification  
**Product:** EmpireAI Commerce — AI Employee System  
**Version:** 1.0  
**Status:** Draft  
**Audience:** Product, AI, engineering, and support  
**Companion docs:** [FOUNDER_EXPERIENCE.md](./FOUNDER_EXPERIENCE.md) · [DASHBOARD_SCREENS.md](./DASHBOARD_SCREENS.md) · [PRODUCT_INTELLIGENCE_ENGINE.md](./PRODUCT_INTELLIGENCE_ENGINE.md) · [NAVIGATION.md](./NAVIGATION.md)

---

## Executive Summary

EmpireAI Commerce is operated by a team of **eight AI employees**—each with a defined role, decision authority, and communication protocol. Together they replace the functions of a small e-commerce company: leadership, finance, marketing, merchandising, support, advertising, fulfillment, and analytics.

The founder does not manage these employees directly. They collaborate autonomously, escalate only when necessary, and report outcomes through the **AI Team dashboard** and daily summaries.

**Design principle:** AI employees make operational decisions by default. The founder approves only high-impact, irreversible, or financial-commitment actions defined in this document.

---

## Organization Structure

```
                         ┌─────────────┐
                         │   CEO AI    │  Orchestration & priorities
                         └──────┬──────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
   ┌────▼────┐            ┌─────▼─────┐           ┌─────▼─────┐
   │ CFO AI  │            │ Analytics │           │ Marketing │
   │         │◄──────────►│    AI     │◄─────────►│    AI     │
   └────┬────┘            └─────┬─────┘           └─────┬─────┘
        │                       │                       │
        │    ┌──────────────────┼──────────────────┐    │
        │    │                  │                  │    │
   ┌────▼────▼───┐      ┌───────▼───────┐   ┌──────▼──────▼──┐
   │ Advertising │      │    Product    │   │   Operations   │
   │     AI      │◄────►│   Research AI │◄─►│      AI        │
   └──────┬──────┘      └───────────────┘   └───────┬────────┘
          │                                          │
          │              ┌───────────────┐           │
          └─────────────►│   Customer    │◄──────────┘
                         │  Support AI   │
                         └───────────────┘
```

### Roster

| AI Employee | Display name | Dashboard slug | Primary phase |
|-------------|--------------|----------------|---------------|
| CEO AI | **Avery** | `/dashboard/ai-team/avery` | All phases |
| CFO AI | **Blake** | `/dashboard/ai-team/blake` | Setup + operating |
| Marketing AI | **Quinn** | `/dashboard/ai-team/quinn` | Setup + operating |
| Product Research AI | **Morgan** | `/dashboard/ai-team/morgan` | Setup + operating |
| Customer Support AI | **Reese** | `/dashboard/ai-team/reese` | Operating |
| Advertising AI | **Taylor** | `/dashboard/ai-team/taylor` | Setup + operating |
| Operations AI | **Sam** | `/dashboard/ai-team/sam` | Setup + operating |
| Analytics AI | **Jordan** | `/dashboard/ai-team/jordan` | Operating |

---

## Shared Concepts

### Decision authority levels

| Level | Label | Meaning |
|-------|-------|---------|
| **L0** | Autonomous | AI decides and acts; logs to dashboard |
| **L1** | Autonomous with notify | AI acts; founder receives notification |
| **L2** | Soft approval | AI recommends; auto-executes after 24h unless founder objects |
| **L3** | Founder approval required | AI prepares; founder must confirm before execution |
| **L4** | Founder-only | AI advises only; founder must act manually |

EmpireAI Commerce defaults to **L0–L1** for operational tasks and **L3** for financial and brand-commitment actions.

### Inter-AI communication

AI employees communicate through an internal **EmpireAI Event Bus** (conceptual). Messages are structured events—not conversational chat.

| Event type | Example |
|------------|---------|
| `request` | Advertising AI requests product margin data from CFO AI |
| `signal` | Analytics AI signals ROAS decline to CEO AI |
| `task_complete` | Operations AI confirms order fulfilled |
| `escalation` | Customer Support AI escalates refund dispute to CEO AI |
| `approval_needed` | CEO AI routes budget increase to founder |

All events are logged on the AI Team activity feed with plain-language summaries for founders.

---

## CEO AI (Avery)

### Role

Executive orchestrator. Sets daily priorities, resolves conflicts between AI employees, and represents the "business judgment" layer. Does not execute domain tasks directly—delegates to functional AI employees.

### Responsibilities

- Orchestrate setup pipeline (category → products → brand → build → launch)
- Prioritize AI employee task queues when resources conflict
- Resolve cross-functional conflicts (e.g., Advertising wants higher budget, CFO flags margin risk)
- Generate founder-facing daily business summary (one paragraph)
- Escalate L3/L4 decisions to founder with clear recommendation
- Pause or resume store operations on founder request or critical failure
- Enforce platform policy across all AI employees

### Inputs

| Input | Source |
|-------|--------|
| Store journey state | Platform state machine |
| Signals from all AI employees | Event bus |
| Founder actions (budget, pause, settings) | Dashboard |
| Analytics summaries | Analytics AI |
| Profit and cash status | CFO AI |
| Critical alerts (payment, policy, supplier) | Operations, CFO, Support |

### Outputs

| Output | Destination |
|--------|-------------|
| Daily founder digest | Email + Profit dashboard |
| Priority directives | All AI employees via event bus |
| Escalation packages | Founder notification + dashboard |
| Store status changes (pause/resume) | Platform + all AI employees |
| Conflict resolution decisions | Event bus + activity log |

### Decisions it can make (autonomous — L0/L1)

- Reorder AI task priority when build pipeline stages conflict
- Defer non-critical Marketing or Analytics requests during launch window
- Trigger store pause on critical payment failure (notify founder — L1)
- Route Support escalations to appropriate functional AI
- Approve minor policy-safe copy changes proposed by Marketing AI
- Set internal "focus mode" (e.g., fulfillment backlog > ad optimization)

### Decisions requiring founder approval (L3/L4)

- Store publish / go-live (confirms setup complete — L3)
- Store permanent deletion or account closure (L4)
- Category or niche pivot post-launch (L3)
- Any decision explicitly flagged L3 by another AI employee
- Override of CFO AI budget hard cap (L3)
- Responding to legal, regulatory, or platform ban notices (L4 — human support loop)

### Communication with other AI employees

| AI Employee | Direction | Purpose |
|-------------|-----------|---------|
| **CFO AI** | ↔ | Budget health, spend approval requests, profit targets |
| **Analytics AI** | ← | Performance signals, anomaly alerts |
| **Marketing AI** | → | Brand and campaign priority directives |
| **Product Research AI** | → | Research priority, category scope |
| **Advertising AI** | → | Launch timing, budget allocation guidance |
| **Operations AI** | ← | Fulfillment backlog, supplier critical alerts |
| **Customer Support AI** | ← | Escalated tickets, reputation risk flags |
| **All** | → | Daily priority broadcast at store day start |

---

## CFO AI (Blake)

### Role

Financial controller. Owns profit calculation, budget enforcement, payment health, billing, and all money-in/money-out logic.

### Responsibilities

- Calculate and publish profit metrics (revenue, COGS, ad spend, net profit)
- Enforce daily ad budget cap set by founder
- Monitor payment method health and billing status
- Produce invoice and charge summaries for Billing dashboard
- Provide margin data to Advertising and Product Research AI
- Flag unprofitable products or campaigns to CEO and Advertising AI
- Model estimated profit per sale during product selection (with Product Research AI)
- Pause ad spend when payment fails or budget exhausted

### Inputs

| Input | Source |
|-------|--------|
| Order revenue and refunds | Operations AI |
| Ad spend by channel | Advertising AI |
| Product COGS and shipping costs | Operations AI / supplier data |
| Platform fees and payment processing rates | Platform config |
| Founder daily budget | Dashboard / setup launch |
| Payment method status | Billing / Stripe |
| Product pricing and margins | Product Research AI, Operations AI |

### Outputs

| Output | Destination |
|--------|-------------|
| Profit dashboard metrics | Dashboard |
| Budget pacing alerts | Founder notification + Advertising AI |
| Margin reports per SKU | Product Research, Advertising, Analytics |
| Billing page data | Billing dashboard |
| Spend authorization / denial | Advertising AI |
| Payment failure alerts | CEO AI, founder notification |

### Decisions it can make (autonomous — L0/L1)

- Recalculate profit in real time as orders and spend arrive
- Throttle or pause ad delivery when daily budget reached (L0)
- Pause all ad spend on payment failure (L1 — notify founder)
- Adjust internal margin estimates when supplier costs change
- Reject Advertising AI spend requests that exceed hard budget cap
- Generate invoice line items and billing summaries
- Flag products below minimum margin threshold to Operations and Product Research

### Decisions requiring founder approval (L3/L4)

- Increase daily ad budget above founder-set cap (L3 — founder uses budget slider)
- Add or change payment method (L4 — founder action in Billing)
- Change subscription plan tier (L3)
- Authorize refund above automatic threshold (see Support AI — CEO routes)
- Write off bad debt or approve exceptional supplier payment (L4)

### Communication with other AI employees

| AI Employee | Direction | Purpose |
|-------------|-----------|---------|
| **CEO AI** | ↔ | Financial health, escalation on budget conflicts |
| **Advertising AI** | ↔ | Spend authorization, budget pacing, ROAS vs. margin |
| **Operations AI** | ← | Order revenue, refund events, COGS updates |
| **Product Research AI** | ↔ | Profit estimation, margin floors, pricing validation |
| **Analytics AI** | → | Financial time-series data for reporting |
| **Marketing AI** | ← | Campaign cost estimates (organic only — no spend) |

---

## Marketing AI (Quinn)

### Role

Brand and organic growth owner. Creates store identity, product copy, on-site content, email templates, and non-paid marketing assets. Does not manage paid ad campaigns (Advertising AI) or financial decisions (CFO AI).

### Responsibilities

- Generate brand direction options (name styling, colors, voice, mood boards)
- Write all storefront copy: product descriptions, About, FAQ, policies (drafts)
- Produce SEO metadata for product and collection pages
- Generate organic social post drafts and email templates
- Maintain brand voice consistency across store and marketing assets
- Create launch announcement copy for founder email
- Coordinate with Operations AI on policy page accuracy (shipping/refund)

### Inputs

| Input | Source |
|-------|--------|
| Store name and category | Founder setup |
| Selected products and brand direction | Setup flow, Product Research AI |
| Brand kit tokens (colors, fonts) | Design system / Operations AI store build |
| Product attributes and images | Operations AI |
| SEO keyword targets | Product Research AI |
| Compliance rules | Platform policy engine |
| Performance of content (CTR, time on page) | Analytics AI |

### Outputs

| Output | Destination |
|--------|-------------|
| Brand kit and sample copy | Brand creation screen |
| Product descriptions and page copy | Storefront via Operations AI |
| SEO metadata | Store pages |
| Organic social drafts | AI activity log (founder optional share) |
| Policy page drafts | Operations AI for publishing |
| Creative briefs for ads | Advertising AI |

### Decisions it can make (autonomous — L0/L1)

- Generate and regenerate brand direction options (L0)
- Write and revise product copy within compliance bounds (L0)
- Adjust SEO titles and meta descriptions based on Analytics feedback (L1)
- Soften non-compliant claims flagged by policy engine (L0)
- Produce ad creative briefs and hand off to Advertising AI (L0)
- Select default brand direction if founder has not chosen within timeout (L2 — setup only, notify)

### Decisions requiring founder approval (L3/L4)

- Final brand direction lock at setup (L3 — founder taps **Use this brand**)
- Store name change post-launch (L3)
- Public-facing policy changes that alter refund/shipping terms materially (L3)
- Publishing user-generated or founder-submitted custom copy (L4 — v2 feature)
- Brand pivot or full store repositioning (L3 — CEO AI coordinates)

### Communication with other AI employees

| AI Employee | Direction | Purpose |
|-------------|-----------|---------|
| **CEO AI** | ← | Priority directives, brand pivot requests |
| **Product Research AI** | ← | Product attributes, keywords, category context |
| **Operations AI** | → | Copy and brand assets for store build |
| **Advertising AI** | → | Creative briefs, product angles, ad copy seeds |
| **Analytics AI** | ← | Content performance feedback |
| **Customer Support AI** | → | Macro templates for common customer replies |
| **CFO AI** | — | No direct spend; no direct link |

---

## Product Research AI (Morgan)

### Role

Merchandising intelligence lead. Owns the [Product Intelligence Engine](./PRODUCT_INTELLIGENCE_ENGINE.md) (PIE)—product discovery, scoring, ranking, pricing recommendations, and post-launch catalog performance advisory.

### Responsibilities

- Run category-scoped product research on founder request
- Score and rank products across demand, trend, profit, competition, risk, seasonality
- Produce recommended selling price and estimated profit per sale
- Present 10–15 product recommendations with confidence scores and rationale
- Monitor catalog performance post-launch and recommend SKU swaps
- Feed margin and demand data to CFO, Advertising, and Analytics AI
- Maintain research snapshots for Intelligence dashboard transparency
- Enforce diversity and saturation rules in recommendations

### Inputs

| Input | Source |
|-------|--------|
| Founder category selection | Setup flow |
| Supplier catalog feeds | Supplier integrations |
| Market, trend, and search data | External data sources (see PIE doc) |
| Ad performance by product class | Advertising AI, Analytics AI |
| Order conversion by SKU | Analytics AI, Operations AI |
| EmpireAI platform benchmarks | Internal aggregate data |
| Margin floors and pricing rules | CFO AI |

### Outputs

| Output | Destination |
|--------|-------------|
| Ranked product recommendations | Setup products screen |
| Product Intelligence records | Intelligence dashboard |
| Pricing and profit estimates | Setup UI, CFO AI, Profit dashboard |
| SKU swap recommendations | CEO AI, Operations AI (logged) |
| Research completion events | CEO AI (setup orchestration) |
| Confidence scores and rationales | Product cards, Intelligence detail |

### Decisions it can make (autonomous — L0/L1)

- Discover, score, and rank products within selected category (L0)
- Apply hard risk filters and exclude non-viable SKUs (L0)
- Select AI Top Pick flags for top 3 products (L0)
- Pre-select top 5 products on recommendations screen (L0)
- Recommend post-launch SKU swap to Operations AI (L1 — logged; auto-execute L2 after 48h if margin negative 14+ days)
- Refresh recommendations on rate-limited request (L0)
- Serve fallback category pack on research failure (L1 — notify founder)

### Decisions requiring founder approval (L3/L4)

- Founder product selection at setup (L3 — founder selects from recommendations)
- Category change after initial selection (L3)
- Adding products outside original category post-launch (L3)
- Delisting a product from live store (L3 if hero product; L0 if zero orders 60 days)
- Override of hard risk filter (L4 — not offered in v1)

### Communication with other AI employees

| AI Employee | Direction | Purpose |
|-------------|-----------|---------|
| **CEO AI** | ← | Research priority, category pivot requests |
| **CFO AI** | ↔ | Margin validation, profit estimation, pricing floors |
| **Marketing AI** | → | Product attributes, keywords, merchandising angles |
| **Advertising AI** | → | Hero product picks, product profit data for bid strategy |
| **Operations AI** | → | SKU list, supplier mapping requirements |
| **Analytics AI** | ↔ | Conversion data, catalog performance feedback |
| **Customer Support AI** | → | Product specs for customer inquiries |

---

## Customer Support AI (Reese)

### Role

Frontline customer service. Handles tier-1 inquiries, order status questions, and standard refunds within policy—escalates edge cases to CEO AI and human support.

### Responsibilities

- Respond to customer email and chat inquiries (when channels enabled)
- Provide order status and tracking information
- Process standard refunds and cancellations within policy limits
- Generate FAQ responses consistent with store policies
- Detect reputation risk (chargeback threats, viral complaints) and escalate
- Maintain support macro library with Marketing AI
- Log all customer interactions for Analytics AI sentiment tracking

### Inputs

| Input | Source |
|-------|--------|
| Customer messages | Support inbox / chat widget |
| Order and fulfillment status | Operations AI |
| Store policies (shipping, refund) | Marketing AI / Operations AI |
| Product details | Product Research AI |
| Refund thresholds and rules | CFO AI, platform policy |
| Escalation directives | CEO AI |

### Outputs

| Output | Destination |
|--------|-------------|
| Customer replies | Email / chat |
| Refund and cancellation requests | Operations AI, CFO AI |
| Escalation tickets | CEO AI, human support queue |
| Support activity log | AI Team dashboard |
| Sentiment and issue themes | Analytics AI |
| Reputation risk alerts | CEO AI (L1) |

### Decisions it can make (autonomous — L0/L1)

- Answer order status and tracking inquiries (L0)
- Send policy-standard shipping delay notifications (L0)
- Issue refunds within auto-approval threshold (e.g., ≤ $50, clear policy match) (L0)
- Offer store credit instead of refund when margin-positive (L1)
- Close resolved tickets (L0)
- Request Operations AI to re-ship on confirmed supplier error (L1)

### Decisions requiring founder approval (L3/L4)

- Refunds above auto-approval threshold (L3)
- Non-policy exceptions (partial refund on delivered goods) (L3)
- Chargeback response strategy (L4 — human support)
- Public response to social media complaints (L3)
- Policy interpretation changes (L3 — routes to CEO + Marketing)

### Communication with other AI employees

| AI Employee | Direction | Purpose |
|-------------|-----------|---------|
| **CEO AI** | → | Escalations, reputation risk |
| **Operations AI** | ↔ | Order status, re-ship, cancellation execution |
| **CFO AI** | → | Refund authorization requests above threshold |
| **Marketing AI** | ← | Policy text, reply templates |
| **Product Research AI** | ← | Product specs, sizing, materials |
| **Analytics AI** | → | Ticket themes, CSAT, response times |
| **Advertising AI** | → | Ad-related customer complaints (false claims) |

---

## Advertising AI (Taylor)

### Role

Paid acquisition manager. Owns all paid campaigns on Facebook, Instagram, and Google—creative deployment, targeting, bidding, budget pacing, and optimization.

### Responsibilities

- Create and launch campaigns across Meta (Facebook + Instagram) and Google
- Deploy ad creatives produced by Marketing AI and creative sub-pipeline
- Manage targeting, bidding, and budget pacing within founder daily cap
- Pause underperforming ads and scale winners autonomously
- Install and verify conversion tracking pixels/tags
- Split budget across channels per internal allocation model
- Report channel performance to Analytics and CFO AI
- Regenerate or rotate creatives when fatigue detected

### Inputs

| Input | Source |
|-------|--------|
| Founder daily budget | Setup launch, Profit/Ads dashboard |
| Spend authorization | CFO AI |
| Ad creatives and copy seeds | Marketing AI, Operations AI (product images) |
| Hero products and margins | Product Research AI |
| Conversion and ROAS data | Analytics AI, ad platforms |
| Store URL and product pages | Operations AI |
| Policy compliance rules | Platform ad policy engine |

### Outputs

| Output | Destination |
|--------|-------------|
| Live campaigns | Meta Ads, Google Ads |
| Ad performance metrics | Ads dashboard, Analytics AI |
| Spend events | CFO AI |
| Optimization actions | AI activity log |
| Creative performance signals | Marketing AI |
| Launch confirmation | CEO AI, founder notification |

### Decisions it can make (autonomous — L0/L1)

- Create campaign structure, ad sets, and ads at launch (L0)
- Set targeting and bids within platform best-practice bounds (L0)
- Pause individual underperforming ad variants (L0)
- Shift budget split between Meta and Google within ±15% of default (L1)
- Rotate or request new creatives from Marketing AI on fatigue (L0)
- Pause all ads when budget exhausted or CFO denies spend (L0)
- Adjust bids based on ROAS signals (L0)

### Decisions requiring founder approval (L3/L4)

- Initial ad launch at setup (L3 — founder sets budget and taps **Launch**)
- Daily budget increase above founder-set cap (L3)
- Resume ads after founder-initiated pause (L3)
- Expand to new ad channels beyond Meta + Google (L4 — v2)
- Run ads for products delisted by founder (L3)
- Override CFO hard budget stop (L4 — not permitted)

### Communication with other AI employees

| AI Employee | Direction | Purpose |
|-------------|-----------|---------|
| **CEO AI** | ← | Launch timing, priority during setup |
| **CFO AI** | ↔ | Spend authorization, budget pacing, margin guardrails |
| **Marketing AI** | ← | Creatives, copy, creative briefs |
| **Product Research AI** | ← | Hero products, margins, swap signals |
| **Analytics AI** | ↔ | ROAS, conversion, attribution data |
| **Operations AI** | ← | Product page URLs, stock/availability for ads |
| **Customer Support AI** | ← | Ad claim complaints |

---

## Operations AI (Sam)

### Role

Store builder and fulfillment engine. Builds the e-commerce website, connects suppliers, fulfills orders, and maintains store technical health.

### Responsibilities

- Build complete storefront (theme, pages, checkout, product listings)
- Connect and maintain supplier integrations per SKU
- Auto-fulfill orders via supplier API
- Swap suppliers on stockout or failure (with Product Research AI)
- Publish and maintain store policies, product images, and assets
- Manage store status (live, paused) as directed by CEO AI
- Handle inventory and availability signals to Advertising AI
- Execute refund and cancellation actions authorized by Support or CFO AI

### Inputs

| Input | Source |
|-------|--------|
| Selected products and brand kit | Setup flow, Marketing AI, Product Research AI |
| Copy and SEO content | Marketing AI |
| Product images | Image generation pipeline / suppliers |
| Supplier catalog and API credentials | Supplier integrations |
| Orders and payment events | Platform checkout |
| Supplier swap recommendations | Product Research AI |
| Store pause/resume commands | CEO AI |
| Refund/cancel authorizations | Customer Support AI, CFO AI |

### Outputs

| Output | Destination |
|--------|-------------|
| Live storefront | External store URL |
| Supplier connection records | Suppliers dashboard |
| Fulfillment status updates | Orders dashboard, Support AI |
| Order and revenue events | CFO AI, Analytics AI |
| Store health status | Settings, CEO AI |
| Build progress events | Setup progress screen |
| Product availability signals | Advertising AI |

### Decisions it can make (autonomous — L0/L1)

- Build store structure and publish pages from approved brand + catalog (L0)
- Connect best available supplier per SKU (L0)
- Auto-fulfill orders on payment success (L0)
- Swap supplier on stockout to next-best match (L1 — log on Suppliers dashboard)
- Apply Marketing AI copy updates to product pages (L0)
- Replace broken product images with backup assets (L0)
- Pause product listing when supplier permanently unavailable (L1)
- Execute authorized refunds and cancellations (L0)

### Decisions requiring founder approval (L3/L4)

- Initial store publish (L3 — coordinated with CEO AI at launch)
- Store pause / unpause (L3 — founder toggle in Settings; CEO can pause on emergency L1)
- Custom domain connection (L3 — v2)
- Manual product price override (L3 — v2)
- Delist hero product (L3)
- Supplier override when auto-swap changes product materially (L2 — notify, 48h auto unless objected)

### Communication with other AI employees

| AI Employee | Direction | Purpose |
|-------------|-----------|---------|
| **CEO AI** | ← | Build orchestration, pause/resume, priority |
| **Marketing AI** | ← | Copy, brand assets, policies |
| **Product Research AI** | ↔ | SKU list, swap recommendations, pricing |
| **Advertising AI** | → | URLs, availability, stock status |
| **CFO AI** | → | Revenue events, COGS, refund execution |
| **Customer Support AI** | ↔ | Order status, re-ship, cancellations |
| **Analytics AI** | → | Order funnel, fulfillment timing data |

---

## Analytics AI (Jordan)

### Role

Business intelligence layer. Aggregates data across store, ads, support, and finance—surfaces insights, anomalies, and reports. Does not execute operational changes; informs other AI employees and the founder.

### Responsibilities

- Aggregate metrics from orders, ads, profit, support, and traffic
- Produce Profit dashboard charts and trend calculations
- Generate daily and weekly AI summaries for CEO AI and founder
- Detect anomalies (ROAS drop, conversion crash, refund spike)
- Attribute revenue to channels and products
- Track AI employee performance (tasks completed, outcomes)
- Feed calibration data back to Product Research AI (aggregate benchmarks)
- Power Intelligence dashboard historical views

### Inputs

| Input | Source |
|-------|--------|
| Order and conversion events | Operations AI |
| Ad performance data | Advertising AI |
| Financial metrics | CFO AI |
| Support ticket themes and CSAT | Customer Support AI |
| Product catalog and research scores | Product Research AI |
| Store traffic and page events | Storefront analytics |
| AI activity logs | All AI employees |

### Outputs

| Output | Destination |
|--------|-------------|
| Dashboard charts and KPIs | Profit, Ads, Orders dashboards |
| Daily / weekly digest text | CEO AI, founder email |
| Anomaly alerts | CEO AI, relevant functional AI |
| Product and channel attribution | Product Research, Advertising AI |
| Platform benchmark aggregates | Product Research AI (internal) |
| AI Team performance stats | AI Team dashboard |

### Decisions it can make (autonomous — L0/L1)

- Calculate and refresh all dashboard metrics (L0)
- Generate natural-language summaries (L0)
- Emit anomaly signals when thresholds breached (L1)
- Recommend (not execute) budget or product shifts to CEO AI (L0)
- Update internal benchmarks for PIE calibration (L0)
- Classify support ticket themes (L0)

### Decisions requiring founder approval (L3/L4)

- None directly—Analytics AI is read-only on operations
- Findings that trigger L3 actions are routed through CEO AI or functional AI (e.g., CFO for budget, Advertising for campaigns)

### Communication with other AI employees

| AI Employee | Direction | Purpose |
|-------------|-----------|---------|
| **CEO AI** | → | Daily signals, anomaly escalations, digest input |
| **CFO AI** | ↔ | Financial time-series, profit validation |
| **Advertising AI** | ↔ | ROAS, attribution, conversion data |
| **Product Research AI** | → | SKU performance, calibration benchmarks |
| **Marketing AI** | → | Content performance (CTR, bounce) |
| **Operations AI** | ← | Order funnel, fulfillment SLA data |
| **Customer Support AI** | ← | Ticket volume, themes, CSAT |
| **All** | ← | Activity log ingestion |

---

## Cross-Employee Interaction Matrix

Summary of primary data flows (→ = sends to).

|  | CEO | CFO | Marketing | Product Research | Support | Advertising | Operations | Analytics |
|--|:---:|:---:|:---------:|:----------------:|:-------:|:-----------:|:----------:|:---------:|
| **CEO** | — | ↔ | → | → | ← | → | ← | ← |
| **CFO** | ↔ | — | — | ↔ | ← | ↔ | ← | → |
| **Marketing** | ← | — | — | ← | → | → | → | ← |
| **Product Research** | ← | ↔ | → | — | → | → | → | ↔ |
| **Support** | → | → | ← | ← | — | → | ↔ | → |
| **Advertising** | ← | ↔ | ← | ← | ← | — | ← | ↔ |
| **Operations** | ← | → | ← | ↔ | ↔ | → | — | → |
| **Analytics** | → | ↔ | → | → | ← | ↔ | ← | — |

---

## Setup Phase: AI Employee Sequence

During founder onboarding, AI employees activate in sequence:

| Step | Lead AI | Supporting AI |
|------|---------|---------------|
| Sign up | CEO AI | CFO AI (provision billing) |
| Category selection | Product Research AI | CEO AI |
| Product recommendations | Product Research AI | CFO AI (margins), Analytics AI (benchmarks) |
| Brand creation | Marketing AI | CEO AI |
| Store build | Operations AI | Marketing AI, Product Research AI |
| Supplier connection | Operations AI | Product Research AI |
| Copy + images | Marketing AI | Operations AI |
| Ad creatives | Marketing AI | Advertising AI |
| Budget + launch | CFO AI, Advertising AI | CEO AI (go-live orchestration) |
| Dashboard | Analytics AI | CEO AI (daily digest) |

---

## Founder Approval Summary

Consolidated list of actions requiring founder confirmation (L3/L4):

| Action | Lead AI | Approval level |
|--------|---------|----------------|
| Create account | — | Founder |
| Select product category | Product Research AI | L3 |
| Select products from recommendations | Product Research AI | L3 |
| Lock brand direction | Marketing AI | L3 |
| Set daily ad budget | CFO AI | L3 |
| Launch ads and go live | CEO AI + Advertising AI | L3 |
| Adjust daily budget (increase) | CFO AI | L3 |
| Pause / resume all ads | Advertising AI | L3 |
| Pause store | CEO AI | L3 |
| Delete account | CEO AI | L4 |
| Refunds above threshold | Customer Support AI | L3 |
| Category pivot post-launch | CEO AI + Product Research AI | L3 |
| Add out-of-category products | Product Research AI | L3 |
| Change payment method | CFO AI | L4 (founder manual) |

All other operational decisions default to autonomous execution with dashboard logging.

---

## Dashboard Visibility

Each AI employee has a profile page on the AI Team dashboard (`/dashboard/ai-team/:slug`). Founders see:

- Current status (Active / Working / Idle)
- Last action (plain language)
- Tasks completed (24h / 7d)
- Filtered activity feed
- Related links to relevant dashboard screens

CEO AI (Avery) digest appears on the **Profit dashboard** as the primary one-sentence daily summary.

---

## Sub-Agents (Internal)

Each AI employee may delegate to specialized sub-agents not shown to founders:

| AI Employee | Sub-agents (internal) |
|-------------|----------------------|
| Product Research AI | Market Analysis, Margin, Risk, Ranking |
| Marketing AI | Copy, SEO, Brand Design, Compliance |
| Operations AI | Store Builder, Sourcing, Integration, Fulfillment |
| Advertising AI | Targeting, Creative Deployment, Budget Pacing, Tracking |
| Analytics AI | Reporting, Anomaly Detection, Attribution |
| Customer Support AI | Triage, Refund, Template |

Founders interact only with the eight named AI employees.

---

## Related Documents

- [PRODUCT_INTELLIGENCE_ENGINE.md](./PRODUCT_INTELLIGENCE_ENGINE.md) — Product Research AI core system
- [DASHBOARD_SCREENS.md](./DASHBOARD_SCREENS.md) — AI Team screen specification
- [NAVIGATION.md](./NAVIGATION.md) — AI Team routes and slugs
- [FOUNDER_EXPERIENCE.md](./FOUNDER_EXPERIENCE.md) — Founder journey and approval checkpoints

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-06-21 | Initial AI employee specification — 8 roles |
