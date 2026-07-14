# EMPIREAI ARCHITECTURE LAW

> **Classification:** CANONICAL — Tier 5 Law (Normative Architecture Governance)  
> **Document ID:** P2-05  
> **Constitutional phase:** P2 — Constitution Foundation  
> **Dependencies:** P1 complete · P2-01 → P2-04  
> **Owner:** Chief Architect  
> **Authority:** CANONICAL — constitutional architecture governance; **subordinate to CTD · ACD · Engineering Constitution**  
> **Parent:** CTD · [`EMPIREAI_ARCHITECTURE_CONSTRAINTS_ACD.md`](../../EMPIREAI_ARCHITECTURE_CONSTRAINTS_ACD.md) · [`EMPIREAI_DOCTRINE_SYSTEM.md`](../governance/EMPIREAI_DOCTRINE_SYSTEM.md)  
> **Children:** Canonical Architecture · Development Doctrine · [`EMPIREAI_ENGINEERING_STANDARDS.md`](../governance/EMPIREAI_ENGINEERING_STANDARDS.md) (P4-01) · specs  
> **Ratified:** 2026-07-05 (P2-05)  
> **Role:** Permanent law governing **how** architecture is created, evolved, validated, and protected

**Normative target (WHAT architecture should be):** [`EMPIREAI_CANONICAL_ARCHITECTURE.md`](./EMPIREAI_CANONICAL_ARCHITECTURE.md)  
**Immutable constraints (WHAT architecture must obey):** [`EMPIREAI_ARCHITECTURE_CONSTRAINTS_ACD.md`](../../EMPIREAI_ARCHITECTURE_CONSTRAINTS_ACD.md)  
**Operational snapshot (WHAT exists now):** [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md)  
**Engineering execution:** [`EMPIREAI_CONSTITUTION.md`](../../EMPIREAI_CONSTITUTION.md) (P2-03)

**Governance map:** [`EMPIREAI_CONSTITUTION_HIERARCHY.md`](../governance/EMPIREAI_CONSTITUTION_HIERARCHY.md)  
**Identity:** [`EMPIREAI_VISION.md`](../../EMPIREAI_VISION.md) · [`EMPIREAI_SOUL.md`](../../EMPIREAI_SOUL.md)

---

## 1. Purpose

Architecture is **constitutional**. It is **not** implementation.

Architecture Law is the **single permanent authority** for how EmpireAI architecture is proposed, reviewed, validated, accepted, evolved, and protected from drift. It defines **structure, responsibilities, and relationships** — implementation proves compliance.

**The principle:** Architecture serves Vision · obeys Constitution · executes Roadmap · enables Engineering · supports Production · evolves without losing identity · one canonical architecture · no duplicate architectural authority.

---

## 2. Authority & Document Stack

### 2.1 One canonical architecture — three layers

| Layer | Document | Tier | Role |
|-------|----------|------|------|
| **Architecture Law** | This document (P2-05) | 5 | **Governance** — lifecycle · ownership · drift · acceptance |
| **Architecture Constraints** | `EMPIREAI_ARCHITECTURE_CONSTRAINTS_ACD.md` | 3 | **Immutable law** — ACD-001→030 |
| **Canonical Architecture** | `EMPIREAI_CANONICAL_ARCHITECTURE.md` | 5 | **Normative target** — subsystems · control flow · data |
| **Development Doctrine** | `DEVELOPMENT_DOCTRINE.md` | 5 | **REAL mission rules** — companion to P4-01 Engineering Standards |
| **Operational Architecture** | `docs/ARCHITECTURE.md` | 5–6 | **Current state** — may lag canonical |
| **Historical** | `docs/SYSTEM_ARCHITECTURE.md` cluster | 7 | **Zero authority** |

**Rule:** No second "canonical architecture" file. Amend **Canonical Architecture** for structural truth; amend **this law** for governance process only.

### 2.2 Authority chain

```
Vision · Soul (inform)
        ↓
CTD (commercial bounds)
        ↓
Constitution Hierarchy · Engineering Constitution
        ↓
ACD (immutable constraints)
        ↓
Architecture Law (this document)
        ↓
Canonical Architecture (normative structure)
        ↓
Development Doctrine · ADRs · specs
        ↓
Implementation · Production · Evidence
```

### 2.3 What Architecture Law governs

| Domain | Governed by |
|--------|-------------|
| Architectural principles | §3 · Canonical Architecture §1 |
| Architectural ownership | §5 · Ownership Model · Pillow §17 |
| Architecture reviews | §4 lifecycle · Engineering Constitution §4.2 |
| Architecture evolution | §10 · ADR register |
| Architecture validation | §6 · Empire Review · ACD compliance API |
| Architecture documentation | ECDS · Repository Structure |
| Architecture dependencies | ACD-008–010 · Canonical Architecture §3 |
| Architecture governance | §5 · Chief Architect |
| Architecture drift | §8 |
| Architecture recovery | §9 |
| Architecture acceptance | §7 |

---

## 3. Architectural Principles (Constitutional)

| # | Principle | Source |
|---|-----------|--------|
| AP1 | **Architecture serves Vision** — every subsystem has purpose aligned to WHY | Vision · CTD-001 |
| AP2 | **Architecture obeys Constitution** — CTD · Engineering Constitution · ACD | CTD-040 · ACD-030 |
| AP3 | **Architecture executes Roadmap** — programme sequences change; architecture bounds shape | Roadmap · Constitution Lock |
| AP4 | **Architecture enables Engineering** — Brain path · modularity · explicit contracts | Engineering Constitution · ACD |
| AP5 | **Architecture supports Production** — honesty · visibility · separation simulation/production | CTD-017–019 · Production Truth |
| AP6 | **Architecture evolves without losing identity** — ADR-governed change; Soul constraints respected | Soul · CTD-020 |
| AP7 | **No architecture without purpose** — every subsystem declares responsibility (ACD-002 · CTD-026) | Canonical Architecture §3 |
| AP8 | **Pillow owns technical subsystems** — Brain is not a peer | Pillow Constitution §17 |
| AP9 | **One owner per capability** — no duplicated intelligence/dashboards/logic | CTD-022–024 · ACD-004 |
| AP10 | **Foundation governs; Runtime advises** — runtime dashboards ≠ commerce authority | Canonical Architecture §1.7 |

Full normative principles: [`EMPIREAI_CANONICAL_ARCHITECTURE.md`](./EMPIREAI_CANONICAL_ARCHITECTURE.md) §1.

---

## 4. Architecture Lifecycle

```
Vision alignment
        ↓
Architecture Proposal (ADR draft · subsystem impact)
        ↓
Architecture Review (Canonical Architecture · ACD · boundaries)
        ↓
Dependency Review (ACD-008–010 · CTD-028)
        ↓
Constitution Review (CTD · Engineering Constitution compliance)
        ↓
Engineering (scoped implementation · Guardian)
        ↓
Production (deploy · verify · Production Truth)
        ↓
Evidence (audit · tests · COMBINED if required)
        ↓
Lessons Learned · Vision Accumulation
        ↓
Architecture Evolution (ADR merge · Canonical Architecture update)
```

### 4.1 Review gates (mandatory)

| Gate | Owner | Pass criteria |
|------|-------|---------------|
| **Vision alignment** | Mission author | WHY statement cites Vision + Soul |
| **Architecture Review** | Chief Architect | Canonical subsystem identified · no silent drift |
| **Dependency Review** | Architect · Brain team | Explicit deps · no circular/hidden (ACD-008–010) |
| **Constitution Review** | Pillow supervisor | CTD + Engineering Constitution clear |
| **ADR** | Chief Architect | Record before irreversible structural change |

→ [`EMPIREAI_CONSTITUTION.md`](../../EMPIREAI_CONSTITUTION.md) §4.2 · [`DEVELOPMENT_DOCTRINE.md`](./DEVELOPMENT_DOCTRINE.md)

---

## 5. Architecture Ownership

| Actor | Architectural role |
|-------|---------------------|
| **Grand King** | Owns Empire · approves irreversible architecture · commercial gates |
| **Chief Architect** | Owns architectural **stewardship** · Canonical Architecture · ADRs · this law |
| **Pillow COI** | Owns continuous **architectural integrity** · drift detection · sync |
| **Brain** | **Executes** architecture — orchestration · persistence · Guardian |
| **Cockpit** | **Visualizes** architecture — never source of truth for config/knowledge |
| **Builder** | **Implements** approved architecture only |
| **Supervisor** | **Monitors** architectural execution vs mission brief |

→ [`EMPIREAI_OWNERSHIP_MODEL.md`](../governance/EMPIREAI_OWNERSHIP_MODEL.md) · [`EMPIREAI_SUPERVISOR_GOVERNANCE.md`](../governance/EMPIREAI_SUPERVISOR_GOVERNANCE.md)

**Rule:** One canonical owner per subsystem in Canonical Architecture §3 — operational delegation permitted; constitutional ownership may not split.

---

## 6. Architecture Validation

| Validation type | Method | Authority |
|-----------------|--------|-----------|
| **Constraint compliance** | `GET /empire-architecture-constraints/compliance` | ACD · Empire Review |
| **Dependency review** | `GET /empire-architecture-constraints/dependency-review` | ACD-008–010 |
| **Guardian health** | Subsystem health monitor | Engineering Constitution Art. II |
| **Architecture validator** | `backend/src/guardian/architecture-validator.ts` | Guardian |
| **REAL mission declaration** | Canonical subsystem + department + tier | Development Doctrine |
| **ADR traceability** | [`EMPIREAI_DECISIONS.md`](../../EMPIREAI_DECISIONS.md) · [`EMPIREAI_ARCHITECTURAL_DECISION_RECORD_SYSTEM.md`](../governance/EMPIREAI_ARCHITECTURAL_DECISION_RECORD_SYSTEM.md) (P3-07) | Chief Architect |

**Forbidden:** claiming architecture compliance from evidence audits alone — evidence **proves**; law **governs**.

---

## 7. Architecture Acceptance

Every architecture change must satisfy:

| # | Acceptance | Question | Proof |
|---|------------|----------|-------|
| 1 | **Repository Acceptance** | Structure/docs/ADR updated in repo? | Diff · Canonical Architecture row · tests |
| 2 | **Production Acceptance** | Live system matches accepted architecture (if production-facing)? | Deploy · health · smoke |
| 3 | **Grand King Acceptance** | Founder can operate as intended (if UX/irreversible)? | GK walkthrough |
| 4 | **Constitutional Compliance** | CTD · Engineering Constitution satisfied? | Review checklist |
| 5 | **Architecture Compliance** | ACD + Canonical Architecture satisfied? | Compliance API · ADR |

```
Constitutional + Architecture compliance
        ↓
Repository Acceptance → Production Acceptance → Grand King Acceptance
        ↓
Architecture change ACCEPTED
```

→ [`EMPIREAI_PRODUCTION_TRUTH.md`](../governance/EMPIREAI_PRODUCTION_TRUTH.md) §6

**Documentation-only architecture missions** may complete at Repository + Architecture compliance without Production Acceptance when explicitly scoped.

---

## 8. Architecture Drift Detection

### 8.1 Permanent comparison chain (Pillow continuous duty)

Pillow continuously compares:

```
Vision
        ↓
Constitution (CTD · Engineering · ACD)
        ↓
Architecture (Canonical · this law)
        ↓
Repository (code · docs · Journey)
        ↓
Production (STATUS · live observation)
        ↓
Evidence (audits · mission proof)
        ↓
Architectural Drift Report
```

### 8.2 Drift classification (mandatory)

Every detected drift **must** be classified:

| Class | Definition | Action |
|-------|------------|--------|
| **Intentional** | ADR-approved deviation with sunset | Record ADR · update Canonical Architecture on merge |
| **Temporary** | Known lag (implementation catching design) | Journey row · target date · owner |
| **Violation** | Contradicts CTD/ACD/Canonical without approval | Block promotion · remediation mission |
| **Historical** | Superseded doc cited as current | Reclassify Tier 7 · fix citations |
| **Future** | Planned V2+ not yet implemented | Roadmap · defer — not violation |

### 8.3 Drift signals

| Signal | Detector |
|--------|----------|
| Silent architecture drift | CTD-021 · Guardian architecture-validator |
| Duplicate subsystem | CTD-022–024 · Development Doctrine §2.2 |
| Doc vs production mismatch | Production Truth §7 |
| Unwired runtime module | Canonical Architecture §7 gap table |
| Frontend bypass Brain | ACD · Development Doctrine §2.1 |
| Historical doc cited as law | Constitution Hierarchy Tier 7 rule |

### 8.4 Drift report minimum fields

Mission ID · drift class · sources compared · normative doc · observed state · owner · remediation or ADR pointer · Grand King flag if irreversible.

→ [`EMPIREAI_PRODUCTION_TRUTH.md`](../governance/EMPIREAI_PRODUCTION_TRUTH.md) §7 · [`JOURNEY_AUDIT.md`](../../JOURNEY_AUDIT.md)

---

## 9. Architecture Recovery

| Scenario | Recovery path |
|----------|---------------|
| **Violation drift** | Remediation REAL/CON mission · rollback deploy if production affected |
| **Broken dependency graph** | ACD dependency review · refactor mission |
| **Guardian block** | Engineering Constitution Art. V · Recovery Planner |
| **Production incident** | Empire Recovery Doctrine · fix production first (Production Truth) |
| **ADR supersession** | New ADR · mark old decision superseded · update Canonical Architecture |

**Rule:** Recovery preserves identity (Soul) — do not silently abandon architectural promises.

---

## 10. Architecture Evolution

| Rule | Requirement |
|------|-------------|
| **E1** | Structural change → ADR in `EMPIREAI_DECISIONS.md` before merge |
| **E2** | Canonical Architecture §3 updated when subsystem boundaries change |
| **E3** | ACD immutable — change only via Grand King CONSTITUTIONAL REVIEW + catalog |
| **E4** | Postgres migration · multi-instance · HA → follow Scaling Architecture when authored (P5-05) |
| **E5** | V2 Cockpit merge → ADR + Canonical Architecture §6 update |
| **E6** | Retired subsystems → Tier/archive — not deleted from history |

---

## 11. Mandatory Rules (Summary)

| # | Rule |
|---|------|
| 1 | No architecture bypasses Vision |
| 2 | No architecture bypasses Constitution (CTD · Engineering · ACD) |
| 3 | No architecture bypasses Roadmap programme |
| 4 | No implementation becomes architecture without ADR + Canonical update |
| 5 | No duplicated architecture authority |
| 6 | One canonical architecture document (`EMPIREAI_CANONICAL_ARCHITECTURE.md`) |
| 7 | One canonical ownership model per subsystem |
| 8 | One canonical dependency model (explicit · acyclic) |

---

## 12. Examples

### Example 1 — New Business Engine

Proposal → identify Canonical Architecture §3 Business Engines slot → Dependency Review → ADR-### → REAL mission → triple acceptance → update §3 if boundaries changed.

### Example 2 — Frontend calls OpenAI directly

**Violation** — ACD · Development Doctrine §2.1 · Canonical Architecture §4 forbidden paths. Remediation: route through Brain.

### Example 3 — docs/ARCHITECTURE.md lags Canonical

**Temporary drift** — operational doc lagging normative target. Action: doc sync mission; cite Canonical as law for decisions.

### Example 4 — SYSTEM_ARCHITECTURE.md cited in mission

**Historical drift** — reclassify citation to Canonical Architecture + ADR.

---

## 13. Validation Checklist (P2-05)

| Check | Status |
|-------|--------|
| Aligns with Vision · Soul · CTD | §3 · §2.2 |
| Aligns with Constitution Hierarchy · Engineering Constitution · Doctrine System | §2 |
| Aligns with Canonical Architecture · Repository · Production Truth | §2.1 |
| No duplicate architectural authority | §2.1 · §11 |
| Lifecycle completed | §4 |
| Drift detection defined | §8 |
| Acceptance model completed | §7 |

---

## 14. Ratification

| Field | Value |
|-------|-------|
| **Mission** | P2-05 — Architecture Law |
| **Ratification date** | 2026-07-05 |
| **Next constitutional phase** | P3 — Architecture Foundation (not started) |

---

## Revision History

| Version | Date | Authority | Change |
|---------|------|-----------|--------|
| 1.0.0 | 2026-07-05 | Grand King · P2-05 | Permanent Architecture Law |

---

## Related

- [`EMPIREAI_COCKPIT_ARCHITECTURE.md`](./EMPIREAI_COCKPIT_ARCHITECTURE.md) (P3-03) · [`EMPIREAI_PILLOW_ARCHITECTURE.md`](./EMPIREAI_PILLOW_ARCHITECTURE.md) (P3-02) · [`EMPIREAI_BRAIN_ARCHITECTURE.md`](./EMPIREAI_BRAIN_ARCHITECTURE.md) (P3-01) · [`DEVELOPMENT_DOCTRINE.md`](./DEVELOPMENT_DOCTRINE.md)  
- [`EMPIREAI_ARCHITECTURE_CONSTRAINTS_ACD.md`](../../EMPIREAI_ARCHITECTURE_CONSTRAINTS_ACD.md)  
- [`EMPIREAI_DOCTRINE_SYSTEM.md`](../governance/EMPIREAI_DOCTRINE_SYSTEM.md) · [`EMPIREAI_DOCUMENTATION_LAW.md`](../governance/EMPIREAI_DOCUMENTATION_LAW.md) (P2-06) · [`EMPIREAI_CONSTITUTION.md`](../../EMPIREAI_CONSTITUTION.md)  
- [`EMPIREAI_DECISIONS.md`](../../EMPIREAI_DECISIONS.md) · [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md)
