# EmpireAI / Pillow active mission handoff

Updated 2026-09-25 02:33 UTC. Machine-readable companion: [CURRENT_HANDOFF.json](CURRENT_HANDOFF.json). This section is the current checkpoint; dated material in [PILLOW_MISSION_STATE.md](../../PILLOW_MISSION_STATE.md) and [NEXT_ACTIONS.md](NEXT_ACTIONS.md) preserves earlier chronology.

## Mandate and authority

King authorized routine reversible engineering, CI, canary operations and cleanup. Continue automatically through implementation, hosted testing, deployment verification and independent certification. Stop for owner-only 2FA/credentials, new material spend, destructive production data without recovery, material unmandated business risk and the bounded real commercial pilot authorization. Owner has no additional V53 artifact; use the 84-requirement replacement with provenance and independent proof, without granting credit for the specification itself.

**Birth: NOT_BORN. Wave credit: 0. Commerce: LOCKED. Pilot authorization: absent.** No model call, listing, real order or sale occurred in this recovery.

## Verified source and deployment

| Item | Verified state |
| --- | --- |
| Main | `21384342c401def948926904913840e63c18dff7` |
| Candidate | [Draft PR #5](https://github.com/empireaios/EmpireAI/pull/5), `fix/pillow-integrated-closure-20260920`; last fully verified exact-head `d6b15fbced2551b41f7456a512af07e1670cc9eb` passed [Product](https://github.com/empireaios/EmpireAI/actions/runs/36084820226), [Semantic](https://github.com/empireaios/EmpireAI/actions/runs/36084820228), [Runtime](https://github.com/empireaios/EmpireAI/actions/runs/36084820274) CI. Amazon sync guard `b7e01c36` passed [Product](https://github.com/empireaios/EmpireAI/actions/runs/36085944794); synthetic Cost Guard proof rollback `9656529a` passed [Product](https://github.com/empireaios/EmpireAI/actions/runs/36086215979) and [Semantic](https://github.com/empireaios/EmpireAI/actions/runs/36086215981). Current candidate `52051fa6` repairs Amazon OAuth; [Product](https://github.com/empireaios/EmpireAI/actions/runs/36086559146) and [Semantic](https://github.com/empireaios/EmpireAI/actions/runs/36086559149) CI passed, Runtime CI still in progress. The follow-up workspace/role isolation patch is pending. |
| Railway live | Deployment `86302878-25b5-4990-87d9-86580cd4e976` on old main; /data volume `40ab30d1-2759-4eba-b3c8-255436610bb0`. A Brain watchdog exit and respawn was observed 2026-09-25 00:25:52–53 UTC, with pending SQL.js memory survival **unproven**. |
| Vercel live | Deployment `dpl_7rfJqEeCpsojJ2nqF5V6jDevui8R` on old main. |
| Canary cleanup | Owner committed eight approved removals in `empireai-canary-20260923` only. Railway readback: **zero services, zero pending work, no staged patch**. Project retained, live project untouched. |

## Failure evidence retained

Recovery2 passed 35/35 before, failed authority preservation after 37/38; no accepted pair. Recovery3 passed 35/35 before, failed replacement build; no after or pair; Redis stop exceeded expiry. Expired recovery4 browser operation was abandoned, PR #9 closed unmerged with commits/receipts preserved. Railway Agent could stage cleanup but commit returned a dashboard verification requirement; direct `railway_accept_deploy` returned `INVALID_ARGUMENT`; the owner performed the exact canary dashboard Commit and provider readback verified empty.

## Unresolved path

1. Railway marker corrupt-SQLite guard and monthly AI operating-cap repair passed exact-head CI. Amazon production sync is fail-closed and its guard passed Product CI. Cost Guard proof now rolls back synthetic spend rather than consuming the owner's budget; Product and Semantic CI passed. Validate the newer OAuth repair and workspace/role isolation on their exact PR head. Production corruption must retain original database bytes even when `NODE_ENV` is missing or misconfigured.
2. Correct Amazon OAuth consent and token exchange under production configuration, and prove owner/workspace isolation; current candidate adds the first repair, isolation is next. The Amazon application ID must be configured separately from LWA client credentials when connecting a real seller account. Implement persisted Amazon US catalog, seller stock/pricing, orders and provider cursor reconciliation. Older generic sync functions invented successful item counts from HTTP status and fixture values; the candidate now refuses unsupported production syncs and withholds go-live credit until durable read-back exists. Amazon's Orders v0 API is deprecated; use current [Amazon Orders API guidance](https://developer-docs.amazon.com/sp-api/docs/orders-api) when building real ingestion.
3. Complete ordinary provider spend control: authenticated approved model/pricing, bounded prompt/output, durable atomic reservation before one call, uncertain-charge retention and independent bill reconciliation. The inactive held-case primitive does not cover ordinary traffic.
4. Establish stopped admission and writers, settled work and final SQL.js save with read-back before touching old production. Restore all actual stores, identities and pending work in isolation; do not infer survival from an old worker respawn.
5. Re-run a fresh bounded canary with exact-source proof after checking actual incremental Railway cost, then integrate/CI/promote with read-back and rollback evidence. The expired operation and markers remain historical only.
6. Prove the authenticated phone owner flow; execute the full Amazon seller/supplier/order/fulfilment/refund/settlement lifecycle in independent test; pass the replacement certification and unattended runtime. Obtain separate owner authorization before any bounded real commercial pilot.

**Evidence boundaries:** Code, CI, hosted recovery, production deployment, independent certification and real reconciled transactions are separate states. Do not assert operational status based on the first two.

## Latest engineering checkpoint

At 02:33 UTC the draft PR head is `52051fa607fce9715e470ba8d00ddb143a91b89e`: Amazon OAuth consent uses `application_id` and `state`, production code and refresh grants send URL-encoded forms, incomplete credentials fail closed, token replies are validated, and offline request contract tests were added to Product CI. Product and Semantic exact-head CI passed; Runtime CI is in progress. No external Amazon account was contacted. A follow-up service/route patch is prepared to bind completion to workspace and founder role, expire states after five minutes, and prevent duplicate exchange. This work does not create seller credentials, import provider data or authorize commerce.
