# Q3-06 Supplier Negotiation Worker

**Status:** FINAL PASS  
**Doctrine:** PILLOW-SNW-001  
**Programme:** Q3 — Commerce Factory  
**Mission:** Q3-06 Supplier Negotiation Worker  
**Primary Deliverable:** Prepare negotiation messages, MOQ questions, shipping terms, and supplier comparisons.

> Doctrine ID uses **PILLOW-SNW-001**. Supplier Negotiation Worker prepares negotiation packages only; it never contacts suppliers, commits agreements, places orders, overrides Pillow/Grand King, or implements Q3-07+.

## How Q3-06 works

1. Supplier Evaluation Reports are received from Supplier Evaluation Worker (Q3-05).
2. Candidates are compared and negotiation opportunities are identified.
3. MOQ, pricing, shipping, fulfilment, and refund question blocks are prepared.
4. A professional draft message is produced (explicitly not transmitted).
5. Machine-readable Supplier Negotiation Reports (`SNW-RPT-v1`) are submitted via ERR (`SNW-001-v1`).

## Prerequisites

- Q3-05 Supplier Evaluation Worker (`PILLOW-SEW-001`)

## Verification

`npx --yes tsx --test "src/validation/tests/supplier-negotiation-worker.test.ts"` — 10 passing, 0 failing.
