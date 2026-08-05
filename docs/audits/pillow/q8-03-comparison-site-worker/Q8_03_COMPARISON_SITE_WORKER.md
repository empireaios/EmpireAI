# Q8-03 Comparison Site Worker

## Mission

- **ID:** Q8-03
- **Name:** Comparison Site Worker
- **Doctrine:** `PILLOW-CSW-001`
- **Module:** `pillow/src/comparison-site-worker/`
- **Worker ID:** `wkr-comparison-site-01`
- **Status:** **FINAL PASS**

## Prior gates

| Mission | Status |
|---|---|
| Q8-01 Affiliate Factory Core | FINAL PASS |
| Q8-02 Affiliate Opportunity Worker | FINAL PASS |

## Deliverable

Evidence-based comparison pages, ranking pages, buyer guides, and comparison tables from Affiliate Opportunity Reports / product fixtures. Emits Q8-04-consumable Comparison Site Reports.

Does **not** publish websites, fabricate rankings or product information, manipulate rankings without evidence, or replace Review Content Worker.

## Wiring evidence

- Session: `pillow/src/session.ts` (`comparisonSiteWorker`, `requirePillowComparisonSiteWorker`)
- Barrel: `pillow/src/index.ts`
- Subsystem: `comparison-site-worker` in `orchestrator/types.ts` + `subsystem-registry.ts`
- Host: `backend/src/orchestration/pillow-host/pillow-host.ts`
- Routes: `/api/pillow/comparison-site-worker/*`
- Offline bridge: `backend/src/orchestration/pillow-host/comparison-site-worker-bridge.ts`
- Governance: `docs/governance/EMPIREAI_COMPARISON_SITE_WORKER_SYSTEM.md`
- Config: `config/comparison-site-worker.config.json`

## Observed validation

On 2026-08-02:

```text
node --import tsx --test "src/validation/tests/comparison-site-worker.test.ts"
# 12 pass / 0 fail

node --import tsx --test \
  "src/validation/tests/affiliate-opportunity-worker.test.ts" \
  "src/validation/tests/affiliate-factory-core.test.ts"
# 24 pass / 0 fail
```

Example engine run produced `csw-rpt-0001` with `consumableByQ804: true` and confidenceScore `1`.

## Stop

Q8-03 complete. Do not begin Q8-04.
