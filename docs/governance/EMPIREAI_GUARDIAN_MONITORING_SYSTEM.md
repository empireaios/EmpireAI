# EMPIREAI GUARDIAN MONITORING SYSTEM

> **Classification:** CANONICAL — Tier 3 Law (Governance · Operational Monitoring)  
> **Document ID:** P5-04 · GUARDIAN_MONITORING_SYSTEM  
> **Constitutional phase:** P5 — Runtime Foundation (**FOURTH ITEM**)  
> **Dependencies:** P5-03 complete  
> **Owner:** Guardian · Pillow COI · Grand King · Supervisor  
> **Authority:** **Single permanent Guardian Monitoring System** — no competing monitoring doctrines  
> **Executor (observes, does not duplicate):** `backend/src/guardian/guardian-engine.ts`  
> **Governance runtime:** `pillow/src/guardian-monitoring/` · **PILLOW-GM-001**  
> **Companions:** [`EMPIREAI_DURABLE_SESSION_ARCHITECTURE.md`](./EMPIREAI_DURABLE_SESSION_ARCHITECTURE.md) (P5-03) · [`EMPIREAI_PRODUCTION_MODE.md`](./EMPIREAI_PRODUCTION_MODE.md) (P5-02) · [`EMPIREAI_BRAIN_RUNTIME_SYSTEM.md`](./EMPIREAI_BRAIN_RUNTIME_SYSTEM.md) (P5-01)

---

## 1. Purpose

P5-03 established the Durable Session Architecture. P5-04 establishes the permanent **Guardian Monitoring System**.

Guardian is the constitutional monitoring subsystem. Guardian continuously observes operational health · detects anomalies · provides evidence. Guardian **never owns execution** · **never replaces Supervisor**.

| Role | Responsibility |
|------|----------------|
| **Guardian** | Monitors |
| **Supervisor** | Supervises |
| **Pillow** | Governs |
| **Brain** | Executes |

---

## 2. Monitoring principles

Continuous Observation · Real-time Health · Historical Trends · Anomaly Detection · Evidence Collection · Non-invasive Monitoring · Production-safe Monitoring · **No Silent Failure**.

**Runtime:** `MONITORING_PRINCIPLES`

---

## 3. Monitored components (20)

Brain Runtime · Pillow · Builder · Supervisor · Cockpit · Journey · Authentication · Sessions · Redis · Database · Queues · Workers · Memory · CPU · Storage · Network · API · Business Engines · Commerce · Production Services.

**Runtime:** `MONITORED_COMPONENT_REGISTRY` · `MONITORED_DOMAINS`

---

## 4. Health classification

| Status | Meaning |
|--------|---------|
| healthy | Within thresholds |
| warning | Elevated but operational |
| degraded | Reduced capability |
| critical | Requires immediate attention |
| unavailable | Not reachable |
| recovering | Restoring from interruption |
| maintenance | Expected limited state |
| historical | Archived observation |

**Runtime:** `HEALTH_CLASSIFICATIONS`

---

## 5. Metrics collected

CPU Usage · Memory Usage · Disk Usage · Network Latency · API Latency · Queue Depth · Worker Status · Session Count · Authentication Health · Redis Health · Database Health · Error Rate · Recovery Count · Heartbeat Status.

**Runtime:** `GuardianMetricsBundle` · `collectGuardianMonitoringSnapshot()`

---

## 6. Alerting

Severities: **informational · low · medium · high · critical**

Every alert records: Alert ID · Timestamp · Affected Component · Severity · Observed Symptoms · Probable Cause · Recommended Action · Current Status.

**Runtime:** `generateAlertsFromSnapshot()` · `GuardianAlertRecord`

---

## 7. Historical monitoring

Health Timeline · Performance Timeline · Incident Timeline · Recovery Timeline · Alert History · Availability History · Trend Analysis.

**Runtime:** `HistoricalMonitoringStore` · ring buffer (50 entries)

---

## 8. Pillow & Supervisor

**Pillow** analyses: Monitoring Trends · Architecture Weaknesses · Performance Drift · Production Drift · Reliability Trends · Operational Risks.

**Supervisor** consumes: Guardian Alerts · Guardian Health · Guardian Metrics · Guardian Trends — coordinates recovery when required.

**Runtime:** `analyzeMonitoringTrends()` · `validateForSupervisorSync()`

---

## 9. Integration map

| Surface | Path |
|---------|------|
| Guardian Monitoring engine | `pillow/src/guardian-monitoring/engine.ts` |
| Component registry | `pillow/src/guardian-monitoring/monitored-component-registry.ts` |
| Alert engine | `pillow/src/guardian-monitoring/alert-engine.ts` |
| Historical store | `pillow/src/guardian-monitoring/historical-store.ts` |
| Backend Guardian (executor) | `backend/src/guardian/guardian-engine.ts` |
| Live snapshot bridge | `backend/src/orchestration/pillow-host/guardian-monitoring-bridge.ts` |
| Health endpoint | `/guardian/health` |
| Cockpit | Monitoring panel · `GET /api/pillow/guardian-monitoring` |

---

## 10. Grand King acceptance

Grand King opens Cockpit and immediately determines: Overall Empire Health · Runtime Health · Current Alerts · Current Degradations · Historical Trends · Affected Components — **without reading logs or investigating the repository**.

**Runtime:** `verifyGrandKingVisibility()` · `getCockpitSnapshot()`

---

## 11. Governance cross-references

- [`EMPIREAI_DURABLE_SESSION_ARCHITECTURE.md`](./EMPIREAI_DURABLE_SESSION_ARCHITECTURE.md) (P5-03)  
- [`EMPIREAI_PRODUCTION_MODE.md`](./EMPIREAI_PRODUCTION_MODE.md) (P5-02)  
- [`EMPIREAI_ENGINEERING_STANDARDS.md`](./EMPIREAI_ENGINEERING_STANDARDS.md)  

**Ratified:** 2026-07-05 (P5-04)

**Successor:** P5-05 — Scaling
