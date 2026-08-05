# Q3-08 Product Listing Worker

**Status:** FINAL PASS  
**Doctrine:** PILLOW-PLW-001  
**Programme:** Q3 — Commerce Factory  
**Mission:** Q3-08 Product Listing Worker  
**Primary Deliverable:** Create product titles, descriptions, attributes, variants, SEO, and marketplace listings.

> Doctrine ID uses **PILLOW-PLW-001**. Product Listing Worker prepares listings only; it never publishes listings, modifies supplier information, modifies pricing, overrides Pillow/Grand King, or implements Q3-09+.

## How Q3-08 works

1. Approved product information and Product Image Worker assets are received.
2. Titles, descriptions, bullet points, attributes, variants, and SEO fields are generated.
3. Required marketplace fields are validated.
4. Marketplace-specific listing packages are produced (never auto-published).
5. Machine-readable Product Listing Reports (`PLW-RPT-v1`) are submitted via ERR (`PLW-001-v1`).

## Prerequisites

- Q3-07 Product Image Worker (`PILLOW-PIW-001`)

## Verification

`npx --yes tsx --test "src/validation/tests/product-listing-worker.test.ts"` — 10 passing, 0 failing.
