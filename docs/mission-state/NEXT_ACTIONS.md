# Remaining closure path

## Current execution checkpoint — 2026-09-23 13:37 UTC

This supersedes earlier next actions; earlier run setup is historical.

1. Preserve recovery2 failure: before 35/35 PASS at 13:12:36 UTC; after 37/38 at 13:19:34 UTC, sole failure authority_result_preserved after same-source deployment 02302b9f-5899-4990-89bd-34b2a69b835b. No pair PASS; offline actual-pair verifier rejects FAILED_OR_MALFORMED_CHECK. No bounded_canary_stopped receipt retrieved; primary shutdown observation alone is insufficient.
2. All recovery2 services and volumes were explicitly approved for deletion and deleted. Provider services/pending work are empty; final UI empty-canvas verification was pending. Do not repeat deletion or touch production. Latest displayed cost US$0.0024 is provisional.
3. Redis cjson result reserialization repair is under review in integration because current result digest changed again. Preserve exact failed source/probe evidence; do not weaken probe checks. Review/test/CI the repair before any further provider run.
4. Integrated PR5 head 66ddc162209210136a856b1e61172cfd5c450927 passed all ten CI jobs, including 26 certification tests (35865122554/35865122463/35865122524). Reuse this evidence; it does not cover uncommitted serialization changes or grant certification.
5. Old-production critical-save concurrent-write fixture exposes a preservation gap. Establish actual stopped admission/writers, settled work, final save and no respawn before cutover. Production remains unchanged; do not treat a new-source fixture as proof old production is safe.
6. Continue replacement certification autonomously; missing historical V53 is not an owner dependency. Six frozen independent arithmetic/ranking cases have not been executed against Pillow and have zero credit. Complete the blinded runner and criterion verification without training on sealed cases.
7. Keep NOT_BORN / commerce LOCKED and all owner financial/commercial boundaries. RECOVERY2_RESULT_2026-09-23.md and raw RECOVERY2* files retain actual scope and failures.

## Current execution checkpoint — 2026-09-23 13:01:35 UTC

Earlier dated notes remain historical and are superseded by this checkpoint.

1. Previous owner-approved isolated services/volumes were deleted and verified; see APPROVED_TEST_CLEANUP_2026-09-23.md. Do not repeat deletion or touch production.
2. Fresh recovery2 app deployment 613e22c1-62db-4387-b5dc-d31571156084 was BUILDING at launch, source bed51228ada3110373ae671ca72f9d781af3b0e0 (all ten CI jobs passed: 35863001095/35863001122/35863001277). Refresh provider identity/readiness. Exact probe hash 8b2eb4245a28477f29baa49b1665c9d89af3a95bb5f40420e98acf38fa438181. No before/after result yet.
3. Absolute expiry 2026-09-23T13:31:22.745Z cannot be extended. Require complete before PASS before one same-source/expiry redeploy, then after. Capture raw probe JSON/sanitized observations and actual old-deployment shutdown logs. Narrow harness can verify supporting recovery evidence only, not whole OPS/Birth acceptance.
4. Active app service 78d7c0ad-523a-4b70-89eb-1815aa3bd577 / volume 20fbeefa-0311-4bf2-98e7-75a4e967c9f9; Redis service 4815f3ec-bff4-4c81-9faf-cde533d92af3 / deployment 2553f76d-a9c5-47db-8c73-9236ee0b6057 / volume de6f9bd8-6389-4456-9cca-6eba6b31e9d5. Both /data volumes have 50 GB capacity. Same isolated project/env as canonical state. Clean up within explicit scope and reconcile actual cost; US$0.0014 displayed so far is provisional against existing US$5 engineering allowance.
5. Commit/review/execute the recovered 84-requirement replacement specification and offline evaluator/harness once ready. Missing original V53 is not an owner blocker; do not ask for it again. These artifacts have no acceptance credit yet. Continue engineering gaps independently while preserving NOT_BORN/LOCKED.
6. Preserve old production and prove stopped writers/final save and coordinated restore before promotion. Live-commerce pilot remains separately owner-authorized after certification.

Baseline: see ../../PILLOW_MISSION_STATE.md. This ledger supersedes stale local next-action summaries without rewriting historical results.

Current checkpoint12:15UTC: PR5head209107c1 published; all10exact-sourceCIjobsPASS. Mission draft and evidence-intake engineering implemented/reviewed. Intake is not acceptance; NOT_BORN/commerceLOCKED preserved. Production unchanged. Fresh hosted recovery, safe old-state preservation, originalV53 acceptance and actual phone/commercial operation remain open. Permanent isolated resource deletion awaits owner confirmation; both test services stopped, auto-deploy disabled, usage$0.0012provisional. Canonical frozen state is inPR5; newestCIreceipts/status are also mirrored inPR5body.

| Step | Status | Required evidence / next action |
| --- | --- | --- |
| Recover latest source and CI | DONE | Remote candidate 972dbfc2; three successful workflows, ten jobs, exact source fetched locally. |
| Recover production identity | DONE | Railway deployment 86302878 on old main 21384342, attached volume; no candidate deployment inferred. |
| Authenticated Vercel inspection | DONE_VIA_BROWSER | Owner signed in; current deployment dpl_7rfJqEeCpsojJ2nqF5V6jDevui8R on old main 21384342, root empireai-web, Node24.x, domain empire-ai.co. Logs show real Pillow API503 propagated from Railway. See VERCEL_BROWSER_VERIFICATION_2026-09-23.md. Connector OAuth remains unresolved but dashboard is usable. |
| Test spending authorization | AUTHORIZED 2026-09-23 | Owner granted an additional US$5 maximum for the isolated Railway restart/recovery test. Prior costs remain unknown; no old balance assumed. Record incremental spend and cleanup; do not exceed new cap. |
| Repaired-source isolated provider test | FAILED_BEFORE; COMPUTE_STOPPED | PR8 head59c393a5 passed all ten CI jobs and hosted build/runtime. Canonical before probe failed mission_created: validator conflates draft creation with high-risk execution approval. Do not perform after probe or reuse failed marker. Raw failure/marker/diagnostic and shutdown logs saved. App/Redis stopped; permanent test resource deletion confirmation pending. Draft validation repair in progress; requires new exact-source CI and fresh bounded test after cleanup/budget check. |
| Old-production preservation | UNPROVEN | Independently establish stopped admission, settled in-flight work, stopped schedulers/writers, verified final SQL.js save and no respawn. Current main primary respawns child exits and lacks repaired coordination. A new candidate's shutdown tests do not prove old-process shutdown. Do not stop/redeploy old production to discover whether save works. |
| Coordinated restore | UNPROVEN | Include SQL.js, native mission/outbox when present, Redis state, secrets/config restoration and provider volume evidence. Current offline bundle only supports its documented three-store format; do not manufacture native stores in old production to make it pass. Validate application reopen, identities, history, completed receipt non-reexecution and queued continuation in isolation. |
| Candidate promotion | BLOCKED_ACCEPTANCE | After recovery/provider proof and remaining review, keep all exact required checks satisfied, then promote within owner-authorized scope. Preserve rollback and data compatibility. Do not merge just because CI is green. |
| Actual owner interface | UNPROVEN | Authenticated desktop and phone normal Pillow path: one submission, visible answer, pending receipt recovery, reload/reconnect, truthful error and no duplicate effects. Retest historical interface failures. |
| Independent capability/Birth acceptance | ENGINEERING_OPEN | Owner authorized explicit replacement of unavailable historical requirements. Recovered 84-requirement specification, evaluator and narrow supporting harness are reviewed but not committed/credited. Complete executable independent evidence; no historical V53 owner dependency or self-awarded Birth credit. |
| Certification receipt ingestion and acceptance | ENGINEERING_OPEN | Candidate docs/audits/pillow-birth-authority/REVIEW.md explicitly leaves ingestion/acceptance unimplemented; pillow-authority.ts freezes NOT_BORN/LOCKED/UNVERIFIED. Implement an authenticated independently evidenced acceptance path against recovered governing requirements. Do not bypass frozen authority or treat owner approval alone as certification. |
| Controlled commerce | LOCKED | Revalidate seller/supplier credentials and exact approved product economics including unknown fees/shipping/timing. Record owner approval of concrete SKU and commercial spend; verify listing acceptance vs actual publication separately. Then order ingest, authorized supplier fulfilment/payment, tracking, failure/refund handling and ledger reconciliation through Pillow. No synthetic sale or submitted listing counts as revenue. |
| Sustained operation | UNPROVEN | Demonstrate monitored repeatable operation, truthful costs/profit, recovery and actionable owner escalation under agreed scope. Mission closes only with complete operational evidence. |

## Source inspection notes for old production

12:03UTC: evidence intake implemented/reviewed; sourceac82b2e9 clean CI all10jobsPASS. Acceptance remains UNIMPLEMENTED pending governing originalV53/trusted evaluator. Production integration prepared separately with unchanged provider deployment configuration; do not mergePR8 test settings. Fresh provider recovery test must use a new bounded run after cleanup/budget review; old fixed deadline expired.

2026-09-23 update: mission draft fix96e7e1f7 passed all ten jobs across three exact-source CI workflows35855972383/35855972387/35855972385. Fresh hosted recovery remains unverified; test app auto-deploy disabled and both services offline. Failure history and original fixed deadline preserved. Production provider Backups page explicitly shows no backups/no schedule; read-only database stat at11:44UTC shows57,049,072bytes,lastwrite05:11:54.651UTC. See PRODUCTION_BACKUP_INVENTORY_2026-09-23.md. Certification intake implementation is in progress; acceptance remains blocked.

At main 21384342, backend/src/runtime/tier0-isolated-primary.ts registers child exit/error respawns without the new installPrimaryShutdown coordination. backend/src/app.ts createEmpireShutdown stops event stream and Pillow, closes app, then shuts down brain, but this alone does not establish all primary/worker/SQLite/Redis writers have settled. The existing POST /pillow-commissioning/one-product/flush-durability route is conditional commissioning persistence, includes artifact reclamation and audit writes, waits 1500 ms, and is not a universal final-save barrier.

At candidate 972dbfc2, backend/src/runtime/primary-shutdown.ts and persistence changes improve coordination with tested failure handling. deployment/offline-state-bundle.md explicitly states that SQL.js replacement writes ignore native locks and its tool cannot independently establish all writers stopped. Preserve that limit.

## Resume without repeating work

1. Read owner replies about access/budget and this index. Check PR5 head and provider identity for drift.
2. Keep dirty main untouched. Work from an isolated checkout of verified PR5; read applicable AGENTS.md before editing.
3. Reuse completed source/CI evidence. Execute only remaining blocked acceptance once prerequisites are resolved.
4. Store new receipts and update statuses here after each result, including failures, spend and cleanup. Update PILLOW_MISSION_STATE.md with exact next action before any stop.
