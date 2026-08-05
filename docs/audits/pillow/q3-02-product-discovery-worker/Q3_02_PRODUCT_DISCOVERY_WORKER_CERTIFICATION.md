# Q3-02 Product Discovery Worker

**Status:** FINAL PASS  
**Doctrine:** PILLOW-PDW-001  
**Programme:** Q3 — Commerce Factory  
**Mission:** Q3-02 Product Discovery Worker  
**Primary Deliverable:** Find product opportunities from marketplaces, suppliers, search trends, and customer demand.

> Doctrine ID uses **PILLOW-PDW-001**. Product Discovery Worker discovers candidate products only; it never evaluates/ranks products, selects suppliers, builds listings, overrides Pillow/Grand King, or implements Q3-03+.

## How Q3-02 works

1. Approved marketplace and supplier candidates are discovered.
2. Search trend and customer demand signals produce additional candidates.
3. Seasonal, emerging, and declining signals are detected.
4. Products are categorized and duplicates are removed.
5. Machine-readable Product Discovery Reports (`PDW-RPT-v1`) are produced and submitted via ERR (`PDW-001-v1`).

## Prerequisites

- Q3-01 Commerce Factory Core (`PILLOW-CMF-001`)

## Verification

`npx --yes tsx --test "src/validation/tests/product-discovery-worker.test.ts"` — 10 passing, 0 failing.
