# Phase 1–2 Evidence Freeze & Request-Path Forensics

**Recorded:** 2026-08-06T06:34Z (UTC) / continued through forensics  
**Local HEAD:** `a4355be15e4b5d028d49a7e4952e3e71b10f5528`  
**origin/main:** `a4355be15e4b5d028d49a7e4952e3e71b10f5528`  
**Ahead/behind:** `0 / 0`

## Railway active deployment

| Field | Value |
|-------|-------|
| Deployment ID | `ee7af911-070c-43f3-9701-2f2ea1a74998` |
| Status | SUCCESS / service ● Online |
| Commit | `a4355be15e4b5d028d49a7e4952e3e71b10f5528` (matches origin/main) |
| Config | `railway.toml` NIXPACKS, start `node backend/dist/index.js` |
| Healthcheck | `/health/live`, timeout 300s |
| Region | sfo |
| Volume mounts | **none** (`volumeMounts: []`) |
| Volumes in project | **none** |

## Production probes (Phase 1)

| Endpoint | Result |
|----------|--------|
| `GET …/health/live` | **502** Bad Gateway (~15s edge timeout) |
| `GET …/health/ready` | **502** |
| `GET …/health` | **502** |
| `GET …/` (Brain root) | **502** |
| `https://empire-ai.co` | **200** |
| `https://empire-ai.co/login` | **200** |

## Request-path verdict

```
Browser → empire-ai.co (Vercel) → PASS
→ Brain BFF / BRAIN_API_URL → empireai-production.up.railway.app → REACHABLE (edge)
→ Railway proxy → deployed container "Online" → REACHABLE
→ Node process (started 03:28Z) → DEGRADED / WEDGED
→ Application listener :8080 → started OK historically
→ HTTP handlers → FAIL (15s upstream timeout → 502)
```

**Earliest failing boundary:** Node event loop saturation inside the running Brain process after successful listen. Not DNS, not Vercel, not wrong URL, not failed build, not missing listen.

## Runtime evidence (Railway logs)

1. Startup **PASS**: Redis connected, DB init, Brain listening `port=8080`, Pillow host started.
2. Then repeated `Event loop lag detected` with `lagMs` of **25s–54s+**.
3. HTTP edge logs: dozens of **502 @ ~15000ms** on `/health/live`, `/auth/me`, `POST /api/pillow/session`, `POST /brain/dispatch`.
4. Process remains marked Online while unable to answer within proxy budget → classic event-loop stall, not crash-loop exit.

Logged DB path on that instance: `dbPath="/app/empireai-brain.db"` (ephemeral). Repo `nixpacks.toml` intends `DATABASE_PATH=/data/empireai-brain.db`, but **no volume is attached**.

## Railway variable presence (names only)

**Present:** `REDIS_URL`, `SESSION_SECRET`, `CORS_ORIGIN`, `OPENAI_API_KEY`, commerce/Canva/Stripe keys, `PRODUCTION_DEPLOY_VERIFIED`, Railway-injected vars.

**Missing vs docs (must configure):**

| Variable | Status |
|----------|--------|
| `DATABASE_PATH` | MISSING as service variable (nixpacks may inject `/data/...` without volume) |
| `FOUNDER_EMAIL` / `FOUNDER_PASSWORD` | MISSING (Brain falls back to code defaults) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | MISSING |
| `EMPIREAI_REPO_ROOT` | MISSING (auto `/app` when Railway detected) |
| `HOST` / `PORT` / `NODE_ENV` | MISSING (Railway provides PORT; code defaults HOST/NODE_ENV) |
| `SQLITE_PERSIST_*` | MISSING |

## Working-tree classification (restoration-critical)

| Path | Class |
|------|-------|
| `backend/src/brain/sqlite-database.ts` | **CRITICAL repair** — thrash hardening (debounce 30s, min flush 120s, first flush delay, lag skip, atomic write) — **not in HEAD** (HEAD still `PERSIST_DEBOUNCE_MS=250`) |
| `backend/src/runtime/executive-continuity-watchdog*.ts` | **CRITICAL** — untracked HA stall recovery |
| `backend/src/auth/seed-users.ts` + `session-store.ts` | **CRITICAL** — bootstrap password sync from env |
| `empireai-web/lib/brain/server-proxy.ts` | **CRITICAL** — auth timeout 55s + Set-Cookie rewrite |
| `backend/src/app.ts` / `index.ts` | Continuity health route + watchdog start + exec-learning route order |
| Frontend UX / executive-learning dirty files | Non-blocking for 502; defer unless needed for E2E |
| `*.db`, `.tmp-*`, secrets | **EXCLUDE** from commit |

## Local SQLite state

| File | Notes |
|------|-------|
| `backend/data/empireai-brain.db` | ~2.5MB; previously **malformed** |
| `backend/data/empireai-brain-restore-cert.db` | Fresh restore cert DB (disposable) |
| Git | `*.db` gitignored |

## Root-cause hypothesis (evidence-backed)

1. **Primary:** sql.js synchronous full-DB `export()` thrash under 250ms debounce saturates the event loop → Railway edge 15s timeout → **502**.
2. **Secondary:** No Railway volume + unstable/ephemeral DB path → durability and migration risk.
3. **Amplifier:** Pillow session retry storms while wedged (many concurrent 502s).

## Mismatch list (repo intent vs live)

| Intended | Live |
|----------|------|
| Volume at `/data` | **No volumes** |
| `DATABASE_PATH=/data/empireai-brain.db` | Ephemeral path observed; service var absent |
| Persist debounce safe for production | HEAD **250ms** |
| Continuity watchdog | Not deployed (untracked locally) |
