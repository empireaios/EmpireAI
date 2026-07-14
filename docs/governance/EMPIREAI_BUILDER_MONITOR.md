# EMPIREAI BUILDER MONITOR

> **Classification:** CANONICAL — Tier 3 Law (Governance)  
> **Document ID:** P6-04 · BUILDER_MONITOR  
> **Parent:** [`EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md`](./EMPIREAI_CONSTITUTIONAL_FRAMEWORK.md)  
> **Companion:** [`EMPIREAI_SUPERVISOR_SYSTEM.md`](./EMPIREAI_SUPERVISOR_SYSTEM.md) · [`EMPIREAI_BUILDER_ARCHITECTURE.md`](../architecture/EMPIREAI_BUILDER_ARCHITECTURE.md)  
> **Authority:** **Single permanent Builder Monitor** — no competing Builder monitoring systems  
> **Runtime:** `pillow/src/builder-monitor/` · **PILLOW-BM-001**

---

## 1. Purpose

P6-03 established the permanent Supervisor System. P6-04 establishes the permanent **Builder Monitor**.

Builder Monitor enables Supervisor to **continuously interrogate Builder** throughout mission execution.

**Supervisor never assumes.**  
**Supervisor continuously verifies.**  
**Builder continuously reports.**

The objective is **complete execution transparency**.

---

## 2. Builder shall publish

**Runtime:** `BUILDER_TELEMETRY_REGISTRY` · `publishTelemetry()`

Current Mission · Roadmap Item · Phase · Step · Activity · Mission State · Overall Progress · Stage Progress · ETA · Elapsed Time · Current File · Files Modified · Repository Activity · Branch · Dependency · Queue · Worker · Validation State · Production State · Recovery State · Errors · Warnings · Heartbeat

---

## 3. Supervisor shall interrogate

**Runtime:** `INTERROGATION_DOMAINS` · `interrogateBuilder()`

Mission · Execution · Repository · Validation · Recovery · Progress · Dependency · Worker · Queue · Heartbeat · Risks · Bottlenecks

---

## 4. Interrogation frequency

**Runtime:** `INTERROGATION_FREQUENCIES` — production-safe intervals (heartbeat 120s · progress 180s · repository 300s · etc.)

---

## 5. Event model

**Runtime:** `BUILDER_EVENT_REGISTRY`

Mission Started · Updated · Progress Changed · Repository Updated · Validation · Recovery · Completed · Failed · Cancelled · Heartbeat

---

## 6. Mission timeline

Every interrogation result becomes part of the permanent Journey.

**Runtime:** `getTimeline()` · Journey integration via `publishEvent()`

---

## 7. Integration

| System | Relationship |
|--------|--------------|
| **Builder (Cursor Bridge)** | Publishes telemetry via `publishTelemetry()` |
| **Supervisor** | Calls `interrogateBuilder()` — never assumes |
| **ECC** | Consumes Builder Monitor via `validateForEccSync()` |
| **Journey** | Timeline entries recorded |
| **Pillow** | Analyses execution quality and bottlenecks |

---

## 8. Grand King acceptance

Supervisor continuously interrogates Builder and displays, in near real-time:

Current Mission · Current Step · Current Activity · Progress · Repository Changes · Validation Status · Recovery Status · Heartbeat

**Without manual intervention.**

**Runtime:** `getCockpitSnapshot()` · `verifyGrandKingClarity()`

---

**Ratified:** 2026-07-05 (P6-04)

**Successor:** P6-05 — ETA Engine ✅ · P6-06 — Recovery ✅ · P6-07 — Automation ✅ · P7-01 — Founder Shell
