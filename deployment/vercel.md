# Vercel — Frontend deployment

EmpireAI Version 1 deploys the **founder UX** (`frontend/`) to Vercel. The Brain API runs on **Railway**, not Vercel serverless.

---

## Project setup

1. **Import** the GitHub monorepo in Vercel.
2. **Framework preset:** Other (uses root `vercel.json`).
3. **Root directory:** repository root (default).

Root `vercel.json` builds only the Vite frontend:

| Setting | Value |
|---------|-------|
| Install | `npm install --prefix frontend` |
| Build | `npm run build --prefix frontend` |
| Output | `frontend/dist` |

---

## Required environment variables

Set in Vercel → Project → Settings → Environment Variables:

| Name | Scope | Value |
|------|-------|-------|
| `VITE_API_BASE_URL` | Production, Preview | `https://<your-railway-brain-url>` |

`VITE_API_BASE_URL` is **build-time**. Redeploy after changing it.

Copy from `frontend/.env.example`:

```env
VITE_API_BASE_URL=https://your-brain-service.up.railway.app
```

---

## How API routing works

The frontend `apiRequest` client prefixes all Brain calls with `VITE_API_BASE_URL`:

- `/integrations-hub/dashboard` → `https://brain…/integrations-hub/dashboard`
- `/api/pillow/status` → `https://brain…/api/pillow/status`
- `/global-notifications` → `https://brain…/global-notifications`

No Vercel API rewrites are required in the split-stack model. This avoids the legacy serverless path mismatch where `/api/pillow/*` was stripped incorrectly.

---

## CORS and cookies

1. Set Railway Brain `CORS_ORIGIN` to your Vercel URL, e.g. `https://app.vercel.app` or custom domain.
2. Frontend uses `credentials: "include"` — session cookies are set by Brain on the Railway origin; cross-origin cookie rules apply.
3. For custom domains, align `CORS_ORIGIN` exactly with the browser origin.

---

## Custom domain

1. Vercel → Domains → add domain.
2. Update Brain `CORS_ORIGIN` to the custom domain.
3. Redeploy Vercel if `VITE_API_BASE_URL` uses a custom Brain subdomain.

---

## Preview deployments

For preview branches, either:

- Point `VITE_API_BASE_URL` to a Railway **staging** Brain, or
- Use the production Brain URL (read-only smoke tests only).

---

## Local development parity

```bash
cd frontend
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:4000
npm run dev
```

With `VITE_API_BASE_URL` set, local dev matches production split-stack behavior without Vite proxy configuration.

---

## Legacy: monolithic Vercel (not recommended)

The repository includes `api/[...path].ts` for serverless Brain hosting. **Do not use for V1 production:**

- Ephemeral SQLite on `/tmp`
- No BullMQ worker or scheduler
- Incomplete API rewrite list vs `frontend/vite.config.ts`
- Pillow `/api/pillow` path stripping bug

Use Railway for Brain. See [MANAGED_DEPLOYMENT.md](./MANAGED_DEPLOYMENT.md).

---

## Verification checklist

- [ ] Production deploy succeeds; `frontend/dist` served
- [ ] Login page loads
- [ ] Founder login succeeds (Brain reachable)
- [ ] Mission Home loads KPI data
- [ ] Pillow status panel loads
- [ ] Integrations Hub dashboard loads
