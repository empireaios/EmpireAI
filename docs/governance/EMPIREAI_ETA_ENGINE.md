# EMPIREAI ETA ENGINE

> **Classification:** CANONICAL — Tier 3 Law (Governance)  
> **Document ID:** P6-05 · ETA_ENGINE  
> **Parent:** [`EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md`](./EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md)  
> **Companion:** [`EMPIREAI_BUILDER_MONITOR.md`](./EMPIREAI_BUILDER_MONITOR.md) · [`EMPIREAI_SUPERVISOR_SYSTEM.md`](./EMPIREAI_SUPERVISOR_SYSTEM.md)  
> **Authority:** **Single permanent ETA Engine** — no competing ETA systems  
> **Runtime:** `pillow/src/eta-engine/` · **PILLOW-ETA-001**

---

## 1. Purpose

P6-04 established the permanent Builder Monitor. P6-05 establishes the permanent **ETA Engine**.

The ETA Engine continuously predicts the remaining execution time of every engineering mission.

**ETA shall never be static.**  
**ETA shall continuously improve using live execution evidence.**  
**The Grand King shall always know how much work remains.**

---

## 2. ETA calculation model

```
Elapsed Time → Remaining Work → Dependency Delay → Recovery Delay
→ Validation Delay → Historical Comparison → Confidence Score → Predicted Completion Time
```

**Runtime:** `ETA_PIPELINE_REGISTRY` · `calculateEtaEstimate()`

---

## 3. ETA output

For every active mission:

Estimated Remaining Time · Predicted Completion Timestamp · Confidence Percentage · Completion Percentage · Execution Velocity · Critical Path · Blocking Dependencies · Current Delay Reason · Last ETA Update

Every estimate includes **Reason · Evidence · Known Uncertainty · Recommended Action**.

---

## 4. Confidence model

`very_high` · `high` · `medium` · `low` · `unknown`

**Runtime:** `classifyEtaConfidence()`

---

## 5. Update policy

ETA auto-updates on mission state · progress · dependency · recovery · validation · repository · velocity changes.

**Runtime:** `onExecutionEvidence()` · `ETA_UPDATE_TRIGGERS`

---

## 6. Integration

| System | Relationship |
|--------|--------------|
| **Builder Monitor** | Supplies telemetry · triggers ETA refresh |
| **Supervisor** | Supplies progress · velocity · recovery · dependencies |
| **ECC** | Uses ETA for scheduling · priority · resource allocation |
| **Journey** | ETA updates recorded |
| **Pillow** | Analyses prediction quality and accuracy |

---

## 7. Grand King acceptance

Real-time observation of Elapsed Time · Estimated Remaining Time · Predicted Completion · Confidence · Current Delay Reason — **automatically updated** without manual refresh.

**Runtime:** `getCockpitSnapshot()` · `verifyGrandKingClarity()`

---

**Ratified:** 2026-07-05 (P6-05)

**Successor:** P6-06 — Recovery ✅ · P6-07 — Automation ✅ · P7-01 — Founder Shell
