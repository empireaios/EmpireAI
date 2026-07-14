# EMPIREAI SUPERVISOR SYSTEM

> **Classification:** CANONICAL — Tier 3 Law (Governance)  
> **Document ID:** P6-03 · SUPERVISOR_SYSTEM  
> **Parent:** [`EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md`](./EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md)  
> **Companion:** [`EMPIREAI_SUPERVISOR_GOVERNANCE.md`](./EMPIREAI_SUPERVISOR_GOVERNANCE.md)  
> **Authority:** **Single permanent Supervisor System** — no competing supervisor systems  
> **Runtime:** `pillow/src/supervisor/` · **PILLOW-SV-001**

---

## 1. Purpose

P6-02 established the Vision Integrity Engine. P6-03 establishes the permanent **Supervisor System**.

**Supervisor is NOT an AI.**  
**Supervisor is NOT Builder.**  
**Supervisor is NOT Pillow.**

Supervisor is the constitutional execution supervisor responsible for continuously observing every engineering activity across EmpireAI — ensuring execution never becomes invisible.

---

## 2. Supervisor responsibilities

**Runtime:** `SUPERVISOR_RESPONSIBILITIES`

| Responsibility | Scope |
|----------------|-------|
| Mission Supervision | Mission state · progress · completion |
| Execution Supervision | Builder activity · validation · proof |
| Builder Supervision | Cursor missions under constitutional gates |
| Runtime Supervision | Brain runtime context during execution |
| Journey Supervision | Journey events fed from observations |
| Production Supervision | Production verification phase |
| Recovery Supervision | Recovery doctrine invocation and outcome |
| Dependency Supervision | Mission dependencies tracked |
| Progress Supervision | Heartbeats · progress events |
| Health Supervision | Mission health classification |

---

## 3. Supervision pipeline

```
Mission Created → Mission Accepted → Mission Started → Execution Monitoring
→ Progress Monitoring → Dependency Monitoring → Risk Monitoring
→ Recovery Monitoring → Validation Monitoring → Mission Completion
```

**Runtime:** `SUPERVISION_PIPELINE_REGISTRY`

---

## 4. Mission health

Supervisor classifies every active mission:

`healthy` · `attention_required` · `delayed` · `blocked` · `recovering` · `critical` · `completed`

**Runtime:** `classifyMissionHealthStatus()`

---

## 5. Supervision principles

**Runtime:** `SUPERVISOR_PRINCIPLES`

- Continuous Observation  
- No Silent Execution  
- No Hidden Failure  
- Evidence-Based Reporting  
- Real-Time Visibility  
- Production Awareness  
- Constitutional Compliance  

---

## 6. Integration

| System | Relationship |
|--------|--------------|
| **Pillow** | Analyses Supervisor observations · execution efficiency · bottlenecks |
| **ECC** | Consumes Supervisor events to coordinate execution |
| **Guardian** | Infrastructure health — separate from Supervisor execution health |
| **Journey** | Receives supervision events |
| **Builder** | Dispatched missions observed from launch to completion |
| **VIE** | Constitutional alignment validated before Supervisor accepts mission |

**Rule:** Supervisor observes · ECC coordinates · Builder executes.

---

## 7. Grand King acceptance

The Grand King continuously observes every active engineering mission via Cockpit:

- Current Step  
- Mission Health  
- Execution Progress  
- Dependencies  
- Risks  
- Recovery Status  

**Without querying logs or the repository.**

**Runtime:** `getCockpitSnapshot()` · `verifyGrandKingClarity()`

---

**Ratified:** 2026-07-05 (P6-03)

**Successor:** P6-04 — Builder Monitor ✅ · P6-05 — ETA Engine ✅ · P6-06 — Recovery ✅ · P6-07 — Automation ✅ · P7-01 — Founder Shell
