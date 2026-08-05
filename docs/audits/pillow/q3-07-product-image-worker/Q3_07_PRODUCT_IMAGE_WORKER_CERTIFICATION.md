# Q3-07 Product Image Worker

**Status:** FINAL PASS  
**Doctrine:** PILLOW-PIW-001  
**Programme:** Q3 — Commerce Factory  
**Mission:** Q3-07 Product Image Worker  
**Primary Deliverable:** Prepare supplier images and product creatives for compliant marketplace use.

> Doctrine ID uses **PILLOW-PIW-001**. Product Image Worker prepares visual assets only; it never publishes listings, generates advertisements, contacts suppliers, overwrites originals, overrides Pillow/Grand King, or implements Q3-08+.

## How Q3-07 works

1. Approved supplier images are received (with optional Supplier Evaluation traceability).
2. Image quality is validated; duplicates and unusable assets are detected.
3. Image sets are organized; marketplace-compliant derived copies and variants are prepared.
4. Metadata is preserved; originals are never overwritten.
5. Machine-readable Product Image Reports (`PIW-RPT-v1`) are submitted via ERR (`PIW-001-v1`).

## Prerequisites

- Q3-06 Supplier Negotiation Worker (`PILLOW-SNW-001`)
- Q3-05 Supplier Evaluation Worker (`PILLOW-SEW-001`) for supplier/product context

## Verification

`npx --yes tsx --test "src/validation/tests/product-image-worker.test.ts"` — 10 passing, 0 failing.
