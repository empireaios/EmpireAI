# Secure owner authorization for the first provider readback

Prepared 2026-09-29. No authentication has been performed. Production stays protected; Pillow NOT_BORN and commerce LOCKED. This procedure authorizes observation only, never live commerce.

## What is prepared

`deployment/provider-readback.mjs` is a standalone Node runner. It does not start/import the backend, attach Railway volumes, use production databases, run schedulers, or load commerce submission code. A separate GitHub workflow accepts pushes only on two dedicated branches; it does not run on pull requests or a timer. Work will create the relevant branch from verified code after the owner finishes secure provisioning. Do not manually rerun a failed provider job: failures and uncertain outcomes must be examined first.

| Provider | Fixed outbound operations | First evidence | Not established |
| --- | --- | --- | --- |
| Amazon US | LWA token exchange POST; one GET `searchListingsItems`, US marketplace `ATVPDKIKX0DER`, `pageSize=1`, summaries/offers/fulfillmentAvailability only | Seller-scoped SKU/ASIN, BUYABLE observation, B2C price wire type and merchant DEFAULT quantity, provider request ID and response hash | Complete inventory, supplier stock, fees, order history, payouts, listing authority |
| CJ | `getAccessToken` POST; one GET `/product/list?pageNum=1&pageSize=1` | Observed CJ openId, one catalog PID/SKU, summary schema, provider request ID and response hash | Exact VID cost, CJ-managed stock, freight, fulfilment, refunds or cash |

Maximum two HTTP attempts per provider, no retries or redirects. CJ reserves 50 API points before outbound requests; this is a one-run ceiling, not a shared account-wide quota. Authentication endpoints are not listed as point-charging in CJ's current schedule. No paid points are purchased. A new run requires a new reviewed Work checkpoint; workflow reruns refuse. Response bodies are capped at 1 MiB with a 15-second timeout. The evidence directory is exclusive, synchronously persisted and read back. Failed/uncertain calls retain admission and fail closed. Missing credentials or isolation fail before any request. Tokens, secrets, authentication responses and provider error messages are not saved or printed.

Provider request IDs and hashes are traceability evidence, not provider signatures. An HTTP observation is not commerce qualification. Empty accounts remain empty, mismatched schemas remain blocked, fixture economics remain unchanged, and no real order is inferred. The first readback remains UNMATCHED to the simulated transaction until real account/product identity is established. Work will inspect actual response shapes before expanding the read allowlist.

## Amazon — one owner procedure

1. Open [Amazon Solution Provider Portal](https://solutionproviderportal.amazon.com/) as the primary owner of the Amazon US seller account. Open **Developer Central**. Use a dedicated private seller app named **EmpireAI Readback**: **Add new app client → SP-API → Sellers**, for your own organization. Do not edit or revoke the app currently used by protected production. If developer registration is not yet approved, complete Amazon's private developer registration truthfully and wait for approval; do not buy an upgrade or invent compliance answers.
2. Select only **Inventory and Order Tracking** for this first check. Do not add Product Listing, Pricing, Finance/Accounting, restricted customer data or Direct-to-Consumer Shipping roles. Amazon documents this single role as sufficient for `searchListingsItems`. Important: Amazon also assigns some listing-write operations to this role, so it is NOT a provider-enforced read-only token. EmpireAI's fixed GET allowlist imposes the narrower operational boundary. Do not authorize additional roles just to resolve a 403.
3. Choose **Authorize app** for your US seller account only (a private app can be authorized in Draft). Record the resulting refresh token directly into the encrypted destination below. Under the app's LWA credentials, obtain its client ID and client secret. Obtain your **Merchant Token / Seller ID** in Seller Central **Settings → Account Info → Business Information → Merchant Token**. Never paste these values into chat, an issue, a document, or repository files.
4. Open [EmpireAI GitHub environments](https://github.com/empireaios/EmpireAI/settings/environments). Create **empireai-readonly-amazon**. Under **Deployment branches and tags**, choose **Selected branches and tags** and permit only **ci/provider-readback-amazon-v1**. Add these four **Environment secrets** using the **Add environment secret** button:
   - `VERIFY_AMAZON_CLIENT_ID`: the dedicated app's LWA client ID.
   - `VERIFY_AMAZON_CLIENT_SECRET`: its LWA client secret.
   - `VERIFY_AMAZON_REFRESH_TOKEN`: the US account's self-authorization refresh token.
   - `VERIFY_AMAZON_SELLER_ID`: the US Merchant Token / seller ID.
5. Tell Work only **“Amazon readback environment ready.”** Work will verify the tested source/branch restrictions, create the dedicated branch to run the bounded check, inspect failure or actual readback, and persist sanitized evidence. No listing, inventory update, order import with customer PII, purchase, payment, or commercial approval follows authentication.

If GitHub does not offer Environment secrets/branch restrictions for this private repository, stop at that screen and report the limitation without any values. Do not substitute repository-wide secrets or upgrade a plan without review. Work's connector has no environment/secret-administration operation; entering these credentials in GitHub's secure UI is the owner-only step. No code or CLI operation is required from the owner.

## CJ — one owner procedure

1. Open [CJ API authorization](https://www.cjdropshipping.com/my.html) while signed in to your CJ account. If the API app is absent, use **Apps → Install App → Others → API** to install it. Do not connect an Amazon store, enable order synchronization, add products to a store/cart, or alter the existing production key.
2. On the **API** tab choose **Add API**. Name it **EmpireAI Readback**, choose **API Key** as the Type, and confirm. Copy the new key using the copy control in its **API Key & MCP Token** column, directly into the destination below. This is an ordinary CJ API credential: the documented dialog has no read-only scope selector. It is not truthful to describe it as a scoped read-only key. No MCP token or broader order-management integration is requested; the isolated runner permits only authentication plus the catalog GET. If your actual CJ dialog offers product-read-only permissions, use only those; otherwise the ordinary API credential is the minimum documented credential for this endpoint.
3. Open [EmpireAI GitHub environments](https://github.com/empireaios/EmpireAI/settings/environments). Create **empireai-readonly-cj**. Under **Deployment branches and tags**, choose **Selected branches and tags** and permit only **ci/provider-readback-cj-v1**. Add one **Environment secret**: `VERIFY_CJ_API_KEY`, with the new key as its value. The same GitHub feature limitation rule above applies.
4. Tell Work only **“CJ readback environment ready; 50-point catalog check approved.”** Work will run authentication and one catalog read, compare returned account/product identifiers and schema, and persist the receipt. No orders, carts, purchases, wallet operations, disputes, store links, inventory changes or token logout will be called. The recorded openId must be reconciled to the intended account before downstream qualification. If CJ reports API access suspended, Work will report that; it will not place an order to reactivate access.

## Evidence and continuation

The provider workflow uploads sanitized `admission.json` and `receipt.json`. Work downloads them, checks hashes/source revision and observations, and commits accepted evidence plus discrepancies to the canonical handoff. A successful probe grants no Birth, production or commerce authority. Subsequent exact-VID, stock, freight and fee checks need separately reviewed endpoints and point ceilings, using actual returned identities rather than fixture IDs. The existing simulated lifecycle and phone browser CI continue independently.

## Official references reviewed 2026-09-29

- [Amazon private application authorization](https://developer-docs.amazon.com/sp-api/docs/self-authorization)
- [Amazon app registration](https://developer-docs.amazon.com/sp-api/docs/registering-your-application)
- [Amazon Listings Items role mapping](https://developer-docs.amazon.com/sp-api/docs/listings-items-api)
- [Amazon searchListingsItems](https://developer-docs.amazon.com/sp-api/reference/searchlistingsitems)
- [CJ API key creation and authentication](https://developers.cjdropshipping.com/en/api/api2/api/auth.html)
- [CJ product API](https://developers.cjdropshipping.com/en/api/api2/api/product.html)
- [CJ points schedule](https://developers.cjdropshipping.com/en/api/api2/standard/points.html)
- [GitHub environment secrets and branch restrictions](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
