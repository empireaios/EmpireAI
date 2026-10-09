# Work 5 lease verifier recovery

Owner mandate: Pasted text(20261009-015655).txt, 9 October 2026.
Base: backend release 416be0eab35a99c125825d5e701720a6ee6f6c77,
containing accepted Work 5 backend 6131d0fadbbff072351c5a4ce8edce6865a09c67.

## Correction

The production runtime previously constructed the control plane without its
trusted deployment verifier. The existing owner Finish control now uses trusted
reconciliation when its recorded lease has expired; an unexpired lease retains
the original finish semantics. No new owner endpoint or client attestation is
accepted. Successful reconciliation advances the fence and preserves the lease,
platform evidence, command receipt and immutable event.

The server reads Railway and Vercel directly at fixed HTTPS API origins, with
redirects disabled, a ten-second deadline, bounded responses and bounded complete
pagination. It requires one running Railway deployment matching its own image
revision and deployment ID, the Vercel production alias in the configured project,
and no in-flight deployment in either returned scope. API denial, unknown status,
partial coverage or unavailable credentials deny reconciliation.

The control plane binds evidence to workspace, original owner, lease identity,
fence and current revision. Missing/future/stale timestamps deny reconciliation.
The transaction rereads lease and command state after network verification;
concurrent replay returns the first receipt without overwriting it.

## Configuration and release prerequisites

No credentials are added by this PR. The existing application has neither of
these platform credentials configured:

- ASSURANCE_RAILWAY_PROJECT_TOKEN: Railway project token scoped to the existing
  production environment. API calls in this module are queries only; the token
  itself is not claimed to be read-only if Railway grants it broader capability.
- ASSURANCE_VERCEL_READ_TOKEN: least-privilege deployment read access for the
  existing Vercel project/team.
- ASSURANCE_VERCEL_PROJECT_ID: prj_F4UZtqA8mIpIrRaIu2V6LOM664Kr
- ASSURANCE_VERCEL_TEAM_ID: team_gdcskAnaJteKW7BYtw8zlSWy
- ASSURANCE_VERCEL_PRODUCTION_HOST: empire-ai.co

Use the provider's secure secret configuration; never put token values in a PR,
repository, log or chat. Existing read-only commissioning credentials are not
repurposed. Verifier credentials are not forwarded to independent monitor children.

Live API/schema integration must be verified with authorised credentials before
release. Confirm there are no staged Railway changes or competing releases at
the release gate. This PR does not introduce an emergency bootstrap or waive an
expired lease. The recorded lease still belongs to the same owner and remains
ACTIVE until the supported verifier succeeds. If release policy blocks deploying
the repair under that lease, an established authorised recovery procedure is
required; no undocumented bypass is supplied here.

The current frontend pins the backend SHA in runtime-identity.mjs. A backend
successor therefore requires the corresponding minimal frontend identity update
through its normal gate; do not deploy an unrelated frontend ref.

## Review and verification

Agent security review, not an independent human review: no commerce, Birth,
payment, inference or approval authority changes; no migration/deletion; no
network destination supplied by owner input; no credential in stored evidence;
both pre-network and transactional ownership/fence checks. Platform credentials
are a new privileged dependency and require secure provisioning, least privilege
and revocation after use if temporary. API observations are bounded point-in-time
evidence; external operators must observe the same production change discipline.

Focused tests: 24 verifier/security tests and 15 existing control-plane tests.
Hosted Independent Assurance Core now runs both files. Production integration,
normal hosted gates and independent live readback remain required before claiming
the lease repaired or Work 5 complete.

References: https://docs.railway.com/integrations/api/manage-deployments,
https://docs.railway.com/integrations/api,
https://vercel.com/docs/rest-api/deployments/list-deployments.
