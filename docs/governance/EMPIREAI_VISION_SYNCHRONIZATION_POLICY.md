# EMPIREAI VISION SYNCHRONIZATION POLICY

> **Classification:** CANONICAL — Tier 3 Law (Governance)  
> **Parent:** [`EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md`](./EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md)  
> **Mandatory:** Every Cursor mission **begins** with this chain

---

## 1. Permanent Mission-Start Chain

```
Vision Synchronization
        ↓
Vision
        ↓
Soul
        ↓
Roadmap
        ↓
Hierarchy
        ↓
Mission Context
        ↓
Mission Generation
```

**No implementation work** begins until this chain completes for the mission.

---

## 2. Step Definitions

### Step 1 — Vision Synchronization

**Action:** Confirm alignment with current Vision state.

| If | Then |
|----|------|
| `EMPIREAI_VISION.md` exists | Read canonical Vision File (P1-01 · CON-001 complete) |
| Vision unavailable | Read [`EMPIREAI_VISION_HIERARCHY.md`](./EMPIREAI_VISION_HIERARCHY.md) §5 fallback chain |

**Output:** One-paragraph mission alignment statement citing Vision sources.

### Step 2 — Vision

**Action:** Extract mission-relevant *why* from Vision tier.

**Sources (priority order):**
1. `EMPIREAI_VISION.md` (when exists)  
2. CTD-001, CTD-002, CTD-005  
3. `EMPIREAI_SOUL.md` mission section  
4. Active constitutional phase objective (if constitutional task)

### Step 3 — Soul

**Action:** Read `EMPIREAI_SOUL.md` (P1-04) — confirm mission respects identity, promises, Grand King doctrine, commercial soul, cost governance, and §4.8 never-forget anchors.

**Minimum read:** §4 (who) · §4.6 (promises) · §4.8 (never forget) · §6–§8 if commercial/production scope.

**Check:** Mission must not violate Soul + CTD identity constraints. Soul is WHO/memory — not WHY (Vision) or law (CTD).

**Output:** One-line identity alignment statement.

### Step 4 — Roadmap

**Action:** Identify governing roadmap slot.

| Mission type | Roadmap authority |
|--------------|-------------------|
| Constitutional task (CON-###) | [`EMPIREAI_CONSTITUTION_LOCK.md`](./EMPIREAI_CONSTITUTION_LOCK.md) — phase + dependencies |
| Cockpit / REAL | Cockpit Implementation Roadmap + Constitutional alignment check |
| Pillow | PILLOW_ROADMAP.md + Constitutional alignment check |
| Commercial ops | GO-002 · SA-001 · EMPIREAI_ROADMAP.md |
| Unscoped | Constitutional Framework + Grand King directive |

**Output:** Phase ID or roadmap section cited.

### Step 5 — Hierarchy

**Action:** Load constitutional and architecture context.

**Required reads (minimum):**
1. [`EMPIREAI_HIERARCHY.md`](./EMPIREAI_HIERARCHY.md) — confirm mission tier placement (P1-06)  
2. [`EMPIREAI_OWNERSHIP_MODEL.md`](./EMPIREAI_OWNERSHIP_MODEL.md) — confirm mission CO and approver (P1-05)  
3. [`EMPIREAI_CONSTITUTION_HIERARCHY.md`](./EMPIREAI_CONSTITUTION_HIERARCHY.md) — applicable law  
4. [`EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md`](./EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md) — execution principles  
5. Relevant architecture: `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md` or operational `docs/ARCHITECTURE.md`  
6. Documentation classification if mission touches docs: ECDS-1 + [`EMPIREAI_NAMING_STANDARD.md`](./EMPIREAI_NAMING_STANDARD.md) + [`EMPIREAI_GLOSSARY.md`](./EMPIREAI_GLOSSARY.md) (P1-07 · P1-08)

### Step 6 — Mission Context

**Action:** Assemble bounded context package.

| Field | Required |
|-------|----------|
| Mission ID | REAL-### / CON-### / PILLOW-### / named mission |
| WHY | From Vision sync |
| WHAT | Scope boundary — explicit in/out |
| HOW | Architecture + engineering approach |
| PROOF | Tests, audits, GK acceptance criteria |
| Dependencies | Prior tasks, blockers |
| Constitutional phase | If applicable — P1–P9 |

### Step 7 — Mission Generation

**Action:** Produce mission brief per [`EMPIREAI_MISSION_GENERATION_POLICY.md`](./EMPIREAI_MISSION_GENERATION_POLICY.md).

**Authority:** Chief Architect drafts · Pillow supervises Builder scope · Grand King approves execution.

---

## 3. Reasoning Chain Binding

Every synchronized mission **must** map:

| Chain | Mission brief section |
|-------|----------------------|
| **WHY** | Vision + Soul alignment |
| **WHAT** | Roadmap slot + scope |
| **HOW** | Hierarchy (constitution + architecture) |
| **PROOF** | Acceptance criteria + evidence type |

---

## 4. Prohibited Shortcuts

| Prohibited | Reason |
|------------|--------|
| Skip Vision sync "because small change" | Constitutional requirement |
| Start from code without Soul read | Identity drift |
| Cite evidence audits as law | ECDS-1 violation |
| Execute CON-### out of P-order | Constitution Lock dependencies |
| Implement without Grand King approval on irreversibles | GVD |

---

## 5. Pillow / Builder Integration

Before Cursor executes, Pillow (supervisor) confirms synchronization completed.

**Runtime system (P4-02):** [`EMPIREAI_VISION_SYNCHRONIZATION_SYSTEM.md`](./EMPIREAI_VISION_SYNCHRONIZATION_SYSTEM.md) · `pillow/src/vision-synchronization/` (PILLOW-VS-001)

Supervisor governance: [`EMPIREAI_SUPERVISOR_GOVERNANCE.md`](./EMPIREAI_SUPERVISOR_GOVERNANCE.md)

---

## Related

- [`EMPIREAI_VISION_HIERARCHY.md`](./EMPIREAI_VISION_HIERARCHY.md)  
- [`EMPIREAI_VISION_ACCUMULATION.md`](./EMPIREAI_VISION_ACCUMULATION.md) (P1-03)  
- [`EMPIREAI_HIERARCHY.md`](./EMPIREAI_HIERARCHY.md) (P1-06)  
- [`EMPIREAI_OWNERSHIP_MODEL.md`](./EMPIREAI_OWNERSHIP_MODEL.md) (P1-05)  
- [`EMPIREAI_VISION_ACCUMULATION_POLICY.md`](./EMPIREAI_VISION_ACCUMULATION_POLICY.md)  
- [`EMPIREAI_MISSION_GENERATION_POLICY.md`](./EMPIREAI_MISSION_GENERATION_POLICY.md)
