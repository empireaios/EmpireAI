# Version 1 Marketplace & Channel Registry

> **Authority:** Grand King Executive Directive · B6-01C Governance Amendment v2  
> **Status:** ✅ **ACTIVE** — canonical marketplace/channel governance  
> **Effective:** 2026-07-02  
> **Supersedes:** B6-01A Amazon deferral · single-generic-Amazon V1 assumptions  
> **Companion:** `MARKETPLACE_AUTONOMY_DOCTRINE_REAL-051A.md` · ADR-052 · `EMPIREAI_DECISIONS.md`  
> **Runtime impact:** None until future implementation missions — **governance and registry only**

---

## 1. Purpose

Define the **Version 1 mandatory marketplace/channel set**, the **future-proof expansion model**, and the **registry dimensions** EmpireAI uses to add marketplaces without hard-coding V1 as a closed three-marketplace list.

This registry is the **single governance source** for:

- Which channels are **V1-required** vs **V1-provisioned** vs **future expansion**
- How **Country × Marketplace × Credential Profile × API Capability** composes
- What **Shopify architecture provision** means for V1 (capability without mandatory first launch)

---

## 2. Version 1 canonical requirement (King directive)

EmpireAI Version 1 **must support** exactly these four channel identities:

| Registry ID | Display | Country | Type | V1 role |
|-------------|---------|---------|------|---------|
| `amazon-us` | Amazon US | US | Marketplace | **Mandatory live path** |
| `amazon-sg` | Amazon Singapore | SG | Marketplace | **Mandatory live path** |
| `shopee-sg` | Shopee Singapore | SG | Marketplace | **Mandatory live path** |
| `shopify` | Shopify | Global (store-scoped) | Channel / storefront | **Mandatory architecture provision** |

**Supplier (unchanged):** `cj-dropshipping` — sole V1 live fulfilment supplier.  
**Payments (unchanged):** Stripe live — primary payment rail.

### V1 role definitions

| Role | Meaning |
|------|---------|
| **Mandatory live path** | Must reach live credential verification + connectivity proof before B6 closure (implementation missions). First PROOF-001 SKU may launch on any King-approved V1 live path. |
| **Mandatory architecture provision** | Platform layer must expose adapter registry slot, credential profile schema, capability matrix, and go-live readiness hooks — **without requiring live launch** unless King approves. |

**Shopify:** Required as **architecture provision** in V1. Shopify is **not** required as the first live launch channel unless later approved by the King.

---

## 3. Future marketplace expansion model

V1 defines **four canonical channels**. The architecture **must not** hard-code only these four forever. All marketplaces — present and future — register using:

```
Marketplace Profile = Country × Marketplace × Credential Profile × API Capability
```

### 3.1 Registry dimensions (required for every marketplace profile)

| Dimension | Description | Example (amazon-us) |
|-----------|-------------|---------------------|
| **Country** | ISO country code + commerce jurisdiction | `US` |
| **Marketplace** | Platform identity within country | `amazon` |
| **Registry ID** | Stable EmpireAI identifier | `amazon-us` |
| **Reality provider ID** | Runtime adapter binding | `amazon-seller` |
| **Region** | API region / endpoint group | `NA` (`sellingpartnerapi-na.amazon.com`) |
| **Credential set** | Env keys + vault refs required for live | LWA client + NA refresh token + IAM signing |
| **API endpoint** | Production base URL | `https://sellingpartnerapi-na.amazon.com` |
| **Marketplace ID** | Platform-native marketplace identifier | `ATVPDKIKX0DER` |
| **Fulfilment rules** | FBA / FBM / platform logistics / CJ bridge | FBM + CJ dropship eligible |
| **Listing rules** | Category, attribute, media constraints | Amazon listing policy + formatter |
| **Payment rules** | Platform payout vs Stripe vs local gateway | Amazon disbursement |
| **Policy rules** | King approval, Guardian, REAL-051A autonomy | `requires_king_approval: true` |
| **Tax / fee assumptions** | Default fee model for margin intelligence | Referral + FBA fee placeholders |
| **Launch readiness** | Gate enum: `architecture_only` · `configured` · `verified` · `live` | `architecture_only` until B6 proof |

### 3.2 Expansion registry (non-V1 — pre-registered for clean add)

Future marketplaces **must** be added by inserting a profile row — not by refactoring V1 constants. Pre-registered expansion targets:

| Registry ID | Country | Marketplace | Status |
|-------------|---------|-------------|--------|
| `lazada-sg` | SG | Lazada | Future |
| `tiktok-shop-sg` | SG | TikTok Shop | Future |
| `tiktok-shop-us` | US | TikTok Shop | Future |
| `ebay-us` | US | eBay | Future |
| `etsy-us` | US | Etsy | Future |
| `walmart-us` | US | Walmart | Future |
| `amazon-uk` | GB | Amazon | Future |
| `amazon-de` | DE | Amazon | Future |
| `amazon-jp` | JP | Amazon | Future |
| `shopee-my` | MY | Shopee | Future |
| `shopee-id` | ID | Shopee | Future |
| `shopee-th` | TH | Shopee | Future |
| `shopee-ph` | PH | Shopee | Future |
| `shopee-vn` | VN | Shopee | Future |
| `shopify-store-*` | * | Shopify (per-store) | Future instance pattern |
| `direct-storefront-*` | * | EmpireAI owned storefront | Future (Vercel DTC) |

Code reference (architecture registry, not V1 gate): `backend/src/runtime/global-commerce/data/global-commerce-registry-data.ts`

---

## 4. Version 1 marketplace profiles (canonical)

### 4.1 Amazon US (`amazon-us`)

| Dimension | Value |
|-----------|-------|
| Country | US |
| Marketplace | Amazon |
| Region | NA |
| API endpoint | `https://sellingpartnerapi-na.amazon.com` |
| Marketplace ID | `ATVPDKIKX0DER` |
| Seller Central | `sellercentral.amazon.com` |
| Credential set (shared app) | `AMAZON_SP_API_CLIENT_ID`, `AMAZON_SP_API_CLIENT_SECRET` |
| Credential set (region) | `AMAZON_SP_API_REFRESH_TOKEN_NA` (proposed; governance) |
| Signing | AWS IAM + SP-API role |
| Fulfilment | FBM + CJ bridge (V1) |
| Launch readiness | Pending implementation + credential proof |

### 4.2 Amazon Singapore (`amazon-sg`)

| Dimension | Value |
|-----------|-------|
| Country | SG |
| Marketplace | Amazon |
| Region | FE (Far East) |
| API endpoint | `https://sellingpartnerapi-fe.amazon.com` |
| Marketplace ID | `A19VAU5U5O7RUS` |
| Seller Central | `sellercentral.amazon.sg` |
| Credential set (shared app) | Same LWA client ID/secret as US |
| Credential set (region) | `AMAZON_SP_API_REFRESH_TOKEN_FE` (proposed; governance) |
| Signing | AWS IAM + SP-API role (typically shared) |
| Fulfilment | FBM + CJ bridge (V1) |
| Launch readiness | Pending implementation + credential proof |

### 4.3 Shopee Singapore (`shopee-sg`)

| Dimension | Value |
|-----------|-------|
| Country | SG |
| Marketplace | Shopee |
| Region | APAC |
| API endpoint | `https://partner.shopeemobile.com` |
| Credential set | `SHOPEE_PARTNER_ID`, `SHOPEE_PARTNER_KEY`, `SHOPEE_SHOP_ID`, OAuth tokens (vault) |
| Auth model | OAuth 2.0 + HMAC-SHA256 per request |
| Fulfilment | Shopee logistics recommended; CJ bridge where policy allows |
| Payment rules | Platform-native payout (Stripe not required on-platform) |
| Policy rules | PDPA compliance · local payout method (human action) |
| Launch readiness | Pending adapter implementation |

### 4.4 Shopify (`shopify`) — architecture provision

| Dimension | Value |
|-----------|-------|
| Country | Store-scoped (global platform) |
| Marketplace / channel | Shopify |
| Region | Shopify Admin API (global) |
| API endpoint | `https://{shop}.myshopify.com/admin/api/{version}/` |
| Credential set | `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_API_TOKEN`, OAuth app credentials (vault) |
| Auth model | OAuth 2.0 (custom app or public app) |
| V1 requirement | **Architecture provision only** — registry slot, credential schema, capability matrix, publish/fulfilment rule hooks |
| First live launch | **King approval required** — not mandatory for V1 architecture certification |
| Fulfilment | Store-managed + CJ bridge |
| Payment rules | Shopify Payments or external (Stripe) per store config |
| Launch readiness | Architecture slot required; live optional |

---

## 5. Shopify provision model (V1)

Shopify is a **required V1 architecture provision**, distinct from mandatory live marketplace paths.

| Layer | V1 requirement |
|-------|----------------|
| **Registry** | `shopify` entry in marketplace/channel registry with full dimension schema |
| **Integrations hub** | Documented connection path; not architecture-only forever |
| **Credential profile** | Defined env + vault schema (not necessarily populated on Railway) |
| **Adapter slot** | Reserved in live-commerce adapter registry (implementation deferred) |
| **Capability matrix** | catalog_sync · listing_readiness · orders · webhooks · publish |
| **Publish gate** | `requires_king_approval: true` per REAL-051A |
| **Live launch** | Optional until King selects Shopify as first PROOF-001 channel |

**Doctrine alignment (REAL-051A Principle C):** Premium/branded products may operate dedicated Shopify stores. V1 architecture must support this without requiring it for first launch.

---

## 6. B6 credential scope (governance — post-amendment)

B6 marketplace credentials expand from single **B6-01 Amazon** to:

| Item | Label | V1 role |
|------|-------|---------|
| B6-01a | Amazon US SP-API | Mandatory live verification |
| B6-01b | Amazon SG SP-API | Mandatory live verification |
| B6-01c | Shopee SG Open Platform | Mandatory live verification |
| B6-01d | Shopify architecture provision | Registry + schema verified (live optional) |
| B6-02 | CJ Dropshipping | Unchanged |
| B6-03 | Stripe production | Unchanged |
| B6-04 | Credential vault | Unchanged |
| B6-05 | Multi-channel connectivity test | Redefined (future mission) |

*Note: B6 item IDs in runtime code remain `B6-01` until implementation mission updates `b6-credential-implementation.ts`.*

---

## 7. Superseded governance

| Artifact | Superseded by |
|----------|-------------|
| B6-01A DEFER recommendation | This registry + ADR-052 |
| GO-002 P3 "one SKU · Amazon only" | Four-channel V1 requirement |
| Single `amazon-seller` as sole V1 marketplace | `amazon-us` + `amazon-sg` + `shopee-sg` + `shopify` |
| Shopify as post-V1 only (GO-001 MP-08) | Shopify V1 architecture provision |

---

## 8. Implementation boundary

**This document does not authorize code changes.** Future missions (B6-01D onward) implement:

- Multi-region Amazon credential model
- Shopee live adapter
- Shopify adapter slot + credential schema
- B6 tracker split
- Live auth proof endpoints per channel

---

## 9. Maintenance

| Event | Action |
|-------|--------|
| New marketplace added | Add profile row to §3.2; implement adapter; no V1 constant hard-code |
| King approves new V1 channel | Amend §2 with Journey + ADR update |
| Credential schema change | Update §4 profile + `.env.example` in implementation mission |
| B6 item closed | Update launch readiness column + blocker register |

---

*Maintained by Repository Governance · B6-01C · 2026-07-02*
