# EMPIREAI ARCHITECTURAL DECISION RECORD SYSTEM

> **Classification:** CANONICAL — Tier 3 Law (Governance · Architecture Decisions)  
> **Document ID:** P3-07  
> **Constitutional phase:** P3 — Architecture Foundation (final P3 artifact)  
> **Dependencies:** P1 complete · P2 complete · P3-01 → P3-06 · Architecture Law · Documentation Law  
> **Owner:** Chief Architect (authorship) · Grand King (CON-* approval)  
> **Authority:** CANONICAL — single permanent ADR system; **subordinate to CTD · Constitution Hierarchy · Architecture Law**  
> **Parent:** [`EMPIREAI_ARCHITECTURE_LAW.md`](../architecture/EMPIREAI_ARCHITECTURE_LAW.md) · [`EMPIREAI_DOCTRINE_SYSTEM.md`](./EMPIREAI_DOCTRINE_SYSTEM.md)  
> **Register:** [`EMPIREAI_DECISIONS.md`](../../EMPIREAI_DECISIONS.md) — sole ADR authority  
> **Ratified:** 2026-07-05 (P3-07)  
> **Role:** Permanent system governing how every major architectural decision is recorded, traced, and preserved

**Naming law:** [`EMPIREAI_NAMING_STANDARD.md`](./EMPIREAI_NAMING_STANDARD.md) §5.4 · **Traceability:** [`EMPIREAI_REASONING_MODEL.md`](./EMPIREAI_REASONING_MODEL.md) (WHY → WHAT → HOW → PROOF)

---

## 1. Purpose

Architecture **evolves**. Architectural decisions **must never disappear**.

The ADR System is EmpireAI's **permanent decision memory** — every major trade-off, accepted alternative, rejected path, and production-impacting choice remains **traceable from Vision to Production** for the lifetime of the Empire.

| ADR System IS | ADR System IS NOT |
|---------------|-------------------|
| Permanent traceability for architectural decisions | A second architecture document |
| Governance process + register standard | Implementation code |
| Record of trade-offs and consequences | Production Truth (records decisions; Production Truth records live state) |
| Constitutional decision index (ADR-CON-*) | Competing decision registers |

**The principle:** Decide with evidence · record before irreversible change · trace to Vision · never fork the register.

---

## 2. ADR Philosophy

| # | Principle | Implication |
|---|-----------|-------------|
| ADR-P1 | **One register** | All ADRs live in `EMPIREAI_DECISIONS.md` — extended companions link back, never replace |
| ADR-P2 | **Decisions before drift** | Structural change requires ADR draft before merge (Architecture Law E1) |
| ADR-P3 | **Supersede, never delete** | Historical decisions marked **Superseded** or **Historical** — rationale preserved |
| ADR-P4 | **Traceability chain** | Every ADR links Vision → Constitution → Architecture → Mission → Commit → Production |
| ADR-P5 | **CON-* for constitutional architecture** | ADR-CON-001→010 index P3 foundation decisions |
| ADR-P6 | **PDR for open choices** | Pending Decision Records remain explicit until resolved |
| ADR-P7 | **Evidence ≠ law** | Audit packs prove past state; ADRs govern future behaviour |

---

## 3. ADR Lifecycle

```
Draft
  ↓
Review (Chief Architect · domain owner · Pillow drift check)
  ↓
Approved (Grand King for ADR-CON-* · irreversibles · production authority)
  ↓
Implemented (REAL mission · Builder · commit)
  ↓
Production Validated (Production Truth · acceptance evidence)
  ↓
Historical (context only — zero authority if superseded)
  ↓
Superseded (new ADR replaces — old entry preserved)
```

| Status | Meaning | Authority |
|--------|---------|-----------|
| **Draft** | Proposed — not yet binding | None |
| **Review** | Under constitutional/architectural review | None |
| **Approved** | Binding for future work | Yes |
| **Implemented** | Code/docs reflect decision | Yes |
| **Production Validated** | Live environment confirms | Yes + Production Truth |
| **Historical** | Context preserved | None |
| **Superseded** | Replaced by newer ADR | None — cite successor |

---

## 4. ADR Standards

### 4.1 ID namespaces

| Prefix | Pattern | Owner | Use |
|--------|---------|-------|-----|
| **ADR-###** | Three digits · sequential | Chief Architect | Programme · subsystem · technology decisions |
| **ADR-CON-###** | Constitutional architecture | Chief Architect + Grand King | P3 foundation · production authority · governance architecture |
| **PDR-###** | Pending decision | Chief Architect | Open trade-offs awaiting resolution |

**Rule:** Never reuse a retired ADR number. ADR-020 is immutable (Backlog Routing — ADR-044 documents slot conflict).

### 4.2 Required fields (every ADR)

| Field | Required |
|-------|----------|
| ADR ID | Yes |
| Title | Yes |
| Status | Yes |
| Date | Yes (approval date) |
| Owner | Yes |
| Approver | Yes |
| Roadmap Item | If applicable |
| Related Mission(s) | If applicable |
| Related REAL Mission(s) | If applicable |
| Related Commit(s) | When implemented |
| Dependencies | Prior ADRs · doctrines |
| Constitution References | CTD · Engineering · domain constitutions |
| Architecture References | Canonical Architecture § · P3 docs |
| Problem | Yes |
| Context | Yes |
| Decision | Yes |
| Alternatives Considered | Yes (min 1) |
| Trade-offs | Yes |
| Consequences | Yes |
| Implementation Impact | Yes |
| Production Impact | Yes |
| Future Considerations | Yes |
| Lessons Learned | When validated |

**Short-form ADRs (ADR-001→052 legacy):** Retained for history. **New ADRs** use full template (§4.2). **ADR-CON-*** always use full template.

### 4.3 Extended companion documents

When an ADR requires extended policy (e.g. ADR-044 REAL namespace):

| Rule | Example |
|------|---------|
| Register entry in `EMPIREAI_DECISIONS.md` | Summary + link |
| Companion file in `docs/governance/ADR-###-*.md` | Full policy |
| Companion **must** cite register ID | Never a second register |

---

## 5. Traceability Chain

Every ADR **must** trace (document or N/A with reason):

```
Vision (WHY)
  ↓
Soul (WHO · continuity)
  ↓
CTD (commercial law)
  ↓
Constitution Hierarchy · Engineering Constitution
  ↓
Roadmap Item (CON-### · REAL-### · phase)
  ↓
Architecture (Canonical · P3 normative docs)
  ↓
REAL Mission(s) · CON Mission(s)
  ↓
Git Commit(s)
  ↓
Production (STATUS · deploy · health evidence)
```

**Validation:** If an ADR cannot cite at least **Vision + Architecture + Owner**, it is incomplete.

---

## 6. Governance

| Action | Authority |
|--------|-----------|
| Draft ADR-### | Chief Architect · domain owner |
| Approve ADR-### (structural) | Chief Architect · Grand King if irreversible |
| Approve ADR-CON-* | **Grand King** (required) |
| Supersede ADR | New ADR + mark old Superseded |
| PDR → ADR promotion | Resolution mission + register update |
| Register maintenance | Chief Architect · Journey sync if structural |

**Integration:**

| System | Relationship |
|--------|--------------|
| **Architecture Law** | E1 — ADR before structural merge |
| **Documentation Law** | ADR class · ECDS registration |
| **Doctrine System** | ADRs cite parent doctrines; doctrines cite governing ADRs |
| **Builder** | Implements approved ADRs only |
| **Pillow** | Drift detection when implementation contradicts ADR |
| **Production Truth** | Production Validated status requires acceptance evidence |

---

## 7. Domains Governed

The ADR System governs decisions in:

Architecture · Technology · Production · Infrastructure · Repository · Database · Runtime · Commerce · Security · Scaling · AI · Governance

Each maps to register sections and P3 canonical architectures (P3-01→P3-06).

---

## 8. Repository Review (P3-07 Audit)

### 8.1 Register inventory

| Metric | Count | Location |
|--------|-------|----------|
| **Programme ADRs** | 52 | `EMPIREAI_DECISIONS.md` ADR-001→052 |
| **Constitutional ADRs** | 10 | ADR-CON-001→010 (this mission) |
| **Pending decisions** | 4 active PDRs | PDR-001 · PDR-003 · PDR-004 · PDR-006 |
| **Extended companions** | 1 | `docs/governance/ADR-044-REAL-NAMESPACE-CANONICALIZATION.md` |
| **Superseded programmes** | 3 | R001–R010 · MOS-001 · ADR-012 |

### 8.2 Duplicate ADR systems

| Finding | Disposition |
|---------|-------------|
| `EMPIREAI_DECISIONS.md` vs scattered audit ADR mentions | **Single register** — audits cite ADR-### only |
| ADR-044 companion file | **Valid companion** — not duplicate |
| Mission-local "ADR" headers in artifacts | **Evidence** — must sync summary to register |

**No competing ADR system created.**

### 8.3 Missing ADRs (resolved this mission)

| Gap | Resolution |
|-----|------------|
| No formal ADR-CON-* constitutional index | **Created** ADR-CON-001→010 |
| No ADR system governance doc | **Created** this document (P3-07) |
| Production client authority undecided | ADR-CON-001 **Draft** — Grand King pending |

### 8.4 Superseded ADRs

| ADR | Superseded by | Status |
|-----|---------------|--------|
| ADR-012 MOS-001 | ADR-013 COS-001 | Superseded · preserved |
| PDR-002 | ADR-012/013 | Superseded |
| PDR-005 | ADR-013 | Superseded |

### 8.5 Drift observations

| Drift type | Finding | Remediation |
|------------|---------|-------------|
| **Architecture drift** | Dual frontend (CON-006) | ADR-CON-001 Draft — GK decision |
| **Repository drift** | Scattered commerce folders vs `commerce/` target | ADR-CON-006 · P3-05 evolution path |
| **Production drift** | Extension routes off vs docs implying full API | ADR-CON-002 · Production Truth |

---

## 9. Mandatory Constitutional ADRs (ADR-CON-001 → ADR-CON-010)

| ID | Title | Status | Action |
|----|-------|--------|--------|
| **ADR-CON-001** | Production Client Authority | **Draft** | Created — consolidates CON-006; **Grand King approval required** |
| **ADR-CON-002** | Production Mode Policy | **Approved** | Created — consolidates CON-007 principle · ADR-048/049 |
| **ADR-CON-003** | Brain Runtime Strategy | **Approved · Implemented** | Created — consolidates ADR-001/003/004 · P3-01 |
| **ADR-CON-004** | Builder Governance | **Approved · Implemented** | Created — consolidates ADR-035 · P3-04 |
| **ADR-CON-005** | Infrastructure Strategy | **Approved · Implemented** | Created — consolidates ADR-002/003 · P3-06 · MPD-001 |
| **ADR-CON-006** | Commerce Strategy | **Approved · Implemented** | Created — consolidates ADR-011/013/051 · P3-05 |
| **ADR-CON-007** | Vision Synchronization | **Approved · Implemented** | Created — consolidates ADR-014/026 · sync policy |
| **ADR-CON-008** | Supervisor Architecture | **Approved · Implemented** | Created — consolidates ADR-035 · Supervisor Governance |
| **ADR-CON-009** | Production Acceptance Model | **Approved · Implemented** | Created — consolidates P1-10 Production Truth |
| **ADR-CON-010** | Future Expansion Strategy | **Approved** | Created — consolidates ADR-015/019 · MS-A/MS-B · P5 path |

**Full records:** [`EMPIREAI_DECISIONS.md`](../../EMPIREAI_DECISIONS.md) § Constitutional Architecture Decisions.

---

## 10. Future ADR Rules

1. **New structural subsystem** → ADR-### + Canonical Architecture §3 row before REAL implementation  
2. **Production URL / env / cookie change** → ADR + Naming Standard frozen ID check  
3. **Constitutional architecture change** → ADR-CON-* + Grand King + Framework entry  
4. **Supersession** → New ADR marks old **Superseded** with link — never delete  
5. **PDR resolution** → Promote to ADR or close with rationale  
6. **Mission completion** → Cite ADR in Executive Audit · update register status to Implemented  
7. **Production deploy** → Update ADR to Production Validated when Production Truth accepts  

---

## 11. Examples

### Example 1 — Constitutional ADR (ADR-CON-003)

Brain must remain single dispatch path → ADR-001 + P3-01 Brain Architecture → REAL modules register tools → commits implement → `/health/live` validates production.

### Example 2 — Pending promotion (PDR-001)

PostgreSQL vs SQLite at scale → PDR-001 open → will become ADR-053 or ADR-CON-005 amendment when migration mission approved.

### Example 3 — Supersession (ADR-012 → ADR-013)

Marketplace OS pivot superseded by Commerce OS kernel — ADR-012 marked Superseded · MOS vision preserved as Historical.

### Example 4 — Violation (forbidden)

Engineer merges folder restructure without ADR → Architecture Law E1 violation · Pillow drift detection · mission blocked at Repository Acceptance.

---

## 12. Validation Checklist (P3-07)

| Check | Status |
|-------|--------|
| Aligns with Vision · Soul · CTD · Constitution Hierarchy | §1 · §5 · §6 |
| Aligns with Architecture Law · Documentation Law · Doctrine System | Header · §6 |
| Aligns with P3-01→P3-06 canonical architectures | §7 · §9 |
| Aligns with Production Truth · Repository | §8 · §9 |
| No duplicated ADR authority | §2 ADR-P1 · single register |
| Existing ADRs reviewed | §8 |
| Missing ADRs identified and created (ADR-CON-*) | §9 |
| Traceability validated | §5 |
| Cross-references completed | §13 Related |
| **Phase P3 complete** | §18 Ratification |

---

## 13. Ratification

| Field | Value |
|-------|-------|
| **Mission** | P3-07 — Architectural ADRs |
| **Ratification date** | 2026-07-05 |
| **Phase P3 status** | **COMPLETE** |
| **Next phase** | P4 — Engineering Foundation |
| **Next mission** | P4-01 — Engineering Standards |

---

## Revision History

| Version | Date | Authority | Change |
|---------|------|-----------|--------|
| 1.0.0 | 2026-07-05 | Grand King · P3-07 | Canonical ADR System — register governance · ADR-CON index · P3 closure |

---

## Related

- [`EMPIREAI_ENGINEERING_STANDARDS.md`](../governance/EMPIREAI_ENGINEERING_STANDARDS.md) (P4-01) · [`EMPIREAI_DECISIONS.md`](../../EMPIREAI_DECISIONS.md)  
- [`EMPIREAI_CANONICAL_ARCHITECTURE.md`](../architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md) · P3-01→P3-06 architecture docs  
- [`EMPIREAI_PRODUCTION_TRUTH.md`](./EMPIREAI_PRODUCTION_TRUTH.md) · [`EMPIREAI_CONSTITUTION_LOCK.md`](./EMPIREAI_CONSTITUTION_LOCK.md)
