# PRODUCTION ENVIRONMENT CERTIFICATION — REAL-068

**Authority:** Grand King Executive Directive  
**Mission:** REAL-068 — Production Environment Foundation  
**Production URL:** `https://empireai-production.up.railway.app`  
**Git commit (this certification):** _pending push — see commit hash after deploy_  
**Date:** 2026-06-30

---

## 1. Executive Summary

REAL-068 audits the Railway production environment against the minimum standard for autonomous operation. **Repository-side repairs** address Pillow repo-root discovery and Railway runtime defaults. **Secret-backed variables** (Redis, LLM keys, Stripe, CORS frontend origin) must be configured in the Railway dashboard — they cannot be committed to git.

| Certification tier | Status |
|--------------------|--------|
| **Infrastructure (deploy + health)** | ✅ CERTIFIED |
| **Pillow repo-root foundation** | ✅ REPAIRED (repo + nixpacks + env normalization) |
| **Redis connected** | ⏳ PENDING — requires `REDIS_URL` (Upstash) in Railway |
| **LLM providers** | ⏳ PENDING — requires at least one API key in Railway |
| **CORS (browser frontend)** | ⏳ PENDING — requires `CORS_ORIGIN` matching Vercel URL |
| **Stripe live** | ⏳ PENDING — requires `STRIPE_*` in Railway |

**Overall REAL-068 certification:** **PARTIAL** — foundation repairs merged; **full autonomous certification** completes when Railway Variables from `deployment/railway-production.env.template` are applied and post-deploy health matches §6.

---

## 2. Environment Variable Audit Matrix

| Variable | Code consumer | Production (before REAL-068) | Required | Repo / Railway action |
|----------|---------------|------------------------------|----------|------------------------|
| `CORS_ORIGIN` | `backend/src/config/env.ts` | **Present (invalid)** — defaults to `http://localhost:5173` | Yes | **Set in Railway** to Vercel frontend URL |
| `EMPIREAI_REPO_ROOT` | `pillow-host/resolve-repo-root.ts`, `env.ts` | **Missing** | Yes | **Repaired:** `nixpacks.toml` + auto `/app` when `RAILWAY_*` set |
| `REDIS_URL` | `config/redis-client.ts`, Brain | **Missing/invalid** — localhost default → degraded | Yes | **Set in Railway** — Upstash `rediss://` URL |
| `OPENAI_API_KEY` | `brain/llm/openai-provider.ts` | **Missing** | One of LLM keys | **Set in Railway** |
| `ANTHROPIC_API_KEY` | `brain/llm/anthropic-provider.ts` | **Missing** | Optional | **Set in Railway** if used |
| `GEMINI_API_KEY` | — (alias) | **Missing** | Optional | **Set in Railway** — maps to `GOOGLE_AI_API_KEY` (REAL-068) |
| `GOOGLE_AI_API_KEY` | `brain/llm/gemini-provider.ts` | **Missing** | Optional | Same as Gemini |
| `STRIPE_SECRET_KEY` | `revenue/live-payment-engine/config/live-payment-env.ts` | **Missing** | For live payments | **Set in Railway** |
| `STRIPE_WEBHOOK_SECRET` | `revenue/minimum-live-revenue-loop`, live-payment | **Missing** | For webhooks | **Set in Railway** |
| `NODE_ENV` | `env.ts` | Likely `production` | Yes | **Repaired:** `nixpacks.toml` |
| `DATABASE_PATH` | `env.ts`, Brain DB | Unknown / may lack volume | Yes | **Repaired:** `nixpacks.toml` → `/data/empireai-brain.db` |
| `SESSION_SECRET` | `@fastify/cookie`, auth | Dev default risk | Yes | **Set in Railway** (32+ chars) |
| `REDIS_OPTIONAL` | `redis-client.ts` | Should be unset | Must NOT be `true` | Unused in prod — do not set |
| `VERCEL` | degraded-mode gate | Should be unset | Must NOT be set | Unused on Railway |
| `PORT` | Railway injects | Auto | Yes | Railway-managed |
| `RAILWAY_ENVIRONMENT` | `env.ts` normalize | Auto-injected | — | Used for `/app` repo root default |

### Variables identified as unused in production Brain startup

- `VERCEL`, `VERCEL_URL` — serverless legacy; must not be set on Railway
- `REDIS_OPTIONAL=true` — forces degraded mode; forbidden in production

---

## 3. Root Cause Analysis (REAL-067 gaps)

| Gap | Evidence | REAL-068 repair |
|-----|----------|-----------------|
| Pillow `lifecycle: error` | `/api/pillow/health` → missing repo root | Commit `JOURNEY.md` + `PILLOW_ARCHITECTURE_CONTRACT.md` (Pillow markers); `nixpacks.toml` `EMPIREAI_REPO_ROOT=/app`; env auto-default on Railway |
| `redisMode: degraded` | `/health` → no reachable Redis | Railway `REDIS_URL` template (operator action) |
| `llmProviders: []` | No API keys in container env | Railway LLM keys (operator action) |
| CORS localhost only | Response header `access-control-allow-origin: http://localhost:5173` | Railway `CORS_ORIGIN` (operator action) |

**Pillow marker discovery:** `pillow/src/bootstrap/find-repo-root.ts` requires `JOURNEY.md` and `PILLOW_ARCHITECTURE_CONTRACT.md` at monorepo root. These files existed locally but were **not tracked in git**, so Railway deploys lacked markers even when `cwd=/app`.

---

## 4. Repairs Applied (REAL-068)

| Change | Type | File(s) |
|--------|------|---------|
| Pillow repo markers added to git | Repository | `JOURNEY.md`, `PILLOW_ARCHITECTURE_CONTRACT.md` |
| Railway non-secret defaults | Nixpacks | `nixpacks.toml` |
| `GEMINI_API_KEY` → `GOOGLE_AI_API_KEY` alias | Env normalization | `backend/src/config/env.ts` |
| Auto `EMPIREAI_REPO_ROOT=/app` on Railway | Env normalization | `backend/src/config/env.ts` |
| Production env template | Documentation | `deployment/railway-production.env.template` |
| `.env.example` EMPIREAI_REPO_ROOT + Gemini note | Documentation | `backend/.env.example` |

**No business logic modified.** Only environment normalization and deployment artifacts.

---

## 5. Health Comparison — Before vs After

### Before REAL-068 (2026-06-30, pre-commit)

`GET /health`:

```json
{
  "status": "ok",
  "brain": "online",
  "redisMode": "degraded",
  "llmProviders": [],
  "guardian": { "overall": "degraded" }
}
```

`GET /api/pillow/health`:

```json
{
  "health": "Error",
  "lifecycle": "error",
  "lastError": "Could not resolve EmpireAI repository root for Pillow. Set EMPIREAI_REPO_ROOT."
}
```

CORS probe: `access-control-allow-origin: http://localhost:5173`

### After REAL-068 deploy (expected)

| Check | Expected after repo deploy | Expected after Railway secrets |
|-------|---------------------------|-------------------------------|
| `status` | `ok` | `ok` |
| `brain` | `online` | `online` |
| `redisMode` | `degraded` until `REDIS_URL` | **`connected`** |
| `llmProviders` | `[]` until keys set | **`["openai"]`** (or anthropic/gemini) |
| Pillow `lifecycle` | **`running`** (markers + `/app`) | **`running`** |
| CORS | localhost until `CORS_ORIGIN` set | **frontend origin** |

### Post-push verification commands

```bash
curl -s https://empireai-production.up.railway.app/health
curl -s https://empireai-production.up.railway.app/api/pillow/health
curl -sI -H "Origin: https://YOUR-FRONTEND.vercel.app" https://empireai-production.up.railway.app/health | grep -i access-control
```

---

## 6. Production Certification Criteria

| Criterion | Required value | Pre-068 | Post-068 (foundation) | Post-secrets |
|-----------|----------------|---------|----------------------|--------------|
| `GET /health` HTTP | 200 | ✅ | ✅ | ✅ |
| `status` | `ok` | ✅ | ✅ | ✅ |
| `brain` | `online` | ✅ | ✅ | ✅ |
| `redisMode` | `connected` | ❌ degraded | ❌ until Upstash | ✅ |
| `llmProviders` | non-empty | ❌ | ❌ until keys | ✅ |
| Pillow `lifecycle` | `running` | ❌ error | ✅ expected | ✅ |
| CORS | frontend origin | ❌ localhost | ❌ until set | ✅ |

**Foundation certification (REAL-068 commit):** Pillow repo-root + Railway defaults — **CERTIFIED pending deploy verification**.

**Full autonomous certification:** Apply `deployment/railway-production.env.template` in Railway → redeploy → re-run §6 checks → **CERTIFIED**.

---

## 7. Operator Checklist (Railway Dashboard)

1. Open Railway project → Brain API service → **Variables** → **RAW Editor**.
2. Paste contents of `deployment/railway-production.env.template` with real values.
3. Attach volume at `/data` if not already mounted.
4. **Deploy** staged variable changes.
5. Verify §6 health probes.
6. Set Vercel `VITE_API_BASE_URL=https://empireai-production.up.railway.app` (or custom domain).

---

## 8. Recommended Next Mission

**REAL-069 — Production Secrets Activation & Full Certification Loop**

Automated post-deploy verification after Railway secrets import; end-to-end browser CORS test from Vercel frontend; worker service env parity check.

---

**End of REAL-068 certification document.**
