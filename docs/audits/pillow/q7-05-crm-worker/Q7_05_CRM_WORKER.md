# Q7-05 CRM Worker

## Mission

- **ID:** Q7-05
- **Name:** CRM Worker
- **Doctrine:** `PILLOW-CRMW-001`
- **Module:** `pillow/src/crm-worker/`
- **Worker ID:** `wkr-crm-01`
- **Status:** **FINAL PASS**

## Prior gates

| Mission | Status |
|---|---|
| Q7-01 Local Business Factory Core | FINAL PASS |
| Q7-02 Local Market Research Worker | FINAL PASS |
| Q7-03 Service Offer Worker | FINAL PASS |
| Q7-04 Booking Worker | FINAL PASS |

## Deliverable

Manages customer profiles, leads, contacts, booking-history links, follow-ups, opportunities, lifecycle, and CRM analytics for Local Business Factory businesses. Emits Q7-06-consumable CRM Reports.

Does **not** execute marketing campaigns, deliver jobs, or replace booking.

## Wiring evidence

- Session: `createCrmWorker` + bind LBFC + LMRW + SOW + BKW + ERR/registry/lifecycle
- `requirePillowCrmWorker()`
- Subsystem id `crm-worker` (Q7-05)
- Host methods + `/api/pillow/crm-worker/*`
- Bridge / governance / config

## Observed validation

On 2026-08-02:

```text
node --import tsx --test \
  "src/validation/tests/crm-worker.test.ts" \
  "src/validation/tests/booking-worker.test.ts" \
  "src/validation/tests/service-offer-worker.test.ts" \
  "src/validation/tests/local-market-research-worker.test.ts" \
  "src/validation/tests/local-business-factory-core.test.ts"
# 61 pass / 0 fail
```
