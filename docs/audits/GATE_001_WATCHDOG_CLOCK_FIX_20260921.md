# GATE-001: executive continuity watchdog repair

Scope: local engineering verification on application base
`2eb0d84c9a2f863d4038384078b6df1fd18cd828`. No provider operation, deployment,
commerce action, or paid-model call was performed by this repair.

## Defects preserved

- At `2026-09-20T23:57:31Z`, the epoch value `1789948651000` stored in the old
  signed 32-bit slot became `-1052711432`. The worker ignored the resulting
  nonpositive heartbeat, disabling stall detection. Other wrap phases could
  instead cause an immediate false stall.
- `process.exit(78)` inside a worker terminates that worker. A blocked main
  event loop cannot execute its worker-exit callback to terminate the process.
- A live main heartbeat timer was reported as a running watchdog even when the
  watchdog worker had failed. Initial tests also accepted a null heartbeat age.
- Independent review identified a further race: a completed long SQL.js export
  cleared its guard before the main heartbeat timer refreshed. A process-wide
  recovery signal could incorrectly kill that responsive process.

## Repair

- Use a monotonic atomic 64-bit timestamp, separate from the SQLite guard at
  Int32 index 1. Wall-clock changes do not affect heartbeat or elapsed timers.
- Treat missing, invalid, future, stopped, and failed watchdog states as
  unhealthy. Require the actual worker-ready handshake, and ignore stale worker
  callbacks after stop/restart.
- Preserve cold-start grace and the existing SQLite export hard cap. Invalid
  heartbeat recovery also preserves the bounded export allowance.
- Refresh the heartbeat before releasing the export guard in both asynchronous
  persistence and synchronous shutdown. The worker acquires the guard before
  reading the timestamp. This liveness signal is not a durability receipt.
- After a confirmed bounded stall, the off-thread worker sends process-wide
  SIGKILL. This is forced recovery: unflushed memory can be lost. Actual provider
  restart policy and post-restart durability still require separate verification.

## Executed local verification

Node `v24.19.0`; 24 tests passed, zero failed, skipped, cancelled, or TODO.

```sh
cd backend
node --import tsx --test --test-concurrency=1 --test-reporter=tap \
  src/validation/tests/continuity-heartbeat-clock.test.ts \
  src/validation/tests/executive-continuity-watchdog.test.ts \
  src/validation/tests/sqlite-persistence-boundary.test.ts
npm run typecheck
```

Typecheck passed. Held cases cover signed-32-bit boundaries, the exact failed
epoch, monotonic versus wall-clock changes, missing/future/negative clocks,
stall/grace/export-cap boundaries, failed-worker health, and restart callback
races. Real SQL.js export tests cover both handoff paths and read the saved row
from a fresh database. Existing persistence fault and retry tests remain green.

The hard-stall test blocks the main thread of a separate child process with
`Atomics.wait`. The actual compiled watchdog kills that child with SIGKILL at
the five-second test threshold, before the ten-second safety timeout, without
executing the main-thread exit callback. The test runner itself is not the
hard-stall target.

Both watchdog test files are now mandatory in the existing runtime CI workflow.
Hosted CI and production behavior have not been claimed by this local result.
Independent static review found no remaining blocking defect in this patch
after the export handoff and invalid-clock allowance corrections.

Pillow Birth, Wave credit, commerce authority, and financial limits are unchanged.
