# GATE-001 implementation and verification boundary

Date: 19 September 2026. Baseline main/evidence seal:
`21384342c401def948926904913840e63c18dff7`.

Status: implemented and locally regression-tested. The owner explicitly approved
publication of the historical audit evidence to `empireaios/EmpireAI`. This update
adds the implementation and workflow to draft PR #2; the earlier PR head
`e9456cbc7172cc01fedfb050927b46ed82e6fbac` contained only two reports. Remote CI
must still be inspected for the resulting implementation revision. This is a harness correction, not a new passing
Pillow soak, independent certification, Birth authorization, or commerce unlock.
No production call, restart, deployment, merge or live commerce action was made
by these tests.

## Acceptance mapping

| GATE-001 requirement | Implementation / executable evidence |
| --- | --- |
| Failed capability checks block readiness | `soak-gate.mjs` requires zero semantic failures across ordinary, mission and fill rows; nonempty transport results cannot substitute. Tests reject the 181-row / 17-failure pattern. |
| Every required mission step passes | Versioned manifest requires 24 ordinary cases and all nine mission steps, correct order and one original session per mission. No late aliases or attempted-loop credit. |
| Complete evidence | Scrubbed full prompts, submission responses, terminal GET responses, SHA-256 hashes, versioned oracle IDs/results, result kinds, full candidate/runner SHA, observed deployment tuple. |
| Scoped proof rather than self-reported flags | Full prompt bound to expected manifest; response/proof hashes recomputed; actual returned request/session/deployment IDs checked against admission and frozen tuple. |
| Duplicate-safe execution | An fsynced, chained, single-writer journal reserves each logical case before POST. POST never automatically retries. Ambiguous admission or disk failure stops execution for reconciliation. Different request IDs do not excuse duplicate logical cases. |
| Preserve history and refresh failure accounting | Original `SOAK_RESULTS.json` remains byte-identical. Five original ledger entries remain verbatim. A linked, reproducible historical regrade and all 17 reported failure fixtures are appended. |
| Unique failures covered locally | Every reported failed row has a regression fixture; these prove rejection/accounting, not that the product defect is repaired. Workload tests cover exact answers, eligible sets, selections, state and lock assertions. |
| Restart and reconnect evidence | Actual completed GET response must match the original request/session/deployment and full response hash. Restart also needs observed process/worker lifecycle change. New-session retrieval is explicitly not browser UI certification. |
| No accidental live execution | Import is side-effect-free. Explicit live/restart opt-ins, credentials, URLs, candidate/deployment, project/service/environment and clean checkout are required. Runtime output uses new private, ignored run directories; old evidence is never overwritten. |

## Reproducible offline checks

From repository root, Node.js 22:

```sh
node --check docs/audits/capability-extraction/EXEC_CAP_CLOSURE_20260917/CLOSURE_PASS_2/soak/soak-runner.mjs
node --test docs/audits/capability-extraction/EXEC_CAP_CLOSURE_20260917/CLOSURE_PASS_2/soak/*.test.mjs
git diff --check
```

Local result after implementation and review: **167 tests passed, 0 failed**.
An independent review found and drove fixes for prompt substitution, incomplete
restart proofs, retrieval provenance, and unsupported external-effect counters.
The suite has no dependency install, production secret or external-service need.
The PowerShell wrapper is source-inspected here; it has not been executed on
Windows. A hosted CI result must name its tested SHA and actual run/job URL.

### Publication history and resolved decision

The branch `fix/gate-001-semantic-soak-20260919` was created at the original main
baseline. Uploads of the historical failure fixture, appended failure ledger and
historical regrade were rejected by the publication safeguard because they include
internal request identifiers, response excerpts and operational findings. That
rejection is retained as history. No alternate upload route or permission bypass
was attempted. The owner subsequently explicitly approved publishing this audit
evidence. Some earlier code blobs were accepted, but isolated blobs were not a
published implementation, a CI run or a release.

No repeat owner approval or Cursor relay is required for the approved publication.
The current change publishes the scoped harness, fixtures, appended failure
accounting and offline CI workflow to the existing draft PR. Read-back of the
branch and inspection of actual remote CI execution/logs are required before
claiming publication or CI verification. Production promotion is outside this change.

## Historical outcome remains nonqualifying

The preserved source hash is
`6141a7b91ab5932f4e22c5613ef3a95c002d7c8db800c4f342c2c8236bfbd45f`.
It reports 181 admissions, 35 substantive checks, 18 passes and 17 failures.
Three logical IDs were duplicated under new request IDs. Its reported transport
PASS is retained, but capability qualification is rejected and incomplete
`textHead` evidence is not promoted to complete independent evidence.

The v2 workload also fixes an ambiguous M3 output specification and requires all
facts requested by the original lock/mode prompts. Old fill heads containing only
`NOT_BORN` do not demonstrate `SYNTHETIC` mode. No response tail is invented and no
historical pass is retroactively independently certified.

## Explicit measurement limits

- `unsafeResponseClaims` and `contradictoryResponseClaims` are lexical response
  checks, not seller-account or external-effect telemetry. External commerce
  effects are **NOT_OBSERVED**, not asserted zero.
- `reportedSafetyBoundariesUnchanged` checks the health report only. The current
  shadow-CEO endpoint returns hardcoded lock values; authoritative Birth/state
  unification remains BIRTH-001 work.
- The gate compares recorded results consistently; it is not cryptographic remote
  attestation or independent product certification.
- Real queue consumption, scheduler recovery, account/supplier integration,
  live ordering and 24-hour commercial operation remain unverified.
- A qualifying new live soak must not run until product semantic regressions and
  release/test authority are resolved. Passing harness fixtures alone is not that
  resolution. If a live run does begin, failed required semantics stop it before
  the long fill/restart phase.

## Future execution preflight (not performed here)

Configure explicitly: `EMPIRE_COCKPIT_URL`, `EMPIRE_BRAIN_URL`,
`EMPIRE_LOGIN_EMAIL`, `EMPIRE_LOGIN_PASSWORD`, full `SOAK_TIP_SHA`,
`SOAK_DEPLOYMENT_ID`, `SOAK_RAILWAY_PROJECT_ID`, `SOAK_RAILWAY_SERVICE`, and
`SOAK_RAILWAY_ENVIRONMENT`. Service/environment names must match the live health
report. Do not put credentials into the evidence or commit them.

The installed Railway CLI must expose explicit service/environment restart
targeting; `railway status --json` must identify the configured project. An
unsupported CLI or mismatched linked project aborts before chat submission.
The CLI is not installed/configured by this work. Railway documents restart as
reusing the existing deployment image, and status as a read of linked project
context: [restart](https://docs.railway.com/cli/restart),
[status](https://docs.railway.com/cli/status),
[targeting options](https://docs.railway.com/cli/global-options).

Only an authorized live test may set both `SOAK_ALLOW_LIVE_RUN=1` and
`SOAK_ALLOW_RESTART=1`, or use the wrapper's two explicit switches. Every run is
separate; a crash leaves its journal reserved. Reconcile unknown admissions and
retain the evidence rather than deleting its lock and replaying work.

## Next closure work

1. Prove remote GATE-001 CI on this exact branch; keep its scope narrow.
2. PATH-002: bring actual product/build/certification checks into CI and repair
   their known failures, without hiding them behind harness-only green checks.
3. BIRTH-001: unify authoritative Birth state and make authorization fail closed;
   CAP-001: repair the retained arithmetic/ranking/state failures.
4. PATH-003/004/005: enforce checked promotion, verify provider target/root,
   configure scoped release authority, and prove deployed website/BFF/runtime
   identity and behavior. No current claim of autonomous production delivery.
5. RUNTIME-001, COMMERCE-SPINE-001, CERT-001 and the separately authorized capped
   pilot remain required before a 24-hour commercial operation claim.

See `ENGINEERING_PATH_20260919.md` for per-link proof and missing authority.
Unchanged: **NOT_BORN; WAVE_CREDIT=0; commerce LOCKED**.
