# Offline state backup and restore

`offline-state-bundle.cjs` creates a private, integrity-bound file bundle for the
existing primary SQL.js database, native mission snapshot and native execution
outbox. It restores only into a new directory. It never replaces live files,
stops services, calls a provider, uploads data or spends money.

This is **offline support**, not a coordinated production snapshot or a complete
disaster-recovery procedure. Redis, external secrets/configuration, remote storage
and provider volumes are outside this bundle. A passing offline test is not a
production restore or Birth/commerce certificate.

The streaming primary SQLite copy and restore each permit up to 1 GiB, including
the observed 572,035,072-byte old persisted checkpoint. An isolated valid SQLite
fixture above 512 MiB exercises the full backup and restore. This size support
does not establish that unsaved SQL.js RAM or old Shadow CEO stores were captured.

## Mandatory prerequisite

Stop every process that can write any of the three databases, disable automatic
restart, wait for all admitted work to settle, and verify the final SQL.js flush
and process exits. Retain the actual shutdown/flush evidence separately and use
its SHA-256 in the request. Do not assert success after a forced or failed save.
Keep writers stopped through completion and do not point a running process at a
restore destination. No production shutdown or cutover is performed by this tool.

The tool obtains simultaneous native `BEGIN EXCLUSIVE` locks and verifies unchanged
source identity/hashes. **SQL.js exports replace files and do not respect these
locks.** The checks can detect changes but cannot prove that all such writers
stopped. The manifest therefore records `allWriterShutdownVerifiedByTool:false`.
The supplied source commit is declared context, not an observed runtime build;
retain its independent deployment/source evidence.

Any WAL, SHM or rollback-journal sidecar, unsupported journal header/mode, corrupt
SQLite file, changed owner/workspace, missing store or unresolved legacy lineage
causes refusal. The tool does not delete journals, checkpoint WAL, repair history,
create a missing store or silently convert formats. Diagnose such a refusal with
writers still stopped. Never remove a journal merely to make the check pass.

## Backup

Use the reviewed repository version on a POSIX host with supported `node:sqlite`.
Create a private JSON request outside the repository. Example field structure:

```json
{
  "databasePath": "/offline/source/empireai-brain.db",
  "destination": "/offline/backups/new-bundle",
  "buildSha": "FULL_40_CHARACTER_SOURCE_COMMIT",
  "scope": {"workspaceId":"ws_empire_1","ownerEmail":"CONFIGURED_FOUNDER_EMAIL"},
  "acknowledgement": "ALL_WRITERS_STOPPED_AND_FINAL_SQLJS_FLUSH_VERIFIED",
  "quiescenceEvidenceSha256": "SHA256_OF_INDEPENDENTLY_RETAINED_SHUTDOWN_EVIDENCE"
}
```

Run `node deployment/offline-state-bundle.cjs backup /private/backup-request.json`.
Both paths must be absolute and canonical; the destination must not exist and
its parent must already exist. The three source names are `DATABASE_PATH`,
`DATABASE_PATH.missions.sqlite`, and `DATABASE_PATH.mission-execution.sqlite`.
When native migration history binds `DATABASE_PATH.missions.json`, that original
file is also mandatory and included without modification.

All staged files are written with mode `0600` in a `0700` directory, fsynced and
revalidated before atomic directory publication. The empty destination name is
reserved exclusively; it contains no database until publication. A failed staging
operation removes only its own known files/reservation. A failure after rename
may leave a complete but unacknowledged bundle; retain it and inspect its manifest
rather than overwrite it. Original source files are never removed.

Retain the returned `manifestSha256` independently from the bundle. The manifest
binds source paths, exact file names, sizes and hashes, declared source build,
observed native owner/workspace and primary founder ID, mission revision, and
legacy lineage. The bundle contains private business/authentication data; keep it
private and do not commit it to GitHub. Remote retention remains a separate step.

## Restore and reopen

Create a second private request with `bundle`, a new `destination`, `buildSha`,
`scope`, `acknowledgement`, and the independently retained `manifestSha256`.
Run `node deployment/offline-state-bundle.cjs restore /private/restore-request.json`.
Do not derive the expected manifest hash solely from the bundle being checked.

Restore validates manifest identity, required files, exact bytes, database
integrity, scopes and migration lineage before publication. It refuses existing
destinations, including empty directories, symlinks and hard-linked source files.
Its receipt explicitly leaves `applicationReopenVerified:false` and
`productionCutover:false`. The resulting database path is
`DESTINATION/empireai-brain.db`.

Separately reopen the restored application in isolation using the recorded scope.
Verify the original SQL business records and account IDs, native mission history,
completed receipts and queued-operation continuation. Reopening a completed
receipt must not rerun its action or create another completion. Keep commerce
locked. Any production cutover, Redis recovery, remote backup, actual provider
volume restore and owner-authorized commercial commissioning remain separate.

Required offline integration test (from `backend`, after building Pillow):

```sh
node --import tsx --test --test-concurrency=1 --test-reporter=tap src/validation/tests/offline-state-bundle.test.ts
```
