# EMPIREAI ROADMAP GOVERNANCE

> **Classification:** CANONICAL — Tier 3 Law (Governance)  
> **Parent:** [`EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md`](./EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md)

---

## 1. Purpose

Govern **all roadmaps** in EmpireAI — constitutional, domain, and operational — under one rule set.

---

## 2. Roadmap Authority Stack

See [`EMPIREAI_ROADMAP_HIERARCHY.md`](./EMPIREAI_ROADMAP_HIERARCHY.md).

**Supreme programme sequence:** Constitutional Execution Roadmap (P1–P9) in [`EMPIREAI_CONSTITUTION_LOCK.md`](./EMPIREAI_CONSTITUTION_LOCK.md).

---

## 3. Append-Only Policy (Permanent)

### Allowed

| Action | Example |
|--------|---------|
| Append new constitutional item | CON-020+ |
| Append ADR | ADR-CON-006 in EMPIREAI_DECISIONS.md |
| Append domain roadmap phase | REAL-### continuation |
| Mark task complete | Journey checkbox — no task text edit |
| Append evidence | New audit file |

### Forbidden

| Action | Reason |
|--------|--------|
| Rename P1–P9 phases | Constitution Lock Rule 1 |
| Reorder P1–P9 | Constitution Lock Rule 2 |
| Renumber CON-001–019 | Constitution Lock Rule 3 |
| Change locked dependencies | Constitution Lock Rule 4 |
| Insert tasks into locked phases | Constitution Lock Rule 5 |

**Restructuring:** Requires **CONSTITUTIONAL REVIEW** + Grand King approval.

---

## 4. Roadmap Amendment Process

### Domain roadmaps (REAL, Pillow, Cockpit)

1. Draft amendment with WHY/WHAT/HOW/PROOF  
2. Verify no conflict with Constitutional Execution P-phases  
3. Chief Architect review  
4. Grand King approval for programme-level changes  
5. Update roadmap doc + Journey entry  

### Constitutional execution (CON-###)

- **Locked tasks:** completion status only  
- **New items:** CON-020+ append register  
- **Phase changes:** CONSTITUTIONAL REVIEW only  

---

## 5. Roadmap ↔ Vision Governance

| Requirement | Policy |
|-------------|--------|
| P1 authors Vision | CON-001 |
| Domain roadmaps align post-Vision | Vision Hierarchy §4 |
| Mission start syncs Vision first | Vision Synchronization Policy |
| Lessons feed future Vision | Vision Accumulation Policy |

---

## 6. Roadmap ↔ Architecture Governance

Domain roadmaps **must not** require architecture violating:

- `docs/architecture/EMPIREAI_CANONICAL_ARCHITECTURE.md`  
- `EMPIREAI_ARCHITECTURE_CONSTRAINTS_ACD.md`  
- Pillow Architecture Contract  

Architecture changes → ADR before roadmap commitment.

---

## 7. Discovery Handling

When a new gap is discovered during engineering:

```
Discovery
    ↓
Classify (constitutional · architecture · operational)
    ↓
If constitutional → append CON-020+ (do NOT modify P1–P9)
If architecture → ADR
If operational → Journey + STATUS
    ↓
Grand King informed if scope impact
```

**Principle:** Future discoveries become **new roadmap items** — they do **not** modify existing phases.

---

## 8. Completion Tracking

| Register | Tracks |
|----------|--------|
| `EMPIREAI_CONSTITUTION_LOCK.md` | CON-001–019 definitions (immutable text) |
| `JOURNEY.md` | Structural completions |
| `EMPIREAI_STATUS.md` | Runtime state vs roadmap |
| `EMPIREAI_DECISIONS.md` | ADR decisions affecting roadmaps |

---

## Related

- [`EMPIREAI_CONSTITUTIONAL_EXECUTION_GOVERNANCE.md`](./EMPIREAI_CONSTITUTIONAL_EXECUTION_GOVERNANCE.md)  
- [`EMPIREAI_CONSTITUTION_LOCK.md`](./EMPIREAI_CONSTITUTION_LOCK.md)
