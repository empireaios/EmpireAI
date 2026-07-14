# Executive Audit — B6-01C Marketplace Governance Amendment v2

**Mission:** B6-01C  
**Date:** 2026-07-02  
**Authority:** Grand King Executive Directive — Marketplace Governance Amendment v2  
**Mode:** Governance and registry documentation only — **no code, no adapters**  
**Canonical registry:** [`docs/governance/V1_MARKETPLACE_CHANNEL_REGISTRY.md`](../docs/governance/V1_MARKETPLACE_CHANNEL_REGISTRY.md)  
**Decision record:** ADR-052 · `EMPIREAI_DECISIONS.md`

---

## Executive Summary

B6-01C v2 amends EmpireAI Version 1 marketplace governance per the King's refined requirement. V1 **must support four channel identities**:

| Registry ID | V1 role |
|-------------|---------|
| `amazon-us` | Mandatory live path |
| `amazon-sg` | Mandatory live path |
| `shopee-sg` | Mandatory live path |
| `shopify` | **Mandatory architecture provision** (live launch optional until King approval) |

**Superseded:** B6-01A DEFER recommendation (void). Single-generic-Amazon V1 assumptions. Narrow three-marketplace-only implementation ceiling.

**Future-proof model:** All marketplaces register as **Country × Marketplace × Credential Profile × API Capability** with eleven registry dimensions (region, endpoint, fulfilment, listing, payment, policy, tax/fee, launch readiness). V1 defines four canonical channels; expansion registry pre-documents Lazada, TikTok Shop, eBay, Etsy, Walmart, additional Amazon/Shopee countries, Shopify stores, and direct storefronts.

**No runtime changes** in this mission. Implementation deferred to B6-01D onward.

---

## Files Changed

| File | Change |
|------|--------|
| `docs/governance/V1_MARKETPLACE_CHANNEL_REGISTRY.md` | **Created** — canonical V1 + expansion registry |
| `EMPIREAI_DECISIONS.md` | **Added ADR-052** |
| `GO-002_GRAND_KING_OPERATIONAL_MASTER_PLAN.md` | P3 amended — four V1 channels |
| `GO-001_OPERATIONAL_READINESS_REPORT.md` | HP-10, MP-08, PROOF-001 scope amended |
| `docs/governance/VERSION_1_CERTIFICATION_BLOCKER_REGISTER.md` | B6 scope amended |
| `docs/governance/VERSION_1_GO_LIVE_PREPARATION_CHECKLIST.md` | M2/M3 multi-channel credentials + verification |
| `docs/governance/MARKETPLACE_AUTONOMY_DOCTRINE_REAL-051A.md` | V1 registry cross-reference |
| `SA-001_ARCHITECTS_FINAL_RECOMMENDATIONS.md` | V1 adapter scope amended |
| `artifacts/b6-01a-amazon-sp-api-executive-audit.md` | SUPERSEDED banner |
| `artifacts/b6-01a-amazon-sp-api-evidence.json` | `superseded: true` |
| `artifacts/b6-01b-marketplace-architecture-executive-audit.md` | Amended-by B6-01C banner |
| `artifacts/b6-01c-marketplace-governance-amendment-v2-executive-audit.md` | **This document** |

**Not changed (implementation deferred):** `backend/**`, `deployment/railway-production.env.template`, `b6-credential-implementation.ts`, live-commerce adapters.

---

## Governance Updated

| Document | Before | After (B6-01C) |
|----------|--------|----------------|
| **ADR-052** | — | V1 four-channel registry adopted |
| **GO-002 P3** | one SKU · Amazon · CJ · Stripe | `amazon-us` · `amazon-sg` · `shopee-sg` · `shopify` provision + CJ + Stripe |
| **B6 blocker register** | Single Amazon SP-API trio | Four V1 channels + CJ + Stripe + vault |
| **Go-live M2** | Single `AMAZON_SP_API_REFRESH_TOKEN` | Per-region Amazon tokens + Shopee + Shopify provision |
| **Go-live M3** | Single `amazon-seller` OAR check | US + SG + Shopee + Shopify provision checks |
| **GO-001 PROOF-001** | Amazon marketplace only | King-approved V1 live channel |
| **GO-001 MP-08** | Shopify post-V1 | Shopify V1 architecture provision |
| **B6-01A** | DEFER Amazon | **VOID — superseded** |
| **REAL-051A** | Multi-marketplace autonomy | Linked to V1 registry |

---

## Marketplace / Channel Model

### V1 canonical layer

```
┌─────────────────────────────────────────────────────────────┐
│                    VERSION 1 (King mandate)                  │
├──────────────┬──────────────┬──────────────┬──────────────────┤
│  amazon-us   │  amazon-sg   │  shopee-sg   │     shopify      │
│  LIVE PATH   │  LIVE PATH   │  LIVE PATH   │  ARCH PROVISION  │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬─────────┘
       │              │              │                │
       └──────────────┴──────────────┴────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  cj-dropshipping  │  (V1 supplier)
                    │  stripe (B6-03)   │  (V1 payments)
                    │  credential vault │  (B6-04 ✅)
                    └───────────────────┘
```

### Future expansion layer (registry-only in B6-01C)

Pre-registered in `V1_MARKETPLACE_CHANNEL_REGISTRY.md` §3.2 — added by profile row, not V1 constant refactor:

Lazada SG · TikTok Shop · eBay · Etsy · Walmart · Amazon additional countries · Shopee additional countries · Shopify per-store instances · direct storefronts

### Registry dimension schema (every marketplace profile)

1. Country  
2. Marketplace  
3. Region  
4. Credential set  
5. API endpoint  
6. Fulfilment rules  
7. Listing rules  
8. Payment rules  
9. Policy rules  
10. Tax / fee assumptions  
11. Launch readiness  

---

## Shopify Provision Model

| Aspect | V1 requirement |
|--------|----------------|
| **Registry entry** | `shopify` with full dimension schema |
| **Adapter slot** | Reserved in live-commerce layer (not implemented) |
| **Credential schema** | `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_API_TOKEN`, OAuth app creds |
| **Capabilities** | catalog_sync, listing_readiness, orders, webhooks, publish |
| **Live launch** | **Not mandatory** for V1 architecture certification |
| **King approval** | Required before first Shopify live publish (REAL-051A) |
| **Doctrine fit** | Dedicated Shopify stores for premium/branded products (REAL-051A Principle C) |

Shopify satisfies V1 by proving the **marketplace/channel layer can host Shopify** — same registry pattern as Amazon and Shopee — without requiring Railway Shopify credentials at B6-01C.

---

## Future Marketplace Expansion Model

```
Marketplace Profile ID = f(country, marketplace, credential_profile, api_capability)

Example future add (no V1 code change):
  lazada-sg = SG × Lazada × OAuth credential profile × catalog+orders API
```

**Implementation rule (governance):** New marketplaces append to expansion registry → implement adapter → add B6 credential item → live auth proof. **Never** replace V1 array constants with hard-coded closed lists in application code (future mission guidance).

---

## Remaining Implementation Missions

| Order | Mission | Scope |
|-------|---------|-------|
| 1 | **B6-01C** ✅ | Governance amendment (this mission) |
| 2 | **B6-01D** | Amazon multi-region credential model (NA + FE) |
| 3 | **B6-06** | Shopee SG live adapter |
| 4 | **B6-08** | Shopify adapter slot + credential schema (architecture provision) |
| 5 | **B6-01E** | Amazon US live auth proof |
| 6 | **B6-01F** | Amazon SG live auth proof |
| 7 | **B6-07** | Shopee SG live auth proof |
| 8 | **B6-01G** | Shopify architecture provision verification (registry + schema; live optional) |
| 9 | **B6-05** | Multi-channel connectivity test (redefined) |
| 10 | **B7 → B8** | Go-live approval → PROOF-001 |

**Already verified (unchanged):** B6-03 Stripe ✅ · B6-04 Vault ✅ · B6-02 CJ configured

---

## Certification Impact

| Area | Impact |
|------|--------|
| **B6 scope** | Expanded — four V1 channels vs single Amazon |
| **B6 closure** | Harder — more credential proofs required |
| **V1-CERT** | Requires tri-marketplace live paths + Shopify provision evidence |
| **PROOF-001** | First SKU may launch on any **King-approved V1 live channel** |
| **Code gap** | Runtime still single-Amazon — **B6 not closable** until implementation missions |
| **B6-01A DEFER** | **Removed from certification path** |
| **Shopify** | Architecture provision becomes V1 certification criterion; live Shopify optional |
| **Future expansion** | Registry model prevents re-audit when adding Lazada/TikTok/etc. |

### Current production vs amended governance

| Item | Production (2026-07-02) | Governance (post B6-01C) |
|------|---------------------------|---------------------------|
| B6-03 Stripe | VERIFIED | Unchanged |
| B6-04 Vault | VERIFIED | Unchanged |
| B6-02 CJ | CONFIGURED | Unchanged |
| B6-01 Amazon | PENDING (single) | Split: US + SG pending |
| Shopee SG | Not tracked | B6-01c pending |
| Shopify | Post-V1 in docs | B6-01d provision pending |

---

## Scope Compliance

- ✅ B6-01C v2 scope (four channels + Shopify provision + future model)
- ✅ Superseded Amazon deferral
- ✅ Superseded single-generic-Amazon assumption
- ✅ Defined V1 architecture: amazon-us, amazon-sg, shopee-sg, shopify
- ✅ Defined expansion model: Country × Marketplace × Credential × Capability
- ✅ Updated governance, roadmap references, certification docs
- ✅ Created marketplace registry documentation
- ❌ No code implemented
- ❌ No live adapters created
- ❌ Did not proceed to B6-05 implementation

---

## Operator Reference

**Canonical registry (maintain going forward):**  
[`docs/governance/V1_MARKETPLACE_CHANNEL_REGISTRY.md`](../docs/governance/V1_MARKETPLACE_CHANNEL_REGISTRY.md)

**Void artifact:** B6-01A DEFER recommendation — do not follow.
