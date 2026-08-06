# Revenue Readiness and First Commerce Launch

## Verdict

**Supplier→Amazon path:** READY AFTER GRAND KING ACTION  
**Not:** LIVE AND OPERATIONAL

Form **B** applies:

> EmpireAI can perform the commercial chain steps in code (CJ pull → normalize/sync → score/recommend → prepare Amazon listing package → King-gated publish adapter). The binding blocker for **live** Amazon write is that `LIVE_COMMERCE_INTEGRATION_MODE` is not set to `production` on Railway (defaults to sandbox), so `supportsPublish` stays false. Credentials for Amazon SP-API and CJ are already PRESENT.

## End-to-end stage matrix

| # | Stage | Status | Exact blocker |
|---|-------|--------|---------------|
| 1 | Connect suppliers | Creds + `CJ_INTEGRATION_MODE=LIVE` on Railway | Live auth/product pull still must be executed once |
| 2 | Pull catalogue | Implemented | Live pull not re-proven in addendum window |
| 3 | Normalize | Implemented | — |
| 4 | Supplier quality/policy | Partial engines | Manual King review for first batch |
| 5 | Marketplace eligibility | Partial | Amazon category validation on first SKU |
| 6 | Landed cost / fees / margin | Engines present | Verify numbers on first SKU before scale |
| 7 | Score/rank | Present | — |
| 8 | Pillow recommend | Present when session healthy | — |
| 9 | Grand King approval | Required by adapter | Explicit approve on package |
| 10 | Listing content | Package API | — |
| 11 | Publish to Amazon | **Gated** | Set `LIVE_COMMERCE_INTEGRATION_MODE=production` |
| 12–20 | Track/sync/orders/learn/scale | Partial after first live listing | Do not scale before first success |

## Exact Grand King actions (order)

1. In Amazon Seller Central, confirm SP-API app still authorised for US/SG (as configured).  
2. On Railway, set **`LIVE_COMMERCE_INTEGRATION_MODE=production`**.  
3. Confirm **`CJ_INTEGRATION_MODE=LIVE`** (not sandbox fixtures).  
4. Keep **`EMPIRE_V1_OPERATIONAL_READY=false`** until first controlled publish succeeds; then set `true` only after validation.  
5. Redeploy/restart Brain if env change requires it.  
6. Authenticate to Cockpit → run readiness: `GET /amazon-global-seller/readiness`.  
7. Pull **1–5** CJ products; create listing package(s); approve as Grand King; publish only the approved set.  
8. Measure: listing accepted, no policy reject, cost of ads/ops for 7 days.

## Safe first batch

- **Size:** 1–5 products (not thousands)  
- **Rollback:** unpublish/end listing in Seller Central; set `LIVE_COMMERCE_INTEGRATION_MODE=sandbox` to re-disable write  
- **Success metrics:** listing live; no 502 during workflow; known SKU identity in EmpireAI listings table; optional first order later  
- **Next review:** 7 days after first publish  

## What not to do

- Do not build new programmes or media/finance expansions first.  
- Do not launch 10,000 SKUs.  
- Do not treat sandbox/demo UI numbers as revenue.
