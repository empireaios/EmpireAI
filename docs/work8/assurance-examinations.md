# Work 8 bounded Assurance component examinations

Scope: actual shipped `AssuranceControlPlane` with temporary SQLite persistence and intercepted process-local resources. This is component/integration evidence, not complete commercial-loop, genuine supplier, UI, endurance, provider, or production proof. No external operations or paid calls occur in these modules. A zero-cost cap describes the module's effects, not an OS-level egress attestation.

## Defects reproduced and corrections

1. Replaying a HEALTHY claim whose source `evidence.observedAt` was 180001ms old closed a currently failed incident. Before correction the `stale-closure` exam reported FAIL. Incoming explicitly timestamped affirmative evidence is now downgraded to STALE when its source time is invalid, future, or older than the existing 180000ms component freshness interval. Reception time cannot refresh that source claim. Existing collectors without this optional source field retain their contract; independently proving freshness for every collector remains outstanding.
2. A recovered fault recreated a fresh incident with a new per-incident attempt budget. The existing engine therefore allowed recovery oscillation without a family budget. Admission now counts durable repair attempts across the same fingerprint and runbook version during the preceding hour, in the existing BEGIN IMMEDIATE transaction. The original maxAttempts remains the ceiling. It does not add authority, reset attempts, clear history, or permit blocked repairs. Once exhausted, incident remains UNRESOLVED with an explicit circuit-open reason. A new revision/version intentionally remains a separate reviewed scope.

## Reproduction

From repository root:

```
node --test backend/src/validation/tests/work8-assurance-recovery.test.mjs backend/src/validation/tests/assurance-control-plane.test.mjs
```

Initial corrected run: 27 tests passed (12 new harness/contract tests; 15 existing control-plane regressions), Node 24.19.0. Repository specifies Node 22.23.2: exact supported-runtime CI remains required.

`runWork8RecoveryExam({scenarioId,seed})` returns an independently evaluated receipt including immutable scenario identifier, seed, virtual-time trace, SQLite events, baseline/final digest, permitted effects, zero cost cap and limitations. SQLite-generated incident/recovery UUIDs intentionally remain unique rather than seed-derived. Source revision must be attached by the integrated runner at exact-head execution time.

| Scenario | Independent check |
|---|---|
| cache-expiry | Actual process-local cache fault cleared and verified separately from repair result |
| duplicate-delivery | Same active incident, one execution |
| failed-repair | Executor claim ignored; failed resource read; bounded attempts |
| unknown-outcome | Unknown retained and not blindly replayed |
| expired-approval | Stale approval denied; zero executions |
| forbidden-financial-repair | Authority C repair denied |
| watchdog-loss | Lost primary heartbeat detected without watchdog renewing it |
| compounded-cache-worker | Cache recovery cannot hide owner-controlled worker fault |
| restart-preservation | Fresh engine instance reads identical event history; no replay |
| recurring-failure | Third fault remains unresolved after family budget exhausted |
| stale-closure | Old affirmative source evidence cannot close current incident |

Accounting digest in this harness only verifies its isolated fixture was unchanged. It is not a production financial-preservation attestation or commercial-ledger reconciliation. Timings are virtual except bounded operation timers; this is not elapsed soak evidence. Production runbook classification, full fault catalogue, enforced sandbox egress, UI/owner receipts and independent mission closure remain separate mandatory gates.

Additional scope/history regression run: 14 tests passed across operating-scope and historical-provider suites. The supervisor suite could not load `deployment/assurance-supervisor.cjs` from this checkout (ERR_MODULE_NOT_FOUND); the combined command exited 1. Recover that source file before claiming supervisor regression coverage.

Supervisor recovery: restored the existing tracked supervisor source into its expected checkout location; all 3 supervisor tests then passed. No supervisor implementation changes were made.

Independent portfolio review and concurrency examination: `work8-portfolio-concurrency.test.ts` builds 999 active products through actual governed engine commands, then two worker threads with independent SQLite connections attempt the 1000th slot concurrently. One publication is admitted; the other is rejected with ACTIVE_PORTFOLIO_CAP, preserves its four pre-publication receipts, and remains rejected on retry. Final active count is exactly 1000. Passed in 39.6 seconds on Node 24.19.0. Initial worker-bootstrap run failed loading TypeScript; corrected explicit tsx/cjs bootstrap, with separate worker smoke proof. No direct SQL fixture insertion is used. Cap admission shares the engine BEGIN IMMEDIATE transaction. Retirement requires exact original approving owner and resolved orders; no added live-effect authority observed. Assurance recurrence queries use unpaginated cp.list(), so the existing commerce missions LIMIT 200 does not affect its budget.

## Actual storage faults and bounded checkpoint recovery

`work8-assurance-storage-recovery.test.ts` adds five Node22/kernel-isolated cases: actual journal truncation detected; owner-approved restoration into a new isolated copy verified against exact original history; simultaneous corrupt checkpoint and lost monitor heartbeat retain distinct incidents; revision rollback refuses stale approval; forged COMPLETE/altered/truncated task plans are refused. This is not old-code schema rollback or production backup readiness.

The corrupt-checkpoint examination found and repaired an existing worker defect: mutable COMPLETE status could previously bypass canonical history validation. Worker task reads now verify identity, fence/cursor consistency, every claimed committed command/actor/request digest and the exact allowed receipt-before-cursor gap. The task plan is frozen by an additive SQLite trigger once any mission receipt exists. Failed tasks retain their original committed prefix when a separately authorised replacement task subsequently progresses the same mission. No corrupted task is silently reset or repaired.

`makeWork8CommerceRecovery` is candidate code for a single authority-A runbook: it reconciles an existing receipt/cursor gap for the exact hashed workspace/task probe. It cannot enqueue work, create an approval, execute a new step or retry uncertain supplier effects. It reuses worker idempotent replay, requires unchanged full receipt history and independently verifies the resulting cursor/fence. Its four negative/positive tests passed, along with the five storage cases. Production integration/release requires the separate root integration and release gates.

Validation: 20 targeted commerce/joint/operating/storage tests passed initially; new9 recovery/storage tests passed. Modified worker1000-item scale case passed in79.6s. The first partial-capacity regression failed because an old BLOCKED task's later separate replacement receipt was misclassified; fixed to preserve original blocked prefix, then reran only that case successfully. No full1000 campaign was repeated for that narrow correction.

Checkpoint race extension: helper now emits a fresh HEALTHY probe with the same task-bound identity only when canonical receipt history and task progress align. BLOCKED tasks and unknown supplier outcomes emit BLOCKED probes without a repair runbook. A fifth helper test proves the normal worker may reconcile first, after which fresh independent observation closes the incident with zero recovery executions and no additional receipt. No cached-success substitution is used.
