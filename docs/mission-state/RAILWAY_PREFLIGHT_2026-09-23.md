# Railway browser preflight

On 2026-09-23 the in-app browser reused GitHub sign-in and successfully authenticated to Railway. The owner does not need to perform another manual login at this checkpoint. Both Vercel and Railway tabs were marked for handoff.

## Billing baseline

Workspace usage page, Sep 6–Oct 6 cycle, before creating any new test resources:

- Current usage US$26.39; project empireai US$26.30; agent US$0.09.
- Memory US$19.0724, CPU US$7.0943, egress US$0.0397, volume US$0.0942, backup US$0.0001.
- Displayed memory rate $0.000231/GB/min; CPU $0.000463/vCPU/min; egress $0.05/GB; volume $0.000003/GB/min.
- These are account/project cumulative figures, not prior canary-only charges. Production continues accumulating costs, so aggregate changes must not be attributed entirely to a test.
- Owner authorized additional US$5 for isolated restart/recovery testing. No new billable service was created at this preflight checkpoint.

## Console availability and readiness failure

Provider Console is available and connected for existing service; supports terminal input. Only one read-only local readiness request was executed in production. No restart, signal, config mutation or database modification was requested.

Observed command: Node fetch of http://127.0.0.1:$PORT/health/ready with a ten-second timeout. Terminal result:

```json
{"httpStatus":200,"ready":true,"brain":"tier0_only","process":"running","tier0Isolation":true,"workerOnline":false,"sessionStore":"redis","checks":{"tier0Primary":{"ok":true},"redis":{"ok":true},"brainWorker":{"ok":false}}}
```

HTTP status is transcribed from the console's response prefix; remaining fields are its JSON body. This directly shows that old production readiness can pass while the worker check fails. It does not establish that the worker process is dead rather than slow/unresponsive. Vercel separately returned actual upstream 503 for session creation.

Filtered provider logs record recurring Brain child exits/respawns between Sep 19 and Sep 23, latest in returned results: exit 03:41:02 UTC, spawn 03:41:08 UTC on Sep 23. Do not infer latest complete process state solely from filtered history.

## Candidate preparation

Created isolated worktree at C:/Users/erlan/AppData/Local/Temp/empireai-canary-20260923, branch codex/bounded-canary-20260923, starting from verified PR5 head 972dbfc2dd34c62388c83db06c311d9d74813969. Original dirty main untouched. Candidate configuration preparation/verification is in progress; no new candidate commit, push, PR, CI proof or hosted run may be claimed until its actual result is recorded.

The source changes are bounded root railway.toml copied exactly from deployment/railway.canary.toml plus automatic Vercel preview suppression for this exact temporary branch in both config locations. All application source is unchanged. This temporary source must not be merged into production.

## Published test source

PR https://github.com/empireaios/EmpireAI/pull/8, draft DO NOT MERGE. Exact head ed663f193048e25375c86d941fbb9832c9013c37. Repository contract and 5/5 build-runtime tests passed locally. Hosted runs Product35850279634, Semantic35850279584, Runtime35850279641 all completed successfully. Main and PR5 unchanged.

## Isolated test resources: latest checkpoint

Created empty private test project `feb90d26-c54b-4435-ac32-f666e3e25447` named `empireai-canary-20260923`, workspace `a4962933-0870-4df7-bb46-3625ed800be1`. Its default environment is named production but is ONLY the isolated test environment: `3b0664a3-8655-4fc1-b9cf-113034a81e0a`.

- Application `recovery-canary`: `3687e91f-2a12-477e-8fc1-79ad0e559d3c`.
- Redis `recovery-redis`: `d76003c0-d65f-446c-90d1-7caa1de5164c`.
- Neither service has source, variables, volumes or a deployment yet. No compute running.
- App next-deploy settings: bounded launcher, NEVER restart, /health/ready with 300-second timeout.
- Verified staging details: app 2 vCPU / 6 GB; Redis 1 vCPU / 500 MB. Four resource-limit changes staged, not deployed. Merely setting slider values does not save them; actual keyboard change and confirmation staged the values.
- Remaining: isolated volumes, private Redis configuration and fresh test credentials, fixed expiry, exact source branch, effective configuration readback, launch/probes/cleanup. Do not start until these are complete. Do not touch actual production.

Use hashes of committed Git blob bytes (Linux checkout), not Windows working-tree CRLF bytes:

- Probe deployment/canary-runtime-probe.cjs: e518ec44b4bf8ccdd78ae7331ef5d5883e703db08df1d87046ad0d8f34104e25.
- railway.toml and deployment/railway.canary.toml: both 336ded0f1882af7aab7517208f2f511e0161ca9cc1deaafd2e6c1ed840ec36ca.
- Earlier local-file hashes 066a15... / 71b550... are Windows checkout hashes, not valid expected provider-file identities. Corrected before any canary launch.

Sandboxed commands with the temporary worktree as cwd did not return; their orchestration calls were terminated. Explicitly approved outside-sandbox preparation and checks succeeded. No production restart or new billable resource created.
