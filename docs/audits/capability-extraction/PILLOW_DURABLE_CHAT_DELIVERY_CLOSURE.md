# PILLOW Durable Chat Delivery Closure

**MISSION_TYPE**=DURABLE_CHAT_DELIVERY_ARCHITECTURE  
**SEVERITY**=P0 — CERTIFICATION BLOCKER  
**WAVE_1**=PAUSED · **WAVE_CREDIT**=0 · **BIRTH_AUTHORISED**=NO

## Freeze

| Field | Value |
|---|---|
| PILLOW_SEMANTIC_SHA_BEFORE | `01b15a57` |
| PILLOW_SEMANTIC_SHA_AFTER | `01b15a57` (UNCHANGED) |
| PILLOW_REASONING_CHANGED | NO |

No executive cognition / arithmetic / decision / causal / memory reasoning tip changes in this mission.

## A. Previous architecture weakness

Cursor-internal PASS repeatedly preceded external delivery failure (~16% independent success). Sync HTTP window was treated as request lifetime. Competing retries (BFF + FE) raced Tier-0. Oversized `recentConversationTurns` caused Zod 8000 rejections. Completed brain output could be lost if the client disconnected before response write. Process-local memory could not survive BFF/primary recycle without Redis wiring.

## B. New request state model

Durable `ChatRequest` state machine on Tier-0 (`pillow-chat-request-store.ts`):

`RECEIVED → ACCEPTED → RUNNING → COMPLETED | RETRYABLE → RUNNING | FAILED_FATAL`

Canonical id: `pcr_*` issued at accept, returned in headers/body, retrievable via `GET /api/pillow/chat-request/:id`.

## C. Result persistence model

Invariant: brain success → `completeChatRequest` **before** delivery attempt (`markDeliveryAttempted`). Full result object persisted in `brainResult` / `finalResult`.

## D. Retry ownership

**RETRY_OWNER=Tier-0**

- BFF chat retry demoted to 1 attempt
- FE chat `retries:0`; auto-polls durable status instead of re-POSTing
- Post-sync background recovery may continue under Tier-0 without GK resubmission

## E. Failure taxonomy

See `PILLOW_DURABLE_REQUEST_STATE_MACHINE.md`. No generic production-shell umbrella as internal state.

## F. Context admission

`admitWorkspaceContextEnvelope` / `admitChatRequestBody` compact turns to ≤8000 and last 16 **before** worker schema validation. Target: `WORKER_SCHEMA_REJECTION_FROM_CONTEXT=0`.

## G. Sync vs durable lifecycle

| Concept | Value |
|---|---|
| SYNC_WINDOW_MS | 120000 (UX window; Tier-0/BFF budgets may be longer) |
| REQUEST_LIFETIME | 86400s |
| RESULT_TTL | 86400s |

Sync expiry returns `durable_pending` + `requestRemainsRunning` — request is not destroyed.

## H. Idempotency

- **IDEMPOTENCY_KEY**=`idem_${sessionId}_${inputHash}`
- **DUPLICATE_EXECUTION_POLICY**=`REUSE_INFLIGHT_OR_COMPLETED`
- Duplicate visible response prohibited for same attempt

## I–L. Fault behaviors

| Fault | Behavior |
|---|---|
| Worker recycle | RUNNING → RETRYABLE → worker B → COMPLETED; one canonical result |
| HTTP 5xx | RETRY while budget remains; not terminal on attempt 1 |
| HTTP 4xx | Fatal for auth/schema; admission should prevent schema class |
| BFF restart | Redis-backed request/result recover; GET by `pcr_*` |
| Client disconnect | Execution continues; result persisted; retrieve on reconnect |

## M. Result retrieval

`GET /api/pillow/chat-request/:requestId` → status, finalResult, failureClass.  
BFF auto-polls up to ~90s on `durable_pending`. FE `sendPillowChat` also polls.

## N. Observability

Per request: TRACE_ID (delivery forensics), REQUEST_ID, SESSION_ID, STATUS, ATTEMPT, WORKER, CONTEXT_ADMISSION, BRAIN_STARTED/COMPLETED, RESULT_PERSISTED, DELIVERY_*, FAILURE_CLASS, timestamps — durable on Tier-0 Redis path.

## O. Long-session qualification

**GK_SESSION_SIMULATION_CHARACTERISTICS**= long-lived session; oversized history turns; mixed commercial domains; warm supplier context; prior failure language. Not claimed as exact live GK memory clone.

## P. Fault injection matrix

See `PILLOW_DURABLE_DELIVERY_FAULT_MATRIX.json`.

- Level A: 15/15
- Live: OVERSIZED=10 HTTP_500=10 BFF_RESTART=5 CLIENT_DISCONNECT=5 SLOW_BRAIN=5 WORKER_RECYCLE=10 LONG_SESSION=10 STATEFUL_MIXED=5
- All hard durability zeros met

## Q. G1 / G2 / G4

Representative CLEARED — semantic tip frozen at `01b15a57`; G2 contribution `14.60` preserved on remediator SM_4.

## R. Durability metrics

ACCEPTED_REQUEST_LOST=0  
COMPLETED_RESULT_LOST=0  
UNCONTROLLED_DUPLICATE_EXECUTION=0  
DUPLICATE_VISIBLE_RESULT=0  
WORKER_RECYCLE_TERMINAL=0  
RETRYABLE_5XX_TERMINAL=0  
CONTEXT_SCHEMA_FAILURE=0  
BFF_RESTART_LOSS=0  
CLIENT_DISCONNECT_LOSS=0  
LONG_SESSION_DELIVERY_FAILURE=0

## S. SHAs / deployment

| Field | Value |
|---|---|
| PILLOW_SEMANTIC_SHA | `01b15a57` (frozen) |
| INFRASTRUCTURE_SHA | `b063e88033cc4dac81d7a8640bb0213e9f8458b0` |
| BFF_SHA | `b063e880` (empireai-web BFF route + sanitize) |
| FRONTEND_SHA | `b063e880` (client poll path) |
| DEPLOYMENT_ID | `9cb5f1c9-3e23-433f-88c6-8de4e443669c` |
| DOCS_SEAL_SHA | this seal commit |

## T. Remaining limitations

1. Without Redis, durability is process-local (memory fallback) — production Tier-0 must keep Redis wired.
2. If BFF + FE poll budgets both expire before brain completes: UI retains `pcr_*` and `resultRetrievable`; refresh/status retrieves. Full infinite background UI wait is not claimed.
3. Heavy live ladders can drive event-loop lag → worker exit(78); durability path still keeps accepted `pcr_*` recoverable after worker returns.
4. Live HTTP_500 class validates non-terminal durable accept/GET ownership (controlled chaos 500 injector not present).

## U. Architecture internal state

ARCHITECTURE_READY_INTERNAL=YES  
MISSION_INTERNAL_PASS=YES (not real-world success)

## V. Exact external checkpoint requirement

ARCHITECTURE_READY_EXTERNAL=**UNCONFIRMED**.  
Grand King + ChatGPT perform **exactly ONE** real Pillow checkpoint after this seal.  
If that checkpoint fails due to delivery/request architecture: **ARCHITECTURE_REDESIGN_REQUIRED=YES** — no incremental patch mission.

## Hard stop rule

```
If next real checkpoint fails due to delivery/request architecture:
NO incremental patch mission.
ARCHITECTURE_REDESIGN_REQUIRED=YES
```

## Final programme state

WAVE_1=PAUSED  
WAVE_1_CLEAN_STREAK=0  
WAVE_CREDIT=0  
BIRTH_AUTHORISED=NO  
CURSOR_MISSIONS_BEFORE_NEXT_PILLOW_CHECKPOINT=0
