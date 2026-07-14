# EMPIREAI MISSION GENERATION POLICY

> **Classification:** CANONICAL — Tier 3 Law (Governance)  
> **Parent:** [`EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md`](./EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md)  
> **Prerequisite:** [`EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md`](./EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md) completed

---

## 1. Purpose

Define **how missions are generated, approved, executed, and closed** under the Constitutional Framework.

This policy **does not execute** roadmap items — it governs mission lifecycle only.

---

## 2. Mission Types

| Type | ID pattern | Authority | Example |
|------|------------|-----------|---------|
| **Constitutional** | CON-### | Grand King + Architect | CON-001 Vision authoring |
| **Runtime / Cockpit** | REAL-### | Architect + Grand King directive | REAL-085 Executive Home |
| **Pillow** | PILLOW-### | Pillow COI + Grand King | PILLOW-016 integration |
| **Operational** | GO-### · named | Grand King | GO-002 master plan |
| **Audit / Evidence** | COMBINED_* · artifacts | Governance | Executive audits |

All types **must** complete Vision Synchronization before generation.

---

## 3. Mission Brief Requirements

Every authorized mission brief **must** include all four links per [`EMPIREAI_REASONING_MODEL.md`](./EMPIREAI_REASONING_MODEL.md) (P1-02).

**If WHY is unclear → reject brief · re-sync Vision · do not proceed.**

Every authorized mission brief **must** include:

```markdown
## Mission ID
[CON-### | REAL-### | PILLOW-### | name]

## Constitutional Alignment
- Vision sync: [sources cited]
- Soul check: [pass / constraint noted]
- Roadmap slot: [P# or domain roadmap section]
- Hierarchy: [constitutions + architecture cited]

## WHY
[Commercial + strategic reason — CTD/Soul/Vision]

## WHAT
[In scope / Out of scope — explicit boundaries]

## HOW
[Architecture approach · files/systems touched · no scope creep]

## PROOF
[Tests · audits · GK acceptance · evidence artifact path]

## Dependencies
[Prior CON/REAL tasks · blockers]

## Authority
- Draft: [Chief Architect | Pillow]
- Approve: [Grand King | delegated]
- Execute: Cursor (Builder)
- Supervise: Pillow
```

---

## 4. Generation Workflow

```
1. Vision Synchronization (mandatory)
2. Mission brief draft
3. Constitutional compliance check
   ├── CTD / doctrine compliance
   ├── Constitution Lock phase alignment (if CON or constitutional work)
   ├── Architecture boundary check (Canonical Architecture)
   └── Documentation classification (if doc mission)
4. Pillow supervisor review (scope · risks · recovery)
5. Grand King approval (or explicit mission directive = approval)
6. Cursor execution (Builder)
7. Proof + lessons learned
8. Vision accumulation
9. Journey / Status update
```

---

## 5. Constitutional Mission Rules

| Rule | Detail |
|------|--------|
| **P-order** | Constitutional tasks respect P1→P9 sequence |
| **CON-deps** | Task dependencies in Constitution Lock §3 are immutable |
| **No execution in framework missions** | Framework construction ≠ CON task execution |
| **Append-only** | New gaps → CON-020+ — never edit locked tasks |

Constitutional execution governance: [`EMPIREAI_CONSTITUTIONAL_EXECUTION_GOVERNANCE.md`](./EMPIREAI_CONSTITUTIONAL_EXECUTION_GOVERNANCE.md)

---

## 6. Engineering Mission Rules

| Rule | Source |
|------|--------|
| Brain single execution path | Engineering Constitution · Canonical Architecture |
| Guardian pre-dispatch | Engineering Constitution |
| Cursor output format | EMPIREAI_CURSOR_OUTPUT_STANDARD.md |
| No production change without proof plan | Framework §14 |
| Builder supervised by Pillow | Supervisor Governance |

---

## 7. Scope Discipline

| Violation | Response |
|-----------|----------|
| Scope expansion mid-mission | Stop · Grand King re-approval |
| Mission without WHY/WHAT/HOW/PROOF | Reject brief · re-sync Vision |
| Implementation before approval | Halt · constitutional violation |
| Duplicate constitutional doc | Extend existing per hierarchy — no duplicates |

---

## 8. Mission Closure

Closure requires:

1. **PROOF** artifact (test log, audit, commit, GK sign-off)  
2. **Lessons learned** (min 3 bullets)  
3. **Vision accumulation** queue update if strategic  
4. **JOURNEY.md** entry for structural changes  
5. **EMPIREAI_STATUS.md** update if runtime state changed  

Post-mission: [`EMPIREAI_VISION_ACCUMULATION.md`](./EMPIREAI_VISION_ACCUMULATION.md) (P1-03)

---

## 9. Mission Namespace Registry

| Namespace | Register |
|-----------|----------|
| CON-### | [`EMPIREAI_CONSTITUTION_LOCK.md`](./EMPIREAI_CONSTITUTION_LOCK.md) |
| ADR-### | `EMPIREAI_DECISIONS.md` |
| REAL-### | Cockpit roadmap · Journey · git history |
| PILLOW-### | PILLOW_ROADMAP.md · Journey |

---

## Related

- [`EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md`](./EMPIREAI_VISION_SYNCHRONIZATION_POLICY.md)  
- [`EMPIREAI_SUPERVISOR_GOVERNANCE.md`](./EMPIREAI_SUPERVISOR_GOVERNANCE.md)  
- [`EMPIREAI_ROADMAP_HIERARCHY.md`](./EMPIREAI_ROADMAP_HIERARCHY.md)
