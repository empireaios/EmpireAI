# 01 — Canonical Architecture (Single Authority)

**Status:** RECONSTRUCTED — supersedes ad-hoc reading of multiple architecture docs  
**Does not modify:** REAL-078 normative file (reconciles it with production evidence)  
**Authority rank:** Tier 3 normative architecture (after CTD and domain doctrines)

---

## 1. Architectural Principles (Reconstructed)

| # | Principle | Source |
|---|-----------|--------|
| 1 | **Pillow owns all technical subsystems** — Brain is not a peer | Pillow Constitution §17, REAL-078 |
| 2 | **Single Brain execution path** — no client-side LLM or direct external API calls | REAL-078, Engineering Constitution |
| 3 | **Cockpit visualises; Brain executes; Pillow governs intelligence** | REAL-078, UID |
| 4 | **One canonical owner per capability** | ACD, REAL-078 |
| 5 | **Live data over seed in production** | REAL-078 |
| 6 | **Connectors at boundary** — Eye + Reality Integration | REAL-078, Eye architecture |
| 7 | **Foundation governs; Runtime advises** unless promoted | REAL-078 |
| 8 | **CRI gates commercial risk** | CTD, ADR-051 |
| 9 | **Survival over speculative profit** | CRI doctrine |
| 10 | **Production mode may trim runtime paths** without changing ownership | Evidence: Pillow minimal chat, extension route gating |

---

## 2. Unified Platform Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TIER 0 — AUTHORITY                                                       │
│   Grand King (human sovereign, founder role)                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│ TIER 1 — STRATEGIC (non-runtime)                                         │
│   Chief Architect (doc authority)  │  Pillow COI (runtime intelligence)  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│ TIER 2 — IDENTITY DOCS                                                   │
│   Vision File [FUTURE]  │  Soul File  │  Identity Registry (runtime)     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│ PILLOW — SOLE TECHNICAL OWNER                                            │
│   ┌─────────────┬──────────────┬──────────────┬─────────────────────┐ │
│   │ Brain       │ Cockpit      │ Guardian     │ EKLS / Registry /   │ │
│   │ (execution) │ (exec UI)    │ (health/risk)│ Mission / Audit     │ │
│   ├─────────────┴──────────────┴──────────────┴─────────────────────┤ │
│   │ Executive AI Engines (G3 Intelligence suite)                        │ │
│   ├───────────────────────────────────────────────────────────────────┤ │
│   │ Business Engines (Commerce, Revenue, Execution orchestration)      │ │
│   ├───────────────────────────────────────────────────────────────────┤ │
│   │ Builder (Cursor Bridge + Approval Gate)                           │ │
│   └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│ IMPLEMENTATION PLANE (backend/src — maps to Pillow-owned subsystems)     │
│   brain/ · auth/ · orchestration/ · runtime/ · intelligence/ · eye/    │
│   execution/ · revenue/ · foundation/ · domain/ · agents/ · guardian/  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│ CLIENT PLANE                                                             │
│   Cockpit (empireai-web) + Founder Shell (frontend) + Cockpit Proxy    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│ INFRASTRUCTURE PLANE                                                     │
│   Railway (Brain) · Vercel (UI) · Upstash (Redis) · SQLite · Supabase  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Subsystem Catalog (38 Domains)

For each: **What · Why · Owner · Tier · Depends · Depended on · Class · Production**

### Authority & Strategy

| Domain | What | Why | Owner | Tier | Class |
|--------|------|-----|-------|------|-------|
| **Grand King** | Human sovereign operator | Final approval, founder access | Grand King | 0 | Runtime + doc |
| **Chief Architect** | Strategic architecture authority | Constitution, missions, hierarchy | Architect | 1 | Doc only |
| **Vision** | Strategic north star doc | Direction before law | Grand King + Architect | 2 | **FUTURE doc** |
| **Soul** | Identity memory | Who EmpireAI is | Grand King | 2 | Canonical doc + runtime |

### Pillow & Brain

| Domain | What | Why | Owner | Path | Production |
|--------|------|-----|-------|------|------------|
| **Pillow** | COI package + governance | Sole technical owner | Pillow | `pillow/` | Partial (prod minimal chat) |
| **Pillow Host** | In-process Brain adapter | HTTP + session bridge | Pillow | `pillow-host/` | Yes |
| **Brain** | Execution kernel | Dispatch, tools, queue, LLM | Pillow | `backend/src/brain/` | Yes |
| **Guardian** | Health & risk engine | Pre-checks, `/health`, risks | Pillow | `guardian/` | Yes |
| **Auth** | Sessions, roles, permissions | Who may act | Pillow→Brain | `auth/` | Yes |
| **Orchestrator** | module:action dispatch | Single execution entry | Pillow→Brain | `brain/orchestrator.ts` | Yes |

### Client & UX

| Domain | What | Why | Owner | Path | Production |
|--------|------|-----|-------|------|------------|
| **Cockpit** | Grand King executive UI | Department shell, Executive Home | Pillow | `empireai-web/` | Yes (recommended) |
| **Cockpit Proxy** | Next.js BFF | Same-origin Brain access | Pillow | `empireai-web/app/api/` | Yes |
| **Founder Shell** | Marketing + login SPA | Entry, redirect to Cockpit | Pillow | `frontend/` | Yes (root vercel.json) |

### Builder

| Domain | What | Why | Owner | Path | Production |
|--------|------|-----|-------|------|------------|
| **Builder** | Engineering automation concept | Cursor-supervised missions | Pillow | — | Doc + dry-run |
| **Cursor Bridge** | Pillow→Cursor mission queue | Supervised code execution | Pillow | `cursor-bridge/`, `pillow-approval/` | Dry-run default |

### Domain Implementation Layers

| Domain | What | Why | Owner | Path | CURRENT role |
|--------|------|-----|-------|------|--------------|
| **Runtime modules** | REAL mission implementations | Cockpit panels, dispatch tools | Pillow | `runtime/` (~613 files) | Dispatch-primary in prod |
| **Orchestration engines** | Business/commerce logic | Venture lifecycle, CRIR, etc. | Pillow | `orchestration/` (~1044 files) | Mixed HTTP/dispatch |
| **Intelligence engines** | G3 signal/scoring suite | Product, market, supplier, risk… | Pillow | `intelligence/` | Dispatch + tests |
| **Business Engines** | Commerce lifecycle (REAL-078) | Manufacture→sell→fulfill | Pillow | scattered under execution/revenue/orchestration | Built |
| **Eye** | External data connectors | Amazon, Trends, etc. | Pillow | `eye/` | Connector boundary |
| **Execution** | Live commerce actions | CJ, Stripe, publishing, ads | Pillow | `execution/` | Proof endpoints |
| **Revenue** | Payments, loops, GKR | Money path | Pillow | `revenue/` | Partial live |
| **Foundation** | Governance runtime modules | Soul, doctrine, KPI, policy | Pillow | `foundation/` | SQLite-backed |
| **Domain views** | Cockpit aggregation | Executive Home, panels | Pillow→Brain | `domain/` | Yes — critical path |
| **Agents / AI Workforce** | Named autonomous agents | Tool-bound workers | Pillow→Brain | `agents/` | Registry exists |

### Knowledge & Identity Runtime

| Domain | What | Why | Owner | Path |
|--------|------|-----|-------|------|
| **EKLS** | Institutional memory spec + runtime | Long-term knowledge | Pillow | spec + orchestration |
| **Identity Registry** | Workspace/company identity | Multi-tenant scope | Pillow | `foundation/identity-registry/` |
| **Knowledge** | Empire knowledge runtime | Strategic memory | Pillow | `runtime/empire-knowledge/` |

### Production & Ops

| Domain | What | Why | Owner | Path |
|--------|------|-----|-------|------|
| **Production** | Live deploy topology | Grand King access | Pillow | Railway + Vercel |
| **Deployment** | Managed cloud sequence | Repeatable deploy | Ops | `deployment/` |
| **Infrastructure** | Redis, SQLite, Postgres path | Persistence & scale | Pillow→Brain | config + postgres/ |
| **Security** | Auth, vault, G8 identity | Credentials, isolation | Pillow | auth + g8 modules |
| **Monitoring** | Health, metrics, Guardian | Uptime, risks | Pillow | `/health/*`, `/metrics` |
| **Testing** | Validation harness | 285 test files | Engineering | `validation/tests/` |
| **Recovery** | Cursor recovery, rollback | Failure recovery | Pillow | doctrines + g5-06 |

### Governance Docs (Architecture-relevant)

| Domain | What | Class |
|--------|------|-------|
| **Constitutions** | CTD, Engineering, Pillow | Canonical law |
| **Doctrines** | GVD, ACD, UID, CBD | Canonical law |
| **Roadmaps** | Empire, Pillow, EI, Cockpit | Programme |
| **Bible** | V1 Hierarchy Bible | Programme |
| **Journey** | Live ops index | Programme |
| **Master Index** | Navigation root | Meta-canonical |

---

## 4. Production Architecture (CURRENT)

```
Browser
  → Vercel: empireai-web (Cockpit Proxy) OR frontend (Founder Shell)
  → Railway: Brain Fastify
       ├── Critical HTTP: auth, health, dispatch, pillow, events
       ├── Extension HTTP: ~150 modules [OFF unless env flag]
       ├── Pillow Host: lazy boot, minimal chat path
       ├── Executive Home: async loader, 60s cache
       └── Guardian + event-loop cooperative yields
  → Upstash Redis (sessions, queue) [degraded fallback = in-memory]
  → SQLite volume (Brain DB, debounced persist)
```

---

## 5. Request Architecture (Canonical Paths)

| Journey | Path |
|---------|------|
| Login | Cockpit Proxy → Brain `/auth/login` → Redis session → cookie |
| Executive Home | Cockpit Proxy → `/brain/dispatch` executive-home:load → domain views |
| Pillow chat | Cockpit Proxy → `/api/pillow/*` → Pillow Host → LLMRouter |
| Module action | `/brain/dispatch` → orchestrator → tool/agent/workflow |
| Builder mission | Approval gate → Cursor Bridge → Cursor IDE (dry-run prod) |
| Health probe | `/health/live` (Railway), Guardian optional deep check |

---

## 6. Data Architecture

| Store | Technology | Owner subsystem | CURRENT |
|-------|------------|-----------------|---------|
| Brain DB | sql.js SQLite | Brain | Primary |
| Sessions | Redis | Auth | Production required for durability |
| Pillow chat | In-memory Map | Pillow Host | Ephemeral |
| Task queue | BullMQ | Brain | Degraded without Redis |
| Event stream | Redis pub/sub or local | Brain | SSE to Cockpit |
| Postgres | Pool + migrations | Brain | FUTURE (REAL-132) |
| EKLS tables | SQLite | Pillow/EKLS | Runtime |

---

## 7. Document Authority for Architecture

| Question type | Read this |
|---------------|-----------|
| What should we build? | REAL-078 + this doc (RECOMMENDED) |
| What exists now? | `EMPIREAI_STATUS.md` + full audit |
| How do I develop? | `docs/ARCHITECTURE.md` (OPERATIONAL) |
| What did we certify? | `artifacts/*`, COMBINED audits (EVIDENCE) |
| Pre-Pillow draft? | `docs/SYSTEM_ARCHITECTURE.md` (HISTORICAL — do not cite) |

---

## 8. Reconciliation Notes (REAL-078 vs CURRENT)

| REAL-078 statement | CURRENT evidence | Reconciliation |
|--------------------|------------------|----------------|
| Executive Cockpit at `frontend/dashboard` | Redirects to Cockpit; real UI in `empireai-web/cockpit` | **RECOMMENDED:** Update REAL-078 mapping in doc reconstruction phase |
| Both frontends render in Cockpit chrome by V2 | Not unified yet | **FUTURE** |
| One dispatch entry per frontend | Cockpit Proxy + optional direct frontend API | **CURRENT:** two client paths documented |
| Postgres scalable DB | SQLite primary | **FUTURE** migration |
| Full module HTTP | Extension routes gated | **CURRENT:** production mode documented |

**This reconstruction does not edit REAL-078 — it states reconciled truth for Chief Architect use.**
