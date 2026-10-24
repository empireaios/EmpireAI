# Actual Work7 / Work8 sidecar compatibility

**3 new compatibility tests and 1 reused authority-fence test passed** on Node22.23.2 under kernel network denial. This is isolated binary-source/schema readback, not a production deployment rollback.

The test uses exact `git show` sources from Work7 revision `608f3f5382e32d295ebe3733194846ac7cbb9d57`: store, engine, worker and their sixteen-file transitive relative-import closure (95,500 bytes). Checked-in `.fixture` source bytes have SHA256 entries in `backend/src/validation/fixtures/work7-sidecar-baseline/manifest.json`. Every test verifies every source hash and transpiles those unchanged sources into a temporary ES-module tree. CI needs no git history or network. Only the already installed Zod dependency is linked into that temporary tree.

- Work7 writes an actual sidecar/task/receipt chain. Work8 reads identical canonical task/history digests, adds its immutable task-plan trigger and resumes exactly one step. A stale worker fence is rejected.
- Work8 writes its sidecar and derived fulfilment scan table. Work7's actual store/worker read it without changing canonical history, task, trigger or derived scan content. Work8 reopens it with those digests preserved.
- Both readers refuse an incompatible schema version99, missing required task table and truncated initialized file. Rejection does not rewrite the tested database file.
- The existing revision-rollback test confirms that a newer-revision approval cannot execute under an older control-plane revision; immutable audit is retained and recovery execution count remains zero.

No schema was broadened and no live store was opened. Exact source hashes and case evidence are in `sidecar-compatibility.json`. Additive read compatibility does not mean old code enforces new Work8 guards, and it does not replace release rollback authorization, deployment identity validation, RPO/RTO or production restoration proof.
