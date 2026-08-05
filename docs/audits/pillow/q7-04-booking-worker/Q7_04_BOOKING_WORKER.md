# Q7-04 Booking Worker

## Mission

- **ID:** Q7-04
- **Name:** Booking Worker
- **Doctrine:** `PILLOW-BKW-001`
- **Module:** `pillow/src/booking-worker/`
- **Worker ID:** `wkr-booking-01`
- **Status:** **FINAL PASS**

## Prior gates

| Mission | Status |
|---|---|
| Q7-01 Local Business Factory Core | FINAL PASS |
| Q7-02 Local Market Research Worker | FINAL PASS |
| Q7-03 Service Offer Worker | FINAL PASS |

## Deliverable

Converts approved Q7-03 service offerings into appointment/job booking: calendars, availability, slots, technician assignment, modify/cancel/reschedule, confirmations, conflict prevention, Booking Reports consumable by Q7-05.

Does **not** perform the service, process payments, or replace CRM.

## Wiring evidence

- Session: `createBookingWorker` + bind LBFC + LMRW + SOW + ERR/registry/lifecycle
- `requirePillowBookingWorker()`
- Subsystem id `booking-worker` (Q7-04)
- Host methods + `/api/pillow/booking-worker/*`
- Bridge / governance / config

## Observed validation

On 2026-08-02:

```text
node --import tsx --test \
  "src/validation/tests/booking-worker.test.ts" \
  "src/validation/tests/service-offer-worker.test.ts" \
  "src/validation/tests/local-market-research-worker.test.ts" \
  "src/validation/tests/local-business-factory-core.test.ts"
# 49 pass / 0 fail (12 BKW + 12 SOW + 13 LMRW + 12 LBFC)
```
