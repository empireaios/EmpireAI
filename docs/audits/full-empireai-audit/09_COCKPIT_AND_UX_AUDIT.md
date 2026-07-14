# 09 — Cockpit and UX Audit

**Primary Cockpit:** `empireai-web/` (Next.js 16)  
**Alternate/legacy:** `frontend/` (Vite SPA)  
**Production URL (documented):** https://empire-ai.co

---

## Cockpit Structure

**53 pages** under `empireai-web/app/(cockpit)/cockpit/`:

| Department | Example routes |
|------------|----------------|
| command | Executive Home entry |
| missions | Mission centre |
| intelligence | products, markets, risk, discovery |
| commerce | store, ads, marketing, workspace |
| operations | orders, fulfillment, support, automation |
| finance | profit, P&L, billing |
| workforce | agents, missions |
| governance | policies, soul, audit |
| development | pillow, approvals, learning |
| infrastructure | health, deployments, integrations |

**Entry page:** `cockpit/page.tsx` → `ExecutiveHomePage`

---

## Auth Guard

**Middleware:** `empireai-web/middleware.ts`
- Requires `empireai_session` cookie for `/cockpit/*` and `/platform/*`
- `/` → `/cockpit` (session) or `/login`
- Legacy `/platform/*` → 308 redirect to `/cockpit/*`
- Stale cookie fix deployed (`ea85685`) — invalid session clears cookie

**Login:** `app/(auth)/login/page.tsx` — "Grand King Access", default `founder@empireai.com`

---

## BFF Layer (Browser → Brain)

| BFF route | Brain upstream | Timeout |
|-----------|----------------|---------|
| `POST /api/auth/login` | `/auth/login` | 20s |
| `GET /api/auth/me` | `/auth/me` | default |
| `POST /api/auth/logout` | `/auth/logout` | default |
| `POST /api/brain/dispatch` | `/brain/dispatch` | 55s |
| `GET /api/brain/events` | SSE stream | passthrough |
| `/api/pillow/[...path]` | `/api/pillow/*` | 10s health, 58s chat |

**Proxy implementation:** `empireai-web/lib/brain/server-proxy.ts`

---

## Executive Home Flow

1. User lands `/cockpit` after login
2. Client calls `POST /api/brain/dispatch` `{module:"executive-home",action:"load"}`
3. Brain assembles view async (~1–15s cold, ~0–8s warm cached)
4. UI renders command snapshot, KPIs, timeline, Pillow supervisor panel

**Fallback UI:** `_fallback: true` in response when timeout — minimal view served

---

## Pillow Panel UX

**Client:** `empireai-web/lib/pillow/client.ts` → BFF `/api/pillow/*`

Flow:
1. Create session (may 503 while Pillow booting — retry)
2. Send chat messages
3. Display replies / loading states

**Known issues addressed:**
- 504 on chat → BFF timeout raised to 58s (`c6c0003`)
- Failed to fetch → BFF proxy fix (`ec335d1`)
- Pillow never responds → Brain event-loop fixes (`9e51bc7`)

---

## UX Debt & Placeholders

| Location | Issue |
|----------|-------|
| `GovernancePanels.tsx` | SCR-700/701/703 "not yet implemented" |
| `DevelopmentPanels.tsx` | SCR-803 Executive Learning not implemented |
| `intelligence/discovery/page.tsx` | Research missions not implemented |
| `*Placeholder.tsx` widgets | KPI, mission queue, command snapshot placeholders |
| `CockpitInteractionDrawer.tsx` | "Brain bridge · framework only" |
| `missionPlaceholderData.ts` | Demo mission data including Cursor REAL-087 |

**TODO/FIXME in empireai-web:** 0 matches — debt expressed as placeholder components and copy.

---

## frontend/ vs empireai-web/

| Aspect | frontend/ | empireai-web/ |
|--------|-----------|---------------|
| Deploy (root vercel.json) | ✅ Primary build | Separate vercel.json |
| Active routes | `/`, `/login` + redirects | Full cockpit |
| Pillow UI | Legacy companion context | Active development panel |
| API pattern | Direct Brain | BFF proxy |

**Drift:** Deployment docs call `frontend/` founder UX contract; Grand King production journey tests use `empire-ai.co` which may route to either depending on Vercel project config.

---

## Production User Journey

| Step | Status (automated) | Browser |
|------|---------------------|---------|
| Login | ✅ PASS | 🟡 King confirmation |
| Executive Home load | ✅ PASS | 🟡 |
| Pillow 3 replies | ✅ PASS | 🟡 |
| Long-run stability (3 cycles) | ✅ PASS (`production-long-run-stability.mjs`) | 🟡 |
| Leave and return | ✅ in automated test | 🟡 |

---

## Cockpit Health Summary

| Dimension | Assessment |
|-----------|------------|
| Information architecture | **Strong** — 53 pages, department structure |
| Production journey | **Working** (automated evidence) |
| Panel completeness | **Partial** — many placeholders |
| Loading/error UX | **Improved** — fallback views, retry on Pillow 503 |
| Single UX authority | **Unclear** — dual frontend |
| Alignment with UID doctrine | **Partial** — placeholders vs contract |
