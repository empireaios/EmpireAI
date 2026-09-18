# CLOSURE_PASS_2 — START HERE

**Mission:** EXEC_CAP_CLOSURE_PASS_2  
**Parent:** `../FINAL_REPORT.md` (PARTIAL_WITH_BLOCKERS)  
**Locks:** WAVE_CREDIT=0 · Birth=NOT_BORN · Real commerce=locked · SC-01=FROZEN · Wave 1=0/24

## Authority

Safe non-destructive engineering/testing only. No Grand King decision required for remaining UI, soak, V42 map, or regressions.

## Workstreams (max 3)

| ID | Deliverable | Owner | Output | Timeout | Terminal |
|----|-------------|-------|--------|---------|----------|
| WS-V | V53 search + V42 compatibility map | integ | `V53_SEARCH_AND_V42_MAPPING.md`, `V42_COMPATIBILITY_MAP.json` | 30m | PASS / FAIL / BLOCKED |
| WS-U | Secret-safe Playwright UI proof | integ | `UI_PROOF.md`, `UI_PROOF.json`, `screenshots/` | 60m | PASS / FAIL / BLOCKED |
| WS-S | ≥2h soak | integ | `SOAK_*.json*`, `SOAK_PLAN.md` | 150m | PASS / FAIL / BLOCKED |

Checkpoint: `CHECKPOINT.json` (≥ every 15 minutes during soak).

## Terminal statuses

- `ENGINEERING_CANDIDATE_READY_FOR_INDEPENDENT_TESTING` — only if UI + soak + regressions pass and V53/V42 treatment is honest
- Otherwise `PARTIAL_WITH_BLOCKERS`

Cursor does **not** declare independent executive certification.

## Read next

1. `CHECKPOINT.json`
2. `V53_SEARCH_AND_V42_MAPPING.md`
3. `UI_PROOF.md`
4. `SOAK_RESULTS.json`
5. `FINAL_REPORT.md` / `HANDOFF.json`
