# Version 1 Go-Live Preparation Checklist

> **Authority:** Grand King Executive Directive · Version 1 Operational Activation (M4)  
> **Status:** Preparation artifact — **go-live NOT executed**  
> **API:** `GET /version-1-activation/go-live-preparation`  
> **Health:** `GET /health/version-1-activation`

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

| # | Variable | Required | Notes |
|---|---|---|---|
| 1 | `LIVE_COMMERCE_INTEGRATION_MODE` | **production** | Must not remain `sandbox` |
| 2 | `CREDENTIAL_VAULT_KEY` | **yes** | Secure key for credential vault |
| 3 | `AMAZON_SP_API_CLIENT_ID` | **yes** | Amazon SP-API |
| 4 | `AMAZON_SP_API_CLIENT_SECRET` | **yes** | Amazon SP-API |
| 5 | `AMAZON_SP_API_REFRESH_TOKEN` | **yes** | Amazon SP-API |
| 6 | `CJ_DROPSHIPPING_API_KEY` or `CJ_API_KEY` | **yes** | CJ fulfilment |
| 7 | `CJ_DROPSHIPPING_API_SECRET` or `CJ_API_SECRET` | **yes** | CJ fulfilment |

---

## M3 — Live commerce activation verification

> **Doctrine:** REAL-051A Marketplace Autonomy — automation executes only after Grand King approval, executive governance approval, and valid production credentials. See `docs/governance/MARKETPLACE_AUTONOMY_DOCTRINE_REAL-051A.md`.  
> **CRI note:** Platform V1 activation (this checklist) is distinct from **future product launch** CRIR requirements — see `docs/governance/COMMERCIAL_RISK_INTELLIGENCE_DOCTRINE.md` §4.

| # | Check | Evidence |
|---|---|---|
| 1 | Amazon adapter `supportsPublish: true` | `resolveMarketplaceAdapter("amazon")` when activated |
| 2 | OAR `amazon-seller` not architecture-only | `isPlatformOperationallyLive("amazon-seller")` |
| 3 | OAR `cj-dropshipping` not architecture-only | `isPlatformOperationallyLive("cj-dropshipping")` |
| 4 | Publish path — GK + Council approval | `buildMarketplaceListingPackage` — no architecture-only blocker |
| 5 | Live commerce health | `GET /reality-integration/live-commerce/health` |

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
4. Amazon adapter reverts to `supportsPublish: false`
5. OAR platforms return to architecture-only

---

## Explicitly NOT in scope (M4)

- Executing go-live
- PROOF-001 commercial transaction
- Grand King go-live signature (B7)
- Additional marketplace activation

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
