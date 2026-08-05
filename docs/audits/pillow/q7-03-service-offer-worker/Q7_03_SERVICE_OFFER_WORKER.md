# Q7-03 Service Offer Worker

## Mission

- **ID:** Q7-03
- **Name:** Service Offer Worker
- **Doctrine:** `PILLOW-SOW-001`
- **Module:** `pillow/src/service-offer-worker/`
- **Worker ID:** `wkr-service-offer-01`
- **Status:** **FINAL PASS**

## Prior gates

| Mission | Status | Evidence |
|---|---|---|
| Q7-01 Local Business Factory Core | FINAL PASS | `docs/audits/pillow/q7-01-local-business-factory-core/` |
| Q7-02 Local Market Research Worker | FINAL PASS | `docs/audits/pillow/q7-02-local-market-research-worker/` |

## Deliverable

Converts verified Q7-02 local market research into launch-ready commercial service offers: catalogue, packages, pricing recommendations (research-anchored), inclusions/exclusions, guarantees, fulfilment requirements. Consumable by Q7-04 via `getQ704ConsumableContract()` / `consumableByQ704`.

Does **not** build booking/CRM, execute jobs, or launch the business.

## Wiring evidence

- Session: `createServiceOfferWorker` + bind LBFC + LMRW + ERR/registry/lifecycle
- `requirePillowServiceOfferWorker()`
- Subsystem id `service-offer-worker` (Q7-03)
- Host methods + `/api/pillow/service-offer-worker/*`
- Bridge / governance / config

## Observed validation

On 2026-08-02:

```text
node --import tsx --test \
  "src/validation/tests/service-offer-worker.test.ts" \
  "src/validation/tests/local-market-research-worker.test.ts" \
  "src/validation/tests/local-business-factory-core.test.ts"
# 37 pass / 0 fail (12 SOW + 13 LMRW + 12 LBFC)
```
