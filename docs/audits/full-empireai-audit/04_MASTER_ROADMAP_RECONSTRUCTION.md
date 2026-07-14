# 04 — Master Roadmap Reconstruction

Reconstructed from repository evidence — **not** a single authored roadmap, but the **implied programme** from docs, artifacts, commits, and tests.

---

## Layer 0 — Identity & Governance (Complete)

| Item | Evidence | Status |
|------|----------|--------|
| Soul File | `EMPIREAI_SOUL.md` | ✅ Present |
| Constitution stack (CTD, Engineering, Pillow) | Root + docs/EI | ✅ Present |
| Repository Master Index | `EMPIREAI_REPOSITORY_MASTER_INDEX.md` | ✅ Present |
| Journey doctrine | `JOURNEY.md`, `EMPIREAI_JOURNEY_FIRST_DOCTRINE.md` | ✅ Present |
| Vision (canonical) | — | ❌ **Missing** (`MARKETPLACE_OS_VISION.md` partial only) |

---

## Layer 1 — Brain & Infrastructure (Largely Complete)

| Phase | Evidence | Status |
|-------|----------|--------|
| Brain core (LLM, tools, orchestrator, Guardian) | `backend/src/brain/` | ✅ Active |
| SQLite persistence | `sqlite-database.ts` | ✅ Active (sql.js, debounced persist) |
| Redis + BullMQ | `config/redis-client.ts`, `task-queue.ts` | ✅ Active (degraded fallback) |
| Postgres migration path | REAL-132, `brain/postgres/` | 🟡 Infra present, not primary |
| Railway production deploy | `railway.toml`, B5/B6 artifacts | ✅ Active |
| Production readiness gates | G6 certification tests | ✅ Documented |

---

## Layer 2 — Pillow Runtime Integration (Complete through Phase 10)

| Phase | Subsystem | Evidence |
|-------|-----------|----------|
| PILLOW-016 | Brain host integration | `pillow-host.ts`, commits |
| Phase 2 | Repository Intelligence | `pillow/repository-intelligence`, cert tests |
| Phase 3 | Technical Chief | `technical-chief/` |
| Phase 4 | UX Designer | `ux-designer/` |
| Phase 5 | Cursor Bridge | `cursor-bridge/`, `pillow-approval/` |
| Phase 6 | Infrastructure Commander | `infrastructure-commander/` |
| Phase 7 | Commerce Intelligence | `commerce-intelligence/` |
| Phase 8 | Empire Commander | `empire-commander/` |
| Phase 9 | Empire Operating System | `empire-operating-system/` |
| Phase 10 | Continuous Evolution | `continuous-evolution/` |

**Production note:** Brain production chat uses **minimal fast path** — full Pillow subsystems available in package but trimmed at runtime.

---

## Layer 3 — Commerce & Business Engines (Built, Partially Production-Connected)

| Programme | Evidence | Production connected? |
|-----------|----------|----------------------|
| G2 commerce integration framework | g2 tests + artifacts | 🟡 Module routes off by default |
| Product intelligence | `intelligence/product-intelligence-engine/` | 🟡 Via dispatch/tools |
| Supplier / CJ / Stripe live auth | b6 evidence JSON | ✅ Proof endpoints exist |
| Revenue loop, Grand King's revenue | `revenue/` | 🟡 |
| Business simulation, build engines | `orchestration/business-*` | 🟡 |

---

## Layer 4 — Intelligence Engines G3 (Built)

Ten intelligence engines (product, market, supplier, financial, quantitative, advertising, customer, risk, decision, orchestrator) — evidence: `g3-01` through `g3-10` tests and artifacts.

**Status:** Implemented in backend; Cockpit panels partially wired; many stubs in UI.

---

## Layer 5 — Grand King Cockpit G4 (Built)

| Item | Evidence | Status |
|------|----------|--------|
| Cockpit architecture | `g4-01-grand-king-cockpit-architecture.md` | ✅ |
| empireai-web 53 pages | `empireai-web/app/(cockpit)/` | ✅ |
| Executive Home | `executive-home-loader.ts`, G4-03 audit | ✅ Production path |
| Global assistant / interaction layer | G4-09, G4-07 | 🟡 Framework only |
| Auth verification | `g4-05b-auth-verification-results.json` | ✅ |

---

## Layer 6 — Business Automation G5 (Built)

Automation registry, triggers, scheduler, orchestrator, Pillow approval router, recovery — evidence: g5 tests, `pillow-approval/` routes.

**Cursor Bridge:** dry-run by default in production unless V1 operational ready.

---

## Layer 7 — Production Certification G6 (Documented)

Full certification ladder g6-00 through g6-10 — tests exist; represents **certification intent**, not live production state alone.

---

## Layer 8 — Grand King Live Operations G7 (Documented)

G7 framework through g7-10 — operational playbooks and tests; Grand King automation server exists (`grand-king-automation-server.ts`).

---

## Layer 9 — Identity & Authorization G8 (Built)

Connection registry, OAuth framework, credential vault, authorization centre — g8 tests + artifacts.

---

## Layer 10 — REAL Cockpit Wiring (Active)

REAL-101 through REAL-135 — department panels, route consolidation, Postgres migration, production smoke tests.

---

## Layer 11 — Production Acceptance (In Progress)

| Milestone | Status |
|-----------|--------|
| Login → Executive Home → Pillow | ✅ Automated long-run test passed (`9e51bc7`) |
| Grand King browser confirmation | 🟡 Pending human sign-off |
| Extension routes in production | ❌ Off by default |
| Vision / ECC / Vision Integrity | ❌ Not in roadmap files |

---

## Implied Future (from gaps, not invented missions)

1. Constitution Lock — consolidate canonical docs
2. Single Vision file authoring
3. Frontend surface authority closure
4. Production route policy documentation
5. Vision Integrity Engine (INTENDED HIERARCHY CHECK — not scheduled in repo)
6. Execution Control Center (INTENDED HIERARCHY CHECK — not scheduled in repo)

---

## Roadmap Document Map

| Document | Scope |
|----------|-------|
| `EMPIREAI_ROADMAP.md` | Empire-wide |
| `PILLOW_ROADMAP.md` | Pillow |
| `docs/executive-intelligence/EXECUTIVE_INTELLIGENCE_ROADMAP_v1.md` | EI library |
| `docs/architecture/cockpit/COCKPIT_IMPLEMENTATION_ROADMAP.md` | Cockpit |
| `artifacts/empireai-version-1-build-hierarchy-bible.md` | **Locked V1 build map** |
| `artifacts/g2-programme-roadmap-status.md` | G2 snapshot (historical) |
