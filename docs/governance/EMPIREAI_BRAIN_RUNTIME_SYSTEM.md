# EMPIREAI BRAIN RUNTIME SYSTEM

> **Classification:** CANONICAL — Tier 3 Law (Governance · Runtime Stability)  
> **Document ID:** P5-01  
> **Constitutional phase:** P5 — Runtime Foundation (**FIRST ITEM**)  
> **Dependencies:** P4-08 complete  
> **Owner:** Chief Architect · Pillow COI · Grand King · Supervisor  
> **Authority:** **Single permanent Brain Runtime Architecture** — no competing runtime documents  
> **Executor companion:** [`EMPIREAI_BRAIN_ARCHITECTURE.md`](../architecture/EMPIREAI_BRAIN_ARCHITECTURE.md) (P3-01)  
> **Audit companion:** [`08_BRAIN_AND_RUNTIME_AUDIT.md`](../audits/full-empireai-audit/08_BRAIN_AND_RUNTIME_AUDIT.md)  
> **Runtime:** `pillow/src/brain-runtime/` · **PILLOW-BR-001** · Executor: `backend/src/brain/`

---

## 1. Purpose

Phase P4 established the Engineering Foundation. P5-01 begins **Phase P5 — Runtime Foundation** by establishing the permanent **Brain Runtime architecture**.

EmpireAI must remain stable under continuous operation. The Brain shall remain responsive regardless of workload.

---

## 2. Runtime principles

| Principle | Requirement |
|-----------|-------------|
| No synchronous blocking | Async I/O; debounced SQLite persist |
| No event-loop starvation | cooperativeYield; lag monitor |
| No hidden bottlenecks | RUNTIME_BOTTLENECK_REGISTRY |
| No silent degradation | Surface Redis/worker/queue degraded mode |
| Graceful degradation | DegradedTaskQueue documented; API remains live |
| Independent subsystem execution | worker.ts separate process |
| Background processing | BullMQ queue + scheduler |

**Runtime:** `RUNTIME_PRINCIPLES`

---

## 3. Governed domains

Process Lifecycle · Memory · Workers · Queues · Event Loop · Redis · Database · API · Authentication · Sessions · Runtime Health · Resource Usage · Background Tasks.

**Runtime:** `RUNTIME_GOVERNANCE_DOMAINS`

---

## 4. Known bottlenecks (registered)

| ID | Domain | Severity | Location |
|----|--------|----------|----------|
| BR-BN-001 | Database | High | Sync SQLite cold load |
| BR-BN-002 | Database | Medium | Schema migration at first access |
| BR-BN-003 | Process | High | 200+ tool registration at boot |
| BR-BN-004 | Queues | Critical | DegradedTaskQueue without Redis |
| BR-BN-005 | Workers | High | Workers off at production API boot |
| BR-BN-006 | Event Loop | High | Sequential startPillow() chain |
| BR-BN-007 | API | Medium | /brain/dispatch long path |
| BR-BN-008 | Background | Medium | Pillow routePrompt LLM block |

**Runtime:** `RUNTIME_BOTTLENECK_REGISTRY` · `getBlockingBottlenecks()`

---

## 5. Runtime health review

CPU · Memory · Event Loop Lag · Queue Health · Redis · SQLite · PostgreSQL (future) · Worker Health · API Health · Runtime Health.

**Runtime:** `executeRuntimeAssessment()` · `BrainRuntimeSnapshot` · `collectBrainRuntimeSnapshot()`

**Thresholds:** Event loop healthy <50ms · degraded ≥200ms · blocked ≥500ms

---

## 6. Integration map

| Surface | Path |
|---------|------|
| Brain Runtime engine | `pillow/src/brain-runtime/engine.ts` |
| Live snapshot bridge | `backend/src/orchestration/pillow-host/brain-runtime-bridge.ts` |
| Event loop monitor | `backend/src/runtime/event-loop-cooperative.ts` |
| Brain executor | `backend/src/brain/index.ts` (P3-01 — not duplicated) |
| Builder gate | Cursor Bridge + Cursor Protocol pre-mission checks |
| Cockpit | Runtime panel · `GET /api/pillow/brain-runtime` |
| Health endpoints | `/health/live` · `/health` · `/guardian/health` |

---

## 7. Pillow & Supervisor

**Pillow** continuously evaluates: Runtime Stability · Performance Trends · Runtime Drift · Architecture Drift · Production Drift.

**Supervisor** monitors: Runtime Health · Worker Health · Queue Health · Memory · CPU · Latency.

**Runtime:** `analyzeRuntimeStability()` · `validateForSupervisorSync()`

---

## 8. Governance cross-references

- [`EMPIREAI_JOURNEY_SYSTEM.md`](./EMPIREAI_JOURNEY_SYSTEM.md) (P4-08)  
- [`EMPIREAI_E2E_TESTING_SYSTEM.md`](./EMPIREAI_E2E_TESTING_SYSTEM.md) (P4-07)  
- [`EMPIREAI_ENGINEERING_STANDARDS.md`](./EMPIREAI_ENGINEERING_STANDARDS.md)  

**Ratified:** 2026-07-05 (P5-01)

**Successor:** P5-02 — Production Mode ✅ · P5-03 — Sessions
