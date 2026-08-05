# Q7-08 Lead Generation Worker

## Mission

- **ID:** Q7-08
- **Name:** Lead Generation Worker
- **Doctrine:** `PILLOW-LGW-001`
- **Module:** `pillow/src/lead-generation-worker/`
- **Worker ID:** `wkr-lead-generation-01`
- **Status:** **FINAL PASS**

## Prior gates

| Mission | Status |
|---|---|
| Q7-01 … Q7-07 | FINAL PASS |

## Deliverable

Prepares lead funnels from Local SEO context: enquiry forms, lead capture, qualification, scoring, CRM routing (injected), booking routing for qualified leads (injected), conversion tracking, funnel metrics from observed captures. Emits Q7-09-consumable Lead Generation Reports.

Does **not** execute advertising, replace CRM/booking, deliver jobs, or fabricate conversions.

## Wiring evidence

- Session: `pillow/src/session.ts` (`leadGenerationWorker`, `requirePillowLeadGenerationWorker`)
- Barrel: `pillow/src/index.ts`
- Subsystem: `lead-generation-worker` in `orchestrator/types.ts` + `subsystem-registry.ts`
- Host: `backend/src/orchestration/pillow-host/pillow-host.ts`
- Routes: `/api/pillow/lead-generation-worker/*`
- Offline bridge: `backend/src/orchestration/pillow-host/lead-generation-worker-bridge.ts`
- Governance: `docs/governance/EMPIREAI_LEAD_GENERATION_WORKER_SYSTEM.md`
- Config: `config/lead-generation-worker.config.json`

## Observed validation

On 2026-08-02:

```text
node --import tsx --test \
  "src/validation/tests/lead-generation-worker.test.ts" \
  "src/validation/tests/local-seo-worker.test.ts" \
  "src/validation/tests/crm-worker.test.ts" \
  "src/validation/tests/booking-worker.test.ts"
# 48 pass / 0 fail (12 each suite)
```

## Stop

Q7-08 complete. Do not begin Q7-09.
