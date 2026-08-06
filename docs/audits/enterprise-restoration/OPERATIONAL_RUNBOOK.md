# EmpireAI Operational Runbook (Executable Reality)

Last updated: 2026-08-06 (Enterprise Restoration mission)

## Production endpoints

| Surface | URL |
|---------|-----|
| Cockpit | https://empire-ai.co |
| Brain | https://empireai-production.up.railway.app |
| Live | `GET /health/live` |
| Ready | `GET /health/ready` |
| Continuity | `GET /health/executive-continuity` |
| Pillow | `GET /api/pillow/health` |
| Login (Brain) | `POST /auth/login` |

## Required Railway services

1. **EmpireAI** service (Brain + Pillow in-process) — NIXPACKS from repo root via `railway.toml`
2. **Volume** `empireai-volume` mounted at `/data` (mandatory)
3. Upstash Redis via `REDIS_URL` (required; do not set `REDIS_OPTIONAL=true` in production)

## Required environment variable names

Set in Railway Variables (values are secrets — never commit):

| Name | Purpose |
|------|---------|
| `DATABASE_PATH` | Must be `/data/empireai-brain.db` |
| `REDIS_URL` | Upstash `rediss://…` |
| `SESSION_SECRET` | ≥32 chars |
| `CORS_ORIGIN` | Exact cockpit origin (`https://empire-ai.co`) |
| `OPENAI_API_KEY` | LLM |
| `FOUNDER_EMAIL` / `FOUNDER_PASSWORD` | Bootstrap Grand King login (set explicitly; otherwise code defaults apply) |
| `EMPIREAI_REPO_ROOT` | `/app` |
| `NODE_ENV` | `production` |

Optional thrash controls (defaults now safe in code): `SQLITE_PERSIST_DEBOUNCE_MS`, `SQLITE_MIN_FLUSH_INTERVAL_MS`, `SQLITE_FIRST_FLUSH_DELAY_MS`, `SQLITE_FLUSH_LAG_SKIP_MS`.

`nixpacks.toml` also injects `DATABASE_PATH`, `EMPIREAI_REPO_ROOT`, `NODE_ENV` — still confirm service variables and volume.

## Local startup

```powershell
cd pillow; npm install; npm run build
cd ../backend
# Quarantine malformed default DB if present (do not delete without rename):
# Move-Item .\data\empireai-brain.db .\data\empireai-brain.db.corrupt-manual
$env:DATABASE_PATH="./data/empireai-brain-local.db"
$env:REDIS_OPTIONAL="true"   # local only
npm install
npm run build
npm run start   # or npm run dev
```

Login: `POST http://localhost:4000/auth/login` with founder credentials from env/defaults.  
Cockpit BFF: set `empireai-web/.env.local` `BRAIN_API_URL=http://localhost:4000`.

## Production deployment

1. Push durable repairs to `origin/main`.
2. Confirm Railway deploys that exact commit (`railway deployment list --json` → `meta.commitHash`).
3. Confirm volume still mounted at `/data`.
4. Probe `/health/live` repeatedly for ≥5 minutes (not once).
5. Run `node docs/audits/auth/login-regression-probe.mjs` with founder env set.
6. Open https://empire-ai.co → login → cockpit → Pillow shell → send a message.

Build/start (from repo root, matches `railway.toml`):

```text
node scripts/sync-pillow-governance.mjs
npm install --prefix pillow && npm install --prefix backend
npm run build --prefix pillow && npm run build --prefix backend
node backend/dist/index.js
```

## SQLite recovery

- Runtime validates header + `PRAGMA integrity_check` on open.
- Corrupt files are **renamed** to `*.db.corrupt-<ISO-stamp>` (never silent delete).
- Empty DB is recreated; bootstrap users re-seeded from env.
- Quarantined files are gitignored; restore manually if business data must be recovered.
- OneDrive sync of `backend/data/*.db` can corrupt SQLite — keep runtime DBs outside synced folders when possible.

## Railway verification

```powershell
railway status
railway logs --lines 80 --since 30m
railway logs --http --status ">=500" --lines 20 --since 1h
railway volume list --json
```

**502 + Online + `Event loop lag detected` with multi-second `lagMs`** = event-loop stall (sql.js export thrash), not DNS. Redeploy thrash-hardened commit; do not disable health checks.

## Rollback

1. Identify last healthy deployment ID from `railway deployment list`.
2. `railway deployment redeploy <id>` or revert git commit and push.
3. Rollback trigger: sustained `/health/live` 502, crash loop exit 78 without recovery, or login failure after seed sync.

## EESAE incident visibility

Record production incidents under `docs/audits/enterprise-restoration/` and ensure Pillow/EESAE CRT can surface health degradation when monitoring bridges are connected. Do not claim continuous Railway telemetry until the certified monitoring path is verified live.

## Clean-computer setup

1. Clone `origin/main` only.
2. Restore secrets via Railway/Vercel dashboards + local `.env` from `backend/.env.example` (never from old disk copies of secrets in chat).
3. Build pillow → backend → (optional) empireai-web.
4. Start Brain; verify `/health/live`, login, Pillow health.
5. Production remains on Railway/Vercel — no files required from the old computer for production use.
