# Certification evidence intake engineering

Implemented and pushed commitac82b2e9 in PR8 test branch. Production unchanged. Intake is not certification acceptance.

Authenticated founder/admin receipts are scoped to authenticated workspace; strict bounded schema; atomic receipt/audit insert; exact-content idempotency; conflicting IDs rejected while original retained. Memory-only storage rejected. Acknowledgement awaits SQL.js critical persistence; failed-save reads/retries stay blocked. Verified durable rows avoid repeated export. Matching audit identity/hash/time checked on read/retry. Maximum10000receipts,16KiBbody,32artifact hashes; arbitrary URLs are not fetched.

Every result remains INGESTED_UNVERIFIED,certificationAccepted=false,evidenceVerified=false,credit0. Missing originalV53/trusted evaluator and unimplemented acceptance are explicit blockers. Birth/commerce authority untouched. This is per-instance persistence, not coordinated backup or artifact-content verification.

Latest local focused suite10/10PASS,zero skipped; diff checkPASS. Independent review found then verified fixes for RAM-only acknowledgements and unchecked audit readback. Parent inspected intake/routes/CI wiring and database persistence barrier. Tier0 route forwarding source-inspected only; not hosted end-to-end.

Preserved validation limitations/failures: initial test mistakenly used resetDatabaseInstance for reopen, which deletes its fixture; corrected to closeDatabase. Broad local typecheck failed with26 stale linked Pillow declaration errors. Combined old Birth suite stalled without a Birth result and was stopped exit1; no local Birth pass. Extra candidate compilation had no result and was requested stopped; clean hosted CI is required for final exact commit. No dependency installation or shared-main dependency modifications.

Next: record clean hosted CI, integrate production-safe changes separately from PR8 canary config, fresh isolated recovery proof, originalV53/trusted evaluator recovery, safe old-production preservation. Never merge test-only railway.toml into production.
