# EMPIREAI BRAIN ARCHITECTURE

> **Classification:** CANONICAL — Tier 5 Normative Architecture (Brain)  
> **Document ID:** P3-01  
> **Constitutional phase:** P3 — Architecture Foundation  
> **Dependencies:** P1 complete · P2 complete · Architecture Law (P2-05) · Canonical Architecture  
> **Owner:** Pillow (constitutional) · Chief Architect (normative maintainer)  
> **Authority:** CANONICAL — single permanent Brain architecture; **subordinate to CTD · Architecture Law · Pillow Constitution §17**  
> **Parent:** [`EMPIREAI_ARCHITECTURE_LAW.md`](./EMPIREAI_ARCHITECTURE_LAW.md) · [`EMPIREAI_CANONICAL_ARCHITECTURE.md`](./EMPIREAI_CANONICAL_ARCHITECTURE.md) §3.3  
> **Ratified:** 2026-07-05 (P3-01)  
> **Role:** Permanent architecture of the Brain execution engine — reconstructed from repository, not a rewrite

**Operational snapshot:** [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) · [`backend/README.md`](../../backend/README.md)  
**Runtime evidence:** [`docs/audits/full-empireai-audit/08_BRAIN_AND_RUNTIME_AUDIT.md`](../audits/full-empireai-audit/08_BRAIN_AND_RUNTIME_AUDIT.md) (EVIDENCE)  
**Platform placement:** [`EMPIREAI_HIERARCHY.md`](../governance/EMPIREAI_HIERARCHY.md) — Brain = Tier 5 execution

---

## 1. Purpose

The **Brain** is EmpireAI's **execution engine**. It **executes** constitutional intent. It **does not own** Vision, Soul, Constitution, Architecture, or Governance.

| Brain IS | Brain IS NOT |
|----------|--------------|
| Mandatory orchestration kernel | A peer of Pillow |
| Dispatch path for tools, agents, workflows | Owner of Vision or Soul |
| Auth + session host for API | Constitutional law body |
| Persistence adapter (SQLite today) | Executive UI (Cockpit) |
| Guardian pre-dispatch gate | Pillow supervisor (planning) |
| LLM routing boundary | Builder (Cursor implementation channel) |

**The principle:** Pillow owns · Brain executes · Cockpit visualises · Guardian protects · Governance evaluates.

---

## 2. Constitutional Relationships

```
Vision · Soul (WHY · WHO — inform; Brain does not own)
        ↓
CTD · Engineering Constitution · ACD (law — Brain enforces via tools, never authors)
        ↓
Architecture Law · Canonical Architecture · this document (HOW Brain is shaped)
        ↓
Brain runtime (backend/) — executes
        ↓
Production Truth · STATUS (what runs live)
        ↓
Evidence (audits — proof only)
```

| System | Relationship to Brain |
|--------|----------------------|
| **Vision · Soul** | Brain reads context via tools; never amends identity |
| **CTD · Constitutions** | Foundation tools expose CTD/GVD/ACD read-only; Guardian blocks violations |
| **Roadmap** | Brain implements REAL missions; does not set programme priority |
| **Pillow** | **Constitutional owner** — hosts HTTP routes, EKLS, approval bridge |
| **Cockpit** | BFF → `/brain/dispatch`; never calls LLM directly |
| **Builder (Cursor)** | Indirect via Pillow approval; no direct Brain auth bypass |
| **Supervisor** | Pillow package (`pillow/src/supervisor/`); supervises missions, not dispatch |
| **Guardian** | Pre-dispatch module inside Brain path (`backend/src/guardian/`) |
| **Commerce · Business Engines** | Register Brain tools + optional REST; executed via Orchestrator |
| **Production** | Railway Brain process · Redis · SQLite volume |

---

## 3. Ownership & Stewardship

| Role | Accountability |
|------|----------------|
| **Pillow** | Constitutional owner of Brain subsystem |
| **Chief Architect** | Normative architecture (this document, Canonical Architecture §3.3) |
| **Brain runtime** | Executor — `backend/src/brain/` + Fastify app |
| **Grand King** | Irreversible approvals (L3+ authority, founder gates) |
| **Domain maintainers** | Tool + route registration for their engines |

**Rule:** One owner (Pillow). One dispatch entry point (`POST /brain/dispatch`). No duplicate orchestration surfaces.

---

## 4. Architectural Principles

| # | Principle | Implementation |
|---|-----------|----------------|
| 1 | **Single responsibility** | Brain = execution only; governance in Foundation; intelligence in engines |
| 2 | **Clear interfaces** | Dispatch contract, tool registry, module routes, REST registrars |
| 3 | **No circular dependencies** | Orchestrator → tools → repositories; not tools → orchestrator |
| 4 | **Composable services** | 200+ tools; agents/workflows compose tools |
| 5 | **Asynchronous execution** | BullMQ queue + worker pool (optional at boot) |
| 6 | **Event-driven** | Redis pub/sub EventBus + SSE `/brain/events/stream` |
| 7 | **Production-first** | Critical routes first; extension routes deferred |
| 8 | **Browser-first acceptance** | Grand King journeys via Cockpit → BFF → dispatch |
| 9 | **Fail-safe execution** | Guardian + Governance engines pre-dispatch |
| 10 | **Graceful degradation** | Redis/SQLite/queue fallbacks with explicit logging |

---

## 5. System Architecture

### 5.1 Layer diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│ COCKPIT · BUILDER SURFACES (never execute directly)                      │
│  empireai-web · frontend/  →  BFF /api/brain/*  →  Brain HTTP           │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ HTTPS
┌───────────────────────────────────▼─────────────────────────────────────┐
│ HTTP LAYER — Fastify (`backend/src/app.ts`)                              │
│  Auth · Health · Metrics · Guardian routes · Pillow routes (critical)    │
│  /brain/dispatch · /brain/events/stream · ~150 extension REST (opt-in)   │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────┐
│ API / COMMAND PIPELINE                                                   │
│  authenticate → role/module gate → dispatchSchema → Orchestrator       │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
  Governance Engine            Guardian Engine              Decision Engine
  (Foundation)               (pre-dispatch)               (L0–L4 authority)
        └───────────────────────────┼───────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ ORCHESTRATOR (`brain/orchestrator.ts`)                                   │
│  module:action routing → agent | workflow | tool | async queue           │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
        ┌───────────────┬───────────┼───────────┬───────────────┐
        ▼               ▼           ▼           ▼               ▼
   Agent Manager   Workflow Engine  Tool Registry  Task Queue  Event Bus
        │               │           │           │               │
        └───────────────┴───────────┴───────────┴───────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
   LLM Router              Memory Store · Audit Logger      Domain Repos
   (OpenAI/Anthropic/      (SQLite scoped)                  (SQLite)
    Gemini)                      │
        └───────────────────────────┴───────────────────────────┘
                                    ▼
                          SQLite (sql.js) · Redis (Upstash)
                          Postgres (future — `brain/postgres/`)
```

### 5.2 Pillow interface (Brain-hosted HTTP)

| Route family | Path prefix | Role |
|--------------|-------------|------|
| Pillow session/chat | `/api/pillow/*` | Pillow Host — lazy boot, LLM via Brain adapter |
| Pillow approval | `/api/pillow/approval/*` | Cursor mission approval bridge |
| Brain dispatch | `/brain/dispatch` | All Cockpit module actions |
| Brain events | `/brain/events/stream` | SSE workspace events |

Pillow package (`pillow/`) is a **library**; Brain **hosts** HTTP. See [`pillow-host/`](../../backend/src/orchestration/pillow-host/).

### 5.3 Cockpit interface

```
User → Next.js module → /api/brain/dispatch (BFF proxy) → Brain
                      → /api/brain/events/stream (SSE)
```

**Forbidden:** Frontend → OpenAI/Anthropic/Stripe directly. ACD · Engineering Constitution · Development Doctrine.

### 5.4 Builder interface

Builder (Cursor) does **not** call Brain in production autonomously. Path:

```
Pillow mission plan → approval queue → Builder executes in repo → Journey sync
```

Brain tools may **read** repository state; Builder scope is governed by Supervisor + Engineering Constitution.

### 5.5 Supervisor interface

Supervisor lives in **Pillow package**, not Brain core. Brain provides audit logs, dispatch, and Pillow routes Supervisor uses indirectly.

---

## 6. Brain Core Modules

**Location:** `backend/src/brain/`

| Module | Path | Responsibility |
|--------|------|----------------|
| **Orchestrator** | `orchestrator.ts` | Single dispatch hub — routes, governance, guardian, audit |
| **Agent Manager** | `agent-manager.ts` | Pluggable agent registry + execution |
| **Workflow Engine** | `workflow-engine.ts` | DAG workflow execution |
| **Tool Registry** | `tools/tool-registry.ts` | 200+ registered tools (L0–L4 authority) |
| **Task Queue** | `task-queue.ts` | BullMQ (`empireai-brain-tasks`) or degraded no-op |
| **Worker Pool** | `workers/worker-pool.ts` | Async job processors (off at production API boot) |
| **Scheduler** | `scheduler.ts` | Cron repeat jobs (off at production API boot) |
| **LLM Router** | `llm/llm-router.ts` | Provider routing · 45s timeout |
| **Decision Engine** | `decision-engine.ts` | Authority level evaluation |
| **Memory Store** | `memory/memory-store.ts` | Scoped session memory (SQLite) |
| **Audit Logger** | `audit/audit-logger.ts` | Append-only dispatch audit |
| **Event Bus** | `events/event-bus.ts` | Redis pub/sub or local |
| **Event Stream** | `events/event-stream.ts` | SSE hub for Cockpit |
| **Database** | `database.ts` · `sqlite-database.ts` | Schema · migrations · debounced persist |
| **Contract layer** | `contract/` | Module IDs · capabilities · intelligence adapters |
| **Postgres (future)** | `postgres/` | Pool + schema subset (REAL-132) |
| **Factory** | `index.ts` | `createBrain()` — wires all components |

---

## 7. Adjacent Execution Layers (Brain-hosted process)

Brain **process** (`backend/`) includes modules that **register tools** consumed by the Orchestrator:

| Layer | Path | Role |
|-------|------|------|
| **Auth** | `auth/` | Sessions · middleware · permissions · `/auth/*` |
| **Guardian** | `guardian/` | Pre-dispatch safety · health monitor · architecture validator |
| **Domain** | `domain/` | Repositories — companies, orders, products, workspace |
| **Agents** | `agents/` | Definitions · module routes · core/module/domain tools |
| **Foundation** | `foundation/` | CTD · doctrines · governance · policy engines (read/enforce) |
| **Orchestration** | `orchestration/` | Pillow host · business engines · certification · Eye series |
| **Runtime** | `runtime/` | REAL domain runtimes (~600+ TS files) |
| **Intelligence** | `intelligence/` | PIE · supplier intelligence · commerce intelligence core |
| **Execution** | `execution/` | Live adapters — payment, CJ, Meta, publishing |
| **Revenue** | `revenue/` | Revenue loops · order pipeline · first dollar |
| **Eye** | `eye/` | External connectors — Amazon, Google Trends |
| **Observability** | `observability/` | `/metrics` · request metrics |
| **Config** | `config/` | env · redis-client · logger |

**Boundary:** These layers **implement** capabilities; **Orchestrator** is the only autonomous execution entry for dispatch.

---

## 8. HTTP & API Layer

### 8.1 Production boot strategy

| Phase | Routes | When |
|-------|--------|------|
| **Always** | `/health/live`, `/health`, `/metrics`, `/auth/*`, Guardian | Immediate |
| **Critical** | `/brain/dispatch`, `/brain/events/stream`, Pillow routes | `earlyListen` production boot |
| **Extension** | ~150 module REST registrars | Deferred — `finishRouteRegistration()` or dev boot |

Extension routes gated by production policy (see Production Truth · CON-007 programme). Tools remain reachable via dispatch even when REST is not registered.

### 8.2 Authentication & sessions

| Component | Implementation |
|-----------|----------------|
| Login | `POST /auth/login` — SQLite users |
| Session store | Redis primary · in-memory fallback |
| Transport | Bearer token or cookie `empireai_session` |
| Middleware | `auth/middleware.ts` — attaches `request.user` |
| Module ACL | `auth/permissions.ts` — `canAccessModule(role, module)` |

### 8.3 Command pipeline (dispatch)

```
POST /brain/dispatch { module, action, payload, workspaceId?, companyId? }
  → authenticate
  → canAccessModule(role, module)
  → workspaceId match
  → GovernanceEngine.assessDispatch (if enabled)
  → GuardianEngine.assessDispatch (if GUARDIAN_ENABLED)
  → auditLogger.write("orchestrator.dispatch")
  → eventBus.publish("request")
  → route: agent | workflow | tool | async queue
  → result + audit
```

Module routes defined in `agents/routes/module-routes.ts` — maps `module:action` → tool/agent/workflow.

---

## 9. Runtime & Persistence

### 9.1 Current production runtime

| Component | Technology | Notes |
|-----------|------------|-------|
| **Process** | Node 20+ · Fastify | Railway `backend/` |
| **Primary DB** | SQLite (sql.js WASM) | `./data/empireai-brain.db` or Railway `/data/` |
| **Queue** | BullMQ + Redis | Upstash `REDIS_URL` |
| **Sessions** | Redis | Ephemeral fallback if degraded |
| **Pub/sub** | Redis EventBus | Inter-agent events |
| **LLM** | OpenAI · Anthropic · Gemini | Via LLMRouter only |

### 9.2 SQLite behaviour

- **Debounced persist:** 250ms batch async flush (event-loop cooperative)
- **Risk:** Crash before flush may lose recent writes (CON-012 programme)
- **Health:** `/health/live` exposes sqlite persist stats

### 9.3 Redis behaviour

- Production expects Redis; `shouldAllowRedisDegradedMode()` false in production config
- Brain **continues degraded** if unreachable — logs error, in-memory sessions, no-op queue
- Queue name: `empireai-brain-tasks`

### 9.4 Future PostgreSQL

- Schema stub: `brain/postgres/schema.sql` (REAL-132 subset)
- Pool: `brain/postgres/pool.ts`
- Migration path documented in Canonical Architecture §4 — not production default today

### 9.5 Workers & scheduler

| Component | Production API boot | Separate worker process |
|-----------|---------------------|-------------------------|
| Worker pool | **Off** (`startWorkers: false`) | Future horizontal scale |
| Scheduler | **Off** (`startScheduler: false`) | Cron via dedicated process |
| Pillow heartbeat | 30s interval when host active | In-process |

---

## 10. Guardian & Governance

### 10.1 Guardian Engine

**Path:** `backend/src/guardian/`

| Check | When |
|-------|------|
| Empty workspace rejection | Pre-dispatch |
| Database integrity (`PRAGMA integrity_check`) | Health + selective dispatch |
| Destructive payload keys | Pre-dispatch |
| L3/L4 authority (`founderApproved`, `confirmed`) | Tool authority match |
| High-risk actions | `payload.confirmed=true` |

Health: `/guardian/health` (authenticated) · 13 subsystem probes on `/health`.

### 10.2 Empire Governance Engine

**Path:** `foundation/empire-governance/`

Evaluates domain policies (marketing, deployment, capital, etc.) **before** Guardian in Orchestrator when enabled. Throws `GovernanceBlockedError` on violation.

---

## 11. Business Engines & Modules

### 11.1 Twelve Cockpit modules (canonical)

| Module | Dispatch | Data source |
|--------|----------|-------------|
| dashboard | `dashboard:load` | Domain portfolio |
| ai-ceo | `ai-ceo:load` | Domain + briefing |
| intelligence | `intelligence:load` | Products |
| suppliers | `suppliers:load` | Suppliers |
| store | `store:*` | Companies + pipeline |
| marketing | `marketing:load` | Campaigns |
| ads | `ads:load` | Ad channels |
| finance | `finance:load` | Computed P&L |
| orders | `orders:load` | Orders |
| support | `support:load` | Tickets |
| settings | `settings:load` | Workspace |
| admin | `admin:load` | Platform metrics |

### 11.2 Tool registration model

All capabilities extend Brain via:

1. Define tools (`*-tools.ts`) with `authorityLevel`
2. Register in `createBrain()` tool array
3. Add `moduleRoutes` entry if Cockpit-facing
4. Optional REST registrar in `app.ts` for non-dispatch clients

**No new capability without tool registration.**

---

## 12. Production Model

### 12.1 Current production architecture

```
Vercel (empireai-web · frontend/) → BRAIN_API_URL → Railway Brain :4000
                                              ↓
                                    Upstash Redis + SQLite volume
```

See [`deployment/MANAGED_DEPLOYMENT.md`](../../deployment/MANAGED_DEPLOYMENT.md) · [`EMPIREAI_PRODUCTION_TRUTH.md`](../governance/EMPIREAI_PRODUCTION_TRUTH.md).

### 12.2 Known limitations (documented, not hidden)

| Limitation | Severity | Programme |
|------------|----------|-----------|
| SQLite single-writer · crash window | Medium | CON-012 |
| Redis degraded continues in prod | Medium | CON-010 |
| Ephemeral sessions if Redis down | High | CON-011 |
| Extension REST not registered by default | By design | CON-007 |
| Workers/scheduler off at API boot | By design | Horizontal scale future |
| Postgres not primary | Future | REAL-132+ |

### 12.3 Scalability strategy (future)

| Stage | Approach |
|-------|----------|
| **Now** | Single Brain instance · debounced SQLite · optional Redis |
| **Next** | Dedicated worker process · enable BullMQ consumers |
| **Future** | Postgres migration · read replicas · multi-instance Brain behind load balancer |

→ Scaling Architecture (P5-05 programme) when authored.

### 12.4 High availability & disaster recovery

| Concern | Current | Target |
|---------|---------|--------|
| **HA** | Single Railway service | Multi-instance + sticky sessions or shared Redis |
| **DR** | SQLite volume backup | Postgres PITR · Empire Recovery Doctrine |
| **Degraded mode** | Explicit logging · no silent pretend-live | Production Truth enforcement |

---

## 13. Lifecycle & Evolution

| Event | Rule |
|-------|------|
| New tool | Register in `createBrain()` + module route if UI-facing |
| New HTTP route | Register in `app.ts` + ESIS · prefer dispatch first |
| Schema change | `brain/database.ts` migration + domain repository update |
| Authority change | ADR + Guardian/DecisionEngine review |
| Structural Brain change | Update **this document** + Canonical Architecture §3.3 |

**Amendment:** Architecture Law §10 — ADR required for boundary changes.

---

## 14. Examples

### Example 1 — Cockpit store manufacture

```
StorePage → POST /api/brain/dispatch { module:"store", action:"manufacture", payload }
  → Orchestrator → store tool → domain repositories → audit log → JSON result
```

### Example 2 — Blocked high-risk ads launch

```
ads:launch with L3 tool, no founderApproved
  → GuardianEngine.assessDispatch → GuardianBlockedError → 403 to Cockpit
```

### Example 3 — Pillow chat (not dispatch)

```
PillowChat → POST /api/pillow/chat → PillowHost → brain.llmRouter (adapter only)
  → stream response · separate from module dispatch path
```

### Example 4 — Wrong pattern (violation)

```
frontend/src/lib/openai.ts → OpenAI API directly
  ✗ Violates single Brain execution path — ACD · Development Doctrine
```

---

## 15. Validation Checklist (P3-01)

| Check | Status |
|-------|--------|
| Aligns with Vision · Soul · CTD | §2 |
| Aligns with Constitution Hierarchy · Engineering Constitution | §2 · §10 |
| Aligns with Architecture Law · Documentation Law | Header · §13 |
| Aligns with Canonical Architecture §3.3 | §5 · merged, not competing |
| Aligns with Repository · Production Truth | §12 |
| No duplicated Brain authority | §3 · single dispatch |
| No conflicting ownership | Pillow owns · Brain executes |
| Module boundaries validated | §6–§7 |
| Dependencies validated | §9 · audit pack cross-check |
| Cross-references completed | §16 Related |

---

## 16. Ratification

| Field | Value |
|-------|-------|
| **Mission** | P3-01 — Brain Architecture |
| **Ratification date** | 2026-07-05 |
| **Next architecture mission** | P3-03 — Cockpit |

---

## Revision History

| Version | Date | Authority | Change |
|---------|------|-----------|--------|
| 1.0.0 | 2026-07-05 | Grand King · P3-01 | Canonical Brain Architecture from repository reconstruction |

---

## Related

- [`EMPIREAI_CANONICAL_ARCHITECTURE.md`](./EMPIREAI_CANONICAL_ARCHITECTURE.md) §3.3 · [`EMPIREAI_ARCHITECTURE_LAW.md`](./EMPIREAI_ARCHITECTURE_LAW.md)  
- [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) · [`backend/README.md`](../../backend/README.md)  
- [`EMPIREAI_PILLOW_CONSTITUTION.md`](../../EMPIREAI_PILLOW_CONSTITUTION.md) §17 · [`EMPIREAI_HIERARCHY.md`](../governance/EMPIREAI_HIERARCHY.md)  
- [`EMPIREAI_COCKPIT_ARCHITECTURE.md`](./EMPIREAI_COCKPIT_ARCHITECTURE.md) (P3-03) · [`EMPIREAI_BUILDER_ARCHITECTURE.md`](./EMPIREAI_BUILDER_ARCHITECTURE.md) (P3-04) · [`EMPIREAI_COMMERCE_ARCHITECTURE.md`](./EMPIREAI_COMMERCE_ARCHITECTURE.md) (P3-05) · [`EMPIREAI_INFRASTRUCTURE_ARCHITECTURE.md`](./EMPIREAI_INFRASTRUCTURE_ARCHITECTURE.md) (P3-06) · [`EMPIREAI_PRODUCTION_TRUTH.md`](../governance/EMPIREAI_PRODUCTION_TRUTH.md) · [`EMPIREAI_CONSTITUTION_VALIDATION.md`](../governance/EMPIREAI_CONSTITUTION_VALIDATION.md)

**Evidence (informative):** [`docs/audits/full-empireai-audit/08_BRAIN_AND_RUNTIME_AUDIT.md`](../audits/full-empireai-audit/08_BRAIN_AND_RUNTIME_AUDIT.md)
