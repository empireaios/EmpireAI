# Combined Executive Audit — EmpireAI Version 1 Production Deployment

> **Authority:** Grand King Executive Directive  
> **Mission type:** Production Deployment · Operational Milestone M3 (commerce verification scope)  
> **Certification Mode:** ACTIVE  
> **Date:** 2026-06-29  
> **Method:** Build verification · environment audit · infrastructure review · route/API alignment analysis  
> **Go-live executed:** No · **Commercial operations executed:** No

---

## 1. Production Deployment Summary

**Verdict context:** No production deployment to a public URL was completed in this workspace session.

| Layer | Target | Build status | Deploy status |
|---|---|---|---|
| **Frontend (founder UX)** | `frontend/` Vite + React | ⚠️ Not verified this session (build skipped) | ❌ Not deployed |
| **Frontend (platform UI)** | `empireai-web/` Next.js 16 | ✅ `next build` succeeded (22 routes) | ❌ Not deployed |
| **Backend (Brain)** | `backend/` Fastify | ✅ `tsc` production build succeeded | ❌ Not deployed |
| **Database** | SQLite + Redis | ⚠️ Local/dev defaults only | ❌ No production volume |
| **Domain / SSL** | Public HTTPS URL | ❌ Not configured | ❌ No DNS/SSL evidence |
| **Container stack** | `docker-compose.yml` | ⚠️ Config present | ❌ Docker unavailable on deployment host |

### Deployment path inventory

| Path | Documented for | Founder UX complete | Production-ready |
|---|---|---|---|
| **Docker Compose** (`brain` + `web` + `redis`) | `deployment/README.md` | ❌ Deploys `empireai-web` only — no Mission Home / Pillow / GC shell | 🟡 Partial |
| **Vercel monorepo** (`vercel.json` + `frontend/dist`) | Root `vercel.json` | ✅ Full UX contract (`frontend/`) | 🔴 Rewrite gaps (see §2) |
| **Vercel (Next.js)** | Not configured | ❌ No `vercel.json` in `empireai-web/` | ❌ Not wired |

**Critical architecture note:** README designates `empireai-web/` as **Primary UI**, but the **Grand King founder experience** (Mission Home, Product Discovery, Pillow, Notifications, Global Assistant, Approval Center) lives in `frontend/` (Vite). Production deployment cannot satisfy founder verification using `empireai-web` alone.

### Tooling availability (deployment host)

| Tool | Status |
|---|---|
| Docker | ❌ Not installed |
| Vercel CLI | ❌ Not installed |
| GitHub CLI (`gh`) | ❌ Not installed |

No production URL, deployment log, or hosting provider project linkage exists in the repository.

---

## 2. Infrastructure Verification

### Frontend

| Check | Result | Evidence |
|---|---|---|
| Production build (`empireai-web`) | ✅ Pass | `next build` — compiled, 22 static/dynamic routes |
| Production build (`frontend` founder UX) | ⚠️ Not run | `frontend/dist/` absent; build skipped |
| Vercel configuration | 🟡 Legacy only | Root `vercel.json` targets `frontend/`, not `empireai-web` |
| Environment variables (web) | 🟡 Minimal | `empireai-web/.env.local` — `BRAIN_API_URL` present only |
| Static assets | ✅ (empireai-web) | `.next/static` generated on build |
| Routing | ✅ (empireai-web) | `/login`, `/platform/*` middleware-protected |
| Authentication | ✅ (empireai-web) | BFF routes `/api/auth/login|logout|me` |
| Dashboard loads | ⚠️ Unverified live | No production server running |

**Vercel rewrite gap (deployment blocker):** `vercel.json` API prefix list is **stale** vs `frontend/vite.config.ts` proxy list. Missing prefixes include:

- `global-notifications` (Notifications Center)
- `global-assistant` (Global Assistant)
- `operational-access`, `master-completion-ledger`, `version-1-activation`, and 40+ REAL modules present in Vite dev proxy

**Pillow API path mismatch on Vercel:** Frontend calls `/api/pillow/*`. The serverless adapter (`api/[...path].ts`) strips the `/api` prefix, routing to `/pillow/*` on Brain — but Brain registers Pillow at `/api/pillow/*`. Auth works (`/auth/*`); Pillow does **not** follow the same pattern.

### Backend

| Check | Result | Evidence |
|---|---|---|
| Production build | ✅ Pass | `npm run build` → `backend/dist/` |
| API reachable (production) | ❌ | No deployed endpoint |
| `GET /health` | ⚠️ Code present | `app.ts` — not probed on production URL |
| `GET /health/version-1-activation` | ⚠️ Code present | Public activation health |
| Authentication | ⚠️ Dev defaults | `SESSION_SECRET` dev default when unset |
| Pillow endpoints | ✅ Registered | `/api/pillow/*` in `pillow-routes.ts` |
| REAL / executive routes | ✅ Registered | 150+ route modules in `app.ts` |
| Logging | ✅ | Pino via `config/logger.ts` |
| Dedicated worker | ❌ Not running | `npm run start:worker` required per deployment guide |

### Database

| Check | Result | Evidence |
|---|---|---|
| Production connection | ❌ | No `backend/.env`; no production `DATABASE_PATH` |
| Migration status | 🟡 Inline only | `database.ts` — `CREATE TABLE IF NOT EXISTS` at startup; no versioned migrations |
| Schema integrity | ✅ Dev validation | Guardian `integrity_check` in validation harness |
| Backup strategy | ❌ Manual only | `deployment/README.md` — “Back up SQLite database volume”; no automation |
| Recovery validation | 🟡 Code only | `guardian/recovery-planner.ts` — restore guidance, not deployed |

**Vercel serverless note:** SQLite defaults to `/tmp/empireai-brain.db` — **ephemeral** across cold starts unless external storage is configured.

### Domain

| Check | Result |
|---|---|
| DNS | ❌ No platform domain configured (blueprint references `{slug}.empireai.store` are for **generated storefronts**, not EmpireAI platform hosting) |
| SSL / HTTPS | ❌ Not configured |
| Redirects | ❌ Not configured |
| Production URL | ❌ None |

### Redis

| Check | Result |
|---|---|
| Production Redis | ❌ Not configured (`REDIS_URL` missing from all env files) |
| Required in production | ✅ Enforced unless `REDIS_OPTIONAL=true` |

---

## 3. Production Environment Verification

Audit method: key presence only — **no secret values reported**.

### `backend/.env` / `backend/.env.local`

| Status | Keys |
|---|---|
| **File** | ❌ **Absent** |

### `empireai-web/.env.local`

| Status | Keys |
|---|---|
| **Present** | `BRAIN_API_URL` |
| **Missing** | All Brain-side production vars (expected — BFF-only file) |

### Root `.env.local`

| Status | Keys |
|---|---|
| **Present** | `OPENAI_API_KEY` |
| **Missing** | All other production vars |

### Required production variables — consolidated report

| Variable | Status | Notes |
|---|---|---|
| `NODE_ENV=production` | ❌ Missing | |
| `REDIS_URL` | ❌ Missing | Required for sessions, BullMQ, event bus |
| `DATABASE_PATH` | ❌ Missing | Defaults to `./data/` or `/tmp` on Vercel |
| `SESSION_SECRET` (32+ chars, non-dev) | ❌ Missing | Dev default used if unset |
| `CORS_ORIGIN` | ❌ Missing | Must match production frontend origin |
| `OPENAI_API_KEY` | ✅ Present (root `.env.local`) | |
| `ANTHROPIC_API_KEY` | ❌ Missing | |
| `GOOGLE_AI_API_KEY` | ❌ Missing | |
| `GUARDIAN_ENABLED` | ❌ Missing | Defaults `true` |
| `LIVE_COMMERCE_INTEGRATION_MODE=production` | ❌ Missing | Defaults `sandbox` |
| `CREDENTIAL_VAULT_KEY` | ❌ Missing | |
| `AMAZON_SP_API_CLIENT_ID` | ❌ Missing | |
| `AMAZON_SP_API_CLIENT_SECRET` | ❌ Missing | |
| `AMAZON_SP_API_REFRESH_TOKEN` | ❌ Missing | |
| `CJ_DROPSHIPPING_API_KEY` / `CJ_API_KEY` | ❌ Missing | |
| `CJ_DROPSHIPPING_API_SECRET` / `CJ_API_SECRET` | ❌ Missing | |
| `EMPIRE_V1_OPERATIONAL_READY` | ❌ Missing | Pillow remains dry-run |
| `BRAIN_API_URL` | ✅ Present (`empireai-web`) | Localhost default target |

### Invalid (would fail production gates)

| Variable | Issue |
|---|---|
| `SESSION_SECRET` | Would use dev default if deployed without override |
| `LIVE_COMMERCE_INTEGRATION_MODE` | Would remain `sandbox` |
| `EMPIRE_V1_OPERATIONAL_READY` | Not `true` — M5 Pillow production mode inactive |

**Activation health (code-level, current env):** `productionReadinessPassed: false` — four blockers (sandbox mode, vault key, Amazon SP-API, CJ credentials) per prior operational activation audit.

---

## 4. Pillow Production Verification

| Check | Production status | Evidence |
|---|---|---|
| Accessible from production website | ❌ | No production website deployed |
| Session starts | ⚠️ Code ready | `POST /api/pillow/session` |
| Executive Context loads | ⚠️ Code ready | Objective dashboard, executive council integration |
| Approval Gate active | ✅ | `ApprovalGateEngine` + `/api/pillow/approval` |
| Builder Mode active | ⚠️ Architecture present | Cursor bridge — `dryRunLaunch` until M5 |
| Objective Engine active | ⚠️ Code ready | `GET /api/pillow/objective` |
| Production mode (M5) | ❌ | `EMPIRE_V1_OPERATIONAL_READY` not set |
| Vercel routing for Pillow | 🔴 **Broken path** | `/api/pillow/*` → adapter strips `/api` → route mismatch |

**Pillow host wiring:** `isPillowProductionModeEnabled()` gates dry-run flags in `pillow-host.ts`. Approval gates preserved — no bypass.

---

## 5. Founder Experience Verification

Verification against mission checklist. **No live production URL** — assessment is route/code availability + deployment path feasibility.

| Capability | `frontend/` (Vite) | `empireai-web/` | Production verified |
|---|---|---|---|
| **Login** | ✅ `/login` | ✅ `/login` | ❌ |
| **Mission Home** | ✅ `MissionHomePage` | ❌ Not routed | ❌ |
| **Navigate dashboard** | ✅ Full GC shell | 🟡 `/platform/dashboard` only | ❌ |
| **Product Discovery** | ✅ UX-005 | ❌ | ❌ |
| **Pillow** | ✅ `PillowChatPage` | ❌ | ❌ |
| **Notifications** | ✅ `NotificationsCenter` (GC-03) | 🟡 Settings tab only | ❌ |
| **Global Assistant** | ✅ `GlobalAssistantPanel` (GC-05) | ❌ | ❌ |
| **Approval Center** | ✅ `ApprovalsPage` | 🟡 Partial via AiCeo module | ❌ |

**Conclusion:** Grand King founder experience **cannot be verified on production** because (a) no public deployment exists, and (b) the Docker-documented path (`empireai-web`) **does not include** the UX-contract surfaces closed in UX-001→023.

---

## 6. Remaining Deployment Risks

| ID | Risk | Severity | Mitigation |
|---|---|---|---|
| D1 | **No production deployment executed** | 🔴 Critical | Deploy via Docker Compose on VPS **or** Vercel with corrected config |
| D2 | **Dual frontend — wrong UI on Docker path** | 🔴 Critical | Deploy `frontend/` for founder UX, or port UX routes to `empireai-web` (out of scope for deployment-only) |
| D3 | **Vercel API rewrite list stale** | 🔴 Critical | Sync `vercel.json` prefixes with `vite.config.ts` proxy list |
| D4 | **Pillow `/api/pillow` Vercel adapter mismatch** | 🔴 Critical | Fix `api/[...path].ts` strip logic or normalize Brain route prefixes |
| D5 | **No production env file / secrets** | 🔴 Critical | Inject vars per `backend/.env.example` + V1 checklist |
| D6 | **Redis not configured** | 🔴 Critical | Provision Redis; set `REDIS_URL` |
| D7 | **Ephemeral SQLite on Vercel** | 🔴 Critical | Use Docker volume or migrate to persistent storage |
| D8 | **No domain / SSL** | 🔴 Critical | Configure DNS + TLS termination |
| D9 | **No DB backup automation** | 🟡 High | Scheduled volume backup before go-live |
| D10 | **Worker process not deployed** | 🟡 High | Run `start:worker` alongside Brain |
| D11 | **Commerce activation env absent (M3)** | 🔴 Critical | Amazon + CJ + vault + production mode |
| D12 | **Default SESSION_SECRET / passwords** | 🔴 Critical | Rotate before any public exposure |

---

## 7. Deployment Recommendation

### **NOT READY**

**Rationale:** EmpireAI Version 1 **cannot be accessed by Grand King through a public production URL** today. Production builds partially succeed (`empireai-web`, backend), but:

1. **No deployment was executed** — no hosting, no domain, no SSL.
2. **Production environment is unconfigured** — no backend `.env`, no Redis, no commerce credentials, dev session defaults.
3. **Founder UX is not on the Docker deployment path** — `empireai-web` lacks Mission Home, Pillow, Notifications, Global Assistant, and Approval Center.
4. **Vercel path has API routing defects** for Pillow, Notifications, and Global Assistant.
5. **Operational activation (M3)** from prior mission remains blocked pending production secrets.

**Minimum path to READY FOR GRAND KING LAUNCH:**

1. Choose single production topology: **VPS + Docker Compose** (recommended for SQLite + Redis + Pillow) **or** **Vercel** (requires rewrite fix + persistent storage strategy).
2. Deploy **`frontend/`** (founder UX) + **Brain** + **Redis** — not `empireai-web` alone.
3. Inject full production environment per `docs/governance/VERSION_1_GO_LIVE_PREPARATION_CHECKLIST.md`.
4. Configure domain, SSL, `CORS_ORIGIN`, rotate `SESSION_SECRET`.
5. Run `npm run validate:full`; probe `/health`, `/health/version-1-activation`, founder login flow on production URL.
6. Set `EMPIRE_V1_OPERATIONAL_READY=true` only after readiness passes.

---

## Journey synchronization

| Artifact | Update |
|---|---|
| Blocker register | B5/B6 unchanged — deployment does not close without production env + URL |
| Prior audit | Builds on `COMBINED_EXECUTIVE_AUDIT_EMPIREAI_V1_OPERATIONAL_ACTIVATION.md` |

---

*End of Executive Audit — await Grand King's instruction.*
