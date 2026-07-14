# EMPIREAI AUTONOMOUS RECOVERY ENGINE

> **Classification:** CANONICAL — Tier 3 Law (Governance)  
> **Document ID:** P6-06 · AUTONOMOUS_RECOVERY_ENGINE  
> **Parent:** [`EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md`](./EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md)  
> **Companion:** [`EMPIREAI_RECOVERY_DOCTRINE_SYSTEM.md`](./EMPIREAI_RECOVERY_DOCTRINE_SYSTEM.md) · [`EMPIREAI_ETA_ENGINE.md`](./EMPIREAI_ETA_ENGINE.md) · [`EMPIREAI_SUPERVISOR_SYSTEM.md`](./EMPIREAI_SUPERVISOR_SYSTEM.md)  
> **Authority:** **Single permanent Autonomous Recovery Engine** — no competing recovery orchestration systems  
> **Runtime:** `pillow/src/autonomous-recovery-engine/` · **PILLOW-ARE-001**

---

## 1. Purpose

P4-05 established the constitutional **Recovery Doctrine** (WHAT recovery is).  
P6-05 established the permanent **ETA Engine**.  
P6-06 establishes the permanent **Autonomous Recovery Engine** (HOW recovery is executed continuously).

EmpireAI shall autonomously recover whenever recovery is constitutionally safe.

---

## 2. Recovery pipeline

```
Failure Detected → Evidence Collection → Failure Classification → Root Cause Analysis
→ Recovery Strategy Selection → Safety Validation → Recovery Execution → Recovery Verification
→ Journey Recording → Vision Accumulation
```

**Runtime:** `RECOVERY_ORCHESTRATION_PIPELINE` · `orchestrateRecovery()`

---

## 3. Failure detection

Mission Stall · Heartbeat Loss · Execution Timeout · Dependency Failure · Repository Failure · Validation Failure · Worker Failure · Queue Failure · Runtime Failure · Infrastructure Failure · Production Failure · Unknown Failure

**Runtime:** `RECOVERY_DETECTION_SIGNALS` · `detectFailureSignals()`

---

## 4. Recovery strategies

Each strategy defines Purpose · Safety Conditions · Maximum Attempts · Failure Conditions · Escalation Rules.

`retry` · `resume` · `restart_worker` · `restart_queue` · `reload_context` · `rebuild_execution_state` · `restore_session` · `rollback_safe_changes` · `continue_mission` · `pause_mission` · `escalate`

**Runtime:** `RECOVERY_STRATEGY_REGISTRY`

---

## 5. Autonomous recovery policy

Autonomous recovery when constitutional integrity · repository integrity · production integrity preserved; recovery confidence exceeds threshold; no irreversible action required.

**Runtime:** `AUTONOMOUS_RECOVERY_LIMITS` · `evaluateAutonomousRecoverySafety()`

---

## 6. Escalation order

Supervisor → Pillow → ECC → Grand King

Escalation includes Failure Summary · Evidence · Recovery Attempts · Current Risks · Recommended Action.

---

## 7. Integration

| System | Relationship |
|--------|--------------|
| **Recovery Doctrine (P4-05)** | Constitutional pipeline — WHAT recovery is |
| **Recovery Manager (PILLOW-008)** | Execution layer — inspect · diagnose · execute |
| **Supervisor** | Monitors recovery progress · health · repeated failures |
| **Builder Monitor** | Publishes recovery · execution · validation events |
| **ETA Engine** | Recovery delay · confidence impact on ETA |
| **ECC** | Recovery scheduling · priorities · resource allocation |
| **Journey** | Recovery journey recorded |

---

## 8. Grand King acceptance

When a recoverable failure occurs, EmpireAI shall detect · diagnose · select strategy · recover automatically · resume execution · record journey · escalate only when constitutional or irreversible decisions require Grand King approval.

**Runtime:** `getCockpitSnapshot()` · `verifyGrandKingClarity()`

---

**Ratified:** 2026-07-05 (P6-06)

**Successor:** P6-07 — Automation ✅ · P7-01 — Founder Shell
