# Grand King Authentication — Permanent Closure Report

**Mission:** Production Authentication Permanent Closure  
**Date:** 2026-08-07  
**Repo tip at analysis:** `c5dbe5bb` (then auth durability commit — see §15–17)

## Verdicts

| Gate | Verdict |
|------|---------|
| Authentication | **# GRAND KING AUTHENTICATION NOT CERTIFIED** |
| Executive Operating System | **NOT CERTIFIED** (blocked on authentication + prior Brain availability) |

Production recurrence tests A–G are **blocked** because the production Brain currently does not answer HTTP (timeout / prior 502 class). Durable repairs are implemented and must be redeployed, then proven.

---

## 1. Exact root cause

**Failing stage (first):** Browser → `POST https://empire-ai.co/api/auth/login` (Vercel BFF) → Brain `POST /auth/login` **never completes** because Railway Brain is unresponsive.

Evidence class (probe `LOGIN_REGRESSION_EVIDENCE.json`):

- `GET /health/live` → **502** “Application failed to respond” (earlier) / **timeout 000** (current resume)
- Invalid and valid login both fail the same way (not a credential mismatch when Brain is down)
- UI maps missing `error` on upstream Railway JSON (`message` only) to generic **"Login failed"**

This is **Brain availability / event-loop unresponsiveness**, not a broken bcrypt compare when the process is healthy. Prior HA cert proved login 5/5 when Brain responded.

## 2. Why previous deployment/startup checks failed to detect it

1. Railway healthcheck uses `/health/live` — process can remain “Online” while the edge returns 502 for all routes.
2. Documented `/health/ready` was **missing** (404 historically) — no structural Grand King auth readiness gate.
3. Login UI collapsed all upstream failures into **"Login failed"**, hiding 502 vs 401.
4. One-shot deploy “success” ≠ sustained auth readiness under loop saturation / post-Pillow boot thrash.

## 3. Files changed (this closure pass)

| File | Change |
|------|--------|
| `backend/src/auth/auth-readiness.ts` | **New** — Grand King auth structural readiness |
| `backend/src/app.ts` | `GET /health/ready` (503 when auth blocked) |
| `backend/src/auth/routes.ts` | Email normalize (trim/lowercase) on login |
| `backend/src/runtime/executive-continuity-watchdog.ts` | Stuck sqlite flush guard cannot disable HA forever |
| `backend/src/validation/tests/auth-readiness.test.ts` | **New** unit coverage |
| `backend/src/validation/run-all.ts` | Include auth readiness + password sync tests |
| `backend/package.json` | `test:auth` script; include auth tests in `test` |
| `empireai-web/lib/brain/server-proxy.ts` | Auth path retries on 502/503/504; normalize Railway bodies to `error` |
| `empireai-web/lib/brain/client.ts` | Truthful login messages for 502/503/504 vs 401 |
| `docs/audits/auth/login-regression-probe.mjs` | `/health/ready`, repeated login, env-only credentials |

## 4. Configuration corrections

Reported as presence only (no secret values):

| Item | Status |
|------|--------|
| `DATABASE_PATH` under `/data` (readiness rule) | Enforced in `/health/ready` for production |
| `SESSION_SECRET` non-default (≥32) | Enforced in `/health/ready` for production |
| `REDIS_OPTIONAL=true` in production | Blocked by readiness |
| `FOUNDER_EMAIL` / `FOUNDER_PASSWORD` | Seed sync already idempotent; probe requires env (no hardcoded password) |
| Railway healthcheck path | Remains `/health/live` (avoid flapping); ops/probes use `/health/ready` |
| Vercel `BRAIN_API_URL` | BFF still falls back to production Brain URL on Vercel |

## 5–7. Identity / password / session (structural)

| Check | Result |
|-------|--------|
| Identity source | SQLite `users` via `seedDefaultUsers()` + env password sync (idempotent) |
| Password | bcryptjs compare; env re-hash if drift (`bootstrap-password-sync` test PASS) |
| Session | Redis `empireai_session` HttpOnly/SameSite=Lax/Secure rewrite on BFF |
| Auth readiness unit | **3/3 PASS** locally |

Production identity/password/session **cannot be re-proven** until Brain answers HTTP.

## 8–13. Production tests A–G

| Test | Result |
|------|--------|
| A Fresh login | **BLOCKED** — Brain timeout / prior 502 |
| B Refresh | **BLOCKED** |
| C Logout/login | **BLOCKED** |
| D Brain restart | **BLOCKED** — `railway restart` approval UI timed out / hung (see blockers) |
| E Redeploy | **PENDING** — requires push of this commit |
| F Persistent identity | **BLOCKED** |
| G Repeated login | Probe extended; **BLOCKED** on Brain |

## 14. Regression protection

- `npm run test:auth` (backend)
- `validate` / `run-all` includes auth readiness + password sync
- `node docs/audits/auth/login-regression-probe.mjs` (env credentials; writes `LOGIN_REGRESSION_EVIDENCE.json` + complete-state mirror)

## 15–18. Git / deploy

| Item | Value |
|------|-------|
| Local HEAD (pre-commit baseline) | `c5dbe5bb` |
| origin/main (pre-commit) | `c5dbe5bb` |
| ahead/behind (pre-commit) | **0 / 0** |
| Railway deploy commit | Pending push + deploy of auth durability commit |

## 19. EOS Grand King journey

Not resumed — authentication gate not cleared.

## 20–21. Final verdicts

```
# GRAND KING AUTHENTICATION NOT CERTIFIED
```

```
# EXECUTIVE OPERATING SYSTEM NOT CERTIFIED
```

### Exact blocking step (resume)

1. **Production Brain HTTP unresponsive** (`/health/live` timeout).
2. **`railway restart --service EmpireAI --yes` cannot complete autonomously** — smart-mode approval bubble timed out / prior wait hung with no CLI output.
3. Until Brain is restarted (or redeployed with this commit) and answers `/health/live` + `/health/ready`, production proofs A–G cannot run.

**Required human/operator action:** Approve Railway restart (or redeploy), then re-run `login-regression-probe.mjs` with founder env set.
