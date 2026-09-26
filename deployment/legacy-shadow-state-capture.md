# Legacy Shadow CEO disk capture

`legacy-shadow-state-capture.cjs` takes an explicit old-main data directory, old-main authority JSON path, new private destination directory inside the mounted volume, old-main commit and volume root. It copies the old Shadow CEO SQLite database, request-owner JSON and separate authority JSON. The source commit is caller supplied and **not independently proven by this utility**. It never imports the application, contacts a provider, restarts a process or restores a file.

On a host with access to the old files, use absolute canonical paths verified from the **running old revision**, not the candidate defaults:

```sh
node deployment/legacy-shadow-state-capture.cjs capture /absolute/old/cwd/.data /absolute/old/module/authority-store.json /data/legacy-shadow-unique-YYYYMMDD 21384342c401def948926904913840e63c18dff7 /data
node deployment/legacy-shadow-state-capture.cjs verify /data/legacy-shadow-unique-YYYYMMDD MANIFEST_SHA256_FROM_CAPTURE
```

The volume root and destination parent must already exist, and the destination must not exist. An interruption keeps an incomplete destination without a success manifest; choose a new name for another attempt. Retain the returned manifest digest separately from the volume. Captures and the manifest may contain private business data; restrict access and do not commit them to Git. The verifier checks that pinned manifest, file hashes, JSON object roots and SQLite integrity. The SQLite source is refused if a WAL, SHM or journal sidecar exists. Missing old stores are recorded as absent, and no replacement files are created at the source.

**A valid capture is only a disk copy.** Concurrent writers are not quiesced by this utility, JSON stores are not transactionally consistent with each other, the original file locations and their existence remain to be verified on the running container, and SQL.js RAM may contain hours of unsaved state. Every manifest records `pendingRam: UNKNOWN`, `quiescenceProven: false`, `completeLiveState: false`, `importAuthorized: false`, `safeToPromote: false`. Do not infer a safe restart, migration, cutover or commerce readiness from this receipt. The old production process needs an independently validated quiesce/final-save and reconciliation of all stores before any deployment that could restart it.

Run local refusal and integrity tests with `node --test deployment/legacy-shadow-state-capture.test.cjs`. CI repeats them on Node 22. Test fixtures and a disk copy do not prove the old production files, RAM contents or mounted volume have been captured.
