# Work 6 scale clarification and Work 7/8 handover

Owner continuation: 9 October 2026. Original W6-01–24 remain unchanged.

## Canonical integration

W6-03/04/07/08/16/19 now cover `CommerceWorker.screen`, `enqueuePreparationBatch`, `batchProgress` and the engine's `publication_intent` transition. These reuse the same native commerce task table, version fences, immutable receipt chain, Work5 economics and PIE score weights. No parallel publisher, financial ledger, network transport or model call is added. The existing `marketplace-publishing/services/amazon-listings-publish-executor` remains the future effect owner; the pre-Birth path only produces credential-free intercepted intents.

Screening ranks saved workspace-qualified missions deterministically by existing qualification score per unit of exposure, retaining SKU/variant/warehouse/destination identity, rejection reasons and economic rationale. A review limit selects at most 100 or 1000 candidates without inference. This is a prioritisation heuristic, not predicted or proven profitability. Research commands continue through existing Four Eyes evidence validation; imported actual cash is never accepted as spend authority.

Batch admission references existing missions and requires their original owner approvals. Up to 1000 tasks share existing queue capacity, use per-SKU/account/marketplace deduplication, preserve source versions and revalidate approval/stock/economics at each execution. Partial success is per item; a new batch may reference only previously blocked items while original failures remain stored. Successful/pending items cannot be duplicated. Worker processing stays bounded; modeled rate spaces tasks conservatively at no more than five/second, independent of their number. This is isolated queue evidence, not measured Amazon throughput. The production timer is deliberately slower.

Publication intent distinguishes EXISTING_ASIN_OFFER with per-mission ASIN mapping from NEW_ASIN. Account/marketplace capacity, unsold-listing capacity, eligibility, observation/expiry and API quota are recorded separately. Missing values remain unknown and block preparation; synthetic capacity never certifies an Amazon account. Actual capacity ingestion/authority must be commissioned against authenticated account evidence before Birth. No API limit grants business capacity or write authority. Errors and unknown outcomes must not be relabelled published.

## Amazon source verification, 9 October 2026

- https://developer-docs.amazon/sp-api/docs/listings-items-api-rate-limits : current v2021 putListingsItem defaults are 5 requests/second per account/application pair, 100/application, burst 5. Multiple thresholds apply; the rate header does not describe every limit. These are documented defaults, not this seller's observed allowance.
- https://sellercentral.amazon.com/help/hub/reference/external/G201844590?locale=en_us : US ASIN creation policy distinguishes offers on existing ASINs from new catalogue creation, documents creation restrictions and additional restrictions associated with unsold listings. Public policy is not verification of this account/marketplace's current capacity. No numeric account capacity is hardcoded.
- https://developer-docs.amazon/sp-api/docs/listings-apis-faq : verify catalogue match and restrictions before offer creation; successful submission may still have downstream issues. Future activation must reconcile processing reports/getListingsItem before claiming publication.

## Media and commercial truth

Listing content/attributes/claims/rights references and CJ SKU/variant/stock/freight are inspectable in the existing owner screen. A populated image manifest proves neither actual image rights nor compliant/compelling visual quality. No representative real image was inspected in this continuation. Work8 must witness real-product source, rights, dimensions, main-image suitability and Amazon schema validation before certification. Synthetic content is labeled and excluded from financial actuals.

Existing 30/60/90-day outcome-linked reassessment and reversal remain in place; no 14-day automatic retirement exists. Zero sales triggers investigation and expansion review, not a deletion/write. Work7 strategy presentation must expose impressions, clicks, conversion, seasonal context, supplier health, margins and capital risk; unknown observations stay unknown. Avoid guaranteed-winner claims.

## Work7 — owner implementation handover, not Work6 expansion

Build a phone-first CEO Daily Operating Clock spanning 00:00–23:59 from actual scheduled/event-driven task records. Show short Pillow memos, results, exceptions, next actions and owner decisions. Do not invent scheduled activity.

Build one CEO KPI page with ONE chosen annual commitment and actual-versus-target status. Lean/base/bullish remain internal scenarios. Prioritise net realised results, downside exposure, working capital, supplier commitments, open-order economics, Amazon receivables, expected disbursements, fulfilled orders and finance exceptions. Use authoritative Work5 classifications and evidence; never combine synthetic profit, estimated amounts, actual cash or unsettled receivables as realised spendable money.

## Work8/9 dependencies

Work8 independently certifies the owner-witnessed complete path with representative real CJ product data and safe Amazon validation, including media inspection and account-specific capacity. Real ranking, conversion, throughput, payout history and sustained profitable operations require post-Birth evidence. Work9 alone authorises live listing, purchasing, fulfilment, refunds, ads and Birth. All eight live-effect boundaries remain LOCKED.
