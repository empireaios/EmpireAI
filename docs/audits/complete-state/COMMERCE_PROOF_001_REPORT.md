# Commerce Proof Mission 001 — First Product / First Dollar

**Date:** 2026-08-07  
**Baseline:** Commerce Executive Certification  
**Rule:** No new architecture — repair only  

## Phase 1 — Pipeline verification (before repair)

| Stage | Finding |
|-------|---------|
| Supplier (CJ) | Creds + `CJ_INTEGRATION_MODE=LIVE` present; live health route **404** in production |
| Pillow | Chat/session **operational** (prior live probe) |
| Marketplace routes | **404** — production earlyListen skipped REAL module routes (`Skipping REAL module HTTP route registration`) |
| Amazon publish | Queue-only; **no putListingsItem** executor |
| `LIVE_COMMERCE_INTEGRATION_MODE` | Was MISSING → sandbox; **set to production** this mission |

## Phase 2 — Repairs implemented (minimal)

1. **`registerCommerceCriticalRoutes`** on production earlyListen path — Amazon Global Seller, marketplace publishing, V1 activation (CJ live auth health) without waiting for `EMPIRE_ENABLE_EXTENSION_ROUTES`.  
2. **`executeAmazonListingsPublish`** — LWA form-urlencoded refresh + `putListingsItem` on existing marketplace-publishing path.  
3. **`POST /marketplace-publishing/execute`** — King-approved package → live Amazon call.  
4. **Amazon formatter** — `amazon-us` / `amazon-sg` use Amazon payload (were falling through to default).  
5. **LWA refresh** in adapter — form-urlencoded (was incorrectly JSON).  
6. **Railway:** `LIVE_COMMERCE_INTEGRATION_MODE=production`, `EMPIRE_EXTENSION_ROUTE_DEFER_MS=0`.

## Phase 3 — Production commerce flags

| Prerequisite | Status |
|--------------|--------|
| `LIVE_COMMERCE_INTEGRATION_MODE=production` | **SET** |
| `CJ_INTEGRATION_MODE=LIVE` | **SET** (pre-existing) |
| Amazon credentials | PRESENT |
| `supportsPublish` | true when production mode + Amazon creds (after deploy) |
| Listing package generation | Existing + repaired formatter |
| Media generation | Not required for first proof (supplier image URL) |
| Pricing / margin | Heuristic recorded in proof script |

## Phase 4–5 — Proof execution

Run after deploy of this commit:

```bash
node backend/scripts/commerce-proof-001.mjs
```

Evidence written to:

`docs/audits/complete-state/COMMERCE_PROOF_001_EVIDENCE.json`

### Expected verdicts

| Verdict | Meaning |
|---------|---------|
| `PUBLISH_ACCEPTED` | Amazon accepted putListingsItem |
| `LIVE_API_CALLED_NOT_ACCEPTED` | Live call made; Amazon rejected (schema/ASIN/category) — still live evidence |
| `PUBLISH_NOT_EXECUTED` | Gate/credentials/route failure |

## Remaining blockers (after successful publish path)

**To FIRST ORDER:** A real customer must purchase the live Amazon listing (discoverability / ads / organic).  

**To FIRST DOLLAR:** Order must be fulfilled and Amazon payout/settlement received.

If Amazon returns validation issues on productType `PRODUCT`, remaining publish blocker is **Amazon product-type / catalog attributes / GTIN exemptions** for the seller account — fix that specific listing payload, do not build new engines.
