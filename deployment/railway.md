# Railway — Backend deployment

Railway is the **preferred** backend host for EmpireAI Brain and Pillow.

**Production cutover: NOT VERIFIED.** This page describes the repository's
current configuration, not a receipt that it is deployed or safe to promote.
The old production process has no demonstrated quiesce-and-durable-save barrier;
do not restart it or attach test workers to its state based on this guide.
Use the separately reviewed [bounded-canary procedure](./railway-canary.md) and
[canary configuration](./railway.canary.toml) for a disposable engineering test.
Passing that test does not certify V53/Birth, commerce or zero-data-loss cutover.

Deploy from the **monorepo root** so `@empireai/pillow` (`file:../pillow`) resolves during install and build.

---

## Services

| Service | Start command | Purpose |
|---------|---------------|---------|
| **Brain service** | `node backend/dist/index.js` | Default production Tier-0 primary: authentication, health and proxy |
| **Managed Brain child** | Spawned by the primary using its own Node executable | Full API/Pillow graph on a private loopback port, with `EMPIRE_ROLE=brain-worker` |
| **Redis** | Separately configured dependency | Sessions/queues; require actual readiness and persistence evidence |

The managed child is part of the same application service. It is not the
standalone `backend/dist/worker.js` queue-consumer entrypoint. Do not duplicate
services or share a SQL.js volume between independently writing processes.
Actual unattended scheduler/consumer operation remains a separate acceptance gate.

---

## Repository configuration reference

The normal source configuration is [root railway.toml](../railway.toml), with
the repository root as its working directory. It currently specifies:

```toml
[build]
builder = "NIXPACKS"
buildCommand = "NPM_CONFIG_PRODUCTION=false npm ci --prefix pillow && NPM_CONFIG_PRODUCTION=false npm ci --prefix backend && node scripts/sync-pillow-governance.mjs && npm run build --prefix pillow && npm run build --prefix backend"

[deploy]
startCommand = "node backend/dist/index.js"
healthcheckPath = "/health/ready"
healthcheckTimeout = 300
```

Read back the effective provider build/start/health configuration and exact source
revision; dashboard values alone may be overridden by source. The root configuration
retains direct Node startup and is not the bounded-canary configuration. Nixpacks
selects major 22 while the install guard requires exact 22.23.2: a mismatch fails
installation, and a successful installation does not prove the startup binary.
Do not silently replace production configuration to get a test running.

An approved application deployment requires a durable `/data` volume and confirmed
`DATABASE_PATH`. Disposable canaries require their own volume, Redis and generated
test credentials, and remain private. No new public domain is required for that test.

### Production 502 / event-loop stall (known failure mode)

Provider **Online** or a 200 liveness response is insufficient. Inspect the primary,
worker and Redis readiness responses plus logs. Event-loop/export stalls are a
known failure family, but a 502 alone does not establish their cause. Repairs require
reviewed source, exact-head CI and scoped recovery evidence before any promotion.

---

## Persistent volume (required)

V1 Brain uses **SQLite** (`sql.js`). The database file must survive redeploys.

| Mount path | Variable | Example |
|------------|----------|---------|
| `/data` | `DATABASE_PATH` | `/data/empireai-brain.db` |

An ephemeral filesystem is not durable across redeploy. A mounted volume alone
also does not prove pending SQL.js RAM has been saved. Current mission snapshots
use native `.missions.sqlite`, and the read-only execution worker has its own
database; include every actual state file plus Redis in the coordinated restore
scope. Preserve legacy JSON bytes during explicit migration. Component restore
passes do not establish application recovery or a safe old-production cutover.

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

### Commercial authority

Environment readiness flags and account credentials cannot grant Birth or
commercial authority. Canonical state remains `NOT_BORN` and commerce `LOCKED`
until independently accepted evidence and the required explicit owner pilot
authorization exist. Do not use this guide to enable live provider effects.

### Canva Connect (Visual Generation Layer)

Register the **same** redirect URI in the Canva Connect app and Railway:

```env
CANVA_CLIENT_ID=...
CANVA_CLIENT_SECRET=...
CANVA_REDIRECT_URI=https://empire-ai.co/api/integrations/canva/callback
CANVA_MOCK=false
```

The Vercel BFF at that URL proxies to Brain `GET /canva/oauth/callback`.

---

## Worker topology is a separate gate

The production entrypoint starts the Tier-0 primary and its managed Brain child.
The standalone `backend/dist/worker.js` source exists, but this does not establish
a safe independently deployed consumer service. Production early-listen and
engineering-test policy can suppress background workers/scheduling. Prove actual
queue admission, consumers, retries, state ownership, restart recovery and bounded
side effects before calling unattended processing operational. Do not launch a
second SQL.js writer against the primary's database to satisfy a checklist.

---

## Health checks

| Endpoint | Auth | Expected |
|----------|------|----------|
| `GET /health/live` | Public | Primary liveness diagnostics; not acceptance of worker/Pillow readiness |
| `GET /health/ready` | Public | 200 only when primary Redis session storage and worker/Pillow readiness satisfy the actual checks; otherwise 503 |
| `GET /guardian/health` | Session | Subsystem report |

The configured admission health check is `/health/ready`. It is infrastructure
readiness, not proof of a useful completed answer, durable mission or commerce.

---

## Networking

- For an approved website deployment, the canonical Next.js `empireai-web` BFF uses server-side `BRAIN_API_URL` for the Brain origin; its Vercel path requires HTTPS. Verify the actual authenticated website-to-Brain flow.
- `VITE_API_BASE_URL` belongs only to the legacy Vite frontend; it is not the canonical Next.js BFF setting.
- Disposable canary testing remains private and does not require a public domain.
- No Docker networking required.

---

## Build notes

- **Node:** exact `22.23.2`; **npm:** exact `10.9.8`, matching repository pins and hosted CI. Preserve actual build and runtime receipts separately.
- **Install:** locked `npm ci`; never regenerate locks or accept `npm install` as equivalent release evidence.
- **Pillow package:** Built before backend (`npm run build --prefix pillow`).
- **Builder:** normal root configuration remains Nixpacks. Only the disposable canary reference selects Railpack and the bounded launcher; it must not be merged as production configuration.

Optional: `docker-compose.yml` and `backend/Dockerfile` remain for local/self-host but are **not** the V1 managed path.

---

## Verification checklist

- [ ] Effective source/build/start configuration and exact Node/npm identities independently observed
- [ ] `GET /health/live` responds; `GET /health/ready` passes actual Redis/worker/Pillow checks
- [ ] Redis connected (not degraded mode in logs)
- [ ] `GET /api/pillow/status` (authenticated) → `lifecycle: running`
- [ ] Managed Brain child and any separately accepted consumers have the correct roles; real task results are observed
- [ ] Whole application state, mission histories and failure outcomes survive the scoped recovery test, with all earlier failures preserved
- [ ] Safe old-production quiescence/cutover and rollback independently established before production change
- [ ] `CORS_ORIGIN` matches Vercel URL; founder login works from browser

---

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| Redis degraded mode | Wrong `REDIS_URL`; use Upstash `rediss://` URL |
| Pillow repo root error | Set `EMPIREAI_REPO_ROOT` to checkout root |
| CORS errors from Vercel | `CORS_ORIGIN` mismatch |
| Empty data after redeploy | Investigate volume/path, pending RAM, migration and missing state-file coverage; preserve failed evidence |
| Jobs never complete | Inspect admission, scheduling, consumer policy, dependencies and receipts; a running child alone is insufficient |

See also [upstash.md](./upstash.md) and [MANAGED_DEPLOYMENT.md](./MANAGED_DEPLOYMENT.md).
