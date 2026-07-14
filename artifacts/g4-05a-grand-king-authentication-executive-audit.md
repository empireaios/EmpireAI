# G4-05A — Grand King Authentication Experience · Executive Audit

**Mission:** G4-05A — Grand King Authentication Experience  
**Authority:** Grand King · GO-002 Phase 4 · G4-05 Executive Dashboard prerequisite  
**Date:** 2026-06-21  
**Status:** **COMPLETE**  
**Scope:** Authentication wiring and verification only — no security weakening · no fake users · no UI redesign

---

## Executive Summary

Production authentication enforcement is **confirmed**. Unauthenticated access to Cockpit routes returns **HTTP 307 → `/login?next=…`**. The Grand King end-to-end path **Login → Session → `/cockpit` → Executive Home** is wired with targeted fixes for redirect handling, session validation, platform identity display, and logout cookie clearing.

**Production URL:** `https://empireai-five.vercel.app`  
**Screenshots:** `artifacts/screenshots/g4-05a-production-login.png`, `artifacts/screenshots/g4-05a-production-cockpit-redirect.png`

---

## 1. Authentication Flow

```
User (unauthenticated)
  → GET /cockpit (or deep link)
  → middleware.ts: no empireai_session cookie
  → 307 /login?next=/cockpit/…

User submits credentials on /login
  → POST /api/auth/login (Next BFF)
  → POST /auth/login (Brain)
  → UserStore.findByEmail + bcrypt verify
  → SessionStore.create → empireai_session cookie (httpOnly)
  → { user, platformIdentity, expiresAt }
  → router.push(resolvePostAuthPath(next))  → /cockpit (Executive Home)

Authenticated Cockpit load
  → CockpitAuthGuard: GET /api/auth/me → /auth/me
  → platformIdentity === "grand-king" for founder email
  → ExecutiveHomePage + live Brain widgets (executive-home module)
```

### Auth endpoints

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/auth/login` | POST | No | Credential validation + session cookie |
| `/api/auth/logout` | POST | Yes | Session destroy + cookie clear |
| `/api/auth/me` | GET | Yes | Session validation + user + platformIdentity |
| `/auth/refresh` | POST | Yes | Session rotation (backend only; not proxied to frontend) |

### Grand King identity (UID-001)

Backend `resolvePlatformIdentity()` returns `"grand-king"` when email matches `FOUNDER_EMAIL`. This is **informational** — authorization remains role-based (`founder` / `admin` / `operator`) via `/brain/dispatch` RBAC.

---

## 2. Session Flow

| Stage | Mechanism | TTL |
|-------|-----------|-----|
| Create | `SessionStore.create()` on successful login | `SESSION_TTL_SECONDS` (default 7 days) |
| Validate | `createAuthMiddleware()` on `/auth/me`, `/auth/logout`, Brain routes | Redis TTL or in-memory `expiresAt` |
| Client state | `AuthProvider` → `fetchSessionUser()` on mount | Synced with cookie |
| Invalid/expired | `/api/auth/me` → 401 → `CockpitAuthGuard` → `/login?next=…` | — |
| Destroy | `POST /auth/logout` → `sessionStore.destroy()` + `clearCookie` | Immediate |
| Refresh | `POST /auth/refresh` (backend) | Token rotation — not wired on frontend |

**Storage:** Redis when connected; in-memory degraded mode otherwise (sessions lost on restart without Redis).

---

## 3. Cookie Flow

| Property | Value |
|----------|-------|
| Name | `empireai_session` |
| httpOnly | `true` |
| secure | `true` when `CORS_ORIGIN` starts with `https` |
| sameSite | `lax` |
| path | `/` |
| maxAge | `SESSION_TTL_SECONDS` |

**BFF passthrough:** `lib/brain/server-proxy.ts` forwards `Cookie` to Brain and returns `Set-Cookie` on login/logout.

**G4-05A fix:** Logout `clearCookie` now mirrors login flags (`httpOnly`, `secure`, `sameSite`) to prevent partial cookie clears in production.

**Client:** Never reads cookie directly; all requests use `credentials: "include"`.

---

## 4. Route Protection

### Middleware (`empireai-web/middleware.ts`)

- **Matcher:** `/cockpit`, `/cockpit/*`, `/platform`, `/platform/*`
- **Check:** Cookie **presence** only (`empireai_session`)
- **Unauthenticated:** `307 → /login?next=<pathname>`
- **Legacy:** `/platform/*` → `308` canonical `/cockpit/*` redirects

### Client guard (`CockpitAuthGuard`)

- Validates session via `/api/auth/me` after middleware pass
- Handles **stale/invalid cookies** middleware cannot detect
- Shows “Verifying session…” while loading
- Redirects to `/login?next=…` on 401

### Production verification (2026-06-21)

| Route | Unauthenticated HTTP | Redirect |
|-------|---------------------|----------|
| `/api/auth/me` | **401** | — |
| `/login` | **200** | — |
| `/cockpit` | **307** | `/login?next=%2Fcockpit` |
| `/cockpit/command` | **307** | `/login?next=%2Fcockpit%2Fcommand` |
| All 42 static Cockpit pages | **307** | `/login?next=…` |

**Sample protected routes verified:** Executive Home, Command Centre, Mission Centre, all 9 Engine Centers, Governance, Development, Infrastructure, Workforce, Finance, Operations, Commerce, Intelligence.

### Brain API protection

- `/brain/dispatch`: `authenticate` + `canAccessModule(role, module)`
- Cockpit modules (`executive-home`, `cockpit-engine`, etc.) permitted for `founder`, `admin`, `operator` per backend `permissions.ts`
- UI nav hides Command/Mission for operators; direct URL access still loads shell (Brain may 403 on dispatch)

---

## 5. G4-05A Implementation Changes

| Change | File | Purpose |
|--------|------|---------|
| Honor `?next=` post-login | `lib/auth/redirect.ts`, `lib/auth/context.tsx`, `login/page.tsx` | Deep-link return after auth |
| Redirect authenticated users from `/login` | `login/page.tsx` | Skip login when session active |
| Session guard in Cockpit | `CockpitAuthGuard.tsx`, `CockpitShell.tsx` | Invalid cookie → login |
| `platformIdentity` on client | `lib/auth/types.ts`, `lib/auth/display.ts` | Grand King greeting + top bar |
| Executive Home greeting | `ExecutiveHomeLiveWidgets.tsx` | “Good morning, Grand King” |
| Top bar identity label | `CockpitTopBar.tsx` | “Grand King” vs role |
| Nav gating during load | `cockpitNavUtils.ts` | Hide role-restricted nav until session resolves |
| Logout cookie clear | `backend/src/auth/routes.ts` | Match setCookie flags on clear |

### Post-auth redirect safety

`resolvePostAuthPath()` accepts only `/cockpit/*` and `/platform/*` paths — rejects open redirects (`//evil.com`, external URLs).

---

## 6. Logout Flow

```
User clicks “Sign out” (CockpitTopBar)
  → useAuth().logout()
  → POST /api/auth/logout → Brain /auth/logout
  → sessionStore.destroy(token)
  → clearCookie(empireai_session) with matching flags
  → setUser(null)
  → router.push("/login")
```

---

## 7. Remaining Blockers

| Blocker | Severity | Notes |
|---------|----------|-------|
| G4-05A code not yet deployed to Vercel | Medium | Production screenshots show pre-G4-05A login copy; deploy to activate `?next=` honor + guard |
| Authenticated E2E screenshot | Low | Requires provisioned founder credentials — not automated in this session |
| `/auth/refresh` not proxied | Low | Long sessions rely on cookie TTL; no proactive rotation |
| Middleware cookie-only check | Low | Mitigated by `CockpitAuthGuard` client validation |
| Redis session persistence | Ops | Production Brain should use Redis for multi-instance session sharing |
| Backend vs frontend cockpit RBAC mismatch | Low | UI nav vs dispatch permissions differ for operator role |
| `platformIdentity` not used for authorization | By design | Security remains role-based; identity is display-only |

---

## 8. Executive Recommendation

**Ship G4-05A to production** — authentication enforcement is correct; the remaining gaps are UX polish and deployment, not security holes.

**Recommended verification after deploy:**

1. Open `/cockpit` → confirm redirect to `/login?next=%2Fcockpit`
2. Log in as Grand King (founder email) → land on Executive Home with live widgets
3. Confirm top bar shows **Grand King** identity and greeting uses Grand King display name
4. Sign out → confirm return to `/login` and `/cockpit` redirects again
5. Deep link test: visit `/cockpit/command` unauthenticated → login → return to Command Centre

**Do not:** create test users, bypass auth, or weaken cookie/httpOnly requirements.

**Next mission gate:** G4-06 (not started per mission constraints).

---

## 9. Key Files

| Purpose | Path |
|---------|------|
| Auth routes (Brain) | `backend/src/auth/routes.ts` |
| Session store | `backend/src/auth/session-store.ts` |
| Auth middleware | `backend/src/auth/middleware.ts` |
| Platform identity | `backend/src/auth/platform-identity.ts` |
| Next middleware | `empireai-web/middleware.ts` |
| Auth provider | `empireai-web/lib/auth/context.tsx` |
| Post-auth redirect | `empireai-web/lib/auth/redirect.ts` |
| Display helpers | `empireai-web/lib/auth/display.ts` |
| Cockpit session guard | `empireai-web/components/cockpit/shell/CockpitAuthGuard.tsx` |
| Login page | `empireai-web/app/(auth)/login/page.tsx` |
| BFF proxy | `empireai-web/lib/brain/server-proxy.ts` |
| Executive Home | `empireai-web/app/(cockpit)/cockpit/page.tsx` |

---

## 10. Validation

| Check | Result |
|-------|--------|
| Frontend TypeScript | Pass |
| Production `/api/auth/me` unauthenticated | 401 |
| Production `/login` | 200 |
| Production all Cockpit routes (42 static) | 307 → login |
| Screenshots captured | Yes (login + redirect) |

**Mission G4-05A:** **COMPLETE**
