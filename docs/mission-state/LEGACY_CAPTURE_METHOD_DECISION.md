# CURRENT METHOD REJECTED

## Bounded method tested

Exact old commit 21384342c401def948926904913840e63c18dff7 checked out separately. The proof executes its unmodified EmpireDatabase storage module and actual dependency closure. Source bytes are compared against Git; sql.js, tsx, pino, zod and dotenv versions are checked against that revision's lock. Hosted CI performs a clean old-lock install with lifecycle scripts disabled. Node 22.23.2 is the pinned proof runtime; equality to the running production Node/runtime/resource profile is not established.

Method: call the existing requestCriticalPersist(), poll its shared completion statistics within 10 seconds, copy the persisted file, and independently restore/read in a new native-SQLite process. No application startup, provider session, process signal, debugger attachment, production file or production process is used. The old production storage code is faithfully reproduced; the full deployed topology and resource pressure are not. Therefore even a positive narrow export could not justify PRODUCTION CAPTURE METHOD PROVEN.

## Evidence

Positive control: a row existed in SQL.js RAM but was absent from the old disk. Critical export persisted it. A separately restored artifact passed SQLite integrity and contained that row in an independent process.

Counterexamples, within the same attempt:

- A prepared writer still admitted a new pending row after successful export; there is no capture/write fence.
- A second database's critical save set the module-global pending statistic false while Brain still held that new row only in RAM. A valid restored Brain copy omitted it.
- An independently opened stale handle to the same file subsequently saved its older state over a newer primary snapshot. Independent restored readback lost the newer primary row even though it remained in the primary handle's RAM.

These are real executions of the old storage implementation using synthetic records, not hypothetical concerns. Each captured/restored artifact has pinned SHA256 and independently read rows in the receipt. The test exits without old close()/shutdown to avoid a cleanup flush obscuring the evidence. A green CI result means the diagnostic reproduced the expected rejection, **not** that capture is safe.

## Consequence and one recommended alternative

Do not call the old critical-save method through commissioning or attach/inject it into production as a cutover procedure. Completion counters, pending=false, an intact SQLite file and one successful export do not prove a consistent preserved boundary. No real-production procedure or production authorization is requested from this rejected method.

Recommended alternative: **verified checkpoint recovery with an explicit data-loss decision**. First obtain a private read-only copy of the latest persisted production checkpoint and relevant disk stores, independently restore them in isolation with providers disabled, reconcile what can be recovered from durable receipts, and report the unknown pending-RAM gap. Only after that concrete recovery result exists should King be asked whether to accept the remaining unknown RAM loss and authorize a controlled recovery/cutover. No loss acceptance, stop, restart, deployment or commerce is authorized now. The existing old process must remain intact during this preparation. This alternative is not zero-loss capture and has not yet been performed on real production data.

Do not continue iterating the same critical-save/status-polling method. No additional capture framework changes are needed to record this decision. Production untouched; NOT_BORN / LOCKED.

## Durable hosted verification

Code `65f94a8cd06e5a59e2742b82eeb617d09a5156d3`: [Product](https://github.com/empireaios/EmpireAI/actions/runs/36586631210), [Semantic](https://github.com/empireaios/EmpireAI/actions/runs/36586631558), [Runtime](https://github.com/empireaios/EmpireAI/actions/runs/36586631134). All three passed. Hosted job109468760068 repeated the result from a clean old-lock install. Artifact11041658000 is retained in Git at `evidence/2026-09-29-legacy-method/hosted-artifacts.zip`; its GitHub digest matched, and a second Python SQLite reader independently verified all four restored snapshots. See `artifact-verification.json` and `ci.json` in that directory.
