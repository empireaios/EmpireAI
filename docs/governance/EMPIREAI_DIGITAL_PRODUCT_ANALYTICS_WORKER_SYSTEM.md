# EmpireAI Digital Product Analytics Worker

PILLOW-DPA-001 / Q5-11 provides the Digital Product Analytics Worker.

The Digital Product Analytics Worker continuously measures digital product performance and recommends data-driven improvements. It analyses sales, conversion, refunds, feedback, trends, underperformance, and opportunities. It produces machine-readable Digital Product Analytics Reports with measured metrics (when provided) and clearly marked recommendations. It **does** track product performance and generate executive summaries. It does **not** edit or modify products, process payments, deliver products, fabricate metrics, override Pillow or Grand King, or implement Q5-12 or later.

> Note: Doctrine ID is **PILLOW-DPA-001**. Metadata version `DPA-001-v1`. Report version `DPA-RPT-v1`. Worker ID: `wkr-digital-product-analytics-01`. Module ID: `digital-product-analytics-worker`. Factory: `digital-products-factory`. Role: `role-analyst-digital-product-analytics`. Analytics report IDs: `dpa-anl-*`. Product IDs: `dpa-prd-*`. Recommendation IDs: `dpa-rec-*`. Decision IDs: `dpa-dec-*`. Finding IDs: `dpa-f-*`. Step IDs: `dpa-step-*`. Validation IDs: `dpa-val-*`. Engine IDs: `dpa-eng-*`. Run IDs: `dpa-run-*`. Executive report IDs: `ert-dpa-*`. Business IDs: `dbiz-dpa-*`. Factory mission IDs: `dpf-dpa-*`.

## Boundaries

The Digital Product Analytics Worker:

- **does** track product sales, revenue/profit, conversion, refunds; analyse customer feedback; detect trends and underperformance; recommend improvements; generate executive performance summaries; and produce machine-readable Digital Product Analytics Reports
- does **not** edit or modify products (without Pillow approval)
- does **not** process payments
- does **not** deliver products
- does **not** fabricate metrics from thin air — when measured input is absent, metrics are marked `measured:false` with structural zeros
- does **not** implement Q5-12 or later
- does **not** override Pillow or Grand King
- distinguishes measured data from recommendations (`isRecommendation:true` on all recommendations)
- preserves complete data traceability, historical analytics, and audit history
- emits structural analytics signals only — never live payment processing or product modification

## Digital Product Analytics Report

Each report includes: Analytics Report ID (`dpa-anl-*`), Timestamp, Product ID (`dpa-prd-*`), Product Title, Sales Metrics (unitsSold, ordersCount, periodLabel, measured), Revenue Metrics (grossRevenue, currency, periodLabel, measured), Profit Metrics (estimatedProfit, marginPercent, currency, periodLabel, measured, estimated), Conversion Metrics (conversionRatePercent, visitorsPlaceholder, checkoutsStarted, purchasesCompleted, measured), Refund Metrics (refundRatePercent, refundCount, refundAmount, currency, measured), Customer Feedback Summary (sentiment, themes, sampleSize, summary), Improvement Recommendations (recommendationId, title, rationale, priority, category, measuredBasis, isRecommendation:true), Executive Summary, Confidence Score, and Metadata version (`DPA-001-v1`).

Orchestration extras include researchReportId, opportunityId, businessId, factoryMissionId, checkoutId, deliveryId, analyticsType, analyticsSteps, supportedAnalyticsTypes, underperformingDetected, trendsDetected, selfReviewPassed, selfReviewFindings, qualityReview, complianceReview, workerId, reportVersion, traceabilityRefs, preservedDecisions, executive reporting submission fields, and force-locked boundary flags.

## Supported analytics types

Analytics types (extensible): `sales_performance`, `revenue_performance`, `profitability`, `conversion_rate`, `refund_rate`, `customer_satisfaction`, `product_ranking`, `trend_analysis`, `opportunity_detection`, `executive_kpi_dashboard`, `unknown`. Default type: `sales_performance`.

## Prerequisites

- Q5-01 Digital Products Factory Core (`PILLOW-DPF-001`)
- Q5-09 Checkout Worker (`PILLOW-CKW-001`)
- Q5-10 Digital Delivery Worker (`PILLOW-DDW-001`)

## Safety

Metrics are never fabricated. When input provides measured numbers, they are used. When absent, fields use `measured:false` with zeros and `dataSource: "insufficient_input"`. Recommendations always have `isRecommendation:true` and list `measuredBasis` fields. Digital Product Analytics Reports are submitted through the Executive Reporting Runtime with missionId `Q5-11`. Analytics is structural signal only — never product editing, payment processing, or product delivery.
