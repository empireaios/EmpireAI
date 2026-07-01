# EmpireAI

**An AI-powered e-commerce operating system** — with the first commercial model focused on **global dropshipping** — where founders manufacture and operate autonomous companies through a unified Brain orchestration layer.

Commercial launch decisions require **Commercial Risk Intelligence (CRI)** certification per `docs/governance/COMMERCIAL_RISK_INTELLIGENCE_DOCTRINE.md`.

## Active applications

| Directory | Purpose | Status |
|-----------|---------|--------|
| `frontend/` | Founder UX — Mission Home, Pillow, GC shell, REAL dashboards | **Production UI (Vercel)** |
| `backend/` | EmpireAI Brain — Fastify API, Guardian, REAL modules, Pillow host | **Production core (Railway)** |
| `empireai-web/` | Next.js alternate UI + BFF | Secondary / legacy |
| `pillow/` | Pillow runtime package (`@empireai/pillow`) | In-process in Brain |
| `docs/` | Architecture and engineering docs | Active |
| `deployment/` | Managed cloud + optional Docker guides | Active |

## Version 1 production (managed cloud)

| Layer | Platform |
|-------|----------|
| Frontend | Vercel |
| Backend | Railway |
| Database | SQLite on Railway volume (+ Supabase Storage backup) |
| Redis | Upstash |

**Deploy guide:** [deployment/MANAGED_DEPLOYMENT.md](deployment/MANAGED_DEPLOYMENT.md)

Docker and VPS are **optional** — not required for Version 1.

## Quick start (local)

```bash
# Redis (local or Upstash URL in backend/.env)
redis-server

# Brain (port 4000)
cd backend && cp .env.example .env && npm install && npm run dev

# Founder UX (port 5173)
cd frontend && cp .env.example .env && npm install && npm run dev
```

Login: `founder@empireai.com` / `EmpireAI2026!`

## Architecture

All platform modules communicate exclusively through the Brain:

```
UI → Brain API → Orchestrator → Tools / Agents / Workflows
                      ↑
                 Guardian Engine
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design.

## Validation

```powershell
cd backend
npm run validate:full
```

## Optional: Docker Compose

```bash
docker compose up --build
```

See [deployment/README.md](deployment/README.md).

## Principles

- **Brain-only control** — No direct LLM or tool calls from the frontend
- **Guardian safety** — Every dispatch validated; database integrity sacred
- **Modular domain** — SQLite-backed repositories, replaceable subsystems
- **Verified milestones** — Typecheck, tests, and integration probes before release

## License

TBD.
