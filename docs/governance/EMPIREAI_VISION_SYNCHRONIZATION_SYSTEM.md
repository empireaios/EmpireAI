# EMPIREAI VISION SYNCHRONIZATION SYSTEM

> **Classification:** CANONICAL — Tier 3 Law (Governance · Runtime System)  
> **Document ID:** P4-02  
> **Constitutional phase:** P4 — Engineering Foundation  
> **Dependencies:** P1 complete · P2 complete · P3 complete · P4-01 complete  
> **Owner:** Pillow COI · Chief Architect  
> **Authority:** Permanent runtime capability — **not documentation only**  
> **Policy companion:** [`EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md`](./EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md) (mission-start chain — do not duplicate constitutional truth here)  
> **Runtime:** `pillow/src/vision-synchronization/` · **PILLOW-VS-001**

---

## 1. Purpose

P4-02 implements the **canonical Vision Synchronization System** — a mandatory engineering capability. From this mission onward, every Builder mission, Cursor mission, Pillow recommendation, and engineering execution **shall begin** by synchronizing against the constitutional state of EmpireAI.

| This system IS | This system IS NOT |
|----------------|-------------------|
| Permanent runtime pipeline (Pillow-owned) | The Tier 3 policy document alone |
| Builder refusal gate when sync fails | Optional pre-flight checklist |
| Supervisor validation + Cockpit visualization | Duplicate Vision / Soul / CTD content |
| Mission Context Package generator | Replacement for Constitution Hierarchy |

**Principle:** Pillow governs synchronization · Builder implements only after sync · Supervisor validates · Cockpit visualizes · Grand King may override irreversibles.

---

## 2. Synchronization Pipeline (mandatory sequence)

No mission may bypass this sequence:

```
Vision
        ↓
Vision Accumulation
        ↓
Soul
        ↓
CTD
        ↓
Constitution Hierarchy
        ↓
Roadmap
        ↓
Current Roadmap Item
        ↓
Architecture
        ↓
Repository
        ↓
Production Truth
        ↓
Current Production State
        ↓
Previous Lessons Learned
        ↓
Mission Context
        ↓
Mission Generation
```

**Runtime implementation:** `VisionSynchronizationEngine` · `executeVisionSyncPipeline` / `executeVisionSyncPipelineSync`  
**Reasoning chain binding:** Vision Sync → **WHY** → **WHAT** → **HOW** → **PROOF** → Mission Generation

---

## 3. Ownership

| Role | Responsibility |
|------|----------------|
| **Pillow (PILLOW-VS-001)** | Owns Vision Synchronization permanently · runs pipeline · detects drift · generates Mission Context Package |
| **Builder (Cursor Bridge)** | Refuses implementation when sync fails unless Grand King override |
| **Supervisor (PILLOW-007)** | Validates synchronization health at mission launch |
| **Cockpit** | Vision Synchronization panel — status · drift · timestamp |
| **Grand King** | Explicit override on blocked missions |

---

## 4. Drift Detection

Pillow continuously verifies and classifies drift:

| Domain | Examples |
|--------|----------|
| Vision · Soul · Constitution · Architecture · Repository · Production · Mission · Roadmap | Missing artifacts · memory inconsistency · active blockers |

| Severity | Builder behaviour |
|----------|-------------------|
| **Critical** | Refuse — Grand King override required |
| **High** | Refuse — Grand King override required |
| **Medium** | Warn · may proceed if pipeline success |
| **Low** | Informational |

---

## 5. Mission Context Package

Every Builder mission generates one package containing:

- Vision Summary · Current WHY · Current Roadmap Item  
- Relevant Constitutional Articles · Architecture · Repository Areas · Production Components  
- Known Risks · Dependencies · Previous Lessons  
- Acceptance Criteria · Estimated Completion Time  
- WHY · WHAT · HOW · PROOF

**Runtime type:** `MissionContextPackage` · **P4-02**

---

## 6. Integration Map

| Surface | Path / contract |
|---------|-----------------|
| Pillow engine | `pillow/src/vision-synchronization/engine.ts` |
| Builder gate | `pillow/src/cursor-bridge/engine.ts` · `builder-gate.ts` |
| Mission preamble | `pillow/src/vision-synchronization/mission-preamble.ts` |
| Supervisor | `pillow/src/supervisor/engine.ts` · `launchMission()` validation |
| Mission Planner | `pillow/src/planner/engine.ts` · Cursor mission preamble |
| Cockpit panel | Development → Pillow → Vision Sync tab |
| API | `GET /api/pillow/vision-sync` |

---

## 7. Governance cross-references

- [`EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md`](./EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md) — Tier 3 mission-start policy  
- [`EMPIREAI_ENGINEERING_STANDARDS.md`](./EMPIREAI_ENGINEERING_STANDARDS.md) — P4-01 · ES-5 no silent drift  
- [`EMPIREAI_BUILDER_ARCHITECTURE.md`](../architecture/EMPIREAI_BUILDER_ARCHITECTURE.md) — §6 lifecycle · Synchronizing state  
- [`EMPIREAI_PILLOW_ARCHITECTURE.md`](../architecture/EMPIREAI_PILLOW_ARCHITECTURE.md) — Pillow owns synchronization  
- [`EMPIREAI_SUPERVISOR_GOVERNANCE.md`](./EMPIREAI_SUPERVISOR_GOVERNANCE.md) — Supervisor validates alignment  

---

## 8. Validation

| Check | Expected |
|-------|----------|
| Every future mission begins with Vision Synchronization | Cursor missions prepend preamble automatically |
| Builder cannot bypass synchronization | `evaluateBuilderGateSync` refuses on failure |
| Pillow owns synchronization | `VisionSynchronizationEngine` in Pillow session |
| Supervisor validates | `launchMission` checks `validateForSupervisorSync` |
| Cockpit visualizes | Vision Sync panel live |

**Ratified:** 2026-07-05 (P4-02)  
**Successor:** [`EMPIREAI_CONTEXT_SYNCHRONIZATION_SYSTEM.md`](./EMPIREAI_CONTEXT_SYNCHRONIZATION_SYSTEM.md) (P4-03 — operational context)
