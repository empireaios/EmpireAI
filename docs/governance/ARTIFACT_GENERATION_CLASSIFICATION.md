# Artifact Generation Classification

> **Authority:** `EMPIREAI_CONTINUOUS_ARTIFACT_GENERATION_WORKFLOW.md`  
> **Use:** Pillow, ChatGPT, and Cursor agents classify lasting decisions and select the correct repository artifact type.

---

## Classification matrix

When a **lasting decision** is detected, use this matrix to classify and route artifact generation.

| Decision signal | Artifact type | Canonical owner | Primary artifact path | Approval route |
|---|---|---|---|---|
| Constitutional rule, CTD/GVD/ACD change | Constitution Update | Respective doctrine owner | `EMPIREAI_*_DOCTRINE*.md` · `EMPIREAI_CONSTITUTION.md` | GK → doctrine sync → Journey |
| Subsystem boundary, dependency, technology choice | Architecture Decision Record | Pillow Architecture · ADR owner | `EMPIREAI_DECISIONS.md` · contract append | GK → ADR → Journey |
| Durable executive reasoning insight | Executive Learning | Pillow Architecture · Layer 2 | Improvement Vault · candidate register | GK → vault → optional mission |
| Approved intelligence promotion | Executive Knowledge Base Update | Journey · Soul · Status · contracts | Target doctrine or contract | GK → Sync preview → Synchronizer |
| Operational position, mission index row | Journey Update | Journey (BL-A) | `JOURNEY.md` · `JOURNEY_AUDIT.md` | GK → BL-A structural change |
| Governance, sync, audit, navigation rule | Repository Policy | Repository Governance | Governance doctrine · BL register | GK → doctrine sync |
| Marketplace, pricing, revenue posture | Commercial Strategy | Commercial Intelligence | Commercial doctrine · strategy docs | GK → strategy artifact |
| Product direction, UX surface scope | Product Strategy | UX / Product owner | UX contract · product docs | GK → contract update |
| Deferred enhancement with evidence | Improvement Vault Entry | BL-C register owner | `docs/governance/*_ENHANCEMENT_REGISTER.md` | GK → register row |
| Implementation work for Cursor | Mission Specification | Mission owner · Cursor | `.cursor/missions/` · mission file | GK → Cursor Output Standard → Bridge |

---

## Required artifact fields (all types)

Every generated artifact proposal **shall** include:

| Field | Purpose |
|---|---|
| **Decision summary** | What lasting decision was detected |
| **Classification** | Artifact type from matrix above |
| **Repository impact** | Files, owners, and sync obligations |
| **Canonical owner** | Who owns permanent memory for this decision |
| **Evidence** | Repository citations — not chat history alone |
| **Approval recommendation** | Approve · Defer · Revise · Reject |
| **Implementation scope** | What happens after approval (Cursor mission · sync · doctrine edit) |

Mission Specifications **additionally** follow `EMPIREAI_CURSOR_OUTPUT_STANDARD.md` (Section 1 + Section 2).

---

## Quick decision tree

```
Is the decision intended to be permanent?
├── No  → Ephemeral Executive Context only
└── Yes → Will it change repository canonical truth?
          ├── No  → Executive Learning candidate (vault) unless GK directs otherwise
          └── Yes → Classify by domain:
                    ├── Engineering implementation → Mission Specification
                    ├── Architecture choice        → ADR
                    ├── Doctrine / constitution    → Constitution Update
                    ├── Operational position       → Journey Update
                    ├── Governance rule            → Repository Policy
                    ├── Commercial posture         → Commercial Strategy
                    ├── Product / UX direction     → Product Strategy
                    ├── Deferred improvement       → Improvement Vault Entry
                    └── Approved knowledge merge   → Executive Knowledge Base Update
```

---

_End of classification reference — companion to Continuous Artifact Generation Workflow._
