# Q3-09 Pricing Worker

**Status:** FINAL PASS  
**Doctrine:** PILLOW-PRW-001  
**Programme:** Q3 — Commerce Factory  
**Mission:** Q3-09 Pricing Worker  
**Primary Deliverable:** Set pricing based on cost, margin, competition, fees, ads, and target profit.

> Doctrine ID uses **PILLOW-PRW-001**. Pricing Worker recommends selling prices only; it never publishes listings/pricing, modifies supplier costs, executes promotions, overrides Pillow/Grand King, or implements Q3-10+.

## How Q3-09 works

1. Approved products and supplier cost information are received.
2. Total landed cost, marketplace fees, payment fees, advertising assumptions, and shipping are calculated.
3. Target margin and target profit are calculated.
4. Competitor pricing is compared.
5. A recommended selling price is produced with explicit rationale.
6. Machine-readable Pricing Reports (`PRW-RPT-v1`) are submitted via ERR (`PRW-001-v1`).

## Prerequisites

- Q3-08 Product Listing Worker (`PILLOW-PLW-001`)

## Verification

`npx --yes tsx --test "src/validation/tests/pricing-worker.test.ts"` — 10 passing, 0 failing.
