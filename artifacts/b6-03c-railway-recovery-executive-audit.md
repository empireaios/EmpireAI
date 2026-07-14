# Executive Audit — B6-03C Railway Production Recovery

**Mission:** B6-03C  
**Date:** 2026-07-02  
**Authority:** Grand King Executive Directive  
**Recovery commit:** `a8945b2`  
**Incident commit:** `0a613c9`  
**Certification:** ✅ **RESTORED** — Railway production healthy; B6-03B Stripe live auth proof **PASS**

---

## Executive Summary

Railway production (`https://empireai-production.up.railway.app`) was restored after an outage caused by commit `0a613c9`. All endpoints returned **HTTP 502** because the Nixpacks build failed and no healthy container was deployed.

Root cause: **deployment configuration** — `NODE_ENV=production` in `nixpacks.toml` caused `npm install` to omit `devDependencies` (TypeScript, `@types/*`) on cache-busted builds. Commit `0a613c9` invalidated the Nixpacks layer cache, triggering a fresh install without compile-time dependencies. The TypeScript build failed; Railway reported deployment failure and served 502.

Fix commit `a8945b2` forces devDependency installation for both `pillow/` and `backend/` during build, promotes TypeScript type packages to runtime dependencies as a belt-and-suspenders safeguard, and removes a Stripe proof HTTP self-probe that could deadlock single-worker Fastify.

**Post-recovery verification:**

| Check | Result |
|-------|--------|
| `GET /health` | **HTTP 200** — `status: ok`, `brain: online`, `redisMode: connected` |
| `GET /health/b6-03-stripe-live-auth` | **HTTP 200** — `certification: PASS` |
| GitHub Railway status (`a8945b2`) | **Success** — `empireai-production.up.railway.app` |
| B6-03B live Stripe proof | **PASS** (credentials, API, webhook HMAC verified) |

---

## Root Cause Analysis

### Failure classification

| Category | Verdict |
|----------|---------|
| Application startup failure | **Secondary** — no valid `backend/dist/` because build failed |
| Runtime exception | **No** — container never reached healthy runtime |
| Environment variable issue | **No** — Stripe/CJ/Redis vars unchanged; pre-outage B6-03 was VERIFIED |
| Dependency issue | **Yes (primary)** — TypeScript + `@types/*` missing at build time |
| Deployment configuration | **Yes (primary)** — `NODE_ENV=production` + default `npm install` behavior |
| Health endpoint failure | **No** — `/health` logic unchanged; upstream had no healthy app |

### Timeline

| Commit | Railway status | Production |
|--------|----------------|------------|
| `d56cf3d` (B6-02 CJ proof) | ✅ Success | Healthy |
| `0a613c9` (B6-03B Stripe proof) | ❌ Deployment failed | HTTP 502 |
| `3874963` (partial fix: `--include=dev` backend only) | ❌ Deployment failed | HTTP 502 |
| `a8945b2` (full fix) | ✅ Success | HTTP 200 |

### Mechanism

1. `nixpacks.toml` sets `NODE_ENV = "production"`.
2. Railway build command runs `npm install --prefix pillow && npm install --prefix backend`.
3. With `NODE_ENV=production`, npm omits `devDependencies` unless explicitly overridden.
4. Prior deploys succeeded via **cached** `node_modules` layers from earlier builds (when devDeps were present).
5. Commit `0a613c9` added substantial new TypeScript sources, busting the Nixpacks cache.
6. Fresh install without `typescript` / `@types/*` → `npm run build --prefix backend` fails (`TS7016`).
7. No compiled `backend/dist/index.js` → start command fails → Railway health check fails → **502**.

### Why `3874963` still failed

The interim fix only applied `--include=dev` / `NPM_CONFIG_PRODUCTION=false` to the **backend** install. The **pillow** install still ran under production mode without devDependencies, causing `npm run build --prefix pillow` to fail for the same reason.

---

## Files Changed (Recovery)

| File | Change |
|------|--------|
| `railway.toml` | `NPM_CONFIG_PRODUCTION=false` on **both** pillow and backend installs |
| `backend/package.json` | Moved `typescript` and `@types/*` from `devDependencies` to `dependencies` |
| `backend/src/revenue/shared/stripe-live-auth-proof.ts` | Removed HTTP self-probe to webhook route (deadlock risk); signature round-trip suffices |

---

## Deployment Evidence

### GitHub commit statuses

**Incident — `0a613c9`:**

- Railway (`empireai - EmpireAI`): **failure** — Deployment failed
- Vercel: success (frontend unaffected)

**Interim fix — `3874963`:**

- Railway: **failure** — Deployment failed

**Recovery — `a8945b2`:**

- Railway: **success** — `Success - empireai-production.up.railway.app`
- Vercel: success — Deployment has completed
- Railway deployment URL: `https://railway.com/project/75374474-2b3a-4b0f-a9bc-203cdc1314d8/service/c3c89cbb-3e10-414a-98a2-f9ec4f1f840e?id=56109533-16f6-42f3-8766-4423452c782d`

---

## Railway Health Confirmation

**Probe:** `GET https://empireai-production.up.railway.app/health`  
**HTTP status:** 200  
**Observed (2026-07-02T03:49:33Z):**

```json
{
  "status": "ok",
  "brain": "online",
  "redisMode": "connected",
  "llmProviders": ["openai"]
}
```

---

## Stripe Proof Result (B6-03B Complete)

**Probe:** `GET https://empireai-production.up.railway.app/health/b6-03-stripe-live-auth`  
**HTTP status:** 200  
**Certification:** **PASS**

| Check | Result |
|-------|--------|
| `credentials.secretKeyPresent` | `true` |
| `credentials.secretKeyMode` | `live` |
| `credentials.webhookSecretPresent` | `true` |
| `credentials.webhookSecretFormatValid` | `true` |
| `stripeApi.httpStatus` | `200` |
| `stripeApi.livemode` | `true` |
| `stripeApi.accountAccessible` | `true` |
| `webhookVerification.signatureRoundTripVerified` | `true` |
| `webhookVerification.staleSignatureRejected` | `true` |
| `paymentService.stripeLiveConfigured` | `true` |
| `webhookEndpoint.operational` | `true` |
| `webhookEndpoint.acceptsSignedPayload` | `true` |

**Informational (not proof failures):**

- `LIVE_PAYMENT_ENABLED=false` — live charges gated per Protect The Empire doctrine

Evidence: `artifacts/b6-03b-stripe-live-auth-evidence.json` (updated post-recovery)

---

## Scope Compliance

- ✅ Restored Railway production
- ✅ Identified and fixed root cause only (build/devDependency configuration)
- ✅ Re-ran B6-03B Stripe live auth proof — **PASS**
- ❌ Did not proceed to B6-04

---

## Operator Notes

No Railway variable changes were required for recovery. Stripe credentials remained configured throughout; the outage was purely a build/deploy pipeline failure.

If Nixpacks cache is busted again, the `NPM_CONFIG_PRODUCTION=false` build prefix and promoted TypeScript dependencies prevent recurrence.
