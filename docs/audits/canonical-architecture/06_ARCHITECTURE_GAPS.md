# 06 — Architecture Gaps

**Total missing architecture groups:** 9  
**Architecture completeness impact:** ~19% of normative model not yet architecturally closed

---

## Gap Catalog

### GAP-01 — Vision File Architecture Slot
| Field | Value |
|-------|-------|
| **What missing** | Tier 2 Vision document and architectural slot |
| **CURRENT** | `MARKETPLACE_OS_VISION.md` partial only |
| **RECOMMENDED** | `EMPIREAI_VISION.md` as identity-tier architecture input |
| **FUTURE** | Vision Integrity Engine validates Vision ↔ implementation |
| **Blocks** | Constitution Construction identity tier |
| **Remain?** | Must author — not optional |

### GAP-02 — Execution Control Center (ECC)
| Field | Value |
|-------|-------|
| **What missing** | Named supervision layer for execution queues, missions, Builder |
| **CURRENT** | Dispersed: orchestrator, task queue, Cursor bridge, Journey |
| **RECOMMENDED** | Either design ECC doc or **explicit Tier 6 deferral** |
| **FUTURE** | ECC as dispatch + Builder + queue supervisor |
| **Blocks** | Intended hierarchy completeness |
| **Merge?** | No — separate concept from Brain orchestrator |

### GAP-03 — Vision Integrity Engine (VIE)
| Field | Value |
|-------|-------|
| **What missing** | Automated Vision ↔ repo alignment checker |
| **CURRENT** | Manual audits only |
| **RECOMMENDED** | Defer to V2 with written rationale |
| **FUTURE** | VIE service or audit automation |
| **Blocks** | Intended hierarchy completeness |

### GAP-04 — Production Truth Architecture
| Field | Value |
|-------|-------|
| **What missing** | Single doc for production mode: extension routes, Pillow trim, Redis policy |
| **CURRENT** | Scattered: MANAGED_DEPLOYMENT, env readiness, code comments |
| **RECOMMENDED** | `EMPIREAI_PRODUCTION_TRUTH.md` |
| **Blocks** | Architecture/production alignment for Constitution |

### GAP-05 — Unified Client Architecture Decision
| Field | Value |
|-------|-------|
| **What missing** | ADR for production Grand King surface |
| **CURRENT** | frontend + empireai-web both deployed |
| **RECOMMENDED** | ADR-CON-001: Cockpit = empireai-web |
| **FUTURE** | REAL-078 V2 unified app folder |
| **Blocks** | Client plane architecture certainty |

### GAP-06 — Postgres Primary Architecture
| Field | Value |
|-------|-------|
| **What missing** | Operational architecture for Postgres-primary Brain |
| **CURRENT** | REAL-132 migration infra; SQLite primary |
| **RECOMMENDED** | Document as FUTURE in evolution doc |
| **FUTURE** | Cutover plan, dual-write, backup |

### GAP-07 — Multi-Instance / HA Architecture
| Field | Value |
|-------|-------|
| **What missing** | Architecture for horizontal Brain scaling |
| **CURRENT** | Single Node sql.js; in-memory Pillow sessions |
| **RECOMMENDED** | Explicit **single-instance V1** declaration |
| **FUTURE** | Redis-mandatory, externalized sessions, Postgres |

### GAP-08 — Unified Commerce Namespace
| Field | Value |
|-------|-------|
| **What missing** | REAL-078 `commerce/` target tree in repo |
| **CURRENT** | Scattered execution/revenue/orchestration folders |
| **RECOMMENDED** | Document mapping table (in canonical architecture) — done |
| **FUTURE** | Physical folder consolidation |

### GAP-09 — Browser E2E Architecture
| Field | Value |
|-------|-------|
| **What missing** | Architectural acceptance layer (Playwright/Cypress) |
| **CURRENT** | Node journey scripts only |
| **RECOMMENDED** | Define E2E as Tier 4 acceptance architecture |
| **FUTURE** | Automated Grand King journey in CI |

---

## Architecture Drift Gaps (Not Missing — Misaligned)

| Gap type | CURRENT vs normative |
|----------|---------------------|
| Cockpit path in REAL-078 | frontend/dashboard vs empireai-web/cockpit |
| Full Brain HTTP | extension routes gated |
| Full Pillow COI | minimal production chat |
| Workers at boot | disabled in production API |
| Global Assistant / Interaction Layer | framework only in UI |

---

## Should Remain vs Become Historical

| Item | Verdict |
|------|---------|
| REAL-078 canonical architecture | **Remain** — update mappings in doc phase |
| docs/SYSTEM_ARCHITECTURE.md | **Historical** |
| Dual frontend folders | **Remain CURRENT** until ADR + FUTURE merge |
| Extension route gating | **Remain** — document as production mode |
| SQLite primary | **Remain CURRENT** — FUTURE Postgres |
| 285 validation tests | **Remain** — extend with E2E FUTURE |

---

## Gap Priority for Documentation Reconstruction

| Priority | Gap | Action |
|----------|-----|--------|
| P0 | GAP-01 Vision | Author Vision file |
| P0 | GAP-04 Production truth | Author production truth doc |
| P0 | GAP-05 Client ADR | Grand King decision |
| P1 | GAP-02 ECC | Design or defer in writing |
| P1 | GAP-03 VIE | Defer in writing |
| P2 | GAP-06–08 | FUTURE architecture sections |
| P2 | GAP-09 | E2E architecture spec |

---

## Completeness Calculation

| Category | Weight | Score |
|----------|--------|------:|
| Normative architecture doc (REAL-078) | 20% | 95% |
| Implementation coverage | 25% | 90% |
| Production architecture documented | 15% | 55% |
| Client architecture resolved | 10% | 50% |
| Identity tier (Vision) | 10% | 30% |
| Deferred systems (ECC/VIE) | 10% | 0% |
| HA/scaling architecture | 5% | 20% |
| Acceptance architecture | 5% | 60% |
| **Weighted total** | 100% | **~81%** |
