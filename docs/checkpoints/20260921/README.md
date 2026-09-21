# EmpireAI engineering recovery checkpoint — 21 September 2026

NOT A RELEASE. DO NOT MERGE THIS CHECKPOINT BRANCH.

This branch stores patches as data so unfinished work survives a session reset. App source remains PR5 cffa6e17; root and canonical web Vercel configurations disable automatic deployments on this checkpoint branch. No pull request is created. The three workflow push filters exclude the checkpoint/ prefix. Railway production remains main 21384342. Never promote this branch or copy its Vercel deployment suppression into the release.

## Exact resume procedure for Work

1. Read manifest.json and the latest canonical EmpireAI_Delivery_Control.xlsx (Library ID libfile_4d7e706c9bd4819197ede2760b2318e4). Read the latest provider/GitHub state; never replace it from this older checkpoint.
2. Start a fresh worktree at published PR5 base cffa6e17a620bebc58f1f18885f0eac1cfd64bae. Apply integrated-reviewed-components.patch. This reconstructs local integrated commit 6a2493d3cd4b6ec3d43a0695c80d5770b62037ae source changes; the combined head has NOT passed hosted CI or a new provider deployment.
3. Separately apply mission-persistence-UNREVIEWED-WIP.patch to the same base in another worktree. It includes tracked and newly created files, but no node_modules, credentials, databases or dependencies. This is unfinished author work. Do not treat it as reviewed or deployable.
4. Re-run independent mission tests FIRST. Earlier review found (a) persisted highRisk missions could execute when a new request omitted highRisk and both approvals were false, and (b) malformed nested reports/transitions/progress could load then crash history. The author began stricter schema/current-approval repairs; the latest corrections have NOT been independently accepted. Preserve the failures. Also verify unknown IDs, corrupted files, disk errors, restart, no automatic side-effect replay and current owner/workspace authority.
5. Integrate mission persistence only after those proofs; retain the integrated HTTP scope restriction to the configured owner organization. Resolve overlaps in session, workflow and engine deliberately. Require all three hosted gates on the actual next published PR5 head; earlier cffa CI is not evidence for these patches.
6. Reconcile the approved US$5 ADDITIONAL TOTAL backup/deployment-test cost before another billable test. Railway aggregate bill rose $22.45 to $22.53 (includes production/delayed billing); test-only and all-provider totals remain UNKNOWN. No recurring allowance, model-provider calls, plan upgrades, purchases or commerce authority.
7. If within authority, re-test only the repaired scoped cases on a frozen source/runtime/probe identity with an absolute expiry and guaranteed cleanup. Verify mission survival, routes, useful authorized response, monotonic watchdog recovery and exact Node/npm version. Then prove a safe old-production quiesce/cutover, phone website path and independent original V53/Birth requirements. No runtime/production/Birth/commerce acceptance yet.

## Completed scoped checks, not integrated acceptance

- Watchdog repair e602d1a32980da03e8a054353e16f3d8513e08d9 (integrated a1cdef1c): 24 focused tests and typecheck, independent review. SIGKILL still cannot preserve unflushed RAM.
- Proxy/authority correction 4f6d3228ed3e688170dc2c04b488dc74a3224eb5 (integrated af4b4be2): 54 focused plus 22 real-Redis checks and typecheck, scoped independent review. Missing-provider result is explicit failure, not useful completion.
- Build pin fixes 55de8124, bd4094af, 6ff7463e (integrated f48533be, f8304be6, 6a2493d3): Node 22.23.2/npm 10.9.8, 5 focused tests and product contract. Install/build assertion only; provider and Vercel runtime parity unproved.
- Owner-organization mission API guard d8c3cbe0: integrated locally, combined validation pending.

## Actual hosted failure and cleanup

PR5 cffa6e17 and temporary PR7 91fc78eb each passed three hosted workflows/ten jobs. Private provider test: 19/22 checks before restart, 17/20 after. File/account persistence passed; mission msr-mission-1789949009856-1 disappeared; Birth/commerce probes returned 503; retained request pcr_50cfefaf04f24116 ended FAILED_FATAL after three attempts. No useful answer completed. Actual executed probe SHA256 59583b3adce8c01637a9e9505a04131cf995d2ec504b5bd030e206bdc3293b4d differed from intended latest script; no authenticated Birth assertion was executed. Build changed from Node24/Nixpacks to Node20/Railpack. These failures must not be overwritten.

All temporary canary/Redis/volume resources were deleted before 00:20 UTC; PR7 closed unmerged 00:19:07. Native manual backup was deleted after nine private restore archives were saved. Separate persisted SQLite and portable Redis restores passed; no coordinated application recovery or pending-RAM capture proved. Original production unchanged.

Original production has a conditional commissioning flush route, but it deletes temporary/corrupt-marked files, mutates the record/audit and returns after a fixed delay; it does not quiesce all producers or acknowledge final fsync. Do not treat HTTP200 as zero-data-loss cutover proof.

Vercel connector still returns no teams/403 and browser requires login. Plugin is installed. No secure sign-in handoff has been initiated. Once Work can continue, request only a precise account/team access step if still needed; do not require Cursor or a generic reconnection loop.

Work stopped because workers hit the usage limit. Owner approval is NOT the cause and the existing US$5 scoped approval remains valid. No unattended engineering progress is promised while execution is stopped. Pillow NOT_BORN; original Wave1 0/24; commerce LOCKED; no accepted useful 24/72h shift or real order/revenue/profit.
