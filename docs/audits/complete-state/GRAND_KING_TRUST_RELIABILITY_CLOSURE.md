# Grand King Trust Reliability Closure

**Mission:** close Grand-King-visible availability failure; harden Tier-0; qualify 1000/1000.  
**Birth authorised:** NO  
**Birth timestamp:** NULL  
**Sealed exam executed:** NO  

## Incident classification (evidence)

| Cause | Classification |
|---|---|
| sql.js sync `db.export()` + background ticks → event-loop lag → HA `exit(78)` crash-loop → Railway CRASHED | **ROOT_CAUSE** |
| Residual lag after flush previously counted toward HA high-lag exit (500ms/45s) | **ROOT_CAUSE** (mechanism detail) |
| Bootcamp `ae113b5e` TS1117 failed recovery deploy | **CONTRIBUTING_FACTOR** |
| Correct UI “Authentication service unavailable” | **CORRELATED_ONLY** (correct symptom of Brain 502) |
| Frontend timeout values | **NOT_CAUSAL** |
| Grand King credentials | **NOT_CAUSAL** |

**Regression type:** COMBINATION of **B OLD LATENT DEFECT** (sql.js export starvation) + **E ARCHITECTURAL COUPLING** (HA exit → crash-loop) + **D WORKLOAD INTERFERENCE** + recovery-deploy failure.

## Systemic repair chain

1. `cfab44a0` — HA post-flush cooldown, higher exit thresholds, lag clear after export, admission during flush, Bootcamp build fix (deployed LIVE).
2. This closure — Tier-0 telemetry on `/health/live` + auth routes; post-flush admission pressure window; non-critical flush skip when `canFlushFullDb=false`; Trust Qualification harness; permanent unit sentinels.

## Trust Qualification distribution (1000)

| Class | Ops | Meaning |
|---|---:|---|
| TQ-A | 380 | `/health/live` |
| TQ-B | 220 | auth/me + invalid + stale + logout/relogin |
| TQ-C | 100 | Cockpit bootstrap (session + brain online) |
| TQ-D | 60 | Executive Home dispatch |
| TQ-E | 50 | Pillow health + bounded chats |
| TQ-F | 80 | Commissioning DB read |
| TQ-G | 40 | Persistence/disk/sqlite signals |
| TQ-H | 40 | Live during Executive Home |
| TQ-I | 20 | Deploy SHA stability |
| TQ-J | 10 | Degraded auth classification |

Harness: `backend/scripts/empireai-trust-qualification.mjs`  
Perfect-run: 1000/1000 or FAIL (stop on first failure).

## Closure status (2026-08-13)

| Item | Value |
|---|---|
| Active SHA | `afdc4ad9` |
| Triple-proof | PASS (journey + live-verify + coexist) |
| Trust Qualification | **1000 / 1000 / 0 = PASS** |
| Evidence | `EMPIREAI_TRUST_QUALIFICATION_EVIDENCE.json` |
| Birth timestamp | NULL |
| Birth authorised | NO |

### Additional repairs after resume

1. `cd204a29` — never force overdue sql.js flush under sticky lag (idle-only force).  
2. `afdc4ad9` — first flush delay 1h; HA flush guard 600s (observed exports ~237–283s).  
3. Railway env: `SQLITE_FIRST_FLUSH_DELAY_MS=3600000`, `EXECUTIVE_CONTINUITY_MAX_FLUSH_GUARD_MS=600000`.
