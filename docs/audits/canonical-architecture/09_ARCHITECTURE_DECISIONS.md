# 09 — Architecture Decisions

**Purpose:** Required and recommended ADRs to lock reconstructed architecture  
**Register target:** `EMPIREAI_DECISIONS.md`

---

## Resolved by Reconstruction (No New ADR — Document Only)

| Decision | Resolution |
|----------|------------|
| Apex governing document | CTD supreme commercial law |
| Pillow vs Brain peer hierarchy | Pillow owns; Brain executes — not peers |
| Canonical architecture normative source | REAL-078 + this reconstruction pack |
| Runtime modules naming | REAL-### = mission ID; "Runtime modules" = code layer |
| Extension routes in production | CURRENT: off by default — document, not change |
| Historical architecture | SYSTEM_ARCHITECTURE cluster excluded |

---

## Required ADRs (Before Constitution Lock)

### ADR-CON-001 — Production Grand King Client Authority
| Field | Value |
|-------|-------|
| **Question** | Which Vercel project is canonical Grand King Cockpit for empire-ai.co? |
| **Options** | A) empireai-web only B) frontend only C) split (marketing vs cockpit) |
| **RECOMMENDED** | C with **empireai-web = Cockpit authority** for executive journey |
| **Owner** | Grand King |
| **Blocks** | Client plane architecture closure |

### ADR-CON-002 — Production Mode Architecture
| Field | Value |
|-------|-------|
| **Question** | Is extension route gating + Pillow minimal chat intentional architecture? |
| **RECOMMENDED** | Yes — named **Production Mode** with documented boundaries |
| **Owner** | Chief Architect + Pillow |
| **Blocks** | Production truth doc |

### ADR-CON-003 — ECC Scope
| Field | Value |
|-------|-------|
| **Question** | Build ECC or defer to V2? |
| **RECOMMENDED** | **Defer to Tier 6** with explicit written scope stub |
| **Owner** | Chief Architect |
| **Blocks** | Hierarchy completeness |

### ADR-CON-004 — VIE Scope
| Field | Value |
|-------|-------|
| **Question** | Build Vision Integrity Engine or defer? |
| **RECOMMENDED** | **Defer to Tier 6** until Vision file exists |
| **Owner** | Chief Architect |
| **Blocks** | Hierarchy completeness |

### ADR-CON-005 — V1 Single-Instance Declaration
| Field | Value |
|-------|-------|
| **Question** | Is V1 Brain explicitly single-instance? |
| **RECOMMENDED** | Yes — document SQLite sql.js + in-memory Pillow sessions constraint |
| **Owner** | Chief Architect |
| **Blocks** | HA architecture gap closure |

---

## Recommended ADRs (Documentation Reconstruction Phase)

### ADR-ARCH-001 — REAL-078 Cockpit Mapping Update
Update REAL-078 §3.2 canonical mapping to reflect empireai-web/cockpit as CURRENT executive depth.

### ADR-ARCH-002 — Architecture Document Roles
Formalize: Canonical (REAL-078) · Reconstructed (this pack) · Operational (docs/ARCHITECTURE.md) · Historical · Evidence.

### ADR-ARCH-003 — Redis Production Requirement
Fail-fast or explicit degraded banner when Redis unavailable in production (architecture policy — implementation later).

### ADR-ARCH-004 — Postgres Migration Architecture
Document REAL-132 as FUTURE primary persistence without committing timeline.

### ADR-ARCH-005 — Commerce Namespace Evolution
Approve mapping table now; physical `commerce/` consolidation deferred to V2.

---

## Architecture Conflict Decisions

| Conflict | Decision |
|----------|----------|
| CTD vs Engineering on commercial | CTD wins — already in docs |
| Pillow full COI vs prod minimal | **Both true** — full package exists; Production Mode trims hot path |
| REAL-078 frontend vs empireai-web | **empireai-web CURRENT** — update REAL-078 RECOMMENDED |
| Guardian vs /health/live | **Layered** — liveness ≠ full health |
| Dual Bible | hierarchy bible canonical; master bible historical |
| Platform vs Cockpit | Platform routes = legacy alias → Cockpit |

---

## Decision Log Template (For New ADRs)

```markdown
## ADR-XXX — Title
**Status:** Proposed | Accepted | Deprecated
**Date:**
**Context:**
**Decision:**
**Consequences:**
**Architecture tier affected:**
**CURRENT / RECOMMENDED / FUTURE:**
```

---

## Architecture Authority Decision

**Chief Architect should cite architecture in this order:**

1. CTD (if commercial)  
2. Domain doctrines  
3. `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md`  
4. `docs/audits/canonical-architecture/01_CANONICAL_ARCHITECTURE.md` (reconstructed CURRENT truth)  
5. `docs/ARCHITECTURE.md` (developer operational)  
6. `EMPIREAI_STATUS.md` (as-built snapshot)  

Evidence audits never override 1–4.

---

## Pending Grand King Decisions

| ID | Decision | King required? |
|----|----------|----------------|
| ADR-CON-001 | Production client authority | **YES** |
| ADR-CON-003/004 | ECC/VIE defer vs build | Recommended King acknowledgment |
| Constitution Lock timing | After Vision + production truth | **YES** |
