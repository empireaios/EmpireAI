# 01 — Canonical Hierarchy (Permanent)

**Status:** RECOMMENDED CANONICAL — not yet ratified  
**Supersedes:** Informal hierarchy scattered across audit, mission briefs, and Pillow §17  
**Does not modify:** Production code or folder structure

---

## Permanent EmpireAI Hierarchy

```
TIER 0 — SUPREME AUTHORITY
└── Grand King
    └── Human sovereign operator; founder role; final approval

TIER 1 — STRATEGIC AUTHORITY (non-runtime)
├── ChatGPT Chief Architect
│   └── Strategic architecture, constitution drafting, mission design
└── Pillow — Chief Operating Intelligence (COI)
    └── Executive reasoning, repository intelligence, engineering supervision
    └── Code: pillow/ + backend/orchestration/pillow-host/

TIER 2 — IDENTITY (why / who)
├── Vision File          → EMPIREAI_VISION.md          [TO AUTHOR]
├── Soul File            → EMPIREAI_SOUL.md            [EXISTS]
└── Identity Registry    → foundation/identity-registry/ [runtime mirror]

TIER 3 — LAW (what must be true)
├── Supreme Commercial Law
│   └── EMPIREAI_CORE_CONSTITUTION_CTD.md             [APEX GOVERNING DOC]
├── Engineering Law
│   └── EMPIREAI_CONSTITUTION.md                      [Brain / Guardian]
├── Autonomous Engineering Standards
│   └── EMPIREAI_CURSOR_OUTPUT_STANDARD.md
│   └── EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md
│   └── (collectively: "Engineering Standards" — not a separate constitution file)
├── Governance Doctrine
│   └── EMPIREAI_GOVERNANCE_DOCTRINE_GVD.md
├── Architecture Constraints
│   └── EMPIREAI_ARCHITECTURE_CONSTRAINTS_ACD.md
├── UX Identity Doctrine
│   └── EMPIREAI_UX_IDENTITY_DOCTRINE_UID.md
├── Commercial Business Doctrine
│   └── EMPIREAI_COMMERCIAL_BUSINESS_DOCTRINE_CBD.md
├── Continuous Improvement
│   └── EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md
├── Pillow Master Identity
│   └── EMPIREAI_PILLOW_CONSTITUTION.md
├── Pillow Cognition Layer
│   └── EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md
└── Executive Intelligence Library
    └── docs/executive-intelligence/EI0–EI10

TIER 4 — PROGRAMME (what we build, in what order)
├── Master Roadmap
│   └── EMPIREAI_ROADMAP.md
├── Domain Roadmaps
│   ├── PILLOW_ROADMAP.md
│   ├── docs/executive-intelligence/EXECUTIVE_INTELLIGENCE_ROADMAP_v1.md
│   └── docs/architecture/cockpit/COCKPIT_IMPLEMENTATION_ROADMAP.md
├── EmpireAI Bible (V1)
│   └── artifacts/empireai-version-1-build-hierarchy-bible.md
├── Journey & Status
│   ├── JOURNEY.md
│   └── EMPIREAI_STATUS.md
└── Decision Register
    └── EMPIREAI_DECISIONS.md

TIER 5 — SYSTEMS (how it runs)
├── EmpireAI Operating System (concept + Pillow EOS module)
│   └── pillow/src/empire-operating-system/
├── Brain (execution kernel)
│   └── backend/ — brain/, auth/, orchestrator, guardian
├── Cockpit (Grand King executive interface)
│   └── empireai-web/ — primary recommendation pending ADR
│   └── frontend/ — marketing/login shell; legacy redirect layer
├── Builder / Cursor Bridge
│   └── pillow/cursor-bridge/ + pillow-approval/
├── Runtime (REAL mission modules)
│   └── backend/src/runtime/ — REAL-### namespace
├── Commerce & Business Engines
│   └── backend/src/orchestration/, intelligence/, execution/, revenue/
├── Production
│   └── deployment/MANAGED_DEPLOYMENT.md + Railway + Vercel
└── Guardian (health & risk)
    └── backend/src/guardian/

TIER 6 — DEFERRED / V2 (explicitly not V1 canonical until designed)
├── Vision Integrity Engine (VIE)     [NOT FOUND — defer or design]
└── Execution Control Center (ECC)    [NOT FOUND — defer or design]
```

---

## Hierarchy Rules (Permanent)

1. **Higher tier wins on conflict** — CTD beats Engineering Constitution on commercial matters.
2. **Identity before law** — Vision and Soul inform but do not override CTD.
3. **Law before programme** — Roadmaps must not contradict CTD or Engineering Constitution.
4. **Programme before systems** — Bible and roadmaps describe systems; systems do not redefine law.
5. **One canonical doc per tier-slot** — duplicates must be reclassified Historical or Operational.
6. **Mission IDs are traceability, not hierarchy** — REAL-###, G2–G8, PILLOW-### sit under Tier 5 evidence, not Tier 3 law.

---

## Conflict Resolution Order

When documents disagree, apply in order:

1. `EMPIREAI_CORE_CONSTITUTION_CTD.md`
2. Domain constitutions and doctrines (GVD, ACD, UID, CBD, Pillow, EI)
3. `EMPIREAI_CONSTITUTION.md` (engineering)
4. `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md`
5. `EMPIREAI_ROADMAP.md` and V1 Bible
6. Operational docs (`docs/ARCHITECTURE.md`, `EMPIREAI_STATUS.md`)
7. Historical artifacts and combined executive audits (evidence only)

---

## Mapping: Intended Mission Brief → Permanent Hierarchy

| Mission brief term | Permanent tier placement |
|------------------|-------------------------|
| Grand King | Tier 0 |
| ChatGPT Chief Architect | Tier 1 |
| Pillow COI | Tier 1 |
| EmpireAI Operating System | Tier 5 (system) |
| Soul / Vision / Bible / Roadmap | Tier 2 / Tier 4 |
| Autonomous Engineering Constitution | Tier 3 (Engineering Law + Cursor Standards) |
| Vision Integrity Engine | Tier 6 (deferred) |
| Execution Control Center | Tier 6 (deferred) |
| Brain / Cockpit / Builder / Runtime / Commerce / Production | Tier 5 |
