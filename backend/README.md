# Backend — EmpireAI Brain

Core server and **EmpireAI Brain** — the AI orchestration layer that powers every platform module.

## Architecture

All AI modules communicate exclusively through the **Orchestrator** (`POST /brain/dispatch`).

```
Frontend Module → Orchestrator → Agent Manager / Workflow Engine
                      ↓
              Task Queue (BullMQ + Redis)
                      ↓
              Background Workers
                      ↓
         Tool Registry · LLM Router · Decision Engine
                      ↓
              Memory Store · Audit Logs · Event Bus
```

### Core components

| Component | Path | Role |
|-----------|------|------|
| AI Orchestrator | `src/brain/orchestrator.ts` | Single entry point for all module actions |
| Agent Manager | `src/brain/agent-manager.ts` | Pluggable agent registry and execution |
| Task Queue | `src/brain/task-queue.ts` | BullMQ job queue with priorities |
| Memory System | `src/brain/memory/memory-store.ts` | Persistent scoped memory (SQLite) |
| Event Bus | `src/brain/events/event-bus.ts` | Redis pub/sub inter-agent events |
| Decision Engine | `src/brain/decision-engine.ts` | L0–L4 authority evaluation |
| Workflow Engine | `src/brain/workflow-engine.ts` | DAG workflow execution |
| Tool Registry | `src/brain/tools/tool-registry.ts` | Extensible tool definitions |
| LLM Provider Layer | `src/brain/llm/` | OpenAI, Anthropic, Gemini with routing |
| Scheduler | `src/brain/scheduler.ts` | Cron-based repeat jobs |
| Background Workers | `src/brain/workers/` | Async task processors |
| Audit Logs | `src/brain/audit/audit-logger.ts` | Immutable audit trail (SQLite) |
| **Guardian Engine** | `src/guardian/` | Health monitoring, unsafe action blocking, risk/recovery |
| **Domain Layer** | `src/domain/` | SQLite-backed companies, orders, portfolio data |
| **Observability** | `src/observability/` | Request metrics and `/metrics` endpoint |

### Adding a new agent (no core changes)

1. Define tools in `src/agents/tools/`
2. Register agent in `src/agents/definitions/agents.ts`
3. Add orchestrator route in `src/agents/routes/module-routes.ts`

## Setup

```bash
cd backend
npm run setup          # install + verify tsx, typescript, sql.js (no Python/node-gyp)
```

From repository root:

```bash
npm run setup          # same as above via workspace script
npm run architect:report
```

Windows one-shot setup:

```powershell
.\scripts\setup-dev-environment.ps1
```

Requires **Node.js 20+**. No Python or Visual Studio Build Tools required for SQLite (uses `sql.js` WASM).

```bash
cp .env.example .env
# Configure at least one LLM API key
# Redis is optional in development — see Run section below
```

## Run

### Without Redis (local degraded mode)

In `NODE_ENV=development` (default), the API starts even when Redis is not running. Queue, event pub/sub, and sessions fall back to in-memory stubs. Sync `/brain/dispatch` routes still work; async/background jobs are logged but not processed.

```bash
npm run dev
```

You will see one startup warning:

`Redis unavailable — running in local degraded mode (queue/events/sessions in-memory). Start Redis with: docker run ... or npm run dev:redis`

### With Redis (full mode)

Start Redis in a separate terminal, then run the API:

```bash
# Option A — npm script (Docker)
npm run dev:redis

# Option B — repo root docker compose
docker compose up redis -d

# Option C — direct Docker
docker run --rm -p 6379:6379 redis:7-alpine
```

```bash
npm run dev
```

### Other commands

```bash
# API + embedded workers (same as npm run dev)
npm run dev

# Dedicated worker process (production)
npm run dev:worker
```

API default: `http://localhost:4000`

### Degraded vs full mode

| Capability | Degraded (no Redis) | Full (Redis running) |
|------------|---------------------|----------------------|
| Auth / sessions | In-memory (lost on restart) | Redis-backed |
| Sync `/brain/dispatch` | Works | Works |
| Async / queued tasks | Logged only, not processed | BullMQ workers process jobs |
| Event bus | Local in-process only | Redis pub/sub across processes |
| Cron scheduler | Registered in logs only | Repeat jobs in BullMQ |
| `/health` | `redisMode: "degraded"` | `redisMode: "connected"` |

Production (`NODE_ENV=production`) requires Redis unless `REDIS_OPTIONAL=true`.

## Key endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Brain health, queue stats, LLM providers |
| POST | `/brain/dispatch` | Route module action through orchestrator |
| GET | `/brain/agents` | List registered agents |
| GET | `/brain/tools` | List registered tools |
| GET | `/brain/audit?workspaceId=` | Query audit logs |
| GET | `/brain/memory?scope=&workspaceId=` | Query memory records |
| GET | `/metrics` | Request observability snapshot (admin) |
| GET | `/guardian/health` | Full Guardian subsystem health report (auth) |
| GET | `/guardian/risks` | Open Guardian risks (admin) |
| POST | `/guardian/risks/:riskId/resolve` | Resolve a Guardian risk (admin) |

## Phase 2.5 — Validation & Guardian

Run Brain validation (unit + integration probes):

```bash
npm run test          # node:test suite
npm run validate      # full JSON validation report
npm run validate:full # typecheck + validate
```

Validation uses an isolated SQLite DB at `./data/validation/empireai-validation.db`.
Integration checks require Redis; they are skipped gracefully if Redis is unavailable.

Windows gate script:

```powershell
.\scripts\validate-phase25.ps1
```

Produces `phase25-report.json` and `phase25-results.txt`.

## Dispatch example

```json
POST /brain/dispatch
{
  "module": "intelligence",
  "action": "scan",
  "workspaceId": "ws_123",
  "companyId": "co_456",
  "payload": { "objective": "Scan wireless accessories category" }
}
```
