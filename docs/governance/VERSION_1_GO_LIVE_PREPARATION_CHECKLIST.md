# Version 1 Go-Live Preparation Checklist

> **Authority:** Grand King Executive Directive · Version 1 Operational Activation (M4)  
> **Status:** Preparation artifact — **go-live NOT executed**  
> **API:** `GET /version-1-activation/go-live-preparation`  
> **Amended:** 2026-07-02 · B6-01C — V1 marketplace/channel credentials per `docs/governance/V1_MARKETPLACE_CHANNEL_REGISTRY.md`

---

## Pre-flight (before setting production mode)

| # | Check | Command / endpoint | Pass criteria |
|---|---|---|---|
| 1 | Backend typecheck | `npm run typecheck` (backend) | Zero errors |
| 2 | Validation tests | `npm run test:validation` | All pass including `version-1-operational-activation.test.ts` |
| 3 | General health | `GET /health` | `status: ok` |
| 4 | V1 activation assessment | `GET /health/version-1-activation` | Review blockers list |

---

## M2 — Production credentials

> **V1 channels:** `amazon-us` · `amazon-sg` · `shopee-sg` · `shopify` (architecture provision) — full matrix in `V1_MARKETPLACE_CHANNEL_REGISTRY.md`

| # | Variable | Required | Notes |
|---|---|---|---|
| 1 | `LIVE_COMMERCE_INTEGRATION_MODE` | **production** | Must not remain `sandbox` |
| 2 | `CREDENTIAL_VAULT_KEY` | **yes** | Secure key for credential vault |
| 3 | `AMAZON_SP_API_CLIENT_ID` | **yes** | Shared SP-API app (US + SG) |
| 4 | `AMAZON_SP_API_CLIENT_SECRET` | **yes** | Shared SP-API app |
| 5 | `AMAZON_SP_API_REFRESH_TOKEN_NA` | **yes** | Amazon US (NA region) — governance |
| 6 | `AMAZON_SP_API_REFRESH_TOKEN_FE` | **yes** | Amazon SG (FE region) — governance |
| 7 | `SHOPEE_PARTNER_ID` / `SHOPEE_PARTNER_KEY` | **yes** | Shopee SG Open Platform |
| 8 | `SHOPEE_SHOP_ID` | **yes** | After OAuth authorization |
| 9 | `SHOPIFY_*` credential profile | **provision** | Architecture schema defined; live optional until King approval |
| 10 | `CJ_DROPSHIPPING_API_KEY` or `CJ_API_KEY` | **yes** | CJ fulfilment |
| 11 | `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | **yes** | Stripe live (B6-03) |

*Legacy single `AMAZON_SP_API_REFRESH_TOKEN` — superseded by per-region tokens (B6-01C).*

---

## M3 — Live commerce activation verification

> **Doctrine:** REAL-051A Marketplace Autonomy — automation executes only after Grand King approval, executive governance approval, and valid production credentials. See `docs/governance/MARKETPLACE_AUTONOMY_DOCTRINE_REAL-051A.md`.  
> **CRI note:** Platform V1 activation (this checklist) is distinct from **future product launch** CRIR requirements — see `docs/governance/COMMERCIAL_RISK_INTELLIGENCE_DOCTRINE.md` §4.

| # | Check | Evidence |
|---|---|---|
| 1 | Amazon US (`amazon-us`) live readiness | SP-API NA token + marketplace `ATVPDKIKX0DER` |
| 2 | Amazon SG (`amazon-sg`) live readiness | SP-API FE token + marketplace `A19VAU5U5O7RUS` |
| 3 | Shopee SG (`shopee-sg`) live readiness | Open Platform OAuth + shop authorization |
| 4 | Shopify (`shopify`) architecture provision | Registry slot + credential schema verified (live optional) |
| 5 | OAR `cj-dropshipping` not architecture-only | `isPlatformOperationallyLive("cj-dropshipping")` |
| 6 | Publish path — GK + Council approval | `buildMarketplaceListingPackage` — no architecture-only blocker |
| 7 | Live commerce health | `GET /reality-integration/live-commerce/health` |

---

## M5 — Pillow production mode

| # | Check | Notes |
|---|---|---|
| 1 | Run M1 production readiness review | `GET /version-1-activation/readiness` — `productionReadinessPassed: true` |
| 2 | Set `EMPIRE_V1_OPERATIONAL_READY=true` | **Only after** step 1 passes |
| 3 | Restart Pillow host | Dry-run flags lift; approval gates **remain** |
| 4 | Verify Cursor bridge | `dryRunLaunch: false` when M5 enabled |

---

## Deployment verification

| # | Item | Status field |
|---|---|---|
| 1 | Production readiness review | `/version-1-activation/readiness` |
| 2 | Go-live preparation package | `/version-1-activation/go-live-preparation` |
| 3 | Grand King checklist | Included in preparation package |
| 4 | Version 1 go-live approval assessment | Included in preparation package |

---

## Rollback readiness

To revert to safe pre-live state without code changes:

1. Set `LIVE_COMMERCE_INTEGRATION_MODE=sandbox`
2. Set `EMPIRE_V1_OPERATIONAL_READY=false`
3. Restart backend (Pillow returns to dry-run)
4. Amazon US/SG adapters revert to pre-live readiness
5. OAR platforms return to architecture-only where not verified

---

## Explicitly NOT in scope (M4)

- Executing go-live
- PROOF-001 commercial transaction
- Grand King go-live signature (B7)
- Additional marketplace activation beyond V1 registry expansion process

---

## Future product launches — CRI gate (documentation)

Before any **future product launch** (post–V1 activation), the following **documentation** requirements apply per ADR-051:

| # | Requirement | Reference |
|---|---|---|
| 1 | Commercial Risk Intelligence Report (CRIR) with all 10 minimum sections | `COMMERCIAL_RISK_INTELLIGENCE_REPORT_SPECIFICATION.md` |
| 2 | Commercial risk certification (`GOVERNANCE_CERTIFIED` minimum; `GRAND_KING_APPROVED` when policy requires) | CRI Doctrine CRI-004 |
| 3 | Finance review on margin, worst-case exposure, survivability | CRI Doctrine CRI-008 |
| 4 | Survivability assessment must not be **FAIL** | CRI Doctrine CRI-003 |

**Runtime enforcement** of CRIR gates in `commerce-readiness-engine` is deferred to future REAL missions — this checklist records the governance obligation only.

---

*Prepared by Version 1 Operational Activation mission · M4*
