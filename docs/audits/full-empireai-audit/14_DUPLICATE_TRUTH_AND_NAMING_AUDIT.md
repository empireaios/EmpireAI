# 14 — Duplicate Truth and Naming Audit

---

## Duplicate Document Families

### Architecture (4 active layers + 1 obsolete)

| Document | Problem |
|----------|---------|
| `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md` | Normative target — **should be cited first** |
| `docs/ARCHITECTURE.md` | Operational dev doc — overlaps canonical |
| `EMPIREAI_ARCHITECTURE.md` | Living memory — older terminology |
| `docs/SYSTEM_ARCHITECTURE.md` | **OBSOLETE** — pre-Pillow SaaS model conflicts |
| `docs/DATABASE_SCHEMA.md`, `DASHBOARD_SCREENS.md`, etc. | Legacy companions to SYSTEM_ARCHITECTURE |

**Recommendation:** Mark SYSTEM_ARCHITECTURE cluster as HISTORICAL in master index.

---

### Constitution naming collisions

| Name collision | Files |
|----------------|-------|
| "Pillow Executive Constitution" | `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` (root) vs `docs/executive-intelligence/PILLOW_EXECUTIVE_CONSTITUTION.md` (EI library) |
| "Constitution" | CTD vs Engineering vs Pillow vs BL-C vs EI1 |
| "Empire Constitution" | Multiple — hierarchy documented in CTD preamble |

**Recommendation:** One-page constitution map with explicit "when to read which."

---

### Bible documents

| File | Status |
|------|--------|
| `artifacts/empireai-version-1-build-hierarchy-bible.md` | **CANONICAL V1** |
| `artifacts/empireai-master-build-bible.md` | HISTORICAL |
| `backend/MISSION_CONTROL_BUILD_BIBLE.md` | Scoped to MCL/backend |

---

### Roadmaps (complementary, not duplicate)

Empire, Pillow, EI, Cockpit roadmaps — **acceptable** if master index lists hierarchy.

---

### Frontend surfaces

| Name | Path | Confusion |
|------|------|-----------|
| "Founder UX" | `frontend/` | V1 contract in deployment |
| "Cockpit" | `empireai-web/` | Actual 53-page executive UI |
| "Dashboard" | `frontend/src/pages/dashboard/` | Legacy, redirects |

---

## Cryptic Abbreviations (Common in Repo)

| Abbr | Expansion | Where used |
|------|-----------|------------|
| REAL | Repository Empire Architecture Layer missions | REAL-101+, runtime/ |
| CTD | Core Truth Doctrine | Constitution |
| GVD | Governance Doctrine | Roles |
| ACD | Architecture Constraints Doctrine | Modularity |
| UID | UX Identity Doctrine | Founder UX |
| CBD | Commercial Business Doctrine | Commerce soul |
| EI | Executive Intelligence | docs/executive-intelligence/ |
| EIR | Executive Intelligence Release | EIR-001–006 |
| EKLS | Empire Knowledge & Learning System | CANONICAL_EKLS_SPECIFICATION |
| ESIS | Executive Summary Intelligence System | Executive home (skipped in prod dispatch) |
| CRIR | Commerce Readiness Intelligence Report | commerce-readiness-engine |
| G2–G8 | Gate programmes | artifacts + tests |
| B6 | Live auth batch | artifacts/b6-* |
| PILLOW-016 | Brain integration mission | pillow-host |
| MCL | Mission Control Layer | backend bible |
| BFF | Backend-for-frontend | empireai-web API routes |
| EOS | Empire Operating System | pillow phase 9 |
| CEV | Continuous Evolution | pillow phase 10 |

**Risk:** New agents without master index struggle with REAL vs runtime vs orchestration naming.

---

## Stale Names & Indexes

| Item | Issue |
|------|-------|
| `docs/governance/EXECUTIVE_AUDIT_INDEX.md` | Lists 32 audits; 38 on disk |
| `docs/README.md` | Says "scaffold only" |
| `frontend/` dashboard pages | Legacy naming while redirected |
| `@deprecated` adapters | Amazon US legacy, executive home warmup |

---

## Recommended Canonical Naming (Readable)

| Concept | Canonical name | Canonical path |
|---------|----------------|----------------|
| Empire identity | Soul File | `EMPIREAI_SOUL.md` |
| Empire vision | Vision File | **TO CREATE** `EMPIREAI_VISION.md` |
| Supreme commercial law | CTD Constitution | `EMPIREAI_CORE_CONSTITUTION_CTD.md` |
| Engineering law | Brain Constitution | `EMPIREAI_CONSTITUTION.md` |
| Pillow master identity | Pillow Constitution | `EMPIREAI_PILLOW_CONSTITUTION.md` |
| Architecture target | Canonical Architecture | `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md` |
| V1 build map | V1 Hierarchy Bible | `artifacts/empireai-version-1-build-hierarchy-bible.md` |
| Production ops | Managed Deployment | `deployment/MANAGED_DEPLOYMENT.md` |
| Grand King UI | Cockpit (specify project) | `empireai-web/` **or** `frontend/` — **decision needed** |
| Backend API | Brain | `backend/` |
| Executive AI package | Pillow | `pillow/` |

---

## Naming Health

| Dimension | Assessment |
|-----------|------------|
| Abbreviation density | **High** — requires glossary |
| Duplicate titles | **Moderate** — fixable with index |
| Stale indexes | **Present** — audit index, docs README |
| Readable names for Constitution lock | **Not yet** — needs Vision + hierarchy one-pager |
