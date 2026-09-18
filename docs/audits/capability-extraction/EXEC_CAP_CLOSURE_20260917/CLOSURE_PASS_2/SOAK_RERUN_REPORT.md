# SOAK RERUN REPORT — Pass 2 blocker fix

**Final gate:** `PASS`  
**Terminal status:** `ENGINEERING_CANDIDATE_READY_FOR_INDEPENDENT_TESTING`  
**WAVE_CREDIT:** 0 · **Birth:** NOT_BORN · **Real commerce:** locked · **V53:** NOT_FOUND · **V42:** `V42_COMPATIBILITY_MAP` only

## Required fields

| Field | Value |
|-------|--------|
| Exact commit tested | `ab6ac3b771d97e694e45db4a7ddc4bcea713decc` |
| Exact command | `powershell -NoProfile -ExecutionPolicy Bypass -File docs/audits/capability-extraction/EXEC_CAP_CLOSURE_20260917/CLOSURE_PASS_2/soak/run-frozen-soak-120.ps1` (env: `SOAK_MINUTES=120`, `SOAK_TIP_SHA=ab6ac3b7…`, `SOAK_FILL_GAP_MS=45000`) |
| Soak duration | **120.16** continuous minutes |
| lostAdmitted | **0** |
| Restart retrieval | **PASS** (`pcr_c10ffc2329c44c83`, status COMPLETED, useful) |
| p95 latency | **5586 ms** (≤20s gate: **100%** within 20s) |
| Durability | **100%** (`durableRetrievableRate=1`; 100% within 90s) |
| Raw artifact path | `docs/audits/capability-extraction/EXEC_CAP_CLOSURE_20260917/CLOSURE_PASS_2/SOAK_RESULTS.json` |
| Final gate result | **PASS** |

## Blocker fixes applied (harness)

1. Admit only when durable `pcr_*` issued (transport errors ≠ admitted).
2. Restart proof uses last **COMPLETED** useful id (not in-flight `RUNNING`/`WORKER_UNAVAILABLE`).
3. `chat-request` polled until COMPLETED with `finalResult.message`.
4. Health-gated submits + paced short fills.

## Locks preserved

NOT_BORN · SYNTHETIC · realCommerceAuthorized=false · WAVE_CREDIT=0 · SC-01 FROZEN

Independent Overseer certification remains external — this is an engineering candidate only.
