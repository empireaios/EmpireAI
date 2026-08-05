# Q3-05 Supplier Evaluation Worker

**Status:** FINAL PASS  
**Doctrine:** PILLOW-SEW-001  
**Programme:** Q3 — Commerce Factory  
**Mission:** Q3-05 Supplier Evaluation Worker  
**Primary Deliverable:** Evaluate supplier reliability, price, shipping, refund policy, fulfilment quality, and risk.

> Doctrine ID uses **PILLOW-SEW-001**. Supplier Evaluation Worker evaluates discovered suppliers only; it never discovers suppliers, negotiates, places orders, modifies supplier information, overrides Pillow/Grand King, or implements Q3-06+.

## How Q3-05 works

1. Supplier Discovery Reports are received from Supplier Discovery Worker (Q3-04).
2. Reliability, price, shipping, refund policy, fulfilment quality, communication, and operational risk are scored.
3. An overall score and Approve / Review / Reject recommendation are generated.
4. Machine-readable Supplier Evaluation Reports (`SEW-RPT-v1`) are produced and submitted via ERR (`SEW-001-v1`).

## Prerequisites

- Q3-04 Supplier Discovery Worker (`PILLOW-SDW-001`)

## Verification

`npx --yes tsx --test "src/validation/tests/supplier-evaluation-worker.test.ts"` — 10 passing, 0 failing.
