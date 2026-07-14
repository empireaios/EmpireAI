# G2 Programme Roadmap Status

**Document type:** Repository archaeology — programme status report  
**Generated:** 2026-07-02  
**Authority:** Grand King · Repository continuity spine  
**Scope:** Read-only synthesis from authoritative architecture, roadmap, and mission documents  
**Policy:** No code or documentation modified

---

## Executive finding

The EmpireAI repository **does not define a standalone G2-xx mission programme** analogous to **G3** (Executive AI Engines), **G4** (Grand King Cockpit), or **G5** (Business Automation).

Repository-wide search found **zero** documents matching `G2-01`, `G2-02`, `G2 programme`, `Mission G2`, or `G2 roadmap` in mission/architecture artifacts.

The letter **G2** appears in the repository only under **different nomenclatures** (see §2). The sections below report each authoritative usage and the closest programmatic equivalents.

---

## 1. Authoritative sources searched

| Source | Path | G2 content |
|--------|------|------------|
| Grand King Operational Master Plan | `GO-002_GRAND_KING_OPERATIONAL_MASTER_PLAN.md` | G1–G3 bundled gate — **G2 not listed individually** |
| EmpireAI Roadmap | `EMPIREAI_ROADMAP.md` | Five-layer roadmap — **Layer 2**, not G2-xx |
| Pillow Roadmap | `PILLOW_ROADMAP.md` | **PEI-###** Layer 2 missions — not G2-xx |
| Executive Cognitive Pipelines | `docs/governance/EXECUTIVE_COGNITIVE_PIPELINES.md` | PEI pipeline organisation (ADR-046) |
| Pillow Executive Intelligence Constitution | `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` | Layer 2 defining constitution |
| OKQA design | `docs/governance/ORGANIZATIONAL_KNOWLEDGE_QUALITY_ASSESSMENT.md` | **G2** = governance guarantee (not a programme) |
| Master Build Bible | `artifacts/empireai-master-build-bible.md` | G3/G4/G5 programmes; Pillow Layer 2 🔵 |
| Repository Master Index | `EMPIREAI_REPOSITORY_MASTER_INDEX.md` | No G2 programme row |
| Artifacts / `.cursor/missions/` | `artifacts/*`, `.cursor/missions/*` | No G2-xx missions |
| Cockpit / G3 / G4 / G5 architecture | `artifacts/g3-*`, `artifacts/g4-*`, `artifacts/g5-*` | G-series missions begin at **G3** |

---

## 2. G2 nomenclature in the repository (three distinct meanings)

### 2.1 GO-002 architecture gate G1–G3 (bundled — not decomposed)

**Authoritative document:** `GO-002_GRAND_KING_OPERATIONAL_MASTER_PLAN.md` §49–58

| Gate | Scope | Status | Evidence |
|------|-------|--------|----------|
| **G1–G3** *(single row — G2 not separate)* | Architecture foundations · REAL-001–100 module tree · Brain orchestration · Pillow Layer 1 | ✅ **Complete** | `EMPIREAI_STATUS.md` · EIR-v1.0 |
| G4 | Cockpit URL consolidation | ✅ Complete | REAL-124–127 |
| G5 | Production hardening hooks | ✅ Complete | REAL-128–133 |
| G6 | Action wiring + revenue smoke | ✅ Complete | REAL-134–135 |
| G7 | King's Operation preparation | ✅ Certified pre-live | `docs/governance/G7_KINGS_OPERATION_PREPARATION_REPORT.md` |
| G8 | King's Operation simulation | ✅ Certified simulation | `docs/governance/G8_KINGS_OPERATION_REPORT.md` · REAL-135 2/2 |

**Note:** GO-002 **G5** (production hardening hooks) is **not** the same namespace as **G5 Business Automation** (`artifacts/g5-business-automation-architecture.md`).

**Inferred decomposition (not authoritative — scope text only):**

| Inferred tier | Scope fragment from G1–G3 row | Repository evidence |
|---------------|------------------------------|---------------------|
| G1 | Architecture foundations · REAL-001–100 module tree | REAL programme · `JOURNEY.md` |
| **G2** | **Brain orchestration** | `backend/src/brain/` · Brain module registry |
| G3 | Pillow Layer 1 | PILLOW-016→019 ✅ · `PILLOW_ROADMAP.md` |

This decomposition is **archaeological inference only**. No document assigns individual completion criteria to G2 separate from G1–G3.

---

### 2.2 OKQA governance guarantee G2 (not a programme)

**Authoritative document:** `docs/governance/ORGANIZATIONAL_KNOWLEDGE_QUALITY_ASSESSMENT.md` §2

| ID | Guarantee | Implementation |
|----|-----------|----------------|
| **G2** | **Grand King sole authority** | Only Grand King approves permanent organizational knowledge (GVD-019 · Approval Gate · §3 chain) |

**Planned mission:** PEI-027 (subordinate to Executive Reflection · PEI-026)  
**Status:** 🔵 Design only — post-V1 Layer 2

---

### 2.3 EmpireAI Roadmap Layer 2 (PEI programme — not labeled G2)

**Authoritative documents:**

- `EMPIREAI_ROADMAP.md` — Layer 2 = Pillow Executive Intelligence 🔵 Future  
- `PILLOW_ROADMAP.md` — § Layer 2 — Pillow Executive Intelligence (future)  
- `docs/governance/EXECUTIVE_COGNITIVE_PIPELINES.md` — ADR-046 pipeline taxonomy  

**Mission ID scheme:** **PEI-001…PEI-027** (planning IDs) — **not G2-01…G2-NN**

If stakeholders use **“G2”** informally to mean **Roadmap Layer 2**, the canonical programme is **PEI**, documented below (§3).

---

## 3. Canonical G2 mission sequence

### 3.1 Official G2-xx sequence

**Not defined in repository.**

The G-series numbered mission programmes documented in the repository are:

| Programme | First mission | Architecture doc | Status |
|-----------|---------------|------------------|--------|
| **G3** | G3-01 | Executive AI Engine suite | ✅ G3-01→G3-10 closed |
| **G4** | G4-01 | `artifacts/g4-01-grand-king-cockpit-architecture.md` | ✅ G4-02→G4-10 complete |
| **G5** | G5-00 | `artifacts/g5-business-automation-architecture.md` | G5-00 ✅ · G5-01→02 ✅ · G5-03+ open |

**G1-xx and G2-xx mission sequences do not exist** in authoritative architecture or roadmap documents.

---

### 3.2 Nearest canonical analogue — Pillow Executive Intelligence (Layer 2 / PEI)

When **G2** is interpreted as **EmpireAI Roadmap Layer 2**, the authoritative mission sequence is **PEI-###** from `PILLOW_ROADMAP.md` and `docs/governance/EXECUTIVE_COGNITIVE_PIPELINES.md`:

#### Pipeline A — Bootstrap & reconstruction

| Mission | Title | Priority | Status |
|---------|-------|----------|--------|
| PEI-001 | Repository self-reconstruction & executive-ready gate | High | 🔵 Proposed |
| PEI-020 | Full Operational Readiness Check (14 criteria) | Normal | 🔵 Proposed |
| PEI-017 | Empire Recovery Assessment | Normal | 🔵 Proposed |
| PEI-018 | REAL owner graph normalization | Low | 🔵 Proposed |

#### Pipeline B — Executive reasoning & conversation

| Mission | Title | Priority | Status |
|---------|-------|----------|--------|
| **PEI-014** | Conversation intelligence — silent analysis & natural dialogue | **Critical** | 🔵 Proposed |
| PEI-015 | Executive perspectives — council/debate integration | High | 🔵 Proposed |
| PEI-016 | Strategic synthesis dashboard | Future | 🔵 Proposed |
| PEI-005 | Mission Planner strategic synthesis | High | 🔵 Proposed |
| PEI-006 | Continuous Due Diligence | High | 🔵 Proposed |
| PEI-019 | Prompt Registry & canonical executive prompt versioning | Future | 🔵 Proposed |

#### Pipeline C — Executive reflection & learning

| Mission | Title | Priority | Status |
|---------|-------|----------|--------|
| **PEI-026** | **Executive Reflection** — bridge Reasoning → Learning | **Critical** | 🔵 Proposed |
| PEI-027 | Organizational Knowledge Quality Assessment (OKQA) | High | 🔵 Proposed |
| PEI-021 | Evidence-Based Learning Architecture | Critical | 🔵 Proposed |
| PEI-022 | Commercial outcomes Evidence Source adapter | High | 🔵 Proposed |
| PEI-023 | Runtime metrics Evidence Source adapter | Normal | 🔵 Proposed |
| PEI-024 | Executive Audits Evidence Source adapter | Normal | 🔵 Proposed |
| PEI-025 | Approved strategic reviews Evidence Source adapter | Normal | 🔵 Proposed |
| PEI-007 | Autonomous Improvement Engine | High | 🔵 Proposed |

#### Pipeline D — Context, memory, governance readers

| Mission | Title | Priority | Status |
|---------|-------|----------|--------|
| PEI-002 | Repository Intelligence depth | High | 🔵 Proposed |
| PEI-003 | Context Builder executive task profiles | Normal | 🔵 Proposed |
| PEI-004 | Repository Memory executive learning loops | High | 🔵 Proposed |
| PEI-008 | Executive Audit Reviewer depth | Normal | 🔵 Proposed |
| PEI-009 | Dedicated Journey Manager | Normal | 🔵 Proposed |
| PEI-010 | Dedicated Decision Manager | Normal | 🔵 Proposed |
| PEI-011 | Dedicated Status Manager | Normal | 🔵 Proposed |
| PEI-012 | Executive Audit Reader | Normal | 🔵 Proposed |
| PEI-013 | UX Enhancement Register Reader | Low | 🔵 Proposed |

#### Build bible additional Layer 2 references

| Mission | Title | Status |
|---------|-------|--------|
| PEI-028 | EIL Steward | 🔵 Planned (Build Bible) |

**V1 partial foundation (not PEI mission closure):** Bootstrap extension reasoning composition pipeline implemented in Pillow package — per `EXECUTIVE_COGNITIVE_PIPELINES.md` § Pipeline B.

---

## 4. Current completed G2 missions

### 4.1 G2-xx programme

**None.** No G2-xx missions are defined or completed.

### 4.2 GO-002 gate G1–G3 bundle (includes inferred G2 scope)

| Item | Status |
|------|--------|
| G1–G3 architecture gate (REAL-001–100 · Brain · Pillow L1) | ✅ **Complete** per GO-002 |
| G4–G8 subsequent gates | ✅ **Complete** per GO-002 |

### 4.3 Pillow Layer 2 (PEI) — if G2 = Layer 2

| Item | Status |
|------|--------|
| PEI-001…PEI-027 formal missions | 🔵 **None completed** — all proposed/planned |
| PILLOW-001…015 package foundations | ✅ Complete (runtime foundations — not PEI activation) |
| PILLOW-016…019 Layer 1 runtime | ✅ Complete |
| Bootstrap reasoning composition (partial) | ✅ Implemented (pre-PEI-014 depth) |

---

## 5. Current incomplete G2 missions

### 5.1 G2-xx programme

**Not applicable** — programme undefined.

### 5.2 GO-002 post-G8 operational phases (successor work — not G2)

GO-002 defines **Phase 1–10** after G1–G8 gates. All phases remain **open** for live commerce:

| Phase | Objective | Status |
|-------|-----------|--------|
| Phase 1 | Infrastructure (B5) | 🔴 Open |
| Phase 2 | Brain V1 path wiring | 🔴 Open |
| Phase 3 | Pillow Delivery 1–3 | 🔴 Open |
| Phase 4 | Cockpit live panels | 🔴 Open (G4 shell ✅; live wiring incomplete per GO-001) |
| Phase 5 | Commerce Amazon+CJ path | 🔴 Open |
| Phase 6 | Payments Stripe | 🔴 Open |
| Phase 7 | Advertising (optional) | 🔴 Open |
| Phase 8 | Grand King Sandbox E2E | 🔴 Open |
| Phase 9 | Grand King Live (B7) | 🔴 Open |
| Phase 10 | PROOF-001 (B8) | 🔴 Open |

### 5.3 Pillow Layer 2 (PEI) — if G2 = Layer 2

**All PEI missions incomplete:**

PEI-001 · PEI-002 · PEI-003 · PEI-004 · PEI-005 · PEI-006 · PEI-007 · PEI-008 · PEI-009 · PEI-010 · PEI-011 · PEI-012 · PEI-013 · PEI-014 · PEI-015 · PEI-016 · PEI-017 · PEI-018 · PEI-019 · PEI-020 · PEI-021 · PEI-022 · PEI-023 · PEI-024 · PEI-025 · PEI-026 · PEI-027 · PEI-028

---

## 6. Exact next G2 mission to execute

### 6.1 If G2 = G2-xx numbered programme

**None defined.** Repository contains no authorized next G2-xx mission.

**Recommended governance action:** Clarify whether **G2** refers to a programme not yet committed to the repository, or map to an existing namespace (PEI Layer 2 · GO-002 Phase 2 Brain · OKQA PEI-027).

### 6.2 If G2 = GO-002 architecture gate (middle tier of G1–G3)

**No separate next mission.** G1–G3 gate row is ✅ complete.

**Successor work per GO-002:** **Phase 1 — Infrastructure** (B5 production readiness) — not labeled G2.

### 6.3 If G2 = EmpireAI Roadmap Layer 2 (PEI programme)

**Exact next missions (critical path — planning authority):**

| Priority | Mission | Rationale | Authority |
|----------|---------|-----------|-----------|
| **1 (Critical)** | **PEI-014** | Primary Layer 2 conversational expression — Core Principle §2 | `EXECUTIVE_COGNITIVE_PIPELINES.md` Pipeline B |
| **2 (Critical)** | **PEI-026** | First downstream Layer 2 capability — Executive Reflection bridge | `PILLOW_ROADMAP.md` · Constitution §2.2 |
| **3 (Critical)** | **PEI-021** | Evidence-Based Learning Architecture — long-term Layer 2 direction | Constitution §3.1 |

**Execution blockers (authoritative):**

| Blocker | Source |
|---------|--------|
| **Post-V1 Certification Mode** — Pillow Layer 2 PEI shall not start in V1 | `SA-001_ARCHITECTS_FINAL_RECOMMENDATIONS.md` § What should never be built (V1) |
| **Grand King approval** of first PEI mission from Enhancement Register | `PILLOW_ROADMAP.md` § Layer 2 entry criteria #2 |
| **Journey + Journey Audit synchronized** per BL-A / ROUTE 02 | `PILLOW_ROADMAP.md` § Layer 2 entry criteria #3 |
| Layer 1 prerequisite | ✅ Met 2026-06-29 |

**Until post-V1 + GK approval:** **No PEI mission is authorized to execute**, regardless of criticality ranking.

---

## 7. Dependencies

### 7.1 G2-xx programme

**Not defined.**

### 7.2 GO-002 G1–G3 gate (complete)

| Dependency | Status |
|------------|--------|
| REAL-001–100 module tree | ✅ |
| Brain orchestration | ✅ |
| Pillow Layer 1 (PILLOW-016→019) | ✅ |
| EIR-v1.0 Executive Intelligence library | ✅ |

### 7.3 PEI Layer 2 (if G2 = Layer 2)

| Dependency | Status | Source |
|------------|--------|--------|
| Pillow Runtime Layer 1 | ✅ Complete | `PILLOW_ROADMAP.md` |
| PILLOW-001…019 package/runtime | ✅ Complete | `PILLOW_ROADMAP.md` |
| Bootstrap extension (reasoning composition) | ✅ Partial | `EXECUTIVE_COGNITIVE_PIPELINES.md` |
| G3 Executive AI Engine suite | ✅ Complete | Prerequisite for executive context |
| G4 Cockpit programme | ✅ Complete | Presentation surface for Layer 2 outputs |
| Grand King PEI mission approval | 🔴 Pending | `PILLOW_ENHANCEMENT_REGISTER.md` |
| Post-V1 Certification Mode clearance | 🔴 Pending | `SA-001` |
| PEI-026 → PEI-027 | PEI-027 depends on PEI-026 | OKQA design |
| PEI-021 → PEI-022…025 | Adapters depend on Evidence Architecture | `EXECUTIVE_COGNITIVE_PIPELINES.md` Pipeline C |

### 7.4 GO-002 operational successor (Phase 1 — if G2 confused with Phase 2 Brain)

| Phase | Depends on |
|-------|------------|
| Phase 1 Infrastructure | G1–G8 ✅ · GK hosting accounts |
| Phase 2 Brain | Phase 1 production backend · B5 passed |
| Phase 3 Pillow | Phase 1 · Pillow Delivery Mode ADR-049 |
| Phase 4 Cockpit | Phase 1 · G4 shell ✅ |

---

## 8. Completion criteria

### 8.1 G2-xx programme

**Not defined in repository.**

### 8.2 GO-002 G1–G3 gate bundle (includes inferred G2: Brain orchestration)

From `GO-002_GRAND_KING_OPERATIONAL_MASTER_PLAN.md` §49–53:

| Criterion | Status |
|-----------|--------|
| Architecture foundations complete | ✅ |
| REAL-001–100 module tree wired | ✅ |
| Brain orchestration operational | ✅ |
| Pillow Layer 1 live | ✅ |
| Evidence: `EMPIREAI_STATUS.md` · EIR-v1.0 | ✅ |

**Gate row status:** ✅ **Complete — do not rebuild** (GO-002 §49)

### 8.3 PEI Layer 2 mission completion (representative — per mission)

General completion pattern from `PILLOW_ROADMAP.md` · `EMPIREAI_BL_C_CONTINUOUS_IMPROVEMENT_CONSTITUTION.md`:

| Criterion | Requirement |
|-----------|-------------|
| Grand King mission approval | Required before implementation |
| Executive audit artifact | `artifacts/` or `COMBINED_EXECUTIVE_AUDIT_*` per standard |
| Constitution alignment | `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` Core Principle |
| No auto-application of organizational knowledge | GK approval gate only (OKQA G2 guarantee) |
| Journey + Status synchronization | BL-A continuity |
| Validation tests | Backend validation suite pass where applicable |

**PEI-014 completion criteria (indicative — from pipeline authority):**

- Conversation intelligence depth active in Pillow chat host  
- Mode-aware strategic dialogue without breaking Layer 1 runtime  
- Executive audit produced  
- Grand King review of Layer 2 expression quality  

**PEI-026 completion criteria (indicative):**

- Post-reasoning evaluation detects lasting decisions  
- Candidate organizational knowledge generated (not auto-applied)  
- Continuous Artifact Generation Workflow integration  
- Bridge Reasoning → Learning operational  

**PEI-020 completion criteria (Bootstrap certification):**

- Full 14-criteria Operational Readiness Check pass  
- Reference: PILLOW-ENH-012 · BL-B Item 013  

### 8.4 OKQA G2 guarantee (governance — not programme completion)

| Criterion | Enforcement |
|-----------|-------------|
| Only Grand King approves permanent organizational knowledge | GVD-019 · Approval Gate · §3 chain |
| OKQA remains advisory — never disposition | OKQA §2 G1 guarantee |

---

## 9. G-series programme map (repository canonical)

For navigation clarity — **G2 is absent from the G-series mission ladder:**

```
G1-xx  — NOT DEFINED
G2-xx  — NOT DEFINED
G3-xx  — Executive AI Engines (G3-01→G3-10) ✅ CLOSED
G4-xx  — Grand King Cockpit (G4-01→G4-10) ✅ COMPLETE
G5-xx  — Business Automation (G5-00→G5-10 roadmap) 🟡 IN PROGRESS (G5-01·G5-02 ✅)
```

**Separate namespace — GO-002 architecture gates:**

```
G1–G3  — Foundation bundle ✅
G4     — Cockpit URL consolidation ✅  (≠ G4 Cockpit programme)
G5     — Production hardening hooks ✅ (≠ G5 Business Automation programme)
G6–G8  — Wiring · King's Operation ✅
```

---

## 10. Summary table (requested fields)

| Field | Repository answer |
|-------|-------------------|
| **G2 mission sequence** | **Not defined.** Nearest analogue: **PEI-001…PEI-028** (Layer 2) or **GO-002 G1–G3** bundle (G2 not decomposed). |
| **Completed G2 missions** | **None** (G2-xx). G1–G3 gate ✅ if using GO-002 gates. PEI: **none formally complete**. |
| **Incomplete G2 missions** | **All PEI-001…028** if Layer 2; **GO-002 Phases 1–10** for post-gate operations; **G2-xx N/A**. |
| **Exact next G2 mission** | **G2-xx: undefined.** Layer 2: **PEI-014** then **PEI-026** (critical) — **blocked until post-V1 + GK approval**. GO-002 successor: **Phase 1 Infrastructure**. |
| **Dependencies** | Layer 2: Pillow L1 ✅ · G3 ✅ · G4 ✅ · GK approval 🔴 · post-V1 🔴. Gates: REAL · Brain · EIR-v1.0 ✅. |
| **Completion criteria** | G1–G3 gate: GO-002 §49 (✅). PEI: per-mission audits + GK approval + constitution alignment. G2-xx: **undefined**. |

---

## 11. Recommended canonical references

| Need | Document |
|------|----------|
| G3/G4/G5 mission programmes | `artifacts/empireai-master-build-bible.md` |
| Architecture gates G1–G8 | `GO-002_GRAND_KING_OPERATIONAL_MASTER_PLAN.md` |
| Layer 2 PEI roadmap | `PILLOW_ROADMAP.md` |
| PEI pipeline sequencing | `docs/governance/EXECUTIVE_COGNITIVE_PIPELINES.md` |
| Layer 2 constitution | `EMPIREAI_PILLOW_EXECUTIVE_INTELLIGENCE_CONSTITUTION.md` |
| V1 vs post-V1 scope | `SA-001_ARCHITECTS_FINAL_RECOMMENDATIONS.md` |
| Operational blockers | `GO-001_OPERATIONAL_READINESS_REPORT.md` · B5–B8 |

---

*G2 Programme Roadmap Status · Repository archaeology · 2026-07-02 · Read-only · Grand King Authority*
