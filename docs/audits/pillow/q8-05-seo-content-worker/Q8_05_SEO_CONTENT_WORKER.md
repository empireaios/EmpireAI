# Q8-05 SEO Content Worker

## Mission

- **ID:** Q8-05
- **Name:** SEO Content Worker
- **Doctrine:** `PILLOW-SEOW-001`
- **Module:** `pillow/src/seo-content-worker/`
- **Worker ID:** `wkr-seo-content-01`
- **Status:** **FINAL PASS**

## Prior gates

| Mission | Status |
|---|---|
| Q8-01 Affiliate Factory Core | FINAL PASS |
| Q8-02 Affiliate Opportunity Worker | FINAL PASS |
| Q8-03 Comparison Site Worker | FINAL PASS |
| Q8-04 Review Content Worker | FINAL PASS |

## Deliverable

Evidence-based SEO content plans, article briefs, SEO articles, keyword mapping, and internal linking recommendations from Affiliate Opportunity and Review Content packages. Emits Q8-06-consumable SEO Content Reports with version history.

Does **not** publish articles, manipulate search rankings, fabricate SEO performance claims, or replace Analytics Worker.

## Wiring evidence

- Session: `pillow/src/session.ts` (`seoContentWorker`, `requirePillowSeoContentWorker`)
- Barrel: `pillow/src/index.ts`
- Subsystem: `seo-content-worker` in `orchestrator/types.ts` + `subsystem-registry.ts`
- Host: `backend/src/orchestration/pillow-host/pillow-host.ts`
- Routes: `/api/pillow/seo-content-worker/*`
- Offline bridge: `backend/src/orchestration/pillow-host/seo-content-worker-bridge.ts`
- Governance: `docs/governance/EMPIREAI_SEO_CONTENT_WORKER_SYSTEM.md`
- Config: `config/seo-content-worker.config.json`

## Observed validation

On 2026-08-02:

```text
node --import tsx --test "src/validation/tests/seo-content-worker.test.ts"
# 12 pass / 0 fail

node --import tsx --test \
  "src/validation/tests/review-content-worker.test.ts" \
  "src/validation/tests/comparison-site-worker.test.ts" \
  "src/validation/tests/affiliate-opportunity-worker.test.ts" \
  "src/validation/tests/affiliate-factory-core.test.ts"
# 48 pass / 0 fail
```

Example engine run produced `seow-rpt-0001` with `consumableByQ806: true` and confidenceScore `1`.

## Stop

Q8-05 complete. Do not begin Q8-06.
