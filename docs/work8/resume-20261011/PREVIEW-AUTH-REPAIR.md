# Work8 preview authentication investigation — 2026-10-11

No configuration mutation or redeployment performed. Root cause remains unproven.

Exact failing deployment dpl_5pqq4iWaDrQ3CCaQcREX9hgDC6kV is READY, frontend branch work8/owner-operating-evidence-20261011 at bc83ca6a63ae8f0eb32fa3cb475b1125f6e3ddce, URL https://empireai-kr8ccjwgk-empireai-os.vercel.app. This is not the evidence branch.

Vercel inventory confirms BRAIN_API_URL entries for production, general preview and Work7 branch; none for Work8. All three stored values are sensitive and withheld (decrypted=false), including individual get calls. No values or credentials were extracted. Existing Work7 accepted requirement96 documents the same old404 to backend401 repair and authenticated Home, using the authoritative locked runtime domain. This supports but does not establish current root cause.

Source /api/auth/login proxies to configured BRAIN_API_URL/auth/login. /api/auth/me proxies to the same origin/auth/me. No separate application identity is supplied by these routes. No current credentials were submitted.

One bounded unauthenticated HTTP comparison: both Work7 and Work8 /api/auth/me redirected to Vercel sign-in, so these responses do not test the application upstream. Direct locked-runtime /auth/me returned401 with Authentication required; Railway request ID nyCGk9v1Rl-EJ7NKCYBc-A. Scoped Vercel auth runtime search returned no logs. Absence of console logs is not proof of absent requests.

Automatic approval review rejected the connector fetch because it may create an authentication-bypass link, an access change not authorized in the current scope. No bypass created. Non-bypass HTTP checks respected the sign-in protection. Cloud Browser navigation failed while prior credential protection was active and requested manual handoff; no further automated credential attempts made.

Next required capability: owner authorization for a temporary Vercel protected-preview fetch limited to read-only /api/auth/me on these two previews, or restored manual Cloud Browser control permitting the equivalent authenticated read. Only after confirming routing may a Work8-only BRAIN_API_URL override and exact bc83ca6a preview rebuild proceed. Preserve production/global preview/Work7 bindings and all live restrictions.

Owner resource amendment: Keepa preferred subject to plan/licence/purchase approval; Helium10 disabled future interface, subscription deferred; JungleScout excluded. This supersedes the earlier comparative resource recommendation. No paid API usage or purchases authorized.

## Authorized diagnostic and branch repair, 2026-10-11 05:20 UTC

Owner explicitly authorized temporary deployment-specific protection bypass for read-only routing checks. Created60-second links for the exact Work7/Work8 deployments; each was revoked with regenerate=false after its check. No EmpireAI authentication bypass, password submission or artificial owner session occurred. No token or access link is included in this evidence.

Work8 GET /api/auth/me returned404 JSON with status:error, code:404, message/error:Application not found, upstream request_id q95QsT0JT12sdjZo9I3ezw, matched path /api/auth/me. This reproduces the application-routing error without credentials. Work7 protected fetch returned401 at fetch_deployment/after_redirect, with content withheld; do not count that as a fresh application-authentication success. Previously accepted Work7 evidence and direct locked-runtime401 remain separate evidence. The inherited destination value remains hidden, so its exact incorrect hostname is not asserted.

Created only Work8 branch-specific preview BRAIN_API_URL entry SHUu2A0cbG8zgMFq, using the verified authoritative locked-runtime origin and documented Work7 pattern. Readback confirms preview-only target and exact work8/owner-operating-evidence-20261011 scope. Production, general preview and Work7 entry IDs/update times unchanged. No credential copied.

The new configuration has NOT been deployed: latest owner authorization explicitly excludes deployment. Required next action is one preview-only rebuild of the existing frontend bc83ca6a63ae8f0eb32fa3cb475b1125f6e3ddce, preserving branch configuration, followed by non-credential authentication reachability verification and only then owner sign-in. No claim that the existing immutable deployment is fixed. Work8 backend candidate remains undeployed; production locked-runtime does not contain the new Work8 backend changes, so restored sign-in alone cannot certify the integrated Work8 dry run.

## Single approved rebuild completed
Deployment dpl_kUh9svgitsyGCLDGjttpFZaDfMFr is READY at exact bc83ca6a63ae8f0eb32fa3cb475b1125f6e3ddce, target staging (Vercel preview API), URL https://empireai-sf19z4q3a-empireai-os.vercel.app. One initial validation rejection created no deployment; corrected request created this one rebuild. No second rebuild. No new bypass. Browser navigation to /api/auth/me is blocked by retained credential protection and requires manual handoff; effective routing success not yet asserted.
