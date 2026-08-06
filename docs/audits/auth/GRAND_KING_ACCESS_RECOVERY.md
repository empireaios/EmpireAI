# Grand King Access Recovery — Authentication Certification

> **Mission:** Grand King Access Recovery & Permanent Login Certification  
> **Date:** 2026-07-23  
> **Production frontend:** `https://empireai-five.vercel.app`  
> **Production Brain:** `https://empireai-production.up.railway.app`

## Root cause (confirmed with live probes)

1. **Primary — Brain event-loop starvation from sql.js full-DB persist thrash**
   - Live `/health/live` reported `eventLoopLagMs ≈ 34456` and `lastFlushDurationMs ≈ 1383786`.
   - Vercel BFF `/api/auth/login` and `/api/auth/me` returned **HTTP 504** after 20s:
     `Brain API timed out after 20000ms`.
   - Middleware still redirected `/cockpit` → `/login` (307) — UI gate worked; **auth API did not**.
   - Cause: `EmpireDatabase` exported the entire in-memory sql.js database on a tight debounce (250ms) and recursively re-flushed under write load, blocking the Node event loop so login could not complete within the BFF timeout.

2. **Secondary — bootstrap password drift soft-lock**
   - `seedDefaultUsers()` previously skipped existing users forever.
   - If `FOUNDER_PASSWORD` env changed after first seed (or DB restored from an older volume), login would fail with valid env credentials and never self-heal.

3. **Secondary — BFF Set-Cookie forwarding fragility**
   - Proxy used `headers.get("set-cookie")` instead of `getSetCookie()`.
   - Upstream `Domain=` (if present) would bind the cookie to Railway, not Vercel.

## Fixes implemented

| Fix | File |
|-----|------|
| Persist coalesce, 5s debounce, 15s min interval, yield before export, atomic temp+rename | `backend/src/brain/sqlite-database.ts` |
| Sync founder/admin password hashes from env when mismatched | `backend/src/auth/seed-users.ts` |
| `UserStore.updatePasswordHash` | `backend/src/auth/session-store.ts` |
| Auth upstream timeout 55s; `getSetCookie` + `rewriteSetCookieForBff` | `empireai-web/lib/brain/server-proxy.ts` |

## Why prior deployments missed it

- G4-05B intentionally **skipped production valid login** (local seed only).
- Health endpoint can still return 200 while lag is catastrophic.
- Auth failures appeared as generic 504s / “Login failed”, not as SQLite metrics.

## Certification status

- **Code fixes:** implemented in repository.
- **Local auth regression:**
  - `auth-verification.test.ts` — login / cookie / logout **PASS** (3/3 auth path)
  - Executive Home dispatch 404 in that suite is unrelated (pillow disabled in harness)
  - `bootstrap-password-sync.test.ts` — **PASS**
  - `server-proxy.cookie.test.ts` — **PASS**
- **Production PASS blocked:** Railway deploy of Brain fixes was not executable from this session (approval gate). Live Brain currently times out `/health/live` and returns **504** on `/api/auth/login` via Vercel — login cannot succeed until deploy lands.
- **Verdict until deploy + live login:** **FAIL (blocked on production deploy)**

## Post-deploy verification checklist

1. `GET /health/live` → `eventLoopLagMs` < 2000 steady-state  
2. Invalid login → 401  
3. Valid founder login → 200 + `empireai_session` + `platformIdentity: grand-king`  
4. `/api/auth/me` → 200 after refresh  
5. `/cockpit` loads Executive Home  
6. Logout → cookie cleared; re-login works  
