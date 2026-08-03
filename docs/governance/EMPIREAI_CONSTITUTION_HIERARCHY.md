# EMPIREAI CONSTITUTION HIERARCHY

> **Classification:** CANONICAL — Tier 3 Law (Governance)  
> **Document ID:** P2-01 · CON-004  
> **Constitutional phase:** P2 — Constitution Foundation  
> **Dependency:** P1 Identity Foundation complete (P1-01 → P1-10)  
> **Authority:** Grand King  
> **Established:** 2026-07-05 (supersedes CON-004 draft 2026-07-04)  
> **Role:** **Highest governance map** for every constitutional document, doctrine, roadmap, and governance artifact  
> **Platform structure (non-constitutional):** [`EMPIREAI_HIERARCHY.md`](./EMPIREAI_HIERARCHY.md) (P1-06)

**Parent entry:** [`EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md`](./EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md)  
**Ownership:** [`EMPIREAI_OWNERSHIP_MODEL.md`](./EMPIREAI_OWNERSHIP_MODEL.md) · **Terms:** [`EMPIREAI_GLOSSARY.md`](./EMPIREAI_GLOSSARY.md) · **Truth:** [`EMPIREAI_PRODUCTION_TRUTH.md`](./EMPIREAI_PRODUCTION_TRUTH.md)

---

## 1. Purpose

Phase P1 established constitutional **identity**. Phase P2 establishes constitutional **governance map**.

Every constitutional document, doctrine, roadmap authority, and governance artifact must **derive from this hierarchy** — one parent, one owner, one location, one meaning.

This document defines:

- **Authority** — who may govern what  
- **Inheritance** — what subordinate docs inherit  
- **Dependency** — required reads before action  
- **Precedence** — which document wins on conflict  
- **Ownership** — constitutional accountability  
- **Citation** — how agents reference truth  
- **Evolution** — how new constitutional artifacts are born  

**The principle:** No duplicate constitutional authority · one canonical parent · higher tier prevails on conflict.

---

## 2. Relationship to Other Hierarchies

| Document | Scope | Relationship to this doc |
|----------|-------|------------------------|
| [`EMPIREAI_HIERARCHY.md`](./EMPIREAI_HIERARCHY.md) | Platform components (Brain, Cockpit, etc.) | **Structural** — subordinate view for runtime placement |
| [`EMPIREAI_VISION_HIERARCHY.md`](./EMPIREAI_VISION_HIERARCHY.md) | Vision tier inputs | **Specialized** — Vision read order |
| [`EMPIREAI_ROADMAP_HIERARCHY.md`](./EMPIREAI_ROADMAP_HIERARCHY.md) | Roadmap stack | **Specialized** — programme sequencing |
| **This document** | Constitutional documents & law | **Apex governance map** for cite authority |

**Rule:** On conflict between maps, **this Constitution Hierarchy** wins for **law and document authority**; **EMPIREAI_HIERARCHY** wins for **subsystem placement**.

---

## 3. Hierarchy Tree (Tiers 0–7)

```
TIER 0 — SUPREME AUTHORITY
└── Grand King

TIER 1 — STRATEGIC AUTHORITY
├── Chief Architect (ChatGPT)
└── Pillow COI

TIER 2 — IDENTITY (inform law; bounded by Tier 3)
├── Vision          → EMPIREAI_VISION.md
└── Soul            → EMPIREAI_SOUL.md

TIER 3 — CONSTITUTION & LAW
├── Core Constitution (CTD)     → EMPIREAI_CORE_CONSTITUTION_CTD.md
├── Constitution Hierarchy      → this document (P2-01 · CON-004)
├── Constitutional Framework    → EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md
├── Engineering Constitution    → EMPIREAI_CONSTITUTION.md (+ Cursor standards)
├── Domain Constitutions
│   ├── Digital Soul of Pillow V2 (DS-V2-CANONICAL) — executive identity & LTEV
│   │     → EMPIREAI_DIGITAL_SOUL_CONSTITUTION_V2.md · pillow/src/digital-soul/
│   ├── Pillow Constitution · Pillow EI Constitution (objective / Cursor sovereignty)
│   └── BL-C Continuous Improvement Constitution
├── Doctrines
│   ├── Doctrine System (P2-04)   → EMPIREAI_DOCTRINE_SYSTEM.md
│   ├── GVD · CBD · UID · ACD
│   └── Domain governance doctrines (CRI, etc.)
└── Identity Governance Law (P1 governance — constitutional)
    ├── Reasoning Model · Vision Sync · Vision Accumulation
    ├── Ownership · Hierarchy (platform) · Naming · Glossary
    └── Mission Generation · Supervisor · Roadmap Governance · Execution Governance

TIER 4 — CONSTITUTIONAL EXECUTION PROGRAMME
├── Constitution Lock             → EMPIREAI_CONSTITUTION_LOCK.md (P1–P9 · CON-001–019)
├── Master Roadmap                → EMPIREAI_ROADMAP.md
├── Domain roadmaps               → PILLOW_ROADMAP · Cockpit · EI roadmaps
└── ADR register (programme decisions) → EMPIREAI_DECISIONS.md

TIER 5 — NORMATIVE DESIGN & DOCUMENTATION LAW
├── Architecture Law (P2-05)      → docs/architecture/EMPIREAI_ARCHITECTURE_LAW.md
├── Canonical Architecture        → docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md
├── Canonical Documentation       → EMPIREAI_DOCUMENTATION_LAW.md (P2-06 · ECDS-1)
├── Documentation Law (P2-06)     → EMPIREAI_DOCUMENTATION_LAW.md
├── Repository Doctrine           → EMPIREAI_REPOSITORY_STRUCTURE.md (P1-09)
├── Production Truth              → EMPIREAI_PRODUCTION_TRUTH.md (P1-10)
└── Specifications                → EKLS · Pillow Architecture Contract · cockpit specs

TIER 6 — IMPLEMENTATION & PROOF
├── CON Missions · REAL Missions · PILLOW Missions
├── Journey · JOURNEY_AUDIT
├── Engineering (code)            → backend/ · pillow/ · empireai-web/
├── Production operations         → EMPIREAI_STATUS.md · deployment/
└── Evidence                      → COMBINED audits · artifacts · docs/audits/

TIER 7 — HISTORICAL
├── Legacy · Superseded · Archived
└── docs/SYSTEM_ARCHITECTURE.md cluster · obsolete plans · HISTORICAL-labelled docs
```

---

## 4. Tier Definitions

### Tier 0 — Grand King

| Attribute | Definition |
|-----------|------------|
| **Authority** | Sovereign — final approval · commercial irreversibles · Vision sign-off |
| **Inheritance** | All tiers inherit Grand King sovereignty constraints (GVD) |
| **Not** | A file — human authority outside repository tree |

### Tier 1 — Chief Architect · Pillow

| Role | Constitutional function |
|------|-------------------------|
| **Chief Architect** | Authors Tier 3–5 law · ADRs · mission design · maintains this hierarchy |
| **Pillow COI** | Operational stewardship · drift detection · Builder supervision · Soul/Vision sync |

Peers under Tier 0 — not parent to each other. Jointly steward EmpireAI per [`EMPIREAI_OWNERSHIP_MODEL.md`](./EMPIREAI_OWNERSHIP_MODEL.md).

### Tier 2 — Vision · Soul

| Document | Role | Overrides |
|----------|------|-----------|
| **Vision** | WHY — purpose · mission intent | Does **not** override CTD commercially |
| **Soul** | WHO — continuity · promises · memory | Constrains Vision amendments; bounded by CTD |

Identity **informs** law; CTD **bounds** identity on commercial conflict.

### Tier 3 — Constitution & Law

| Class | Apex / anchor | Owner |
|-------|---------------|-------|
| **CTD** | Commercial apex — CTD-001→040 | Grand King |
| **Constitution Hierarchy** | This document — governance map | Chief Architect |
| **Engineering Constitution** | Brain · Guardian · Builder law | Chief Architect |
| **Domain constitutions** | Pillow · BL-C | Pillow / Grand King |
| **Doctrines** | GVD · CBD · UID · ACD | Grand King · Architect |
| **Framework & P1 governance** | Constitutional entry · reasoning · ownership policies | Grand King · Architect |

**Self-reference:** This document sits at Tier 3 — amendments require CONSTITUTIONAL REVIEW + Grand King.

### Tier 4 — Constitutional Execution Programme

Locked P1–P9 · CON-001–019 · domain roadmaps · ADRs. Sequences **what** to build constitutionally — does **not** override Tier 3 law.

### Tier 5 — Normative Design & Documentation Law

Target architecture · ECDS classification rules · repository doctrine · production truth doctrine · normative specs. **Vision prevails over Tier 5** on purpose conflicts; **Tier 3 prevails** on legal conflicts.

### Tier 6 — Implementation & Proof

Code · missions · Journey · STATUS · deployment · evidence. **Lowest cite authority** except for live production observation per [`EMPIREAI_PRODUCTION_TRUTH.md`](./EMPIREAI_PRODUCTION_TRUTH.md).

### Tier 7 — Historical

Zero authority — preserved for traceability only.

---

## 5. Authority Rules

| Rule | Requirement |
|------|-------------|
| **A1** | Every constitutional document has exactly **one constitutional owner** |
| **A2** | Every document has exactly **one canonical parent** in this tree |
| **A3** | Tier 0 decisions override all documents when explicitly recorded |
| **A4** | CTD is apex **commercial** law — no document weakens CTD without CONSTITUTIONAL REVIEW |
| **A5** | Tier 1 authorities **steward** — they do not **own** Tier 0 sovereignty |
| **A6** | Evidence (Tier 6) never becomes law without promotion through Tier 3+ process |
| **A7** | Historical (Tier 7) never cited as current truth |

---

## 6. Precedence Rules (Permanent)

When two constitutional documents **disagree**, **higher tier prevails** (lower number = higher authority):

```
Tier 0  Grand King explicit decision
Tier 2  Vision (purpose) — over Tier 5+ on WHY conflicts
Tier 3  Constitution & Law — over Tier 4–7
Tier 4  Roadmap / programme — over Tier 6 engineering preference
Tier 5  Normative design — over Tier 6 implementation docs
Tier 6  Production Truth (live) — over assumptions; bounded by Tier 3 CTD
Tier 7  Historical — never prevails
```

### 6.1 Mission examples (locked)

| Conflict | Winner | Rule |
|----------|--------|------|
| Vision vs Architecture | **Vision** (Tier 2) over Canonical Architecture (Tier 5) on purpose | WHY beats normative HOW |
| CTD vs Vision | **CTD** (Tier 3) over Vision (Tier 2) on commercial legality | Law bounds identity |
| Constitution vs Documentation | **Constitution** (Tier 3) over Operational docs (Tier 6) | Law beats dev guides |
| Production Truth vs Assumption | **Production Truth** (Tier 5 doctrine + Tier 6 observation) | Facts beat assumptions |
| Roadmap vs Engineering preference | **Roadmap** (Tier 4) over engineer opinion (Tier 6) | Programme beats preference |
| Evidence vs CTD | **CTD** (Tier 3) | Evidence proves; never overrides law |
| Soul vs Operational STATUS | **Soul** (Tier 2) for identity; **STATUS** (Tier 6) for live now | Different responsibilities |

Full operational truth stack: [`EMPIREAI_PRODUCTION_TRUTH.md`](./EMPIREAI_PRODUCTION_TRUTH.md) §4.

---

## 7. Citation Rules

Every **Canonical** constitutional document **must** declare in header or register:

| Field | Required | Example |
|-------|----------|---------|
| **Owner** | Yes | Grand King · Chief Architect |
| **Tier** | Yes | Tier 3 — Constitution & Law |
| **Authority** | Yes | CANONICAL · A2 |
| **Dependencies** | Yes | P1 complete · CTD |
| **Parent** | Yes | Constitutional Framework |
| **Children** | If any | Listed in doc or this hierarchy |
| **Supersedes** | If applicable | ECNS-1 audit recommendation |
| **Superseded By** | If retired | Pointer only — Tier 7 |
| **Classification** | Yes | CANONICAL · OPERATIONAL · EVIDENCE · HISTORICAL · STUB |

### 7.1 Citation format (agents)

```
[Cite: <path> · Tier <n> · <Classification> · Owner: <role>]
```

**Forbidden:** citing Tier 7 as current · citing Evidence as law · unqualified "Constitution".

### 7.2 Minimum read order (constitutional missions)

1. Tier 2 Vision + Soul (mission sync)  
2. **This document** — locate applicable law tier  
3. CTD (+ domain doctrine as needed)  
4. Tier 4 slot if CON/REAL mission  
5. Tier 5 architecture/repository/production truth if engineering/production  

→ [`EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md`](./EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md)

---

## 8. Dependency Rules

| Dependency type | Rule |
|-----------------|------|
| **Inheritance** | Child documents inherit parent constraints — may extend, not contradict |
| **Read dependency** | Lower tier must read higher applicable tiers before authorship |
| **Mission dependency** | CON-### dependencies in Constitution Lock are immutable |
| **P1 → P2** | P2 missions require P1-01→P1-10 complete |
| **CTD dependency** | All tiers depend on CTD for commercial legality |
| **Cross-link** | Parent/child must cross-link in Related section |

---

## 9. Law Stack — When to Read Which (Agent Quick Reference)

| Question | Read first (Tier) | Then |
|----------|-------------------|------|
| Is this commercially legal? | CTD (3) | CBD (3) |
| Why are we doing this? | Vision (2) | Soul (2) |
| Who owns what? | Ownership Model (3) | This hierarchy |
| Which constitution applies? | **This document** (3) | Specific constitution |
| How must Brain behave? | Engineering Constitution (3) | ACD (3) |
| How must Pillow behave? | Pillow Constitution (3) | Pillow EI (3) |
| What is architecture target? | Canonical Architecture (5) | Domain specs (5) |
| Where does file live? | Repository Structure (5) | Master Index |
| What is production truth? | Production Truth (5) | STATUS (6) |
| What do we build next? | Constitution Lock (4) | Domain roadmap (4) |
| What was decided? | ADR register (4) | Evidence (6) |
| What runs in prod **right now**? | Production observation (6) | Production Truth (5) |

### 9.1 Detailed law stack (Tier 3 subtree)

```
EMPIREAI_CORE_CONSTITUTION_CTD.md
    ├── GVD · CBD · UID · ACD · BL-C
    ├── EMPIREAI_CONSTITUTION.md (+ Cursor Output · Recovery)
    ├── EMPIREAI_PILLOW_CONSTITUTION.md (+ EI Constitution · Memory Doctrine)
    ├── EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md
    │       ├── EMPIREAI_CONSTITUTION_HIERARCHY.md (this file)
    │       ├── EMPIREAI_REASONING_MODEL.md · Vision policies · P1-03→P1-10
    │       └── EMPIREAI_CONSTITUTION_LOCK.md
    ├── docs/executive-intelligence/EI_INDEX → EI0–EI10
    └── docs/governance/* domain doctrines (CRI, etc.)
```

---

## 10. Tier Register — Key Artifacts

| Artifact | Tier | Parent | Owner | Classification |
|----------|------|--------|-------|----------------|
| `EMPIREAI_VISION.md` | 2 | Grand King / EmpireAI | Grand King | CANONICAL |
| `EMPIREAI_SOUL.md` | 2 | Grand King / EmpireAI | Grand King | CANONICAL |
| `EMPIREAI_DOCTRINE_SYSTEM.md` | 3 | CTD / Framework | Chief Architect | CANONICAL (P2-04) |
| `EMPIREAI_CORE_CONSTITUTION_CTD.md` | 3 | Grand King | Grand King | CANONICAL (P2-02 ratified) |
| `EMPIREAI_CONSTITUTION_HIERARCHY.md` | 3 | Constitutional Framework | Chief Architect | CANONICAL |
| `EMPIREAI_CONSTITUTION.md` | 3 | CTD / Framework | Chief Architect | CANONICAL (P2-03 ratified) |
| `EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md` | 3 | CTD | Chief Architect | CANONICAL |
| `EMPIREAI_CONSTITUTION_LOCK.md` | 4 | Framework | Grand King | CANONICAL |
| `EMPIREAI_ARCHITECTURE_LAW.md` | 5 | CTD · ACD | Chief Architect | CANONICAL (P2-05) |
| `EMPIREAI_CANONICAL_ARCHITECTURE.md` | 5 | Architecture Law | Chief Architect | CANONICAL |
| `EMPIREAI_REPOSITORY_STRUCTURE.md` | 5 | Framework | Chief Architect | CANONICAL |
| `EMPIREAI_PRODUCTION_TRUTH.md` | 5 | Framework | Grand King | CANONICAL |
| `EMPIREAI_REASONING_MODEL.md` | 3 | Framework | Grand King | CANONICAL |
| `JOURNEY.md` | 6 | Roadmap programme | Grand King | OPERATIONAL |
| `EMPIREAI_STATUS.md` | 6 | Production | Grand King | OPERATIONAL |
| `EMPIREAI_DECISIONS.md` | 4 | Architect programme | Chief Architect | CANONICAL |
| `EMPIREAI_DOCUMENTATION_LAW.md` | 5 | Framework · Repository Structure | Chief Architect | CANONICAL (P2-06 · ECDS-1) |
| `docs/audits/canonical-documentation/` | 6 | ECDS reconstruction | Chief Architect | EVIDENCE |
| `docs/SYSTEM_ARCHITECTURE.md` | 7 | — | — | HISTORICAL |

---

## 11. Constitutional Rules (Summary)

| # | Rule |
|---|------|
| 1 | No duplicate constitutional authority at same tier + domain |
| 2 | One canonical parent per document |
| 3 | One constitutional owner per document |
| 4 | One canonical path per document ([`EMPIREAI_REPOSITORY_STRUCTURE.md`](./EMPIREAI_REPOSITORY_STRUCTURE.md)) |
| 5 | One meaning per term ([`EMPIREAI_GLOSSARY.md`](./EMPIREAI_GLOSSARY.md)) |
| 6 | Higher tier prevails on conflict (§6) |
| 7 | Append-only CON-020+ · P2-02+ — never rewrite locked IDs |

---

## 12. Examples

### Example 1 — Vision vs Architecture conflict

Engineering proposes architecture violating Vision §7 (intelligence not automation). **Vision (Tier 2)** wins on purpose vs **Canonical Architecture (Tier 5)** — architecture must be amended via ADR, not Vision silently.

### Example 2 — CTD vs Roadmap urgency

Roadmap prioritizes feature violating CTD-017 (pretend live). **CTD (Tier 3)** wins over **Roadmap (Tier 4)** — roadmap item deferred or rejected.

### Example 3 — Production vs docs

Docs claim feature live; production observation says no. **Production Truth process (Tier 5–6)** wins — docs updated, not law.

### Example 4 — Citing correctly

Wrong: "Per SYSTEM_ARCHITECTURE.md…"  
Right: "[Cite: EMPIREAI_CANONICAL_ARCHITECTURE.md · Tier 5 · CANONICAL · Owner: Chief Architect]"

### Example 5 — New governance doc

New Tier 3 policy → parent Framework → register §14 → Master Index row → citation header complete.

---

## 13. Governance

| Role | Duty |
|------|------|
| **Grand King** | Approve Tier 2–3 changes touching sovereignty · CTD |
| **Chief Architect** | Maintain this hierarchy · tier assignments · CON-004 stewardship |
| **Pillow** | Flag drift · mis-citation · orphan docs |
| **Governance maintainer** | Tier register integrity · Master Index alignment (CON-002) |

**Amendment:** CONSTITUTIONAL REVIEW + Grand King for tier structure changes. New docs append to §14 — no shadow hierarchies.

---

## 14. Future Expansion Rules

| Rule | Requirement |
|------|-------------|
| **E1** | New Tier 3 law → ADR + row in §10 + §9.1 tree |
| **E2** | New doctrine → CTD alignment check + Tier 3 register |
| **E3** | CON-020+ → Tier 4 append only |
| **E4** | Tier 7 promotion forbidden — copy forward, don't resurrect |
| **E5** | ECC/VIE resolution → Tier 5 design docs when CON-013/014 close |
| **E6** | P2-02+ missions extend Tier 3 CTD map — do not duplicate CTD body |

### Future register

| Artifact | Tier | Parent | CON/ADR | Status |
|----------|------|--------|---------|--------|
| P2-02 CTD ratification | 3 | CTD | P2-02 | **Complete** |
| P2-03 Engineering Constitution | 3 | CTD / Framework | P2-03 | **Complete** |
| P2-04 Doctrine System | 3 | CTD / Framework | P2-04 | **Complete** |
| P2-05 Architecture Law | 5 | CTD · ACD | P2-05 | **Complete** |
| P2-06 Documentation Law | 5 | Framework | P2-06 | **Complete** |
| P2-07 Constitution Lock Validation | 4 | Lock | P2-07 | **Complete** |
| *Append here* | — | — | — | — |

---

## 15. Validation Checklist

| Check | Status |
|-------|--------|
| Aligns with Vision · Soul · Ownership · Roadmap · Architecture | §3–§4 · §6 |
| Aligns with Repository · Production Truth · Documentation | Tier 5 · §10 |
| Aligns with CTD apex | §4 Tier 3 · §6 |
| No duplicated constitutional authority | §11 |
| P1 complete dependency | Header dependency |
| Distinct from EMPIREAI_HIERARCHY (platform) | §2 |

---

## Revision History

| Version | Date | Authority | Change |
|---------|------|-----------|--------|
| 0.9.0 | 2026-07-04 | Chief Architect · CON-004 draft | Law stack one-pager |
| 1.0.0 | 2026-07-05 | Grand King · P2-01 | Full Constitution Hierarchy Tiers 0–7 — apex governance map |

**Supersedes:** CON-004 draft sections that conflict; audit "TO AUTHOR" status for this path.

---

## Related

- [`EMPIREAI_CONSTITUTION_VALIDATION.md`](./EMPIREAI_CONSTITUTION_VALIDATION.md) (P2-07)  
- [`EMPIREAI_DOCUMENTATION_LAW.md`](./EMPIREAI_DOCUMENTATION_LAW.md) (P2-06 · ECDS-1)  
- [`EMPIREAI_DOCTRINE_SYSTEM.md`](./EMPIREAI_DOCTRINE_SYSTEM.md) (P2-04)  
- [`../architecture/EMPIREAI_ARCHITECTURE_LAW.md`](../architecture/EMPIREAI_ARCHITECTURE_LAW.md) (P2-05)  
- [`EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md`](./EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md)  
- [`EMPIREAI_HIERARCHY.md`](./EMPIREAI_HIERARCHY.md) · [`EMPIREAI_VISION_HIERARCHY.md`](./EMPIREAI_VISION_HIERARCHY.md) · [`EMPIREAI_ROADMAP_HIERARCHY.md`](./EMPIREAI_ROADMAP_HIERARCHY.md)  
- [`EMPIREAI_CORE_CONSTITUTION_CTD.md`](../../EMPIREAI_CORE_CONSTITUTION_CTD.md)  
- [`EMPIREAI_REPOSITORY_MASTER_INDEX.md`](../../EMPIREAI_REPOSITORY_MASTER_INDEX.md)
