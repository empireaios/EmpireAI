# Q8-07 Analytics Worker

## Mission

- **ID:** Q8-07
- **Name:** Analytics Worker
- **Doctrine:** `PILLOW-ANW-001`
- **Module:** `pillow/src/analytics-worker/`
- **Worker ID:** `wkr-analytics-01`
- **Status:** **FINAL PASS**

## Prior gates

| Mission | Status |
|---|---|
| Q8-01 Affiliate Factory Core | FINAL PASS |
| Q8-02 Affiliate Opportunity Worker | FINAL PASS |
| Q8-03 Comparison Site Worker | FINAL PASS |
| Q8-04 Review Content Worker | FINAL PASS |
| Q8-05 SEO Content Worker | FINAL PASS |
| Q8-06 Email Funnel Worker | FINAL PASS |

## Deliverable

Evidence-based affiliate performance measurement: clicks, conversions, commissions, revenue, SEO, and funnel KPIs; trend/anomaly analysis; optimisation recommendations; historical analytics preservation; machine-readable Analytics Reports consumable by Q8-08 Affiliate Compliance Worker.

Does **not** modify campaigns automatically, fabricate or manipulate analytics, replace Affiliate Compliance Worker, or implement Q8-08+.

## Wiring evidence

- Session: `pillow/src/session.ts` (`analyticsWorker`, `requirePillowAnalyticsWorker`)
- Barrel: `pillow/src/index.ts`
- Subsystem: `analytics-worker` in `orchestrator/types.ts` + `subsystem-registry.ts`
- Host: `backend/src/orchestration/pillow-host/pillow-host.ts`
- Routes: `/api/pillow/analytics-worker/*`
- Offline bridge: `backend/src/orchestration/pillow-host/analytics-worker-bridge.ts`
- Governance: `docs/governance/EMPIREAI_ANALYTICS_WORKER_SYSTEM.md`
- Config: `config/analytics-worker.config.json`

## Observed validation

On 2026-08-02:

```text
node --import tsx --test "src/validation/tests/analytics-worker.test.ts"
# 12 pass / 0 fail

node --import tsx --test \
  "src/validation/tests/email-funnel-worker.test.ts" \
  "src/validation/tests/seo-content-worker.test.ts" \
  "src/validation/tests/review-content-worker.test.ts" \
  "src/validation/tests/comparison-site-worker.test.ts" \
  "src/validation/tests/affiliate-opportunity-worker.test.ts" \
  "src/validation/tests/affiliate-factory-core.test.ts"
# 72 pass / 0 fail
```

Example engine run produced `anw-rpt-0001` with `consumableByQ808: true` and confidenceScore `1`.

## Stop

Q8-07 complete. Do not begin Q8-08.
