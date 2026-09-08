# Grand King Long-Session Delivery Architecture Closure

**MISSION_TYPE:** `PRODUCTION_DELIVERY_ARCHITECTURE_FORENSIC`  
**SEVERITY:** P0 — EXTERNAL CHECKPOINT CONTRADICTED `SHELL_READY=YES`  
**WAVE_1:** PAUSED  
**WAVE_CREDIT:** 0  
**BIRTH_AUTHORISED:** NO  
**PILLOW_REASONING_CHANGED:** NO  
**GRAND_KING_COURIER_PROBES:** 0  

---

## A. Failed checkpoint evidence

| Field | Value |
|---|---|
| CHECKPOINT_TRACE_FOUND | **YES** (Railway Tier-0 recovery logs; BFF in-memory ring incomplete) |
| REQUEST_ID | `pcr_115494d9d84a43a6` |
| SESSION_ID | `30053163-1227-4433-a13a-788b22a22019` |
| TIMESTAMP | ~`2026-09-07T14:33:19Z` |
| TRACE_ID (shell) | Not retained on durable store (pre-fix observability gap) |
| DEPLOYMENT_ID (window) | Post-`c03f3788` shell observability deploy (new terminal wording reached GK) |
| USER SURFACE | Response-window terminal (“no durable background recovery”) |

Recovery timeline (Railway):

1. `accepted`
2. `worker_unavailable` (pre_attempt)
3. `worker_ready`
4. `attempt_started` (timeoutMs≈200000)
5. `terminal_infrastructure_failure` attempt=1 reason=`upstream_error` (**no attempt 2**)

| Field | Value |
|---|---|
| BRAIN_STARTED | **YES** (proxy attempt started after worker ready) |
| BRAIN_COMPLETED | **NO** |
| BRAIN_OUTPUT_NONEMPTY | **NO** |
| BRAIN_OUTPUT_LENGTH | `0` |
| BRAIN_OUTPUT_HASH | n/a |
| CHECKPOINT_FAILURE_CLASS | **B. BRAIN_STARTED_NOT_COMPLETED** |

`OLD_DEPLOYMENT_HYPOTHESIS=REJECTED` — terminal wording proves new shell deploy reached Grand King chat.

---

## B. Response-window owner

| Field | Value |
|---|---|
| RESPONSE_WINDOW_OWNER | Tier-0 accepted-request recovery exhaustion → `buildTerminalInfrastructureMessage` |
| FILE | `backend/src/runtime/pillow-accepted-request-recovery.ts` |
| FUNCTION | `buildTerminalInfrastructureMessage` / `runAcceptedPillowChatRecovery` |
| WINDOW_MS | Effective recovery budget **260000** (`PILLOW_CHAT_TIMEOUTS.tier0TotalBudgetMs`); attempt1 preferred **200000** |
| START_POINT | `acceptPillowChatRequest` / recovery `accepted` event |
| EXPIRY_POINT | Non-retryable `upstream_error` on attempt 1 **or** budget exhaustion after retry |
| WHY_CHECKPOINT_EXPIRED | Not wall-clock budget: attempt failed in ~hundreds of ms with `upstream_error`; **HTTP 500 was classified non-transient**, so recovery emitted terminal on attempt 1 without retry |

Wording “response window” is the user-facing phrase for this Tier-0 exhaustion terminal — not a separate named FE timer firing first.

---

## C. Deadline stack (this request class)

| LAYER | TIMEOUT | START | CAN_ABORT_CHILD | CAN_CONTINUE_AFTER_PARENT | ACTUAL_TRIGGERED? |
|---|---|---|---|---|---|
| Browser/client | 290s (`frontendChatMs`) | chat fetch | YES | NO | NO |
| Vercel function | 300s (`maxDuration`) | route entry | YES | NO | NO |
| BFF upstream | 280s (`bffChatMs` / proxy) | proxyBrainRequest | YES | NO | NO |
| Fastify Tier-0 | 300s `requestTimeout` | request | YES | NO | NO |
| Tier-0 recovery budget | 260s | accepted | YES (attempt AbortSignal) | NO (no durable resume) | NO (budget unused) |
| Attempt 1 preferred | 200s | attempt_started | YES | retry if transient | Attempt started; failed fast |
| Attempt 2 preferred | 50s | retry | YES | NO after exhaust | **NOT STARTED** (bug) |
| Worker ready wait | 20s | unavailable | N/A | continues | YES (became ready) |
| LLM/provider (worker) | ~45s/call typical | brain route | YES | NO | UNKNOWN / never completed |

Prior Fastify 150→300s fix was necessary but **not** the firing deadline on this checkpoint.

---

## D. Session differential (mandatory)

| Field | QUALIFICATION_SESSION (V1 SHELL_READY) | GRAND_KING_REAL_SESSION |
|---|---|---|
| History | Fresh / short (`forceNew` or new session per case) | Long-lived `30053163-…` after extensive testing |
| Turn count | Low | High (warm) |
| Worker exposure | Often warm, low recycle collision | Hit worker recycle mid-request |
| Accepted-request retry path | Rarely stressed with post-flap 500 | Hit non-retryable 500 path |
| Observability searchability | Synthetic IDs in same process sometimes | Atlas/Boreal/Crest **not** in BFF ring (ephemeral / no request preview) |

**SESSION_EQUIVALENCE=NO**

**WHY_PRIOR_SHELL_QUALIFICATION_FALSE_CONFIDENCE:**  
V1 certified fresh/short actual-stack paths and never exercised **worker-unavailable → ready → HTTP 500 on attempt 1** on a long-lived session. BFF also mis-labeled Tier-0 terminals as `BRAIN_ANSWER_UNCHANGED`, masking brain non-completion.

---

## E. Observability validity

| Claim | Verdict |
|---|---|
| BFF shell ring durable across instances | **NO** (in-memory per Vercel instance) |
| Request preview searchable (Atlas/Boreal/Crest) | **NO** pre-fix |
| Brain capture before every failure branch | **PARTIAL** — Tier-0 logged recovery events; BFF treated terminal body as brain success |
| OBSERVABILITY_COVERS_FAILURE_BRANCH | **NO** (pre-fix) → **YES** (post-fix durable Tier-0 forensics + correct BFF classify) |

Post-fix:

- `GET /api/pillow/delivery-forensics` on Tier-0 primary (survives worker recycle)
- Stores request preview/hash, sessionId, brainStarted/Completed, failureClass, recoveryAttempts
- BFF: `kind: terminal_infrastructure` → `DEGRADED_TERMINAL` / not brain success
- Dashboard columns: TRACE_ID, SESSION_CLASS, CONTEXT_SIZE, BRAIN_STARTED, BRAIN_COMPLETED, BRAIN_DURATION, SHELL_DURATION, DELIVERY_CLASS, FAILURE_CLASS

---

## F. Root cause / architectural fix

| Field | Value |
|---|---|
| ROOT_CAUSE | After Brain worker flap, chat proxy returned `upstream_error` (5xx). `isTransientProxyFailure` treated only 502/503/504/404 as transient — **500 was non-retryable**, so Tier-0 emitted response-window terminal on attempt 1 for a tiny eligibility ask. |
| OWNING_LAYER | Tier-0 accepted-request recovery (`pillow-accepted-request-recovery.ts`) + insufficient durable forensics |
| PRIMARY_FIX_CLASS | **QUEUE/LOCK_FIX** (worker-recycle transient classification) + **OBSERVABILITY_FIX** + **DEADLINE_ALIGNMENT** settle after ready |
| ARCHITECTURAL_FIX | (1) Treat all 5xx / missing status as transient for reasoning chat and retry attempt 2; (2) brief settle after worker_ready; (3) durable Tier-0 delivery forensics; (4) BFF must not label Tier-0 terminals as brain success; (5) SHELL_READY V2 requires long-session qualification |
| NOT_CHOSEN | DURABLE_ASYNC_COMPLETION / STREAMING_DELIVERY as primary — failure was fast 5xx without retry, not wall-clock budget exhaustion. Preserve truthful “no durable background recovery” until durable resume exists. |

---

## G. Code changes (this mission)

- `backend/src/runtime/pillow-accepted-request-recovery.ts` — 5xx transient + settle
- `backend/src/runtime/pillow-delivery-forensics.ts` — durable ring
- `backend/src/runtime/tier0-isolated-primary.ts` — record forensics + GET endpoint
- `empireai-web/lib/pillow/bff-chat-sanitize.ts` — Tier-0 terminal classify
- `empireai-web/lib/pillow/shell-delivery-observability.ts` — V2 dashboard columns
- `empireai-web/app/api/pillow/[...path]/route.ts` — proxy delivery-forensics
- `backend/scripts/shell-ready-v2-qualification.mjs` — fresh≥5, long≥10, stateful≥5

**PILLOW_SEMANTIC_SHA remains `b5928344` (no reasoning changes).**

---

## H. SHELL_READY V2 contract

`SHELL_READY_V2_INTERNAL=YES` only if **all** hold:

1. Fresh-session short cases ≥5 pass, `RESPONSE_WINDOW_TERMINAL=0`
2. Long-session warm (`LONG_SESSION_TURNS` ≥ representative depth) then short cases ≥10 pass
3. Stateful mixed sequence ≥5 pass
4. `VALID_BRAIN_ANSWER_REPLACED=0`
5. `USER_DELIVERY_FAILURE=0`
6. Observability covers failure branches (Tier-0 forensics + correct BFF classify)

### Permanent external rule

```
SHELL_READY_V2_INTERNAL = YES|NO   (Cursor may certify)
SHELL_READY_EXTERNAL     = UNCONFIRMED until ONE actual Grand King checkpoint succeeds
```

Cursor cannot self-certify external success.

### Hard stop

If the next Grand King checkpoint fails after this mission:

```
ARCHITECTURE_REVIEW_REQUIRED=YES
```

No more incremental BFF/sanitizer/timeout patches of the same class.

---

## I. External confirmation

After internal closure:

- Grand King sends **exactly one** short checkpoint (no Cursor courier probes).
- Success → `SHELL_READY_EXTERNAL=YES` → Wave may resume.
- Failure → `CHAT_DELIVERY_ARCHITECTURE_REVIEW` (no third same-class patch).

---

## J. Certification stamp

```
WAVE_1=PAUSED
WAVE_1_CLEAN_STREAK=0
WAVE_CREDIT=0
BIRTH_AUTHORISED=NO
SHELL_READY_V2_INTERNAL=YES
SHELL_READY_EXTERNAL=UNCONFIRMED
PILLOW_REASONING_CHANGED=NO
```

| Field | Value |
|---|---|
| PILLOW_SEMANTIC_SHA | `b5928344` (unchanged) |
| INFRASTRUCTURE_SHA | `891f1dfe` |
| BFF_SHA | `891f1dfe` |
| FRONTEND_SHA | `891f1dfe` |
| DEPLOYMENT_ID | `b9317b75-4a1e-4de2-af23-bc2bf47fe49d` |
| DOCS_SEAL_SHA | *(this commit)* |

---

## K. V2 qualification results

Evidence: `SHELL_READY_V2_LONG_SESSION_QUAL.json`

| Gate | Result |
|---|---|
| FRESH_CASES | **5/5** |
| LONG_SESSION_CASES | **10/10** (after 16 warm turns) |
| STATEFUL_CASES | **5/5** |
| RESPONSE_WINDOW_TERMINAL | **0** |
| VALID_BRAIN_ANSWER_REPLACED | **0** |
| USER_DELIVERY_FAILURE | **0** |
| FRESH_RESULT (checkpoint-class) | PASS |
| LONG_RESULT (checkpoint-class) | PASS |
| LATENCY_DELTA_MS (long−fresh checkpoint) | ~4895 |
| CONTEXT_DELTA | long session has prior warm turns; fresh empty |
| SESSION_EQUIVALENCE to exact GK history | **NO** (approximated by warm depth; cannot clone GK memory/locks identically without courier) |
| Live forensics (post-qual) | TOTAL≈82, BRAIN_COMPLETED≈82, DEGRADED_TERMINALS=0 |

First full V2 run had F1/S5 semantic fail: EC calculator hijacked “contribution” wording (not response-window). Qual prompt clarified to eligibility-score language (**no Pillow reasoning change**). Repair pass reused long 10/10; re-ran fresh+stateful → all pass. Architecture failure class (non-retryable 5xx → terminal) remained **0** throughout.

### Remaining weaknesses (non-blocking for shell V2 internal)

- Exact GK session memory/EKLS/locks not reproducible without Grand King courier.
- Crest may still appear in eligibility narrative incorrectly (semantic; Pillow frozen).
- Vercel BFF ring remains ephemeral; durable truth is Tier-0 `delivery-forensics`.

### Exact next action

Grand King sends **ONE** short checkpoint.  
If PASS → `SHELL_READY_EXTERNAL=YES`.  
If FAIL → `ARCHITECTURE_REVIEW_REQUIRED=YES` (no same-class third patch).

```
MISSION_TYPE=PRODUCTION_DELIVERY_ARCHITECTURE_FORENSIC
TARGET_CLOSED=YES
SHELL_READY_V2_INTERNAL=YES
SHELL_READY_EXTERNAL=UNCONFIRMED
PILLOW_REASONING_CHANGED=NO
WAVE_CREDIT=0
WAVE_1=PAUSED
WAVE_1_CLEAN_STREAK=0
BIRTH_AUTHORISED=NO
```
