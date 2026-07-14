# 12 — Infrastructure and Production Audit

---

## Production Topology

```
Grand King Browser
       │
       ▼
┌──────────────────┐
│ Vercel           │  empire-ai.co
│ frontend/ OR     │  (root vercel.json → frontend/dist)
│ empireai-web/    │  (separate project possible)
└────────┬─────────┘
         │ BRAIN_API_URL / VITE_API_BASE_URL
         ▼
┌──────────────────┐
│ Railway          │  empireai-production.up.railway.app
│ backend/dist/    │
│ index.js         │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Upstash    SQLite volume
 Redis      /data/empireai-brain.db
```

**Documented in:** `deployment/MANAGED_DEPLOYMENT.md`

---

## Railway Configuration

**File:** `railway.toml`
- Build: pillow + backend (Nixpacks)
- Start: `node backend/dist/index.js`
- Healthcheck: `/health/live`

**Env template:** `deployment/railway-production.env.template`

**Critical production vars:**
- `REDIS_URL` (Upstash)
- `SESSION_SECRET`
- `OPENAI_API_KEY` (Pillow LLM)
- `DATABASE_PATH` (persistent volume)
- `CORS_ORIGIN` (https://empire-ai.co)
- `EMPIREAI_REPO_ROOT` / governance bundle

---

## Vercel Configuration

| Config | Target |
|--------|--------|
| Root `vercel.json` | `frontend/` SPA |
| `empireai-web/vercel.json` | Next.js standalone |
| `deployment/vercel-cockpit.env.template` | Cockpit env |

**Tension:** Two frontends, two Vercel configs — production URL mapping must be verified per project.

---

## BFF (empireai-web)

- Server-side proxy hides Railway URL from browser
- Tiered timeouts (auth 20s, dispatch 55s, pillow chat 58s)
- Cookie handling for `empireai_session`
- Rejects localhost Brain URL on Vercel

---

## Health & Uptime

| Check | Endpoint | Used by |
|-------|----------|---------|
| Liveness | `/health/live` | Railway healthcheck, stability scripts |
| Full health | `/health` | Guardian, redis mode |
| Pillow | `/api/pillow/health` | Journey verify |

**Recent stability fixes:** Event loop lag monitoring, SQLite debounced persist, Executive Home async loader.

**Verification scripts:**
- `backend/scripts/production-journey-verify.mjs`
- `backend/scripts/production-long-run-stability.mjs`
- `backend/scripts/verify-production-deploy.mjs`

**Latest automated result:** Long-run stability ALL CYCLES PASSED (commit `9e51bc7` deployed).

---

## Scaling Concerns

| Concern | Severity | Detail |
|---------|----------|--------|
| Single Node process | High | sql.js, one Brain instance |
| SQLite write path | Medium | Debounced but not multi-writer |
| In-memory Pillow sessions | Medium | Lost on restart |
| Redis session dependency | High | Degraded = no persistence |
| Extension routes off | Medium | Reduces load but limits API surface |
| SSE connections | Low | EventStreamHub — client cleanup on close |
| Workers off at boot | Medium | Background jobs may not run |

---

## Performance Bottlenecks (Identified)

1. Executive Home cold dispatch (~15s before optimizations, ~1–3s after cache)
2. Pillow lazy boot (up to 90s wait in journey script)
3. LLM latency (0.5–1.5s per Pillow reply when healthy)
4. Full SQLite export on flush (mitigated by debounce)
5. Extension route registration (~10min defer if enabled)

---

## Environment Variable Inventory

| File | Scope |
|------|-------|
| `backend/.env.example` | Brain full matrix |
| `frontend/.env.example` | VITE_API_BASE_URL |
| `empireai-web/.env.example` | BRAIN_API_URL |
| `deployment/railway-production.env.template` | Production Brain |
| `deployment/vercel-cockpit.env.template` | Cockpit |

**Production readiness checker:** `production-infrastructure-readiness.ts` — validates Railway, Redis, DB path, secrets.

---

## Evidence JSON (Immutable Deploy Proof)

| File | Proves |
|------|--------|
| `b5-production-deploy-evidence.json` | B5 deploy |
| `b6-01a-amazon-sp-api-evidence.json` | Amazon auth |
| `b6-02b-live-cj-auth-evidence.json` | CJ auth |
| `b6-03b-stripe-live-auth-evidence.json` | Stripe auth |
| `b6-04-production-vault-evidence.json` | Vault |
| `g4-05b-auth-verification-results.json` | Auth verification |

---

## Infrastructure Health Summary

| Area | Status |
|------|--------|
| Deploy pipeline | **Working** — Railway + Vercel documented |
| Production journey | **Passing** (automated) |
| Monitoring | **Basic** — health endpoints, event loop metrics |
| HA / multi-instance | **Not supported** as configured |
| Secret hygiene | **Risk** — defaults in env schema |
| Documentation | **Good** — MANAGED_DEPLOYMENT.md |
