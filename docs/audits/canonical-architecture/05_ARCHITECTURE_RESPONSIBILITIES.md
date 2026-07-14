# 05 — Architecture Responsibilities

**Format:** Owner · Primary responsibilities · Classification · Production status

---

## Authority Layer

| Domain | Owner | Responsibilities | Class | Production |
|--------|-------|------------------|-------|------------|
| **Grand King** | Human sovereign | Final approval; founder access; strategic sign-off | Runtime + governance | Yes |
| **Chief Architect** | ChatGPT + Grand King mandate | Architecture authority; constitution; missions; ADRs | Doc only | N/A |
| **Vision** | Grand King + Architect | North star; reconciles marketplace/commercial intent | **FUTURE doc** | No |
| **Soul** | Grand King | Identity, mission memory | Canonical doc + Foundation runtime | Yes |

---

## Pillow & Execution

| Domain | Owner | Responsibilities | Class | Production |
|--------|-------|------------------|-------|------------|
| **Pillow COI** | Pillow Constitution | Sole technical owner; executive intelligence; engineering supervision | Canonical + runtime | Partial mode |
| **Pillow package** | Pillow | Bootstrap, repo intelligence, phases 2–10 subsystems, CLI | Runtime library | Hosted in Brain |
| **Pillow Host** | Pillow | HTTP surface, sessions, routePrompt, lazy boot, governance audit | Runtime | Yes |
| **Brain** | Pillow | Dispatch, orchestrator, tools, queue, LLM, audit, DB layer | Runtime | Yes |
| **Orchestrator** | Pillow→Brain | Route module:action to tool/agent/workflow | Runtime | Yes |
| **LLM Router** | Pillow→Brain | OpenAI/Anthropic/Gemini with timeout | Runtime | Yes |
| **Tool Registry** | Pillow→Brain | 200+ tools for agents/modules | Runtime | Yes |
| **Task Queue** | Pillow→Brain | BullMQ jobs; degraded fallback | Runtime | Partial |
| **Event Bus / SSE** | Pillow→Brain | Real-time events to Cockpit | Runtime | Yes |
| **Guardian** | Pillow | Health, risks, optional dispatch gates | Runtime | Yes |
| **Auth** | Pillow→Brain | Login, sessions, roles, permissions, audit identity | Runtime | Yes |

---

## Client & UX

| Domain | Owner | Responsibilities | Class | Production |
|--------|-------|------------------|-------|------------|
| **Cockpit** | Pillow (UID) | 53-page executive UI; departments; Executive Home; Pillow panel | Runtime | Yes |
| **Cockpit Proxy** | Pillow | BFF proxy; timeouts; cookie handling | Runtime | Yes |
| **Founder Shell** | Pillow (UID) | Marketing; login; redirect to Cockpit | Runtime | Yes |
| **Executive Home** | Pillow→Domain | Command view assembly; cache; lite prod path | Runtime | Yes |
| **Global Assistant** | Pillow | G4-09 framework — assistant entry | Runtime | Framework only |
| **Interaction Layer** | Pillow | G4-07 framework — drawer/bridge | Runtime | Framework only |

---

## Builder

| Domain | Owner | Responsibilities | Class | Production |
|--------|-------|------------------|-------|------------|
| **Builder** | Pillow | Supervised engineering automation concept | Doc + runtime | Dry-run prod |
| **Cursor Bridge** | Pillow | Queue Cursor missions; heartbeat | Runtime | Dry-run default |
| **Approval Gate** | Pillow | Grand King approval before launch | Runtime | Yes |
| **Store Builder agent** | Pillow→Brain | Casey agent — store generation tools | Runtime | Agent exists |

---

## Domain Layers

| Domain | Owner | Responsibilities | Class | Production |
|--------|-------|------------------|-------|------------|
| **Runtime modules** | Pillow | REAL-### mission logic; panel backends | Runtime | Dispatch-primary |
| **Orchestration engines** | Pillow | Business engines, CRIR, commerce readiness, reality integration | Runtime | Mixed |
| **Intelligence engines** | Pillow | G3 suite — scoring, signals, CRI feeds | Runtime | Tests + partial UI |
| **Business Engines** | Pillow | Manufacture→deploy→sell→fulfill lifecycle | Runtime | Built |
| **Execution** | Pillow | CJ, Stripe, publishing, meta ads live paths | Runtime | Proof endpoints |
| **Revenue** | Pillow | Payments, loops, Grand King's revenue | Runtime | Partial |
| **Eye** | Pillow | Connector boundary — Amazon, Trends, etc. | Runtime | Yes |
| **Foundation** | Pillow | Soul file runtime, doctrine, constitution modules, KPI | Runtime | SQLite-backed |
| **Identity Registry** | Pillow | Workspace/company identity | Runtime | Yes |
| **EKLS** | Pillow | Institutional memory spec + runtime | Canonical + runtime | Partial |
| **Agents / AI Workforce** | Pillow→Brain | 12 named agents with tools and authority levels | Runtime | Registry yes |
| **Domain views** | Pillow→Brain | Cockpit panel aggregation builders | Runtime | Yes |

---

## Cross-Cutting

| Domain | Owner | Responsibilities | Class | Production |
|--------|-------|------------------|-------|------------|
| **Security** | Pillow (G8 + Auth) | Sessions, vault, isolation, CORS | Law + runtime | Yes |
| **Monitoring** | Pillow→Guardian | `/health/live`, metrics, lag stats | Runtime | Yes |
| **Testing** | Engineering standards | 285 tests; journey scripts | Programme | CI + prod scripts |
| **Recovery** | Pillow | Cursor recovery doctrine; rollback engine | Law + runtime | Partial |
| **Production** | Ops + Pillow | Railway/Vercel/Upstash topology | Doc + infra | Yes |
| **Deployment** | Ops | MANAGED_DEPLOYMENT sequence | Canonical doc | Yes |

---

## Governance Documentation Responsibilities

| Domain | Owner | Responsibilities | Class |
|--------|-------|------------------|-------|
| **CTD** | Grand King | Supreme commercial law | Canonical |
| **Engineering Constitution** | Architect | Brain/Guardian law | Canonical |
| **Doctrines (GVD,ACD,UID,CBD)** | Grand King + Architect | Domain law | Canonical |
| **Canonical Architecture** | Architect | Normative target (REAL-078) | Canonical |
| **Reconstructed Architecture** | Architect | This audit pack | Canonical-adjunct |
| **Operational Architecture** | Engineering | Developer map | Operational |
| **Roadmaps** | Architect + Pillow | Programme direction | Programme |
| **V1 Bible** | Architect | Build hierarchy | Programme |
| **Journey** | Ops | Live status | Programme |
| **Master Index** | Architect | Navigation | Meta-canonical |
| **Combined audits** | Governance | Evidence of closed missions | Evidence |

---

## Responsibility Rules (RECOMMENDED Permanent)

1. **Pillow owns; Brain executes; Cockpit displays; Grand King approves.**  
2. **No subsystem may implement its own auth.**  
3. **No frontend calls LLM providers directly.**  
4. **One owner per capability** — duplicates deprecated, not extended.  
5. **Production mode trims paths, not ownership.**  
6. **Foundation governs; Runtime advises** unless promoted.  
7. **Connectors only through Eye / Reality Integration.**

---

## Duplicate Responsibility Assignments (Resolve in Docs)

| Capability | Current duplicate | RECOMMENDED single owner |
|------------|-------------------|--------------------------|
| Executive UI | frontend + empireai-web | Cockpit (empireai-web) |
| Architecture authority | 4 docs | Canonical + operational |
| Health | live vs Guardian vs Pillow health | Layered responsibilities (see boundaries) |
| Memory | Pillow session vs EKLS vs Brain memory store | EKLS long-term; chat ephemeral CURRENT |
