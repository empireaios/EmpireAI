# PILLOW Durable Request State Machine

## Lifecycle

```
RECEIVED → ACCEPTED → RUNNING → COMPLETED
                ↘ RETRYABLE → RUNNING → …
                ↘ FAILED_FATAL
```

Sync HTTP response window is **not** request lifetime.

## ChatRequest fields

| Field | Role |
|---|---|
| requestId | `pcr_*` durable id |
| sessionId | Pillow session |
| inputHash | SHA of session+message |
| idempotencyKey | `idem_${sessionId}_${inputHash}` |
| status | lifecycle state |
| createdAt / updatedAt | timestamps |
| attemptCount | Tier-0 attempt counter |
| activeWorker | current worker/replica hint |
| failureClass | canonical taxonomy |
| brainResult / finalResult | persisted payload |
| deliveryState | NOT_STARTED → ATTEMPTED → DELIVERED / RETRIEVED / PENDING_CLIENT |
| observability | admission, brain start/complete, persist, delivery stamps |

## Failure taxonomy → policy

| Class | Policy |
|---|---|
| REQUEST_REJECTED / REQUEST_NOT_ACCEPTED / CONTEXT_ADMISSION_FAILURE / UPSTREAM_4XX_FATAL / BRAIN_FATAL / POSTPROCESS_FAILURE | FAIL |
| WORKER_UNAVAILABLE / WORKER_RECYCLED / UPSTREAM_5XX_RETRYABLE / UPSTREAM_4XX_RETRYABLE / BRAIN_TIMEOUT_RETRYABLE / NETWORK / TIMEOUT / BUDGET_EXHAUSTED / RESULT_PERSIST_FAILURE | RETRY |
| CLIENT_DISCONNECT | CONTINUE |
| BRAIN_SUCCESS / DELIVERY_FAILURE | DELIVER_PERSISTED_RESULT |

## Persistence

- **REQUEST_STATE_STORE** = Redis (`pillow:chatreq:v2:*`) when `configureChatRequestStore` wired; memory warm cache / fallback
- **DURABILITY_SCOPE** = cross-process when Redis available
- **TTL** = 86400s (configurable `PILLOW_CHAT_REQUEST_TTL_SEC`)
- **CLEANUP_POLICY** = Redis EX TTL + memory LRU cap 500

## Invariants

1. Accept → `pcr_*` before brain execution
2. `BRAIN_COMPLETED=YES` → `RESULT_PERSISTED=YES` before user delivery attempt
3. Sync window expiry → status remains `RETRYABLE` (not destroyed); Tier-0 may continue in background
4. `GET /api/pillow/chat-request/:requestId` returns STATUS / COMPLETED RESULT / FAILURE_CLASS

## Retry ownership

**RETRY_OWNER=Tier-0**

Demoted competitors:

- BFF chat HTTP retry loop → single attempt
- Frontend chat `retries:0` + poll retrieval instead of re-POST
