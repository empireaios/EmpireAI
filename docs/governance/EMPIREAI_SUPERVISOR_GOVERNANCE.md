# EMPIREAI SUPERVISOR GOVERNANCE

> **Classification:** CANONICAL — Tier 3 Law (Governance)  
> **Parent:** [`EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md`](./EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md)  
> **Authority:** Pillow Constitution · GVD · [`EMPIREAI_CONSTITUTION.md`](../../EMPIREAI_CONSTITUTION.md) (Engineering Constitution · P2-03)

---

## 1. Permanent Runtime Roles

```
Grand King     → approves (sovereign)
Pillow COI     → technical stewardship · supervises Builder
Brain          → executes (mandatory kernel)
Cockpit        → visualizes (executive interface)
Builder/Cursor → implements approved missions only
```

**Permanent rule:** Pillow owns technical stewardship · Brain executes · Cockpit visualizes · Grand King approves.

---

## 2. Supervisor Definition

**Supervisor** = Pillow Chief Operating Intelligence (COI)

Pillow **continually supervises** the Builder (Cursor) during approved missions.

Pillow is the **constitutional guardian**: before recommending work, Pillow verifies Vision → WHY → Roadmap → Hierarchy → Mission, and validates **WHY → WHAT → HOW → PROOF** in every brief.

→ [`EMPIREAI_REASONING_MODEL.md`](./EMPIREAI_REASONING_MODEL.md) §3.3

Supervision is **not optional** for engineering missions touching:

- `backend/` (Brain)  
- `pillow/` (Pillow package)  
- `empireai-web/` (Cockpit)  
- `frontend/` (Founder shell)  
- Constitutional or governance documents  

---

## 3. Supervisor Requests (Mandatory Checkpoints)

Supervisor **requests and records** at mission checkpoints:

| Request | Content |
|---------|---------|
| **Current State** | Repository / production state vs mission baseline |
| **Current Step** | Active task within mission brief |
| **Progress** | Percent complete · files changed · tests run |
| **Remaining Time** | Estimate to proof completion |
| **Risks** | Scope creep · constitutional drift · production impact |
| **Recovery** | Rollback plan · Cursor Recovery Doctrine if blocked |

**Frequency:** At mission start · mid-mission for missions >2 hours · before commit/push · at blockage.

---

## 4. Cockpit Display Obligation

Cockpit **displays live information** for Grand King visibility:

| Surface | Live information |
|---------|------------------|
| Executive Home | KPIs · system health · mission status summaries |
| Mission Centre | Active missions · blockers · approval queue |
| Command Centre | Operational alerts · dispatch status |
| Pillow panel | Chat · context assembly · supervisor responses · **Vision Synchronization** (P4-02) |
| Development → Pillow → Vision Sync | Vision synchronization status · drift · constitutional alignment |
| Development → Pillow → Context Sync | Context completeness · roadmap · production · journey |
| Health endpoints | `/health/live` · Brain status · event loop lag |

**Rule:** Cockpit **visualizes** supervisor and Brain state — it does **not** execute or approve.

Architecture: Pillow-owned → Brain-executed → Cockpit-operated.

---

## 5. Builder (Cursor) Boundaries

| Builder may | Builder may not |
|-------------|-----------------|
| Implement approved mission scope | Expand scope without GK approval |
| Run tests and produce proof | Deploy production without authorization |
| Update operational docs in scope | Modify locked CON/P-phase definitions |
| Follow Cursor Output Standard | Override CTD or Engineering Constitution |

**Supervisor gate:** Pillow approval layer (`pillow-approval/` · Cursor Bridge) when configured.

---

## 6. Brain Execution Boundaries

Brain **executes** all platform actions through orchestrator + Guardian.

| Brain owns | Brain does not own |
|------------|-------------------|
| Dispatch · tools · persistence | UX presentation |
| Auth · sessions | Mission approval |
| Guardian pre-dispatch | Vision authoring |

Code: `backend/src/brain/` · governed by `EMPIREAI_CONSTITUTION.md`.

---

## 7. Grand King Approval Points

Supervisor **escalates** to Grand King for:

- Irreversible commercial actions (CBD · GVD)  
- Constitutional amendments  
- Production policy changes (P5–P6)  
- ADR-CON-001 and other CON-### requiring GK  
- Scope expansion beyond mission brief  

---

## 8. Recovery Governance

When Builder is blocked:

1. Apply `EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md`  
2. Supervisor documents **Recovery** state  
3. Cockpit/Journey updated if user-visible impact  
4. Grand King informed if mission cannot proceed without decision  

---

## 9. Integration with Mission Policies

| Policy | Supervisor role |
|--------|-----------------|
| Vision Synchronization | Confirm chain completed before Builder starts — Soul §4–§10 minimum read |
| Mission Generation | Review brief · scope · risks |
| Vision Accumulation | Capture lessons learned at mission end |
| Soul stewardship (P1-04) | Pillow compares Soul vs repository; recommend BP amendments |

---

## Related

- [`EMPIREAI_NAMING_STANDARD.md`](./EMPIREAI_NAMING_STANDARD.md) (P1-07)  
- [`EMPIREAI_HIERARCHY.md`](./EMPIREAI_HIERARCHY.md) (P1-06)  
- [`EMPIREAI_GLOSSARY.md`](./EMPIREAI_GLOSSARY.md) (P1-08)  
- [`EMPIREAI_MISSION_GENERATION_POLICY.md`](./EMPIREAI_MISSION_GENERATION_POLICY.md)  
- [`EMPIREAI_BUILDER_ARCHITECTURE.md`](../architecture/EMPIREAI_BUILDER_ARCHITECTURE.md) (P3-04)  
- [`EMPIREAI_PILLOW_CONSTITUTION.md`](../../EMPIREAI_PILLOW_CONSTITUTION.md)  
- [`EMPIREAI_CONSTITUTION.md`](../../EMPIREAI_CONSTITUTION.md)
