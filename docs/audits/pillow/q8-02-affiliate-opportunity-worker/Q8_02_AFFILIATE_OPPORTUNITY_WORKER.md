# Q8-02 Affiliate Opportunity Worker

## Mission

- **ID:** Q8-02
- **Name:** Affiliate Opportunity Worker
- **Doctrine:** `PILLOW-AOW-001`
- **Module:** `pillow/src/affiliate-opportunity-worker/`
- **Worker ID:** `wkr-affiliate-opportunity-01`
- **Status:** **FINAL PASS**

## Prior gates

| Mission | Status |
|---|---|
| Q8-01 Affiliate Factory Core | FINAL PASS |

## Deliverable

Evidence-based discovery and evaluation of affiliate programmes, products, niches, commissions, demand and competition. Ranks opportunities and emits Q8-03-consumable Affiliate Opportunity Reports.

Does **not** create content, publish websites, join programmes automatically, or fabricate commission/demand data.

## Wiring evidence

- Session: `pillow/src/session.ts` (`affiliateOpportunityWorker`, `requirePillowAffiliateOpportunityWorker`)
- Barrel: `pillow/src/index.ts`
- Subsystem: `affiliate-opportunity-worker` in `orchestrator/types.ts` + `subsystem-registry.ts`
- Host: `backend/src/orchestration/pillow-host/pillow-host.ts`
- Routes: `/api/pillow/affiliate-opportunity-worker/*`
- Offline bridge: `backend/src/orchestration/pillow-host/affiliate-opportunity-worker-bridge.ts`
- Governance: `docs/governance/EMPIREAI_AFFILIATE_OPPORTUNITY_WORKER_SYSTEM.md`
- Config: `config/affiliate-opportunity-worker.config.json`

## Observed validation

On 2026-08-02:

```text
node --import tsx --test \
  "src/validation/tests/affiliate-opportunity-worker.test.ts" \
  "src/validation/tests/affiliate-factory-core.test.ts"
# 24 pass / 0 fail
```

Example engine run produced opportunityScore `71`, recommendation `recommend`.

## Stop

Q8-02 complete. Do not begin Q8-03.
