# Priority A independent verification — 2026-10-02
Cutover remains CLOSED. Certification remains PAUSED. NOT_BORN / commerce LOCKED unchanged.

## Preserved candidates
Frontend a9358a2db7d2eb956537480ecdf114635f9ca6a9 remains the structural desktop candidate. Its three UI file hashes match the locally exercised build. No presentation implementation change was needed after the browser run.
Backend 84ab891fcafc733f9d43e4b30e14a4e0fb2d25de remains the independently observed locked runtime source; no redeployment performed for this checkpoint.
The frontend branch has an older backend tree: tests must use separate exact checkouts, as the accompanying workflow does.

## Completed offline checks
- 31 targeted backend tests passed across provider orchestration, durable spending, reasoning integration, fresh authentication and durable worker.
- Two additional tests passed: real LLMRouter explicit two-provider consultation with distinct reservations/replay rejection, and concurrent duplicate requests admitting one transport/reservation. The provider test file totals 9 passing tests.
- 141 frontend unit tests passed.
- Actual local Chromium 153 rendered the exact candidate UI. Sixteen desktop measurements passed: widths 1024/1280/1440/1920, expanded/collapsed sidebar, before/after reload. Minimum workspace gutter 20.46875px; minimum measured text/list-marker clearance 41.46875px. Phone 390px geometry passed.
- Loopback-only synthetic fixtures intercepted all API access; external requests aborted. No inference was sent. This is NOT actual production owner acceptance.
- Geometry JSON and TAP logs preserved alongside this record; CI retains screenshots.
- No source changes to authority, spending, provider routing or reasoning.

## Accounting remains unresolved
Available local ledger SHA256 a1ec5b7e9d8b307b60cefeb0c08774866ff7c27acc0ceaf92c7947e3dd8dfd26 contains six calls, latest 2026-10-01T15:58:43.143Z. Reservations total 1951842 microUSD, estimated costs 441130 microUSD. This predates the consumed provider failure, and is NOT the current balance.
The read-only ledger utility checks integrity, amounts, shared cap and unchanged file hash without prompts/secrets/network. No rows in the later failure window proves only this snapshot is stale.
PROVIDER-CHECK-20261002-A and original I1 remain consumed evidence. Their accounting cannot be called reconciled until a current authoritative snapshot is available.

## Deployment and rollback path
Work OAuth authorization succeeded, but CLI continuation was denied network access to api.vercel.com. Do not repeat OAuth or bypass the network restriction. Connector reads work; deployment write tool unavailable. Dashboard credential protection remains unavailable to Work and invisible to King.
Prepared dedicated production/empireai-web branch at current production frontend 1352d6b03990fff356d8b83942e457c80976bb12. No production change.
Supported next path: existing Vercel project Production Branch Tracking selects that branch once; Work then advances it to the tested a9358a2 candidate using GitHub. Preserve project root/environment/domain. Independently verify a READY production deployment's exact source SHA, backend binding and owner-visible rendering.
Rollback: a new commit on that release branch restoring the previous exact frontend tree, then verify the Git-triggered rebuild. This is a rebuild rollback; it is NOT yet proved and must not be described as an instant artifact rollback.
No credential transfer, deployment secret, new project or additional authority required by this proposed Git path.

## Minimum remaining live verification, after repaired-path and ledger gates
1. Obtain current ledger readback; reconcile failed request identities, reservations, provider outcomes, usage and unresolved holds. Never release an uncertain hold without authoritative evidence. Confirm conservative headroom under the existing global US$20 ceiling.
2. Reuse independently sufficient existing invocation evidence. Where current shared-router proof is missing, at most one new short OpenAI ordinary request and one explicit two-provider Claude/Gemini consultation (three transport calls total). Use fresh correlation identities, bounded output, and no automatic retries. Do not reuse consumed examination or provider-failure cases.
3. Capture provider/model provenance, request identities, real read-only calculation/retrieval receipts and authoritative context source labels. Read ledger after each top-level request before proceeding. Stop on unknown charge, missing provenance, terminal failure or insufficient headroom.
4. Prove fallback and uncertain-failure non-retry mechanics using controlled offline tests; do not deliberately induce paid production failures merely to obtain fallback evidence.
5. Read existing durable transcript and pending learning receipts after rebind, verifying no autonomous promotion. Use existing server-side authority checks plus minimum authenticated live denials; no actual commerce writes.
6. Desktop actual production rendering and mobile regression acceptance remain required. Owner's already accepted cross-device history is preserved.
7. Only then close the integration/interface boundary and resume frozen certification with materially new unseen cases.

## Mandate continuity
Six owner clarifications remain durably appended at 3da589d10dcd2d44e0e5366034a8f52b66408218. Permanent independent supervision, omission auditing and later Owner UX backlog preserved. No Birth, commerce unlock or additional spending.

## Hosted verification completion
GitHub Actions run 36959294882 completed SUCCESS for both exact-runtime backend and exact-frontend geometry jobs. This does not replace production visual acceptance or live accounting readback.
