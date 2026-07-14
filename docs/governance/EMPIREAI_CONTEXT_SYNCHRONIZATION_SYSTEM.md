# EMPIREAI CONTEXT SYNCHRONIZATION SYSTEM

> **Classification:** CANONICAL — Tier 3 Law (Governance · Runtime System)  
> **Document ID:** P4-03  
> **Constitutional phase:** P4 — Engineering Foundation  
> **Dependencies:** P4-02 complete  
> **Owner:** Pillow COI · Chief Architect  
> **Authority:** Permanent runtime capability — operational context before implementation  
> **Vision companion:** [`EMPIREAI_VISION_SYNCHRONIZATION_SYSTEM.md`](./EMPIREAI_VISION_SYNCHRONIZATION_SYSTEM.md) (P4-02 — WHY)  
> **Runtime:** `pillow/src/context-synchronization/` · **PILLOW-CS-001**

---

## 1. Purpose

P4-02 established **Vision Synchronization** (WHY). P4-03 establishes **Context Synchronization** (CURRENT STATE).

Before any engineering work begins, Builder must understand the complete operational context of EmpireAI. This is mandatory for every Builder mission, Cursor mission, and Pillow-generated mission.

| Vision (P4-02) | Context (P4-03) |
|----------------|-----------------|
| WHY · identity · constitutional alignment | WHAT IS TRUE NOW · repository · production · journey |
| Mission-start chain | Operational awareness package |
| PILLOW-VS-001 | PILLOW-CS-001 |

**Principle:** Vision defines WHY · **Context defines CURRENT STATE** · Builder implements only after both complete.

---

## 2. Context Synchronization Pipeline

```
Vision
        ↓
Vision Accumulation
        ↓
Soul
        ↓
Constitution
        ↓
Roadmap
        ↓
Current Roadmap Item
        ↓
Hierarchy
        ↓
Canonical Architecture
        ↓
Canonical Documentation
        ↓
Repository Structure
        ↓
Production Truth
        ↓
Current Production State
        ↓
Journey
        ↓
Previous Lessons Learned
        ↓
Mission History
        ↓
Current Mission Context
```

**Prerequisite:** P4-02 Vision Synchronization runs as the constitutional foundation; P4-03 extends with journey, documentation, repository structure, and mission history.

**Runtime:** `ContextSynchronizationEngine` · `executeContextSyncPipelineSync`

---

## 3. Ownership

| Role | Responsibility |
|------|----------------|
| **Pillow (PILLOW-CS-001)** | Owns Context Synchronization · validates completeness · alignment |
| **Builder** | Refuses implementation until context load succeeds (unless Grand King override) |
| **Supervisor** | Validates context health at mission launch |
| **Cockpit** | Context Synchronization panel — completeness · roadmap · timestamps |

Pillow continuously validates: context completeness · repository alignment · architecture alignment · production alignment · mission alignment · roadmap alignment.

---

## 4. Context Package

Every generated mission includes:

| Field | Source |
|-------|--------|
| Current Roadmap Item | Doctrine register · planner |
| Current Phase | Bootstrap · Journey |
| Mission Purpose | Mission brief · planner |
| Relevant Vision · Soul | P4-02 pipeline |
| Constitutional Articles | Hierarchy · CTD · Engineering Constitution |
| Relevant Architecture | Canonical Architecture · Architecture Law |
| Repository Areas | Structure · master index |
| Production Components | Production Truth |
| Lessons · Risks · Dependencies | Memory · accumulation |
| Acceptance Criteria · Duration | Mission standards |

**Runtime type:** `ContextPackage` · **P4-03**

---

## 5. Builder Gate

Builder **shall refuse** to generate implementation until Context Synchronization completes successfully.

Builder verifies: Current Vision · Soul · Constitution · Roadmap Position · Architecture · Documentation · Repository · Production · Lessons · Dependencies.

**Gate:** `evaluateContextBuilderGate` · minimum **75% context completeness**

---

## 6. Integration Map

| Surface | Path |
|---------|------|
| Pillow engine | `pillow/src/context-synchronization/engine.ts` |
| Builder gate | `pillow/src/cursor-bridge/engine.ts` (after P4-02 vision gate) |
| Mission preamble | `prependContextSynchronization` |
| Mission Planner | `setContextSynchronization` |
| Cockpit | Development → Pillow → Context Sync tab |
| API | `GET /api/pillow/context-sync` |

---

## 7. Governance cross-references

- [`EMPIREAI_VISION_SYNCHRONIZATION_SYSTEM.md`](./EMPIREAI_VISION_SYNCHRONIZATION_SYSTEM.md) (P4-02)  
- [`EMPIREAI_ENGINEERING_STANDARDS.md`](./EMPIREAI_ENGINEERING_STANDARDS.md) (P4-01)  
- [`EMPIREAI_BUILDER_ARCHITECTURE.md`](../architecture/EMPIREAI_BUILDER_ARCHITECTURE.md)  
- [`EMPIREAI_PILLOW_ARCHITECTURE.md`](../architecture/EMPIREAI_PILLOW_ARCHITECTURE.md)  
- [`EMPIREAI_SUPERVISOR_GOVERNANCE.md`](./EMPIREAI_SUPERVISOR_GOVERNANCE.md)  

---

## 8. Validation

| Check | Expected |
|-------|----------|
| Every Builder mission loads full context | Vision + Soul + Roadmap + Architecture + Repository + Production + Journey |
| No mission bypasses Context Sync | Builder gate + preamble on all mission paths |
| Pillow owns context sync | PILLOW-CS-001 in Pillow session |
| Cockpit visualizes | Context Sync panel live |

**Ratified:** 2026-07-05 (P4-03)

**Successor:** [`EMPIREAI_CURSOR_PROTOCOL.md`](./EMPIREAI_CURSOR_PROTOCOL.md) (P4-04 — constitutional execution format)
