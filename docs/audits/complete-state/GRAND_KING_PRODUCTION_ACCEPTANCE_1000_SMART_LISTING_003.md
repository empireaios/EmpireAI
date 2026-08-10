# GRAND KING PRODUCTION ACCEPTANCE + 1,000 SMART LISTING LAUNCH 003

## Gate A — Production UX

### Root cause of >2 minute usable load

Production Performance entries showed `/api/pillow/founder-shell` and `/api/pillow/commerce-operating-model` hanging **200–300s** while **30s polls stacked** without abort/timeout on the client. Secondary awareness blocked perceived usability.

### Repairs

- `fetchWithBudget` (12s abort) + in-flight guards
- Poll interval 60s; skip commerce-operating-model when Executive Home canonical truth exists
- Proxy already fail-fast for those GET paths
- Scroll: removed fixed 88vh Pillow prison; page scroll primary; history `max-h-[62vh]` with overscroll release
- Sidebar: `z-50` + `pointer-events-auto` + `self-start`
- Executive language layer: natural-language commerce surfaces; technical IDs under disclosure

### Gate A status

**PRODUCTION ACCEPTANCE READY** (engineering + production deployment verification required after this commit). Subjective Grand King acceptance is not claimed by Cursor.

## Gate B — 1,000 SMART viable listings

- KPI module: `backend/.../smart-viable-kpi.ts` (target 1000, CJ × Amazon US)
- Presale cycle supports `smartViableBatch` (evaluate page, continue after first qualify, ≤1 approval)
- Automation tick uses smartViableBatch max 24
- Tools/routes: `smart-viable-kpi`, run-cycle flags
- Architecture principle: `docs/architecture/SUPPLIER_MARKETPLACE_UNIVERSE_PRINCIPLE.md`

SAFE: no publish / no supplier spend in discovery batch.
