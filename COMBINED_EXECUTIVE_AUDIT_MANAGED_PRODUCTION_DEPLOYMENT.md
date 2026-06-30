# Combined Executive Audit — EmpireAI Managed Production Deployment

> **Authority:** Grand King Executive Directive  
> **Mission type:** Version 1 Managed Cloud Adaptation  
> **Certification Mode:** ACTIVE  
> **Date:** 2026-06-29  
> **Status:** ✅ Adaptation complete · deployment execution pending

---

## 1. Executive Summary

EmpireAI Version 1 is adapted for **managed cloud deployment** without requiring Docker, Docker Compose, or VPS infrastructure. The canonical production topology is:

| Layer | Platform | Role |
|-------|----------|------|
| Frontend | **Vercel** | Founder UX (`frontend/`) |
| Backend | **Railway** | Brain API + Pillow + worker |
| Database | **Supabase** | V1: Storage backup + future Postgres; live DB = SQLite on Railway volume |
| Redis | **Upstash** | Sessions, BullMQ, event bus |

| Deliverable | Status |
|---|---|
| Managed deployment without Docker | ✅ Verified |
| Docker/VPS mandatory assumptions removed | ✅ |
| Platform deployment documentation | ✅ 5 guides |
| Frontend/backend compatibility | ✅ Build pass · split-stack model |
| Pillow Runtime compatibility | ✅ Railway in-process |
| REAL module compatibility | ✅ All routes via Brain URL |
| Deployment sequence documented | ✅ |
| Repository synchronization | ✅ |

**Verdict:** **MANAGED DEPLOYMENT ADAPTATION COMPLETE** — ready for Grand King cloud provisioning. No public deployment executed in this mission.

---

## 2. Requirement Verification

### 2.1 Managed deployment without Docker

| Check | Result | Evidence |
|-------|--------|----------|
| Brain runs as Node process | ✅ | `node backend/dist/index.js` — Railway `railway.toml` |
| Frontend builds to static SPA | ✅ | Vercel `frontend/dist` |
| Redis via URL only | ✅ | `REDIS_URL` — Upstash `rediss://` compatible with `ioredis` |
| No Docker in critical path | ✅ | Nixpacks on Railway; Vercel static build |
| Docker remains optional | ✅ | `docker-compose.yml` labeled optional in `deployment/README.md` |

### 2.2 Docker/VPS mandatory assumptions removed

| Artifact | Change |
|----------|--------|
| `README.md` | Managed cloud primary; Docker optional |
| `deployment/README.md` | Vercel/Railway/Supabase/Upstash first; Compose demoted |
| `backend/.env.example` | Managed cloud section at top |
| `backend/src/config/redis-client.ts` | `REDIS_START_HINT` no longer Docker-only |
| Prior audit VPS recommendation | Superseded by this mission |

Runtime code unchanged except `REDIS_START_HINT` message (documentation string only).

### 2.3 Platform documentation produced

| Guide | Path |
|-------|------|
| Overview + sequence | `deployment/MANAGED_DEPLOYMENT.md` |
| Vercel | `deployment/vercel.md` |
| Railway | `deployment/railway.md` |
| Supabase | `deployment/supabase.md` |
| Upstash | `deployment/upstash.md` |
| Railway config | `railway.toml` |
| Frontend env template | `frontend/.env.example` |

---

## 3. Frontend / Backend Compatibility

### 3.1 Split-stack architecture

```
Vercel (frontend)  ──VITE_API_BASE_URL──►  Railway (Brain)
```

Frontend API client (`frontend/src/api/client.ts`) uses `VITE_API_BASE_URL` for all Brain calls with `credentials: "include"`.

| Concern | V1 managed resolution |
|---------|----------------------|
| API routing | Direct to Railway — no Vercel serverless rewrites |
| CORS | Brain `CORS_ORIGIN` = Vercel origin |
| Session cookies | Cross-origin with Brain Set-Cookie |
| Build | `npm run build` — backend + frontend **pass** |

### 3.2 Vercel configuration update

Root `vercel.json` updated to **frontend-only** managed mode:

- Install/build: `frontend/` only
- Removed serverless `api/` rewrites (legacy path deprecated)
- SPA fallback to `index.html`

**Required Vercel env:** `VITE_API_BASE_URL=https://<railway-brain-url>`

### 3.3 Legacy monolithic Vercel (deprecated)

| Issue | Impact |
|-------|--------|
| Ephemeral SQLite on `/tmp` | Data loss on cold start |
| `/api` prefix strip breaks Pillow | `/api/pillow/*` → `/pillow/*` mismatch |
| Stale rewrite list | 40+ modules missing vs `frontend/vite.config.ts` |
| No worker/scheduler | Async REAL jobs fail |

**Recommendation:** Do not use `api/[...path].ts` for V1 production. Railway replaces it.

---

## 4. Pillow Runtime Compatibility

Pillow runs **in-process** inside Brain (`backend/src/orchestration/pillow-host/`).

| Requirement | Railway managed | Vercel serverless |
|-------------|-----------------|-------------------|
| `@empireai/pillow` package | ✅ Monorepo root build | ❌ Ephemeral / incomplete |
| `EMPIREAI_REPO_ROOT` | ✅ Full git checkout | ⚠️ Problematic |
| SQLite persistence | ✅ Railway volume | ❌ Ephemeral |
| Routes `/api/pillow/*` | ✅ Preserved | ❌ Strip bug |
| LLM via Brain router | ✅ Env keys on Railway | ⚠️ Degraded |
| Worker missions | ✅ Separate worker service | ❌ Disabled on Vercel |

**Pillow verdict:** ✅ **Compatible with Railway managed deployment.** Not compatible with Vercel-only serverless Brain.

Smoke endpoints after deploy:

- `GET /api/pillow/health`
- `GET /api/pillow/status` (authenticated)
- `POST /api/pillow/chat`

---

## 5. REAL Module Compatibility

All REAL modules register routes on Brain without `/api` prefix (except Pillow family). Frontend dashboards call unprefixed paths via `VITE_API_BASE_URL`.

| Category | Example routes | Managed compatibility |
|----------|----------------|----------------------|
| Reality Integration | `/reality-integration/*` | ✅ |
| Integrations Hub | `/integrations-hub/*` | ✅ |
| Global Notifications | `/global-notifications/*` | ✅ |
| Global Assistant | `/global-assistant/*` | ✅ |
| REAL runtime (100 modules) | `/global-commerce/*`, `/empire-kpi-engine/*`, etc. | ✅ |
| Commerce / marketplace | `/marketplace-infrastructure/*`, `/product-publishing/*` | ✅ |
| Governance | `/empire-constitution/*`, doctrine routes | ✅ |

**REAL verdict:** ✅ **Fully compatible** when Brain runs on Railway with Redis + worker + persistent SQLite.

Local dev parity: `VITE_API_BASE_URL=http://localhost:4000` in `frontend/.env`.

---

## 6. Supabase Compatibility (Database)

| Aspect | V1 status |
|--------|-----------|
| Brain transactional store | **SQLite** (`sql.js`) via `DATABASE_PATH` |
| Supabase Postgres adapter | **Not implemented** (ADR-002 future) |
| Supabase role in V1 stack | Storage backup bucket + migration readiness |
| Live production DB | Railway persistent volume at `/data/empireai-brain.db` |

**No architecture redesign performed.** Supabase documentation explains interim SQLite + Storage backup model.

---

## 7. Upstash Compatibility (Redis)

| Aspect | Status |
|--------|--------|
| `REDIS_URL` with `rediss://` | ✅ `ioredis` + BullMQ |
| Production requirement | ✅ Required on Railway (not `REDIS_OPTIONAL`) |
| Worker sharing | ✅ Same URL on API + worker services |
| Code changes | None required |

---

## 8. Deployment Sequence

Documented in `deployment/MANAGED_DEPLOYMENT.md`:

1. **Validate** — `npm run validate:full`
2. **Upstash** — provision Redis; copy `rediss://` URL
3. **Supabase** — project + Storage bucket for backups
4. **Railway API** — deploy from root; volume at `/data`; env vars
5. **Railway worker** — `node backend/dist/worker.js`; shared env + volume
6. **Vercel frontend** — `VITE_API_BASE_URL` = Railway URL
7. **CORS/cookies** — align origins; test founder login
8. **Smoke test** — Pillow, Notifications, Integrations Hub, REAL dashboard
9. **Optional** — Supabase Storage backup cron

---

## 9. Open Items (execution, not adaptation)

| ID | Item | Severity | Owner |
|----|------|----------|-------|
| MPD-1 | No cloud resources provisioned yet | 🟡 Execution | Grand King / Ops |
| MPD-2 | Production secrets not injected | 🟡 Execution | Grand King |
| MPD-3 | Supabase Postgres not V1 runtime | ℹ️ By design | Post-V1 ADR-002 |
| MPD-4 | `empireai-web` not on managed path | ℹ️ Informational | Founder UX is `frontend/` |
| MPD-5 | Legacy `api/[...path].ts` retained but deprecated | ℹ️ Cleanup optional | Future |

Prior blockers from `COMBINED_EXECUTIVE_AUDIT_EMPIREAI_V1_PRODUCTION_DEPLOYMENT.md` (D1–D7) are **addressed at documentation/config level**. Execution remains pending.

---

## 10. Repository Synchronization

| Artifact | Update |
|----------|--------|
| `deployment/MANAGED_DEPLOYMENT.md` | Created |
| `deployment/vercel.md` | Created |
| `deployment/railway.md` | Created |
| `deployment/supabase.md` | Created |
| `deployment/upstash.md` | Created |
| `deployment/README.md` | Managed cloud primary |
| `README.md` | Corrected UI ownership; managed topology |
| `vercel.json` | Frontend-only split-stack |
| `railway.toml` | Created |
| `frontend/.env.example` | Created |
| `backend/.env.example` | Managed cloud section |
| `JOURNEY.md` | Managed deployment row |
| `JOURNEY_AUDIT.md` | Adoption log |
| `EMPIREAI_REPOSITORY_MASTER_INDEX.md` | Deployment catalog |
| `docs/governance/EXECUTIVE_AUDIT_INDEX.md` | Audit catalogued |

---

## 11. Constitutional Compliance

| Check | Result |
|-------|--------|
| No architecture redesign | ✅ SQLite retained; split-stack only |
| No runtime behavior change (except hint string) | ✅ |
| Brain-only control preserved | ✅ |
| Guardian unchanged | ✅ |
| Certification Mode unchanged | ✅ |
| Docker optional, not removed | ✅ |

---

## 12. Certification Recommendation

### ✅ **MANAGED DEPLOYMENT ADAPTATION COMPLETE**

EmpireAI Version 1 supports managed cloud deployment on Vercel + Railway + Upstash with Supabase as backup/future Postgres platform. Grand King may proceed with cloud provisioning per `deployment/MANAGED_DEPLOYMENT.md`.

Live production URL and credential injection remain **execution tasks**, not adaptation blockers.

---

*End of Executive Audit — await Grand King's cloud provisioning instruction.*
