# Bounded CJ supplier evidence checkpoint — 2026-09-29

The owner authorized a bounded authenticated read-only advance from the already-observed PID2609291119211612600 toward variant identity/cost, warehouse-specific stock and US freight. Production and Birth/commerce authority remain untouched.

## Reviewed execution boundary

- Existing environment `empireai-readonly-cj`, sole branch `ci/provider-readback-cj-v1`, existing secret `VERIFY_CJ_DIRECT_TOKEN`. No credential value read or relocated.
- One GET `/product/query?pid=2609291119211612600` and one GET `/product/stock/getInventoryByPid?pid=2609291119211612600`.
- Select one exact variant only when its positive USD-cent price and explicit CJ subwarehouse units reconcile with the same VID/country aggregate. Factory stock cannot substitute. Selection is deterministic VID/country/stock-ID ordering, not a Pillow commercial recommendation.
- Only with usable stock: one POST `/logistic/freightCalculate`, quantity1, exact VID, observed source country/subwarehouse, destinationUS, merchant logistics. This documented calculation does not create an order or write a listing. ZIP unknown; country-level estimate only.
- Maximum3 business requests/30 documented points; no auth exchange, fallback, retries, order, fulfilment or account mutation. Every request has a durable pre-dispatch admission and each completed valid response a sanitized receipt. Failures retain prior receipts; rerunning the same evidence directory or GitHub attempt is refused.
- Source/body/summary hashes and provider request IDs are provenance, not provider signatures. Actual point debit is not retained. Amounts are provider quotes, not paid costs. Derived cost-plus-freight subtotals exclude Amazon fees and other unproven costs.

## Current integration assumptions to reconcile

The existing Pillow price adapter already accepts exact numeric/string `variantSellPrice` and refuses ranges. The existing stock adapter expects a different queryByVid contract (`vid`, `areaId`, `cjInventoryNum`); this checkpoint uses getInventoryByPid's explicit nested VID/country/subwarehouse response. Do not pretend these are interchangeable or synthesize missing IDs. The existing four-receipt qualification bundle also requires a matching Amazon fee response and assumes CN origin. This historical readback must not be injected as a fresh approved bundle, tied to the unrelated Amazon Proof001 ASIN, or treated as settled accounting.

An observation with insufficient CJ-managed stock is a useful nonqualification result. Do not automatically expand discovery, select another PID, or repeat paid calls to force a positive example.

## Official references reviewed

- https://developers.cjdropshipping.com/en/api/api2/api/product.html — product details and getInventoryByPid, variant costs USD, CJ versus factory stock and subwarehouse IDs.
- https://developers.cjdropshipping.com/en/api/api2/api/logistic.html — freightCalculate is a non-order trial calculation; optional ZIP and storageIdList; USD quote fields.
- https://developers.cjdropshipping.com/en/api/api2/standard/points.html — each of these three endpoints10points.

Actual execution evidence and CI results are linked from CURRENT_HANDOFF.md after the bounded run; this design is not itself provider evidence.
