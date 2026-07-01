# PRODUCTION ENVIRONMENT CERTIFICATION — REAL-068

**Authority:** Grand King Executive Directive  
**Mission:** REAL-068 — Production Environment Foundation (resumed)  
**Production URL:** `https://empireai-production.up.railway.app`  
**Date:** 2026-06-30 (resumed 2026-07-01)  
**Baseline commit (foundation):** `58b3003270a47806171e513edd430daf35fb5594`  
**Governance commit (pending push):** _see §9 — staged locally, not yet on origin_

---

## 1. Executive Summary

REAL-068 establishes the **repository and deployment foundation** for autonomous Railway operation. The first checkpoint (`58b3003`) is **live on `origin/main`**. The **interrupted Pillow governance bootstrap** is the sole remaining repository change; it is **ready to commit** but was **not pushed** in this session (operator approval required for git write).

| Certification tier | Status |
|--------------------|--------|
| **Infrastructure (deploy + HTTP health)** | ✅ CERTIFIED |
| **Brain online (`/health`)** | ✅ CERTIFIED |
| **`EMPIREAI_REPO_ROOT` / repo-root discovery** | ✅ CERTIFIED (`58b3003` — nixpacks + env normalization) |
| **Pillow executive bootstrap (Soul + doctrines in git)** | ⏳ **PENDING PUSH** — files exist locally, untracked on origin |
| **Pillow `lifecycle: running`** | ❌ BLOCKED until governance commit deploys |
| **Redis `connected`** | ⏳ PENDING — operator must set `REDIS_URL` in Railway |
| **LLM providers non-empty** | ⏳ PENDING — operator must set API key(s) in Railway |
| **CORS (browser frontend origin)** | ⏳ PENDING — operator must set `CORS_ORIGIN` in Railway |
| **Stripe live** | ⏳ PENDING — operator must set `STRIPE_*` in Railway |

**Overall REAL-068 status:** **PARTIAL — REPOSITORY FOUNDATION COMPLETE EXCEPT GOVERNANCE PUSH; OPERATOR SECRETS REQUIRED FOR FULL CERTIFICATION**

REAL-068 is **not COMPLETE** until: (1) governance commit is pushed and redeployed, (2) Railway secrets from §4 are applied, (3) §6 post-secrets validation passes.

**REAL-069 has not started.**

---

## 2. Work Split — Repository vs Operator

### Group A — Repository changes (Cursor can complete)

| Task | Status | Action |
|------|--------|--------|
| Pillow repo markers (`JOURNEY.md`, `PILLOW_ARCHITECTURE_CONTRACT.md`) | ✅ Done `58b3003` | None |
| `nixpacks.toml` runtime defaults | ✅ Done `58b3003` | None |
| `EMPIREAI_REPO_ROOT=/app` auto-default on Railway | ✅ Done `58b3003` | None |
| `GEMINI_API_KEY` → `GOOGLE_AI_API_KEY` alias | ✅ Done `58b3003` | None |
| `deployment/railway-production.env.template` | ✅ Done `58b3003` | None |
| `backend/.env.example` updates | ✅ Done `58b3003` | None |
| Pillow governance bootstrap (`EMPIREAI_SOUL.md` + 2 doctrines) | ⏳ **Ready, not pushed** | Commit + push §9 files |
| Update this certification document | ✅ Done (this file) | Commit with governance or immediately after |

**No further code changes required** for `EMPIREAI_REPO_ROOT`, Redis, LLM, or CORS — those are env-only and handled by existing `env.ts` + Railway Variables.

### Group B — Railway Dashboard (operator only)

All secret-backed variables. Cursor **must not** invent credentials. Import template `deployment/railway-production.env.template` with real values, attach `/data` volume, redeploy.

---

## 3. Verification — Do Code Changes Still Apply?

| Concern | Still needs repo code change? | Current production evidence | Resolution |
|---------|------------------------------|----------------------------|------------|
| **`EMPIREAI_REPO_ROOT`** | **No** — repaired in `58b3003` | Pillow error is **no longer** repo-root; it progressed to `EXECUTIVE_SELF_ASSESSMENT_FAILED` | ✅ Foundation working |
| **Pillow lifecycle** | **Yes — git only** | `lifecycle: error`, `EXECUTIVE_SELF_ASSESSMENT_FAILED` — Soul + doctrines missing from deployed repo | Push `EMPIREAI_SOUL.md`, `EMPIREAI_GOVERNANCE_DOCTRINE_GVD.md`, `EMPIREAI_REPOSITORY_FIRST_DOCTRINE.md` |
| **Redis degraded mode** | **No** — env only | `redisMode: "degraded"` on `/health` | Operator sets `REDIS_URL` (Upstash `rediss://`) |
| **LLM provider detection** | **No** — env only | `llmProviders: []` on `/health` | Operator sets ≥1 of `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY` / `GEMINI_API_KEY` |
| **CORS configuration** | **No** — env only | `access-control-allow-origin: http://localhost:5173` | Operator sets `CORS_ORIGIN` to Vercel production URL |

---

## 4. Railway Environment Variables — Operator Table

| Variable | Required? | Repository expectation | Operator action required | Reason |
|----------|-----------|----------------------|-------------------------|--------|
| `NODE_ENV` | **Yes** | `production` via `nixpacks.toml` | Verify only (auto) | Production mode |
| `HOST` | **Yes** | Default `0.0.0.0` in `env.ts` | Optional explicit set | Bind all interfaces |
| `PORT` | **Yes** | Railway injects | None | Platform-managed |
| `EMPIREAI_REPO_ROOT` | **Yes** | `/app` via `nixpacks.toml` + auto when `RAILWAY_*` set | Verify only | Pillow monorepo root |
| `DATABASE_PATH` | **Yes** | `/data/empireai-brain.db` via `nixpacks.toml` | Mount volume at `/data` | Persistent Brain SQLite |
| `REDIS_URL` | **Yes** | Defaults to `redis://127.0.0.1:6379` → unreachable → **degraded** | Set Upstash `rediss://…` URL | Queues, sessions, workers |
| `SESSION_SECRET` | **Yes** | Dev default in schema if unset | Set 32+ char random secret | Auth cookie signing |
| `CORS_ORIGIN` | **Yes** | Defaults to `http://localhost:5173` | Set exact Vercel frontend URL | Browser API access |
| `OPENAI_API_KEY` | **One LLM required** | Optional in schema | Set if using OpenAI | Enables `openai` provider |
| `ANTHROPIC_API_KEY` | Optional | Optional | Set if using Anthropic | Enables `anthropic` provider |
| `GOOGLE_AI_API_KEY` | Optional | Optional | Set if using Gemini | Enables `gemini` provider |
| `GEMINI_API_KEY` | Optional | Alias → `GOOGLE_AI_API_KEY` (`58b3003`) | Set instead of `GOOGLE_AI_API_KEY` if preferred | Ops alias |
| `DEFAULT_LLM_PROVIDER` | Recommended | Default `openai` | Match key you set | Provider selection |
| `DEFAULT_LLM_MODEL` | Recommended | Default `gpt-4o-mini` | Adjust if needed | Model selection |
| `STRIPE_SECRET_KEY` | For live payments | Optional | Set live secret key | Revenue loop |
| `STRIPE_WEBHOOK_SECRET` | For webhooks | Optional | Set from Stripe dashboard | Payment events |
| `STRIPE_PUBLISHABLE_KEY` | Optional | Not in Zod schema | Set on frontend if needed | Client-side Stripe |
| `GUARDIAN_ENABLED` | Recommended | Default `true` | Verify | Guardian subsystem |
| `LOG_LEVEL` | Optional | Default `info` | Adjust if debugging | Logging verbosity |
| `WORKER_CONCURRENCY` | Optional | Default `5` | Adjust if needed | BullMQ workers |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Optional | Dev defaults in schema | Override for production | Seed admin |
| `FOUNDER_EMAIL` / `FOUNDER_PASSWORD` | Optional | Dev defaults in schema | Override for production | Seed founder |
| `RAILWAY_ENVIRONMENT` | Auto | Railway injects | None | Triggers `/app` repo root default |
| `RAILWAY_SERVICE_NAME` | Auto | Railway injects | None | Triggers `/app` repo root default |

### Variables that must NOT be set in production

| Variable | Reason |
|----------|--------|
| `REDIS_OPTIONAL=true` | Forces in-memory degraded mode |
| `VERCEL=1` / `VERCEL_URL` | Serverless legacy; wrong CORS/DB paths on Railway |

---

## 5. Completed Repository Work (REAL-068)

### Commit `58b3003` — on `origin/main` ✅

| Change | File(s) |
|--------|---------|
| Pillow repo markers | `JOURNEY.md`, `PILLOW_ARCHITECTURE_CONTRACT.md` |
| Railway non-secret defaults | `nixpacks.toml` |
| Env normalization | `backend/src/config/env.ts` |
| Production env template | `deployment/railway-production.env.template` |
| Example env docs | `backend/.env.example` |
| Initial certification | `PRODUCTION_ENVIRONMENT_CERTIFICATION.md` |

### Pending commit — governance bootstrap ⏳

| File | Purpose |
|------|---------|
| `EMPIREAI_SOUL.md` | Executive identity + Supreme Directive (SUCCESS-001 / MS-A) |
| `EMPIREAI_GOVERNANCE_DOCTRINE_GVD.md` | Doctrine 1 of 2 for self-assessment |
| `EMPIREAI_REPOSITORY_FIRST_DOCTRINE.md` | Doctrine 2 of 2 for self-assessment |

**Suggested commit message:**

```
REAL-068: Add Pillow executive governance artifacts for production bootstrap.

EMPIREAI_SOUL and two root doctrines were missing from git, blocking Executive Self-Assessment on Railway after repo-root repair.
```

---

## 6. Production Validation (live probes)

**Probe time:** 2026-07-01 (post-`58b3003`, pre-governance push)

### `GET /health`

```json
{
  "status": "ok",
  "brain": "online",
  "redisMode": "degraded",
  "llmProviders": [],
  "guardian": { "overall": "degraded" }
}
```

HTTP **200** ✅

### `GET /api/pillow/health`

```json
{
  "health": "Error",
  "lifecycle": "error",
  "lastError": "EXECUTIVE_SELF_ASSESSMENT_FAILED — EMPIREAI_SOUL.md missing; ≥2 doctrines missing"
}
```

HTTP **200** (endpoint reachable) — Pillow **not operational** ❌

### CORS probe

```
Origin: https://empireai.vercel.app
access-control-allow-origin: http://localhost:5173
```

CORS **not production-ready** ❌

### Expected after governance push + redeploy (no secrets)

| Check | Expected |
|-------|----------|
| `/health` | `ok`, `brain: online` |
| Pillow `lifecycle` | **`running`** |
| `redisMode` | `degraded` (until `REDIS_URL`) |
| `llmProviders` | `[]` (until keys) |
| CORS | `localhost:5173` (until `CORS_ORIGIN`) |

### Expected after operator secrets + redeploy (full REAL-068)

| Check | Expected |
|-------|----------|
| `redisMode` | **`connected`** |
| `llmProviders` | **non-empty** e.g. `["openai"]` |
| CORS | **frontend origin** |
| Pillow `lifecycle` | **`running`** |
| Guardian | improved from degraded |

---

## 7. Remaining Blockers Before Full Production Certification

| # | Blocker | Owner | Unblocks |
|---|---------|-------|----------|
| 1 | Push governance commit (§5 pending files) | Cursor / operator git approve | Pillow `lifecycle: running` |
| 2 | Railway redeploy after governance push | Automatic on push to `main` | Pillow reads Soul + doctrines |
| 3 | `REDIS_URL` (Upstash) | Operator | `redisMode: connected` |
| 4 | ≥1 LLM API key | Operator | `llmProviders` non-empty |
| 5 | `SESSION_SECRET` (production-grade) | Operator | Secure auth |
| 6 | `CORS_ORIGIN` = Vercel URL | Operator | Browser frontend access |
| 7 | `/data` volume mounted | Operator | Persistent database |
| 8 | `STRIPE_*` (if live payments in scope) | Operator | Live revenue loop |

---

## 8. Deploy Instructions

1. **Approve and push** governance commit (§5 pending files) + this updated certification doc.
2. **Wait** for Railway auto-deploy from `main` (~2–5 min).
3. **Verify** Pillow: `curl -s https://empireai-production.up.railway.app/api/pillow/health` → `lifecycle: running`.
4. **Railway Dashboard** → Variables → RAW Editor → paste `deployment/railway-production.env.template` with real secrets.
5. **Redeploy** after variable changes.
6. **Re-run** §6 probes; all §6 “full certification” expectations must pass.

**Railway should be redeployed:** **Yes** — after governance commit push, and again after secrets import.

---

## 9. Commit & Push Status

| Commit | Hash | On `origin/main`? | Push confirmed? |
|--------|------|-------------------|-----------------|
| REAL-068 foundation | `58b3003270a47806171e513edd430daf35fb5594` | ✅ Yes | ✅ Yes |
| REAL-068 governance bootstrap | _pending_ | ❌ No | ❌ Not pushed (approval skipped this session) |
| Certification doc update | _pending_ | ❌ No | ❌ Not pushed |

---

## 10. Is REAL-068 COMPLETE?

| Scope | Complete? |
|-------|-----------|
| **Repository foundation (`58b3003`)** | ✅ Yes |
| **Repository governance bootstrap** | ❌ No — push pending |
| **Operator Railway secrets** | ❌ No |
| **Full production certification (§6 all green)** | ❌ No |

**REAL-068 COMPLETE:** **NO** — partial. Foundation is deployed; governance git push + operator secrets remain.

**Next mission (do not start):** REAL-069 — Production Secrets Activation & Full Certification Loop.

---

**End of REAL-068 Production Environment Certification.**
