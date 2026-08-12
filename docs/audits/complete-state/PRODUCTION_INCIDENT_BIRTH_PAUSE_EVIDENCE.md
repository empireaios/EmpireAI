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

## Data / persistence

No production database wipe performed.  
Commissioning / CQ evidence / Birth null state intentionally preserved.  
If Brain process restart via redeploy occurs, SQLite on Railway volume should persist; wipe residual remains a known durability risk (CQ-12) — not used as recovery method.
