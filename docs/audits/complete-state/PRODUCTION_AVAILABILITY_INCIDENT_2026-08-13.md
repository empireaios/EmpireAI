# Production Availability Incident — Systemic Closure

**Incident window (user-observed):** 2026-08-13 ≈ 11:40–11:43 SGT  
**Investigation started from live evidence:** Brain `/health/live` → 502; Railway EmpireAI ● Crashed  
**Birth authorised:** NO  
**Birth timestamp:** NULL (must remain)  
**Preserves:** prior `PRODUCTION_INCIDENT_*`, Bootcamp report `ae113b5e`, grounding chain, durability evidence as historical record — not as current health proof.

## Previous state → new incident

| When | State |
|---|---|
| Pre-incident Bootcamp commit | `ae113b5e` — 30/30 mock PASS, sandbox-only, Birth NOT authorised |
| Pre-incident live Brain SHA | `d3dc4a21` (truth-grounding) was the last **running** deploy |
| Incident | Grand King cockpit Brain timeout → long “Checking session…” → “Authentication service unavailable” |
| Live probe during investigation | `https://empireai-production.up.railway.app/health/live` → **502**; BFF `/api/auth/me` → **502** |

## User-visible → request mapping

| UI message | Frontend locus | Upstream |
|---|---|---|
| “Empire Brain is taking longer than expected…” | `empireai-web/components/cockpit/shell/CockpitAuthGuard.tsx` | Cockpit bootstrap / Brain session+health path via BFF |
| “Checking session…” | `empireai-web/app/(auth)/login/page.tsx` | Session/`/api/auth/me` (or equivalent) pending |
| “Authentication service unavailable. Please retry.” | login page + `lib/brain/client.ts` / server-proxy | Correct classification of Brain/BFF 5xx/timeout — **not** invalid credentials |

Auth messaging from the prior reliability repair is **preserved and correct** for this outage. Correct messaging ≠ healthy auth.

## Proven causal chain

1. Production Brain on SHA **`d3dc4a21`** entered a **HA restart loop** (~every 10 minutes — aligned with first sql.js flush delay).
2. Logs show **event-loop lag** (often 0.5–8s+, spikes higher) with **sql.js flush** `lastFlushDurationMs ≈ 17–25s`, `pending:true`, plus boot ticks (executive loop + commerce presale) and volume reclaim of ~1.2GB temps.
3. Continuity watchdog (`stallExitMs` / `highLagExitMs`) **`process.exit(78)`** for Railway ON_FAILURE restart — intended HA — but residual post-flush lag ≥500ms sustained for 45s was enough to kill a recovering process (**death spiral**).
4. Railway eventually left deployment **`389ea513…` CRASHED**.
5. Recovery deploy **`1f6ca350…` of `ae113b5e` FAILED** at build time:
   - `scenario-factory.ts` TS1117 duplicate object keys (`product` / `financial`).
6. With no healthy successor, edge returned **502 Application failed to respond** → cockpit/session/login all correctly reported Brain/auth unavailable.

## Failure classification (evidence)

| Class | Verdict |
|---|---|
| A. Previous Brain/event-loop saturation recurrence | **YES** — sql.js sync export + background ticks |
| B. Different saturation mechanism | **PARTIAL** — same family; worsened by HA exit on mild residual lag |
| C. Boot/redeploy transient | **YES (amplifying)** — crash-loop → CRASHED; recovery deploy FAILED |
| D. CPU/memory exhaustion | Not primary from available logs |
| E. SQLite/volume contention | **CONTRIBUTING** — large DB export duration; reclaim present; volume not full (~3.4/4.9GB) |
| F. Railway/network/proxy/BFF | **YES (downstream)** — 502 when Brain down |
| G. Auth-specific defect | **NO** — unavailable classification correct; Brain was down |
| H. Frontend bootstrap | **NO** as root — UI waited on dead Brain |
| I. Background workload starvation | **YES** — automation + flush starved interactive path / triggered HA exits |
| J. Bootcamp-related | See dedicated section |

## Why previous repair did not prevent it

1. Flush-in-flight guard prevented stall-exit **during** `db.export()`, but **not** post-flush residual lag accumulation toward `highLagExitMs` at threshold 500ms / 45s.
2. Soak tests measured idle/short windows; they did not prove multi-hour crash-loop resistance after repeated 17s+ exports on a ~GB DB.
3. HA `process.exit(78)` without a successful successor deploy converts recoverable saturation into **hard unavailability**.
4. Bootcamp commit introduced a **TypeScript build break** that blocked the recovery deploy while the crashed SHA stayed dead.

## `ae113b5e` / Bootcamp relationship

**CONTRIBUTED (recovery blocker) / did NOT CAUSE the crash.**

| Fact | Evidence |
|---|---|
| Crash SHA | `d3dc4a21` on deployment `389ea513…` CRASHED |
| Bootcamp SHA | `ae113b5e` on deployment `1f6ca350…` **FAILED** (never went live) |
| Build error | TS1117 duplicate keys in `birth-bootcamp/scenario-factory.ts` |
| Runtime Bootcamp | On-demand route; not executed at boot; llmCalls=0 in mock report — **architecturally sandbox/on-demand**; crash logs show no Bootcamp runner |

## Systemic repair implemented

1. **Unblock deploy:** remove duplicate `product`/`financial` keys in Bootcamp `scenario-factory.ts`.
2. **Watchdog:** raise stall exit default 20s→45s; high-lag **exit** threshold 500→2000ms; exit sustain 45s→120s; boot grace 60s→180s; **post-flush cooldown** (≥90s or 3× flush duration); flush guard ceiling 90s→180s.
3. **Lag ghost clear:** after `db.export()`, `clearEventLoopLagAfterKnownBlock` so residual export sample cannot keep admission closed / feed HA exit.
4. **Admission:** refuse expensive background work while `flushInFlight`.
5. **Regression test:** watchdog + lag-clear unit coverage.

## Regression protection

- Build must compile Bootcamp sources (TS1117 would fail CI/Railway again).
- Watchdog defaults no longer treat mild residual lag as fatal.
- Admission refuses work during flush.
- Continuity health + sqlite persist stats remain on `/health` surfaces for pre-user degradation signals.

## Birth state (unchanged by design)

- Birth examination **not** started  
- Birth timestamp **NULL**  
- Bootcamp remains mock training evidence only  
