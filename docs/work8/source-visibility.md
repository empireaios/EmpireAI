# Work 8 retained-source projection

Implementation: `backend/src/runtime/commerce-runtime/governed/work8-source-projection.ts`.

The projection resolves IDs through an authenticated-workspace server reader, verifies saved LIVE_PROVIDER authenticity, facts digest, chronology, provider/capability/endpoint and detail product/variant identity. It performs no external requests or writes. Synthetic fixtures cannot enter real-source totals. The test fixtures deliberately exercise the adapter contract; test counts are **not real discovery evidence**.

Existing Four Eyes CJ acquisition retains `facts.response` from `/product/list` and `/product/query`, with supplier read provenance. Catalogue query text is not a product ID. Current capability does not establish image redistribution/display permission, independent compliance, landed economics, variant shipping/stock guarantees or genuinely completed Pillow assessment. Images remain observed URLs with null display URLs and UNVERIFIED rights. Currency remains null unless supplied explicitly; product price ranges are not converted into a fabricated unit price. Expired authentic observations remain HISTORICAL, never fresh. Every displayed candidate is deferred pending independent qualification.

Integration: resolve existing evidence IDs with `store.get(workspace,'evidence',id)` in the authenticated read path; call `projectWork8Sources` with server time, never client evidence bodies. Add projection to owner readback without auto-importing into governed qualification or changing authority. Downstream remains SIMULATED_ONLY. Consumer renders title as escaped text and uses only displayUrl (currently null), not observedUrl as an image.

Real-source acceptance remains NO-GO until actual retained evidence is read and reconciled, missing fresh reads are lawfully permitted, image rights are recorded and independently verified, and completed assessments are bound to matching source identities. No provider permission, paid refresh, production mutation or Work 8 closure is implied by this module. A no-cost projection contract test cannot certify authenticated read connectivity or owner visual acceptance.

## Authenticated retained readback, 2026-10-10 21:37 UTC

Two King's Advisor `evidence:<id>` readbacks resolved actual saved CJ catalogue/detail records and passed facts-digest verification. The snapshots are retained in `source-authentic-readback.json`; deterministic output is `source-authentic-projection.json`. These are saved provider observations, **not newly refreshed provider calls**. Records observed 18:39 UTC expire at 00:39 UTC on 11 October. Runtime recomputes freshness rather than preserving this historical fresh status.

Distinct genuine products: 10; source identity matches: 10; observed image URLs: 19; image URLs with verified usage rights: 0/19; scalar observed prices: 8/10 (two source price ranges intentionally not coerced); established price currencies: 0/10; software screened for provenance/completeness: 10; qualified: 0; genuinely performed linked Pillow assessments: 0; recommendations: 0. No downstream listing/order/finance counts are implied.

All 10 remain deferred: media rights, currency, independent eligibility/economics and assessment links are missing. Saved supplier names identify two third-party companies; remaining names are unknown (CJ is the source channel, not an invented manufacturer identity). No market comparisons or sales demand were established. This supplies real observed product identities for the owner view but does not pass the full visual/assessment/lifecycle gate.

GET `/api/owner/commerce/portfolio` now adds `observedCandidates` using authenticated workspace-scoped retained evidence only, sampled from latest 100 evidence records, explicitly marking sample coverage. Existing mission portfolio and authority remain unchanged. `observedCandidates.products` is the display cohort, `counts` the explicit denominators, and `rejected` source failures. No images are fetched or displayed until image-rights evidence exists.

## Scoped variant currency enrichment

Official CJ endpoint documentation checked at 2026-10-10 21:42:51 UTC establishes USD specifically for `/product/query` → `variants[].variantSellPrice`. The exact `/product/list` and parent `/product/query` sellPrice fields do not establish a currency. See `source-currency-contract.json`. Projection now exposes 10 observed detail variants separately from 10 parent products, each with matched parent/variant identity, observed 2.48 USD and pinned contract provenance. This does not select a variant or qualify a product. Any contradictory parent or variant currency quarantines that detail source with `SOURCE_CURRENCY_CONTRADICTION`; raw evidence is unchanged. Nine projection tests cover selected and unselected contradiction paths.

Local desktop/mobile component QA is saved in the frontend repository `docs/work8/source-local-visual-qa.json` and screenshots. This is retained-data local rendering, not authenticated deployment or owner acceptance. Rights remain unverified; no source image requests were issued.
