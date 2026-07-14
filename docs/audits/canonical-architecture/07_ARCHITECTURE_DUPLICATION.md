# 07 — Architecture Duplication

**Total duplicate architecture groups:** 14

---

## Duplicate Group Catalog

| # | Duplicate concept | Instances | Resolution | Merge? | Historical? |
|---|-------------------|-----------|------------|--------|-------------|
| D1 | **Platform architecture doc** | Canonical, ARCHITECTURE.md, EMPIREAI_ARCHITECTURE.md, SYSTEM_ARCHITECTURE | Canonical + operational split; SYSTEM=historical | No | SYSTEM yes |
| D2 | **Pillow executive constitution title** | Root EI constitution vs docs/EI/PILLOW_EXECUTIVE_CONSTITUTION | Display rename for EI copy | No | No |
| D3 | **Cockpit location** | REAL-078 frontend/dashboard vs empireai-web/cockpit | Update mapping RECOMMENDED | No | legacy dashboard → historical UX |
| D4 | **Founder UX surface** | frontend/ vs empireai-web/ vs "Dashboard" | ADR + naming: Founder Shell + Cockpit | Partial ADR | dashboard pages legacy |
| D5 | **Platform vs Cockpit routes** | empireai-web/platform vs cockpit | Platform=legacy alias | No | redirect only |
| D6 | **Brain vs backend folder name** | Concept "Brain" vs folder `backend/` | ECNS-1: prose vs code | No | No |
| D7 | **Health architecture** | /health/live, /health, Guardian, Pillow health | Layered responsibilities doc | No | No |
| D8 | **Memory architecture** | Brain memoryStore, Pillow chat history, EKLS | Separate scopes doc | No | No |
| D9 | **Executive council** | Pillow council vs backend executive-council | Keep separate REAL-078 | No | No |
| D10 | **Product intelligence** | PIE vs live-product-intelligence runtime | PIE owns; runtime consumes | No | No |
| D11 | **Commerce engine folders** | REAL-078 commerce/ tree vs scattered folders | Mapping table (canonical arch) | FUTURE physical | No |
| D12 | **Bible** | hierarchy bible vs master bible vs MCL bible | One V1 canonical + scoped MCL | No | master=historical |
| D13 | **Production deploy doc** | MANAGED_DEPLOYMENT vs vercel.json vs railway.toml | Production truth consolidation | Yes doc | No |
| D14 | **Autonomous Engineering Constitution** | Intended name vs Engineering Constitution + Cursor docs | Hierarchy mapping | Conceptual | No |

---

## Architecture Definition Overlaps (Detail)

### D1 — Four architecture documents

| Document | Overlap with | Unique value |
|----------|--------------|--------------|
| `EMPIREAI_CANONICAL_ARCHITECTURE.md` | All | Normative subsystem definitions |
| `docs/ARCHITECTURE.md` | Canonical | Dev quick-start, wiring |
| `EMPIREAI_ARCHITECTURE.md` | Canonical | Historical evolution notes |
| `docs/SYSTEM_ARCHITECTURE.md` | Conflicts all | None — obsolete |

**RECOMMENDED:** Single entry: "Read Canonical first, Operational second."

### D3 — Cockpit mapping drift

**REAL-078 §3.2 canonical mapping (CURRENT doc text):**
- Executive Cockpit → `frontend/src/pages/dashboard/*`
- Platform modules → `empireai-web/app/(platform)/`

**Production evidence (CURRENT runtime):**
- Executive Cockpit → `empireai-web/app/(cockpit)/cockpit/*` (53 pages)
- `frontend/dashboard` → redirects to Cockpit
- Platform → 308 redirect to Cockpit

**RECOMMENDED reconciliation:** Treat REAL-078 mapping as **FUTURE-unified** or **outdated**; cite reconstructed architecture for CURRENT.

### D4 — Dual client architecture

Both are production-deployable:
- Root `vercel.json` → `frontend/dist`
- `empireai-web/vercel.json` → Next.js Cockpit

**Not a code duplicate — an architectural authority duplicate.**

---

## Duplicate Responsibilities (Architecture Violations)

| Responsibility | Holders | RECOMMENDED |
|----------------|---------|-------------|
| Session validation | Brain auth + BFF + middleware | Brain authoritative |
| Executive aggregation | domain/views + multiple panel builders | domain/views owns assembly |
| LLM inference | LLMRouter + Pillow package openai layer | Single path via adapter |
| Risk intelligence | CRI + Risk engine + Guardian | CRI cross-cutting; Guardian operationalizes |

---

## Should Merge

| Merge target | Sources | Type |
|--------------|---------|------|
| Production truth architecture doc | MANAGED_DEPLOYMENT + readiness + route policy | Documentation |
| Engineering Standards concept | Engineering Constitution + Cursor doctrines | Hierarchy labeling |
| Vision architecture input | MARKETPLACE_OS_VISION + Soul preamble + CTD | New Vision file |

---

## Should NOT Merge

- CTD and Engineering Constitution  
- Pillow Constitution and EI library  
- Brain and Pillow packages  
- Runtime modules and Orchestration engines (different layers)  
- Evidence audits and canonical architecture  

---

## Should Become Historical

| Item | Reason |
|------|--------|
| docs/SYSTEM_ARCHITECTURE.md cluster | Pre-Pillow model |
| REAL-078 cockpit path if superseded by ADR | After doc update, old mapping historical |
| frontend dashboard pages (code) | Legacy — architecture doc only; code remains until removal ADR |

---

## Duplication Impact on Constitution

**14 duplicate groups** create **11 naming/authority conflicts** when agents read architecture without classification labels. Documentation reconstruction must assign **one cite path per question type** (see `01_CANONICAL_ARCHITECTURE.md` §7).
