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

The actual host binds a typed adapter to the mission engine. A configured owner/admin
may execute a mission with exactly the reserved worker via the normal authenticated
`/api/pillow/mission-runtime/execute` route. The engine commits the full action,
worker, original build, owner/workspace, empty-input hash and dispatch ID in the
same native mission-store transaction as its intent timeline. It then automatically
enqueues the native job. The route returns 202 only for a committed job, and 503
when durable admission could not be acknowledged. The mission stays Waiting until
the real output has been reconciled. Startup polling repairs the gap between
mission intent and job admission using the exact original binding, without owner
relay or generic tool retries. A changed unfinished build fails closed.

For acknowledgement recovery, a configured owner/admin may submit POST
`/api/pillow/mission-runtime/authority-executions` with exactly
`{action:"authority.snapshot.v1",missionId,dispatchId}`. The mission must already
exist in Running/Waiting with only the read-only worker assigned; `dispatchId`
must match the mission's recorded dispatch intent. Unknown, paused, cancelled,
high-risk, foreign or differently assigned missions are not admitted. Admission
returns 202 only after the native SQLite transaction commits. Identical repeat
requests return the same job; changed immutable content conflicts.

GET `/api/pillow/mission-runtime/authority-executions/:jobId` returns job status,
original execution build, actual persisted output and whether the mission state has
been reconciled. It does not expose an endpoint for submitting completion
receipts. A completed worker job is distinct from a completed mission. The
trusted host reconciliation callback gives the engine only a job ID. The engine
retrieves the validated receipt through its native-store adapter, compares every
immutable field against the persisted intent and current scope, and atomically
stores its receipt reference with the Completed transition and 100% progress.
A paused or cancelled mission cannot be completed. Repeating reconciliation
acknowledges the original receipt without adding another transition. This completion
applies only to the actual readonly inspection, never to Birth, worker capability
certification or commerce. Current mission diagnostics distinguish disabled,
configuration error, host unavailable, paused, running and execution error states.

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
