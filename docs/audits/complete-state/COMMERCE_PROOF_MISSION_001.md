# Commerce Proof Mission 001 — First Product / First Dollar Path

**Mission class:** Implementation · closure · no new architecture  
**Date:** 2026-08-07  
**Baseline:** Commerce Executive Certification  

## Phase 1 — Pipeline verification (before repair)

| Stage | Finding |
|-------|---------|
| Supplier (CJ) | Creds + `CJ_INTEGRATION_MODE=LIVE` PRESENT; live health route **404** in production |
| Pillow | Chat/session **PROVEN** |
| Marketplace routes | **404** — production `earlyListen` skipped REAL module routes (`Skipping REAL module HTTP route registration in production`) |
| Publish executor | **Missing** — queue-only; no `putListingsItem` |
| `LIVE_COMMERCE_INTEGRATION_MODE` | Was MISSING (sandbox default) |

## Phase 2 — Repairs performed (minimal)

1. **`registerCommerceCriticalRoutes`** in production earlyListen path — Amazon Global Seller, marketplace publishing, V1 activation/CJ health.  
2. **`executeAmazonListingsPublish`** — LWA form-urlencoded refresh + `putListingsItem` via existing HTTP transport.  
3. **`POST /marketplace-publishing/execute`** — Grand King–approved package → live Amazon call.  
4. **Amazon formatter** — `amazon-us` / `amazon-sg` use Amazon payload shape.  
5. **LWA refresh encoding fix** in `amazon-sp-api-adapter.ts`.  
6. **Railway:** `LIVE_COMMERCE_INTEGRATION_MODE=production`, `EMPIRE_EXTENSION_ROUTE_DEFER_MS=0`.

## Phase 3 — Production commerce prerequisites

| Prerequisite | Status after mission |
|--------------|----------------------|
| `LIVE_COMMERCE_INTEGRATION_MODE=production` | SET on Railway |
| `CJ_INTEGRATION_MODE=LIVE` | Confirmed |
| Amazon SP-API credentials | PRESENT |
| `supportsPublish` | true when production mode + creds (after deploy of tip) |
| Commerce routes on critical path | Code repair — requires deploy |
| Listing package generation | Existing + execute path |

## Phase 4 — Live proof

Run after deploy of this tip:

```bash
node docs/audits/complete-state/commerce-proof-001.mjs
```

Evidence file: `COMMERCE_PROOF_001_EVIDENCE.json` (written by the script).

## Phase 5 — Stop conditions

Mission stops after publication proof (or live API call with Amazon response).  
Does **not** expand into ads, multi-SKU scale, or new engines.

### Remaining blocker → FIRST ORDER
Customer must discover and purchase the published SKU on Amazon (organic or paid traffic).

### Remaining blocker → FIRST DOLLAR
Paid order must settle (Amazon payout) after fulfilment (CJ path when order exists).
