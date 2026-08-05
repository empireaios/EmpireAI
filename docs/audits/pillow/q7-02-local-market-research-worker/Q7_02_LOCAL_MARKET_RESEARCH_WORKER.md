# Q7-02 Local Market Research Worker

## Mission

- **ID:** Q7-02
- **Name:** Local Market Research Worker
- **Doctrine:** `PILLOW-LMRW-001`
- **Module:** `pillow/src/local-market-research-worker/`
- **Worker ID:** `wkr-local-market-research-01`
- **Status:** **FINAL PASS**

## Prior gate

Q7-01 Local Business Factory Core evidence verified as `FINAL PASS` at `docs/audits/pillow/q7-01-local-business-factory-core/CERTIFICATION_EVIDENCE.json`.

## Deliverable

Evidence-based local market research for a defined location and service category — demand, competitors, pricing, pain points, gaps, opportunities, attractiveness — for Pillow and the Local Business Factory. Consumable by Q7-03 via `getQ703ConsumableContract()` / `consumableByQ703`.

Does **not** finalize service packages, set final prices, make launch decisions, build booking/websites, contact customers/competitors without approval, or purchase data/ads without approval.

## Capabilities verified (test evidence)

| # | Capability | Test |
|---|------------|------|
| 1 | Boundary locks | test 1 |
| 2 | Initialize PILLOW-LMRW-001 | test 2 |
| 3 | Validate required inputs | test 3 |
| 4 | Submit location+category research | test 4 |
| 5 | Local demand + evidence classes | test 5 |
| 6 | Competitor profiles + dedupe | test 6 |
| 7 | Pricing evidence (no final price) | test 7 |
| 8 | Pain points + service gaps | test 8 |
| 9 | Opportunities from evidence | test 9 |
| 10 | Full Local Market Research Report | test 10 |
| 11 | ERR submit | test 11 |
| 12 | Reject Q7-03 / fabricate / finalize / prices | test 12 |
| 13 | Q7-03 contract + cockpit | test 13 |

## Wiring evidence

- Session: `createLocalMarketResearchWorker` + bind to `localBusinessFactoryCore` + ERR/registry/lifecycle
- `requirePillowLocalMarketResearchWorker()`
- Subsystem id `local-market-research-worker` (Q7-02)
- Host methods + `/api/pillow/local-market-research-worker/*`
- Bridge / governance / config

## Observed validation

On 2026-08-02:

```text
node --import tsx --test "src/validation/tests/local-market-research-worker.test.ts" "src/validation/tests/local-business-factory-core.test.ts"
# 25 pass / 0 fail (13 LMRW + 12 LBFC)
```
