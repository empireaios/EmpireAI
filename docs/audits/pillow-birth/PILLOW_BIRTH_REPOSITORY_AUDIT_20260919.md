# Pillow Birth repository audit and finite closure plan

Date: 2026-09-19  
Repository: `empireaios/EmpireAI`  
Audit branch base: `21384342c401def948926904913840e63c18dff7`

## Decision

The frozen candidate is **not ready for Pillow Birth, Wave credit, or autonomous live commerce**.

The defensible current result is:

`TRANSPORT_SOAK_PASS / CAPABILITY_PARTIAL_WITH_BLOCKERS / COMMERCE_LOCKED`

The 120-minute soak is accepted as evidence for chat transport, latency, durable request retrieval, restart recovery, and preservation of the live-commerce locks. It is not a capability pass. The same sealed artifact records 17 failed substantive checks, and its overall PASS formula does not require those failures to be zero.

Do not invoke the current `/pillow-commissioning/birth/authorise` endpoint. It can write a ceremonial `BORN` record from weak legacy gates while other authoritative surfaces remain hard-coded `NOT_BORN`. It is not coupled to V53, official Wave results, independent certification, or a functioning commerce runtime.

## Exact scope

| Item | Frozen identity | Use in this audit |
|---|---|---|
| Product code release candidate | `bbaa5a6aa34f7399d10f9bfa222a4664cfd843e4` | Product-code baseline reported by the closure package |
| Soak candidate | `ab6ac3b771d97e694e45db4a7ddc4bcea713decc` | Exact code tested by the final soak |
| Evidence seal | `21384342c401def948926904913840e63c18dff7` | Final committed reports and raw soak artifact |
| Reported Railway deployment | `ad554877-9e1e-47f6-b5f7-addb64281eaf` | Identity reported in the soak; current service state was not independently queried |
| V53 master workbook | SHA-256 `03517a0ab039604c9cf864d7411ec24ac7079baf9b90834c9a524c2da701c258` | Controlling external Birth and MS-A specification used for the gap map |

V53 is accessible outside the repository, so its criteria were used here. The repository still lacks a versioned, hashed copy or generated evaluation manifest. Repository evidence therefore cannot reproduce the official rubric by itself.

## Status definitions

- **ACCEPTED**: source and scoped proof support the claim.
- **PARTIAL**: useful implementation or proof exists, but a required boundary is missing.
- **FAILED**: source or execution contradicts the required behavior.
- **UNTESTED**: implementation may exist, but no accepted scoped proof was found.
- **BLOCKED**: a prerequisite or independent authority is absent.

## Executive closure matrix

| ID | Gate | Status | Repository evidence | Exact exit condition |
|---|---|---|---|---|
| A-01 | Exact candidate and deploy identity | **ACCEPTED, engineering scope** | Final soak binds candidate `ab6ac3b7` and deploy `ad554877` | Retain tuple in every later receipt |
| A-02 | 120-minute chat transport and durability | **ACCEPTED** | 120.16 minutes; lost admitted 0; p95 5,586 ms; durable retrieval 100%; restart retrieval PASS | Preserve as scoped transport evidence |
| A-03 | Capability correctness in the soak | **FAILED** | 17 of 35 substantive ordinary/mission checks failed; 146 trivial fill checks passed | All unique substantive cases pass and semantic failures are release-blocking |
| A-04 | Candidate local full-certification gate | **FAILED** | `npm run gate:full-certification` exits 1 in three suites on `cr.timestamps_are_not_tasks` | Exact candidate passes the full command from a clean checkout |
| A-04R | Clean worker/scheduler test | **FAILED** | Standalone `scheduler-workers.test.ts` passes 1/4 and fails 3/4 before worker proof because `executive_objectives` is missing; Redis checks are skipped when Redis is absent | Clean Redis-backed run passes and proves a real scheduled receipt |
| A-05 | Official V53 Wave 1 | **UNTESTED** | Repository manifest lists W1-T01..W1-T24 as `NOT_RUN_THIS_MISSION`; official credit remains 0/24 | Independent 24/24 run under the V53 clean-streak rule |
| A-06 | Clean streak, 10x gauntlets, permanence | **UNTESTED** | Local bootcamp and generated cases are engineering evidence, not official hidden evaluation | V53-scoped independent evidence on one frozen candidate |
| A-07 | Independent certification | **BLOCKED** | No accepted external Overseer certification record exists | Signed certification manifest tied to candidate, deploy, evaluator, configuration, and results |
| A-08 | Single authoritative Birth state | **FAILED** | Commissioning can persist `BORN`; Shadow CEO routes, facts, health, and cockpit remain hard-coded `NOT_BORN` | One durable state source consumed by every surface |
| A-09 | Safe Birth authorization | **FAILED** | The route checks 12 weak legacy gates and ignores the stronger 16-row executive readiness report | Authorization fails closed unless all V53 and independent-certification prerequisites are valid |
| A-10 | Commerce effects remain locked | **ACCEPTED, current scope** | Tested paths report `NOT_BORN`, `SYNTHETIC`, `realCommerceAuthorized=false`, Wave 0/24 | Preserve until the final King pilot authorization packet |

## What the final soak actually proves

The final sealed result contains 181 admitted requests: 26 ordinary, 9 mission steps, and 146 fill requests. All fill prompts ask for a one-line Birth/mode answer. They dominate the headline 164/181 completion count.

The runner computes `expectOk`, increments `state.failed`, and then omits `state.failed === 0` from the final criteria. `ordinaryAtLeast24` counts admitted ordinary requests. `missionsAtLeast3` counts mission loops attempted. A wrong but nonempty answer can therefore be useful, durable, and included in an overall PASS.

The useful scoped statement is:

- chat requests were admitted and retrieved durably;
- latency met the declared bound;
- one restart retrieval and one browser reconnect worked;
- no observed request crossed the commerce locks.

The unsupported statement is that Pillow passed executive capability or is ready for independent Birth certification.

### All 17 failed rows

| Case | Classification | Audit result |
|---|---|---|
| O02 arithmetic, run 0 | **P1 product defect** | `17 + 29` returned generic scenario prose, without `46` |
| O07 table, run 0 | **P1 product defect** | Markdown table rejected as having no supplied candidates |
| O08 reordered, run 0 | **P1 product defect** | Invented candidates `US, least`; selected `US` instead of Orchid |
| O08 duplicate submission | **P2 harness defect** | Same logical item resubmitted under a new request ID after an artifact-write failure |
| O09 state, run 0 | **P1 product defect** | Returned unrelated Mini Fan/first-sale briefing instead of requested state and lock bullets |
| O11 total cost, run 0 | **P1 product defect** | `25 * 500` returned generic scenario prose, without `12500` |
| O02 arithmetic, run 1 | **P1 product defect** | Reproduced O02 |
| O07 table, run 1 | **P1 product defect** | Reproduced O07 |
| O08 reordered, run 1 | **P1 product defect** | Reproduced O08 |
| O09 state, run 1 | **P1 product defect** | Reproduced O09 |
| O11 total cost, run 1 | **P1 product defect** | Reproduced O11 |
| M1 step 2 | **P1 product defect** | Lost Vela/Lyra correction state and returned unrelated live-state briefing |
| M1 step 3 | **P1 product defect** | Did not explicitly confirm `NOT_BORN` and no live order |
| M2 step 1 | **P1 product defect** | `48 - 31` returned generic scenario prose, without `17` |
| M2 step 2 | **P2 consequential / inconclusive** | Step 1 failed, so continuation correctness cannot be isolated; visible answer was still wrong |
| M3 step 1 | **P2 test-spec defect** | “Exactly 2 lines plus token” conflicts with the three projected fields and is blocked before evaluation |
| M3 step 2 | **P2 consequential / inconclusive** | Step 1 never established a valid checkpoint or selection |

Net classification: **13 confirmed product failures, 2 harness-caused rows, and 2 downstream/inconclusive rows**.

The artifact retains only a 220-character `textHead` instead of the complete scrubbed answer and oracle trace. That prevents full independent regrading. Future evidence must store the complete secret-scrubbed response, response hash, expected-check IDs, oracle results, and request/deploy tuple.

## Reproduced product defects

The audit executed the exact O07, O08, and M3 fixtures locally against the frozen source:

- O07 returned `no supplied candidate products with commercial facts`.
- O08 bound product names `US` and `least` and selected `US`.
- M3 returned `PILLOW_RESPONSE_CONTRACT_BLOCKED: line_count_mismatch expected=2 got=3`.

Root causes:

- [`executive-decision-case-state.ts`](../../../backend/src/orchestration/pillow-host/executive-decision-case-state.ts) requires a table contribution cell to start with a digit, rejecting `US$4,100`.
- The reordered parser does not support `— name Orchid`; its loose trailing-name matcher extracts pseudo-names from currency and prose.
- [`executive-commercial-arithmetic.ts`](../../../backend/src/orchestration/pillow-host/executive-commercial-arithmetic.ts) covers a narrow unit-economics form but not basic addition, bare selling-minus-cost, or unit-cost times quantity.
- Follow-up candidate corrections are evaluated from the current message alone, so mission continuation falls into unrelated fallback output.
- [`executive-response-contract.ts`](../../../backend/src/orchestration/pillow-host/executive-response-contract.ts) intercepts M3 before Shadow CEO admission and blocks its contradictory line contract.

## Birth authorization defects

[`birth.ts`](../../../backend/src/orchestration/pillow-commissioning/birth.ts) marks technical readiness using 12 local gates. Several are unconditional. The SMART gate passes after any evaluated candidate, and the capability gate accepts eight local sandbox tests.

[`birth-readiness.ts`](../../../backend/src/orchestration/pillow-commissioning/executive-operating-loop/birth-readiness.ts) exposes a stronger 16-capability report and only reports ready when every row is `PROVEN`. The actual authorization route does not consult it.

The commissioning record can write `BORN`, while these paths continue to project a separate hard-coded state:

- [`shadow-ceo-integration/routes.ts`](../../../backend/src/orchestration/shadow-ceo-integration/routes.ts)
- [`integrated-vertical-slice.ts`](../../../backend/src/orchestration/shadow-ceo-integration/integrated-vertical-slice.ts)
- [`executive-fact-precedence.ts`](../../../backend/src/orchestration/pillow-host/executive-fact-precedence.ts)

Calling the current endpoint would create contradictory state and would not start autonomous commerce.

## Runtime continuity matrix

| Runtime capability | Status | Evidence and risk |
|---|---|---|
| Production API and isolated HTTP Brain | **IMPLEMENTED** | Railway process and Tier-0 child supervision exist |
| Separate BullMQ worker | **UNVERIFIED** | `worker.ts` and `railway.worker.toml` exist; no accepted proof of a distinct deployed worker or executed schedule |
| Worker health and heartbeat | **FAILED / MISSING** | Public health reports the internal HTTP Brain as `worker`; it does not verify the queue worker |
| Redis fail-closed behavior | **FAILED** | Production can continue with `DegradedTaskQueue`, which logs work that “would enqueue” while doing no work |
| Scheduled executive and commerce jobs | **IMPLEMENTED, UNPROVEN** | 30-minute executive and four-hour presale registrations exist; no durable production execution receipts were found |
| Readiness | **FAILED SAFE-TRUTH STANDARD** | `/health/ready` can stay ready without the separate queue worker and useful scheduled execution |
| Multi-process persistence | **UNRESOLVED P0/P1 RISK** | API and worker can hold separate in-memory sql.js copies and replace the same full database file |
| Backup and restore | **MISSING** | Corruption recovery quarantines and recreates an empty DB; documented backup is optional/future work |
| Operational alerting | **MISSING** | Logs and internal reports exist; no verified automatic external alert path |
| CI / headless engineering | **MISSING** | Repository has no `.github/workflows` and no persistent hosted repair/test/review runner |

The two-hour chat restart proof is real but scoped to the chat request store. Its recovery module explicitly excludes purchase, publish, and spend mutations.

## V53 Track B commerce matrix

| Track | Result | What exists | Required closure |
|---|---|---|---|
| B0 Supplier API universe | **PARTIAL** | Production-shaped CJ client; other suppliers rely on stubs | Verified ranked supplier/API universe for Amazon US |
| B1 Amazon US corridor | **FAILED** | Listings PUT candidate exists | Complete listing, order, inventory, fee, return, settlement, and shipment-confirm loop |
| B2 Actual cost centre | **FAILED** | Synthetic/local cost mechanics | Actual infrastructure, API, SaaS, storage, marketplace, and supplier billing ingestion |
| B3 True profit ledger | **PARTIAL / UNWIRED** | Sound formula helpers and local ledger components | Persistent actual revenue through fees, COGS, freight, ads, returns, refunds, operating cost, settlement, and payout |
| B4 Product ingestion / first 1,000 | **PARTIAL / UNPROVEN** | Import and qualification primitives; small test catalogs | Proof for 1,000 safely qualified products and current count |
| B5 Warehouse and shipping intelligence | **UNTESTED** | Algorithms and fixture data | Verified stock, route, landed cost, delivery, tracking, and outcome calibration |
| B6 Unit economics | **ACCEPTED, SYNTHETIC SCOPE** | Deterministic arithmetic and hard stops | Wire actual marketplace and supplier inputs |
| B7 Probability at scale | **UNTESTED** | Synthetic portfolio/scenario code | Empirical calibration from products, experiments, and outcomes |
| B8 Experiment and ads engine | **ACCEPTED, SYNTHETIC SCOPE** | Stop-loss and promote/hold/kill mechanics | Governed provider execution and evidence receipts |
| B9 Allocator and outcome learning | **PARTIAL, SYNTHETIC** | Manual lesson transfer in tests | Deployed persistent loop tied to outcomes and capital decisions |
| B10 MS-A cockpit | **FAILED / UNVERIFIED** | Several local dashboards | One authoritative cockpit driven by actual burn, products, orders, exposure, settlement, and realised net profit |

### Commerce transaction-spine blockers

- Amazon listing execution has no accepted live-listing artifact.
- Amazon order synchronization counts items but does not form the required durable order domain and orchestration flow.
- The customer pipeline can substitute a fabricated example delivery address. Live execution must reject missing customer data.
- CJ submission lacks a database-enforced unique Amazon-order/item/SKU key and restart-safe outbox/receipt.
- A crash after persisting `SUBMITTING` can leave an ambiguous side effect with no CJ reconciliation before retry.
- CJ response handling can fabricate order and tracking identifiers, and tracking errors can become synthetic `IN_TRANSIT`.
- Amazon shipment confirmation and actual-P&L helpers are defined but not consumed by an operating orchestrator.
- Returns, refunds, fees, settlements, and payout reconciliation remain structural or fixture-based.
- Each live CJ order requires founder approval, so current source does not implement bounded unattended fulfilment.

The repository is therefore **live-capable in isolated adapters, locked, and unverified as an operating business**.

## Local verification performed in this audit

| Command / check | Result | Interpretation |
|---|---|---|
| Backend typecheck | **PASS** | Candidate compiles at the type level |
| Pillow package typecheck | **PASS** | Package compiles at the type level |
| Fast invariant gate | **PASS, 79/79** | Narrow protected semantic suite is green |
| Birth and executive-loop tests | **PASS, 13/13** | Local tests preserve locks but do not connect Birth authorization to V53 |
| Exact O07/O08/M3 fixture reproduction | **FAIL as sealed evidence predicted** | Three raw defects reproduced directly from source |
| Full certification gate | **FAIL, 3 suites** | `reasoning-core-l1-l4`, `post-foundation-repair4-levela`, and `foundation-reset-learning` fail on `cr.timestamps_are_not_tasks` |
| Curated commerce/runtime tests | **See test log in this audit commit** | Passing mocks and sandbox lifecycles do not establish provider-backed operation |
| Curated commerce/runtime selection | **45/48; 3 failed** | The three failures are all in worker/scheduler initialization with missing `executive_objectives` |
| Standalone scheduler/worker test | **1/4; 3 failed** | Confirms the initialization failure outside the parallel selection; Redis-backed scheduler checks still skip when Redis is unavailable |

## Finite closure programme

The following packages replace repeated full-campaign submissions. They can be implemented without King acting as a courier.

### 1. GATE-001 — Honest capability evidence gate

Owner: engineering runner  
King involvement: none unless repository access fails

Acceptance:

1. Add `zeroSemanticFailures` to the release result.
2. Require every mission step to pass.
3. Separate transport completion from semantic correctness.
4. Detect duplicate logical case IDs, even when request IDs differ.
5. Persist complete scrubbed responses, hashes, expected-check IDs, oracle results, result kinds, and candidate/deploy tuple.
6. Refresh `FAILURE_LEDGER.json` from the final artifact.
7. Add the unique failed cases to the local regression suite.

No new two-hour soak should run until the unique semantic fixtures all pass locally.

### 2. BIRTH-001 — Single fail-closed Birth authority

Owner: engineering runner  
King involvement: none until a valid final authorization packet exists

Acceptance:

1. Create one durable canonical Birth state and remove hard-coded competing projections.
2. Generate a versioned, hashed V53 evaluation manifest from the controlling workbook.
3. Make authorization require the complete V53 gate set, official Wave receipts, clean streak, gauntlets, permanence, zero unresolved P0/P1, and signed independent certification.
4. Bind the certification to commit, deploy, model, prompts, tools, configuration, and commerce mode.
5. Add negative tests proving legacy/local/sandbox evidence cannot authorize Birth.
6. Keep commerce effects independently locked until the separate live-pilot authority exists.

### 3. CAP-001 — Close the 13 confirmed capability defects

Owner: engineering runner  
King involvement: none

Acceptance:

1. Deterministically answer safe basic arithmetic, including addition, subtraction, and cost times quantity.
2. Parse currency-prefixed table cells.
3. Support explicit suffix names such as `— name Orchid` and reject pseudo-names such as `US` and `least`.
4. Persist and bind mission continuation state for corrections, recovery, and counterfactuals.
5. Replace unrelated Mini Fan/live-state fallback on scoped obligations.
6. Correct M3 to one unambiguous line/token contract.
7. Pass all affected fixtures and the full local certification command.

### 4. RUNTIME-001 — Fail-closed autonomous worker continuity

Owner: engineering runner with deployment control  
King involvement: only if Railway/service secrets or authority are inaccessible

Acceptance:

1. Production worker exits nonzero without live Redis and the intended durable store.
2. A distinct worker heartbeat reports deploy SHA, service identity, schedules, consumer state, backlog, last start, last success, and last failure.
3. API readiness returns 503 when Redis is unavailable or the worker heartbeat is stale.
4. Executive and presale jobs write durable success/failure/overdue receipts and alert on missed execution.
5. Remove concurrent whole-file sql.js writers; use Postgres or enforce a single database-writing process.
6. Add CI for build, typecheck, full certification, Redis-backed scheduled execution, and restart recovery.
7. Prove one forced commerce cycle survives worker termination without a missed or duplicate effect.
8. Pass a 24-hour synthetic scheduled-runtime qualification before considering a longer residency.

### 5. COMMERCE-SPINE-001 — Restart-safe Amazon US to CJ transaction spine

Owner: engineering runner  
King involvement: only for missing account access; no live pilot in this package

Acceptance:

1. Persist the actual Amazon order, item, delivery address, and seller SKU using required marketplace/time queries.
2. Map seller SKU to a verified CJ product and variant; reject missing mappings or customer data.
3. Enforce a unique Amazon order/item/SKU key before any supplier side effect.
4. Use a durable outbox/receipt for CJ submission and reconcile `SUBMITTING` records with CJ after restart.
5. Persist only genuine provider order and tracking identifiers; unknown stays pending or error.
6. Confirm Amazon shipment exactly once after verified carrier/tracking data.
7. Implement cancellation, return, refund, and dead-letter recovery across Amazon, CJ, and the customer ledger.
8. Reconcile actual Amazon fees/settlement, CJ cost/freight, returns/refunds, operating burn, and payout into realised net profit. Missing values remain unknown.
9. Pass duplicate, timeout, crash-after-submit, restart, cancellation, and refund fault tests.
10. Produce one evidence bundle tied to exact commit, deploy, provider mode, and configuration.

### 6. CERT-001 — Independent V53 Birth campaign

Owner: independent Overseer/evaluator  
King involvement: receive one decision-ready result, not relay prompts or reports

Entry requires GATE-001, BIRTH-001, CAP-001, RUNTIME-001, and the synthetic/read-only scope of COMMERCE-SPINE-001 to pass on one frozen candidate.

Exit requires official Wave 1 24/24, the remaining V53 capability families, clean streak, required 10x gauntlets, integrated Birth gauntlet, permanence/residency, zero unresolved P0/P1, and a signed certification record.

### 7. PILOT-001 — King live-commerce decision packet

Owner: King for the irreversible decision; engineering runner for execution  
This is the first planned decision that cannot be delegated.

The packet must state exact marketplace and seller account, products/listings, order cap, per-order and total spend caps, ad cap, return/refund policy, stop conditions, monitoring and rollback, legal/tax/account constraints, and the candidate/deploy/certification tuple.

Birth and a live-commerce pilot are separate decisions. Neither is implied by passing engineering tests.

## King involvement boundary

| Event | King action |
|---|---|
| Repository repair, tests, fixtures, branches, draft PRs | **No relay work. Engineering runner owns it.** |
| Missing Railway/provider credential or permission | Complete the one named access step; do not copy intermediate reports between agents |
| New spend outside an existing limit | Approve or reject the exact cap and purpose |
| Material scope, legal, tax, account, or risk change | Choose from a decision-ready packet |
| Birth authorization | Approve only after the signed V53 certification packet |
| Live pilot | Approve exact listing, order, advertising, and total-loss limits |

GitHub authorization is confirmed and sufficient for repository work. It does not by itself prove Railway, Redis, Amazon Seller, CJ, Stripe, or other production access.

## Immediate next job

Start **GATE-001 and BIRTH-001** before another long run. They prevent false readiness and ceremonial Birth. Then execute **CAP-001**, **RUNTIME-001**, and **COMMERCE-SPINE-001** in parallel where dependencies allow. The first valid King decision is **PILOT-001** after independent certification; no routine Cursor relay belongs in this sequence.
