# Q3-04 Supplier Discovery Worker

**Status:** FINAL PASS  
**Doctrine:** PILLOW-SDW-001  
**Programme:** Q3 — Commerce Factory  
**Mission:** Q3-04 Supplier Discovery Worker  
**Primary Deliverable:** Find suppliers through approved supplier platforms and APIs.

> Doctrine ID uses **PILLOW-SDW-001**. Supplier Discovery Worker discovers supplier candidates only; it never evaluates/negotiates/selects suppliers, places orders, modifies supplier data, overrides Pillow/Grand King, or implements Q3-05+.

## How Q3-04 works

1. Approved products are received from Product Evaluation Worker (Q3-03 Proceed).
2. Approved supplier platforms and integrated supplier APIs are searched.
3. Multiple supplier candidates are discovered with product, pricing, MOQ, shipping, and location capture.
4. Unavailable vs missing fields are distinguished; source references and evaluation traceability are preserved.
5. Machine-readable Supplier Discovery Reports (`SDW-RPT-v1`) are produced and submitted via ERR (`SDW-001-v1`).

## Prerequisites

- Q3-03 Product Evaluation Worker (`PILLOW-PEW-001`)

## Verification

`npx --yes tsx --test "src/validation/tests/supplier-discovery-worker.test.ts"` — 10 passing, 0 failing.
