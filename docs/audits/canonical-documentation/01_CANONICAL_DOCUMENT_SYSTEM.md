# 01 — Canonical Document System

**Status:** RECONSTRUCTED — **superseded by** [`EMPIREAI_DOCUMENTATION_LAW.md`](../../governance/EMPIREAI_DOCUMENTATION_LAW.md) (P2-06 · ECDS-1 ratified). Retained as **EVIDENCE** only.  
**Purpose:** Define ONE permanent documentation system for EmpireAI

---

## 1. System Definition

The EmpireAI Canonical Documentation System (ECDS-1) is a **single hierarchy of truth** with:

1. **Five tiers** of authority (0–5) plus **Tier 6 deferred**
2. **Five classifications** (Canonical, Operational, Evidence, Historical, Stub)
3. **One navigation root** (`EMPIREAI_REPOSITORY_MASTER_INDEX.md`)
4. **One supreme governing document** (`EMPIREAI_CORE_CONSTITUTION_CTD.md`)
5. **One precedence chain** for conflict resolution (see `03_DOCUMENT_PRECEDENCE.md`)
6. **One lifecycle model** (see `07_DOCUMENT_LIFECYCLE.md`)

**Rule:** No document may compete at the same tier and classification without an explicit precedence rule or ADR.

---

## 2. Tier Model

```
TIER 0 — SUPREME AUTHORITY
└── Grand King (human sovereign — not a file)

TIER 1 — STRATEGIC AUTHORITY (non-runtime)
├── Chief Architect (ChatGPT — strategic design, constitution drafting)
└── Pillow COI (operating intelligence — identity in Pillow constitutions)

TIER 2 — IDENTITY
├── EMPIREAI_VISION.md              [CANONICAL — TO AUTHOR]
├── EMPIREAI_SOUL.md                [CANONICAL — EXISTS]
└── foundation/identity-registry/   [OPERATIONAL runtime mirror]

TIER 3 — LAW
├── Apex: EMPIREAI_CORE_CONSTITUTION_CTD.md
├── Engineering: EMPIREAI_CONSTITUTION.md + Cursor standards
├── Doctrines: GVD, ACD, UID, CBD, BL-C
├── Pillow law: Pillow Constitution, Pillow EI Constitution, Memory Doctrine
├── EI library: EI_INDEX + EI0–EI10 + EI Pillow Executive Roles doc
├── Architecture law: EMPIREAI_CANONICAL_ARCHITECTURE.md + cockpit specs
├── Knowledge law: CANONICAL_EKLS_SPECIFICATION.md
└── Constitution map: EMPIREAI_CONSTITUTION_HIERARCHY.md [TO AUTHOR]

TIER 4 — PROGRAMME
├── Roadmaps (Empire, Pillow, EI, Cockpit)
├── V1 Bible: artifacts/empireai-version-1-build-hierarchy-bible.md
├── Journey: JOURNEY.md, JOURNEY_AUDIT.md
├── Status: EMPIREAI_STATUS.md
├── ADRs: EMPIREAI_DECISIONS.md
├── Governance registers (audit index, certification, enhancement registers)
└── Commerce canon: COMMERCE_OS_BLUEPRINT.md, EMPIREAI_COMMERCE_CANON.md

TIER 5 — SYSTEMS (operational truth)
├── docs/ARCHITECTURE.md (developer operational guide)
├── docs/governance/EMPIREAI_PRODUCTION_TRUTH.md [TO AUTHOR]
├── deployment/MANAGED_DEPLOYMENT.md
├── backend/README.md, MISSION_CONTROL_BUILD_BIBLE.md
├── README.md (repo entry)
└── Domain READMEs and deployment templates

TIER 6 — DEFERRED (FUTURE slots)
├── Vision Integrity Engine (VIE) — design or deferral doc
└── Execution Control Center (ECC) — design or deferral doc

EVIDENCE LAYER (cross-cutting, immutable)
├── COMBINED_EXECUTIVE_AUDIT_*.md (38)
├── artifacts/*-executive-audit.md (~94)
├── artifacts/*-evidence.json (7)
├── SA-001 bundle, progress reports, audit packs
└── docs/audits/* (this reconstruction)

HISTORICAL LAYER (cross-cutting, superseded)
├── docs/SYSTEM_ARCHITECTURE.md cluster (7 files)
├── artifacts/empireai-master-build-bible.md
└── PILLOW_RUNTIME_INTEGRATION_PLAN.md
```

---

## 3. Classification Enum

| Classification | Definition | Citation rule |
|----------------|------------|---------------|
| **CANONICAL** | Active law, identity, normative architecture, programme authority | Cite as governing truth |
| **OPERATIONAL** | Current implementation map, dev guides, status, scoped bibles | Cite for "what runs now" |
| **EVIDENCE** | Immutable audit, certification, mission proof | Cite for proof only — never as law |
| **HISTORICAL** | Superseded or obsolete | Do not cite as current truth |
| **STUB** | Placeholder or empty scaffold | Replace or archive in implementation phase |

---

## 4. Document Domains (Minimum Set)

| Domain | Primary canonical anchor(s) | Tier |
|--------|----------------------------|------|
| **Vision** | `EMPIREAI_VISION.md` [TO AUTHOR] | 2 |
| **Soul** | `EMPIREAI_SOUL.md` | 2 |
| **CTD** | `EMPIREAI_CORE_CONSTITUTION_CTD.md` | 3 |
| **Engineering Constitution** | `EMPIREAI_CONSTITUTION.md` | 3 |
| **Governance** | GVD, governance/ folder registers | 3–4 |
| **Architecture** | `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md` | 3 |
| **Pillow** | Pillow Constitution + Pillow Architecture + Memory Doctrine | 3 |
| **Executive Intelligence** | `docs/executive-intelligence/EI_INDEX.md` + EI0–EI10 | 3 |
| **Commerce** | CBD, COMMERCE_OS_BLUEPRINT, EMPIREAI_COMMERCE_CANON | 3–4 |
| **Cockpit** | `docs/architecture/cockpit/*` | 3 |
| **Brain** | Engineering Constitution + `docs/ARCHITECTURE.md` | 3–5 |
| **Production** | MANAGED_DEPLOYMENT + EMPIREAI_PRODUCTION_TRUTH [TO AUTHOR] | 5 |
| **Journey** | JOURNEY.md, JOURNEY_AUDIT.md | 4 |
| **Roadmaps** | EMPIREAI_ROADMAP, PILLOW_ROADMAP, domain roadmaps | 4 |
| **Bible** | `artifacts/empireai-version-1-build-hierarchy-bible.md` | 4 |
| **Master Index** | `EMPIREAI_REPOSITORY_MASTER_INDEX.md` | Navigation |
| **ADR** | `EMPIREAI_DECISIONS.md` | 4 |
| **Standards** | Cursor Output Standard, Recovery Doctrine, ECNS-1 | 3 |
| **Specifications** | Cockpit specs, EKLS, Pillow Architecture Contract | 3 |
| **Audits** | EXECUTIVE_AUDIT_INDEX + combined audits | 4 / EVIDENCE |
| **Evidence** | Artifact audits, JSON evidence, audit packs | EVIDENCE |
| **Historical** | SYSTEM_ARCHITECTURE cluster, master build bible | HISTORICAL |
| **README** | Root README, backend README, deployment README | 5 OPERATIONAL |
| **Developer Guides** | `docs/ARCHITECTURE.md`, backend bible (scoped) | 5 |
| **Deployment** | MANAGED_DEPLOYMENT, env templates | 5 |
| **Testing** | Test docs in governance, REAL test references | 5 OPERATIONAL |
| **Mission Reports** | CURSOR_PROGRESS_REPORT*, EMPIRE_RETURN_PACKAGE | EVIDENCE |
| **Completion Reports** | artifacts/*-completion-summary.md | EVIDENCE |
| **Registers** | Enhancement registers, certification registers, audit index | 4 |

---

## 5. What ECDS-1 Is NOT

| Not this | Because |
|----------|---------|
| A file reorganization | Mission is read-only; paths unchanged |
| A merge of constitutions | Layered stack is intentional |
| A rewrite of CTD or doctrines | Existing law preserved |
| A new Vision | Vision must be **authored** by Grand King process |
| Implementation | No code, moves, renames, or deletions |

---

## 6. Single System Authority After This Mission

**Primary reference:** This file + `05_DOCUMENT_CLASSIFICATION.md`  
**Normative inputs reconciled:** Normalization `03_CANONICAL_DOCUMENT_TREE.md`, Architecture `01_CANONICAL_ARCHITECTURE.md`  
**Operational companion:** `EMPIREAI_REPOSITORY_MASTER_INDEX.md` (must gain classification columns)

---

## 7. Ratification Path (FUTURE)

1. Complete P0 gaps (Vision, hierarchy one-pager, production truth, ADR-CON-001)
2. Grand King reviews ECDS-1 pack at Constitution Construction ceremony
3. Master Index updated with full classification matrix
4. Constitution Lock ratifies tier model as permanent

**CURRENT:** System defined in audit evidence — not yet ratified.  
**RECOMMENDED:** Adopt ECDS-1 as-is at Constitution Lock with P0 completions.  
**FUTURE:** Tier 6 slots (VIE, ECC) resolved via ADR or explicit deferral annex.
