# Post-canary proxy and authority-response repair

## Preserved observations

The isolated canary at commit `91fc78eb6ef37ef1e5fdad82e465004baade65e0`
returned primary HTTP 503 for unauthenticated `/pillow-commissioning/birth`
and for a commerce-cycle call blocked in engineering test mode. The durable
request `pcr_50cfefaf04f24116` was accepted and later retrieved across deployment,
but ended `FAILED_FATAL`, `BRAIN_RETRYABLE_FAILURE`, attempt 3. Acceptance and
durable retrieval did not prove a completed reasoning answer.

## Source findings and repair

The generic primary proxy discarded all upstream non-2xx bodies and converted
them into generic proxy failures. It now distinguishes completed HTTP responses
from network/time-out/unavailable-worker failures. Upstream authentication,
permission, conflict, rate-limit and server errors keep their status, body and
end-to-end headers. Redirects are returned without following them with owner
credentials. Cookie headers remain separate; hop-by-hop and stale compression
length headers are excluded. Canonical Pillow chat still uses durable admission,
not the generic forwarding path.

The canary's question, "What is your current authority?", did not match the
existing narrow authority-fact classifier. With no configured model provider,
source falls through to `degraded_no_provider`, which the durable worker rejects
as incomplete and retries. This is a source-supported explanation, not proof of
the exact historical host branch: no upstream response/trace was captured for
that request. A narrow classifier now handles direct authority/permission
questions and emits the existing canonical NOT_BORN/SYNTHETIC/unauthorized facts.
Additional strategy tasks and third-party authority questions keep their normal
reasoning path. No authority state has changed.

The known no-provider branch now emits typed `NO_LLM_PROVIDER`, `retryable:false`.
Only that explicit degraded result becomes `BRAIN_FATAL`; it is retained as
failure after one attempt. Generic degraded/unknown results remain failures under
the existing policy. No degraded message is counted as completed reasoning.

## Local evidence and limits

The proxy/primary/authority/durable-worker suites passed 54 tests, zero skipped.
The real Redis queue suite passed 22 tests, including persisted one-attempt
no-provider failure with no second claim. Backend typecheck passed. Independent
static review found no new permission or false-completion bypass.

The proxy tests use actual local HTTP requests and the actual engineering guard.
Authority tests compose the canonical projection and durable-response validator;
host responses in those tests are supplied fixtures. They are not a fresh
production Pillow completion. No model/provider calls, deployment, spending,
Birth certification or live-commerce action occurred in this repair. Hosted CI
and a later specifically authorized deployment must independently verify the
integrated changes before production completion is claimed.
