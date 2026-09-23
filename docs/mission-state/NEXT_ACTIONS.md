# Remaining closure path

Baseline: see ../../PILLOW_MISSION_STATE.md. This ledger supersedes stale local next-action summaries without rewriting historical results.

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
| Independent capability/Birth acceptance | BLOCKED_EVIDENCE | Obtain original V53 syllabus/authority from Project or owner; run actual independent acceptance without self-awarded Wave/Birth credit. No additional programme creation. |
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
