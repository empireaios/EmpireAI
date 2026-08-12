# Production Reliability Repair — Brain Saturation + CQ-12 Durability

**Updated:** 2026-08-12  
**Preserves:** prior `PRODUCTION_INCIDENT_*` PASSes / FAIL residual rows  
**Birth authorised:** NO  
**Birth timestamp:** NULL  

## Defect classification

### 1. Brain saturation / `/health` timeout

| Field | Value |
|---|---|
| **ROOT CAUSE** | Single-threaded Node event-loop starvation. sql.js synchronous `db.export()` plus boot-time expensive ticks (presale/executive loop) and client polls prevent even lightweight `/health/live` from running within Railway edge timeouts. Heavy `GET /health` (guardian integrity + Redis queue) amplifies when used as a probe. |
| **FIX** | (a) `/health` skips heavy guardian/queue work under lag or flush-in-flight; (b) admitExpensiveWork gates executive-loop + presale ticks; (c) presale boot delay default 240s (already deferred); executive loop admission + prior 180s boot delay retained; (d) Railway remains on `/health/live`. |
| **PRODUCTION EVIDENCE** | Pre-fix residual: Railway `/health` 25s timeout 0 bytes. Post-soak (pre-deploy of this commit still): `/health/live` 12/12 OK, p95≈1323ms — see `PRODUCTION_RELIABILITY_SOAK_EVIDENCE.json`. |
| **STATUS** | **PARTIAL** until post-deploy soak confirms under background ticks; code fix shipped this commit. |

### 2. Authentication “Login failed”

| Field | Value |
|---|---|
| **ROOT CAUSE** | Downstream of Brain saturation — BFF/proxy timeouts/502 mapped to generic UI “Login failed”, not wrong credentials. |
| **FIX** | Client login maps network/empty-body/5xx to explicit unavailable/timeout messages; never bare “Login failed” for backend unavailability. Auth retries retained from `5c34dbe3`. |
| **PRODUCTION EVIDENCE** | Code path verified; credentialed logout/relogin still BLOCKED (no EMPIRE_LOGIN_* in agent env). |
| **STATUS** | **PASS** (messaging) / **BLOCKED** (logout-relogin verify) |

### 3. `oneProduct = null` after prior Pillow selection

| Field | Value |
|---|---|
| **ROOT CAUSE** | Authoritative row is SQLite `pillow_one_product_commissioning`, held in sql.js memory until deferred disk flush (default first flush delay **10 minutes**). Railway restart / watchdog exit before flush loses the row. Flight recovery fails if flight + opportunities also wiped. |
| **FIX** | (a) Write-ahead **commissioning durability mirror** JSON beside `DATABASE_PATH` on every persist; (b) restore into SQLite on read miss; (c) `requestCriticalPersist()` bypasses first-flush delay and lag-skip for commissioning writes. Cursor does not select products. |
| **PRODUCTION EVIDENCE** | Unit test PASS `commissioning-durability-mirror.test.ts`. Live `oneProduct` still null until post-deploy Pillow `one-product/run` + persistence proof. |
| **STATUS** | **FIX SHIPPED — DURABILITY PROOF PENDING DEPLOY** |

## Grand King Action (credentials only)

Logout/relogin automated verify cannot run in Cursor agent shell.

| Variable | Where to set | Redeploy? |
|---|---|---|
| `EMPIRE_LOGIN_EMAIL` | Cursor agent / local shell env for `backend/scripts/production-incident-live-verify.mjs` | No |
| `EMPIRE_LOGIN_PASSWORD` | Same (do not commit) | No |
| Optional aliases | `FOUNDER_EMAIL` / `FOUNDER_PASSWORD` also accepted by scripts | No |
| Railway | `FOUNDER_EMAIL` / `FOUNDER_PASSWORD` already used for Brain user seed — separate from Cursor agent env | Only if changing seed password |

## Final gates (pre-deploy of this repair)

See end of companion JSON / chat report after deploy verification.
