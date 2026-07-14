# EMPIREAI PRODUCTION MODE

> **Classification:** CANONICAL — Tier 3 Law (Governance · Operational State)  
> **Document ID:** P5-02  
> **Constitutional phase:** P5 — Runtime Foundation (**SECOND ITEM**)  
> **Dependencies:** P5-01 complete  
> **Owner:** Chief Architect · Pillow COI · Grand King · Supervisor  
> **Authority:** **Single permanent Production Mode Doctrine** — no competing production mode documents  
> **Companion:** [`EMPIREAI_PRODUCTION_TRUTH.md`](./EMPIREAI_PRODUCTION_TRUTH.md) (P1-10) · [`EMPIREAI_BRAIN_RUNTIME_SYSTEM.md`](./EMPIREAI_BRAIN_RUNTIME_SYSTEM.md) (P5-01)  
> **Policy reference:** ADR-CON-002  
> **Runtime:** `pillow/src/production-mode/` · **PILLOW-PM-001**

---

## 1. Purpose

P5-01 established the Brain Runtime architecture. P5-02 establishes the permanent **Production Mode Doctrine**.

Production Mode defines exactly what is allowed to execute in production. It eliminates ambiguity between **Designed · Implemented · Enabled · Production Ready**. Every production capability shall have one clearly defined operational state.

**The principle:** Production behaviour must never surprise the Grand King. Every disabled capability · feature flag · runtime limitation · production restriction is documented.

---

## 2. Production states

| State | Meaning |
|-------|---------|
| **production_enabled** | Runs in production by default |
| **production_disabled** | Off in production by design |
| **production_limited** | Runs with constraints or partial capability |
| **internal_only** | Engineering / Grand King use only |
| **experimental** | Not production-ready |
| **deprecated** | Scheduled for removal |
| **historical** | Superseded — no authority |
| **deferred** | Implemented but not mounted until explicit activation |

**Runtime:** `PRODUCTION_STATES` · `PRODUCTION_COMPONENT_REGISTRY`

---

## 3. Governed domains

Brain · Pillow · Cockpit · Builder · Guardian · Supervisor · Journey · Commerce · Business Engines · API Routes · Workers · Queues · Runtime Modules · Infrastructure · Feature Flags · Extensions.

**Runtime:** `PRODUCTION_MODE_DOMAINS`

---

## 4. Component registry (canonical operational states)

Every component records: purpose · current state · production state · reason · dependencies · owner · activation rules · known limitations · future evolution.

| ID | Component | Production State | Reason (summary) |
|----|-----------|------------------|------------------|
| PM-BRAIN | Brain Executor | production_enabled | ADR-CON-003 — critical routes always registered |
| PM-PILLOW | Pillow COI | production_limited | CON-008 — minimal chat until EMPIRE_V1_OPERATIONAL_READY |
| PM-COCKPIT | Executive Cockpit | production_enabled | Critical auth + executive-home always available |
| PM-BUILDER | Builder (Cursor Bridge) | production_limited | ADR-CON-004 — approval gate; artifact dispatch default |
| PM-GUARDIAN | Guardian | production_enabled | GUARDIAN_ENABLED=true default |
| PM-SUPERVISOR | Cursor Supervisor | production_limited | Requires Pillow session — not hot in minimal prod |
| PM-JOURNEY | Journey System | production_enabled | P4-08 governance layer |
| PM-COMMERCE | Commerce Intelligence | production_limited | LIVE_COMMERCE_INTEGRATION_MODE=sandbox default |
| PM-BUSINESS | Business Engines (REAL) | deferred | EMPIRE_ENABLE_EXTENSION_ROUTES=false default |
| PM-API-CRITICAL | Critical API Routes | production_enabled | Always registered at boot |
| PM-API-EXT | Extension API Routes | production_disabled | ADR-CON-002 — gated off for stability |
| PM-WORKERS | BullMQ Workers | production_disabled | startWorkers=false in production API process |
| PM-QUEUES | Task Queue | production_limited | Enqueue available; processing needs worker + Redis |
| PM-RUNTIME | Brain Runtime Governance | production_enabled | P5-01 when Pillow active |
| PM-INFRA | V1 Split Stack | production_enabled | ADR-CON-005 validated split stack |
| PM-FLAGS | Feature Flag Registry | production_enabled | Every flag documented |
| PM-EXT | REAL Extension Modules | deferred | Extension routes off by default |

**Runtime:** `PRODUCTION_COMPONENT_REGISTRY` · `getComponentsByState()` · `getComponent()`

---

## 5. Feature flags (documented)

| Env Var | Purpose | Production Default |
|---------|---------|-------------------|
| `EMPIRE_V1_OPERATIONAL_READY` | Pillow full production mode after validation | false (manual enable) |
| `EMPIRE_ENABLE_EXTENSION_ROUTES` | Register ~150 REAL extension routes | false |
| `EMPIRE_EXTENSION_ROUTE_DEFER_MS` | Delay before extension route registration | 600000 (10 min) |
| `GUARDIAN_ENABLED` | Guardian pre-dispatch governance | true |
| `REDIS_OPTIONAL` | Start without Redis (degraded mode) | false |
| `LIVE_COMMERCE_INTEGRATION_MODE` | Commerce: disabled \| sandbox \| production | sandbox |
| `EMPIRE_LEGACY_GC05_GLOBAL_ASSISTANT` | Legacy global assistant routes | false |
| `NODE_ENV` | Controls worker boot and Pillow lazy start | production |

**Runtime:** `FEATURE_FLAG_REGISTRY` · `getUndocumentedFlags()`

---

## 6. Production policy

| Policy | Requirement |
|--------|-------------|
| No surprise behaviour | Every production restriction documented |
| Disabled = documented | Reason + activation rules in registry |
| Feature flags | All env gates in FEATURE_FLAG_REGISTRY |
| Runtime limitations | Brain Runtime + Production Mode aligned |
| Designed ≠ Enabled | productionState is authoritative for live ops |

---

## 7. Pillow & Supervisor

**Pillow** continuously evaluates: Production Drift · Configuration Drift · Feature Drift · Capability Drift · Production Readiness.

**Supervisor** continuously reports: Production Mode · Feature Availability · Runtime State · Configuration Health · Deployment Status.

**Runtime:** `analyzeProductionDrift()` · `validateForSupervisorSync()` · `getGrandKingSummary()`

---

## 8. Integration map

| Surface | Path |
|---------|------|
| Production Mode engine | `pillow/src/production-mode/engine.ts` |
| Component registry | `pillow/src/production-mode/component-registry.ts` |
| Feature flag registry | `pillow/src/production-mode/feature-flag-registry.ts` |
| Live snapshot bridge | `backend/src/orchestration/pillow-host/production-mode-bridge.ts` |
| Builder gate | Cursor Bridge + Cursor Protocol pre-mission checks |
| Cockpit | Production Mode panel · `GET /api/pillow/production-mode` |
| V1 activation | `backend/src/orchestration/version-1-activation/version-1-activation-config.ts` |

---

## 9. Grand King clarity (acceptance)

The Grand King shall immediately know **what is running · what is disabled · what is deferred · what requires configuration** without investigating the repository.

**Runtime:** `verifyGrandKingClarity()` · `grandKingSummary` on every assessment

---

## 10. Governance cross-references

- [`EMPIREAI_PRODUCTION_TRUTH.md`](./EMPIREAI_PRODUCTION_TRUTH.md) (P1-10)  
- [`EMPIREAI_BRAIN_RUNTIME_SYSTEM.md`](./EMPIREAI_BRAIN_RUNTIME_SYSTEM.md) (P5-01)  
- [`EMPIREAI_ENGINEERING_STANDARDS.md`](./EMPIREAI_ENGINEERING_STANDARDS.md)  
- [`EMPIREAI_DECISIONS.md`](./EMPIREAI_DECISIONS.md) — ADR-CON-002  

**Ratified:** 2026-07-05 (P5-02)

**Successor:** P5-03 — Sessions ✅ · P5-04 — Monitoring
