# 06 — Architecture Map

---

## System Context

```
┌─────────────────┐     BFF (empireai-web)      ┌──────────────────────────────┐
│  Grand King     │ ───────────────────────────►│  Brain (Fastify/Railway)      │
│  Browser        │     /api/auth, /api/pillow  │  ├─ createBrain()             │
│                 │     /api/brain/dispatch     │  ├─ PillowHost (in-process)   │
└─────────────────┘                             │  ├─ Orchestrator (dispatch)    │
        │                                       │  ├─ Guardian                   │
        │  optional direct                      │  ├─ LLMRouter                  │
        ▼                                       │  └─ 160+ route modules*        │
┌─────────────────┐                             └───────────┬──────────────────┘
│  frontend/ SPA  │ ─── VITE_API_BASE_URL ─────────────────►│
│  (Vercel)       │                                         │
└─────────────────┘                             ┌───────────▼──────────────────┐
                                                │  Upstash Redis (sessions/queue)│
                                                │  SQLite volume (Brain DB)      │
                                                └────────────────────────────────┘

* Extension routes: production OFF unless EMPIRE_ENABLE_EXTENSION_ROUTES=true
```

---

## Major Architecture Domains

| Domain | Path | Depends on | Depended on by |
|--------|------|------------|----------------|
| **Brain core** | `backend/src/brain/` | env, SQLite, Redis | All HTTP, Pillow |
| **Auth** | `backend/src/auth/` | Redis/in-memory sessions, SQLite users | Every protected route |
| **Orchestration** | `backend/src/orchestration/` | Brain, SQLite | Dispatch, business engines |
| **Runtime (REAL)** | `backend/src/runtime/` | Brain tools, SQLite | Cockpit panels via dispatch |
| **Execution** | `backend/src/execution/` | Suppliers, Stripe, CJ | Commerce flows |
| **Intelligence** | `backend/src/intelligence/` | Eye connectors, SQLite | G3 engines, dispatch |
| **Foundation** | `backend/src/foundation/` | SQLite | Governance modules |
| **Eye** | `backend/src/eye/` | External APIs | Product intelligence |
| **Revenue** | `backend/src/revenue/` | Payment engines | Grand King revenue |
| **Guardian** | `backend/src/guardian/` | Brain health probes | `/health`, risk registry |
| **Agents** | `backend/src/agents/` | Tool registry, orchestrator | Module routes, workflows |
| **Pillow package** | `pillow/src/` | OpenAI via adapter | PillowHost |
| **Cockpit** | `empireai-web/` | BFF → Brain | Grand King UX |
| **Domain views** | `backend/src/domain/` | Many orchestration services | Executive Home |

---

## Request Flows

### Login
`POST /api/auth/login` (BFF) → `POST /auth/login` (Brain) → SQLite user lookup → Redis session → cookie `empireai_session`

### Executive Home
`POST /api/brain/dispatch` `{module:"executive-home",action:"load"}` → orchestrator → `loadExecutiveHomeForDispatch()` → async assembly with cooperative yields → 60s cache

### Pillow Chat
`POST /api/pillow/session` → lazy Pillow boot → `POST /api/pillow/chat` → `routePrompt()` → production minimal context → LLMRouter → OpenAI (45s timeout)

### Brain Dispatch (generic)
`POST /brain/dispatch` → `brain.orchestrator.dispatch()` → tool/agent/workflow registry

---

## Data Architecture

| Store | Technology | Scope |
|-------|------------|-------|
| Brain DB | sql.js SQLite | Users, audit, commerce, governance, approvals |
| Sessions | Redis (ioredis) | Auth tokens; degraded = in-memory |
| Pillow chat | In-memory Map | Per workspace session; ephemeral |
| Task queue | BullMQ | Background jobs; degraded = no-op |
| Event bus | Redis pub/sub or local | SSE `/brain/events/stream` |
| Postgres | Optional pool | Migration path REAL-132 |

---

## Deployment Architecture

| Tier | Platform | Artifact |
|------|----------|----------|
| Brain API | Railway | `backend/dist/index.js` |
| Brain worker | Railway (optional) | `backend/dist/worker.js` |
| Founder SPA | Vercel | `frontend/dist` (root vercel.json) |
| Cockpit | Vercel (separate project) | `empireai-web` standalone |
| Redis | Upstash | REDIS_URL |
| DB backup | Supabase | Documented in deployment |

---

## Architecture Drift vs Canonical Target

**Canonical:** `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md` (REAL-078 normative target)

| Area | Canonical intent | Repository reality |
|------|------------------|-------------------|
| Single control plane | Unified Brain | ✅ Brain exists; routes split critical vs extension |
| Pillow-owned hierarchy | Pillow supervises engineering | 🟡 Full in dev; production minimal chat |
| Postgres persistence | Scalable DB | 🟡 SQLite primary |
| Full module HTTP surface | All REAL APIs live | ❌ Gated off in production default |
| One founder UX | Single cockpit | 🟡 Two frontends |

---

## Health & Observability

| Endpoint | Purpose |
|----------|---------|
| `/health/live` | Liveness + event loop lag + SQLite flush stats |
| `/health` | Full Brain health + Guardian + queue |
| `/metrics` | Admin observability |
| `/api/pillow/health` | Pillow lifecycle + governance knowledge |

Event loop cooperative module: `backend/src/runtime/event-loop-cooperative.ts`

---

## Architecture Health Summary

| Dimension | Rating | Reason |
|-----------|--------|--------|
| Modularity | **Strong** | 160+ route modules, clear folders |
| Documentation | **Strong volume, moderate clarity** | Many overlapping docs |
| Production fit | **Moderate** | Single-process SQLite, route gating |
| Scalability | **Limited** | sql.js, in-memory Pillow sessions |
| Test coverage breadth | **Strong** | 285 test files |
| Alignment to canonical | **Partial** | Known drift items above |
