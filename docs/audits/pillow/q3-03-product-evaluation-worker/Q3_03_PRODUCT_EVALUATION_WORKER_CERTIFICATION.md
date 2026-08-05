# Q3-03 Product Evaluation Worker

**Status:** FINAL PASS  
**Doctrine:** PILLOW-PEW-001  
**Programme:** Q3 — Commerce Factory  
**Mission:** Q3-03 Product Evaluation Worker  
**Primary Deliverable:** Score products by margin, demand, competition, shipping, risk, reviews, and creative potential.

> Doctrine ID uses **PILLOW-PEW-001**. Product Evaluation Worker evaluates discovered products only; it never discovers products, selects suppliers, creates listings, purchases inventory, overrides Pillow/Grand King, or implements Q3-04+.

## How Q3-03 works

1. Discovered products are received from Product Discovery Worker (Q3-02).
2. Margin, demand, competition, shipping, risk, review quality, and creative potential are scored.
3. An overall score and Proceed / Review / Reject recommendation are generated.
4. Machine-readable Product Evaluation Reports (`PEW-RPT-v1`) are produced and submitted via ERR (`PEW-001-v1`).

## Prerequisites

- Q3-02 Product Discovery Worker (`PILLOW-PDW-001`)

## Verification

`npx --yes tsx --test "src/validation/tests/product-evaluation-worker.test.ts"` — 10 passing, 0 failing.
