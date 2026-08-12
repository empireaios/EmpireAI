# Production Incident — Birth Interrogation Paused

**Updated:** 2026-08-12  
**Birth authorised:** NO  
**Birth timestamp:** NULL  
**Prior Birth Test Board PROVEN results:** preserved; current readiness suspended until live recovery verified

## Systemic root cause

Railway Brain saturation / non-response under load (sql.js flush + expensive Pillow session/chat work):

- Live `/health` observed returning **502 Application failed to respond**
- High avg latency / ECONNRESET during incident window
- Cascades into: login failure (proxy timeout/502 mapped as Login failed), blank Executive Home (dossier/status timeout), Pillow “finishing startup” soft replies, delayed chat, continuity loss after session recreate

## Fixes shipped (this incident)

1. Auth proxy retries **including timeouts** (3 attempts)
2. Commissioning BFF timeout raised to dispatch budget (55s)
3. Workspace context carries `recentConversationTurns` for continuity after session recreate
4. Optimistic Grand King message render + processing state
5. Softer session recovery (retry same session before wipe; keep local history)
6. **Removed Float / Dock / Expand** — launcher → fixed Pillow Centre only
7. Enter sends in Pillow Centre composer (Shift+Enter newline)
8. Executive-loop boot tick deferred 60s → 180s (`1b72949c`)
9. CockpitTopBar **Ask AI** routes to Pillow Centre, not expand shell (`f504f378`)

## Live recovery verification (2026-08-12)

See `PRODUCTION_INCIDENT_LIVE_VERIFY_EVIDENCE.json`.

| Check | Result |
|---|---|
| Brain `/health` | 200 online; avgLatencyMs still elevated (~5.6s) |
| Executive Home truth | **PASS** — real data, not indefinite loading |
| Pillow one-product/run | **PASS** — Pillow selected humidifier `opc_72e69dc3` (Cursor did not pick) |
| Pillow Centre chat | **PASS** — optimistic GK bubble + thinking + reply `art_915d6687-083` |
| Float/Dock/Expand removed | **PASS** |
| TopBar → Pillow Centre | **PASS** on live (`f504f378`) — Ask AI → Pillow Centre |
| Logout → fresh login | **BLOCKED** — `EMPIRE_LOGIN_EMAIL` / `EMPIRE_LOGIN_PASSWORD` unset in agent env |
| Birth timestamp | **NULL** / COMMISSIONING |
| Safe to resume GK+ChatGPT Birth interrogation | **NO** |

## Residual (2026-08-12 ~07:59Z) — do not erase prior PASSes above

| Check | Result |
|---|---|
| Brain Railway `/health` direct | **FAIL** — 25s timeout, 0 bytes |
| `oneProduct` persistence | **REGRESSED** — null again after earlier Pillow selection PASS |
| TopBar → Pillow Centre | still **PASS** live |
| Birth timestamp | still **NULL** |

## Reliability repair (2026-08-12) — code shipped; durability proof pending deploy

See `PRODUCTION_INCIDENT_RELIABILITY_REPAIR.md` + `PRODUCTION_RELIABILITY_SOAK_EVIDENCE.json`.

| Item | Result |
|---|---|
| Brain saturation root cause | **IDENTIFIED** — sql.js sync export + boot ticks starve event loop |
| CQ-12 oneProduct null root cause | **IDENTIFIED** — deferred first flush (10m) lost on restart |
| Critical flush + durability mirror | **CODE SHIPPED** — await Railway/Vercel deploy + Pillow re-run proof |
| `/health/live` soak (12 rounds) | **12/12 OK**, p95≈1323ms (pre-deploy of repair commit) |
| Logout/relogin | **BLOCKED** — agent missing `EMPIRE_LOGIN_EMAIL` / `EMPIRE_LOGIN_PASSWORD` |
| Safe to resume Birth interrogation | **NO** until post-deploy durability + auth path verified |

## Closure update (2026-08-12 ~13:58Z) — commit `0042aa33`

| Check | Result |
|---|---|
| Deploy identity | **PASS** — `deploy.gitCommitSha=0042aa33…` deployment `229a7249` |
| Volume ENOSPC | **MITIGATED** — reclaim temps/corrupt; live `canFlushFullDb=true`, ~3.6GB free |
| Critical flush | **PASS** — `flushCount=2`, `criticalFlushSucceeded=2`, `lastFlushError=null` |
| oneProduct durable | **PASS** — `opc_a85a1cda` / `B0FKFNCT52` Pillow; survived controlled redeploy (no new mirror-restore note) |
| `/health/live` soak | **PASS** — 12/12, p95=651ms |
| Logout → fresh login | **PASS** — cockpit login/logout/relogin + bad-password messaging |
| Executive Home API | **PASS** — 5/5 `executive-home` load with `canonicalTruth` |
| Birth timestamp | still **NULL** |
| Birth status | **TECHNICALLY_READY_AWAITING_GRAND_KING** (gates 12/12 after hard-stop + capability harness re-run) |
| Safe to resume GK+ChatGPT Birth interrogation | **YES** — see BIRTH_READINESS_MATRIX.md |

## Data / persistence

No production database wipe performed.  
Commissioning / CQ evidence / Birth null state intentionally preserved.  
Post-`0042aa33`: commissioning row + durability mirror proven across redeploy; Hobby volume still near capacity for a second full DB copy — reclaim path must stay active.
