# 01 — Repository Inventory

**Scan date:** 2026-07-14  
**Git commits:** 125+ (post PRE-G integrity commit)  
**TypeScript/TSX files (excl. node_modules/dist):** ~6,796  
**Markdown files (excl. node_modules):** ~819  
**Test files (`*.test.ts`):** 461 (backend validation 259, pillow validation 201, plus web/frontend)  

---

## Top-Level Map

| Path | Files (approx) | Purpose | Active / Obsolete / Unclear |
|------|----------------|---------|----------------------------|
| `backend/` | 3,373+ `.ts` in `src/` | Brain API, REAL modules, Pillow host, Guardian, workers | **Active** — Railway production |
| `pillow/` | Package + **198** registered subsystems | Executive intelligence runtime library | **Active** — linked into backend |
| `empireai-web/` | 53+ cockpit pages + BFF | Next.js Cockpit + `/api/*` proxy | **Active** — alternate production UI |
| `frontend/` | ~188 src files | Vite founder SPA | **Active** — Vercel per root `vercel.json`; dashboard redirects |
| `docs/` | 200+ markdown | Governance, EI library, architecture, cockpit specs, audits | **Active canonical** |
| `artifacts/` | 130+ files | Executive audits, certifications, evidence JSON | **Historical evidence** |
| `deployment/` | 8+ files | Managed cloud guides + env templates | **Active** |
| `scripts/` | Root automation | Pillow governance sync, bridge export generators, build bible PDF | **Active** |
| `ai-agents/` | README only | Placeholder | **Stub** |
| Root `*.md` | 115+ | Constitutions, roadmaps, combined audits, reports | **Mixed canonical + historical** |

**Not present:** `packages/` workspace (monorepo uses folder prefixes).

**Excluded from Git (by design):** `.env*`, `node_modules/`, `dist/`, `.cursor/`, `.empire/`, `.pillow-*/`, local `*.db`, logs, `backend/.pillow-governance-bundle/`.

---

## Backend `src/` by Domain

| Subfolder | `.ts` count | Domain |
|-----------|------------:|--------|
| `orchestration/` | 1,044 | Pillow host, business engines, reality integration, commerce |
| `runtime/` | 613 | REAL-100+ runtime modules |
| `execution/` | 586 | Store deployment, CJ fulfillment, meta ads, publishing |
| `validation/` | 260 | Test harness specs |
| `intelligence/` | 174 | Product/market/supplier intelligence engines |
| `eye/` | 149 | Connectors (Amazon, Google Trends, etc.) |
| `foundation/` | 134 | Soul, doctrine, constitution, KPI, policy |
| `revenue/` | 101 | Payment, revenue loop, Grand King's revenue |
| `brain/` | 30 | Core Brain composition, LLM, SQLite, audit |
| `auth/` | 6 | Login, sessions, permissions |
| `domain/` | 34 | Executive Home, cockpit panel views |
| `agents/` | 23 | Agent definitions, module routes, tools |

**Entry points:** `backend/src/index.ts`, `app.ts`, `worker.ts`.

**Route registrars in `app.ts`:** ~160 modules; production defaults to **cockpit-critical only** unless `EMPIRE_ENABLE_EXTENSION_ROUTES=true`.

---

## Pillow Package (`pillow/src/`)

**Registered subsystems:** **198** (see `pillow/src/orchestrator/subsystem-registry.ts`).  
Each subsystem typically has `index.ts`, validation tests, and optional CLI.

**Representative core subsystems:** bootstrap, context, intelligence, memory, planner, supervisor, recovery, orchestrator, openai, repository-intelligence, cursor-bridge, commerce-intelligence, empire-commander, empire-operating-system, continuous-evolution, plus 180+ executive/commerce/UX engines added through REAL and Pillow expansion missions.

**Bridge exports:** `pillow/src/index.ts` — targeted export blocks for backend `@empireai/pillow` consumption (146 bridge targets).

**Validation tests:** 201 files under `pillow/src/validation/tests/`.

**Integration:** `backend/src/orchestration/pillow-host/` hosts Pillow in-process.

---

## Frontend Surfaces

### `frontend/` (Vite)
- Routes: `/`, `/login`; `/dashboard/*` → Cockpit redirect
- Legacy pages still in tree (~50+ dashboard pages)
- API: direct to Brain via `VITE_API_BASE_URL`

### `empireai-web/` (Next.js)
- `(cockpit)/cockpit/*` — primary executive UI
- `(platform)/platform/*` — legacy, redirected to cockpit
- BFF: `app/api/auth/*`, `app/api/pillow/*`, `app/api/brain/*`
- Middleware: session cookie gate for `/cockpit/*`

---

## Configuration & Deploy

| File | Purpose |
|------|---------|
| `railway.toml` | Brain build/start, health `/health/live` |
| `vercel.json` (root) | Builds `frontend/dist` |
| `empireai-web/vercel.json` | Next.js cockpit deploy |
| `docker-compose.yml` | Local optional stack |
| `backend/Dockerfile` | Container image |

---

## Data & Persistence

| Store | Location | Notes |
|-------|----------|-------|
| SQLite (primary Brain DB) | `backend/src/brain/sqlite-database.ts` | sql.js, debounced persist |
| Postgres migration infra | `backend/src/brain/postgres/` | REAL-132; not primary path |
| Redis sessions | Upstash in production | Degraded → in-memory |
| Pillow chat sessions | In-memory `PillowSessionStore` | Ephemeral |

---

## Key Canonical Navigation Files

- `EMPIREAI_REPOSITORY_MASTER_INDEX.md` — master catalog
- `JOURNEY.md` — living operational index
- `EMPIREAI_STATUS.md` — implemented state snapshot
- `EMPIREAI_DECISIONS.md` — ADR register (ADR-001→051)
