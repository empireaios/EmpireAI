# Q7-09 Operations Worker

## Mission

- **ID:** Q7-09
- **Name:** Operations Worker
- **Doctrine:** `PILLOW-OPSW-001`
- **Module:** `pillow/src/operations-worker/`
- **Worker ID:** `wkr-operations-01`
- **Status:** **FINAL PASS**

## Prior gates

| Mission | Status |
|---|---|
| Q7-01 … Q7-08 | FINAL PASS |

## Deliverable

Designs structural service delivery workflows from approved confirmed bookings: operational stages, technician assignment, fulfilment checklists, QA checkpoints, escalation, completion, and post-service follow-up. Emits Q7-10-consumable Operations Reports.

Does **not** perform customer services, replace Booking/CRM/Lead Generation Workers, or fabricate operational evidence.

## Wiring evidence

- Session: `pillow/src/session.ts` (`operationsWorker`, `requirePillowOperationsWorker`)
- Barrel: `pillow/src/index.ts`
- Subsystem: `operations-worker` in `orchestrator/types.ts` + `subsystem-registry.ts`
- Host: `backend/src/orchestration/pillow-host/pillow-host.ts`
- Routes: `/api/pillow/operations-worker/*`
- Offline bridge: `backend/src/orchestration/pillow-host/operations-worker-bridge.ts`
- Governance: `docs/governance/EMPIREAI_OPERATIONS_WORKER_SYSTEM.md`
- Config: `config/operations-worker.config.json`

## Observed validation

On 2026-08-02:

```text
node --import tsx --test \
  "src/validation/tests/operations-worker.test.ts" \
  "src/validation/tests/lead-generation-worker.test.ts" \
  "src/validation/tests/booking-worker.test.ts" \
  "src/validation/tests/crm-worker.test.ts"
# 48 pass / 0 fail (12 each suite)
```

## Stop

Q7-09 complete. Do not begin Q7-10.
