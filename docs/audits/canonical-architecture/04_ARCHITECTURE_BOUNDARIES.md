# 04 — Architecture Boundaries

**Purpose:** What is inside vs outside each subsystem — prevents responsibility bleed

---

## Global Boundaries

| Inside EmpireAI architecture | Outside |
|-------------------------------|---------|
| Brain, Pillow, Cockpit, domain code | Grand King's personal systems |
| Connector adapters (Eye, CJ, Stripe) | External platform SLAs |
| Governance docs in repo | ChatGPT conversation history |
| Railway/Vercel deploy configs | Cloud provider internals |
| Validation tests | Grand King manual browser testing |

---

## Subsystem Boundaries

### Grand King
- **IN:** Approval decisions, founder login, strategic direction sign-off
- **OUT:** Code ownership, direct LLM calls, database admin (unless explicit)

### Chief Architect
- **IN:** Constitution drafting, architecture authority, mission design, ADRs
- **OUT:** Runtime execution, production deploy buttons, Cursor dry-run launches

### Pillow (COI)
- **IN:** Technical ownership of all subsystems; executive intelligence; repository intelligence; Cursor supervision model; EKLS governance; Pillow HTTP via host
- **OUT:** Commercial supreme law (CTD); Grand King personal authority; direct Vercel deploy of Brain

### Brain
- **IN:** HTTP API, dispatch, orchestrator, tools, agents, workflows, queue, audit log, LLM routing, SQLite/Redis access, Guardian integration, route registration
- **OUT:** UI rendering; direct Grand King interaction without auth; peer authority to Pillow

### Cockpit
- **IN:** Department UX, KPI display, approval queue UI, Pillow panel, loading/error states, session cookie client-side, BFF proxy calls
- **OUT:** Source of truth for config/knowledge; direct OpenAI; business logic duplication of dispatch

### Founder Shell
- **IN:** Marketing pages, login form, redirect to Cockpit, optional direct Brain API (legacy)
- **OUT:** Executive department panels (belong in Cockpit)

### Cockpit Proxy (BFF)
- **IN:** Same-origin proxy, timeout tiers, cookie forward/clear, SSE passthrough
- **OUT:** Business logic; persistent state; auth token minting logic (Brain does)

### Guardian
- **IN:** Health checks, risk registry, pre-dispatch validation (when enabled), `/guardian/*`
- **OUT:** User-facing UX; Pillow chat; commerce execution

### Builder / Cursor Bridge
- **IN:** Mission queue, approval gates, dry-run/live launch policy, heartbeat monitoring
- **OUT:** Autonomous unapproved code execution in production; Git operations outside mission model

### Runtime Modules (REAL)
- **IN:** Mission-scoped domain logic, dispatch tools, optional HTTP routes, SQLite repos
- **OUT:** Auth implementation; LLM provider keys in frontend; duplicate intelligence scoring

### Intelligence Engines (G3)
- **IN:** Signal ingestion, scoring, recommendations, CRI feeds
- **OUT:** Order fulfillment; payment capture; Cockpit layout

### Business Engines / Orchestration
- **IN:** Venture lifecycle, CRIR, commerce readiness, business simulation, marketplace connection
- **OUT:** Raw connector HTTP (Eye/Reality Integration boundary)

### Eye
- **IN:** External API adapters, rate limits, connector scheduling, product intelligence bridge
- **OUT:** Cockpit panels; Pillow chat prompts

### Foundation
- **IN:** Soul runtime, doctrine modules, constitution runtime, KPI, policy, identity registry
- **OUT:** Live commerce execution; LLM inference

### Domain Views
- **IN:** Executive Home assembly, cockpit panel view builders, operational command view
- **OUT:** Persistent new tables without migration; blocking event loop (must yield — CURRENT fix)

### Production / Infrastructure
- **IN:** Railway, Vercel, Upstash, SQLite volume, env templates, health probes
- **OUT:** Application business rules

### Security (cross-cutting)
- **IN:** Auth, G8 credential vault, session TTL, CORS, founder/admin roles, audit identity on dispatch
- **OUT:** Grand King password policy outside app

### Testing
- **IN:** 285 validation tests, production journey scripts, typecheck
- **OUT:** Production monitoring replacement

### Recovery
- **IN:** Cursor recovery doctrine, g5-06 rollback engine, Guardian risk resolution
- **OUT:** Railway platform auto-heal (infra concern)

---

## Layer Boundaries (Must Not Cross)

| From | To | Allowed? | Mechanism |
|------|-----|----------|-----------|
| Cockpit | OpenAI | **NO** | Must via Pillow/Brain |
| Cockpit | Brain | **YES** | BFF proxy only |
| Frontend | Brain | **YES** (legacy) | Direct API — RECOMMENDED minimize |
| Pillow package | UI | **NO** | Library only |
| Runtime | Auth rewrite | **NO** | Use middleware |
| Intelligence | Payment capture | **NO** | Via execution/revenue |
| Foundation | Commerce live mode | **NO** | Promotion via explicit gate |
| Any module | New HTTP surface | **CAUTION** | Register tool + route; extension gating in prod |

---

## Production Mode Boundaries (CURRENT)

Production Brain **includes:**
- Auth, health, dispatch, pillow, events (critical routes)
- Pillow lazy boot + minimal chat
- Executive Home lite dispatch path
- Guardian (if enabled)
- Event-loop cooperative yields

Production Brain **excludes by default:**
- ~150 extension HTTP module routes
- Full Pillow repository intelligence in chat hot path
- Workers/scheduler at API process boot
- Full executive council in chat hot path

**RECOMMENDED:** Document as **Production Mode Boundary** — not architectural absence.

---

## Documentation Boundaries

| Type | Boundary |
|------|----------|
| CANONICAL architecture | Normative — changes via ADR/amendment |
| OPERATIONAL architecture | Dev guide — update with releases |
| EVIDENCE | Immutable audits — never current law |
| HISTORICAL | Pre-Pillow — never cite as architecture |

---

## Merge vs Separate Boundaries

| Merge (conceptual boundary) | Keep separate (hard boundary) |
|----------------------------|------------------------------|
| Production truth docs | CTD vs Engineering Constitution |
| Operational + canonical architecture entry points | Pillow vs Brain runtime |
| Founder Shell + Cockpit UX authority (ADR) | Builder vs Store Builder agent |
| Autonomous Engineering Standards naming | Pillow council vs Brain executive-council |
