# GK Chat Infrastructure Path Parity — Closure

**MISSION_TYPE:** INFRASTRUCTURE_PATH_PARITY  
**SEVERITY:** P0 — CERTIFICATION BLOCKER  
**WAVE_1:** PAUSED  
**WAVE_CREDIT:** 0  
**BIRTH_AUTHORISED:** NO  
**TARGET_CLOSED:** YES  
**GK_PATH_EQUIVALENCE:** YES  

## SHAs / deployment

| Field | Value |
|---|---|
| BASELINE_SEMANTIC_SHA | `b5928344` |
| FINAL_SEMANTIC_SHA | `b5928344` (Pillow arithmetic unchanged; infra-only commits after) |
| INFRA_FIX_SHA | `1d0f5c59` |
| DOCTRINE_SHA | `3be182a7` |
| RUNNING_BRAIN_SHA | null on `railway up` (expected) |
| DEPLOYMENT_ID | `08943019-2814-47c9-ab20-416e489258b5` |
| FRONTEND_DEPLOYMENT | Vercel production for `empire-ai.co` (BFF route from `1d0f5c59`+) |
| DOCS_SEAL_SHA | `e5f9815c` |

Pillow semantic code was **not** modified in this mission.

---

## A. Exact infrastructure-message producer

| Field | Value |
|---|---|
| MESSAGE_PRODUCER_FILE | `empireai-web/app/api/pillow/[...path]/route.ts` (primary visible path); also `backend/src/runtime/pillow-accepted-request-recovery.ts` → `buildTerminalInfrastructureMessage`; FE mirror `empireai-web/lib/pillow/executive-surface.ts` → `EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY` |
| MESSAGE_PRODUCER_FUNCTION | BFF chat branch that returned `DEGRADED_CHAT_MESSAGE`; Tier-0 `buildTerminalInfrastructureMessage` on recovery exhaustion |
| MESSAGE_PRODUCER_LAYER | **BFF (primary false-positive)** + Tier-0 accepted-request recovery (true budget exhaustion) |
| TRIGGER_CONDITION (proven false-positive) | Upstream 2xx with non-empty executive answer containing protected-state footers (`product focus`, `realised commerce`, `Birth remains…`) on non-Birth / synthetic asks → `looksLikeForbiddenInfraDecoration` → **entire answer replaced** with infrastructure-budget terminal |
| TRIGGER_CONDITION (true infra) | Empty message, non-2xx upstream, worker proxy timeout text, or Tier-0 recovery exhausted |
| TRIGGERED_LIMIT (false-positive) | Not a wall-clock/token budget — **BFF sanitize misclassification** |
| LIMIT_VALUE | N/A for false-positive; true budgets: FE 290s / BFF 280s / Tier-0 260s (attempt1 200s + attempt2 50s) |
| OBSERVED_VALUE | Unit proof: good NovaCart answer + product-focus footer → degrade=true **before** fix; after fix → strip footers, keep Select/14.60 |
| RECOVERY_PATH | In-request Tier-0 retry only (`runAcceptedPillowChatRecovery`); **no durable queue** |
| RECOVERY_OWNER | Tier-0 primary process (same HTTP request) |
| RECOVERY_EVENTUALLY_EXECUTES | **NO** after HTTP response ends — “retains ownership for internal recovery” is UX/policy language, not a background worker |

---

## B. Two failure request evidence

| Failure | Observation | REQUEST_ID |
|---|---|---|
| A — larger NovaCart bounded supplier decision | Exact infrastructure-budget terminal; no executive reasoning visible | **UNKNOWN** (not retained in-repo; `/api/pillow/health` recent empty after worker recycle) |
| B — shortened NovaCart within envelope | Same terminal text; falsifies “prompt too large” as sole cause | **UNKNOWN** |

Deploy identity at failure time cannot be proven from retained IDs. Live Brain at closure: `08943019-2814-47c9-ab20-416e489258b5`.

---

## C–E. Paths and differential

### ACTUAL_GK_PATH
```
Pillow Centre UI (SCR-800)
→ sendPillowChat (290s)
→ POST https://empire-ai.co/api/pillow/chat
→ BFF proxyPillow (280s, decorate/sanitize)
→ Tier-0 primary (accepted-request recovery)
→ Brain worker POST /api/pillow/chat
→ LLM / synthesizers
→ response JSON result.message
→ BFF surface decision
→ UI toExecutiveChatMessage
```

### HARNESS_PATH (pre-fix)
```
Script login → forceNew session → POST empire-ai.co/api/pillow/chat
workspaceContext.screenId often "pillow-centre" (not SCR-800)
Synthetic-prefixed arithmetic prompts → answers usually without product-focus footers
→ BFF degrade not triggered → false PRODUCTION PASS
```

### CAPABILITY_HARNESS_PATH / PRODUCTION_GRADER_PATH
Same BFF host as GK, but historically different `screenId`, `forceNew: true` every case, Synthetic prefixes, and **ignored** `bffRecovery` as a readiness fail signal.

### First material divergence
**FIRST_MATERIAL_PATH_DIFFERENCE:** BFF treated substantive executive answers with protected-state footers as infrastructure failures and substituted the budget terminal. Harness probes that returned clean calculator/decision text without those footers never hit the false-positive.

Secondary: Tier-0 Fastify `requestTimeout: 150_000` undercut documented 260s recovery budget (code comment vs value mismatch).

### SAME_PROMPT_DIFFERENTIAL_ESTABLISHED
**YES** — `GK_CHAT_PATH_PARITY_DIFFERENTIAL.json` (6 probes, infraCount=0 on then-current deploy) + unit proof of BFF false-positive on NovaCart+footer.

---

## F–G. Budget accounting

| Dimension | Status |
|---|---|
| CONTEXT_BUDGET_ACCOUNTED | Partial — short GK-path probes succeeded; full warm-browser history token counts for NovaCart failures = **UNKNOWN** (no request telemetry retained) |
| EXECUTION_BUDGET_ACCOUNTED | YES for coded limits (FE/BFF/Tier-0). False-positive path was **not** budget exhaustion |
| MODEL_REASONING_OCCURRED | **YES** (likely) for false-positive class — model/synth produced answer then BFF replaced it |
| MODEL_OUTPUT_EXISTED | **YES** for false-positive class |
| OUTPUT_LOST_AFTER_MODEL | **YES** at BFF sanitize layer (pre-fix) |

---

## H. Accepted-request / recovery

| Field | Finding |
|---|---|
| PENDING_ACCEPTED_REQUESTS | 0 durable (none persisted) |
| STALE_REQUESTS | N/A — in-memory accept object dies with HTTP request |
| OLDEST_AGE | N/A |
| RECOVERY_QUEUE_HEALTH | No queue — **not a backlog system** |
| ACCEPTED_REQUEST_RECOVERY_STATUS | In-request retry only; no later UI delivery |

Safe recovery stress test: not performed against production (would require inducing worker failure). Behavior proven by unit tests in `pillow-accepted-request-recovery.test.ts`.

---

## I–K. Root cause and fix

| Field | Value |
|---|---|
| PRIMARY_ROOT_CAUSE | **PATH_MISMATCH** / BFF false infrastructure degrade (`FRONTEND/BFF` sanitize) |
| SECONDARY_ROOT_CAUSES | EXECUTION_TIMEOUT hierarchy bug (Fastify 150s < Tier-0 260s); worker restart volatility observed historically |
| FIX_LAYER | Infrastructure (BFF + Tier-0 primary) — **no Pillow semantic edits** |
| FIX_IMPLEMENTED | YES |

### Fix details (`1d0f5c59`)
1. `empireai-web/lib/pillow/bff-chat-sanitize.ts` — strip protected footers; degrade only on empty / non-2xx / transport failure.
2. BFF route uses `decideBffChatSurface`.
3. Tier-0 `requestTimeout` raised **150s → 300s**.

Permanent doctrine: `GK_PATH_EQUIVALENCE_DOCTRINE.md`.

---

## L. Permanent GK-path qualification route

**Name:** `GK_PATH_QUALIFICATION`  
**Script:** `backend/scripts/gk-path-qualification.mjs`  
**Evidence:** `GK_PATH_QUALIFICATION.json`

Must report `GK_PATH_EQUIVALENCE=YES` before any `PRODUCTION_FIRST_VISIBLE_PASS` may be used as Grand King readiness evidence.

---

## M. Post-fix GK-path results

| Metric | Value |
|---|---|
| POST_FIX_GK_PATH_CASES | **12** |
| POST_FIX_INFRASTRUCTURE_FALLBACK | **0** |
| failures | 0 |
| LATENCY_P50_MS | 3407 |
| LATENCY_P95_MS | 17905 |

Cases covered: arithmetic, multi-gate, open strategy, bounded supplier (NovaCart-style), live unknown fact, warm transition, pct fee, negative contribution, missing fee, mixed FX, hard-gate definition, operating brief.

---

## N. Execution envelope

| Field | Value |
|---|---|
| GK_PATH_RELIABLE_ENVELOPE | **≥10** short first-visible obligations on GK-equivalent BFF path (12/12 PASS; no mega A–U) |

---

## O. G1 / G2 / G4 preservation

| Gate | Result |
|---|---|
| G1_OPEN_STUB | **CLEARED** (open_strategy case; no Unsupported takeover) |
| G2_WARM_TRANSITION | **CLEARED** (warm_transition case) |
| G4_ARITHMETIC | **CLEARED** (arith / pct_fee / 14.60 / 15.76) |
| PRESERVE_MATERIAL_REGRESSION | **0** |

---

## P. Representative review

≥10 first-visible GK-equivalent outputs inspected via `GK_PATH_QUALIFICATION.json`.

| Check | Result |
|---|---|
| COMPLETED_EXECUTIVE_ANSWER | YES |
| NO_INFRASTRUCTURE_FALLBACK | YES |
| NO_STUB_TAKEOVER | YES |
| ARITHMETIC_PRESERVED | YES |
| MATERIAL_ANOMALIES | 0 |
| KNOWN_P0 | 0 |
| KNOWN_P1 | 0 |

---

## Q. Latency

| Metric | Value |
|---|---|
| GK_PATH P50 | 3407 ms |
| GK_PATH P95 | 17905 ms |
| EXTRA_LLM_CALLS (infra fix) | 0 |

---

## R. Remaining weaknesses

- NovaCart FAILURE A/B **request IDs** were not recoverable from retained telemetry.
- Accepted-request “ownership” language still overstates durability (no async recovery worker).
- Extremely warm multi-hour browser sessions were not byte-accounted; short/warm GK-path probes pass.
- Worker restart counts can still cause **true** infra terminals under stall — monitored separately from false-positive sanitize.

---

## S. Wave status

```
WAVE_1=PAUSED
WAVE_1_CLEAN_STREAK=0
WAVE_CREDIT=0
BIRTH_AUTHORISED=NO
```

Do **not** award Wave credit. Do **not** replay NovaCart. ChatGPT issues new W1-T1.

---

## T. Exact next action

**STOP.** Return to Grand King + ChatGPT.  
`CURSOR_MISSIONS_BEFORE_NEXT_PILLOW_TEST=0`.

---

## Final stop block

```
MISSION_TYPE=INFRASTRUCTURE_PATH_PARITY
TARGET_CLOSED=YES
GK_PATH_EQUIVALENCE=YES
WAVE_CREDIT=0
WAVE_1=PAUSED
WAVE_1_CLEAN_STREAK=0
BIRTH_AUTHORISED=NO

STOP.
```
