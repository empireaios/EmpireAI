# O33 bounded filesystem contract inventory

Baseline c321eb20f2e3a22e6eb40bb9fb353bf30e283c95. Retained failure run40194561100: visual lock attempted at root-owned volume parent; prior preflight omitted actual helper paths. Inventory limited to O33 coordinator, admitted runtime/bootstrap/controller, actual captured stores and their lock/persistence helpers. No accepted examination repeated.

## Contract

`B=/work8-exam/{source,target}`, `V=B/volume`. Operator UID0; runtime UID/GID65534, no supplementary privileges. V remains0755 UID0. No runtime-owned ancestor of generation authority/operator evidence. Runtime writable envelopes0700 are commissioning, finance, commerce, pillow-visual-memory, pillow-session-continuity and .work8-executive-journal-locks. Capture and private temporary directories are B/capture and B/tmp,0700 UID65534. Modes are set before ownership handoff. Captured target materialization keeps private modes and uses the shared recursive ownership handoff.

The contract module deployment/o33-path-contract.cjs is shared by coordinator preparation, membership bootstrap and source freshness validation. Existing canonical native directories become envelopes; actual native roots are `V/pillow-visual-memory/pillow-visual-memory` and `V/pillow-session-continuity/pillow-session-continuity`. Both sibling capture-write-lock paths are therefore within explicit runtime envelopes. No fake precreated locks; real helpers retain fail-closed acquire/busy/release/identity behavior. Executive lock namespace is precreated privately, never by granting write access to V.

## Declared paths and operations

| Boundary | Actual paths/operations | Principal |
|---|---|---|
| SQL | work8-system-vault STORES: commissioning/{intelligence,pillow-institutional,pillow-request-receipts,pillow-reasoning,communications,openai-october-2026,assurance}.sqlite, finance/evidence.sqlite, commerce/runtime.sqlite; commissioning/empireai-brain.db and .missions.sqlite/.mission-execution.sqlite; commissioning/empireai-brain.db.shadow/shadow-ceo.db. Read/create/update, DELETE journal and WAL/SHM, SQLite locks/checkpoint. | Runtime,13 stores; offline operator materialization |
| Visual | native root/index.json, records/*.json; sibling **pillow-visual-memory.capture-write-lock** mkdir/rmdir; parent/root/records creation | Runtime |
| Sessions | native root/session-snapshot.json, .session-snapshot-UUID.tmp write/fsync/rename; sibling pillow-session-continuity.capture-write-lock | Runtime |
| Shadow controls | .shadow/shadow-ceo-authority/authority-store.json and .capture-write-lock; .shadow/shadow-ceo-request-owners.json and .capture-write-lock; atomic temporary siblings | Runtime |
| Watchdog/markers | commissioning/assurance.sqlite.watchdog; commissioning/openai-october-2026.sqlite.initialized, finance/evidence.sqlite.initialized, commerce/runtime.sqlite.initialized; atomic siblings where used | Runtime |
| Executive journal | /app/docs/governance/digital-soul/executive-decision-records.jsonl read only; V/.work8-executive-journal-locks/SHA256.capture-write-lock mkdir/rmdir via actual helper | Runtime lock only; repository read-only |
| Generation | V/authority/generation.sqlite and cutover-DIGEST.json read-only runtime; generation/member receipt files V/authority/members/{UUID}.{admitted,exiting}.json writable; generation transition/DELETE sidecars operator only | Protected authority; separately writable members |
| Controller | B/operator/journal.sqlite, .controller.sqlite, .audit-fence.sqlite and .emergency; network-proof.json; nonce grant.json, .capture/.release, nonce result-directory/{ready,held,released,failure}.json | Operator only; runtime IPC, no direct filesystem access |
| Capture | B/capture/point/{store/checkpoint.db,store/manifest.json, runtime-recovery.pending.json→runtime-recovery.json, redis.json, visual/session snapshots, executive journal and lifecycle/control/membership manifests}; recursive data/checkpoint copies, fsync/rename | Runtime capture boundary; copy under original hold |
| Sealed/inspection | B/operator/sealed-capture recursive source immutable0500 root directories; target operator/inspection derived materialization; runtime denied directory traversal/write | Operator only |
| Evidence | /evidence host-owned application-image.json and retained metadata; operator logs/receipt/artifact copies. Existing readable host ownership/modes retained; uploader readability verified. Runtime read only public files, denied writes. | Host uploader/operator |
| Executables | /app compiled JS and native .node dependencies; /native read-only mount; /work8-native/writer.so root0444 under root0755; /network-proof.json readonly mount | Runtime read/map only |
| Temporary | B/tmp per topology0700 runtime; TMPDIR propagated to all writer roles including assurance. No widening of /tmp or rootfs. | Runtime scoped private temp |
| Redis | journal-redis/target-redis network identities and DB0; sessions, BullMQ pending/queue state and TTLs captured through API. No Redis filesystem under application volume. Separate isolated Redis container /data tmpfs; save disabled, appendonly no. | Redis service; application network-only |

## Preflight coverage

Before coordinator, existing hosted preflight runs shared directory preparation for fresh and restored throwaway topologies. Restored fixtures are operator-created private SQL/native/control files transferred with the same ownedTree as the real materialization. UID/GID65534 child loads the existing hash-pinned native process isolation artifact, checks zero capabilities, NoNewPrivs, exact seccomp-filter increment and mapped native image. Actual compiled visual/session/executive/authority/request-owner lock helpers acquire/refuse busy/release/reacquire. All13 SQL paths exercise actual SQLite DELETE/WAL/SHM and transaction locks; JSON, capture and temp paths exercise create/read/fsync/rename/delete. Protected ancestor writes, authority rename, operator traversal and evidence modifications are refused. Operator SQLite control paths independently exercise exclusive locking. Existing host readability fixtures preserved.

This is a filesystem preflight, not capture/replay acceptance. Exact helper path evidence is returned in permission-preflight.json fresh/restored lists. Failure prevents coordinator entry; no automatic retry. Original capture/restore deadlines, writer fencing, guard containment, Redis identity assertions, admission, safety locks and acceptance oracle remain unchanged.

## Local limitations

Local namespace maps UID0 only, with no Docker or capability to represent UID65534. Syntax/diff checks and actual helper/SQLite path checks passed locally; foreign ownership/access/isolation remain explicitly pending the approved hosted preflight. No hosted run/publication has been performed for this successor.
