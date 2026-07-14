# 03 — Canonical Document Tree

**Purpose:** ONE document hierarchy — where each class of truth lives and how agents navigate it.

---

## Tree Structure

```
EMPIREAI_REPOSITORY_MASTER_INDEX.md          ← START HERE (navigation root)
│
├── TIER 0–1 AUTHORITY (reference only in docs)
│   └── Grand King / Chief Architect / Pillow COI — described in GVD + Pillow Constitution
│
├── TIER 2 IDENTITY
│   ├── EMPIREAI_VISION.md                   [CANONICAL — TO AUTHOR]
│   ├── EMPIREAI_SOUL.md                     [CANONICAL]
│   └── MARKETPLACE_OS_VISION.md             [OPERATIONAL input → merge into Vision]
│
├── TIER 3 LAW — Constitutions & Doctrines
│   ├── EMPIREAI_CORE_CONSTITUTION_CTD.md    [CANONICAL APEX]
│   ├── EMPIREAI_CONSTITUTION.md             [CANONICAL — Engineering]
│   ├── EMPIREAI_GOVERNANCE_DOCTRINE_GVD.md  [CANONICAL]
│   ├── EMPIREAI_ARCHITECTURE_CONSTRAINTS_ACD.md
│   ├── EMPIREAI_UX_IDENTITY_DOCTRINE_UID.md
│   ├── EMPIREAI_COMMERCIAL_BUSINESS_DOCTRINE_CBD.md
│   ├── EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md
│   ├── EMPIREAI_PILLOW_CONSTITUTION.md      [CANONICAL — Pillow master]
│   ├── EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md
│   ├── EMPIREAI_PILLOW_MEMORY_DOCTRINE.md
│   ├── CANONICAL_EKLS_SPECIFICATION.md
│   └── docs/executive-intelligence/
│       ├── EI_INDEX.md                      [CANONICAL — EI entry]
│       ├── EI0–EI10                         [CANONICAL — EI library]
│       └── PILLOW_EXECUTIVE_CONSTITUTION.md [CANONICAL — rename display to "EI Pillow Roles"]
│
├── TIER 3 LAW — Architecture (normative)
│   ├── docs/architecture/
│   │   ├── EMPIREAI_CANONICAL_ARCHITECTURE.md  [CANONICAL TARGET]
│   │   ├── DEVELOPMENT_DOCTRINE.md
│   │   └── cockpit/                         [CANONICAL — cockpit specs]
│   ├── PILLOW_ARCHITECTURE_CONTRACT.md
│   ├── EMPIREAI_PILLOW_ARCHITECTURE.md
│   ├── EMPIREAI_EYE_ARCHITECTURE.md
│   └── EMPIREAI_GLOBAL_PRODUCT_INTELLIGENCE_ARCHITECTURE.md
│
├── TIER 4 PROGRAMME
│   ├── EMPIREAI_ROADMAP.md                  [CANONICAL — empire]
│   ├── PILLOW_ROADMAP.md                    [CANONICAL — pillow]
│   ├── docs/executive-intelligence/EXECUTIVE_INTELLIGENCE_ROADMAP_v1.md
│   ├── docs/architecture/cockpit/COCKPIT_IMPLEMENTATION_ROADMAP.md
│   ├── artifacts/empireai-version-1-build-hierarchy-bible.md  [CANONICAL V1 BIBLE]
│   ├── JOURNEY.md                           [CANONICAL — live ops index]
│   ├── JOURNEY_AUDIT.md
│   ├── EMPIREAI_STATUS.md                   [OPERATIONAL — current state]
│   ├── EMPIREAI_DECISIONS.md                [CANONICAL — ADRs]
│   └── docs/governance/
│       ├── EXECUTIVE_AUDIT_INDEX.md         [CANONICAL — audit registry]
│       ├── VERSION_1_CERTIFICATION_MODE.md
│       ├── VERSION_1_GO_LIVE_PREPARATION_CHECKLIST.md
│       ├── PILLOW_PRODUCT_INTEGRATION_MASTER_PLAN.md
│       └── EMPIREAI_CONSTITUTION_HIERARCHY.md  [TO AUTHOR — one-pager]
│
├── TIER 5 SYSTEMS — Operational docs
│   ├── docs/ARCHITECTURE.md                 [OPERATIONAL — developer entry]
│   ├── deployment/MANAGED_DEPLOYMENT.md     [CANONICAL — production sequence]
│   ├── deployment/railway-production.env.template
│   ├── deployment/vercel-cockpit.env.template
│   ├── backend/README.md
│   ├── backend/MISSION_CONTROL_BUILD_BIBLE.md  [OPERATIONAL — MCL scope only]
│   └── README.md                            [OPERATIONAL — repo entry]
│
├── EVIDENCE — Historical (immutable)
│   ├── COMBINED_EXECUTIVE_AUDIT_*.md        [38 files — EVIDENCE]
│   ├── artifacts/*-executive-audit.md       [~94 — EVIDENCE]
│   ├── artifacts/*-evidence.json            [7 — EVIDENCE]
│   ├── SA-001_*                             [EVIDENCE]
│   ├── CURSOR_PROGRESS_REPORT*.md           [EVIDENCE]
│   └── docs/audits/full-empireai-audit/     [EVIDENCE — this audit]
│
└── HISTORICAL — Obsolete (do not cite as law)
    ├── docs/SYSTEM_ARCHITECTURE.md
    ├── docs/DATABASE_SCHEMA.md
    ├── docs/DASHBOARD_SCREENS.md
    ├── docs/AI_EMPLOYEES.md
    ├── docs/FOUNDER_EXPERIENCE.md
    ├── docs/NAVIGATION.md
    ├── docs/PRODUCT_INTELLIGENCE_ENGINE.md
    ├── EMPIREAI_ARCHITECTURE.md             [OPERATIONAL MEMORY — not obsolete but not normative]
    ├── artifacts/empireai-master-build-bible.md
    └── PILLOW_RUNTIME_INTEGRATION_PLAN.md   [complete — historical]
```

---

## Document Class Definitions

| Class | Definition | Edit rule |
|-------|------------|-----------|
| **CANONICAL** | Active law, identity, programme, or normative target | Change only via constitution/amendment process |
| **OPERATIONAL** | Current implementation truth, dev guides, status | Update with each release |
| **EVIDENCE** | Immutable audit/certification/proof | Never edit body; add new evidence files |
| **HISTORICAL** | Superseded or obsolete | Archive label only; no new content |
| **STUB** | Placeholder | Replace or delete in implementation phase |

---

## Required New Documents (Before Constitution Construction)

| Document | Tier | Purpose |
|----------|------|---------|
| `EMPIREAI_VISION.md` | 2 | Single Vision file |
| `docs/governance/EMPIREAI_CONSTITUTION_HIERARCHY.md` | 3 | One-page law map |
| `docs/governance/EMPIREAI_PRODUCTION_TRUTH.md` | 5 | Production route + mode policy |
| ADR-CON-001 | 4 | Frontend production authority |

---

## Navigation Rule for Agents

1. Open `EMPIREAI_REPOSITORY_MASTER_INDEX.md`
2. Identify tier + classification
3. If CANONICAL law → read CTD first, then domain doc
4. If architecture question → `EMPIREAI_CANONICAL_ARCHITECTURE.md` only for normative
5. If "what exists now" → `EMPIREAI_STATUS.md` + audit evidence
6. Never cite HISTORICAL or EVIDENCE as current law
