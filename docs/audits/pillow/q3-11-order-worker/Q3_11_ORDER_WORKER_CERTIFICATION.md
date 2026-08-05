# Q3-11 Order Worker

**Status:** FINAL PASS  
**Doctrine:** PILLOW-ORW-001  
**Programme:** Q3 — Commerce Factory  
**Mission:** Q3-11 Order Worker  
**Primary Deliverable:** Manage order routing, fulfilment status, exceptions, and customer updates.

> Doctrine ID uses **PILLOW-ORW-001**. Order Worker manages order operations only; it never processes payments, issues refunds, modifies inventory, alters financial records, overrides Pillow/Grand King, or implements Q3-12+.

## How Q3-11 works

1. Confirmed customer orders are received (optionally enriched from Inventory Worker).
2. Orders are routed to the appropriate supplier.
3. Fulfilment and shipment status are tracked.
4. Fulfilment exceptions, delayed orders, and failed fulfilment are detected.
5. Customer status updates are generated; critical issues escalate to Pillow.
6. Complete order history is maintained.
7. Machine-readable Order Reports (`ORW-RPT-v1`) are submitted via ERR (`ORW-001-v1`).

## Prerequisites

- Q3-10 Inventory Worker (`PILLOW-INW-001`)

## Verification

`npx --yes tsx --test "src/validation/tests/order-worker.test.ts"` — 10 passing, 0 failing.
