# Work 8 Cost Centre original-contract reconciliation

Execution collaborator package; independent acceptance pending. No canonical tracker edit or publication.

## Exact original criterion

`docs/work8/MANDATE.txt` section22 requires Work8 to TEST owner-visible Operational Finance separately from Live Cost Centre infrastructure economics. Coverage: reservations, actual inference costs, failed/incomplete calls, commitments, accrued usage, invoices, payments, allocation, FX uncertainty, vendor/category persistence; source→journal→report→owner UI; replay, crash at commit, rollback, corruption, concurrency and multi-currency cutoffs. Section12 and23 prohibit live financial effects and default to isolated no-cost examinations.

The actual original224 historical accounting snapshot is a separate #2 preservation obligation. Section22 does not establish original224 as a prerequisite to testing Cost Centre behaviour. Actual invoices/payment/FX may remain unknown in the live readback. They must not be invented, but their absence does not prevent isolated examination of those state transitions. Do not silently impose actual financial Birth or complete real balance-sheet attestation on isolated #25. Actual values remain uncertified.

## Source identities

Source base `827ed0ad10efca2ac04a21429b4fb359a9f99446`, tree `f5e84c2a536ab824fda92160baa85f1b3fed7809`. This is the existing portfolio-review descendant; this package changes no runtime source. Source test: `backend/src/validation/tests/work8-cost-source-separation.test.ts`. New execution: `source-separation.tap`, 1/1 PASS. Node24.19.0 and existing tsx dependencies; no external functions were invoked. This execution did not install a kernel network barrier and does not claim such a barrier.

The test uses isolated on-disk actual application schemas. `authenticity:REAL` is exercised exclusively as a schema value inside the disposable fixture to reach the reviewed-cost code path; none of these fixtures is actual provider cost, actual owner approval, actual payment, or production journal data.

## New missing-boundary execution

Production reserveInference/settleInference functions create three isolated calls: failed_uncertain, incomplete, usage_recorded. Independent expected arithmetic: held100+200+300=600microUSD; estimates80+120=200microUSD; failed estimate unknown1; actual invoice amounts unknown3. Existing production owner projection `readFinancialCentre` reads this ledger separately from the reviewed journal and explicitly excludes it from financial totals.

One isolated reviewed invoice of1,000,000microSGD projects as SGD1 technology expense; replacement by payment produces INVOICED0, SETTLED1,000,000, total technology1,000,000. The200microUSD estimate and600microUSD reservations never add to SGD expense. Canonical failed/incomplete/completed statuses survive readback; journal hash is unchanged by read. This is source→existing owner projection integration, not an authenticated browser or production-data examination.

## Complete mapping and precise remaining work

| Original assertion | Existing source/evidence boundary | Decision |
|---|---|---|
| Reservation, failed/incomplete usage, invoice totals separate | New source-separation test plus existing work5-finance-routes cap test | Newly executed readback boundary PASS, independent acceptance pending |
| Accrual→invoice→payment one count, reversals, duplicate invoices/source IDs | work5-finance.test.ts; work8-cost-intelligence.test.ts | Retained scoped evidence; not rerun |
| Shared allocation, tax/credit, FX uncertainty | work5-finance.test.ts independent5850000SGDmicro oracle and missingFX tests | Retained scoped evidence; no actual FX asserted |
| Commitments reduce available cash without expense | work5-finance.test.ts final committed-liability test | Retained scoped evidence |
| Vendor/category persistence and owner restrictions | work7-cost-categories, work5-finance-routes and work8-cost-intelligence tests | Retained scoped evidence |
| Cold persistence and rollback/prior writer, currency cutoffs | work8-financial-view, accepted A16 prior-code/oracle evidence | Preserve A16; do not inflate scoped compatibility into full crash/concurrency proof |
| Corrupt journal/readback refusal | work5-finance and work8-financial-probe tests | Retained scoped evidence |
| Source→journal→report→authenticated owner UI for this complete Cost Centre chain | New test reaches production projection; A16 mobile Finance is different scope | Native full Cost Centre chain evidence still needs mapping/examination |
| Crash at commit and concurrent Cost Centre accounting | SQLite transactional implementation alone is insufficient evidence | Locate existing exact receipts or run narrowly scoped fault/concurrency examination |

Proposed tracker correction: #25 remains PENDING, classification EXECUTABLE_ENGINEERING_OR_EXAMINATION, with exact residual native source-to-Cost-Centre UI and crash/concurrency proof. Remove original224 as a blanket prerequisite for this row. #2 remains BLOCKED on actual historical snapshot. Actual financial records/attestation stay external gaps; do not certify them through this isolated package. #24 and A16 PASS are preserved unchanged. A17 needs its own original amendment mapping before deciding live invoice evidence prerequisites.

## Business qualification preservation

Existing genuine source `ev_322d5bba8afed3b6e979f2951ded24c43190698b` observed2026-10-12T06:39:20.497Z expires12:39:20.497Z. Retained automatic-deferral receipt correctly reports DEFERRED, qualified0, missing commercial/financial inputs, assessmentsLinked0. It is expired; no new acquisition, qualified dossier, market comparator or actual Pillow assessment was manufactured here. Existing broad-market WALI ASIN is not a supported comparator for the CJ card box.

## Completed continuation: full-row isolated package

New journal-crash test PASS1/1: child process SIGKILL after nested append but before outer COMMIT leaves exact committed-prefix hash; two independent writers append20 records each; all41 records unique and retained after cold reopen; idempotent replay is inert and conflicting retry refuses without mutation. The initial test expected41 projected providers but the application also includes17 built-in directory entries; the test oracle was corrected to count the41 explicitly seeded IDs. No runtime defect was concealed or source changed.

Native browser final receipt PASS at390px and1440px in BOTH invoice and paid stages. Real isolated login, actual backend finance route, actual journal/accounting read, pinned frontend960d, no response replacement. Independent UI amounts: USD2 metering estimates, USD6 held reservations, three calls, one unknown estimate; confirmedSGD10. Payment replaces invoice without changing confirmedSGD10. Desktop/mobile share same journal digest in each phase. Real twin read routes are registered with an empty isolated store so no omitted-harness route produces an error banner. Backend kernel blocks outbound connects; browser only permits127.0.0.1. Screenshots were visually inspected. None is actual owner attestation, actual invoice/payment or real provider call.

The residual native UI and process crash/concurrency gaps identified above are now supplied. Proposed final decision: independently assess full original #25 isolated capability using this package plus retained exact-scoped evidence below. Do not alter #2/#24/A16, certify production money or infer financial Birth. Any specific unmet assertion should remain explicit; no blanket original224 blocker applies.

## Retained execution crosswalk

- `revised-review-20261012/ci-semantic.log` lines470–471: real reservation cap;484–485 accrual→invoice→settlement;502–503 FX/tax/credit/allocation;586–587 commitments without expense. File SHA256 in seal.
- `revised-review-20261012/review/offline.log` line1: half-open cutoff, fixed prepaid allocation, late bills/corrections and currency conservation; line20: owner financial projection, backup, old/new writer and live journal prefix. Full file and independent fixed oracle JSON sealed.
- `work5-finance.test.ts` durable replay/corruption, missing marker, duplicate sources, non-real exclusions, malformed/future evidence, unknownFX and cash completeness negatives; exact source hash in seal. CI semantic test names included in retained-log-extract.txt.
- `work8-cost-intelligence.test.ts` discovery synthetic classifications, outage/freshness, dedupe, multi-charge atomic rollback; retained source map only where earlier receipt not cited. No claim that a source test itself proves execution.
