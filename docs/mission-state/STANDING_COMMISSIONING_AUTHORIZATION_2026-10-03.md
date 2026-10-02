# Standing commissioning authorization

Owner instruction: Pasted text(8).txt, received 3 October 2026 Singapore time. This records the bounded authorization; it does not override platform approvals.

Authorized: routine GitHub/CI engineering, Railway/Vercel deployment and verification, rollback to verified revisions, health/readiness and read-only accounting/preservation checks, isolated non-destructive Assurance probes, controlled restart/recovery, deterministic repair, safe read-only provider verification. Commissioning inference remains capped at US$40 total; reconcile the ledger before any inference. Do not repeat Gemini, closed reasoning certification, or the successful live discrepancy injection.

Excluded: Birth, commerce unlock, purchases, real orders, consequential marketplace mutations, autonomous commercial spending, expanded Pillow commercial authority, destructive production-data deletion, unnecessary credential rotation, materially increased costs.

## Supported least-privilege candidate

The candidate exposes only GET `/api/commissioning/read-only/assurance` and GET `/api/commissioning/read-only/accounting`. A distinct `x-empire-commissioning-token` is validated against `COMMISSIONING_OPERATOR_TOKEN_SHA256`, with a fixed epoch-millisecond `COMMISSIONING_OPERATOR_EXPIRES_AT` no more than seven days ahead. Generate at least 32 random bytes and encode as base64url using an approved private operator mechanism. Store only its SHA-256 in Railway; never commit the credential. Removal of the hash or expiry revokes the capability. Unconfigured, malformed, expired or out-of-profile access fails closed.

The token cannot create a session, impersonate the founder, call inference, retrieve provider secrets, inject discrepancies, restart a service, deploy, or mutate business state. Infrastructure operations retain their existing platform authentication and approval boundaries. Authorization decisions produce structured application log events containing only request ID, fixed scope and decision. These are operational logs, not a claim of a new durable accounting ledger.

Assurance reads use a read-only SQLite connection. Only the independent inspector reconciles findings. Stale watchdog/cycle status is computed on read, even if the observer is dead; reads cannot manufacture observer evidence.

Status: implementation candidate, disabled until privately provisioned and deployed through green CI. No credential has been created or rotated. Full preservation export and restart controls are not granted by this token.

## Continuation observation

The existing production owner session at empire-ai.co was reusable. The UI reported backend cd32c7f50aa1d5e7bbef0d15d4b805aadf2d31cb, NOT_BORN / LOCKED, and non-operational transport readiness. Assurance displayed overall DEGRADED, 4/13 internal checks passing, 67 unreconciled invoice records, and US$22.355288 remaining.

The existing isolated-demonstration:4 finding was visible as HIGH / RESOLVED: detected 2026-10-02T21:31:36Z and resolved 2026-10-02T21:33:06Z (the browser displayed UTC-7). Its historical entry and HEALTHY → DEGRADED → HEALTHY observations remained visible. No discrepancy was injected in this continuation. This is owner-visible recovery evidence, not a new production restart/preservation proof.

Production was not modified. The current environment has no Railway CLI authentication/configuration, and the connected Railway OAuth tool returns variable names only (`valuesRedacted=true`). The owner browser session supports UI reads, but does not supply a supported private execution/preservation channel. Do not claim a production restart, full preservation comparison, phone verification, provider integration, or complete Assurance closure from these observations.
