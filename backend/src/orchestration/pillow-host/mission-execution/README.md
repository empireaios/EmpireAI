# Bounded read-only mission execution

The only registered action is `authority.snapshot.v1`, assigned to
`pillow-authority-reader-v1`. It directly calls the existing canonical
`getPillowAuthority()` implementation. It cannot invoke models, arbitrary tools,
provider APIs, listings, orders or spending. Its output is an actual authority
inspection, not Birth certification or a commerce success.

The host enables this executor with `MISSION_AUTHORITY_EXECUTOR_ENABLED=true`,
an exact 40-character `RAILWAY_GIT_COMMIT_SHA` (or `EMPIREAI_BUILD_SHA`), configured
founder identity, and persistent `DATABASE_PATH`. It stores private evidence at
`<DATABASE_PATH>.mission-execution.sqlite`; include this file in backup and
restore scope alongside the existing mission snapshot. Startup attaches a
bounded one-job-per-tick poller and shutdown waits for the active read to finish.
A missing or invalid configuration gives the authenticated endpoint 503.

A configured owner/admin may submit POST
`/api/pillow/mission-runtime/authority-executions` with exactly
`{action:"authority.snapshot.v1",missionId,dispatchId}`. The mission must already
exist in Running/Waiting with only the read-only worker assigned; `dispatchId`
must match the mission's recorded dispatch intent. Unknown, paused, cancelled,
high-risk, foreign or differently assigned missions are not admitted. Admission
returns 202 only after the native SQLite transaction commits. Identical repeat
requests return the same job; changed immutable content conflicts.

GET `/api/pillow/mission-runtime/authority-executions/:jobId` returns job status,
original tested build, actual persisted output and whether the mission state has
been reconciled. It does not expose an endpoint for submitting completion
receipts. A completed worker job is distinct from a completed mission. The
trusted host reconciliation callback must accept the store-validated receipt
and durably change mission state before acknowledging success. Without that
callback the worker result remains available and `missionReconciled` is false.

The execution database has a strict owner scope and dedicated schema, OS-backed
rollback-journal locking, EXTRA synchronization, bounded size/history and three
maximum claims. It records a claim before the actual read, then commits output
and its receipt before exposing completion. Expired claims can retry only this
side-effect-free read; fenced stale claims cannot commit. Exceptions, exhausted
claims or changed builds hold unfinished work as unknown. Completed older-build
receipts retain their original identity for review/reconciliation after upgrade.

The execution database and the mission snapshot are separate transactions.
This implementation does not claim atomicity across them. Recovery replays
receipt reconciliation, not the completed read, when mission state persistence
fails. Any future mutating or external action needs a separate reviewed effect,
idempotency and uncertainty contract; do not add it to this read-only path by
changing an action string.
