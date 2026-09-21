# Bounded deployment test

This configuration runs the real backend startup, authentication, readiness and
durable request code in **engineering test mode**. It does not certify real model
answers, restore the production database, authorize commerce, or certify Birth.

Before attaching source, create a separate temporary Railway service with a
separate `/data` volume and a separate private Redis service. Do not link either
test service to the production volume, production Redis or production credentials.
`deployment/railway.canary.toml` records the required **Railpack** configuration,
using `railpack.json`'s exact Node `22.23.2` and the reviewed npm `10.9.8` install
contract. Select that exact config file in the disposable service. If the provider
cannot select a non-root config, use a separately reviewed temporary source branch
with a root `railway.toml` byte-identical to the canary reference. That temporary
branch must never be merged into production. Do not edit the normal production
configuration to conduct a test. Dashboard settings can be overridden by a
repository config; the earlier test proved that this can bypass the bounded
launcher. Read back the **effective** builder, build command, start command, restart
policy, health check and resource limits before launching. Save the resolved
source commit and build/runtime receipts. A dashboard edit alone is insufficient.

The build uses Pillow → governance sync → backend with locked `npm ci` installs.
The install guard verifies actual Node/npm, and the launcher independently rejects
any actual runtime other than Node `22.23.2` before filesystem changes or spawning.
The launcher's child uses that same executable. Runtime proof does not infer npm
from `package.json`: keep the actual npm build receipt separately.

Required private service variables:

- `EMPIRE_ENGINEERING_TEST_MODE=true`
- `EMPIRE_CANARY_ACK=DISPOSABLE_NON_COMMERCE_TEST_ONLY`
- `EMPIRE_CANARY_EXPIRES_AT`: one absolute UTC ISO timestamp ending in `Z`, at most
  60 minutes in the future when the application starts. Keep the same value on
  restart or redeploy; an expired value refuses startup. Build time consumes the
  available window. Do not repeatedly extend it under one bounded approval.
- `DATABASE_PATH=/data/canary/<unique-test-name>.sqlite`
- `EMPIRE_CANARY_REDIS_HOST`: the disposable Redis service's exact private
  `<service>.railway.internal` hostname.
- `REDIS_URL`: authenticated URL for that separate Redis service, database 0.
- Distinct generated `FOUNDER_PASSWORD` and `ADMIN_PASSWORD`, each at least 24
  characters; distinct generated `SESSION_SECRET` of at least 32 characters.
- Distinct `FOUNDER_EMAIL` and `ADMIN_EMAIL` under a `.invalid` test domain.
- `PORT` and the precise test `CORS_ORIGIN`, when necessary.

No provider, supplier, seller, payment or cloud account keys are allowed. The
launcher refuses recognizable credential variables, strips unrecognized inherited
variables, refuses a repository `.env`, enforces production startup and the
engineering-mode switch, and fixes each Node process to a 2 GiB heap maximum.
Normal production login credentials are never copied to the test service.

The launcher starts graceful shutdown 20 seconds before expiry and forcibly
terminates the complete POSIX process group by expiry. It also forwards external
TERM to the primary and terminates stray descendants after finite grace.
The primary receives a 15-second shutdown timeout, leaving five seconds inside
the launcher grace. The final receipt preserves the child's exit code, actual
signal when observed and any forced process-group termination. A failed save,
unknown child exit or forced termination produces a nonzero launcher exit even
when the shutdown was requested by expiry or TERM. This bounded timing is not
certification that a large production database completes its save in time.
Railway restart policy is `NEVER`; `/health/ready` remains the admission probe.

Set and read back external provider limits before starting: one replica per
service; application at most 6,000,000,000 bytes RAM and 2 CPU; Redis at most
512 MiB RAM and 1 CPU. Redis must use `maxmemory 268435456`, `maxmemory-policy
noeviction`, `appendonly yes`, and `appendfsync always`, with its own disposable
persisted data volume. The probe reads those four settings and rejects missing or
weaker settings. Configuration proof is not a Redis restart or power-loss test. The launcher
does **not** control Railway build time, volume storage, Redis billing or leaked
provider resources. Record baseline and final usage, and delete the temporary
application service, Redis service and their volumes when the test ends—even if
startup fails. An expired or stopped process is not proof that provider billing
stopped. Keep all work inside the owner's total approved test budget.

Run `node --test deployment/canary-launcher.test.cjs` for configuration rejection,
real child-process TERM/save behavior, forced termination and orphan cleanup.
These local tests are supervision evidence only. Hosted startup, authentication,
readiness, persistence and cleanup require separate actual provider receipts.


## Exact probe and recovery evidence

Use the repository-owned `deployment/canary-runtime-probe.cjs` from the exact
reviewed candidate. Review the candidate's native `.missions.sqlite` migration and
mission-truth fixes first; the probe deliberately rejects the old JSON-only state.
Never upload an older copy or substitute source inspection for runtime assertions.

Before the canary, record the expected full 40-character candidate commit and the
SHA-256 of the reviewed probe from the local verified checkout. Supply these
independently; do not obtain an “expected” hash only by hashing whatever happened
to be deployed. Run only inside the disposable service, against loopback:

```
node deployment/canary-runtime-probe.cjs before SERVICE_UUID EXPECTED_APP_COMMIT_SHA EXPECTED_PROBE_SHA256
```

The probe requires actual Node identity, the launcher's durable receipt and live
child executable, the expected service/commit/deployment, strict Redis and worker
readiness, real generated founder/admin sessions, actual authenticated Birth
locks, actual commerce rejection, native mission history, rejected unauthorized
fake completion, one completed deterministic authority answer, and a truthfully
terminal missing-provider failure with exactly one attempt. The expected failure
must remain a failure; merely retrieving its request ID cannot pass the answer
check. All named mandatory checks must execute and pass. Missing and duplicate
checks fail the phase. No provider credentials or model calls are allowed.

The before marker is `<DATABASE_PATH>.probe-marker.json` and is created once with
fsync. It binds source, probe, service, absolute expiry, launcher identity, both
primary session IDs and independent worker SQL account IDs, mission identity/history and both request results. Failed markers are
preserved and cannot be overwritten to erase a failure. Do not restart after a
failed before phase merely to seek a passing report; inspect the failed evidence.

After a passing before phase, perform one separately authorized orderly redeploy
of the **same exact source commit**, without changing the expiry, accounts, Redis
or volumes, then run:

```
node deployment/canary-runtime-probe.cjs after SERVICE_UUID EXPECTED_APP_COMMIT_SHA EXPECTED_PROBE_SHA256
```

The after phase requires a different deployment and launcher boot, identical
candidate/probe/expiry, the prior passing marker, all previous native history,
unchanged mission and request outcomes, both unchanged identity domains in login and the original worker SQL IDs in
the completed SQL.js disk generation, and all authentication/Birth/guard checks
again. Startup seeding must not be mistaken for persisted accounts. The primary uses
deterministic email-derived IDs, while SQL user IDs are random: the probe separately
authenticates generated test accounts on the observed private worker port to bind
the latter. Primary Birth, commerce, and readiness checks still must pass through
the primary; worker authentication never substitutes for those checks. Preserve raw
JSON and exit status for both phases, provider configuration/build logs, graceful
shutdown receipt and deletion readbacks. Console transport credentials, if a
provider injects them, are forbidden by the launcher validator; never relax the
runtime credential policy. Any separately reviewed probe-only environment cleanup
must remove only the exact observed transport variables without reading values.

A passing pair proves this bounded **application redeploy** scope only. It does
not prove an identical deployed image, abrupt kill recovery, Redis restart,
volume restore, full autonomous execution, V53/Birth or commercial readiness.
Those remain `NOT_PROVEN` and block the overall production/Birth decision. Native
SQLite kill recovery has its own subprocess suite and must also pass on hosted
Node `22.23.2`; it is not substituted for hosted canary receipts.

Run the mandatory local/CI probe-contract checks with:

```
node --test deployment/canary-launcher.test.cjs deployment/canary-runtime-probe.test.cjs scripts/verify-build-runtime.test.mjs
```

These tests use local subprocesses, SQLite files and loopback HTTP fixtures. They
validate the observer's rejection behavior and finite launcher supervision, not
actual hosted readiness. Before spending on another canary, verify the remaining
amount inside the owner's cumulative US$5 backup/deployment-test authorization;
record cumulative usage and cleanup. A new expiry is not a new spending grant.
