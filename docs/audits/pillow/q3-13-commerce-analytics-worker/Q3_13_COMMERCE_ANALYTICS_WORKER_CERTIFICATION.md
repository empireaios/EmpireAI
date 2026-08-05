# Q3-13 Commerce Analytics Worker

**Status:** FINAL PASS  
**Doctrine:** PILLOW-CAW-001  
**Programme:** Q3 — Commerce Factory  
**Mission:** Q3-13 Commerce Analytics Worker  
**Primary Deliverable:** Track product performance, conversion, profit, customer issues, and improvement opportunities.

> Doctrine ID uses **PILLOW-CAW-001**. Commerce Analytics Worker analyses commerce performance only; it never modifies products, pricing, suppliers, or operational data; never executes optimizations; never overrides Pillow/Grand King; and never implements Q3-14+.

## How Q3-13 works

1. Commerce signals are enriched from Pricing, Inventory, Order, and Refund & Dispute workers.
2. Product, sales, conversion, profit, customer-issue, refund, and supplier performance are tracked.
3. Declining and high-performing products are detected.
4. Optimization opportunities and executive recommendations are generated for Pillow (advisory only).
5. Machine-readable Commerce Analytics Reports (`CAW-RPT-v1`) are submitted via ERR (`CAW-001-v1`).

## Prerequisites

- Q3-09 Pricing Worker (`PILLOW-PRW-001`)
- Q3-10 Inventory Worker (`PILLOW-INW-001`)
- Q3-11 Order Worker (`PILLOW-ORW-001`)
- Q3-12 Refund & Dispute Worker (`PILLOW-RDW-001`)

## Verification

`npx --yes tsx --test "src/validation/tests/commerce-analytics-worker.test.ts"` — 10 passing, 0 failing.
