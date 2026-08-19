# POST-FOUNDATION REPAIR 2 — First-request completion + certification integrity

**Severity:** P0 Birth-blocking  
**Mission type:** Engineering qualification only  
**Do not:** replay Kestrel · run Wave T1/T2 · certify Wave 1 · authorize Birth

## ETA heartbeat (mission start of seal phase)

| Field | Value |
|---|---|
| CURRENT_LOCAL_TIME | (see live shell) |
| CURRENT_PHASE | Commit → deploy → Level C |
| PROGRESS | Level A/B PASS; production Level C pending |
| WAVE_1 | UNCERTIFIED |
| WAVE_1_CLEAN_STREAK | 0 |
| BIRTH_AUTHORISED | NO |

---

## A. Independent production failure

First independent Wave 1 clean-cert T1 against live candidate `6e2bc5a3` failed before useful reasoning. Visible Grand King text was exactly the frontend soft fallback formerly defined as `EXECUTIVE_PIPELINE_SOFT_REPLY`.

## B. Exact failure path

```
Cockpit submit
→ GlobalAiAssistantProvider.askPillow / sendViaPillow
→ sendPillowChat (BFF /api/pillow/chat)
→ BFF proxy (maxDuration was 130s; upstream 125s)
→ Tier-0 accepted-request recovery → worker → PillowHost → LLM → gates → release
→ On empty / timeout / forbidden decoration: BFF returned HTTP 200 + DEGRADED_CHAT_MESSAGE
  ("Please send the same ask once more…")
→ mapPillowChatToAssistantResponse(result.message)
→ toExecutiveChatMessage(message, EXECUTIVE_PIPELINE_SOFT_REPLY)
   matched ask-again / empty / infra leak → replaced entire answer with soft success copy
→ Pillow Centre rendered soft fallback as the completed turn
```

## C. Exact fallback source

`empireai-web/lib/pillow/executive-surface.ts` — `EXECUTIVE_PIPELINE_SOFT_REPLY` applied by `toExecutiveChatMessage` in `GlobalAiAssistantProvider.tsx` (and append paths).

**Not** from PillowHost LLM release for this screenshot string.

## D. Why useful reasoning did not complete

First-request path hit infrastructure budget / empty-or-degraded BFF branch (cold or long deliberation). Instead of waiting under a larger budget or surfacing honest terminal, the UX layer converted degraded/ask-again into a **fake soft success** ("can answer from verified operating state… catching up… will not ask you to resubmit").

## E. Why Repair 1 certification falsely passed

Repair 1 Level C (`pillow-post-foundation-repair1-levelc.mjs`) graded **`body.result.message` from the Cockpit BFF JSON** after successful warm/fast canaries (several trials finished in <1s). It did **not**:

1. Apply `toExecutiveChatMessage` (Grand-King-visible sanitizer)
2. Fail on soft fallback as USEFUL_SEMANTIC_ANSWER
3. Bound first-request authority vs later retry
4. Exercise the cold first-request / FE abort path that produces soft residue

So API 200 + non-empty useful text ⇒ PASS while production UX could still show soft fallback.

## F. Certification-integrity architecture (before → after)

| Before | After |
|---|---|
| Grade raw API message | Grade visible surface via sanitizer + oracle |
| Soft fallback could look "safe" | Soft success retired; terminal infra ≠ semantic PASS |
| Aggregate 8/8 hid intermittency | Per-trial first-request outcomes + streak stats |
| No negative controls | Injected faults must all FAIL |

Oracle module: `empireai-web/lib/pillow/visible-response-oracle.ts` + backend mirror.

## G. First-request ownership / recovery

- Backend terminal no longer demands user resubmit; retains accepted-request ownership language.
- Timeout budget raised under Vercel Pro `maxDuration=300` (BFF 280s / FE 290s / Tier-0 260s).
- Same-request internal recovery architecture preserved; user second turn cannot rescue first-turn cert.

## H. Forbidden fallback repair

Retired soft success copy. Normal completed answers must not contain catching-up / resubmit / verified-operating-state residue. Empty/leak/ask-again → honest terminal (certification-failing).

## I–O. Gates (filled after Level C)

See companion JSON evidence and final report section in chat.

## Constitutional classes added

- `FIRST_ACCEPTED_REQUEST_DEGRADED_INSTEAD_OF_COMPLETED`
- `NORMAL_RESPONSE_RECOVERY_RESIDUE`
- `CERTIFICATION_FALSE_PASS`
- `FIRST_REQUEST_VS_RETRY_DIVERGENCE`
- `HTTP_SUCCESS_BUT_SEMANTIC_FAILURE`

## Certification state (immutable this mission)

```
WAVE_1=UNCERTIFIED
WAVE_1_CLEAN_STREAK=0
WAVE_2=UNCERTIFIED
WAVE_3=LOCKED
BIRTH_AUTHORISED=NO
```
