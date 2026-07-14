# EMPIREAI SCALING ARCHITECTURE

> **Classification:** CANONICAL — Tier 3 Law (Governance · Deliberate Evolution)  
> **Document ID:** P5-05 · SCALING_ARCHITECTURE  
> **Constitutional phase:** P5 — Runtime Foundation (**FIFTH ITEM**)  
> **Dependencies:** P5-04 complete  
> **Owner:** Chief Architect · Pillow COI · Grand King · Guardian · Supervisor  
> **Authority:** **Single permanent Scaling Architecture** — no competing scaling doctrines  
> **Runtime:** `pillow/src/scaling-architecture/` · **PILLOW-SCL-001**  
> **Companions:** [`EMPIREAI_GUARDIAN_MONITORING_SYSTEM.md`](./EMPIREAI_GUARDIAN_MONITORING_SYSTEM.md) (P5-04) · [`EMPIREAI_PRODUCTION_MODE.md`](./EMPIREAI_PRODUCTION_MODE.md) (P5-02)

---

## 1. Purpose

P5-04 established the Guardian Monitoring System. P5-05 establishes the permanent **Scaling Architecture**.

EmpireAI Version 1 is intentionally engineered as a **production-first single-instance system**. Scaling shall occur **deliberately · never prematurely · never reactively**.

This doctrine defines the constitutional roadmap from current production architecture to future **High Availability (HA)** architecture.

---

## 2. Scaling principles

Production-first deliberate scaling · Never scale prematurely · Never scale reactively without doctrine · Stage-gated evolution · Preserve architectural integrity · Document exit criteria before advancing · Horizontal scaling only when Stage 3+ ready · Database migration before multi-instance.

**Runtime:** `SCALING_PRINCIPLES`

---

## 3. Current architecture (V1 — Stage 1)

| Domain | Topology | Limitation |
|--------|----------|------------|
| Brain | Railway single Fastify | Single instance · 200+ tool boot |
| Database | SQLite sql.js · /data/ volume | Single-writer · no replication |
| Redis | Upstash single instance | SPOF · optional degraded |
| Workers | Separate worker.ts | Manual deploy · off in API |
| Sessions | Redis auth · ephemeral Pillow chat | In-memory fallback |
| Cockpit | Vercel BFF → Railway | Single Brain endpoint |
| Infrastructure | Vercel + Railway + Upstash | Single-region · no HA |

**Runtime:** `CURRENT_ARCHITECTURE_REGISTRY`

---

## 4. Scaling stages

| Stage | Name | Key objective |
|-------|------|---------------|
| **1** | Single Instance Production | V1 validated production baseline (**CURRENT**) |
| **2** | Production Hardening | Mandatory Redis · workers · durable sessions |
| **3** | Multi-instance Runtime | PostgreSQL · horizontal Brain · load balancer |
| **4** | High Availability | Redis HA · DB replication · DR tested |
| **5** | Enterprise Scale | Object storage · auto-scaling · commerce scale |

Each stage documents: objectives · dependencies · exit criteria · limitations · target capabilities · migration notes.

**Runtime:** `SCALING_STAGE_REGISTRY` · `getRecommendedNextStage()`

---

## 5. Target architecture (constitutional evolution)

Multi-instance Brain · High Availability · Load Balancing · Durable Sessions · PostgreSQL Primary · Redis Cluster · Distributed Workers · Object Storage · Central Logging · Central Monitoring · Horizontal Scaling · Disaster Recovery.

**Not before Stage 3:** Horizontal Brain scaling requires PostgreSQL migration first (SCL-BN-001).

---

## 6. Database evolution

```
SQLite (current) → Migration Strategy → PostgreSQL Primary → Replication → Backup & Recovery → Future Scaling
```

**Runtime:** `DATABASE_EVOLUTION_REGISTRY`

---

## 7. Runtime evolution

Workers · Queues · API Scaling · Memory · Caching · AI Provider Abstraction — each with current state, target state, and scaling trigger.

**Runtime:** `RUNTIME_EVOLUTION_REGISTRY`

---

## 8. Known bottlenecks

| ID | Severity | Description | Resolution Stage |
|----|----------|-------------|------------------|
| SCL-BN-001 | Critical | SQLite single-writer | Stage 3 |
| SCL-BN-002 | High | Ephemeral sessions | Stage 2 |
| SCL-BN-003 | High | 200+ tool boot | Stage 2 |
| SCL-BN-004 | Critical | DegradedTaskQueue | Stage 2 |
| SCL-BN-005 | High | Sequential Pillow boot | Stage 2 |
| SCL-BN-006 | High | Workers off in API | Stage 2 |
| SCL-BN-007 | Medium | Single Railway service | Stage 3 |
| SCL-BN-008 | Medium | Single Redis instance | Stage 4 |

**Runtime:** `SCALING_BOTTLENECK_REGISTRY` · integrates with `RUNTIME_BOTTLENECK_REGISTRY` (P5-01)

---

## 9. Pillow · Supervisor · Guardian

**Pillow** evaluates: Scaling readiness · Infrastructure bottlenecks · Runtime bottlenecks · Growth trends · Architecture readiness.

**Supervisor** reports: Capacity · Runtime utilisation · Worker/queue/DB utilisation · Scaling indicators.

**Guardian** monitors: Resource consumption · Capacity thresholds · Growth trends · Performance degradation · Scaling triggers.

**Runtime:** `analyzeScalingReadiness()` · `validateForSupervisorSync()`

---

## 10. Integration map

| Surface | Path |
|---------|------|
| Scaling Architecture engine | `pillow/src/scaling-architecture/engine.ts` |
| Current architecture registry | `pillow/src/scaling-architecture/current-architecture-registry.ts` |
| Scaling stage registry | `pillow/src/scaling-architecture/scaling-stage-registry.ts` |
| Evolution registry | `pillow/src/scaling-architecture/evolution-registry.ts` |
| Live snapshot bridge | `backend/src/orchestration/pillow-host/scaling-architecture-bridge.ts` |
| Cockpit | Scaling panel · `GET /api/pillow/scaling-architecture` |

---

## 11. Grand King acceptance

Grand King understands **current architecture · current scaling limits · bottlenecks · next scaling stage · migration strategy** without architectural reconstruction.

**Runtime:** `verifyGrandKingClarity()` · `getCockpitSnapshot()`

---

## 12. Governance cross-references

- [`EMPIREAI_GUARDIAN_MONITORING_SYSTEM.md`](./EMPIREAI_GUARDIAN_MONITORING_SYSTEM.md) (P5-04)  
- [`EMPIREAI_PRODUCTION_MODE.md`](./EMPIREAI_PRODUCTION_MODE.md) (P5-02)  
- [`EMPIREAI_BRAIN_RUNTIME_SYSTEM.md`](./EMPIREAI_BRAIN_RUNTIME_SYSTEM.md) (P5-01)  
- [`docs/architecture/EMPIREAI_BRAIN_ARCHITECTURE.md`](../architecture/EMPIREAI_BRAIN_ARCHITECTURE.md) §9.4  

**Ratified:** 2026-07-05 (P5-05)

**Successor:** P5-06 — Performance ✅ · Phase P5 complete · P6-01 — Execution Control Center
