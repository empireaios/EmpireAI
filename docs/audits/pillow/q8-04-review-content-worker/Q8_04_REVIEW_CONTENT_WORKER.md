# Q8-04 Review Content Worker

## Mission

- **ID:** Q8-04
- **Name:** Review Content Worker
- **Doctrine:** `PILLOW-RCW-001`
- **Module:** `pillow/src/review-content-worker/`
- **Worker ID:** `wkr-review-content-01`
- **Status:** **FINAL PASS**

## Prior gates

| Mission | Status |
|---|---|
| Q8-01 Affiliate Factory Core | FINAL PASS |
| Q8-02 Affiliate Opportunity Worker | FINAL PASS |
| Q8-03 Comparison Site Worker | FINAL PASS |

## Deliverable

Evidence-based review articles, pros/cons, alternatives, buying recommendations, ICPs, and limitation/trade-off sections from Affiliate Opportunity and Comparison Site packages. Emits Q8-05-consumable Review Content Reports with version history.

Does **not** publish websites, fabricate reviews/ratings/product information, manipulate ratings, or replace Comparison Site Worker.

## Wiring evidence

- Session: `pillow/src/session.ts` (`reviewContentWorker`, `requirePillowReviewContentWorker`)
- Barrel: `pillow/src/index.ts`
- Subsystem: `review-content-worker` in `orchestrator/types.ts` + `subsystem-registry.ts`
- Host: `backend/src/orchestration/pillow-host/pillow-host.ts`
- Routes: `/api/pillow/review-content-worker/*`
- Offline bridge: `backend/src/orchestration/pillow-host/review-content-worker-bridge.ts`
- Governance: `docs/governance/EMPIREAI_REVIEW_CONTENT_WORKER_SYSTEM.md`
- Config: `config/review-content-worker.config.json`

## Observed validation

On 2026-08-02:

```text
node --import tsx --test "src/validation/tests/review-content-worker.test.ts"
# 12 pass / 0 fail

node --import tsx --test \
  "src/validation/tests/comparison-site-worker.test.ts" \
  "src/validation/tests/affiliate-opportunity-worker.test.ts" \
  "src/validation/tests/affiliate-factory-core.test.ts"
# 36 pass / 0 fail
```

Example engine run produced `rcw-rpt-0001` with `consumableByQ805: true`, verdict `buy_with_conditions`, confidenceScore `1`.

## Stop

Q8-04 complete. Do not begin Q8-05.
