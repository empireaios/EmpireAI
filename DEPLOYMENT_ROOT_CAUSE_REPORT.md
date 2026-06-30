# Deployment Root Cause Report — Railway Static SPA vs Brain Service

> **Authority:** Grand King Executive Directive  
> **Mission:** Railway Production Deployment Root Cause Audit  
> **Date:** 2026-06-30  
> **Mode:** Audit only — no fixes applied  
> **Repository:** `https://github.com/empireaios/EmpireAI.git`  
> **Branch audited:** `main` @ `9a44de1d4e84b32361c44b6b92a6205d60f9db18`

---

## Executive verdict

**Root cause:** Railway is building from **GitHub `main`**, which has **no `railway.toml`**, **no Brain start command at the repository root**, and **strong static-SPA signals** (`frontend/` Vite app + root `build` script + `vercel.json` with `"outputDirectory": "frontend/dist"`). Railway’s **Railpack** builder auto-detects a **Vite SPA** and offers static hosting via Caddy — not the Fastify Brain API.

The managed Brain `railway.toml` exists **only in the local workspace** and has **never been committed or pushed**.

---

## 1. `railway.toml` — GitHub vs local

| Check | Result |
|-------|--------|
| File exists locally | ✅ Yes — `railway.toml` at repository root |
| Tracked by git | ❌ **No** — appears under **Untracked files** |
| Committed to `main` | ❌ **No** |
| Present on `origin/main` | ❌ **No** — `git show origin/main:railway.toml` → `fatal: path 'railway.toml' exists on disk, but not in 'origin/main'` |
| Present in `HEAD` | ❌ **No** — same fatal error |

### Entire `railway.toml` currently committed to GitHub

**None.** The file is absent from the remote repository.

### Entire `railway.toml` in local workspace (not on GitHub)

```toml
# EmpireAI Brain — Railway managed deployment (preferred backend host)
# Deploy from repository root so @empireai/pillow (file:../pillow) resolves.
# See deployment/railway.md for worker service, volumes, and env vars.

[build]
builder = "NIXPACKS"
buildCommand = "npm install --prefix pillow && npm install --prefix backend && npm run build --prefix pillow && npm run build --prefix backend"

[deploy]
startCommand = "node backend/dist/index.js"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
healthcheckPath = "/health"
healthcheckTimeout = 120
```

---

## 2. Git status summary

```
Branch: main
Tracking: origin/main (up to date — no unpushed commits)
Latest commit: 9a44de1 — "Add Vercel deployment config for Vite frontend and Fastify API."
```

### Modified but not committed (deployment-relevant)

| File | On GitHub `main` | Local change |
|------|------------------|--------------|
| `vercel.json` | Full monorepo SPA + serverless API rewrites | Stripped to **frontend-only** SPA (not pushed) |
| `package.json` | Root build scripts only | Added `pillow:*` scripts (not pushed) |
| `deployment/README.md` | Docker-first guide | Managed cloud guide (not pushed) |
| `README.md` | Points to Docker / empireai-web | Managed Vercel + Railway topology (not pushed) |

### Untracked locally (never on GitHub)

| Category | Examples |
|----------|----------|
| **Railway config** | `railway.toml` |
| **Railway docs** | `deployment/railway.md`, `deployment/MANAGED_DEPLOYMENT.md`, `deployment/vercel.md`, `deployment/supabase.md`, `deployment/upstash.md` |
| **Pillow package** | entire `pillow/` directory |
| **Most founder frontend** | most of `frontend/src/` (GitHub has ~34 files; local has full GC shell) |
| **Large backend surface** | `backend/src/orchestration/`, `backend/src/operational-access/`, many REAL modules — **untracked locally** |
| **Executive audits** | all `COMBINED_EXECUTIVE_AUDIT_*.md` files |

**Conclusion:** Railway deploys the **committed** snapshot (~414 backend source files, minimal frontend), not the full local workspace.

---

## 3. What Railway / Railpack sees on GitHub `main`

### 3.1 Repository root (default Railway connect path)

Top-level entries on `origin/main`:

```
backend/  frontend/  empireai-web/  api/  vercel.json  package.json  docker-compose.yml  deployment/  ...
```

No `railway.toml`, `nixpacks.toml`, `Procfile`, or `railpack.json`.

### 3.2 Root `package.json` (used when service root = repository root)

Committed scripts:

```json
{
  "scripts": {
    "build": "npm run build --prefix backend && npm run build --prefix frontend",
    "build:frontend": "npm run build --prefix frontend",
    "build:backend": "npm run build --prefix backend",
    "vercel-build": "npm run build"
  }
}
```

| Property | Value |
|----------|-------|
| `start` script | **Missing** |
| `build` script | Builds **backend + frontend** |
| Declares Node web service | **No** (no start entrypoint at root) |

### 3.3 Committed `vercel.json` on `main`

```json
{
  "installCommand": "npm install --prefix backend && npm install --prefix frontend && npm install",
  "buildCommand": "npm run build --prefix backend && npm run build --prefix frontend",
  "outputDirectory": "frontend/dist",
  "functions": { "api/**/*.ts": { ... } },
  "rewrites": [ ..., { "source": "/(.*)", "destination": "/index.html" } ]
}
```

This explicitly declares a **static frontend output directory** (`frontend/dist`) and SPA fallback to `index.html`. While `vercel.json` is a Vercel contract, it is a strong monorepo signal that the primary deploy artifact at root is a **static SPA**.

### 3.4 `frontend/package.json` on `main`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "devDependencies": { "vite": "^7.0.0", "@vitejs/plugin-react": "^4.6.0" }
}
```

Vite + React → Railpack **Node SPA auto-detection** (see Railpack docs).

### 3.5 `backend/package.json` on `main`

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "start:worker": "node dist/worker.js"
  }
}
```

Brain entrypoint exists **only when Railway service root = `backend/`**.

### 3.6 Node entrypoint (Brain API)

| Item | Path |
|------|------|
| Source | `backend/src/index.ts` |
| Compiled | `backend/dist/index.js` |
| Start (from `backend/`) | `node dist/index.js` |
| Start (from repo root, per local `railway.toml`) | `node backend/dist/index.js` |
| Health check | `GET /health` on port `4000` (default `PORT`) |

---

## 4. Nixpacks / Railpack service detection

| Question | Finding |
|----------|---------|
| Does GitHub have `railway.toml`? | **No** → Railway cannot apply `[build]` / `[deploy]` overrides from repo |
| Builder on GitHub | **Railpack auto-detect** (Railway default; local `railway.toml` specifies `NIXPACKS` but is not deployed) |
| Detected project type at **repo root** | **Node SPA (Vite)** — not long-running API |
| Why SPA? | ① Vite in `frontend/` ② root `build` produces static assets ③ no root `start` ④ `vercel.json` → `frontend/dist` |
| Detected project type if **Root Directory = `backend/`** | **Node API** — has `start: node dist/index.js` (would need build step configured in Railway UI) |
| `pillow/` on GitHub | **Absent** — local `railway.toml` buildCommand references `pillow/` which **does not exist on remote** |

---

## 5. Why Railway generated `RAILPACK_SPA_OUTPUT_DIR`

Railway uses **[Railpack](https://railpack.com/languages/node/)** for Node projects.

From Railpack Node SPA behavior (documented):

1. If a **Vite** (or CRA/Angular) project is detected and a **build output directory** exists, Railpack enters **SPA mode**.
2. SPA mode serves static files with **Caddy**, not a custom Node `start` command.
3. If SPA output directory is ambiguous, Railpack prompts: **“If you have a static site, set `RAILPACK_SPA_OUTPUT_DIR`”** (e.g. `frontend/dist`).
4. Setting a **custom start command** in the Railway dashboard can **disable** auto-SPA unless `RAILPACK_SPA_OUTPUT_DIR` is explicitly set (Railpack assumes custom start = non-SPA intent).
5. `RAILPACK_NO_SPA=true` disables SPA mode entirely.

**Applied to EmpireAI on GitHub `main`:**

| Signal | Effect |
|--------|--------|
| `frontend/` contains Vite | SPA framework detected |
| Root `npm run build` builds frontend → `frontend/dist` | Static output produced |
| `vercel.json` → `"outputDirectory": "frontend/dist"` | Reinforces static artifact path |
| Root `package.json` has **no `start`** | No long-running Node server declared at root |
| **No `railway.toml` on GitHub** | No `startCommand = node backend/dist/index.js` override |

→ Railpack correctly classifies the **default root deployment** as a **static SPA**, not the Brain service.

---

## 6. Where Railway should deploy (architecture intent vs GitHub reality)

| Target | Brain API? | On GitHub today? | Notes |
|--------|------------|-------------------|-------|
| **Repository root + committed `railway.toml`** | ✅ Intended | ❌ `railway.toml` missing; would also need `pillow/` committed | Local managed-deployment design |
| **`backend/` as Railway Root Directory** | ✅ Possible | ✅ `start` script exists | Must configure build (`npm run build`) in Railway; no Pillow on GitHub main today |
| **Repository root without config** | ❌ | ✅ **This is what happens** | Railpack → Vite SPA + Caddy |
| **`frontend/` only** | ❌ | N/A | Static site only — wrong service for Brain |

**Safest intended topology (from local `deployment/railway.md`, not on GitHub):**

- Service root: **repository root**
- Config file: **`railway.toml`** committed
- Start: `node backend/dist/index.js`
- Build: pillow + backend (requires `pillow/` in repo)
- Worker: second service `node backend/dist/worker.js`

---

## 7. Build / start command matrix

| Source | Install | Build | Start |
|--------|---------|-------|-------|
| **GitHub root (Railpack default)** | `npm install` (root) | root `npm run build` → backend tsc + frontend vite | **None at root** → Caddy serves SPA |
| **Local `railway.toml` (not on GitHub)** | (in buildCommand) pillow + backend npm install | `npm run build --prefix pillow && npm run build --prefix backend` | `node backend/dist/index.js` |
| **`backend/` only (manual Railway setting)** | `npm install` in backend | `npm run build` | `node dist/index.js` |

---

## 8. Missing Git commits (required before Railway can run Brain as designed)

| Missing artifact | Status | Impact |
|------------------|--------|--------|
| `railway.toml` | Untracked | Railway has no Brain start/build override |
| `deployment/railway.md` | Untracked | Ops docs only |
| `pillow/` | Untracked | Local `railway.toml` build would fail even if committed |
| Managed `vercel.json` (frontend-only) | Modified, not committed | Does not affect Railway; affects Vercel only |
| Full backend/frontend local work | Mostly untracked | GitHub Brain is older/smaller subset |

**No commit on `main` or any branch contains `railway.toml`.**

---

## 9. Exact root cause (single statement)

**Railway builds from GitHub `main`, which lacks `railway.toml` and any root-level Node `start` command, while containing a Vite frontend and `vercel.json` pointing at `frontend/dist`; Railpack therefore auto-detects and deploys a static SPA (Caddy), not the Fastify Brain API.**

Contributing factor: the managed Brain deployment configuration was authored **locally only** and was **never pushed** to `origin/main`.

---

## 10. Safest fix (documentation only — not executed)

### Option A — Recommended (matches local `railway.toml` intent)

1. Commit and push `railway.toml` to `main`.
2. Commit and push `pillow/` (required by buildCommand) and any backend dependencies it needs.
3. In Railway project settings:
   - **Root Directory:** `/` (repository root)
   - Confirm Railway reads `railway.toml` `[deploy] startCommand`
   - Set `RAILPACK_NO_SPA=true` **or** ensure start command from `railway.toml` overrides SPA detection
4. Add persistent volume at `/data`; set `DATABASE_PATH=/data/empireai-brain.db`.
5. Set `REDIS_URL`, `SESSION_SECRET`, `CORS_ORIGIN`, etc.

### Option B — Minimal change on current GitHub `main` (no pillow)

1. Railway service **Root Directory:** `backend`
2. Railway **Build Command:** `npm install && npm run build`
3. Railway **Start Command:** `node dist/index.js`
4. Set `RAILPACK_NO_SPA=true` on that service (if Railpack still inspects monorepo root — verify in build logs)
5. Does **not** include Pillow runtime (not on GitHub)

### Option C — Explicit anti-SPA at monorepo root (without railway.toml)

1. Railway **Start Command:** `node backend/dist/index.js`
2. Railway **Build Command:** `npm install --prefix backend && npm run build --prefix backend`
3. Environment: `RAILPACK_NO_SPA=true`
4. Do **not** run root `npm run build` (avoids building frontend SPA as deploy target)

### Commands to verify after fix (not run in this audit)

```bash
# After push, confirm file on remote
git ls-tree origin/main railway.toml

# Local verification only
git add railway.toml
git status

# Railway deploy is out of scope for this audit
```

---

## 11. Files requiring modification (when Grand King approves fix)

| File | Action |
|------|--------|
| `railway.toml` | **Add to git** and push to `main` |
| `pillow/` | **Add to git** if using root buildCommand with Pillow |
| `deployment/railway.md` | Optional — push for ops documentation |
| Railway dashboard | Set Root Directory, env vars, volume; consider `RAILPACK_NO_SPA=true` |
| `vercel.json` | **No Railway impact** — Vercel-only; keep frontend on Vercel, Brain on Railway |

**Do not** point Railway at `frontend/` for Brain deployment.

---

## 12. Audit checklist (tasks 1–12)

| # | Task | Result |
|---|------|--------|
| 1 | `railway.toml` on GitHub? | ❌ **No** — local only |
| 2 | Committed to `main`? | ❌ **No** |
| 3 | Print committed `railway.toml` | **Empty — file absent from Git** |
| 4 | Nixpacks/Railpack service detection | **Vite SPA at repo root** (not Brain) |
| 5 | Repository root expected by Railway | **`/` (default)** unless dashboard overrides |
| 6 | `package.json` used | **Root `package.json`** when root = `/`; **`backend/package.json`** if root = `backend/` |
| 7 | Build command (GitHub) | Root: `npm run build` → backend + frontend |
| 8 | Start command (GitHub) | **None at root**; backend has `node dist/index.js` |
| 9 | Node entrypoint | `backend/dist/index.js` from `backend/src/index.ts` |
| 10 | Correct deploy directory | **Root + `railway.toml`** (intended) or **`backend/`** (minimal on current GitHub) |
| 11 | Local vs GitHub | **`railway.toml` + most managed-deployment work untracked** |
| 12 | `RAILPACK_SPA_OUTPUT_DIR` explanation | **Railpack SPA auto-detection** — see §5 |

---

*Audit complete. No deployment executed. No repository files modified except this report.*
