# EMPIREAI RECOVERY DOCTRINE SYSTEM

> **Classification:** CANONICAL — Tier 3 Law (Governance · Recovery Protocol)  
> **Document ID:** P4-05  
> **Constitutional phase:** P4 — Engineering Foundation  
> **Dependencies:** P4-04 complete  
> **Owner:** Chief Architect · Pillow COI · Supervisor · Builder  
> **Authority:** **Single permanent Recovery Doctrine** — no competing recovery doctrines  
> **Execution companion:** [`EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md`](../../EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md) (Recovery Mode sequence — not duplicated here)  
> **Empire companion:** [`EMPIREAI_EMPIRE_RECOVERY_DOCTRINE.md`](../../EMPIREAI_EMPIRE_RECOVERY_DOCTRINE.md) (disaster scope)  
> **Protocol companion:** [`EMPIREAI_CURSOR_PROTOCOL.md`](./EMPIREAI_CURSOR_PROTOCOL.md) (P4-04)  
> **Runtime:** `pillow/src/recovery-doctrine/` · **PILLOW-RD-001** · execution via **PILLOW-008**

---

## 1. Purpose

P4-04 established the permanent Cursor Protocol. P4-05 establishes the **permanent Recovery Doctrine**.

Recovery is **not** an afterthought. Recovery is a constitutional engineering capability.

EmpireAI must recover automatically whenever it is safe to do so. The Grand King should only be interrupted when constitutional approval or irreversible decisions are required.

| Recovery Doctrine IS | Recovery Doctrine IS NOT |
|----------------------|--------------------------|
| Constitutional recovery lifecycle + escalation | A replacement for Cursor Recovery Mode §3 |
| Shared capability across Pillow · Builder · Supervisor · Brain | Per-incident ad hoc recovery playbooks |
| Autonomous when safe · escalate when not | Silent failure or infinite waits |

---

## 2. Recovery scope

The Recovery Doctrine governs:

| Domain | Authority |
|--------|-----------|
| Engineering Recovery | Builder · Technical Chief |
| Mission Recovery | Supervisor · Mission Planner |
| Builder Recovery | Cursor Bridge · Supervisor |
| Repository Recovery | Recovery Manager · Repository Sync |
| Deployment Recovery | Infrastructure Commander |
| Production Recovery | Production Truth · Guardian |
| Journey Recovery | Journey governance |
| Supervisor Recovery | PILLOW-007 stall detection |
| Runtime Recovery | Pillow session · orchestrator |
| Documentation Recovery | Documentation Law |

---

## 3. Recovery pipeline (P4-05)

```
Failure Detected
  → Failure Classification
  → Evidence Collection
  → Root Cause Analysis
  → Recovery Strategy Selection
  → Recovery Validation
  → Recovery Execution
  → Verification
  → Lessons Learned
  → Vision Accumulation
```

**Runtime:** `executeRecoveryPipeline()` · `handleMissionFailure()`

---

## 4. Failure classification

Every failure **shall** be classified as one of:

`transient` · `configuration` · `infrastructure` · `repository` · `architecture` · `engineering` · `production` · `dependency` · `external_service` · `human_approval_required` · `unknown`

**Runtime:** `classifyFailure()`

---

## 5. Autonomous recovery

EmpireAI **shall** automatically attempt recovery when safe.

Permitted autonomous actions: retry · resume · reload context · restart worker · restart queue · rebuild cache · reconnect provider · revalidate dependencies · continue mission · resume journey

**Irreversible recovery** (rollback · deploy · constitutional change) requires **Grand King approval**.

**Runtime:** `selectAutonomousActions()` · `RECOVERY_LIMITS`

---

## 6. Escalation policy

```
Supervisor → Pillow → Chief Architect → Grand King
```

Escalate only when:

- Recovery confidence below threshold
- Constitutional conflict exists
- Production risk exceeds policy
- Manual approval required

**Runtime:** `selectEscalationLevel()`

---

## 7. Recovery limits

| Limit | Default |
|-------|---------|
| Maximum retry attempts | 3 |
| Recovery timeout | 300s |
| Recovery confidence threshold | 0.65 |
| Human intervention threshold | 0.45 |
| Rollback policy | Grand King required |
| Safe-stop policy | Fail closed on irreversible |

**Runtime:** `RECOVERY_LIMITS` in `paths.ts`

---

## 8. Integration map

| Surface | Path |
|---------|------|
| Recovery Doctrine engine | `pillow/src/recovery-doctrine/engine.ts` |
| Recovery execution | `pillow/src/recovery/engine.ts` (PILLOW-008) |
| Supervisor stall recovery | `pillow/src/supervisor/engine.ts` |
| Builder gate | Cursor Bridge + Cursor Protocol pre-mission checks |
| Cockpit | Recovery panel · `GET /api/pillow/recovery` |
| Metrics | `getMetrics()` · `reviewEffectiveness()` |

---

## 9. Alignment validation

| Authority | Alignment |
|-----------|-----------|
| Vision · Soul | Recovery preserves completed work |
| CTD · Constitution Hierarchy | No unauthorized drift |
| Engineering Constitution | Art V recovery |
| Architecture Law | No duplicate recovery subsystems |
| Documentation Law | P4-05 system doc canonical |
| Roadmap | P4-05 slot |
| Cursor Protocol | Pre-mission recovery check |
| Supervisor | Stall → pipeline → resume |

---

## 10. Governance cross-references

- [`EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md`](../../EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md)  
- [`EMPIREAI_SUPERVISOR_GOVERNANCE.md`](./EMPIREAI_SUPERVISOR_GOVERNANCE.md)  
- [`EMPIREAI_BROWSER_TRUTH_SYSTEM.md`](./EMPIREAI_BROWSER_TRUTH_SYSTEM.md) (P4-06)  
- [`EMPIREAI_E2E_TESTING_SYSTEM.md`](./EMPIREAI_E2E_TESTING_SYSTEM.md) (P4-07 — critical test failures invoke recovery recommendations)  
- [`EMPIREAI_ENGINEERING_STANDARDS.md`](./EMPIREAI_ENGINEERING_STANDARDS.md)  
- [`EMPIREAI_BUILDER_ARCHITECTURE.md`](../architecture/EMPIREAI_BUILDER_ARCHITECTURE.md)  

**Ratified:** 2026-07-05 (P4-05)

**Successor:** [`EMPIREAI_BROWSER_TRUTH_SYSTEM.md`](./EMPIREAI_BROWSER_TRUTH_SYSTEM.md) (P4-06 — constitutional browser acceptance)
