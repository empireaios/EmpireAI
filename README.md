# EmpireAI

**An AI Operating System for entrepreneurs.**

EmpireAI is a sovereign platform where founders manufacture and operate autonomous companies through a unified Brain orchestration layer.

## Active applications

| Directory | Purpose | Status |
|-----------|---------|--------|
| `empireai-web/` | Next.js 16 platform UI + BFF (`/api/*`) | **Primary UI** |
| `backend/` | EmpireAI Brain — Fastify API, Guardian, domain layer | **Production core** |
| `frontend/` | Legacy Vite app | Not wired to Brain |
| `docs/` | Architecture and engineering docs | Active |
| `deployment/` | Docker Compose and deploy guides | Active |

## Quick start

```bash
# Redis
redis-server

# Brain (port 4000)
cd backend && npm install && npm run dev

# Web (port 3000)
cd empireai-web && npm install && npm run dev
```

Login: `founder@empireai.com` / `EmpireAI2026!`

## Architecture

All platform modules communicate exclusively through the Brain:

```
UI → /api/brain/dispatch → Orchestrator → Tools / Agents / Workflows
                              ↑
                         Guardian Engine
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design.

## Validation

```powershell
cd backend
.\scripts\validate-phase25.ps1
```

## Docker

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
