# Mission state recovery

Hosted Pillow stores Mission Runtime state at `<DATABASE_PATH>.missions.sqlite`,
beside the configured Brain database. The filename is deliberately different from
the former JSON snapshot. Production refuses a missing or in-memory database path.
Include this file in private backups. Use SQLite's supported backup mechanism or
copy only while the mission writer is stopped; never copy a live database while
ignoring an active rollback journal.

The adapter uses Node's built-in `node:sqlite` `DatabaseSync`, available without an
experimental flag from Node 22.13.0. The candidate runtime is pinned elsewhere to
Node 22.23.2. The module remains experimental on Node 22; this change requires
hosted tests on the exact candidate runtime and provider restart verification.
No npm database dependency is added and the Brain SQL.js database is unchanged.

Each synchronous mutation validates the complete bounded envelope, acquires a
native `BEGIN IMMEDIATE` transaction, verifies its last loaded revision and hash,
updates the sole authoritative snapshot row and commits. SQLite rollback-journal
mode with `synchronous=EXTRA` protects the commit, with POSIX directory sync before
acknowledgment. Native OS locks are released when a process dies. A fresh process
recovers SQLite's rollback journal before reading or writing, so a killed writer
cannot leave a permanent application `.lock`. Busy writers fail immediately;
stale loaded instances cannot overwrite a newer revision and must reload first.

Creation and lifecycle history are one snapshot. Missions, transitions,
checkpoints, retries, recovery, reports and audit trail reload before runtime
initialization. Loading does not execute workers, invent a completed result or
grant approval. This remains structural mission persistence, not Birth or commerce
certification and not transactionality with an external worker's side effects.

Corruption, unknown application/schema identity, scope mismatch, conflicting
writers, I/O failure or the 16 MiB envelope limit fail closed. The database uses
4096-byte pages with a 64 MiB cap; history is never silently truncated or reset.
Snapshot files are created with mode 0600. A failure after COMMIT but before the
caller receives success can leave an unacknowledged durable revision: reconcile
and reload; do not retry an external effect by assuming it never happened.

## Explicit migration of existing JSON

The adapter will refuse to start with an unrecognized adjacent
`<DATABASE_PATH>.missions.json`. Engineering must stop the old JSON writer, retain
its original file and invoke `migrateLegacyMissionSnapshot(newSqliteFilename,
canonicalMissionScope(configuredFounderEmail))` from the candidate code. The helper
checks the complete version-2 envelope and organization, refuses an existing
native snapshot or a legacy writer lock, commits the unchanged state to SQLite
and returns the source filename and SHA-256. It never edits/deletes the source or
its lock. The source digest is retained in SQLite and checked on later access;
a missing or changed source fails closed. This prevents a still-running old
writer from silently creating divergent histories. Unbound offline test snapshots
must explicitly use null scope; hosted organization state cannot adopt them.

A legacy lock is not guessed stale during migration. Resolve any old-writer
ownership as an engineering step before migrating. Once on SQLite, interrupted
native writes recover without a human clearing lock files. The native recovery
tests kill an actual writer after its UPDATE and before COMMIT, verify rollback to
previously acknowledged history, then commit successfully from a fresh process.
These are local process-crash checks; power-loss/provider certification remains a
separate gate.

Sources: [Node 22.23.2 SQLite API](https://nodejs.org/download/release/v22.23.2/docs/api/sqlite.html),
[SQLite atomic commit](https://www.sqlite.org/atomiccommit.html),
[SQLite synchronous modes](https://www.sqlite.org/pragma.html#pragma_synchronous).
