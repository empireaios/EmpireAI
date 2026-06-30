# Railway — Backend deployment

Railway is the **preferred** host for EmpireAI Brain (Fastify API), Pillow runtime (in-process), and the BullMQ worker.

Deploy from the **monorepo root** so `@empireai/pillow` (`file:../pillow`) resolves during install and build.

---

## Services

| Service | Start command | Purpose |
|---------|---------------|---------|
| **brain-api** | `node backend/dist/index.js` | HTTP API, Pillow host, Guardian |
| **brain-worker** | `node backend/dist/worker.js` | BullMQ jobs, scheduled tasks |

Both services share the same environment variables and persistent volume.

---

## Quick start

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub repo.
2. Set **root directory** to repository root.
3. Railway reads `railway.toml` at repo root:

```toml
[build]
buildCommand = "npm install --prefix pillow && npm install --prefix backend && npm run build --prefix pillow && npm run build --prefix backend"

[deploy]
startCommand = "node backend/dist/index.js"
healthcheckPath = "/health"
```

4. Add a **volume** mounted at `/data`.
5. Configure environment variables (below).
6. Generate a public domain for the API service.

---

## Persistent volume (required)

V1 Brain uses **SQLite** (`sql.js`). The database file must survive redeploys.

| Mount path | Variable | Example |
|------------|----------|---------|
| `/data` | `DATABASE_PATH` | `/data/empireai-brain.db` |

Without a volume, all audit logs, users, Pillow state, and REAL module data are lost on redeploy.

---

## Environment variables

Copy from `backend/.env.example`. Production minimum:

```env
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

# Upstash — use rediss:// URL from Upstash console
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379

# Persistent SQLite on Railway volume
DATABASE_PATH=/data/empireai-brain.db

# Match Vercel frontend origin exactly
CORS_ORIGIN=https://your-app.vercel.app

# 32+ character random string
SESSION_SECRET=change-me-to-a-long-random-production-secret

# Monorepo root inside container (Railway default checkout path)
EMPIREAI_REPO_ROOT=/app

# LLM
OPENAI_API_KEY=sk-...

# Safety
GUARDIAN_ENABLED=true

# Do NOT set in production:
# REDIS_OPTIONAL=true
# VERCEL=1
```

### Pillow-specific

Pillow bootstrap reads governance artifacts from the git checkout. Railway deploys the full repo, so set:

```env
EMPIREAI_REPO_ROOT=/app
```

(Adjust if Railway uses a different working directory — verify with `GET /api/pillow/status` → `repositoryRoot`.)

### Version 1 operational activation (when go-live ready)

```env
LIVE_COMMERCE_INTEGRATION_MODE=production
CREDENTIAL_VAULT_KEY=...
EMPIRE_V1_OPERATIONAL_READY=true
# Plus Amazon SP-API, CJ, etc. — see backend/.env.example
```

---

## Worker service

Production requires a **separate long-running worker**:

1. Duplicate the Brain service in the same Railway project.
2. Use the **same** build settings and env vars.
3. Override start command:

```bash
node backend/dist/worker.js
```

4. Attach the **same volume** at `/data` (worker reads the same SQLite and Redis queues).

Without the worker: async REAL jobs, scheduled cron, and queue consumers do not run.

---

## Health checks

| Endpoint | Auth | Expected |
|----------|------|----------|
| `GET /health` | Public | 200, Brain summary |
| `GET /health/integrations-hub` | Public | 200 |
| `GET /guardian/health` | Session | Subsystem report |

Configure Railway health check on `/health` (see `railway.toml`).

---

## Networking

- Expose the API service on Railway's public HTTPS domain.
- Use that URL as Vercel `VITE_API_BASE_URL`.
- No Docker networking required.

---

## Build notes

- **Node:** 22+ (matches `engines` in `backend/package.json`).
- **Pillow package:** Built before backend (`npm run build --prefix pillow`).
- **No Dockerfile required** — Nixpacks builds from `railway.toml`.

Optional: `docker-compose.yml` and `backend/Dockerfile` remain for local/self-host but are **not** the V1 managed path.

---

## Verification checklist

- [ ] `GET /health` → 200
- [ ] Redis connected (not degraded mode in logs)
- [ ] `GET /api/pillow/status` (authenticated) → `lifecycle: running`
- [ ] Worker service running; no queue backlog errors
- [ ] Volume mounted; database persists across redeploy
- [ ] `CORS_ORIGIN` matches Vercel URL; founder login works from browser

---

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| Redis degraded mode | Wrong `REDIS_URL`; use Upstash `rediss://` URL |
| Pillow repo root error | Set `EMPIREAI_REPO_ROOT` to checkout root |
| CORS errors from Vercel | `CORS_ORIGIN` mismatch |
| Empty data after redeploy | No volume on `DATABASE_PATH` |
| Jobs never complete | Worker service not running |

See also [upstash.md](./upstash.md) and [MANAGED_DEPLOYMENT.md](./MANAGED_DEPLOYMENT.md).
