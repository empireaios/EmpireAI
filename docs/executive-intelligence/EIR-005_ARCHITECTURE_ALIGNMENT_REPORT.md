# EIR-005 Architecture Alignment Report

> **Release:** EIR-005  
> **Title:** Constitutional System Alignment — Architecture Report  
> **Mission type:** Governance documentation only  
> **Date:** 2026-06-21  
> **Status:** ✅ Complete  
> **Implementation:** None  
> **Push status:** Not pushed — awaiting separate approval

---

## 1. Summary

**EIR-005** documents the **canonical constitutional stack** of EmpireAI with explicit **Authority**, **Responsibilities**, **Boundaries**, and **Accountability** for each layer. The approved order places **Executive Intelligence above Pillow** and introduces **Decision Engine** as a distinct layer between Brain and Agents.

**No application code, runtime, Brain logic, Pillow implementation, Cockpit, REAL missions, or APIs were modified.**

---

## 2. Canonical stack (EIR-005)

```
King
  ↓
Executive Intelligence
  ↓
Pillow
  ↓
Brain
  ↓
Decision Engine
  ↓
Agents
  ↓
Connectors
  ↓
Internet
```

**Primary artifact:** [EI_SYSTEM_ALIGNMENT.md](./EI_SYSTEM_ALIGNMENT.md)

---

## 3. Layer alignment matrix

| Layer | Authority (summary) | Computes? | Governs reasoning? | King approval? | Accountable party |
|-------|---------------------|-----------|-------------------|----------------|-------------------|
| **King** | Sovereign | No | No (ratifies EI) | Self | King (sovereign decisions) |
| **Executive Intelligence** | Constitutional doctrine | No | **Yes** | Amends EI | EI library / Repository Governance |
| **Pillow** | Applies EI | No | Applies | Proposes; never self-amends | **EmpireAI** (not King) |
| **Brain** | Orchestration | **Yes** | No | Routes to approval chain | Runtime Engineering / Brain |
| **Decision Engine** | L0–L4 authority eval | Yes (evaluation) | No | Gates L3/L4 | Brain / Decision Engine |
| **Agents** | Domain execution | Yes (tasks) | No | Via Decision Engine | Domain module owners |
| **Connectors** | External integration | Yes (I/O) | No | No | Reality Integration |
| **Internet** | External sources | N/A | N/A | N/A | Third parties |

---

## 4. Harmonization with prior documents

| Prior artifact | EIR-005 harmonization |
|----------------|----------------------|
| `EXECUTIVE_INTELLIGENCE_ARCHITECTURE.md` | Stack order updated — EI above Pillow; Decision Engine added |
| `EI0_EXECUTIVE_INTELLIGENCE_CHARTER.md` §3 | Already King → EI → Pillow → Brain — **confirmed** |
| `PILLOW_EXECUTIVE_CONSTITUTION.md` | Pillow below EI — **confirmed** |
| `EMPIREAI_CANONICAL_ARCHITECTURE.md` | Brain · Agents · Connectors — Decision Engine now explicit in EI stack |
| `backend/README.md` | Decision Engine documented at `brain/decision-engine.ts` — aligned |
| EIR-001 stack (Pillow before EI in architecture doc) | **Superseded** by EIR-005 canonical order |

---

## 5. Key constitutional separations (recorded)

| Separation | Rule |
|------------|------|
| **EI vs Brain** | EI governs reasoning · Brain computes |
| **Pillow vs EI** | Pillow applies EI · never self-amends EI |
| **King vs Pillow** | King approves · EmpireAI accountable for recommendation quality |
| **Decision Engine vs King** | Decision Engine gates operational authority (L3/L4) · King retains sovereign approval |
| **Decision Engine vs EI** | EI defines constitutional launch/risk doctrine · Decision Engine evaluates dispatch authority levels |
| **Cockpit vs stack** | Cockpit presents EI · not a constitutional authority layer |
| **Connectors vs EI6** | Connectors integrate · EI6 governs commercial risk analysis |

---

## 6. Boundaries requiring future REAL / runtime attention (documentation only)

| Boundary | Layer | Note |
|----------|-------|------|
| CRIR / launch gates | EI6 → Commerce READINESS | Runtime enforcement deferred — EI governs documentation-first |
| L3/L4 founder approval | Decision Engine → King | Implemented in `decision-engine.ts` — not modified |
| REAL-128–130 live paths | EI6 · Connectors | On hold pending EI6 clearance |
| Guardian pre-dispatch | Foundation · Brain | Complements Decision Engine — not replaced |

---

## 7. Artifacts created / updated

| Action | File |
|--------|------|
| **Created** | `EI_SYSTEM_ALIGNMENT.md` |
| **Created** | `EIR-005_ARCHITECTURE_ALIGNMENT_REPORT.md` (this report) |
| **Updated** | `EXECUTIVE_INTELLIGENCE_ARCHITECTURE.md` — stack harmonized |
| **Updated** | `EI_INDEX.md` — EIR-005 release record |
| **Updated** | `EI_VERSION_HISTORY.md` — EIR-005 entry |
| **Updated** | `EXECUTIVE_INTELLIGENCE_MANIFEST.md` — system alignment cross-ref |

---

## 8. Validation

| Check | Result |
|-------|--------|
| Documentation only | ✅ Pass |
| No implementation | ✅ Pass |
| Stack documented with Authority · Responsibilities · Boundaries · Accountability | ✅ Pass |
| Decision Engine layer recorded | ✅ Pass |
| EI above Pillow in canonical order | ✅ Pass |
| Prior docs harmonized (not REAL history) | ✅ Pass |
| Push deferred | ✅ Per mission directive |

---

## 9. Cross-references

| Document | Relationship |
|----------|--------------|
| [EI_SYSTEM_ALIGNMENT.md](./EI_SYSTEM_ALIGNMENT.md) | Primary EIR-005 deliverable |
| [EXECUTIVE_INTELLIGENCE_ARCHITECTURE.md](./EXECUTIVE_INTELLIGENCE_ARCHITECTURE.md) | Executive layer model (harmonized) |
| [EI_REAL_ALIGNMENT_REPORT.md](./EI_REAL_ALIGNMENT_REPORT.md) | REAL alignment (EIR-004) |
| [EI_REPOSITORY_OWNER_ALIGNMENT_REPORT.md](./EI_REPOSITORY_OWNER_ALIGNMENT_REPORT.md) | Owner alignment (EIR-003) |

---

*EIR-005 Architecture Alignment Report · 2026-06-21*
