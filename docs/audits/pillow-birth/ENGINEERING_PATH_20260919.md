# Autonomous engineering path: evidence and remaining links

Reviewed 19 September 2026 against `empireaios/EmpireAI` main
`21384342c401def948926904913840e63c18dff7` and the GATE-001 work branch.
This is an engineering-delivery audit, **not** Birth, Wave, commerce, production,
or mobile-client certification. No production deployment or settings change was
made during this review. Missing financial values and running costs remain unknown.

## Current answer

Work can inspect and change this repository and execute local offline tests without
the owner operating Cursor. The earlier audit was published as
[draft PR #1](https://github.com/empireaios/EmpireAI/pull/1), demonstrating the
Work-to-GitHub write path. This does **not** establish a complete, unattended
engineering-to-production loop. The links below must each be evidenced rather than
inferred from repository access or a successful historical deployment.

| Link | Evidence and scope | Present disposition / required proof |
| --- | --- | --- |
| Owner in ChatGPT → Work request | The current request authorizes implementation and continuing safe engineering work. The device used is not observable here. | Interactive task handoff established; the specifically mobile approval/report experience remains untested. |
| Work → coding and execution | Local checked-out source can be inspected, patched, and tested. GATE-001 implementation and its actual command output provide the scoped proof. | Available now. A local green test is not remote CI or product certification. |
| Work → GitHub branch / PR | Existing audit draft PR #1 was created through the authorized GitHub connection. Current main is readable. | Repository read/write handoff established; no Cursor relay is required for this work. The new GATE-001 commit/PR must be read back after publishing. |
| GitHub → CI / tests | Before this change: no tracked `.github` workflow; Actions API returned zero runs; current main returned zero check runs. | Missing in baseline. This branch adds least-privilege, offline GATE-001 CI. Only a completed remote run for the exact pushed revision can verify this link. |
| CI → enforced release eligibility | GitHub main is unprotected, required status checks are off, and repository rulesets are empty. Existing provider deployment statuses are not test gates. | Missing. Broader product/build checks, mandatory required checks, and a fail-closed release policy must be established before autonomous production promotion. |
| GitHub → Vercel / Railway | Provider bots reported successful deployments for main `21384342…`; exact IDs and timestamps below. | Historical integration/status path observed. Provider trigger settings, deploy branch/root, wait-for-CI behavior, release authority, and rollback controls are not verified. |
| Production deployment → website / Pillow runtime | Source exposes website and backend revision stamps and a BFF proxy. Fresh reads of the website and backend health URL were inaccessible via the available web tool. | Current serving revision and behavior remain unverified. Tool inaccessibility is not evidence of a production outage. |
| Runtime → durable 24-hour autonomous operations | Existing health code reports an internal HTTP child, not independent queue-worker consumption; no fresh restart/queue/commerce proof was obtained here. | Unverified. Durable queues, worker/scheduler execution, recovery, exception routing and a scoped operating soak still require proof. |
| Ongoing Work repair loop → owner notifications | No durable engineering orchestrator, delivery webhook, production service connection, or autonomous repair-to-release policy has been established by this review. | Missing. A workbook review or an open chat is not an always-running coding/deployment worker. |

## Fresh GitHub observations

Read on 19 September 2026:

- [Main branch](https://api.github.com/repos/empireaios/EmpireAI/branches/main):
  SHA `21384342c401def948926904913840e63c18dff7`; `protected: false`;
  protection disabled; required-check enforcement `off`, no required contexts.
- [Repository rulesets](https://api.github.com/repos/empireaios/EmpireAI/rulesets):
  empty array.
- [Actions runs](https://api.github.com/repos/empireaios/EmpireAI/actions/runs?per_page=10):
  `total_count: 0` before GATE-001 publication.
- [Main check runs](https://api.github.com/repos/empireaios/EmpireAI/commits/21384342c401def948926904913840e63c18dff7/check-runs):
  `total_count: 0`.
- [Main commit statuses](https://api.github.com/repos/empireaios/EmpireAI/commits/21384342c401def948926904913840e63c18dff7/statuses?per_page=20):
  Vercel and Railway reported `pending` at **2026-09-18 15:50:33 UTC**.
  Vercel then reported `success` at **2026-09-18 15:51:11 UTC** for
  [deployment `7rfJqEeCpsojJ2nqF5V6jDevui8R`](https://vercel.com/empireai-os/empireai/7rfJqEeCpsojJ2nqF5V6jDevui8R).
  Railway reported `success` at **2026-09-18 15:54:22 UTC** for
  [deployment `86302878-25b5-4990-87d9-86580cd4e976`](https://railway.com/project/75374474-2b3a-4b0f-a9bc-203cdc1314d8/service/c3c89cbb-3e10-414a-98a2-f9ec4f1f840e?id=86302878-25b5-4990-87d9-86580cd4e976&environmentId=da94aed2-956b-4903-a886-68a5e9a557c8),
  with description `Success - empireai-production.up.railway.app`.

The statuses are provider-reported deployment results, not independent runtime
tests. No inference is made that their deployed revision is still serving now.

The Work-authored audit PR #1 was also read back as open/draft with head
`644afc6685b1b7d5723cc14049e925f9fae78bdd`. Its
[commit status](https://api.github.com/repos/empireaios/EmpireAI/commits/644afc6685b1b7d5723cc14049e925f9fae78bdd/statuses?per_page=10)
records Vercel `pending` at **2026-09-19 12:19:06 UTC** and `success` at
**2026-09-19 12:20:01 UTC** for
[deployment `2ka3Y1Y8toB3dFfVfh5Ct3Z2SoLt`](https://vercel.com/empireai-os/empireai/2ka3Y1Y8toB3dFfVfh5Ct3Z2SoLt).
This is narrower, useful proof that a Work-authored non-main change reached
Vercel's deployment integration without a Cursor relay. The provider's production
versus preview target and served content were not independently read, so it must
not be presented as a verified Work-to-production release.

## Source-level deployment and runtime gaps

1. `railway.toml:5–15` builds Pillow then the backend and starts
   `backend/dist/index.js`; its health probe is `/health/live`. It does not run a
   semantic certification suite or express a dependency on GitHub CI.
   `railway.worker.toml:5–12` is a separate worker recipe, not proof that the worker
   service exists, is configured identically, or consumes jobs.
2. Root `vercel.json:4–12` builds the legacy `frontend/` Vite app, while
   `empireai-web/vercel.json:3–7` builds Next.js and configures the Railway backend.
   `deployment/vercel.md:3–19` still describes the legacy root deployment.
   Identify the actual Vercel project root and production branch before any release;
   the existence of both configs does not resolve the ambiguity.
3. `empireai-web/app/api/eos-bundle-stamp/route.ts:12–37` returns the website commit
   and deployment ID. `backend/src/runtime/tier0-isolated-primary.ts:242–250`
   returns the Railway commit/deployment tuple. Compare both to a reviewed release
   manifest, then test the authenticated website-to-Pillow BFF route rather than
   accepting a provider status alone.
4. `empireai-web/lib/brain/server-proxy.ts:16–37` defaults Vercel requests to the
   production backend; even a localhost setting on Vercel is replaced with the
   production URL. Preview deployments therefore must not be assumed isolated.
   GATE-001 CI does not call the website or Pillow. A future staging fixture must
   explicitly prove isolation before executing chat or commerce tests.
5. `backend/src/runtime/tier0-isolated-primary.ts:196–218` labels its local HTTP
   child as a worker. Its `/health/ready` handler at lines 260–276 returns
   `ready: true` even when `brainWorker.ok` is false. A green HTTP status or that
   ready flag is insufficient for release readiness. Independent Redis/BullMQ,
   scheduler, job completion and durable restart probes are still needed.
6. `backend/scripts/verify-production-deploy.mjs:48–71` accepts HTTP success for
   two health endpoints without candidate/deployment matching, semantic checks,
   or queue-worker proof. Its `PRODUCTION_DEPLOY_VERIFIED` advice at lines 82–85
   is not a substitute for those missing proofs.
7. `backend/scripts/run-full-certification-gate.mjs:13–77` and deploy-invariant
   scripts exist, but no baseline CI invokes them. Prior repository-audit failures
   remain open. The new GATE-001-only job does not hide or repair them.

## Safe CI added by GATE-001

`.github/workflows/gate-001.yml` runs on PRs and pushes to `main` and
`fix/gate-001-*`. It uses Node.js 22, checks runner syntax without execution, and
runs `soak/*.test.mjs` with an explicit empty-test rejection. The job needs only
`contents: read`, does not persist checkout credentials, receives no production
secrets, installs no project dependencies, and makes no Pillow or deployment call.
Third-party actions are pinned to commit SHAs verified against their GitHub tags.
It records the tested checkout/event/PR-head revisions in the job summary. A PR
event tests GitHub's merge revision; the push event tests the branch head directly.

This closes implementation of the narrowly scoped CI job, **not** proof that it
has run. Append the actual run URL, exact head SHA, conclusion and job/test results
after publication. A failed or unavailable run remains a blocker; do not label the
CI link verified based on workflow YAML alone.

## Path to the target operating model

| Work item | Concrete acceptance | Who acts / authority boundary |
| --- | --- | --- |
| PATH-001: remote GATE-001 CI | Exact pushed revision has a completed successful GATE-001 run; failing fixtures are rejected; logs and test scope retained. | Work can publish and inspect the authorized PR path now; no Cursor operation is required. |
| PATH-002: complete engineering checks | Reproducible lockfile installs and builds for Pillow/backend/actual cockpit; unit/integration/semantic/security checks; baseline failures repaired; intentional failing change blocks acceptance. | Work can implement safe code and tests. Production credentials and external effects are excluded. |
| PATH-003: enforce protected promotion | Required checks on main, no direct unreviewed push, scoped merge authority, protected deployment environment and explicit break-glass/rollback rules. | Repository settings are not changed by this task. If no authorized settings tool is available, the owner must approve/provide a supported administrative path once; no repeated Cursor relay. |
| PATH-004: connect controlled deployments | Verify exact Vercel/Railway project/service/root/branch; require checks before promotion; use scoped credentials or configured host integration; retain candidate→build→deploy IDs and rollback target. | GitHub code permission is not proof of production account access or unrestricted release authority. Production mutation requires the configured authority and policy, not credential extraction from unrelated files. |
| PATH-005: deployed runtime verification | Website stamp, backend stamp, deployment IDs and reviewed SHA agree; authenticated synthetic BFF checks succeed; worker/Redis/scheduler, durable retrieval and rollback are proven; all existing commerce locks remain. | Read-only probes may continue through available authorized tools. Live execution/restart testing is not performed by GATE-001 and needs the scoped test/release authority. |
| PATH-006: persistent engineering loop | Durable queued work survives chat closure; CI/deploy events resume the same task; idempotent actions, bounded retries, failure recovery, audit trail, and mobile-readable exception notifications are tested end to end. | Work can design/implement the loop; actually running it needs an authorized persistent execution/event mechanism. The delivery workbook automation alone does not provide one. |
| PATH-007: Pillow Birth and commerce | Accepted independent capability proof and complete Birth prerequisites; then separately authorized small commerce pilot with spending limits, reconciliation and recovery; finally bounded 24-hour operation with escalation. | Engineering deployment must not auto-unlock Birth, Wave credit, accounts, spending or live commerce. Owner approval is reserved for those explicit business/risk decisions. |

The target is **owner-by-exception**, not owner-as-message-relay. Within an active,
authorized task, Work should keep coding, testing and repairing without repeated
permission requests. Across closed conversations or production boundaries, the
continuation mechanism and authority must be explicitly established and tested.
The final handoff must name the next executable work item and its blocker, never
leave the owner with only “no action.”

Until all links pass, the complete autonomous engineering path is **NOT VERIFIED**.
Pillow remains **NOT_BORN**, **WAVE_CREDIT=0**, and **commerce LOCKED**.

## GATE-001 publication checkpoint

Local GATE-001 implementation passed **167 offline tests**. The remote branch was
created at baseline main, but the disclosure safeguard rejected publication of
the appended operational evidence, request IDs and response excerpts. No GATE-001
implementation commit/PR or remote CI result is claimed. Publishing code blobs
alone does not prove a working CI link. Explicit owner approval of that evidence
publication, or a decision for a code-only/sanitized publication, is the immediate
blocking decision. This does not require reconnecting GitHub or relaying to Cursor.

The integration directory was checked rather than assuming a manual workaround:
Railway and Vercel connections are available but **not installed/connected** in
this session. Their connection controls were offered. Connecting them is a
one-time owner account-consent step; it is not proof of production permission,
configured release policy, or a verified deployment. After connection, inspect
the exact service/project permissions and target before any production mutation.
