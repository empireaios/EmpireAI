# Q3-12 Refund & Dispute Worker

**Status:** FINAL PASS  
**Doctrine:** PILLOW-RDW-001  
**Programme:** Q3 — Commerce Factory  
**Mission:** Q3-12 Refund & Dispute Worker  
**Primary Deliverable:** Handle refund, return, dispute, and support workflows under policy.

> Doctrine ID uses **PILLOW-RDW-001**. Refund & Dispute Worker manages workflows only; it never modifies financial ledgers, overrides marketplace policies, authorizes outside the Authority Matrix, overrides Pillow/Grand King, or implements Q3-13+.

## How Q3-12 works

1. Refund, return, and customer dispute requests are received (optionally enriched from Order Worker).
2. Case types are classified; requests are validated against EmpireAI policies and marketplace rules.
3. Case status is tracked; suppliers are coordinated when required.
4. Customer communications are generated; cases beyond delegated authority escalate to Pillow.
5. Final case outcomes are recorded.
6. Machine-readable Refund & Dispute Reports (`RDW-RPT-v1`) are submitted via ERR (`RDW-001-v1`).

## Prerequisites

- Q3-11 Order Worker (`PILLOW-ORW-001`)

## Verification

`npx --yes tsx --test "src/validation/tests/refund-dispute-worker.test.ts"` — 10 passing, 0 failing.
