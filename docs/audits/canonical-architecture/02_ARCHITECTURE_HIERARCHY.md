# 02 — Architecture Hierarchy

**Purpose:** ONE layering model — authority tiers × implementation planes

---

## A. Authority Tiers (Governance Hierarchy)

```
Tier 0  Grand King
Tier 1  Chief Architect │ Pillow COI
Tier 2  Vision │ Soul │ Identity Registry
Tier 3  Law (CTD apex, doctrines, constitutions, EI library, canonical architecture)
Tier 4  Programme (roadmaps, V1 Bible, Journey, ADRs)
Tier 5  Systems (Brain, Cockpit, Builder, Runtime, Commerce, Production, Guardian)
Tier 6  Deferred (VIE, ECC) [FUTURE]
```

**Rule:** Higher tier wins on conflict. Systems (Tier 5) cannot override Law (Tier 3).

---

## B. Implementation Planes (Runtime Hierarchy)

```
Plane 1 — CLIENT
  Founder Shell (frontend/)
  Cockpit (empireai-web/)
  Browser session (empireai_session)

Plane 2 — EDGE
  Cockpit Proxy (empireai-web/app/api/)

Plane 3 — EXECUTION (Pillow-owned)
  Brain Core
    ├── Orchestrator / Dispatch
    ├── Tool Registry
    ├── Agent Manager / Workflow Engine
    ├── Task Queue
    ├── Event Bus / SSE
    ├── LLM Router
    └── Database layer
  Pillow Host (in-process COI)
  Auth middleware
  Guardian

Plane 4 — DOMAIN (Pillow-owned implementations)
  Foundation
  Intelligence engines (G3)
  Orchestration / Business engines
  Runtime modules (REAL)
  Execution (live commerce)
  Revenue
  Eye (connectors)
  Domain views (Executive Home)
  Agents

Plane 5 — BUILDER
  Cursor Bridge
  Approval Gate
  Store Builder agent

Plane 6 — PERSISTENCE
  SQLite (Brain DB)
  Redis (sessions, queue, pub/sub)
  Postgres [FUTURE]

Plane 7 — INFRASTRUCTURE
  Railway (Brain API + worker)
  Vercel (UI)
  Upstash / Supabase
```

---

## C. Pillow-Internal Hierarchy (REAL-078 Normative)

```
EmpireAI
└── Pillow (sole technical owner)
    ├── Brain (execution — NOT a peer)
    ├── Grand King Cockpit
    ├── Guardian
    ├── EKLS / Registry / Mission / Audit systems
    ├── Executive AI Engines (G3 suite)
    ├── Business Engines (commerce lifecycle)
    ├── Builder (Cursor Bridge)
    └── Future Platform Services
```

**CURRENT:** All above map to `backend/src/*` + `pillow/` + client apps.  
**RECOMMENDED:** Cite this tree in all new architecture docs.  
**FUTURE:** Consolidated `commerce/` namespace per REAL-078 §3.6.

---

## D. Cockpit Department Hierarchy (UX)

**Source:** G4 Cockpit programme, `empireai-web/app/(cockpit)/cockpit/`

```
Cockpit
├── Command (Executive Home)
├── Missions
├── Relationship
├── Intelligence (products, markets, risk, discovery, executive)
├── Commerce (store, ads, marketing, workspace, launch)
├── Operations (orders, fulfillment, support, automation, authorizations)
├── Finance (profit, P&L, billing, costs, intelligence)
├── Workforce (agents, missions)
├── Governance (policies, soul, audit)
├── Development (pillow, approvals, learning)
└── Infrastructure (health, deployments, integrations, admin)
```

**Owner:** Pillow (UID doctrine)  
**CURRENT:** 53 pages; some placeholders  
**FUTURE:** Full panel wiring per Cockpit roadmap

---

## E. Brain HTTP Registration Hierarchy (CURRENT)

```
app.ts registration order:
1. Auth routes (always)
2. Health / metrics / guardian (always)
3. Cockpit-critical routes
   ├── Pillow routes
   ├── /brain/dispatch (inline)
   └── /brain/events/stream (inline)
4. Extension routes (~150 modules)
   └── CURRENT production: SKIPPED unless EMPIRE_ENABLE_EXTENSION_ROUTES=true
   └── RECOMMENDED: document as Production Mode Policy
```

---

## F. Intelligence Engine Hierarchy (G3)

```
Executive Intelligence Orchestrator (G3-10)
├── Product Intelligence (G3-01)
├── Market Intelligence (G3-02)
├── Supplier Intelligence (G3-03)
├── Financial Intelligence (G3-04)
├── Quantitative Intelligence (G3-05)
├── Advertising Intelligence (G3-06)
├── Customer Intelligence (G3-07)
├── Risk Intelligence (G3-08)
└── Decision Intelligence (G3-09)
```

**Cross-cutting:** CRI feeds multiple engines (ADR-051)

---

## G. Documentation Hierarchy (Architecture Docs)

| Rank | Document | Role |
|------|----------|------|
| 1 | `EMPIREAI_CANONICAL_ARCHITECTURE.md` | Normative target |
| 2 | `docs/audits/canonical-architecture/01_CANONICAL_ARCHITECTURE.md` | Reconstructed authority (this mission) |
| 3 | `docs/ARCHITECTURE.md` | Operational developer map |
| 4 | Domain architecture (Pillow, Eye, GPI) | Domain supplements |
| 5 | `EMPIREAI_ARCHITECTURE.md` | Operational memory |
| — | `docs/SYSTEM_ARCHITECTURE.md` | HISTORICAL — excluded |

---

## H. Tier Assignment Table (All Mission Domains)

| Domain | Authority tier | Implementation plane |
|--------|---------------|---------------------|
| Grand King | 0 | Client |
| Chief Architect | 1 | Doc |
| Pillow | 1 | Execution + Domain |
| Vision | 2 | Doc [FUTURE] |
| Soul | 2 | Doc + Foundation |
| Brain | 5 | Execution |
| Cockpit | 5 | Client + Edge |
| Founder Shell | 5 | Client |
| Guardian | 5 | Execution |
| Builder | 5 | Builder |
| Cursor Bridge | 5 | Builder |
| Runtime | 5 | Domain |
| Commerce | 5 | Domain |
| Business Engines | 5 | Domain |
| Intelligence Engines | 5 | Domain |
| Eye | 5 | Domain |
| Foundation | 5 | Domain |
| Identity | 2+5 | Doc + Foundation |
| Knowledge/EKLS | 5 | Domain |
| Production | 5 | Infrastructure |
| Deployment | 4+5 | Doc + Infrastructure |
| Infrastructure | 5 | Infrastructure |
| Security | 3+5 | Law + Auth/G8 |
| Monitoring | 5 | Execution |
| Testing | 4 | Validation |
| Recovery | 3+5 | Doctrine + g5-06 |
| Governance docs | 3–4 | Doc |
| Roadmaps | 4 | Doc |
| Journey | 4 | Doc |
| Constitutions | 3 | Doc |
| Doctrines | 3 | Doc |
| Bible | 4 | Doc |
| Master Index | Meta | Doc |
