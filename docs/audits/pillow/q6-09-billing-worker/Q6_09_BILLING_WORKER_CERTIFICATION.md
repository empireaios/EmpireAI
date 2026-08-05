# Q6-09 Billing Worker Certification

## Mission

- **ID:** Q6-09
- **Name:** Billing Worker
- **Doctrine:** PILLOW-BLW-001
- **Module:** `pillow/src/billing-worker/`
- **Status:** FINAL PASS

## Deliverable

Build subscriptions, invoices, payment-provider workflow coordination, billing records, refunds/credit notes (where approved), billing audit history, and machine-readable Billing Reports.

## Repository audit findings

- Q6-01–Q6-08 FINAL PASS verified from certification evidence under `docs/audits/pillow/q6-0*`.
- Adjacent systems preserved and not replaced: `invoice-generator`, `checkout-worker`, `revenue-engine`, `refund-engine`, finance stack.
- Payment gateway integrations remain owned by `pillow/src/payment-gateway-integration/` (Q6-10 territory) — Billing Worker coordinates workflows and records explicit provider results only.
- Authentication (Q6-07) and Authorization (Q6-08) remain separate; Billing Worker does not authenticate or authorize.

## Capabilities verified

1. Manage billing accounts / customer billing profiles
2. Create subscription plans (monthly, annual, one-time; trial periods)
3. Support recurring billing (`nextBillingAt` scheduling)
4. Generate invoices with unique `INV-YYYY-######` numbering
5. Track invoice lifecycle (`draft` → `issued` → `paid` / refund states)
6. Coordinate payment provider workflows via explicit `recordPaymentProviderResult`
7. Record billing transactions
8. Handle refunds and credit notes
9. Produce complete billing audit history
10. Produce machine-readable Billing Reports (`BLW-RPT-v1`)

## Boundaries verified

- Does not replace payment gateway integrations
- Does not authenticate users
- Does not manage authorization
- Never fabricates successful payment results (`markInvoicePaid` requires recorded succeeded transaction)
- Does not override Pillow / Grand King / approved architecture
- Does not implement Q6-10 or later

## Prerequisites

Q6-01 through Q6-08 FINAL PASS.

## Wiring

- Session bootstrap after Authorization Worker
- Barrel export + `requirePillowBillingWorker()`
- Subsystem registry id `billing-worker` (mission Q6-09)
- Host methods + authenticated routes `/api/pillow/billing-worker/*`
- Offline bridge: `billing-worker-bridge.ts`

## Evidence

- Unit suite: `pillow/src/validation/tests/billing-worker.test.ts` (12/12)
- Regression: Q6-07 Authentication Worker (12/12), Q6-08 Authorization Worker (12/12)
- Governance: `docs/governance/EMPIREAI_BILLING_WORKER_SYSTEM.md`
- Config: `config/billing-worker.config.json`
