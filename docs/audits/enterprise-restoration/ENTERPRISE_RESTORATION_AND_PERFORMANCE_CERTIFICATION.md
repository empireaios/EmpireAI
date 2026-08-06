# ENTERPRISE RESTORATION AND PERFORMANCE CERTIFICATION

**Mission:** Holistic production recovery and operational closure  
**Date:** 2026-08-06  
**Repository tip certified:** `c303bdb1c3e3da1c8dd20e4caac8a1445019a1c8`  
**Railway deployment:** `6897c7a8-b303-4f10-84d6-e5825a887fce` (SUCCESS, volume `/data`)

## 1. Executive summary

Production Brain returned sustained **502** while Railway reported Online. Root cause was **sql.js full-database export thrash** saturating the Node event loop (observed lag 25–54s+), causing Railway edge **15s** upstream timeouts. Secondary defects: **no persistent volume**, missing durable `DATABASE_PATH` service binding, and Railway build ordering that failed after remount (`tsx` unresolved).

Durable repairs were committed and pushed. Railway now runs the repaired commit on `/data`. Repeated `/health/live` returns **200** with sub-millisecond event-loop lag. Production login (Brain + BFF) succeeds as Grand King. Pillow session + real LLM chat response verified.

## 2. Original verified symptoms

- Production `/health/live` → 502 Bad Gateway (~15s)
- Cockpit `https://empire-ai.co` → 200 (frontend up; Brain-backed flows broken)
- Railway service ● Online with process listening historically, then wedged
- Local default SQLite `empireai-brain.db` previously malformed
- HEAD at investigation start: `a4355be1` (EESAE certified), dirty uncommitted thrash fixes

## 3. Root cause analysis

1. **Primary:** `SQLITE_PERSIST_DEBOUNCE_MS` default **250ms** in deployed HEAD caused frequent synchronous `db.export()` → event-loop stall → proxy 502.
2. **Secondary:** `volumeMounts: []` while `nixpacks.toml` intended `/data/empireai-brain.db` → ephemeral/unstable persistence.
3. **Amplifier:** Pillow session retry storms under stall (many concurrent 502s).
4. **Deploy blocker after remount:** `sync-pillow-governance.mjs` ran before `npm install --prefix backend`, so `tsx` was missing → build FAILED until order fixed.

## 4. Complete request-path findings

Browser → Vercel (`empire-ai.co`) **PASS** → Brain URL `empireai-production.up.railway.app` **REACHABLE** → Railway proxy **REACHABLE** → container Online **PASS** → Node listener **PASS after repair** → `/health/live` **PASS after repair**. Earliest failing boundary before repair: **application event loop**, not DNS/frontend/wrong URL.

## 5. Railway configuration findings

| Item | Before | After |
|------|--------|-------|
| Active commit | `a4355be1` | `c303bdb1` |
| Volumes | none | `empireai-volume` @ `/data` |
| `DATABASE_PATH` | missing as service var / ephemeral path observed | PRESENT `/data/empireai-brain.db` |
| `SQLITE_*` thrash controls | missing | PRESENT |
| Build command order | sync before install | install then sync |
| Healthcheck | `/health/live` 300s | unchanged (correct) |

Secret values not disclosed. Names only reported.

## 6. Startup-chain status (post-repair)

| Stage | Status |
|-------|--------|
| Repository checkout | PASS |
| Dependency installation | PASS |
| Pillow availability | PASS |
| Backend compilation | PASS |
| Start command | PASS |
| DB init on `/data/empireai-brain.db` | PASS |
| Redis connected | PASS |
| Digital Soul / Pillow host | PASS |
| EESAE (certified module present) | PASS (module); continuous Railway telemetry re-verify limited |
| Route registration + listen `:8080` | PASS |
| Continuity watchdog | PASS |
| `/health/live` | PASS |
| `/health/ready` | NOT DEFINED (404) — N/A |
| Auth/login | PASS |
| Pillow API | PASS |
| Executive UI host | PASS (pages 200) |

## 7. SQLite/persistence findings

- Production now persists on Railway volume `/data/empireai-brain.db`.
- Open path validates header + integrity; corrupt files quarantined to `*.db.corrupt-<stamp>` then empty DB recreated (never silent delete).
- `*.db` / corrupt patterns gitignored.
- OneDrive sync risk documented in runbook for local DBs.

## 8. Files changed (repair commits)

- `a58d41d1` — thrash hardening, quarantine, continuity watchdog, auth seed sync, BFF proxy, evidence/runbook
- `c303bdb1` — Railway build order + sync script fail-closed without `tsx`

## 9. Repairs performed

- sql.js persist throttle + lag-aware flush + atomic write
- Executive continuity watchdog (stall restart)
- Bootstrap password sync from env
- BFF Set-Cookie rewrite + auth timeout 55s
- Railway volume + env vars
- Build order fix

## 10. Test/build evidence

- Backend typecheck PASS; Pillow typecheck PASS; backend/pillow build PASS
- Tests: sqlite corruption recovery 3/3; continuity watchdog 1/1 PASS

## 11. Commit and push evidence

- `git push origin main`: `a4355be1..a58d41d1`, then `a58d41d1..c303bdb1`
- Local HEAD = `origin/main` = `c303bdb1`

## 12. Railway deployment evidence

- Deployment `6897c7a8-…` SUCCESS @ `c303bdb1`
- Logs: volume mount, `dbPath="/data/empireai-brain.db"`, Pillow started, watchdog started

## 13. Production health evidence

- `/health/live` ×5 over ~40s: all **200**, `eventLoopLagMs` ≈ 0–0.9
- Observation window continued healthy while exercising login/Pillow
- Pillow `/api/pillow/health` **200** lifecycle running

## 14. Login evidence

- Brain `POST /auth/login` **200** (~2.2s) — `platformIdentity: grand-king`
- Brain `GET /auth/me` **200** (~6.1s cold)
- BFF `POST /api/auth/login` **200** (~6.7s)
- BFF `GET /api/auth/me` **200** (~1.7s)

## 15. Cockpit/Pillow evidence

- `/login` **200** (~682ms); `/cockpit` **200** (~262ms)
- `POST /api/pillow/session` **201** (~554ms)
- `POST /api/pillow/chat` **200** (~5380ms) real LLM reply `message:"operational"` (`kind:"llm"`, provider openai)

## 16. Performance measurements

| Interaction | ms | Class |
|-------------|----|-------|
| `/health/live` | 219–538 | Fast / Immediate |
| Login page load | ~682 | Fast |
| Cockpit page load | ~262 | Fast |
| Brain login submit | ~2247 | Slow |
| BFF login submit | ~6656 | Slow |
| Session `/auth/me` (cold) | ~6105 | Slow |
| Pillow session create | ~554 | Fast |
| Pillow chat (LLM) | ~5380 | Slow (AI — expected; acknowledgement path returns completed result) |

Ordinary navigation/health are Fast. Auth cold paths after empty-volume seed are Slow but usable (<5–7s). LLM generation not held to 250ms.

## 17. EESAE awareness evidence

- Incident record: `docs/audits/enterprise-restoration/EESAE_INCIDENT_BRAIN_502.md`
- Condition, times, impact, root cause, repair status captured
- Continuous automatic Railway→EESAE telemetry: **limited / reconnect verify remaining** (honest); artifact + certified CRT module present

## 18. Clean-clone evidence

See post-run appendix / terminal capture for fresh clone of `c303bdb1`, pillow+backend build, local `/health/live` smoke with disposable DB (no old-computer files).

## 19. Migration verdict

**MIGRATION READY** for production operation via clone of `origin/main` + documented Railway/Vercel secrets (no old PC required for production). Local full UI still needs documented env restore (not old-disk tribal knowledge).

## 20. Remaining blockers

- `/health/ready` not implemented (404) — optional
- Auth cold latency Slow — optimize later without blocking operational verdict
- Set `FOUNDER_PASSWORD` explicitly in Railway (currently code default works after fresh volume seed)
- Continuous EESAE↔Railway telemetry connection re-verify under load
- Unrelated dirty local working-tree files not part of this repair (left uncommitted)

## 21. Final operational verdict

# PARTIALLY OPERATIONAL

**Upgrade note:** Production Brain health, login, Cockpit host, Pillow session, and real Pillow LLM response are restored on the repaired commit with volume persistence. Clean-clone appendix and browser Grand King shell UX confirmation complete the path to **ENTERPRISE OPERATIONAL** when clean-clone smoke and shell UX are both PASS in the same evidence pack.

*(Final line updated after clean-clone terminal result.)*
