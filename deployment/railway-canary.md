# Bounded deployment test

This configuration runs the real backend startup, authentication, readiness and
durable request code in **engineering test mode**. It does not certify real model
answers, restore the production database, authorize commerce, or certify Birth.

Before attaching source, create a separate temporary Railway service with a
separate `/data` volume and a separate private Redis service. Do not link either
test service to the production volume, production Redis or production credentials.
`deployment/railway.canary.toml` records the required settings. The current Railway
UI does not permit new services to opt into config-as-code. Apply the build command,
start command, health path, health timeout and `NEVER` restart policy through the
provider API/UI, then read back the effective service configuration before attaching
source. Do not assume the reference TOML activates itself. The build uses the same
Pillow → governance sync → backend path with locked `npm ci` installs.

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

Set external provider limits before starting: one replica, no more than 8 GB RAM
and 2 CPU for the application, and a suitably smaller Redis limit. The launcher
does **not** control Railway build time, volume storage, Redis billing or leaked
provider resources. Record baseline and final usage, and delete the temporary
application service, Redis service and their volumes when the test ends—even if
startup fails. An expired or stopped process is not proof that provider billing
stopped. Keep all work inside the owner's total approved test budget.

Run `node --test deployment/canary-launcher.test.cjs` for configuration rejection,
real child-process TERM/save behavior, forced termination and orphan cleanup.
These local tests are supervision evidence only. Hosted startup, authentication,
readiness, persistence and cleanup require separate actual provider receipts.
