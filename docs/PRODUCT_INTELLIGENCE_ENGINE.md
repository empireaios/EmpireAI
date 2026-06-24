# Product Intelligence Engine — EmpireAI Commerce

**Document type:** Product specification  
**Product:** EmpireAI Commerce — Product Intelligence Engine (PIE)  
**Version:** 1.0  
**Status:** Draft  
**Audience:** Product, data, engineering, and AI teams  
**Companion docs:** [FOUNDER_EXPERIENCE.md](./FOUNDER_EXPERIENCE.md) · [DASHBOARD_SCREENS.md](./DASHBOARD_SCREENS.md)

---

## Executive Summary

The **Product Intelligence Engine (PIE)** is the decision system behind EmpireAI Commerce product recommendations. When a founder selects a product category, PIE discovers candidate products from supplier and market data, scores each SKU across demand, profit, advertising potential, competition, risk, and seasonality, and returns a ranked list of 10–15 **winning products** for founder approval.

The founder never researches. PIE does.

**Output per product:** rank, recommended selling price, estimated profit per sale, demand level, advertising potential, risk flags, seasonal note, and a composite **confidence score** surfaced as a simple visual on the product card.

---

## Purpose

| Goal | Description |
|------|-------------|
| **Find** | Discover viable dropshipping SKUs within the founder's chosen category |
| **Rank** | Order candidates by predicted commercial success for a new store |
| **Recommend** | Present a curated shortlist the founder can approve in minutes |
| **Explain** | Provide plain-language rationale for every recommendation (trust, not black box) |

PIE is optimized for **new founders with no audience**—products must be sellable via paid social and search ads, not dependent on existing brand equity.

---

## Scope

### In scope (v1)

- Category-scoped product discovery and ranking
- Real-time research triggered at Step 3 of founder setup
- Composite scoring across ten dimensions (see Scoring System)
- Top 3 **AI Top Pick** designation
- Fallback catalog if live research fails
- Research snapshot stored for dashboard transparency

### Out of scope (v1)

- Cross-category discovery (founder must pick category first)
- Founder-defined search queries or filters
- Private-label or non-dropship sourcing models
- Real-time re-ranking after store launch (handled by Merchandising Agent separately)
- Guaranteed ROAS or revenue forecasts

---

## System Overview

PIE runs as an autonomous pipeline triggered when a founder confirms a product category. It completes within 30 seconds (P95) and feeds the **AI Product Recommendations** screen.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Category input │────►│  Discovery layer │────►│  Enrichment     │
│  (founder)      │     │  (supplier +     │     │  (market data,  │
└─────────────────┘     │   market scan)   │     │   trends)       │
                        └──────────────────┘     └────────┬────────┘
                                                          │
                        ┌──────────────────┐              │
                        │  Recommendation  │◄─────────────┤
                        │  output (10–15)  │     ┌────────▼────────┐
                        └──────────────────┘     │  Scoring engine │
                                                 │  (rank + price) │
                                                 └─────────────────┘
```

### Pipeline stages

| Stage | Name | Output |
|-------|------|--------|
| 1 | **Ingest** | Raw product candidates from supplier catalogs |
| 2 | **Enrich** | Market signals, trend data, competition proxies attached |
| 3 | **Score** | Dimension scores + composite Product Score |
| 4 | **Filter** | Remove hard-fail products (policy, risk, unfulfillable) |
| 5 | **Rank** | Ordered list with Top Pick flags |
| 6 | **Price** | Recommended selling price and profit per sale |
| 7 | **Package** | Founder-facing cards with confidence score and rationale |

### AI agents involved

| Agent | PIE role |
|-------|----------|
| **Product Research Agent (Morgan)** | Orchestrates pipeline; owns discovery and ranking |
| **Market Analysis Agent** | Trend detection, demand signals, seasonality |
| **Margin Agent** | Cost assembly, pricing, profit estimation |
| **Risk Agent** | Policy, quality, supplier, and saturation flags |
| **Ranking Agent** | Composite weighting, Top Pick selection, confidence calibration |

---

## Data Sources

PIE aggregates data from supplier, market, advertising, and internal platform layers. No single source is authoritative—scores are derived from cross-validation.

### 1. Supplier catalog feeds

| Source type | Data provided | Refresh cadence |
|-------------|---------------|-----------------|
| Integrated dropship networks (e.g., AliExpress partners, CJ Dropshipping, Spocket-class providers) | SKU title, images, variants, unit cost, shipping cost, ship times, stock status, supplier rating | Hourly–daily sync |
| EmpireAI supplier graph | Historical fulfillment success, auto-swap history, dispute rate | Real-time internal |

**Used for:** Discovery, profit estimation (COGS), fulfillment time, stock risk, supplier reliability.

### 2. E-commerce market signals

| Source type | Data provided | Refresh cadence |
|-------------|---------------|-----------------|
| Marketplace bestseller indices (category-level) | Relative sales velocity, price bands | Daily |
| Product review aggregators | Review count, average rating, sentiment themes | Daily |
| Price trackers | Retail price range for similar SKUs | Daily |

**Used for:** Demand proxies, competition analysis, recommended selling price benchmarks.

### 3. Search and trend data

| Source type | Data provided | Refresh cadence |
|-------------|---------------|-----------------|
| Google Trends (category + product keywords) | Search interest index, regional interest, rising queries | Daily |
| Keyword volume APIs | Monthly search volume, CPC estimates | Weekly |
| Social listening indices | Mention velocity, hashtag growth (category-level) | Daily |

**Used for:** Trend detection, seasonal demand, advertising potential (search channel).

### 4. Advertising platform signals

| Source type | Data provided | Refresh cadence |
|-------------|---------------|-----------------|
| Meta Ads Library (aggregated) | Active ad count for product class, creative longevity | Daily |
| Google Ads benchmark data | CPC ranges by category, competition index | Weekly |
| EmpireAI internal ad performance | Anonymized ROAS, CTR, CPM by category/SKU class across EmpireAI stores | Real-time aggregate |

**Used for:** Advertising potential, competition analysis, profit estimation (CAC proxy).

### 5. Platform internal data

| Source type | Data provided |
|-------------|-------------|
| EmpireAI order history | Conversion rates by category, AOV, refund rates |
| EmpireAI ad outcomes | Creative performance by product type |
| Founder category selection | Scoping filter only |

**Used for:** Calibration, confidence scoring, cold-start improvement as platform matures.

### Data quality rules

- SKUs without verifiable unit cost and shipping cost are **excluded** from recommendations.
- Stale supplier data (>72h) triggers re-verification before inclusion.
- Conflicting signals reduce confidence score rather than silently averaging.

---

## Product Scoring System

Every candidate product receives a **Product Score** from 0–100 used for ranking. The score is a weighted composite of eight sub-scores. Hard filters (see Risk Scoring) can disqualify a product regardless of score.

### Composite formula (conceptual)

```
Product Score = (Demand × 0.20)
              + (Trend × 0.15)
              + (Profit × 0.20)
              + (Ad Potential × 0.15)
              + (Low Competition × 0.10)
              + (Seasonal Fit × 0.05)
              + (Supplier Reliability × 0.10)
              + (Low Risk × 0.05)
```

Weights are tunable per category based on EmpireAI calibration data. Weights sum to 1.0.

### Score bands

| Band | Range | Founder-facing label |
|------|-------|----------------------|
| Exceptional | 85–100 | AI Top Pick eligible |
| Strong | 70–84 | Recommended |
| Moderate | 55–69 | Included if shortlist needs depth |
| Weak | 40–54 | Excluded from recommendations |
| Poor | 0–39 | Excluded |

### Shortlist construction

1. Discover 200–500 candidates in category (supplier scan).
2. Apply hard risk filters → ~80–150 remain.
3. Score all survivors.
4. Return top 10–15 by Product Score.
5. Flag top 3 as **AI Top Pick** (must score ≥85 and pass all risk gates).

### Diversity rules

To avoid a homogeneous list, PIE applies soft diversity constraints:

- Max 3 products from same supplier in top 15
- Max 4 products in same sub-niche (e.g., "phone grips" vs. "wireless chargers")
- At least 2 distinct price tiers (impulse vs. mid-ticket) when category supports it

---

## Trend Detection

### Purpose

Identify products with **rising demand velocity** rather than peaked or declining interest. Trend score favors momentum.

### Signals analyzed

| Signal | Weight in Trend sub-score | Interpretation |
|--------|----------------------------|----------------|
| Google Trends 90-day slope | 30% | Rising search interest |
| Social mention velocity (7d vs. 30d) | 25% | Accelerating buzz |
| Marketplace bestseller rank delta | 20% | Improving sales rank |
| New advertiser entry rate (Meta Ads Library) | 15% | Growing ad market (validates demand) |
| EmpireAI category conversion trend | 10% | Platform-specific lift |

### Trend sub-score (0–100)

| Score | Meaning |
|-------|---------|
| 80–100 | Strong rising trend — "Trending now" |
| 60–79 | Stable positive — "Steady demand" |
| 40–59 | Flat — neutral |
| 20–39 | Declining — penalized unless offset by seasonality |
| 0–19 | Sharp decline — excluded unless seasonal rebound predicted |

### Founder-facing output

One-line trend rationale on product card, e.g.:

- *"Search interest up 34% this month"*
- *"Popular in Meta ads this week"*
- *"Steady year-round seller"*

Never expose raw indices or slopes to founders.

---

## Competition Analysis

### Purpose

Estimate how difficult it is for a **new store** to win attention and conversions in this product niche. PIE favors niches with demand but manageable competition—not oversaturated hero products.

### Signals analyzed

| Signal | Description |
|--------|-------------|
| **Advertiser density** | Count of active ads for similar products (Meta Ads Library) |
| **Seller count proxy** | Number of marketplace listings with similar titles/images |
| **Price compression** | Spread between lowest and median retail — tight spread = race to bottom |
| **Review moat** | Dominance of listings with 10k+ reviews (hard for new entrants) |
| **Brand concentration** | Share of category sales held by known brands |
| **EmpireAI saturation** | Count of live EmpireAI stores already selling this SKU class |

### Competition sub-score (0–100)

Higher = **less** competition = better for new founder.

| Score | Meaning |
|-------|---------|
| 80–100 | Blue ocean — demand exists, few strong incumbents |
| 60–79 | Moderate — winnable with creative and positioning |
| 40–59 | Crowded — included only if other scores exceptional |
| 0–39 | Saturated — excluded from recommendations |

### Saturation guardrail

If **EmpireAI saturation** exceeds internal threshold (e.g., >50 active stores on same SKU cluster), product is down-ranked regardless of external demand—protects founder ad economics.

### Founder-facing output

Competition summarized as demand badge context, not a separate metric:

- *"High demand · Moderate competition"*
- *"Growing niche · Low saturation"*

---

## Profit Estimation

### Purpose

Calculate realistic **profit per sale** so founders understand economics before selection. Profit score and displayed estimates must align.

### Cost components

| Component | Source |
|-----------|--------|
| **Product cost** | Supplier unit price (lowest viable variant) |
| **Shipping cost** | Supplier shipping to primary sell region (default: founder region or US) |
| **Payment processing** | Fixed % + per-transaction fee (platform default) |
| **Platform fee** | EmpireAI commerce fee if applicable |
| **Estimated ad cost per sale** | Derived from Ad Potential model (CAC proxy) |
| **Refund allowance** | Category baseline refund rate × selling price |

### Profit calculation (conceptual)

```
Gross margin     = Recommended selling price − Product cost − Shipping cost
Net profit/sale  = Gross margin − Payment fees − Platform fee − Est. ad cost − Refund allowance
Profit margin %  = Net profit / Recommended selling price
```

### Profit sub-score (0–100)

Based on **net profit per sale** and **margin %** relative to category benchmarks.

| Net profit/sale (USD) | Typical sub-score |
|-----------------------|-------------------|
| ≥ $25 | 90–100 |
| $15–24 | 75–89 |
| $8–14 | 60–74 |
| $4–7 | 45–59 |
| < $4 | Below threshold — excluded |

Minimum margin floor: **25% gross margin** before ads unless category average is lower and product scores exceptional on trend + ad potential.

### Founder-facing output

- **Estimated profit per sale:** `$18` (rounded, conservative)
- Shown in selection summary bar as aggregate range across selected products

Estimates use **conservative defaults** (higher ad cost, higher refund allowance) to avoid overpromising.

---

## Advertising Potential

### Purpose

Predict how well a product will perform in **paid acquisition**—the primary growth channel for EmpireAI Commerce founders who have no organic audience.

### Signals analyzed

| Signal | Channel | Interpretation |
|--------|---------|----------------|
| Visual appeal score | Meta / Instagram | Product photographability, lifestyle context potential |
| Impulse buy index | Meta | Price point + emotional hook + giftability |
| CPC estimate | Google | Search click cost vs. expected AOV |
| Creative diversity potential | Meta | Number of distinct angles (problem/solution, before/after, UGC-style) |
| Historical EmpireAI CTR/ROAS | Both | Anonymized benchmarks for product class |
| Ad policy clearance likelihood | Both | Category/product policy risk |

### Ad Potential sub-score (0–100)

| Score | Meaning | Founder label |
|-------|---------|---------------|
| 80–100 | Strong paid-social and search fit | "High ad potential" |
| 60–79 | Good Meta performer | "Strong on Instagram" |
| 40–59 | Narrow channel fit | "Best on one channel" |
| 0–39 | Poor paid fit | Excluded |

### CAC proxy (internal)

Ad Potential feeds profit estimation:

```
Est. ad cost per sale = (Estimated CPC or CPM-derived click cost) / Expected conversion rate
```

Conversion rate defaults from category benchmarks until store-specific data exists.

### Founder-facing output

- Channel hint: *"Performs well on Instagram"*
- Included in AI insight panel: *"Visual product — strong for short-form video ads"*

---

## Risk Scoring

### Purpose

Identify products that could harm founder success, violate platform policies, or create operational failure. Risk operates as both a **sub-score** and a **hard filter**.

### Risk dimensions

| Dimension | Examples | Hard filter? |
|-----------|----------|--------------|
| **Platform policy** | Prohibited goods, health claims, trademark infringement likelihood | Yes — exclude |
| **Supplier reliability** | Supplier rating < threshold, high dispute rate | Yes — exclude |
| **Fulfillment** | Ship time > 21 days to primary region, no tracking | Soft — heavy penalty |
| **Quality** | Review sentiment < 3.5 stars, high defect themes | Soft — penalty |
| **Refund/chargeback** | Category refund rate > 15% | Soft — penalty |
| **Regulatory** | Restricted ingredients, age-gated, geo-restricted | Yes — exclude |
| **Counterfeit/IP** | Brand-name goods without authorization | Yes — exclude |
| **Ad policy** | Restricted ad categories (weapons, adult, etc.) | Yes — exclude |

### Risk sub-score (0–100)

Higher = **lower** risk.

| Score | Action |
|-------|--------|
| 90–100 | Clean — no flags |
| 70–89 | Minor flags — include with note |
| 50–69 | Elevated — include only if Product Score > 80 |
| 0–49 | Hard exclude |

### Founder-facing output

Risk is **not** shown as a numeric score. Products that pass filters appear clean. If a product has minor soft flags (rare in top 15), show neutral note:

- *"Longer shipping — 12–18 days"*

Never surface alarming legal language on product cards.

---

## Seasonal Demand

### Purpose

Adjust ranking for **time-of-year relevance** so founders are not recommended heavy winter gear in June unless trend signals override.

### Signals analyzed

| Signal | Use |
|--------|-----|
| Google Trends seasonal curve (5-year) | Identify peak and trough months |
| Category sales seasonality index | Marketplace historical pattern |
| Upcoming events calendar | Holidays, back-to-school, summer, Q4 gifting |
| Current month position vs. peak | In-season boost, off-season penalty |

### Seasonal Fit sub-score (0–100)

| Score | Meaning |
|-------|---------|
| 90–100 | In peak season or entering peak in ≤30 days |
| 70–89 | Shoulder season — acceptable |
| 50–69 | Off-season — penalized unless evergreen product |
| 0–49 | Wrong season — excluded unless trend score > 85 |

### Evergreen override

Products with flat seasonal curves (phone accessories, pet basics) receive neutral score (70) regardless of month.

### Founder-facing output

Seasonal note only when relevant:

- *"Peak season — demand rises in November"*
- *"Year-round seller"*
- *"Trending early — ahead of summer season"*

---

## Recommended Selling Price

### Purpose

Set a **defensible retail price** that balances conversion, margin, and market positioning—not simply the highest price the market bears.

### Pricing methodology

PIE uses a three-anchor model:

| Anchor | Description | Weight |
|--------|-------------|--------|
| **Cost-plus floor** | COGS + minimum margin floor (category-dependent, typically 2.2–2.8× product cost) | 30% |
| **Market median** | Median retail of comparable listings | 40% |
| **Psychological price point** | Round to .99 / .95 endings in impulse vs. premium bands | 10% |
| **Ad economics ceiling** | Max price where est. net profit remains positive at category CAC | 20% |

### Price selection rules

1. Compute candidate price from weighted anchors.
2. Reject if gross margin < category minimum.
3. Reject if net profit after est. ad cost < $4.
4. Prefer price ending in `.99` for items < $50; whole dollars for premium.
5. If market median is below cost-plus floor, **exclude product** (unviable economics).

### Variant handling

- Price based on **default variant** (most common size/color).
- Founder sees single price; variant range noted internally if spread > 15%.

### Founder-facing output

| Field | Example |
|-------|---------|
| Recommended price | `$39.99` |
| Estimated profit per sale | `$14` |
| *(Internal only)* | Cost breakdown available in dashboard supplier view |

Price is **not editable** at recommendation stage. Merchandising Agent may adjust post-launch.

---

## Confidence Score

### Purpose

Communicate how much trust PIE places in a recommendation given data completeness, signal agreement, and source freshness. Surfaced as a **visual indicator** on the product card—not a raw percentage.

### Confidence inputs

| Factor | Impact |
|--------|--------|
| **Data completeness** | Missing shipping cost, sparse reviews → lower confidence |
| **Signal agreement** | Trend, demand, and ad signals align → higher confidence |
| **Source freshness** | Stale supplier or trend data → lower confidence |
| **EmpireAI calibration** | SKU class has strong internal performance history → higher confidence |
| **Supplier verification** | Live stock check passed → boost |
| **Cross-source validation** | Multiple independent sources agree on demand → boost |

### Confidence calculation (conceptual)

```
Confidence = Base(data_completeness)
           × Agreement(trend, demand, profit, ad_potential)
           × Freshness(sources)
           × Calibration(internal_history_bonus)
```

Normalized to 0–100 internally; mapped to founder-facing tiers.

### Founder-facing tiers

| Internal range | Visual | Label |
|----------------|--------|-------|
| 85–100 | ●●●●● (5 bars) | AI Top Pick eligible |
| 70–84 | ●●●●○ | High confidence |
| 55–69 | ●●●○○ | Good confidence |
| 40–54 | ●●○○○ | Not shown to founder (excluded) |
| < 40 | — | Excluded |

### Display rules

- Show confidence as **bar indicator** or badge, never "87.3% confidence."
- AI Top Pick requires confidence tier ≥ High AND Product Score ≥ 85.
- Low-confidence products never appear in top 15 regardless of Product Score.

### Rationale linkage

Every product card includes a **"Why this product"** line derived from top contributing sub-scores:

> *"High profit · Trending on search · Strong Instagram potential"*

---

## Recommendation Output Specification

Each product in the final shortlist includes a structured record consumed by the **AI Product Recommendations** screen and stored as a research snapshot.

### Per-product output fields

| Field | Type | Founder-visible |
|-------|------|-----------------|
| `product_id` | Internal SKU ID | No |
| `title` | Plain-language product name | Yes |
| `thumbnail_url` | Image | Yes |
| `rank` | 1–15 | Yes (order) |
| `is_top_pick` | Boolean | Yes (badge) |
| `product_score` | 0–100 | No (used for rank only) |
| `confidence_tier` | 1–5 bars | Yes |
| `recommended_price` | Currency | Optional (v1 may show profit only) |
| `estimated_profit_per_sale` | Currency | Yes |
| `demand_level` | High / Medium | Yes |
| `demand_rationale` | One sentence | Yes |
| `trend_rationale` | One sentence | Yes |
| `ad_potential_hint` | One sentence | In insight panel |
| `seasonal_note` | One sentence or null | Yes (if relevant) |
| `shipping_time_band` | e.g., "5–9 days" | Yes |
| `supplier_id` | Internal | No |
| `risk_flags` | Internal list | No (filtered) |
| `why_this_product` | Composite rationale | Yes |
| `scored_at` | Timestamp | No |

### Default selection behavior

- Pre-select **top 5** by rank on screen load.
- Top 3 with `is_top_pick = true` display **AI Top Pick** ribbon.

---

## Failure Modes and Fallbacks

| Scenario | Behavior |
|----------|----------|
| Supplier API timeout | Retry once; fall back to cached category catalog |
| < 10 products pass filters | Relax soft competition threshold; never relax hard risk filters |
| Zero products pass filters | Serve **category fallback pack** (8 curated evergreen SKUs per category, human-reviewed quarterly) |
| Stale trend data | Reduce trend weight; increase supplier + profit weight for this run |
| Research exceeds 30s P95 | Return partial results (min 8) with lower confidence tier; backfill async |

Founder never sees error states—only results or fallback with neutral copy: *"AI picked proven bestsellers in [Category]."*

---

## Calibration and Learning

### Cold start (early platform)

- Weights use industry benchmarks and supplier data.
- EmpireAI internal data weighted at 10% of calibration.

### Mature platform

- Order conversion, ROAS, and refund data feed back into category benchmarks.
- Products that underperform post-launch down-rank similar SKU classes in future research.
- Monthly weight review by data team; no real-time founder impact from learning (batch updates).

### Human review loop

- Category fallback packs reviewed quarterly.
- SKUs with policy near-misses reviewed by compliance weekly.
- Top Pick accuracy audited against 30-day store performance.

---

## Success Metrics

| Metric | Target |
|--------|--------|
| P95 research latency | ≤ 30 seconds |
| Shortlist size | 10–15 products |
| Top Pick 30-day positive profit rate | ≥ 60% of stores |
| Founder selection rate of pre-selected Top 5 | ≥ 90% |
| Fallback rate | < 5% of research runs |
| Average estimated profit per selected product | ≥ $10 |
| Confidence tier accuracy (High → profitable) | ≥ 70% calibration |

---

## Privacy and Compliance

- PIE uses aggregated, anonymized EmpireAI performance data—no founder-identifiable data in cross-store signals.
- No trademarked brand products recommended without authorization verification.
- Health, financial, and restricted categories blocked at hard filter layer.
- Data source contracts reviewed for commercial use and retention limits.

---

## Related Documents

- [FOUNDER_EXPERIENCE.md](./FOUNDER_EXPERIENCE.md) — Step 4 product recommendations
- [DASHBOARD_SCREENS.md](./DASHBOARD_SCREENS.md) — AI Product Recommendations screen
- [Documentation index](./README.md)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-06-21 | Initial Product Intelligence Engine specification |
