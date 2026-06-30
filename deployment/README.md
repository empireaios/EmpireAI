# EmpireAI Deployment

Production-oriented deployment for EmpireAI Version 1.

## Version 1 managed cloud (recommended)

| Layer | Platform | Guide |
|-------|----------|-------|
| Frontend | **Vercel** | [vercel.md](./vercel.md) |
| Backend | **Railway** | [railway.md](./railway.md) |
| Database | **Supabase** (backup + future Postgres) | [supabase.md](./supabase.md) |
| Redis | **Upstash** | [upstash.md](./upstash.md) |

**Start here:** [MANAGED_DEPLOYMENT.md](./MANAGED_DEPLOYMENT.md) — full deployment sequence.

Docker, Docker Compose, and VPS are **optional** — not required for Version 1 production.

---

## Prerequisites

- Node.js 22+
- Redis 7+ (local dev only — production uses Upstash)
- Docker & Docker Compose (**optional**, local convenience)

---

## Local development

```bash
# Terminal 1 — Redis (local or Upstash URL)
redis-server

# Terminal 2 — Brain API
cd backend
cp .env.example .env
npm install
npm run dev

# Terminal 3 — Founder UX (Vite)
cd frontend
cp .env.example .env
npm install
npm run dev
```

Login: `founder@empireai.com` / `EmpireAI2026!`

Set `VITE_API_BASE_URL=http://localhost:4000` in `frontend/.env` for split-stack parity with production.

---

## Validation gate

```powershell
cd backend
.\scripts\validate-phase25.ps1
```

Produces `phase25-report.json` with subsystem checklist, Guardian health, and test results.

---

## Docker Compose (optional — local / self-host)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Web UI (`empireai-web`) | http://localhost:3000 |
| Brain API | http://localhost:4000 |
| Redis | localhost:6379 |

> **Note:** Founder UX contract surfaces (Mission Home, Pillow, GC shell) live in `frontend/`, not `empireai-web`. For founder validation, use `frontend/` + managed cloud or local Vite dev.

---

## Environment variables

| Variable | Service | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | Frontend (Vercel) | Railway Brain URL (build-time) |
| `REDIS_URL` | Brain | Upstash `rediss://` or local Redis |
| `DATABASE_PATH` | Brain | SQLite path (Railway volume in production) |
| `CORS_ORIGIN` | Brain | Vercel frontend origin |
| `EMPIREAI_REPO_ROOT` | Brain | Monorepo root for Pillow |
| `SESSION_SECRET` | Brain | Cookie signing (32+ chars in production) |
| `GUARDIAN_ENABLED` | Brain | Safety gate on all dispatches |

See `backend/.env.example` for the full list.

---

## Health & observability

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /health` | Public | Brain + Guardian summary |
| `GET /metrics` | Admin | Request latency & error rates |
| `GET /guardian/health` | User | Full subsystem health report |

---

## Production checklist

- [ ] Run `npm run validate:full` before deploy
- [ ] Upstash Redis provisioned; `REDIS_URL` on API + worker
- [ ] Railway volume mounted; `DATABASE_PATH=/data/empireai-brain.db`
- [ ] Worker service running (`node backend/dist/worker.js`)
- [ ] Vercel `VITE_API_BASE_URL` points to Railway Brain
- [ ] `CORS_ORIGIN` matches Vercel domain
- [ ] Change `SESSION_SECRET` and default user passwords
- [ ] Configure LLM API keys
- [ ] Optional: Supabase Storage backup for SQLite
- [ ] Enable TLS (handled by Vercel/Railway)

---

## Related documentation

- [MANAGED_DEPLOYMENT.md](./MANAGED_DEPLOYMENT.md)
- [COMBINED_EXECUTIVE_AUDIT_MANAGED_PRODUCTION_DEPLOYMENT.md](../COMBINED_EXECUTIVE_AUDIT_MANAGED_PRODUCTION_DEPLOYMENT.md)
