# EMPIREAI DOCUMENTATION LAW

> **Classification:** CANONICAL — Tier 5 Law (Documentation Governance)  
> **Document ID:** P2-06 · ECDS-1 Ratification  
> **Constitutional phase:** P2 — Constitution Foundation  
> **Dependencies:** P1 complete · P2-01 → P2-05  
> **Owner:** Chief Architect  
> **Authority:** CANONICAL — apex documentation governance; **subordinate to CTD · Constitution Hierarchy**  
> **Parent:** CTD · [`EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md`](./EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md) · [`EMPIREAI_REPOSITORY_STRUCTURE.md`](./EMPIREAI_REPOSITORY_STRUCTURE.md) (P1-09)  
> **Children:** Master Index · ECDS operational guides · per-document classifications  
> **Ratified:** 2026-07-05 (P2-06)  
> **Role:** Permanent law governing **every document** in the EmpireAI repository

**Navigation root:** [`EMPIREAI_REPOSITORY_MASTER_INDEX.md`](../../EMPIREAI_REPOSITORY_MASTER_INDEX.md)  
**Placement law:** [`EMPIREAI_REPOSITORY_STRUCTURE.md`](./EMPIREAI_REPOSITORY_STRUCTURE.md) (P1-09)  
**Naming:** [`EMPIREAI_NAMING_STANDARD.md`](./EMPIREAI_NAMING_STANDARD.md) (ECNS-2)  
**Terms:** [`EMPIREAI_GLOSSARY.md`](./EMPIREAI_GLOSSARY.md)

**Reconstruction evidence (informative):** `docs/audits/canonical-documentation/` — **EVIDENCE**, not competing law

---

## 1. Purpose

Documentation is **constitutional knowledge**. It is **not** evidence. It is **not** implementation.

Documentation Law is the **single permanent authority** governing how every document is classified, owned, placed, traced, revised, and retired. It ratifies **ECDS-1** (EmpireAI Canonical Documentation System) into constitutional law.

**The principle:** Documentation preserves truth · one owner · one purpose · one location · one classification · documentation must never compete · documentation must never duplicate constitutional authority.

---

## 2. Authority & Inheritance

### 2.1 Authority chain

```
Vision · Soul (inform)
        ↓
CTD (commercial bounds)
        ↓
Constitution Hierarchy
        ↓
Engineering Constitution · Doctrine System · Architecture Law
        ↓
Documentation Law (this document — ECDS-1)
        ↓
Master Index · Repository Structure · individual documents
        ↓
Implementation · Production · Evidence
```

### 2.2 What Documentation Law governs

| Document family | Governed by |
|-----------------|-------------|
| Canonical documents | §4 CANONICAL · citation as law |
| Operational documents | §4 OPERATIONAL · current state |
| Evidence documents | §4 EVIDENCE · proof only |
| Historical documents | §4 HISTORICAL · zero authority |
| Stub documents | §4 STUB · replace or archive |
| Generated artifacts | §4 GENERATED · not documentation |
| Architecture documents | Architecture Law + §4 |
| Governance documents | Doctrine System + §4 |
| Engineering documents | Engineering Constitution + §4 |
| Business / commerce documents | CBD · Commerce Canon + §4 |
| Journey documents | Journey First + §4 |
| ADR documents | `EMPIREAI_DECISIONS.md` register |
| Audit documents | Executive Audit Standard + §4 EVIDENCE |
| Mission documents | Cursor Output Standard + §4 |
| Knowledge documents | EKLS · Repository First + §4 |

### 2.3 What Documentation Law is NOT

| Not | Is instead |
|-----|------------|
| CTD or Engineering Constitution | Those are **law bodies** — classified CANONICAL Tier 3 |
| Production Truth | **Doctrine** — operational truth rules |
| Evidence audit | **EVIDENCE** — proves; never governs |
| Master Index content | **Navigation catalog** — subordinate to this law |

**Rule:** No second documentation authority file. Amend **this law** for classification/lifecycle; amend **Repository Structure** for placement.

---

## 3. Document Principles (Constitutional)

| # | Principle |
|---|-----------|
| DP1 | Documentation exists to **preserve truth** — not to replace production observation |
| DP2 | Every document has **one owner** |
| DP3 | Every document has **one constitutional purpose** |
| DP4 | Every document has **one canonical location** |
| DP5 | Every document has **one classification** |
| DP6 | Documentation must **never compete** at same tier without ADR precedence |
| DP7 | Documentation must **never duplicate constitutional authority** |
| DP8 | Evidence **proves** — never cited as current law |
| DP9 | Implementation **proves** — never silently becomes normative architecture without ADR |
| DP10 | CTD-034 — conversation is not the only place knowledge exists |

---

## 4. Document Classifications (ECDS-1)

### 4.1 Primary classes

| Class | Purpose | Authority | Owner | Consumers | Retention | Cite as law? |
|-------|---------|-----------|-------|-----------|-----------|--------------|
| **CANONICAL** | Governing identity, law, normative design, P-era governance | Grand King · Chief Architect | Per doc header | All agents | Until superseded | **Yes** |
| **OPERATIONAL** | Current implementation map, STATUS, dev guides, runbooks | Maintainer | Domain owner | Engineers · ops | Revise on release | Current state only |
| **EVIDENCE** | Immutable audit, certification, mission proof | Point-in-time author | Audit author | Review · PROOF | Append-only corpus | **Proof only — never** |
| **HISTORICAL** | Superseded prose — context only | — | Chief Architect (label) | Historians | Frozen | **Never** |
| **STUB** | Placeholder scaffold | — | Assign on promotion | — | Replace or archive | **No** |
| **GENERATED** | Build output, cache, compiled dist | Toolchain | Engineering | Runtime | Gitignored / ephemeral | **No** |

### 4.2 Class examples

| Class | Examples |
|-------|----------|
| **CANONICAL** | CTD · Vision · Soul · Engineering Constitution · Architecture Law · GVD · Canonical Architecture |
| **OPERATIONAL** | `docs/ARCHITECTURE.md` · `EMPIREAI_STATUS.md` · `deployment/MANAGED_DEPLOYMENT.md` · `backend/README.md` |
| **EVIDENCE** | `COMBINED_EXECUTIVE_AUDIT_*.md` · `artifacts/*-executive-audit.md` · `docs/audits/canonical-documentation/` (reconstruction pack) |
| **HISTORICAL** | `docs/SYSTEM_ARCHITECTURE.md` cluster · superseded bible drafts |
| **STUB** | Empty scaffolds · "TO AUTHOR" placeholders post-P2 |
| **GENERATED** | `node_modules/` · `backend/dist/` · build reports |

### 4.3 Matrix rule

Every tracked artifact has:
- **One ECDS class** (above)
- **One artifact kind** where applicable (Configuration · Runtime · Engineering · Production · Generated) — [`EMPIREAI_REPOSITORY_STRUCTURE.md`](./EMPIREAI_REPOSITORY_STRUCTURE.md) §7.2

---

## 5. Document Lifecycle

```
Proposal
        ↓
Review (classification · owner · parent · CTD alignment)
        ↓
Approval (Grand King · Architect per tier)
        ↓
Publication (Master Index row · citation header)
        ↓
Operational Use
        ↓
Revision (rules per class §5.2)
        ↓
Historical Preservation (superseded-by pointer)
        ↓
Retirement (Tier 7 · zero authority)
```

### 5.1 Creation rules by class

| Class | Who creates | Approval | Registration |
|-------|-------------|----------|--------------|
| CANONICAL Tier 2–3 | Chief Architect drafts | Grand King (+ GVD if governance) | Master Index · Framework cross-link |
| CANONICAL Tier 4–5 | Domain owner | Chief Architect | Master Index · Journey if structural |
| OPERATIONAL | Maintainer | Mission / DevOps policy | Master Index recommended |
| EVIDENCE | Audit author | Executive Audit Standard | EXECUTIVE_AUDIT_INDEX |
| ADR | Chief Architect | Grand King for CON-* | `EMPIREAI_DECISIONS.md` |
| STUB | — | Promote or archive in P2+ | Mark STUB in header |

### 5.2 Amendment rules

| Class | Rule |
|-------|------|
| **CANONICAL law (Tier 3)** | CONSTITUTIONAL REVIEW · executive audit or GK for structural change · Master Index update |
| **CANONICAL identity (Tier 2)** | Grand King · Vision Sync if Vision touch |
| **OPERATIONAL** | Update with release · STATUS after missions · Journey if structural |
| **EVIDENCE** | **Never amend body** — new file with new ID/date |
| **HISTORICAL** | **No amendments** — archive banner only |
| **GENERATED** | Regenerated by build — not manually curated |

### 5.3 Supersession

When document B replaces A: A → **HISTORICAL** · B header `Supersedes: A` · Master Index superseded-by pointer · Journey Audit row if structural.

---

## 6. Document Ownership (Required Header Fields)

Every **Canonical** document **must** declare:

| Field | Required |
|-------|----------|
| **Owner** | Yes |
| **Constitutional Parent** | Yes |
| **Classification** | Yes (ECDS class + tier) |
| **Dependencies** | Yes |
| **Consumers** | Recommended |
| **Related Documents** | Recommended |
| **Supersedes** | If applicable |
| **Superseded By** | If retired |
| **Status** | Active · Ratified · Pending · Historical |

→ [`EMPIREAI_CONSTITUTION_HIERARCHY.md`](./EMPIREAI_CONSTITUTION_HIERARCHY.md) §7 citation rules

---

## 7. Document Traceability

Every **Canonical** document must trace:

```
Vision
        ↓
Soul
        ↓
CTD
        ↓
Constitution Hierarchy
        ↓
Roadmap (if programme)
        ↓
Architecture (if structural)
        ↓
Engineering (if implementation-bound)
        ↓
Production (if live surface)
        ↓
Evidence (if mission proof linked)
```

**No orphan documentation:** every Canonical doc appears in Master Index with owner + class + parent.

→ [`EMPIREAI_REPOSITORY_STRUCTURE.md`](./EMPIREAI_REPOSITORY_STRUCTURE.md) §8

---

## 8. Document Quality Rules

| # | Rule |
|---|------|
| Q1 | No duplicate truth at same tier + domain |
| Q2 | No duplicate constitutional authority |
| Q3 | No conflicting documentation without ADR precedence |
| Q4 | No undocumented constitutional artifact |
| Q5 | No undocumented production doctrine (Production Truth governs) |
| Q6 | No undocumented architectural authority (Architecture Law governs) |
| Q7 | Evidence never promoted to law without CANONICAL reclassification process |
| Q8 | Historical never cited as current |
| Q9 | Stub replaced or archived — not left indefinite post-P2 |
| Q10 | Qualified constitution names only (ECNS-2) |

---

## 9. Master Index Governance

**Navigation root:** [`EMPIREAI_REPOSITORY_MASTER_INDEX.md`](../../EMPIREAI_REPOSITORY_MASTER_INDEX.md)

### 9.1 Master Index duties

| Duty | Requirement |
|------|-------------|
| **Classification** | Every indexed row states ECDS class where known |
| **Ownership** | Owner column populated |
| **Tier** | Constitutional tier per Constitution Hierarchy |
| **Authority** | Law vs operational vs evidence clear |
| **Dependencies** | Key deps in row |
| **Navigation** | Quick-nav sections maintained |
| **Cross references** | Related artifacts column |

### 9.2 P2-06 validation & recommendations (CON-002 partial)

| Check | Status | Recommendation |
|-------|--------|----------------|
| P2 governance block indexed | **Yes** | Maintain on each P2 mission |
| Architecture block indexed | **Yes** (P2-05) | Keep normative vs operational split |
| ECDS Classification column | **Partial** | Add **Class** column to §3 Governance tables (R4 from P1-09) |
| Tier column | **Partial** | Add **Tier** column for constitutional docs |
| Stale "TO AUTHOR" rows | **Some remain in audit pack** | Update audit evidence labels only — live docs ratified |
| Executive Audit Index sync | **CON-003 open** | Programme mission — not P2-06 blocker |
| Generated artifacts in index | **Excluded by design** | Gitignore — not indexed |

**Rule:** Master Index is **catalog** — Journey is **operational status** — neither replaces this law.

---

## 10. Governance

| Role | Duty |
|------|------|
| **Grand King** | Approve Tier 2–3 canonical changes · sovereign doc acceptance |
| **Chief Architect** | Maintain Documentation Law · ECDS · Master Index structure |
| **Pillow COI** | Drift detection · orphan docs · misclassification |
| **Domain owners** | Maintain assigned documents · propose revisions |
| **Audit authors** | EVIDENCE class only · Executive Audit Standard |

**Amendment:** CONSTITUTIONAL REVIEW + Chief Architect; classification model change → Grand King.

---

## 11. Future Expansion Rules

| Rule | Requirement |
|------|-------------|
| **F1** | New CANONICAL doc → header complete · Master Index · parent in traceability chain |
| **F2** | New class requires ADR + amendment to §4 |
| **F3** | EI library docs → EI_INDEX append · subordinate to Pillow EI Constitution |
| **F4** | Mission outputs default EVIDENCE unless promoted via CANONICAL process |
| **F5** | CON-020+ programme docs → Tier 4 · append only |
| **F6** | Full Master Index classification pass → CON-002 · may follow P2-07 |

---

## 12. Examples

### Example 1 — Citing correctly

Wrong: "Per COMBINED_EXECUTIVE_AUDIT_CTD, CTD requires X."  
Right: "Per **Commercial Constitution** CTD-017 … [Evidence: COMBINED_EXECUTIVE_AUDIT_CTD — proof of 2026 audit pass]"

### Example 2 — New governance policy

Create `EMPIREAI_*_POLICY.md` · class CANONICAL Tier 3 · owner · Framework cross-link · Master Index row · **not** a second documentation system.

### Example 3 — Operational lag

`docs/ARCHITECTURE.md` lags Canonical Architecture → **OPERATIONAL** temporary drift · doc sync mission · cite Canonical for decisions.

### Example 4 — Generated vs documentation

`backend/dist/` = **GENERATED** — never indexed as law. Source in `backend/src/` = **Engineering artifact**.

---

## 13. Validation Checklist (P2-06)

| Check | Status |
|-------|--------|
| Aligns with Vision · Soul · CTD · Hierarchy | §2.1 · §7 |
| Aligns with Engineering Constitution · Doctrine System · Architecture Law | §2.1 |
| Aligns with Roadmap · Repository · Production Truth · Master Index | §9 |
| Classification validated | §4 |
| Ownership validated | §6 |
| Traceability completed | §7 |
| No duplicated documentation authority | §2.3 · §8 |

---

## 14. Ratification

| Field | Value |
|-------|-------|
| **Mission** | P2-06 — Documentation Law |
| **Ratification date** | 2026-07-05 |
| **ECDS-1** | Ratified as constitutional Documentation Law |
| **Next constitutional phase** | P3 — Architecture Foundation (not started) |

---

## Revision History

| Version | Date | Authority | Change |
|---------|------|-----------|--------|
| 1.0.0 | 2026-07-05 | Grand King · P2-06 | ECDS-1 ratified — permanent Documentation Law |

---

## Related

- [`EMPIREAI_REPOSITORY_MASTER_INDEX.md`](../../EMPIREAI_REPOSITORY_MASTER_INDEX.md)  
- [`EMPIREAI_REPOSITORY_STRUCTURE.md`](./EMPIREAI_REPOSITORY_STRUCTURE.md) · [`EMPIREAI_PRODUCTION_TRUTH.md`](./EMPIREAI_PRODUCTION_TRUTH.md)  
- [`EMPIREAI_ARCHITECTURE_LAW.md`](../architecture/EMPIREAI_ARCHITECTURE_LAW.md) · [`EMPIREAI_DOCTRINE_SYSTEM.md`](./EMPIREAI_DOCTRINE_SYSTEM.md)  
- [`EMPIREAI_CONSTITUTION_HIERARCHY.md`](./EMPIREAI_CONSTITUTION_HIERARCHY.md) · [`EMPIREAI_CORE_CONSTITUTION_CTD.md`](../../EMPIREAI_CORE_CONSTITUTION_CTD.md)
