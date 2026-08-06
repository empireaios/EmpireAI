# Migration and Recovery Runbook

## Migration verdict

**MIGRATION READY** — clone `origin/main`, restore secrets via Railway/Vercel/local env files, install, build, start. Do not copy `node_modules`, `dist`, local DBs, or Cursor state from the old PC.

## New Windows computer (practical)

**Software:** Git, Node.js ≥20.11, npm ≥10, optional Railway CLI, optional GitHub CLI.

```powershell
git clone <YOUR_ORIGIN_URL> EmpireAI
cd EmpireAI
cd pillow && npm ci && npm run typecheck && npm run build
cd ../backend && npm ci && npm run typecheck && npm run build
cd ../empireai-web && npm ci && npm run build
```

**Local Brain (dev):**

```powershell
cd backend
$env:DATABASE_PATH=".\data\empireai-brain-local.db"
npm run dev
```

**Local web:** point BFF to local or production Brain per existing env templates (never commit secrets).

**Duration:** typically 30–90 minutes depending on network and first `npm ci`.

## Secret restoration (names only)

Restore on Railway (production) / Vercel (web) / local `.env` (gitignored):

- Auth: founder/bootstrap password vars used by seed (`FOUNDER_PASSWORD` / documented bootstrap sync)
- `DATABASE_PATH` (Railway: `/data/empireai-brain.db`)
- `CREDENTIAL_VAULT_KEY`
- `OPENAI_API_KEY` (and any other model keys in use)
- `REDIS_URL`
- `CJ_API_KEY` / `CJ_DROPSHIPPING_API_KEY` / `CJ_INTEGRATION_MODE`
- `AMAZON_SP_API_CLIENT_ID` / `AMAZON_SP_API_CLIENT_SECRET` / `AMAZON_SP_API_REFRESH_TOKEN` / region + per-marketplace refresh tokens as configured
- `LIVE_COMMERCE_INTEGRATION_MODE` (keep `sandbox` until launch day)
- `EMPIRE_V1_OPERATIONAL_READY` (keep unset/false until validated)
- Vercel → Brain URL / cookie domain settings as already used by `empire-ai.co`

Never print values. Never commit `.env`.

## Production verification

1. Railway deploy SUCCESS on intended commit  
2. `GET /health/live` → 200  
3. Login at `https://empire-ai.co/login`  
4. Pillow session + short chat  
5. Admission stats present on health  

## Backup / restore

- **SQLite:** Railway volume `/data` — backup `empireai-brain.db` via Railway volume tools or approved export; quarantine corrupt files (do not delete without approval)  
- **Git:** `origin/main` is source of truth for code  
- **Secrets:** Railway/Vercel dashboards  

## Recovery from 502 / event-loop wedge

1. Check `/health/live` — if 502, check Railway logs for lag and session floods  
2. Redeploy if wedged  
3. Confirm admission control + rate limit env defaults  
4. Ask users to stop refresh-storms  
5. Confirm `/data` still mounted  

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Login fails | Brain health; password seed sync; BFF cookie domain |
| Pillow stuck starting | Health lag; admission; session reuse |
| Build fails | Node version; `npm ci` in pillow before backend; sync-pillow-governance order |
| Empty commerce | Live mode flags; not demo panels |
