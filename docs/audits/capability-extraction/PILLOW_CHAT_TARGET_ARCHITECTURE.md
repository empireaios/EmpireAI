# Pillow Chat Target Architecture (Option E — Hybrid)

**MISSION_TYPE:** `CHAT_EXECUTION_ARCHITECTURE_REVIEW`  
**RECOMMENDED_ARCHITECTURE:** `OPTION_E_HYBRID_SYNC_PLUS_DURABLE_CONTINUATION`  
**PILLOW_SEMANTIC_SHA:** `b5928344` (frozen)  
**WAVE_1:** PAUSED  

---

## 1. Target request lifecycle

```
UI send(ask, sessionId, workspaceContext)
  → BFF admits/truncates continuity envelope
  → Tier-0 DURABLE_ACCEPT(requestId, inputHash, sessionId)
  → sync attempt while client waits (short/ordinary path)
       → worker brain → COMPLETED(result) persisted
       → HTTP 200 + result
  → if worker transient: Tier-0 retries under job policy (single authority)
  → if sync window cannot finish but job still RUNNING:
       → HTTP 200 { status: accepted_pending, requestId }  (honest)
       → UI polls GET /api/pillow/chat-request/:requestId until COMPLETED|FAILED
  → CLIENT_DISCONNECTED does not cancel durable job
```

## 2. Durable request record

```
REQUEST_ID
SESSION_ID
STATUS: ACCEPTED | RUNNING | COMPLETED | FAILED | EXPIRED
INPUT_HASH
ATTEMPT
FAILURE_CLASS
BRAIN_RESULT (message, kind, hashes)
FINAL_RESULT
DELIVERY_STATE: NOT_DELIVERED | DELIVERED | RETRIEVED
ERROR_CLASS
TIMESTAMPS (accepted, started, completed)
DEPLOYMENT_ID
```

Storage: Tier-0 primary **Redis when available**, memory fallback (survives worker recycle; Redis survives process bounce).

## 3. Context admission (long-session first-class)

Before Zod hard-fail:

- Keep at most 16 recent turns (already capped).
- Truncate each `content` to ≤8000 chars (ellipsis marker).
- Prefer server-side transform so any client (GK UI, scripts) is safe.
- Client should also truncate at source to reduce payload size.

This is **envelope admission**, not Pillow reasoning.

## 4. Brain contract

```
BrainResult {
  status: SUCCESS | EMPTY | FATAL | RETRYABLE
  content: string
  kind: string
  structured?: object
  trace: { requestId, sessionId, … }
}
```

Brain does not own transport recovery. Shell does not reinterpret SUCCESS as terminal.

## 5. Shell contract

Deliver, persist, admit envelope, observe, transport retry.  
Not: executive rewrite, truth judgment, decision rewrite.

## 6. Delivery model

- **Primary:** single blocking HTTP when COMPLETED in sync budget.  
- **Continuation:** job-status polling (simple, reliable).  
- SSE/WebSocket deferred (Option C enhancement), not required for MVA.

## 7. Worker recycle

- Do not claim COMPLETED until worker returns nonempty success body.  
- Durable job remains RUNNING across recycle; Tier-0 re-dispatches.  
- Prefer admit-to-queue before expensive work when worker not ready.  
- Session missing → existing rebound; result still keyed by requestId.

## 8. User retry policy

Legitimate user retry only when:

- auth failure  
- empty/invalid user message  
- user cancelled  
- FATAL brain after durable attempts exhausted  

Not legitimate: identical resubmit after Zod/admission failure or after worker flap when durable path exists.

## 9. Phased plan

| Phase | Work |
|---|---|
| 1 | Context admission transform + failure taxonomy |
| 2 | Durable request/result store + GET status |
| 3 | Tier-0 sync+pending delivery; BFF proxy status |
| 4 | UI poll-on-pending / retrieve completed |
| 5 | Fault injection + long-session qual |
| 6 | One Grand King external checkpoint |

## 10. MVA acceptance

`REQUEST_LOST=0` · `COMPLETED_RESULT_LOST=0` · long-session Zod bomb class closed · no umbrella response-window for REQUEST_NOT_ACCEPTED.

## 11. External rule

`ARCHITECTURE_READY_INTERNAL=YES` only after fault injection.  
`ARCHITECTURE_READY_EXTERNAL=UNCONFIRMED` until one GK checkpoint.  
Next external fail → STOP (architecture review again; no silent patch).

---

## Implementation seal (post-MVA)

| Field | Value |
|---|---|
| ARCHITECTURAL_CHANGE_IMPLEMENTED | YES � Option E MVA |
| PILLOW_REASONING_CHANGED | NO (b5928344) |
| REQUEST_PERSISTENCE | Tier-0 Redis/memory pillow:chatreq:* |
| RESULT_PERSISTENCE | COMPLETED stored; GET /api/pillow/chat-request/:id |
| RETRY_OWNER | Tier-0 |
| DELIVERY_MODEL | Sync HTTP primary; durable retrieve via pcr_* header |
| WORKER_RECYCLE_BEHAVIOR | Durable record outlives worker; continuity turns admitted |
| FAULT_INJECTION | Gen3 10/10 Fresh 5/5 Long 10/10 Stateful 5/5 Recycle 10/10 Transport 5/5 WINDOW=0 |
| ARCHITECTURE_READY_INTERNAL | YES |
| ARCHITECTURE_READY_EXTERNAL | UNCONFIRMED |

Exact next action: Grand King ONE short checkpoint. Fail => STOP, no silent patch.
