# Q3-10 Inventory Worker

**Status:** FINAL PASS  
**Doctrine:** PILLOW-INW-001  
**Programme:** Q3 — Commerce Factory  
**Mission:** Q3-10 Inventory Worker  
**Primary Deliverable:** Monitor stock, lead times, reorder points, and supplier availability.

> Doctrine ID uses **PILLOW-INW-001**. Inventory Worker monitors inventory only; it never purchases inventory, modifies supplier stock, places supplier orders, overrides Pillow/Grand King, or implements Q3-11+.

## How Q3-10 works

1. Approved products are received (optionally enriched from Supplier Evaluation Worker).
2. Supplier stock, inventory quantities, lead times, and supplier availability are monitored.
3. Reorder points are calculated from demand, lead time, and safety stock.
4. Low-stock, out-of-stock, and abnormal inventory changes are detected.
5. Inventory alerts are generated for critical events.
6. Machine-readable Inventory Reports (`INW-RPT-v1`) are submitted via ERR (`INW-001-v1`).

## Prerequisites

- Q3-05 Supplier Evaluation Worker (`PILLOW-SEW-001`)
- Q3-09 Pricing Worker (`PILLOW-PRW-001`)

## Verification

`npx --yes tsx --test "src/validation/tests/inventory-worker.test.ts"` — 10 passing, 0 failing.
