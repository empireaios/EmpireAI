# EMPIREAI DURABLE SESSION ARCHITECTURE

> **Classification:** CANONICAL — Tier 3 Law (Governance · Session Continuity)  
> **Document ID:** P5-03 · SESSION_ARCHITECTURE  
> **Constitutional phase:** P5 — Runtime Foundation (**THIRD ITEM**)  
> **Dependencies:** P5-02 complete  
> **Owner:** Chief Architect · Pillow COI · Grand King · Supervisor  
> **Authority:** **Single permanent Durable Session Architecture** — no competing session doctrines  
> **Companions:** [`EMPIREAI_PRODUCTION_MODE.md`](./EMPIREAI_PRODUCTION_MODE.md) (P5-02) · [`EMPIREAI_JOURNEY_SYSTEM.md`](./EMPIREAI_JOURNEY_SYSTEM.md) (P4-08) · [`EMPIREAI_BRAIN_RUNTIME_SYSTEM.md`](./EMPIREAI_BRAIN_RUNTIME_SYSTEM.md) (P5-01)  
> **Runtime:** `pillow/src/durable-sessions/` · **PILLOW-DS-001**

---

## 1. Purpose

P5-02 established the Production Mode Doctrine. P5-03 establishes the permanent **Durable Session Architecture**.

EmpireAI must preserve continuity. A restart · deployment · browser refresh · temporary infrastructure failure must not unnecessarily destroy operational state. Session continuity is a constitutional runtime capability.

---

## 2. Session principles

| Principle | Requirement |
|-----------|-------------|
| Survive browser refresh | localStorage turns + auth cookie |
| Survive controlled deployments | Redis auth · COI re-bootstrap |
| Survive Brain restart | Redis sessions · startPillow() recovery chain |
| Graceful transient failure recovery | Documented per-layer recovery |
| Secure | Opaque tokens · HttpOnly cookies · workspace scope |
| Traceable | Journey events · audit logging |
| Constitutional ownership | No session violates subsystem ownership |

**Runtime:** `SESSION_LAYER_REGISTRY`

---

## 3. Governed session domains

Authentication · Executive · Pillow · Builder · Supervisor · Journey · Mission · Production · Browser · API.

**Runtime:** `SESSION_DOMAINS`

---

## 4. Session lifecycle

```
Session Created → Authenticated → Active → Persisted → Recovered → Resumed → Expired → Archived
```

**Runtime:** `SESSION_LIFECYCLE_STATES`

---

## 5. Session layer registry

| ID | Layer | Durability | Persistence |
|----|-------|------------|-------------|
| DS-AUTH | Authentication Session | durable | Redis / in-memory fallback |
| DS-EXEC | Executive Council Session | durable | SQLite ec_* |
| DS-PILLOW-HOST | Pillow Host Workspace Session | ephemeral | In-memory Map |
| DS-PILLOW-COI | Pillow COI Runtime Session | recoverable | In-process singleton |
| DS-BUILDER | Builder Mission Session | semi_durable | Artifacts on disk |
| DS-SUPERVISOR | Supervisor Mission Session | ephemeral | In-memory registry |
| DS-JOURNEY | Journey Session | semi_durable | Event store + JOURNEY.md |
| DS-MISSION | Mission Planner Session | recoverable | Repository rebuild |
| DS-PRODUCTION | Production Mode Session | recoverable | Env snapshot per request |
| DS-BROWSER | Browser Pillow Session | semi_durable | localStorage |
| DS-API | API Request Session | ephemeral | Request-scoped auth |

**Runtime:** `SESSION_LAYER_REGISTRY` · `getLayersByTier()`

---

## 6. Persistence models

| Model | Mechanism | Durability |
|-------|-----------|------------|
| Redis Auth Sessions | SETEX empireai:session:{token} | durable |
| In-Memory Auth Fallback | Map | ephemeral |
| SQLite User Store | users table | durable |
| Pillow Host Session Store | Map workspace:session | ephemeral |
| Browser localStorage | empireai:pillow:session:v1 | semi_durable |
| Executive Council SQLite | ec_* tables | durable |
| Supervisor Mission Registry | Map | ephemeral |
| Pillow COI Runtime Singleton | Module refs | recoverable |

**Runtime:** `PERSISTENCE_MODEL_REGISTRY`

---

## 7. Recovery flow

When a session is interrupted:

```
Detect interruption → Validate integrity → Recover state → Resume safely → Notify Supervisor → Record Journey event
```

**Runtime:** `executeSessionRecovery()` · `validateSessionIntegrity()`

| Scenario | Recovery |
|----------|----------|
| Browser refresh | localStorage turns survive · hostSessionId re-bound |
| Brain restart | Redis auth survives · COI startPillow() chain · chat lost (ephemeral) |
| Worker recovery | Separate worker.ts · BullMQ jobs in Redis |
| Queue recovery | Redis-connected BullMQ persists jobs |

---

## 8. Security

| Control | Implementation |
|---------|----------------|
| Session ownership | Workspace-scoped · server-side only for COI |
| Token lifecycle | Opaque random token · not JWT |
| Refresh policy | POST /auth/refresh (backend) |
| Expiration | SESSION_TTL_SECONDS (7 days default) |
| Revocation | destroy on logout |
| Encryption | SESSION_SECRET cookie signing |
| Audit logging | login · logout · pillow.session.create |

---

## 9. Pillow & Supervisor

**Pillow** continuously evaluates: Session health · Session continuity · Recovery success · Session drift · Session failures.

**Supervisor** continuously monitors: Active sessions · Recovered sessions · Expired sessions · Failed recoveries · Session latency · Session health.

**Runtime:** `analyzeSessionHealth()` · `validateForSupervisorSync()`

---

## 10. Integration map

| Surface | Path |
|---------|------|
| Durable Session engine | `pillow/src/durable-sessions/engine.ts` |
| Session registry | `pillow/src/durable-sessions/session-registry.ts` |
| Persistence registry | `pillow/src/durable-sessions/persistence-registry.ts` |
| Recovery | `pillow/src/durable-sessions/session-recovery.ts` |
| Live snapshot bridge | `backend/src/orchestration/pillow-host/durable-sessions-bridge.ts` |
| Builder gate | Cursor Bridge + Cursor Protocol pre-mission checks |
| Cockpit | Sessions panel · `GET /api/pillow/durable-sessions` |

---

## 11. Grand King acceptance

Refreshing the browser · restarting the Brain · recovering a worker · recovering a queue must not unnecessarily interrupt authenticated operational continuity — or where interruption is unavoidable, recovery is automatic, safe, and clearly reported.

**Runtime:** `verifyGrandKingContinuity()` · `grandKingSummary`

---

## 12. Governance cross-references

- [`EMPIREAI_PRODUCTION_MODE.md`](./EMPIREAI_PRODUCTION_MODE.md) (P5-02)  
- [`EMPIREAI_JOURNEY_SYSTEM.md`](./EMPIREAI_JOURNEY_SYSTEM.md) (P4-08)  
- [`EMPIREAI_ENGINEERING_STANDARDS.md`](./EMPIREAI_ENGINEERING_STANDARDS.md)  

**Ratified:** 2026-07-05 (P5-03)

**Successor:** P5-04 — Monitoring ✅ · P5-05 — Scaling
