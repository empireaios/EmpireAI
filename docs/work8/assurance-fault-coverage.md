# Mandatory fault coverage — component evidence, not programme completion

NO-GO for the full fault programme. Existing exact-scope regression evidence is reused, not restarted. `INTEGRATED_LOCAL` links genuine injected mutations through local engines; `LOCAL_CONTROL_PLANE` exercises isolated control-plane resources; `PARTIAL` is only a contract or part of the lifecycle; `UNCOVERED` has no adequate injected examination. None imply production verification.

| Item | Required fault | Evidence level | Existing/new test reference | Exact remaining boundary |
|---|---|---|---|---|
| 1 | Stale Four Eyes evidence/cache expiry | PARTIAL | assurance-operating-scope.test.mjs; work8-assurance-recovery.test.mjs: stale-closure | Real source-time replay blocked in control plane; exact Four Eyes external-source stale→refresh recovery not integrated |
| 2 | Scheduled job misfire | UNCOVERED | work6-scale.test.ts: notBefore/backpressure contract only | Inject missed scheduled execution and prove bounded detection, reschedule and audit |
| 3 | Duplicate queue delivery | PARTIAL | work6-commerce.test.ts: crash receipt/task replay; work8-assurance-recovery: duplicate-delivery | Real idempotency and duplicate incident coalescing; no queue transport duplicate injection |
| 4 | Worker crash/restart | INTEGRATED_LOCAL | work8-joint-exams.test.ts | Actual receipt/cursor gap + reopened store + Assurance independently verified worker recovery |
| 5 | Queue backlog | PARTIAL | work6-scale.test.ts: 1000 candidate backpressure | Actual durable queue cap/rate pacing; no independent backlog detector→recovery escalation trace |
| 6 | Database/network timeout | PARTIAL | work6-commerce.test.ts: provider transport error; work8-assurance-recovery: unknown-outcome | Intercepted transport failure only; actual database lock/timeout and network interruption detector not integrated |
| 7 | Redis/session interruption | UNCOVERED | assurance-internal-collectors.test.mjs: worker/Redis readiness reader | Collector source contract does not prove actual Redis/session interruption recovery |
| 8 | Model-provider 429/503 | PARTIAL | work6-commerce.test.ts: supplier read 429/500; assurance-provider-storage.test.mjs | Supplier adapter status injection and passive model receipt health are not model429/503 recovery |
| 9 | Malformed provider output | PARTIAL | work6-commerce.test.ts: schema mismatch | Actual governed reader rejects malformed intercepted schema; no integrated model-output incident lifecycle |
| 10 | Partial/empty results | PARTIAL | work6-commerce.test.ts: partial fulfilment; work8-source-projection.test.ts | Partial supplier acceptance safely retained; empty model result repair/escalation not integrated |
| 11 | Hallucinated source claims | PARTIAL | work8-source-projection.test.ts; work6-commerce.test.ts: unverified outcomes | Forged digest/identity/authenticity rejected; no model-generated hallucination injected through Pillow assessment |
| 12 | Cross-provider correlation mismatch | PARTIAL | assurance-historical-provider.test.mjs | Existing exact original-correlation and historical binding negative proofs; not new multi-provider operating trace |
| 13 | Corrupted/duplicated journal event | INTEGRATED_LOCAL | work8-joint-exams.test.ts; work8-assurance-finance-boundary.test.ts | Finance event conflict detected and C repair refused; actual each-row corruption fails canonical history read |
| 14 | Missing order | PARTIAL | work8-finance.test.ts: missing order | Unknown order finance binding rejected; no real missing-order reconciliation incident loop |
| 15 | Duplicate order | PARTIAL | work6-commerce.test.ts: duplicate intake | Actual canonical intake duplicate denied; no queue-origin repeated order incident walkthrough |
| 16 | Inventory race | UNCOVERED | work8-portfolio-concurrency.test.ts is portfolio capacity, not inventory | Need concurrent stock allocation/reservation case; do not substitute active-cap proof |
| 17 | Unprofitable price | PARTIAL | work6-commerce.test.ts: low selling price; work8-operating-exams.test.ts: LOSS | Qualification refusal and loss scenario present; operational repricing incident/authority recovery absent |
| 18 | Negative cash exposure | PARTIAL | work6-commerce.test.ts: low/unknown cash; work8-finance.test.ts | Admission guards and negative-bank projection present; sustained cash-risk escalation loop absent |
| 19 | Delayed shipment | PARTIAL | work6-commerce.test.ts: partial/late callback | Late event rejection is not overdue shipment detection against an SLA |
| 20 | Missing tracking | UNCOVERED | work6-commerce.test.ts: schema/partial tracking only | Need accepted order with overdue absent tracking, bounded detector and justified escalation |
| 21 | Refund discrepancy | PARTIAL | work8-finance.test.ts: canonical refund mismatch; work6-commerce.test.ts: refund exposure | Monetary mismatch rejected; no complete refund discrepancy Assurance repair/escalation trace |
| 22 | Expired approval | LOCAL_CONTROL_PLANE | work8-assurance-recovery.test.mjs: expired-approval; assurance-control-plane.test.mjs | Actual stored approval expiry refused; zero repair executions |
| 23 | Unauthorised action | LOCAL_CONTROL_PLANE | work8-assurance-recovery.test.mjs: forbidden-financial-repair; work6-commerce.test.ts: forged roles | C repair denied and exact actor separation checked; 15 live protections require separate scope evidence |
| 24 | Failed rollback | PARTIAL | work8-assurance-storage-recovery.test.ts: revision rollback | Actual reopen under earlier revision denies stale approval; no incompatible schema/deployment rollback failure injection |
| 25 | Repeated failure | LOCAL_CONTROL_PLANE | work8-assurance-recovery.test.mjs: failed-repair | Independent unhealthy resource read prevents forged success; attempt budget exhausted |
| 26 | Recovery oscillation | LOCAL_CONTROL_PLANE | work8-assurance-recovery.test.mjs: recurring-failure | Distinct recurring incidents share persisted family budget; third repair denied |
| 27 | Compounded faults | INTEGRATED_LOCAL | work8-joint-exams.test.ts; work8-assurance-storage-recovery.test.ts | Receipt/cursor crash + supplier unknown + finance conflict; separately corrupt task step array + lost primary monitor |
| 28 | Delayed/recurring after apparent repair | PARTIAL | work8-assurance-recovery.test.mjs: recurring-failure | Virtual recurrence after actual local repair covered; delayed provider effect after timeout not integrated |
| 29 | Assurance/watchdog failure | PARTIAL | assurance-supervisor.test.mjs; work8-assurance-storage-recovery.test.ts | Real supervisor child restarts and heartbeat-loss detector; simultaneous failed independent supervisor requiring third-level containment absent |
| 30 | Backup restoration/corrupt checkpoint | INTEGRATED_LOCAL | work8-assurance-storage-recovery.test.ts | Actual file truncation detected; owner-approved isolated backup copy independently verified; original corrupt source retained |
| 31 | Cold restart/rollback/migration/endurance | PARTIAL | work8-operating-exams.test.ts; work8-assurance-storage-recovery.test.ts; elapsed-soak.json | Cold reopen and revision fence proof plus120s local soak; actual old-code schema migration/deployment rollback and multi-day hosted soak absent |

New storage examinations:3/3passed on Node22.23.2 with inherited kernel network denial. Restoring a new isolated copy requires a specific simulated owner approval; no production recovery catalogue or financial state repair authority is introduced. Revision rollback is a reopen/fencing test, not actual old-code compatibility proof. Mandatory model/provider, inventory, shipping, Redis/session, migration and all-live-safety-gate integrations remain outstanding.
