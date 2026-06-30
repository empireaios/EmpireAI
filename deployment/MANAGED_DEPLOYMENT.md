# EmpireAI Managed Cloud Deployment

**Version 1 production strategy (Grand King Executive Directive)**

| Layer | Platform | Role |
|-------|----------|------|
| **Frontend** | [Vercel](vercel.md) | Founder UX (`frontend/`) — static SPA |
| **Backend** | [Railway](railway.md) | Brain API + Pillow in-process + worker |
| **Database** | [Supabase](supabase.md) | V1 persistence strategy (see compatibility note) |
| **Redis** | [Upstash](upstash.md) | Sessions, BullMQ, event bus |

Docker, Docker Compose, and VPS deployment are **optional** local or self-host paths — **not required** for Version 1 production.

---

## Architecture (split stack)

```
┌─────────────────┐     HTTPS + cookies      ┌──────────────────────────┐
│  Vercel         │  VITE_API_BASE_URL ────► │  Railway (Brain API)     │
│  frontend/dist  │                          │  Fastify · Pillow · REAL │
└─────────────────┘                          └───────────┬──────────────┘
                                                         │
                              ┌──────────────────────────┼──────────────────────────┐
                              ▼                          ▼                          ▼
                     Upstash Redis              SQLite (volume)            Supabase Storage
                     REDIS_URL                  DATABASE_PATH              (optional backup)
```

The frontend never calls LLMs or external APIs directly. All REAL modules, Pillow, Guardian, and commerce flows route through the Brain on Railway.

---

## Prerequisites

- Node.js 22+ (build pipelines)
- GitHub repository connected to Vercel and Railway
- Accounts: Vercel, Railway, Supabase, Upstash
- Domain (optional) with TLS handled by Vercel/Railway

---

## Deployment sequence

Execute in this order. Do not skip health checks between steps.

### Phase 0 — Repository validation

```bash
cd backend
npm run validate:full
```

Confirm typecheck and validation tests pass before any cloud deploy.

### Phase 1 — Upstash Redis

1. Create an Upstash Redis database (regional, near Railway).
2. Copy the **`rediss://`** connection URL.
3. Keep it for Phase 2.

→ [upstash.md](./upstash.md)

### Phase 2 — Supabase project

1. Create a Supabase project (same region as Railway when possible).
2. For **V1 runtime**, provision a **Storage bucket** for optional SQLite backups.
3. Note: Brain uses **SQLite today**, not Supabase Postgres — see [supabase.md](./supabase.md).

→ [supabase.md](./supabase.md)

### Phase 3 — Railway Brain API

1. New Railway project from this monorepo (root directory).
2. Attach a **persistent volume** mounted at `/data`.
3. Set environment variables (Redis URL, `DATABASE_PATH=/data/empireai-brain.db`, secrets, `CORS_ORIGIN`, `EMPIREAI_REPO_ROOT`).
4. Deploy using root `railway.toml`.
5. Verify `GET https://<brain>/health` returns 200.

→ [railway.md](./railway.md)

### Phase 4 — Railway worker (required for production async jobs)

1. Duplicate the Brain service or add a second Railway service from the same repo.
2. Start command: `node backend/dist/worker.js`
3. Share the same env vars and volume as the API service.
4. Do **not** set `REDIS_OPTIONAL=true` in production.

→ [railway.md](./railway.md#worker-service)

### Phase 5 — Vercel frontend

1. Import monorepo; set root to repository root (uses root `vercel.json`).
2. Set **`VITE_API_BASE_URL`** to the Railway Brain public URL (build-time variable).
3. Set production domain.
4. Deploy; verify login and Mission Home load.

→ [vercel.md](./vercel.md)

### Phase 6 — Cross-origin and cookies

1. Set Brain `CORS_ORIGIN` to the exact Vercel production URL (no trailing slash).
2. Confirm session cookies work (`credentials: "include"` on frontend).
3. Re-test founder login and a REAL dashboard (e.g. Integrations Hub).

### Phase 7 — Pillow and REAL smoke test

1. Log in as founder; open Pillow workspace.
2. Confirm `GET /api/pillow/status` via Brain URL.
3. Open Global Notifications and Global Assistant.
4. Open Integrations Hub — dashboard loads from `/integrations-hub/dashboard`.

### Phase 8 — Optional Supabase backup job

Schedule periodic upload of `/data/empireai-brain.db` to Supabase Storage (Railway cron or external scheduler).

→ [supabase.md](./supabase.md#sqlite-backup-to-supabase-storage)

---

## Environment variable matrix

| Variable | Service | Example |
|----------|---------|---------|
| `VITE_API_BASE_URL` | Vercel (build) | `https://brain.up.railway.app` |
| `REDIS_URL` | Railway | `rediss://default:…@….upstash.io:6379` |
| `DATABASE_PATH` | Railway | `/data/empireai-brain.db` |
| `CORS_ORIGIN` | Railway | `https://app.empireai.com` |
| `SESSION_SECRET` | Railway | 32+ random chars |
| `EMPIREAI_REPO_ROOT` | Railway | `/app` (repo root in container) |
| `OPENAI_API_KEY` | Railway | Provider key |
| `GUARDIAN_ENABLED` | Railway | `true` |

Full list: `backend/.env.example`

---

## What is NOT required

| Assumption | V1 managed status |
|------------|-------------------|
| Docker / Docker Compose | Optional — see `docker-compose.yml` for local only |
| VPS / PM2 / rsync | Optional — Railway replaces this |
| Brain on Vercel serverless | **Deprecated** for production — use Railway |
| Postgres migration | Post-V1 (ADR-002) — SQLite on Railway volume is V1-compatible |

---

## Legacy paths (reference only)

| Path | Status |
|------|--------|
| `docker-compose.yml` | Local / optional self-host |
| `api/[...path].ts` | Legacy Vercel serverless Brain adapter — stale rewrites, ephemeral SQLite |
| `empireai-web/` | Alternate Next.js UI — not the founder UX contract surface |

---

## Related audits

- `COMBINED_EXECUTIVE_AUDIT_MANAGED_PRODUCTION_DEPLOYMENT.md`
- `COMBINED_EXECUTIVE_AUDIT_EMPIREAI_V1_PRODUCTION_DEPLOYMENT.md` (superseded topology recommendations)
