# Local old-source preservation fixture — 2026-09-23

This is a bounded engineering counterexample, not permission to touch production and not a final-save/restore certificate.

Command: `node scripts/old-source-preservation-fixture.mjs C:/Users/erlan/OneDrive/Desktop/EmpireAI C:/Users/erlan/OneDrive/Desktop/EmpireAI`

Observed local Node v24.17.0, SQL.js 1.14.1 (matches the exact old source lockfile). The implementation was extracted with Git from full commit `21384342c401def948926904913840e63c18dff7`, not from dirty workspace source. SHA-256 of extracted SQL.js wrapper: `d40eaae9765d782da3c66f05a51ed351da1da9719e70551c82f270ec196571d6`; old watchdog worker: `1c634a95830ad1bb67ba7fb724f39f5934b032778e3bd35a76a98f5417a991fb`.

The first invocation failed before exercising persistence: SQL.js does not export its package.json subpath (`ERR_PACKAGE_PATH_NOT_EXPORTED`). Package version discovery was corrected to read the adjacent package file. The second invocation exited 0 with all four assertions satisfied. A subsequent edit adds explicit temporary-directory cleanup containment; no application behavior changes.

| Case | Actual observation | Meaning |
| --- | --- | --- |
| Overdue noncritical save, injected 3000 ms lag | No disk file; pending=true | The maximum interval does not force persistence during saturation. |
| Critical save, no concurrent writer | Real SQLite disk image passed integrity check and contained row 1; request returned undefined | Existing critical path can save a checkpoint, but its public method provides no awaitable receipt. |
| Critical request while an older export's async write is held | Disk contains rows 1,2; live SQL.js contains rows 1,2,3; pending=true | A second critical request plus successful older export is not a final-save barrier. Trailing writes remain RAM-only. |
| Exact old watchdog worker | Worker exited 78 while fixture parent remained running; current epoch heartbeat truncation produced a nonpositive stored value | Old worker exit is not whole-process recovery. Clock truncation can also disable polling. This corroborates the existing GATE-001 defect, not new production evidence. |

The synthetic watchdog error receipt included `executive_continuity_watchdog_exit`, stallExitMs=5000, flushInFlight=false, and stalledForMs=1790169024794 for an intentionally injected heartbeat value of 1. That enormous synthetic age is not production downtime.

## Scope and limits

Real SQL.js was used with tiny synthetic rows. Exact old TypeScript implementations were transpiled; import adapters supplied controlled lag/disk status and the installed matching SQL.js engine. A test-only barrier delayed writing the one temporary database file after export. No production files, providers, credentials or APIs were accessed. The fixture closes only its temporary database for cleanup.

This does not run the full commissioning HTTP route, file reclamation, Redis, production-size database export or provider shutdown. It cannot certify production resource headroom, all writers stopped, final-save durability or quiescence. The small counterexample is sufficient to refute reliance on `requestCriticalPersist()` as an awaited final-save boundary; a multi-gigabyte fixture is unnecessary for that conclusion.

The known commissioning endpoint remains a possible *mutating checkpoint request*, not a safe cutover channel. It can reclaim temporary artifacts and writes further audit data after observing persistence stats. A newly deployed shutdown repair cannot retrofit a barrier into the already-running old worker. No verified zero-loss old-production cutover path has been established; accepting a last-saved checkpoint and unresolved pending RAM loss remains a separate explicit owner decision if no preservation mechanism is established.
