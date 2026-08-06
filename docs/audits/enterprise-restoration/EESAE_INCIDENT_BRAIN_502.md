# EESAE Awareness Record — Production Brain 502 (2026-08-06)

| Field | Value |
|-------|-------|
| Record ID | `EESAE-INC-2026-08-06-BRAIN-502` |
| Detected condition | Production Brain HTTP 502 Bad Gateway on `/health/live`, `/auth/*`, `/api/pillow/session`, `/brain/dispatch` |
| First observed | ~2026-08-06T04:41Z (UTC) in Railway HTTP logs; sustained through Phase 1 freeze ~06:32Z |
| Affected service | Railway service `EmpireAI` (`empireai-production.up.railway.app`) |
| Deployment at detection | `ee7af911-070c-43f3-9701-2f2ea1a74998` @ commit `a4355be1` |
| User/business impact | Grand King cannot rely on production login/session/Pillow; cockpit UI loads but Brain-backed surfaces hang or fail |
| Probable root cause | sql.js synchronous full-database `export()` thrash (HEAD default debounce 250ms) saturating Node event loop (observed lag 25–54s+); Railway edge times out at ~15s → 502. Secondary: no persistent volume (now remediated) + ephemeral DB path risk |
| Evidence | Railway runtime logs (`Event loop lag detected`); HTTP logs (502 @ 15000ms); Phase 1 JSON; forensics MD |
| Repair status | IN PROGRESS — code thrash hardening + quarantine recovery + continuity watchdog; Railway volume `/data` attached; `DATABASE_PATH` and `SQLITE_*` vars set; awaiting commit/push/redeploy verification |
| Recommended action | Deploy thrash-hardened commit; verify repeated `/health/live` 200; login + Pillow E2E; confirm volume persists DB |
| Final resolution | PENDING post-deploy verification |

## Awareness surface notes

- EESAE CRT module is certified in repository (`a4355be1`).
- This record is the durable executive awareness artifact for the 502 incident.
- Live automatic Railway→EESAE continuous telemetry must be re-verified after Brain recovery; until then classify continuous prod telemetry as **limited / reconnect required**, not falsely fully automated.
