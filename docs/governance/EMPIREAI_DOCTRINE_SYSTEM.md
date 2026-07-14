# EMPIREAI DOCTRINE SYSTEM

> **Classification:** CANONICAL — Tier 3 Law (Governance)  
> **Document ID:** P2-04  
> **Constitutional phase:** P2 — Constitution Foundation  
> **Dependencies:** P1 complete · P2-01 · P2-02 · P2-03  
> **Owner:** Chief Architect (system maintainer) · Grand King (foundation doctrine sovereignty)  
> **Authority:** CANONICAL — doctrine registry and lifecycle; **subordinate to CTD**  
> **Parent:** CTD · [`EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md`](./EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md)  
> **Children:** All registered doctrines (this document is the apex **doctrine map**, not a duplicate law body)  
> **Established:** 2026-07-05 (P2-04)  
> **Role:** One permanent **Doctrine System** — how specialised domain principles derive from constitutional law

**Commercial apex:** [`EMPIREAI_CORE_CONSTITUTION_CTD.md`](../../EMPIREAI_CORE_CONSTITUTION_CTD.md)  
**Governance map:** [`EMPIREAI_CONSTITUTION_HIERARCHY.md`](./EMPIREAI_CONSTITUTION_HIERARCHY.md)  
**Engineering law:** [`EMPIREAI_CONSTITUTION.md`](../../EMPIREAI_CONSTITUTION.md) (P2-03)  
**Terms:** [`EMPIREAI_GLOSSARY.md`](./EMPIREAI_GLOSSARY.md) · **Naming:** [`EMPIREAI_NAMING_STANDARD.md`](./EMPIREAI_NAMING_STANDARD.md)

---

## 1. Purpose

Constitutions govern the **Empire**. Doctrines govern **domains**.

The Doctrine System is the **single canonical registry** for every specialised governing principle in EmpireAI. Doctrines **translate** CTD and domain constitutions into domain-specific rules — they **support, never replace**, constitutional law.

**The principle:** One doctrine owner · one constitutional parent · one purpose per doctrine · no duplicate doctrine authority · no doctrine contradicts Vision · Soul · CTD · Constitution Hierarchy.

---

## 2. Authority & Inheritance

### 2.1 Authority chain

```
Vision (Tier 2 — informs)
        ↓
Soul (Tier 2 — informs)
        ↓
CTD (Tier 3 — commercial apex)
        ↓
Constitution Hierarchy (Tier 3 — document map)
        ↓
Engineering Constitution · Domain Constitutions (Tier 3)
        ↓
Foundation Doctrines (GVD · CBD · UID · ACD)
        ↓
Domain & Operational Doctrines (this registry)
        ↓
Policies · Standards · Architecture · Implementation
```

### 2.2 What derives from what

| Layer | Governs | Derives authority from |
|-------|---------|------------------------|
| **CTD** | Commercial constitution | Grand King |
| **Engineering Constitution** | HOW engineering executes | CTD-040 |
| **Domain constitutions** | Pillow · BL-C runtime/improvement law | CTD + Engineering Constitution |
| **Foundation doctrines** | Numbered immutable modules (GVD/CBD/UID/ACD) | CTD |
| **Domain doctrines** | Specialised domains (CRI, Repository, Journey, etc.) | CTD + applicable foundation doctrine |
| **Policies** | Operational process (mission start, accumulation) | Framework + Engineering Constitution |
| **Standards** | Format law (Cursor Output, Executive Audit) | Engineering Constitution |

### 2.3 Precedence on conflict

| Conflict | Winner |
|----------|--------|
| Doctrine vs CTD | **CTD** |
| Doctrine vs Engineering Constitution (engineering matter) | **Engineering Constitution** |
| Doctrine vs Vision (purpose) | **Vision** bounds; CTD on commercial legality |
| Two doctrines same domain | **Higher parent** in §3 tree; escalate to Chief Architect |
| Policy vs Foundation doctrine | **Foundation doctrine** |

---

## 3. Doctrine Hierarchy

```
CTD (Constitution — not a doctrine file)
│
├── FOUNDATION DOCTRINES (immutable catalogs · Tier 3)
│   ├── GVD — Governance Doctrine          → EMPIREAI_GOVERNANCE_DOCTRINE_GVD.md
│   ├── CBD — Commercial Business Doctrine → EMPIREAI_COMMERCIAL_BUSINESS_DOCTRINE_CBD.md
│   ├── UID — UX Identity Doctrine         → EMPIREAI_UX_IDENTITY_DOCTRINE_UID.md
│   └── ACD — Architecture Constraints       → EMPIREAI_ARCHITECTURE_CONSTRAINTS_ACD.md
│
├── COMMERCE & RISK DOCTRINES
│   ├── Commerce Canon (lifecycle)         → EMPIREAI_COMMERCE_CANON.md
│   ├── CRI Doctrine                         → docs/governance/COMMERCIAL_RISK_INTELLIGENCE_DOCTRINE.md
│   ├── Marketplace Autonomy (REAL-051A)     → docs/governance/MARKETPLACE_AUTONOMY_DOCTRINE_REAL-051A.md
│   └── EI Library (Pillow intelligence)     → docs/executive-intelligence/EI_INDEX.md
│
├── REPOSITORY & KNOWLEDGE DOCTRINES
│   ├── Repository Structure (P1-09)         → docs/governance/EMPIREAI_REPOSITORY_STRUCTURE.md
│   ├── Repository First                     → EMPIREAI_REPOSITORY_FIRST_DOCTRINE.md
│   ├── Journey First                        → EMPIREAI_JOURNEY_FIRST_DOCTRINE.md
│   ├── Production Truth (P1-10)             → docs/governance/EMPIREAI_PRODUCTION_TRUTH.md
│   └── Pillow Memory                        → EMPIREAI_PILLOW_MEMORY_DOCTRINE.md
│
├── ENGINEERING & BUILDER DOCTRINES
│   ├── Engineering Constitution (law)       → EMPIREAI_CONSTITUTION.md  [constitution — not duplicate]
│   ├── Engineering Standards (P4-01)        → docs/governance/EMPIREAI_ENGINEERING_STANDARDS.md
│   ├── Development Doctrine                 → docs/architecture/DEVELOPMENT_DOCTRINE.md
│   ├── Cursor Recovery                      → EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md
│   ├── Empire Recovery                      → EMPIREAI_EMPIRE_RECOVERY_DOCTRINE.md
│   ├── Cursor Output Standard               → EMPIREAI_CURSOR_OUTPUT_STANDARD.md
│   └── Continuous Artifact Generation       → EMPIREAI_CONTINUOUS_ARTIFACT_GENERATION_WORKFLOW.md
│
├── MISSION & SUPERVISION DOCTRINES
│   ├── Vision Synchronization Policy        → EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md
│   ├── Vision Synchronization System (P4-02)  → EMPIREAI_VISION_SYNCHRONIZATION_SYSTEM.md
│   ├── Context Synchronization System (P4-03) → EMPIREAI_CONTEXT_SYNCHRONIZATION_SYSTEM.md
│   ├── Mission Generation Policy            → EMPIREAI_MISSION_GENERATION_POLICY.md
│   ├── Vision Accumulation Policy           → EMPIREAI_VISION_ACCUMULATION_POLICY.md
│   └── Supervisor Governance                → EMPIREAI_SUPERVISOR_GOVERNANCE.md
│
├── DEPLOYMENT & PRODUCTION (operational doctrine cluster)
│   ├── Managed Deployment                   → deployment/MANAGED_DEPLOYMENT.md
│   └── Version 1 Delivery Mode              → docs/governance/PILLOW_VERSION_1_DELIVERY_MODE.md
│
└── DOMAIN CONSTITUTIONS (constitution-class — registered for traceability)
    ├── Pillow Constitution                  → EMPIREAI_PILLOW_CONSTITUTION.md
    ├── Pillow EI Constitution               → EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md
    └── BL-C Continuous Improvement          → EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md
```

**Note:** Items marked **constitution** are not doctrines — they are registered in this map so agents never confuse jurisdiction.

---

## 4. Classification

| Class | ID prefix / pattern | Immutable | Runtime catalog | Example |
|-------|---------------------|-----------|-----------------|---------|
| **Foundation Doctrine** | GVD-### · CBD-### · UID-### · ACD-### | Yes | Yes (`backend/src/foundation/`) | GVD-001 Grand King Platform Owner |
| **Domain Doctrine** | Named file · optional domain IDs (CRI-###) | Usually | Sometimes | CRI Doctrine |
| **Operational Doctrine** | Named permanent rule | No (revisable) | No | Repository First |
| **Policy** | `*_POLICY.md` | Revisable | No | Vision Synchronization Policy |
| **Standard** | `*_STANDARD.md` | Revisable | No | Cursor Output Standard |
| **Constitution** | CTD-### · Articles | CTD yes | CTD yes | Not a doctrine — apex law |

**Rule:** CTD articles (CTD-001→040) are **constitutional**, not registered as separate doctrine files. GVD/CBD/UID/ACD are **foundation doctrines** subordinate to CTD.

---

## 5. Doctrine Catalogue

### 5.1 Foundation doctrines (immutable modules)

| Doctrine | Path | Owner | Parent | Purpose | Consumers |
|----------|------|-------|--------|---------|-----------|
| **GVD** Governance | `EMPIREAI_GOVERNANCE_DOCTRINE_GVD.md` | Grand King | CTD | Authority · approval · escalation · audit | Brain governance · Pillow · missions |
| **CBD** Commercial Business | `EMPIREAI_COMMERCIAL_BUSINESS_DOCTRINE_CBD.md` | Grand King | CTD | How EmpireAI makes money · SUCCESS-001 | Commerce · REAL · Cockpit |
| **UID** UX Identity | `EMPIREAI_UX_IDENTITY_DOCTRINE_UID.md` | Grand King | CTD | Founder UX law · Grand King experience | Cockpit · frontend |
| **ACD** Architecture Constraints | `EMPIREAI_ARCHITECTURE_CONSTRAINTS_ACD.md` | Chief Architect | CTD | Modular architecture · no duplication | Brain · REAL · Architecture |

### 5.2 Commerce & intelligence doctrines

| Doctrine | Path | Owner | Parent | Purpose | Consumers |
|----------|------|-------|--------|---------|-----------|
| **Commerce Canon** | `EMPIREAI_COMMERCE_CANON.md` | Commercial Architecture | CTD · CBD · [`EMPIREAI_COMMERCE_ARCHITECTURE.md`](../architecture/EMPIREAI_COMMERCE_ARCHITECTURE.md) (P3-05) | Single commerce lifecycle truth | REAL commerce · Business Engines |
| **CRI** Commercial Risk Intelligence | `docs/governance/COMMERCIAL_RISK_INTELLIGENCE_DOCTRINE.md` | Commercial Architecture | CBD · Commerce Canon | Survival over profit · CRIR gates | Launch missions · ADR-051 |
| **CRIR Spec** | `docs/governance/COMMERCIAL_RISK_INTELLIGENCE_REPORT_SPECIFICATION.md` | Commercial Architecture | CRI Doctrine | Minimum CRIR sections | Finance · launch |
| **Marketplace Autonomy** | `docs/governance/MARKETPLACE_AUTONOMY_DOCTRINE_REAL-051A.md` | Commercial governance | CBD · Commerce Canon | Founder onboarding · channel strategy | Integrations Hub |
| **EI Library** | `docs/executive-intelligence/EI_INDEX.md` | Pillow Architecture | Pillow EI Constitution | EI0–EI10 intelligence library | Pillow · Brain tools |

### 5.3 Repository & knowledge doctrines

| Doctrine | Path | Owner | Parent | Purpose | Consumers |
|----------|------|-------|--------|---------|-----------|
| **Repository Structure** | `docs/governance/EMPIREAI_REPOSITORY_STRUCTURE.md` | Chief Architect | Framework | Where artifacts live (P1-09) | All agents · Master Index |
| **Repository First** | `EMPIREAI_REPOSITORY_FIRST_DOCTRINE.md` | Repository Governance | CTD-034 · Repository Structure | Repo = memory; chat = ephemeral | Builder · Pillow |
| **Journey First** | `EMPIREAI_JOURNEY_FIRST_DOCTRINE.md` | Journey · Repository Governance | ADR-014 | Journey sync before other owners | All mission owners |
| **Production Truth** | `docs/governance/EMPIREAI_PRODUCTION_TRUTH.md` | Grand King | CTD-017–019 | What is true in production · triple acceptance | STATUS · deploy · missions |
| **Pillow Memory** | `EMPIREAI_PILLOW_MEMORY_DOCTRINE.md` | Pillow Architecture | Pillow Constitution | Remember knowledge not conversations | EKLS · Pillow runtime |

### 5.4 Engineering & builder doctrines

| Doctrine | Path | Owner | Parent | Purpose | Consumers |
|----------|------|-------|--------|---------|-----------|
| **Engineering Standards** | `docs/governance/EMPIREAI_ENGINEERING_STANDARDS.md` | Chief Architect | Engineering Constitution · Architecture Law | Single engineering practice authority — P4-01 | Builder · REAL · all repo change |
| **Development Doctrine** | `docs/architecture/DEVELOPMENT_DOCTRINE.md` | Chief Architect | P4-01 · Engineering Constitution · ACD | REAL mission rules · module gates | REAL missions · Brain |
| **Cursor Recovery** | `EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md` | Cursor · CTO | Engineering Constitution | Recovery Mode — no infinite waits | Builder · Pillow supervisor |
| **Empire Recovery** | `EMPIREAI_EMPIRE_RECOVERY_DOCTRINE.md` | Pillow Architecture | Engineering Constitution | No single device destroys Empire | Disaster recovery |
| **Cursor Output Standard** | `EMPIREAI_CURSOR_OUTPUT_STANDARD.md` | Repository Governance | Engineering Constitution §8 | Executive Summary + Cursor Draft | Mission specs |
| **CAGW** | `EMPIREAI_CONTINUOUS_ARTIFACT_GENERATION_WORKFLOW.md` | Repository Governance | Repository First | Artifacts over chat | Pillow · Architect |

### 5.5 Mission & supervision doctrines

| Doctrine / Policy | Path | Owner | Parent | Purpose | Consumers |
|-------------------|------|-------|--------|---------|-----------|
| **Vision Sync** | `EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md` · `EMPIREAI_VISION_SYNCHRONIZATION_SYSTEM.md` | Grand King | Framework | Mandatory mission-start chain + runtime (P4-02) | Every Cursor mission |
| **Mission Generation** | `EMPIREAI_MISSION_GENERATION_POLICY.md` | Chief Architect | Framework | Brief format · approval | Architect · Pillow |
| **Vision Accumulation** | `EMPIREAI_VISION_ACCUMULATION_POLICY.md` | Grand King | P1-03 | Post-mission WHY evolution | Mission close |
| **Supervisor Governance** | `EMPIREAI_SUPERVISOR_GOVERNANCE.md` | Pillow COI | Pillow Constitution | Pillow supervises Builder | Cursor missions |

### 5.6 Deployment & production cluster

| Document | Path | Owner | Parent | Purpose | Status |
|----------|------|-------|--------|---------|--------|
| **Managed Deployment** | `deployment/MANAGED_DEPLOYMENT.md` | Repository Governance | Production Truth · [`EMPIREAI_INFRASTRUCTURE_ARCHITECTURE.md`](../architecture/EMPIREAI_INFRASTRUCTURE_ARCHITECTURE.md) (P3-06) | V1 split-stack deploy sequence | Operational |
| **V1 Delivery Mode** | `docs/governance/PILLOW_VERSION_1_DELIVERY_MODE.md` | Pillow Architecture | Pillow Constitution | V1 certification constraints | Active |
| **Route policy** | — | Brain | Production Truth | Extension routes · critical surface | **CON-007 pending** |
| **Pillow production mode** | — | Pillow | Production Truth | Minimal chat vs full COI | **CON-008 pending** |

### 5.7 Mapped domains without standalone doctrine files

| Domain | Canonical source | Rationale |
|--------|------------------|-----------|
| **Guardian** | Engineering Constitution Art. II · `backend/src/guardian/` | Safety law lives in Engineering Constitution — no separate Guardian Doctrine file |
| **Runtime** | Development Doctrine · Production Truth · Canonical Architecture | Distributed across engineering + production cluster |
| **Testing** | Engineering Constitution §5–§7 · CON-017 (programme) | Validation model in constitution; E2E suite deferred P9 |
| **Builder** | Engineering Constitution §8–§9 | Builder governance ratified P2-03 |
| **Architecture (normative)** | `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md` | **Tier 5 target** — Architecture Law (P2-05) governs process |
| **Documentation** | ECDS · **Documentation Law (P2-06)** · Repository Structure · Naming Standard | Classification system — [`EMPIREAI_DOCUMENTATION_LAW.md`](./EMPIREAI_DOCUMENTATION_LAW.md) |
| **Pillow (identity)** | `EMPIREAI_PILLOW_CONSTITUTION.md` | **Constitution-class** — not doctrine |

---

## 6. Duplicate & Conflict Analysis (P2-04)

### 6.1 Thematic overlap — resolved by hierarchy (not merge)

| Theme | Documents | Resolution |
|-------|-----------|------------|
| Manufacture companies / profit | CTD-001/002 · CBD-001/002 | CTD = constitutional floor; CBD = commercial detail |
| Repository memory | CTD-034 · Repository First · Repository Structure | CTD = law; Structure = placement; First = behaviour |
| Production honesty | CTD-017–019 · Production Truth | CTD = law; Production Truth = operational doctrine |
| Architecture modularity | CTD-021–025 · ACD · Development Doctrine | CTD/ACD = law; Development = engineering practice |
| Recovery | Cursor Recovery · Empire Recovery · Eng. Const. Art V | Different scopes — agent vs empire vs runtime |
| Commercial risk | CRI Doctrine · EI6 · CBD | **CRI Doctrine** is canonical governance; EI6 is EI library companion |
| Commerce lifecycle | Commerce Canon · EI3 Commerce · CBD | Commerce Canon = SSOT; EI3 = intelligence library view |

**Verdict:** No doctrine files merged or removed. Overlaps resolved by **parent tier** and **single SSOT per domain**.

### 6.2 Duplicates flagged — action

| Issue | Status | Action |
|-------|--------|--------|
| Second "Engineering Constitution" file | **None** | ECNS-2 path locked |
| Second GVD/CBD/UID/ACD file | **None** | Foundation catalogs unique |
| Bare "Constitution" in prose | **Risk** | ECNS-2 qualified names required |
| EI1 "Empire Constitution" in EI library | **Subordinate view** | EI library · not competing CTD |

### 6.3 Missing domains — programme gaps (not orphan doctrines)

| Gap | Planned resolution | CON/Phase |
|-----|-------------------|-----------|
| Deployment route policy doctrine | CON-007 | P5 |
| Pillow production mode doctrine | CON-008 | P5 |
| Browser E2E testing doctrine | CON-017 | P9 |
| Scaling architecture | P5-05 | Runtime phase |
| Performance architecture | P5-06 | Runtime phase |

---

## 7. Ownership Validation

| Rule | Validation |
|------|------------|
| Every doctrine has **one owner** | §5 catalogue — single owner column |
| Every doctrine has **one parent** | §5 parent column traces to CTD chain |
| No orphan doctrines | All paths in §3 tree or §5.7 mapped |
| No conflicting ownership | Pillow vs Repository Governance split explicit per doc |
| Domain constitutions registered | §3 bottom — constitution-class, not doctrine duplicates |

---

## 8. Doctrine Lifecycle

```
Design → Review → Approval → Publication → Operational Use → Revision → Retirement → Historical
```

| Stage | Actor | Requirement |
|-------|-------|-------------|
| **Design** | Domain owner · Chief Architect | Gap identified · parent doctrine cited |
| **Review** | Chief Architect | CTD alignment · no duplicate domain |
| **Approval** | Grand King (foundation/commercial) · Architect (operational) | ADR if structural |
| **Publication** | Register row in §5 · Master Index · this doc §10 future register |
| **Operational Use** | Consumers cite qualified doctrine name + path |
| **Revision** | Owner · CONSTITUTIONAL REVIEW if CTD touch | Revision history in doc |
| **Retirement** | Label HISTORICAL · Tier 7 · zero authority | Copy forward — do not resurrect |
| **Historical Preservation** | Journey Audit · superseded pointer | Never cite as current |

Foundation doctrines (GVD/CBD/UID/ACD): **immutable v1.0.0** — amend only via Grand King CONSTITUTIONAL REVIEW + catalog update.

---

## 9. Future Doctrine Standards

| Rule | Requirement |
|------|-------------|
| **F1** | New domain doctrine → register in §10 · Master Index · parent in §3 tree |
| **F2** | One purpose per doctrine — split if scope diverges |
| **F3** | No new foundation catalog without CTD alignment + runtime module |
| **F4** | Policies may implement doctrines — policies do not replace doctrines |
| **F5** | Constitution-class artifacts never named "Doctrine" in filename alone |
| **F6** | EI library additions → EI_INDEX append · subordinate to Pillow EI Constitution |
| **F7** | Retirement → Historical tier · superseded-by pointer required |

### 9.1 New doctrine template (required fields)

| Field | Required |
|-------|----------|
| Canonical label | Yes |
| Classification | Foundation · Domain · Operational · Policy · Standard |
| Owner | Yes |
| Parent constitution/doctrine | Yes |
| Purpose (one sentence) | Yes |
| Scope boundary | Yes |
| CTD articles inherited | If applicable |
| Consumers | Yes |
| Conflicts with | Explicit none or resolved |
| Path | One canonical path only |

---

## 10. Future Register

| Artifact | Class | Parent | Mission | Status |
|----------|-------|--------|---------|--------|
| P2-05 Architecture Law | Tier 5 law | CTD · ACD | P2-05 | **Complete** |
| P2-06 Documentation Law | Tier 5 law | Framework | P2-06 | **Complete** |
| P2-07 Constitution Lock Validation | Tier 4 | Lock | P2-07 | **Complete** |
| Phase P3 Architecture Foundation | Tier 5 | Framework | P3 | **Complete** (P3-01 → P3-07) |
| P3-06 Infrastructure Architecture | Tier 5 | Infrastructure | P3-06 | **Complete** |
| P3-07 Architectural ADR System | Tier 5 | ADRs | P3-07 | **Complete** |
| Phase P4 Engineering Foundation | Tier 5 | Framework | P4 | **In progress** (P4-01 → P4-06 Complete) |
| P4-01 Engineering Standards | Tier 5 | Engineering | P4-01 | **Complete** |
| P4-02 Vision Synchronization System | Tier 5 | Engineering | P4-02 | **Complete** |
| P4-03 Context Synchronization System | Tier 5 | Engineering | P4-03 | **Complete** |
| P4-04 Cursor Protocol | Tier 5 | Engineering | P4-04 | **Complete** |
| P4-05 Recovery Doctrine | Tier 5 | Engineering | P4-05 | **Complete** |
| P4-06 Browser Truth | Tier 5 | Engineering | P4-06 | **Complete** |
| Production route policy | Operational | Production Truth | CON-007 | Pending |
| Pillow production mode | Operational | Production Truth | CON-008 | Pending |
| Scaling Architecture | Domain | Production Truth · ACD | P5-05 | Planned |
| *Append new doctrines here* | — | — | — | — |

---

## 11. Examples

### Example 1 — Citing a foundation doctrine

Wrong: "Per doctrine, Grand King approves."  
Right: "[Cite: EMPIREAI_GOVERNANCE_DOCTRINE_GVD.md · GVD-019 · Tier 3 · Owner: Grand King]"

### Example 2 — Repository mission

Mission touches docs → read **Repository Structure** (placement) + **Repository First** (behaviour) + **CTD-034** (law). Do not create a third repository doctrine.

### Example 3 — Commercial launch

**CRI Doctrine** gates launch · **CBD** bounds strategy · **CTD-017** forbids pretend-live · **Production Truth** verifies acceptance.

### Example 4 — New doctrine proposal

New "Supplier Doctrine" → parent **CBD** · owner Commercial Architecture · register §10 · check Commerce Canon not already covering scope.

---

## 12. Governance

| Role | Duty |
|------|------|
| **Grand King** | Approve foundation doctrine amendments · commercial domain doctrines |
| **Chief Architect** | Maintain this registry · resolve doctrine conflicts · lifecycle |
| **Pillow COI** | Flag orphan docs · drift · misclassified doctrine |
| **Domain owners** | Maintain assigned doctrine bodies · propose revisions |

**Amendment of this system:** CONSTITUTIONAL REVIEW + Chief Architect; CTD touch → Grand King.

---

## 13. Validation Checklist (P2-04)

| Check | Status |
|-------|--------|
| Every doctrine traces Vision → Soul → CTD → Hierarchy → Engineering Constitution | §2.1 |
| Doctrine catalogue complete | §5 |
| Ownership validated | §7 |
| No duplicate doctrine authority | §6 |
| No orphan doctrines | §5.7 mapped |
| No conflicting ownership | §6 · §7 |
| Cross-references wired | §14 Related |

---

## 14. Related

- [`EMPIREAI_DOCUMENTATION_LAW.md`](./EMPIREAI_DOCUMENTATION_LAW.md) (P2-06 · ECDS-1)  
- [`EMPIREAI_CONSTITUTION_VALIDATION.md`](./EMPIREAI_CONSTITUTION_VALIDATION.md) (P2-07)  
- [`EMPIREAI_CORE_CONSTITUTION_CTD.md`](../../EMPIREAI_CORE_CONSTITUTION_CTD.md) · [`EMPIREAI_CONSTITUTION_HIERARCHY.md`](./EMPIREAI_CONSTITUTION_HIERARCHY.md)  
- [`EMPIREAI_CONSTITUTION.md`](../../EMPIREAI_CONSTITUTION.md) · [`EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md`](./EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md)  
- [`EMPIREAI_OWNERSHIP_MODEL.md`](./EMPIREAI_OWNERSHIP_MODEL.md) · [`EMPIREAI_REPOSITORY_MASTER_INDEX.md`](../../EMPIREAI_REPOSITORY_MASTER_INDEX.md)  
- [`EMPIREAI_VISION.md`](../../EMPIREAI_VISION.md) · [`EMPIREAI_SOUL.md`](../../EMPIREAI_SOUL.md)

---

## Revision History

| Version | Date | Authority | Change |
|---------|------|-----------|--------|
| 1.0.0 | 2026-07-05 | Grand King · P2-04 | Permanent Doctrine System — catalogue · hierarchy · lifecycle |
