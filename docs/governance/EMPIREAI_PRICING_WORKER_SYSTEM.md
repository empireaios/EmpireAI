# EmpireAI Pricing Worker

PILLOW-PRW-001 / Q3-09 provides the Pricing Worker.

The Pricing Worker determines commercially viable selling prices for approved products.

Its responsibility is **pricing recommendation only**. It calculates landed cost, marketplace fees, payment fees, advertising assumptions, shipping, target margin, target profit, competitor comparisons, and recommended selling prices. It does **not** publish prices to marketplaces.

> Note: Doctrine ID is **PILLOW-PRW-001**. Metadata version `PRW-001-v1`. Report version `PRW-RPT-v1`. Public alias: `PrwPricingReport`.

## Boundaries

The Pricing Worker:

- **does** receive approved products and supplier cost information; calculate total landed cost, marketplace fees, payment processing fees, advertising cost assumptions, shipping cost, target margin, and target profit; compare competitor pricing; recommend selling price; and produce machine-readable Pricing Reports
- does **not** publish listings or pricing automatically
- does **not** modify supplier costs
- does **not** execute promotions
- does **not** implement Q3-10 or later
- does **not** override Pillow or Grand King

## Pricing Report

Each report includes: Pricing ID, Timestamp, Product ID, Supplier Cost, Shipping Cost, Marketplace Fees, Payment Fees, Advertising Allocation, Total Landed Cost, Target Margin, Target Profit, Competitor Pricing, Recommended Selling Price, Pricing Rationale, Confidence Score, and Metadata version (`PRW-001-v1`).

Actual costs are clearly separated from estimated costs. Pricing rationale and audit history are preserved.

## Prerequisites

- Q3-08 Product Listing Worker (`PILLOW-PLW-001`)

## Safety

Complete pricing traceability is preserved. Credentials and authentication tokens are never exposed. Pricing is never published automatically. Reports are submitted through the Executive Reporting Runtime.
