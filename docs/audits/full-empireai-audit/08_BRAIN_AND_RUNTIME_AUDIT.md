# 08 — Brain and Runtime Audit

---

## Brain Composition (`createBrain`)

**File:** `backend/src/brain/index.ts`

| Component | Active | Notes |
|-----------|--------|-------|
| SessionStore (Redis) | ✅ | Falls back to in-memory |
| AuditLogger | ✅ | SQLite insert per write (debounced persist) |
| MemoryStore | ✅ | |
| EventBus | ✅ | Redis or local |
| ToolRegistry | ✅ | 200+ tools |
| LLMRouter | ✅ | 45s timeout (`9e51bc7`) |
| DecisionEngine | ✅ | |
| TaskQueue (BullMQ) | 🟡 | Degraded no-op without Redis |
| AgentManager | ✅ | |
| WorkflowEngine | ✅ | |
| Orchestrator | ✅ | Dispatch hub |
| Scheduler | 🟡 | Disabled at production boot |
| WorkerPool | 🟡 | Disabled at production boot |
| Guardian | ✅ | Optional GUARDIAN_ENABLED |

---

## Fastify App (`app.ts`)

### Production boot strategy
- `earlyListen: true` — HTTP before full route registration
- Workers/scheduler off at boot in production
- Deferred `bootstrapFoundation` via `setImmediate`
- Extension routes skipped unless env flag

### Route phases
1. **Always:** Auth, health, metrics, guardian
2. **Critical:** Pillow, `/brain/dispatch`, `/brain/events/stream`
3. **Extension (~150 modules):** Only if `EMPIRE_ENABLE_EXTENSION_ROUTES=true` after 10min defer

---

## Event Loop & Responsiveness

**Module:** `backend/src/runtime/event-loop-cooperative.ts`

| Feature | Purpose |
|---------|---------|
| Lag monitor | 500ms tick, warn at 200ms |
| `cooperativeYield()` | Used by Executive Home assembly |
| `/health/live` exposes `eventLoopLagMs` | Production observability |

**Historical incidents fixed:**
- Sync SQLite persist on every write → debounced async (`9e51bc7`)
- Executive Home blocking → async loader with yields (`b21c6f5`–`62705a9`)
- Extension route registration blocking → opt-in flag (`cf21c81`)

---

## SQLite

**File:** `backend/src/brain/sqlite-database.ts`

- Driver: sql.js (WASM)
- Default path: `./data/empireai-brain.db` or Railway `/data/`
- **Debounced persist:** 250ms batch, async writeFile
- **Risk:** Single writer; crash before flush may lose recent writes
- **Stats on /health/live:** flushCount, lastFlushDurationMs, pending

**Schema:** Large migration in `backend/src/brain/database.ts` — users, audit, commerce, governance, Grand King, etc.

---

## Redis & Queues

**File:** `backend/src/config/redis-client.ts`

- Production expects Upstash REDIS_URL
- `shouldAllowRedisDegradedMode()` false in production — but Brain **continues degraded** if unreachable (logs error, does not exit)
- BullMQ queue: `empireai-brain-tasks`
- DegradedTaskQueue: logs only, fake job IDs

---

## Auth & Sessions

| Path | Behavior |
|------|----------|
| `POST /auth/login` | SQLite user + Redis session + audit |
| Middleware | Bearer or cookie `empireai_session` |
| Redis down | In-memory sessions — **lost on restart** |
| Default passwords in env schema | **Risk if not overridden** |

---

## Executive Home Dispatch

**Loader:** `domain/services/executive-home-loader.ts`
- 60s cache, 90s timeout, in-flight dedupe
- Lite operational command path in production (`62705a9`)
- Warmup **removed** (blocked login post-deploy)

---

## Health Endpoints

| Endpoint | Auth | Key fields |
|----------|------|------------|
| `/health/live` | No | status, brain, eventLoopLagMs, sqlite |
| `/health` | No | redisMode, guardian, queue stats |
| `/guardian/health` | Yes | Full check |
| `/metrics` | Admin | Observability |

---

## Runtime Modules (`backend/src/runtime/`)

~613 TypeScript files — REAL-071 through REAL-100+ domain runtimes.

**Production availability:** HTTP routes for most modules **not registered** unless extension flag set. Functionality may still be reachable via `/brain/dispatch` tools.

---

## API Surface Summary

| Category | Count | Production default |
|----------|------:|-------------------|
| Route registrars | ~160 | ~5 critical + auth + health |
| Pillow routes | 9 | ✅ |
| Auth routes | 4 | ✅ |
| REAL module HTTP | ~150 | ❌ unless flag |

---

## Long-Running Task Architecture

| Mechanism | Location | Production |
|-----------|----------|------------|
| BullMQ workers | `worker.ts`, `worker-pool.ts` | Off at API boot |
| Scheduler | `brain/scheduler.ts` | Off at API boot |
| Grand King automation | `grand-king-automation-server.ts` | Interval timers if started |
| Connector scheduler | `eye/scheduler/` | Per connector |
| Pillow heartbeat | `pillow-host.ts` | 30s interval |
| SSE streams | EventStreamHub, Pillow SSE | Long-lived connections |

---

## Performance-Sensitive Paths

1. `loadExecutiveHomeForDispatch()` — cached, cooperative yields
2. `routePrompt()` production — minimal path + LLM
3. SQLite persist — debounced
4. `registerEmpireExtensionRoutes()` — breathes between modules
5. Audit logger writes — batched via SQLite debounce

---

## Brain Health Summary

| Area | Status |
|------|--------|
| Core composition | **Healthy** |
| Production responsiveness | **Improved** (post-9e51bc7 long-run test pass) |
| Scalability | **Limited** (single process) |
| Session durability | **Risk** (Redis dependency) |
| Module HTTP completeness | **Reduced in production** |
| Test coverage | **Strong** (256 backend validation tests) |
