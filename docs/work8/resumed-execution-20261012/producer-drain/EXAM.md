# Shared TaskQueue producer admission drain

Successor candidate0546920d6d692b8ae32f6dda6f0567ecdec6f038/tree2f1fbb2da38e8c60c4a53de78731ec0d71208a13 at work8-producer-settlement. Predecessor63c083a405798bbe234f0ad523aadad0389fcd40/tree0c1d8ff01687a6bb01e2da78b09e12d7a14d2fb8 remains frozen at work8-producer-capture. Base recovered81c8b571 includes independently approved integrated recovery assertion7db9795a (mapped c053b140), so that accepted experiment was not restarted. Existing shared integrations were not edited.

## Negative reproductions

UNCHANGED-NEGATIVE.log: source TaskQueue unchanged from81c8; expected1 FAIL, capture entered while a real forked TaskQueue producer had passed admission but was blocked immediately before real BullMQ queue.add. UNCHANGED-TASK-QUEUE.sha256 binds original file. This is an actual cross-process local Redis ordering gap, not a protected custody claim.

Predecessor63 introduced atomic Redis admission tokens but released on any rejected produce promise. Parent/reviewer identified that promise rejection does not establish cancellation or remote settlement. 63C-UNCERTAIN-NEGATIVE.log reproduces1 FAIL, Missing expected rejection. Fault injection rejects queue.add's promise while a separately pending real Redis mutation is deliberately allowed to execute later. This is an unresolved-operation contract oracle, not a claim this exact trace occurred under default production connection settings. Predecessor11 targeted tests/full build passed but were insufficient to establish unknown-outcome safety;63 is not proposed for acceptance alone.

An initial source edit command used an incorrect relative path and failed before mutation. FIRST-CORRECTED.log consequently still exercised unchanged source and retained failures; CORRECTED.log is the actual first successful correction run. No failing attempt deleted.

## Architecture and conservative correction

withProducerAdmission acquires a unique persistent Redis set member in the same Lua operation that refuses existing capture-owner. This serializes producer admission against capture owner acquisition across cooperating TaskQueue instances. Enqueue's token spans actual BullMQ add and synchronous AuditLogger.write invocation. registerScheduledJob uses the same guard. The existing capture owner closes new admission, pauses consumers, then waits for both producer token count and active jobs to reach zero; verifies zero producer count before and after callback as well as existing queue fingerprint and ownership checks. Repeat/scheduler presence still refuses capture.

Only an observed successful operation may remove its own token. All operation errors—including potentially benign validation failures and synchronous audit errors—retain admission because classifying a rejected command as never executed is not justified. A failed token release propagates and does not authorize capture. Tokens have no TTL. Crashed/stalled/uncertain operations therefore block future snapshots; no ad hoc clearing or automatic expiry is introduced. On capture timeout the existing own-pause restoration behavior remains, but producer tokens remain and later captures still refuse. This intentionally trades snapshot availability for no false success. No operational restoration authority or cleanup endpoint was added.

AuditLogger.write is synchronous and can update SQL.js RAM before deferred persistence. This token boundary does not prove an independent SQL.js process has exported its state to disk; native SQLite audit fixture tests establish ordering through a durable synthetic audit write, not a full actual audit-schema/global durability assertion. It also does not make queue and audit writes transactional: an audit failure after committed queue work blocks snapshot rather than claiming reconciliation.

## Tests and scope

Cross-process producer test starts actual TaskQueue in a fork with real Redis, intercepts only queue.add to hold the known admission gap, and records synchronous synthetic audit rows in native SQLite. Capture cannot enter until both actual queue write and audit callback finish. New production attempts while owner is held refuse. Successful operation retires token and capture sees job+audit.

Crash/error test kills admitted producer, checks persistent membership and bounded capture refusal, then proves failed enqueue and repeat registration cannot clear any admission. Injected token-release failure preserves the committed job plus its token. Actual synchronous audit throw after queue commit preserves admission and blocks snapshot. Uncertain-rejection test allows late real Redis commit after rejection and verifies capture refuses before and after that commit.

Final successor tests/build pending when report created. Changed-path final target is9 unique tests (3 real Redis producer assertions +6 prior queue fence tests). Predecessor additionally passed real independent worker drain, Redis-loss/native-lock containment and actual app capture integration; unchanged expensive integrated replay/endurance/rollback were not repeated. Repeated runs are not new coverage. Node24 local runtime differs from pinned hosted Node22.

## Original33/39 residuals

This closes one concrete cooperating Brain producer admission race. Complete capture remains explicitly refused by default. Noncooperating/older direct BullMQ producers and arbitrary Redis writers do not register tokens. Repeating schedulers still cause refusal; no global scheduler pause proof is invented. Independent SQL.js processes, deployed replica/process ownership, every actual domain transition, recovered operational authority and protected independently controlled custody remain separate assertions. Local capability is NOT declared exhausted: other actual writer/initialization paths may still need participation/examination. External custody is a true separately controlled destination/identity dependency, not a reason to stop local coordination work. No33/39 full completion, publication, production activation, external provider call or paid inference is claimed.
