# Work 7 owner read projection checkpoint

Baseline: backend `353ed974499a2bc78751de0156854117d6185a7d`.

Adds `GET /api/owner/commerce/portfolio` using the existing authenticated founder-only gate and canonical Work 6 immutable receipts. SQL performs search, category/phase filtering, deterministic sorting and 10/25/50-row paging; latest SKU is deduplicated within its evidence classification. Selected receipt chains are verified. No new journal, scheduler, inference, provider call, migration, authority or commerce effect.

Default query includes only real read-only source evidence; synthetic candidates require an explicit classification selection. The execution receipt classification remains separately exposed as SYNTHETIC. Prepared media never establishes publication or rights beyond its actual saved evidence. Missing ASIN, buyability, competitor prices, rank and observed sales remain null. The 1,000 active-product ceiling is a policy ceiling, not a statement of available Amazon capacity; active count remains unconfirmed.

Focused validation: 1,000 isolated SKU fixture verifies accurate pagination, search/category filters, numeric sort, tenant isolation, invalid input rejection and no canonical journal count change. Route suite verifies authenticated reads, synthetic exclusion and all eight existing HTTP 423 boundaries. Existing Work 6 lifecycle test remains green. Fixtures are memory/temp databases only.

CEO, finance, provider and evidence-sharing UI must continue to use existing institutional-memory, intelligence, financial-centre and Advisor APIs. No secondary strategy/financial truth is introduced. Historical frontend snapshot data is not imported into an actual current catalogue.

Not a release or completion receipt. Hosted CI, deployment, production preservation, owner acceptance and independent Mission Ledger closure remain root tasks.

## Source-backed CEO continuation

`GET /api/owner/advisor/executive?date=YYYY-MM-DD&page=1` projects existing institutional-memory experiences, original rationale/expectations/evidence, SGT dated reasoning records, owner decisions and reported outcomes. Activity and outcome authenticity remain explicit; no decision is interpreted as execution. Recommendations remain stable original IDs with optimistic event versions and a bounded paginated history.

Existing authenticated `POST /api/owner/advisor/memory` accepts additive `owner_decision` (approve/reject/revise) events. Approval records owner disposition only, without provider authority. `executive_plan` stores a source-linked reviewed proposal and dated milestones in the same records table; explicit supersession prevents silent replacement. An annual amount is presented as a confirmed CEO proposal only when the original non-synthetic Pillow experience contains that exact structured annual-net-profit metric. Owner-entered unmatched amounts remain a proposal; synthetic plans never establish actual CEO commitment. Original historical records and journal versions remain intact.

Focused tests prove durable owner dispositions, replay idempotency, stale-fence rejection, synthetic segregation, no fabricated reasoning/execution, model-metric matching, cross-year target exclusion, explicit plan supersession and retained originals. Existing Work 3 strategy preservation/authority tests also pass. Establishing a credible new CEO target still requires an actual retained CEO proposal; no paid reasoning was performed to manufacture one.

## Mandatory Safety UX addendum

Read the complete mandatory addendum and V5.1 slide text, including slides 20–24. Added all 15 source-backed guard records at `GET /api/owner/advisor/safety`, with classification, unknown exposure, reasons, source/drill-down evidence and separate isolated order traces. Absence of operational evidence never renders VERIFIED. Backup/restore, real settlement completeness and full failure/load certification remain explicitly unverified, not invented.

Owner `safety_policy` commands reuse the existing immutable record convention, atomic expectedVersion check, idempotency hash and Advisor audit. Confirmation is mandatory. Policy reads verify digest, authenticated-owner provenance and version before use. Independent exact memory receipt read preserves policy version. Existing application effect routes consume path pauses; original global locks cannot be cleared by this policy. Existing governed engine admission consumes supplier/listing pauses and per-order/daily/aggregate ceilings; unknown ceilings fail closed once policy is configured. No-policy retains the accepted isolated Work6 lifecycle. Price/inventory writes remain globally blocked and additionally subject to owner pause.

Only SGD supplier/order exposure is comparable to the SGD policy; other currencies fail closed pending verified FX. Prior commitments are conservatively retained in both daily and aggregate bounds until verified settlement release; this is explicitly identified in the read model and is not claimed to be an actual cash ledger. Tests prove per-order/daily/aggregate denial, unknown limit denial, FX denial, pause consumed by engine, unchanged journal on denied command, confirmation and role/workspace protection, replay idempotency, stale version rejection, and global lock persistence after owner resume.

Exact mission lookup was added to existing governed read for stable portfolio-to-listing-to-approval links beyond the original 200-item overview window.
