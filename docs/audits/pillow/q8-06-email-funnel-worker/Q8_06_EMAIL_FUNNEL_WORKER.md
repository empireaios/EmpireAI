# Q8-06 Email Funnel Worker

## Mission

- **ID:** Q8-06
- **Name:** Email Funnel Worker
- **Doctrine:** `PILLOW-EFW-001`
- **Module:** `pillow/src/email-funnel-worker/`
- **Worker ID:** `wkr-email-funnel-01`
- **Status:** **FINAL PASS**

## Prior gates

| Mission | Status |
|---|---|
| Q8-01 Affiliate Factory Core | FINAL PASS |
| Q8-02 Affiliate Opportunity Worker | FINAL PASS |
| Q8-03 Comparison Site Worker | FINAL PASS |
| Q8-04 Review Content Worker | FINAL PASS |
| Q8-05 SEO Content Worker | FINAL PASS |

## Deliverable

Evidence-based lead magnets, email capture strategies, welcome/nurture sequences, funnel stages, and CTA strategies from Affiliate Opportunity and SEO Content packages. Emits Q8-07-consumable Email Funnel Reports with version history.

Does **not** send live marketing emails, manage email infrastructure, fabricate conversion/performance claims, or replace Analytics Worker.

## Wiring evidence

- Session: `pillow/src/session.ts` (`emailFunnelWorker`, `requirePillowEmailFunnelWorker`)
- Barrel: `pillow/src/index.ts`
- Subsystem: `email-funnel-worker` in `orchestrator/types.ts` + `subsystem-registry.ts`
- Host: `backend/src/orchestration/pillow-host/pillow-host.ts`
- Routes: `/api/pillow/email-funnel-worker/*`
- Offline bridge: `backend/src/orchestration/pillow-host/email-funnel-worker-bridge.ts`
- Governance: `docs/governance/EMPIREAI_EMAIL_FUNNEL_WORKER_SYSTEM.md`
- Config: `config/email-funnel-worker.config.json`

## Observed validation

On 2026-08-02:

```text
node --import tsx --test "src/validation/tests/email-funnel-worker.test.ts"
# 12 pass / 0 fail

node --import tsx --test \
  "src/validation/tests/seo-content-worker.test.ts" \
  "src/validation/tests/review-content-worker.test.ts" \
  "src/validation/tests/comparison-site-worker.test.ts" \
  "src/validation/tests/affiliate-opportunity-worker.test.ts" \
  "src/validation/tests/affiliate-factory-core.test.ts"
# 60 pass / 0 fail
```

Example engine run produced `efw-rpt-0001` with `consumableByQ807: true` and confidenceScore `1`.

## Stop

Q8-06 complete. Do not begin Q8-07.
