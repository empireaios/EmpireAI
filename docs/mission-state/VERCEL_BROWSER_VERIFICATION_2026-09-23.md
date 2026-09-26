# Vercel production verification via authenticated browser

Observed 2026-09-23, approximately 10:22-10:26 UTC. Owner authorized browser control and signed in to the in-app browser. Dashboard access is now available; connector OAuth remains a separate unresolved issue and is no longer a blocker to dashboard inspection.

## Production identity

- Team URL: https://vercel.com/empireai-os
- Project: empireai; domain empire-ai.co.
- Current production: https://vercel.com/empireai-os/empireai/7rfJqEeCpsojJ2nqF5V6jDevui8R
- Deployment ID: dpl_7rfJqEeCpsojJ2nqF5V6jDevui8R.
- Ready; source main, full commit link 21384342c401def948926904913840e63c18dff7. Created 2026-09-18 23:51:10 GMT+8; displayed build duration 36 seconds.
- Aliases include empire-ai.co, empireai-git-main-empireai-os.vercel.app, empireai-nlbux3opt-empireai-os.vercel.app. This verifies old-main frontend deployment, not candidate PR5.

## Effective settings and gap

- Root directory empireai-web; include files outside root enabled.
- Production overrides: Next.js, build npm run build, install npm install. Project default framework displayed Other, explicitly overridden by production settings.
- Deployment runtime Node 24.x; project Node setting also 24.x. Candidate CI used Node22.23.2. This runtime mismatch remains an acceptance gap; it is not established as the cause of the observed 503s.
- Fluid Compute enabled, 1 vCPU / 2GB, region iad1. Standard deployment protection, 12-hour skew protection.
- No setting was changed, no deployment/rebuild/promotion was triggered.

## Observed failure

Runtime logs show HTTP503 for POST /api/pillow/session, POST /api/brain/dispatch, GET /api/pillow/founder-shell and GET /api/pillow/commerce-operating-model around 10:09-10:10 UTC. Cockpit pages themselves returned 200, demonstrating that rendered shell pages are insufficient operational proof.

Inspected request: https://vercel.com/empireai-os/empireai/logs?selectedLogId=5jrrm-1790158190896-680c1c848a3e

- Request: POST /api/pillow/session on empire-ai.co, 2026-09-23T10:09:50.896Z, production deployment above.
- Firewall allowed; received sin1, routed iad1; execution 1.59 seconds of 5-minute maximum; total response 1.9 seconds.
- External API row explicitly shows POST empireai-production.up.railway.app/api/pillow/session returning 503 in 1.58 seconds.
- Conclusion: this inspected failure propagates from Railway; not a Vercel function timeout. Exact backend cause requires further evidence. Previously observed backend lag/pending flush is relevant but does not alone prove causality.
- Deployment-specific login requests around 10:21 returned /login 200 and /api/auth/me 401; this does not establish authenticated owner application operation.

## Next

Preserve production pending state. Use repaired-source isolated Railway restart/recovery procedure under newly authorized additional US$5 cap. Establish provider controls for resource limits, private volumes, probe execution, usage accounting and cleanup before creating billable test resources. Do not substitute a healthy Vercel deployment badge for Pillow or commerce readiness.
