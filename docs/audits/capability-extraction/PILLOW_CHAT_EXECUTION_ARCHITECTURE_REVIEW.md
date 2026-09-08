# Pillow Chat Execution Architecture Review

**MISSION_TYPE:** `CHAT_EXECUTION_ARCHITECTURE_REVIEW`  
**SEVERITY:** P0 — REPEATED EXTERNAL DELIVERY FAILURE  
**WAVE_1:** PAUSED · **WAVE_CREDIT:** 0 · **BIRTH_AUTHORISED:** NO  
**PILLOW_REASONING_CHANGED:** NO  
**INCREMENTAL_SHELL_PATCHES:** FORBIDDEN (review precedes implementation)  
**GRAND_KING_COURIER_PROBES:** 0  

---

## 0. Decision snapshot (required before implementation)

```
CURRENT_ARCHITECTURE=SYNCHRONOUS_HTTP_CHAIN_WITH_MULTI_LAYER_RETRY
PRIMARY_STRUCTURAL_WEAKNESS=LONG_SESSION_PAYLOAD_AND_FAILURE_COLLAPSE
STATE_OWNERSHIP_CONFLICTS=YES
RETRY_OWNERSHIP_CONFLICTS=YES
DEADLINE_OWNERSHIP_CONFLICTS=YES

OPTION_A_SCORE=42
OPTION_B_SCORE=78
OPTION_C_SCORE=74
OPTION_D_SCORE=61
OPTION_E_SCORE=86

RECOMMENDED_ARCHITECTURE=OPTION_E_HYBRID_SYNC_PLUS_DURABLE_CONTINUATION
MVA_CHANGE=CONTEXT_ADMISSION+DURABLE_REQUEST_RESULT+FAILURE_TAXONOMY
```

---

## A. Failure history synthesis (all external generations)

| Gen | When | Prompt class | Visible terminal | Brain started | Brain completed | Shell replaced | Worker failure | Recovery failure | Session | Root cause | Fix applied | Next external |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **1** | Path-parity era | Bounded supplier / Nova-class | Infra / path terminal | YES (often) | YES (often) | **YES** (footer→terminal) | No | N/A | Mixed | BFF destroyed valid brain answer | Footer strip + invariant `1d0f5c59` | Still failed later |
| **2** | Post shell-obs / SHELL_READY | Atlas/Boreal/Crest eligibility | Response-window terminal | YES | **NO** | Terminal mislabeled as brain success | **YES** recycle | Attempt1 `upstream_error` **500** treated non-transient; no attempt2 | Long `30053163-…` | Worker flap + non-retryable 500 | 5xx transient + settle + forensics `891f1dfe` | Still failed Gen3 |
| **3** | Post V2 internal YES | Shell V2 checkpoint (Pine/…) | **Same** response-window terminal | YES (proxy attempt) | **NO** | Taxonomy wrong | No recycle this time | Attempt1 **HTTP 400**; no attempt2 | **Same** `30053163-…` | Zod `workspaceContext.recentConversationTurns[1].content` **>8000** → Validation failed → Tier-0 maps to response-window | *None yet (this review)* | — |

### Gen3 forensic proof (durable)

| Field | Value |
|---|---|
| REQUEST_ID | `pcr_307097986cf7464f` |
| SESSION_ID | `30053163-1227-4433-a13a-788b22a22019` |
| TIMESTAMP | `2026-09-08T09:44:23Z` |
| UPSTREAM_STATUS | **400** |
| WORKER_ERROR | `ZodError too_big maximum 8000` path `workspaceContext.recentConversationTurns.1.content` |
| RECOVERY_ATTEMPTS | 1 |
| BRAIN_COMPLETED | false |

**Pattern (not isolated bugs):** every generation ended with the same user-facing “response window / please retry” surface, while root causes rotated (shell rewrite → 5xx flap → **long-session context admission**). Incremental patches chased the last symptom. Long-lived Grand King sessions were never a first-class workload.

`SHELL_READY_V2_EXTERNAL=NO`  
`ARCHITECTURE_REVIEW_REQUIRED=YES`

---

## B. Current architecture

```
UI (GlobalAiAssistant)
  → pillowFetchWithRetry (FE, ≤2 retries on 5xx, 290s abort)
  → BFF /api/pillow/chat (Vercel maxDuration 300s, upstream 280s, ≤1 extra 502/503/504)
  → Tier-0 accept + runAcceptedPillowChatRecovery (260s budget, attempt1 200s / attempt2 50s)
  → Brain worker POST /api/pillow/chat
      → Zod parse (hard fail → 400)
      → admission control / PillowHost.routePrompt / model / post-process
  → Tier-0 returns body OR collapses !ok into terminal_infrastructure
  → BFF sanitize + shell observability
  → UI maps to executive surface
```

Synchronous: **one HTTP response window owns user delivery**. Accepted-request “recovery” is in-process only — **no durable background completion**. Terminal text correctly says so — and that honesty exposes the architectural hole.

---

## C. Component inventory (summary)

| Component | Purpose | Stateful? | Failure modes | Timeout | Retry owner | Drop valid answer? | Outlive request? | Dup responsibility? | Necessary? | Simplify? |
|---|---|---|---|---|---|---|---|---|---|---|
| Frontend UI | Capture ask / render | Session turns in localStorage | Abort, double-send | 290s | FE | Via mapping | Turns yes / request no | Continuity turns | YES | Trim turns at source |
| BFF | Auth proxy / sanitize / obs | Ephemeral ring | 502/timeout | 280s / 300s | BFF | Yes (Gen1) | No | Sanitize vs brain | YES thin | Demote rewrite |
| Tier-0 | Auth island / proxy / recovery | Worker child + forensics ring | Worker down, proxy fail | 300s / 260s | Tier-0 | Collapses failures | Primary yes / recovery no | Recovery vs FE/BFF | YES | Own durable jobs |
| Accepted-request | Request id + budget | In-memory only | Exhaust → terminal | 260s | Tier-0 | N/A | **NO** | — | YES if durable | Persist |
| Worker | sql.js + Pillow | Heavy | Recycle, lag, 5xx | Live probe | Spawn | Mid-flight loss | No | Health vs ready | YES | Drain/admit |
| Railway/proxy | Hosting | Deploy | Restart | — | Platform | Yes | No | — | YES | — |
| Brain API | routePrompt | Session in worker RAM | Session missing, Zod 400 | Internal | Rebound once | — | Session no across recycle | — | YES | — |
| Model/provider | Tokens | — | Latency/errors | ~provider | Adapter | — | No | — | YES | — |
| Memory/EKLS | Context | DB | Slow/load | — | Brain | — | Yes | Overlaps client turns | YES | Compact |
| recentConversationTurns | Continuity after rebound | Client | **>8000 Zod bomb (Gen3)** | — | None | Blocks request | Yes | Dup with host history | Conditional | **Admit/truncate** |
| Post-process | Surface polish | — | Over-strip | — | Brain/BFF | Yes | No | BFF strip | Minimal | Demote |
| Sanitizer | Footer strip | — | Over-aggressive (Gen1) | — | BFF | Yes | No | — | Minimal | Keep invariant only |
| Recovery | Retry transient | In-process | Wrong taxonomy | Budget | Tier-0 | Maps 400→terminal | No | FE+BFF+Tier0 | Replace w/ durable | — |
| Observability | Trace | Tier-0 ring / BFF ring | Incomplete pre-fix | — | — | — | Tier-0 yes | Dup rings | YES | Unify on Tier-0 |

---

## D. State ownership

| State | Claimed owners | Conflict |
|---|---|---|
| Conversation turns | UI localStorage + host session + `recentConversationTurns` body | **TRIPLE** — Gen3 bomb |
| Request acceptance | Tier-0 `pcr_*` (ephemeral) | Not durable |
| Worker process | Tier-0 spawn | Recycle drops in-flight |
| Brain session | Worker memory | Lost on recycle (rebind exists) |
| Retry/attempt | FE + BFF + Tier-0 | **TRIPLE** |
| Delivery success | BFF decision + UI mapping | Ambiguous |
| Forensics | Tier-0 ring + BFF ring | Split brain |

**STATE_OWNERSHIP_CONFLICTS=YES** — conversation continuity and retry/delivery ownership are duplicated; request result has no single durable owner.

---

## E. Retry / recovery ownership

**RETRY_AUTHORITIES=** frontend (`MAX_RETRIES=2` on 5xx), BFF (one 502/503/504 hop), Tier-0 recovery (2 attempts), worker session rebind (1), provider SDK (internal).

**RECOVERY_AUTHORITIES=** Tier-0 accepted-request (in-process only), BFF degrade terminal, UI “starting…” messaging.

Multiple authorities → inconsistent behavior (5xx retried; **400 never retried but still framed as response-window**; user told to resubmit when resubmit cannot help).

**RETRY_OWNERSHIP_CONFLICTS=YES**

---

## F. Deadline stack

| Owner | Budget |
|---|---|
| FE | 290s |
| Vercel | 300s |
| BFF upstream | 280s |
| Fastify | 300s |
| Tier-0 recovery | 260s |

**DEADLINE_OWNERS=** FE, Vercel, BFF, Fastify, Tier-0  
**DEADLINE_CONFLICTS=YES** (nested sync budgets; Gen2/Gen3 often failed in **milliseconds**, not at wall clock)  
**WHO_SHOULD_OWN_END_TO_END_DEADLINE=** Tier-0 durable job budget for execution; **client poll TTL** separate from brain execution TTL.

Layered sync deadlines are inherently fragile for long executive work and for fast admission failures that are mislabeled as window expiry.

---

## G. Structural weakness

1. **Long-lived session not first-class** — client ships growing turn blobs; schema hard-rejects; system returns “retry”.
2. **Failure collapse** — Zod 400, 500, timeout, empty → one response-window terminal.
3. **No durable result** — brain completion cannot outlive HTTP; truthful “no durable recovery” is a design confession.
4. **Multi-retry owners** without a single request state machine.
5. **Qual ≠ real GK session** — fresh/long synthetic still may not send 8k+ prior assistant blobs.

---

## H. Options scored (0–100 composite)

Criteria: reliability, long-session, recycle resilience, state integrity, UX, complexity (inverse), latency, observability, retry simplicity, dup-exec risk, cost, scale, autonomy fit.

| Option | Score | Notes |
|---|---|---|
| A Keep sync + simplify | **42** | Cannot survive recycle/transport; already failed 3 gens |
| B Durable request job | **78** | Strong reliability; UX needs poll/subscribe |
| C Stream + durable | **74** | Best UX long-term; higher complexity now |
| D Session-affinity worker | **61** | Helps recycle; does not fix Zod/admission or BFF loss |
| **E Hybrid sync + durable continuation** | **86** | Keep fast path; durable admit/result; poll when needed |

---

## I. Recommendation

**RECOMMENDED_ARCHITECTURE=OPTION_E_HYBRID_SYNC_PLUS_DURABLE_CONTINUATION**

**WHY:** Matches Grand King UX (usually seconds, sometimes longer), removes repeated class (admission + result loss + false retry), preserves future action-idempotency via request IDs, avoids full streaming rewrite as day-one scope.

**MVA_CHANGE=**

1. **Context admission** — truncate/compact `recentConversationTurns` before hard Zod fail (shell/admission, not reasoning).  
2. **Durable request/result registry** on Tier-0 (Redis when available) — ACCEPTED→RUNNING→COMPLETED/FAILED; GET by `requestId`.  
3. **Failure taxonomy** — stop umbrella “response window” for `REQUEST_NOT_ACCEPTED` / validation; reserve window language for true budget exhaustion.  
4. **Delivery model** — sync return when COMPLETED in window; else return accepted+poll handle; UI/BFF can retrieve completed result without Grand King rewriting the ask.  
5. **Single retry authority for transport** — Tier-0 owns worker transient; FE does not invent competing recovery claims.

**MIGRATION_SCOPE:** Tier-0 store + schema admission + BFF status route + thin UI poll-on-accepted; Pillow semantic SHA frozen.  
**RISK:** Medium (state machine bugs / duplicate visible answers if poll+sync race — mitigate with idempotent delivery).  
**ESTIMATED_IMPLEMENTATION_COMPLEXITY:** M (days, not weeks) for MVA.  
**EXPECTED_RELIABILITY_GAIN:** Eliminates Gen3 class entirely; converts Gen2-class into resume/retrieve; stops false “please retry” for non-retryable admission.

---

## J. Exactly-once / semantics

Chat answers: **at-least-once execution** with **exactly-once visible delivery** via `requestId` + stored final result. Side effects remain out of band (reasoning frozen; future actions must key on `requestId`).

---

## K. Required executive UX (binding)

- Ordinary ask should not require manual retry.  
- Transient recycle must not lose ownership of the ask.  
- Valid brain output must be retrievable after transport break.  
- Long session must remain usable (context admission).  
- No false durable-recovery claims until durable path exists.  
- User retry only for fatal client errors (empty message, auth) or explicit cancel.

---

## L. Failure taxonomy (target)

| Class | Behavior |
|---|---|
| REQUEST_NOT_ACCEPTED | Fix envelope / show validation; **do not** ask blind retry of identical payload |
| WORKER_UNAVAILABLE | Wait/requeue durable job |
| BRAIN_RETRYABLE_FAILURE | Tier-0/job retry |
| BRAIN_FATAL_FAILURE | Surface fatal; no infinite retry |
| BRAIN_SUCCESS | Persist result; deliver or poll |
| POSTPROCESS_FAILURE | Prefer preserve raw brain |
| DELIVERY_FAILURE | Retrieve from store |
| CLIENT_DISCONNECTED | Job continues; client reconnects |

---

## M. Simplification

**COMPONENTS_BEFORE≈** UI retry + BFF retry + Tier-0 recovery + worker rebound + sanitizer + dual obs rings + hard Zod continuity + ephemeral accept  

**TARGET_COMPONENTS_AFTER≈** UI (send/poll/render) + thin BFF (proxy/observe) + Tier-0 (admit, durable job/result, single transport retry) + worker (brain only) + unified forensics  

**REMOVE/MERGE/DEMOTE:** competing FE recovery claims; umbrella terminal; hard-fail on continuity turns; BFF semantic rewrite beyond footer strip.

---

## N. Lead decision

Architecture lead (this mission) **approves OPTION E / MVA above** for implementation.  
No Grand King wait. No incremental timeout/sanitizer/5xx-only patch as the closure mechanism.
