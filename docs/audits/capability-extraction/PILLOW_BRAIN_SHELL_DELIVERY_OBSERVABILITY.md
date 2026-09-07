# Pillow Brain → Shell → User Delivery Observability

**MISSION_TYPE:** PRODUCTION_SHELL_OBSERVABILITY_AND_RELIABILITY  
**SEVERITY:** P0 — WAVE CERTIFICATION BLOCKER  
**WAVE_1:** PAUSED  
**WAVE_CREDIT:** 0  
**BIRTH_AUTHORISED:** NO  
**SHELL_READY:** YES  
**PILLOW_REASONING_CHANGED:** NO  

## SHAs / deployment

| Field | Value |
|---|---|
| BASELINE_PILLOW_SEMANTIC_SHA / BEFORE | `b5928344` |
| PILLOW_SEMANTIC_SHA_AFTER | `b5928344` (**UNCHANGED**) |
| INFRASTRUCTURE_SHA | `c03f3788` |
| FRONTEND/BFF_SHA | `c03f3788` |
| DEPLOYMENT_ID (qual window) | `6c21ea0e-3d17-4536-9324-7a23b2d77c27` (Brain tip advancing to `63f38d9c…` / `c03f3788`) |
| DOCS_SEAL_SHA | (this docs commit) |

---

## A. Brain/shell architecture

```
Grand King UI (SCR-800)
→ BFF POST /api/pillow/chat
→ Tier-0 accepted-request recovery
→ Brain worker routePrompt (Pillow reasoning — frozen this mission)
→ BFF decideBffChatSurface + shell observability
→ UI toExecutiveChatMessage
```

Observation points:

| Point | Where |
|---|---|
| REQUEST_INPUT | BFF parsed `{ message, sessionId }` |
| BRAIN_RAW_OUTPUT | Upstream JSON `result.message` **before** sanitize decision |
| SHELL_OUTPUT | After `decideBffChatSurface` |
| USER_DELIVERY_OUTPUT | Final BFF JSON body + headers |

---

## B–C. Observation + correlation

Implemented in:

- `empireai-web/lib/pillow/shell-delivery-observability.ts`
- `empireai-web/lib/pillow/bff-chat-sanitize.ts`
- `empireai-web/app/api/pillow/[...path]/route.ts`

| Capture | Field |
|---|---|
| TRACE_ID | `shellTraceId` / `x-empire-shell-trace-id` |
| BRAIN hash/preview/length | `brainOutputHash`, preview in ring |
| SHELL hash | `shellOutputHash` |
| DELIVERY_CLASS | `BRAIN_ANSWER_UNCHANGED` \| `ALLOWED_FORMAT_TRANSFORM` \| `DEGRADED_TERMINAL` \| … |
| BRAIN_TO_USER_EQUIVALENT | boolean + header |
| Dashboard | `GET /api/pillow/shell-observability` |

`BRAIN_CAPTURE_IMPLEMENTED=YES`  
`SHELL_CAPTURE_IMPLEMENTED=YES`  
`USER_DELIVERY_CAPTURE_IMPLEMENTED=YES`  
`TRACE_CORRELATION_IMPLEMENTED=YES`

---

## D–E. LumaHome / NovaCart traces

| Field | Value |
|---|---|
| LUMAHOME_TRACE_FOUND | **NO** (no retained request IDs / logs in-repo) |
| NOVACART_TRACE_FOUND | **NO** |

Mechanism proven by **unit + live path** for the residual post-`1d0f5c59` bug class (below), not by recovering those IDs.

---

## F. Post-`1d0f5c59` failure root cause

**POST_FIX_FAILURE_ROOT_CAUSE:**  
BFF `empty_message_after_strip` — after footer-strip fix, **any line** containing `product focus` / `realised commerce` was dropped. Single-paragraph answers (typical LumaHome / operating brief) that *include* those phrases as content were reduced to **empty** → whole answer replaced with infrastructure-budget terminal.

**FIRST_DIVERGENCE_AFTER_BRAIN:** BFF `decideBffChatSurface` (shell), not Pillow reasoning.

**WHY_PREVIOUS_12_OF_12_MISSED_IT:**  
GK_PATH_QUAL probes mostly produced multi-line calculator/decision answers **without** packing product-focus into every retained line. The false-positive only fires when strip empties the body — so arithmetic/multi-gate cases passed while commerce-brief / single-paragraph product-focus answers still failed in actual chat.

---

## G–I. Shell mutation inventory + fix

| Component | Allowed? | Notes |
|---|---|---|
| Pure footer line strip | YES | ALLOWED_FORMAT_TRANSFORM |
| Whitespace / JSON rewrite | YES | |
| empty_message_after_strip → terminal when brain nonempty | **NO — removed** | |
| FE wipe of substantive answers on ask-again substring | **NO — tightened** | |
| Tier-0 true empty/timeout terminal | YES | truthful wording |

**FIX:**  
1. Never degrade when brain extracted message is nonempty (invariant).  
2. If strip empties, **preserve original** nonempty brain body.  
3. Footer strip only pure footer lines / trailing boilerplate sentences.  
4. Remove false “retains ownership for internal recovery” wording.  
5. Observability headers + ring dashboard.

**VALID_BRAIN_ANSWER_REPLACED invariant:** enforced in `decideBffChatSurface`.

---

## J–K. Recovery wording

Proven: recovery is **in-request only**. User-facing copy updated to:

> Please retry the same ask; there is no durable background recovery after this reply.

---

## L–O. Qualification results

Evidence: `PILLOW_BRAIN_SHELL_TRACE_SUMMARY.json`

| Gate | Result |
|---|---|
| POST_FIX_CONSECUTIVE_CASES | **10/10** |
| BRAIN_TO_USER_EQUIVALENT_RATE | **100%** |
| VALID_BRAIN_ANSWER_REPLACED | **0** |
| DEGRADED_TERMINAL | **0** |
| STATEFUL_SEQUENCE | **4/4** |
| SHELL_RELIABLE_ENVELOPE | **10** |
| G1 / G2 / G4 | **CLEARED** |
| KNOWN_P0 / P1 | **0** |
| SHELL_READY | **YES** |

Dashboard sample during qual: TOTAL_REQUESTS=18, DEGRADED_TERMINALS=0.

---

## P–Q. Brain-vs-shell dashboard + Wave observability

Permanent:

- `GET /api/pillow/shell-observability`
- Response fields: `shellTraceId`, `brainOutputHash`, `shellOutputHash`, `deliveryClass`, `brainToUserEquivalent`

Wave rule (doctrine): if `BRAIN_TO_USER_EQUIVALENT=NO` → classify **PRODUCTION_SHELL_FAIL**, not Pillow cognition FAIL.

---

## R. Stack equivalence

| | Components |
|---|---|
| ACTUAL_GK_STACK | UI → empire-ai.co BFF → Tier-0 → Brain → BFF sanitize → UI |
| DIAGNOSTIC_STACK | Same BFF `/api/pillow/chat`, SCR-800, auth cookie |
| MATERIAL_DIFFERENCE_COUNT | **0** (endpoint/layers) |

---

## S. Remaining weaknesses

- Historical LumaHome/NovaCart TRACE_IDs still unavailable.  
- Brain host finalizers can still rewrite answers *before* BFF (Pillow-host) — out of shell-mission scope; not the LumaHome false terminal class.  
- Extremely warm multi-hour sessions not re-accounted byte-by-byte.

---

## T. Exact next action

**STOP.** Return to Grand King + ChatGPT.  
`CURSOR_MISSIONS_BEFORE_NEXT_PILLOW_TEST=0`.  
ChatGPT issues one new short W1-T1 when ready.

---

## Final stop

```
MISSION_TYPE=PRODUCTION_SHELL_OBSERVABILITY_AND_RELIABILITY
PILLOW_REASONING_CHANGED=NO
SHELL_READY=YES
WAVE_CREDIT=0
WAVE_1=PAUSED
WAVE_1_CLEAN_STREAK=0
BIRTH_AUTHORISED=NO

STOP.
```
