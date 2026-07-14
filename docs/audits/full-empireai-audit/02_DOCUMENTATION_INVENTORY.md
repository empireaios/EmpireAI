# 02 — Documentation Inventory

**Total markdown scanned (excl. node_modules):** ~499 files  
**`docs/` subtree:** 81 files  
**`artifacts/`:** 130 files  
**Root governance `.md`:** ~115+  
**Combined executive audits (root):** 38  

---

## Classification Legend

| Tag | Meaning |
|-----|---------|
| **CANONICAL** | Active law, navigation, or normative target |
| **HISTORICAL** | Immutable certification/milestone evidence |
| **DUPLICATE** | Overlaps another doc; needs hierarchy label |
| **OBSOLETE** | Superseded or contradicts current architecture |
| **UNCLEAR** | Purpose ambiguous or stale index |

---

## Navigation Spine (CANONICAL)

| File | Purpose |
|------|---------|
| `EMPIREAI_REPOSITORY_MASTER_INDEX.md` | Master file catalog |
| `JOURNEY.md` | Operational status index |
| `JOURNEY_AUDIT.md` | Structural change log |
| `EMPIREAI_STATUS.md` | Current implementation state |
| `README.md` | Project entry |

---

## Constitution & Doctrine Stack (CANONICAL — layered)

| File | Layer | Tag |
|------|-------|-----|
| `EMPIREAI_CORE_CONSTITUTION_CTD.md` | Supreme V1 commercial law (CTD-001→040) | CANONICAL supreme |
| `EMPIREAI_CONSTITUTION.md` | Engineering Brain/Guardian law | CANONICAL (defers to CTD commercially) |
| `EMPIREAI_GOVERNANCE_DOCTRINE_GVD.md` | Roles, approval, audit | CANONICAL |
| `EMPIREAI_ARCHITECTURE_CONSTRAINTS_ACD.md` | Modular architecture rules | CANONICAL |
| `EMPIREAI_UX_IDENTITY_DOCTRINE_UID.md` | Founder UX law | CANONICAL |
| `EMPIREAI_COMMERCIAL_BUSINESS_DOCTRINE_CBD.md` | Commercial soul | CANONICAL |
| `EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md` | Enhancement lifecycle | CANONICAL |
| `EMPIREAI_PILLOW_CONSTITUTION.md` | Master Pillow V1 identity | CANONICAL Pillow master |
| `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` | Pillow cognition/learning | CANONICAL Layer 2 |
| `docs/executive-intelligence/EI0–EI10` | Executive Intelligence library | CANONICAL EI |
| `docs/executive-intelligence/PILLOW_EXECUTIVE_CONSTITUTION.md` | EIR executive roles | CANONICAL EI — **DUPLICATE name risk** vs root Pillow constitution |

---

## Roadmaps (CANONICAL — complementary scopes)

| File | Scope |
|------|-------|
| `EMPIREAI_ROADMAP.md` | Empire five-layer direction |
| `PILLOW_ROADMAP.md` | Pillow runtime vs EI |
| `docs/executive-intelligence/EXECUTIVE_INTELLIGENCE_ROADMAP_v1.md` | EI library |
| `docs/architecture/cockpit/COCKPIT_IMPLEMENTATION_ROADMAP.md` | Cockpit only |
| `PILLOW_RUNTIME_INTEGRATION_PLAN.md` | **HISTORICAL** — complete; superseded by Product Integration Master Plan |

---

## Architecture Documents

| File | Tag | Notes |
|------|-----|-------|
| `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md` | CANONICAL | Normative target (REAL-078) |
| `docs/ARCHITECTURE.md` | CANONICAL | Developer operational doc |
| `EMPIREAI_ARCHITECTURE.md` | DUPLICATE | Living memory; older control-plane view |
| `docs/SYSTEM_ARCHITECTURE.md` | OBSOLETE | Pre-Pillow "Commerce SaaS" draft — **conflicts** |
| `PILLOW_ARCHITECTURE_CONTRACT.md` | CANONICAL | Frozen Pillow contract |
| `EMPIREAI_PILLOW_ARCHITECTURE.md` | CANONICAL | Domain architecture |
| `EMPIREAI_EYE_ARCHITECTURE.md` | CANONICAL | Eye connector architecture |

---

## Bibles

| File | Tag |
|------|-----|
| `artifacts/empireai-version-1-build-hierarchy-bible.md` | **CANONICAL V1 bible** |
| `artifacts/empireai-master-build-bible.md` | HISTORICAL — superseded |
| `backend/MISSION_CONTROL_BUILD_BIBLE.md` | CANONICAL for MCL/backend scope |

---

## Vision & Soul

| File | Tag | Notes |
|------|-----|-------|
| `EMPIREAI_SOUL.md` | CANONICAL | Identity & mission memory |
| `MARKETPLACE_OS_VISION.md` | PARTIAL | Not a complete Empire Vision file |
| **EMPIREAI_VISION.md** | **MISSING** | Intended hierarchy check |

---

## `docs/` Subfolders

| Folder | Files | Tag |
|--------|------:|-----|
| `docs/governance/` | 24 | CANONICAL — certification, CRI, registers, audit index |
| `docs/executive-intelligence/` | 38 | CANONICAL — EI library + EIR reports |
| `docs/architecture/` | 3 + cockpit/7 | CANONICAL |
| `docs/` root | 9 | MIXED — includes legacy product specs |

**Stale:** `docs/README.md` says "scaffold only" — contradicts 81 substantive files.

---

## `artifacts/` (HISTORICAL certification evidence)

| Prefix | Count (approx) | Domain |
|--------|----------------|--------|
| g2- | 10+ | Commerce integration framework |
| g3- | 11+ | Intelligence engines |
| g4- | 10+ | Grand King Cockpit |
| g5- | 10+ | Business automation |
| g6- | 11+ | Production certification |
| g7- | 11+ | Grand King live operations |
| g8- | 11+ | Identity & authorization |
| b6- | 10+ | Live auth (Amazon, CJ, Stripe, vault) |
| empire-v1- | 6+ | Version lock & activation |
| pillow- | 4+ | Pillow completion |

**Evidence JSON (immutable):** 7 files (`b5-production-deploy-evidence.json`, `g4-05b-auth-verification-results.json`, etc.)

---

## Combined Executive Audits (root, 38 files)

**Tag:** HISTORICAL / CANONICAL audit bodies (indexed by `docs/governance/EXECUTIVE_AUDIT_INDEX.md` — **stale: lists 32, disk has 38**).

Categories: REAL batches, doctrine batches (CTD/GVD/ACD/UID/CBD), Pillow/V1 ops, UX/GC, managed deployment.

---

## Mission / Progress Reports

| File | Tag |
|------|-----|
| `CURSOR_PROGRESS_REPORT.md` | HISTORICAL — CBD complete |
| `CURSOR_PROGRESS_REPORT_REAL-002A.md` | HISTORICAL |
| `EMPIRE_RETURN_PACKAGE.md` | HISTORICAL |
| `EMPIRE_REVIEW_PACKAGE.md` | HISTORICAL |
| `SA-001_*` (5 files) | HISTORICAL supreme audit bundle |
| `GO-001`, `GO-002` | CANONICAL planning |

---

## Documentation Health Summary

| Metric | Assessment |
|--------|------------|
| Volume | **Very high** — risk of agent confusion |
| Canonical spine | **Present** but requires master index discipline |
| Duplication | **Moderate** — architecture, Pillow constitution naming |
| Obsolete content | **Present** — SYSTEM_ARCHITECTURE draft, stale indexes |
| Vision gap | **Critical** — no single Vision file |
| Test of docs vs code | **Partial** — many REAL modules documented; production route gating under-documented |
