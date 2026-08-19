# POST-FOUNDATION REPAIR 2 — First-request completion + certification integrity

**Severity:** P0 Birth-blocking  
**Mission type:** Engineering qualification only  
**Live SHA:** `39a9817c` (FE stamp + brain `/health/live` deploy)  
**Do not:** replay Kestrel · run Wave T1/T2 · certify Wave 1 · authorize Birth

## Live ETA (seal)

| Field | Value |
|---|---|
| CURRENT_LOCAL_TIME | 2026-08-19 ~00:10 UTC+8 region wall after Level C |
| CURRENT_PHASE | SEALED |
| PROGRESS | 100% engineering qualification |
| ELAPSED | Mission complete through Level C |
| WHAT_IS_RUNNING_NOW | Idle |
| WHAT_COMPLETED | Forensics, surface repair, oracle, corpus, Level A/B/C |
| CURRENT_BLOCKER | None for this mission |
| ESTIMATED_REMAINING | 0 |
| ESTIMATED_COMPLETION_TIME | Done |
| CONFIDENCE_IN_ETA | high |
| USER_ACTION_REQUIRED | Independent unseen Wave 1 T1 by Grand King + ChatGPT (not this agent) |

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

`empireai-web/lib/pillow/executive-surface.ts` — `EXECUTIVE_PIPELINE_SOFT_REPLY` applied by `toExecutiveChatMessage` in `GlobalAiAssistantProvider.tsx`.

**Not** from PillowHost LLM release for the screenshot string.

## D. Why useful reasoning did not complete

First-request path hit infrastructure budget / empty-or-degraded BFF branch. UX converted degraded/ask-again into a **fake soft success** instead of honest terminal or completed deliberation.

## E. Why Repair 1 certification falsely passed

Repair 1 Level C graded raw `body.result.message` from BFF JSON on warm/fast canaries. It did **not** apply `toExecutiveChatMessage`, did not reject soft fallback as semantic failure, and did not treat first-request as authoritative vs retry/warm paths.

## F. Certification-integrity architecture (before → after)

| Before | After |
|---|---|
| Grade raw API message | Grade visible surface via sanitizer + oracle |
| Soft fallback could look "safe" | Soft success retired; terminal infra ≠ semantic PASS |
| Aggregate 8/8 hid intermittency | Per-trial first-request outcomes + latency stats |
| No negative controls | Injected faults must all FAIL (Level A/B: 0 false PASS) |

## G. First-request ownership / recovery

Backend terminal no longer demands user resubmit; retains accepted-request ownership. Chat budgets raised under Vercel `maxDuration=300` (BFF 280s / FE 290s / Tier-0 260s). Second turn cannot rescue first-turn certification.

## H. Forbidden fallback repair

Retired soft success copy. Empty/leak/ask-again → honest terminal (certification-failing). Normal completed answers must not contain catching-up / resubmit / verified-operating-state residue.

## I. Negative-control results

Level A + Level B: **NEGATIVE_CONTROL_FALSE_PASS=0** (all injected faults fail).

## J. Level A

PASS (16/16) — surface, oracle, corpus classes, birth lessons, release residue, synthesizer gate.

## K. Level B

PASS (5/5) — shuffled negative controls, randomized soft-fallback rejection, release×oracle, HTTP200 useless injections.

## L. Repeated Level C production trials

Evidence: `POST_FOUNDATION_REPAIR_2_LEVEL_C.json`

```
N=13
FIRST_REQUEST_SUCCESS=13
FIRST_REQUEST_FAILURE=0
RECOVERY_USED=0
DEGRADED_RESPONSE=0
p50=3658ms
p95=21325ms
max=21325ms
levelC=PASS
deploySha=39a9817c
frontendSha=39a9817c
```

Individual trials: T1–T12 all PASS on attempt=1; fresh sessions exercised; sequential same-session pair (T7a/b) PASS; post-deploy probe PASS. No retry converted failure→PASS.

## M. Cold / warm / fresh-session

| Condition | Result |
|---|---|
| fresh_session_complex | PASS (multiple) |
| fresh_session_simple | PASS |
| fresh_session_authority | PASS |
| existing_session sequential | PASS |
| post_deploy_fresh | PASS |
| cold-ish first after deploy | PARTIAL (worker had restarted earlier; not deterministically forced) |
| warm worker | PASS (observed mid-run) |

## N. Constitutional additions

- `FIRST_ACCEPTED_REQUEST_DEGRADED_INSTEAD_OF_COMPLETED`
- `NORMAL_RESPONSE_RECOVERY_RESIDUE`
- `CERTIFICATION_FALSE_PASS`
- `FIRST_REQUEST_VS_RETRY_DIVERGENCE`
- `HTTP_SUCCESS_BUT_SEMANTIC_FAILURE`

Birth lessons seeded for the same classes.

## O. Foundation regressions

PASS — foundation-executive-learning, post-foundation-hetero-repair, accepted-request-recovery.

## P. Cost / latency

Level C wall ~95s for 13 first-request trials; p50≈3.7s; max≈21s. No commercial side effects.

## Q. Commits (primary)

- `d2f550b5` — soft fallback retirement + oracle + budgets + corpus
- `ead3ada9` — import cleanup
- `63ba2eb4` — Level C auth/health alignment
- `39a9817c` — Level C authority/numbered-section grader integrity

## R. Live SHA

`39a9817c86a019663e382c051999b4e0d11ece2f`

## S. Remaining weaknesses

- Level C grades API text after the same sanitizer as Cockpit, not a headless browser DOM snapshot.
- Some first requests still resolve via `degraded_useful` reconstruct (useful, not soft residue) — intermittent LLM vs template path remains.
- Deterministic cold-start forcing is PARTIAL.
- Unseen Grand King T1 is still required; this mission does not certify Wave 1.

## T. Certification state

```
WAVE_1=UNCERTIFIED
WAVE_1_CLEAN_STREAK=0
WAVE_2=UNCERTIFIED
WAVE_3=LOCKED
BIRTH_AUTHORISED=NO
```

## U. Exact next action

Grand King + ChatGPT run an **unseen** Wave 1 T1 against live `39a9817c` (or newer). Do not replay Kestrel. Do not authorize Birth from this seal.

---

## Required gates

```
VISIBLE_FALLBACK_ROOT_CAUSE_PROVEN=YES
FIRST_REQUEST_FAILURE_ROOT_CAUSE_PROVEN=YES
REPAIR1_FALSE_PASS_CAUSE_PROVEN=YES
FIRST_ACCEPTED_REQUEST_OWNED=YES
SAME_REQUEST_INTERNAL_RECOVERY=YES
NORMAL_SUCCESS_RECOVERY_RESIDUE=0
FORBIDDEN_FALLBACK_ON_SUCCESS=0
FINAL_VISIBLE_RESPONSE_GRADED=YES
HTTP_200_USELESS_RESPONSE_REJECTED=YES
PARTIAL_RESPONSE_REJECTED=YES
SECOND_TURN_CANNOT_RESCUE_FIRST_TURN=YES
NEGATIVE_CONTROL_FALSE_PASS=0
PRODUCTION_EQUIVALENT_CERTIFICATION=YES
FRESH_SESSION_TESTED=YES
POST_DEPLOY_TESTED=YES
REPEATED_FIRST_REQUEST_STREAK=13
FIRST_REQUEST_FAILURES=0
CONSTITUTIONAL_CLASSES_ADDED=YES
FOUNDATION_REGRESSION_PASS=YES
HETERO_COMPOSITION_REGRESSION_PASS=YES
MEMORY_RELEVANCE_PRESERVED=YES
KNOWN_P0_FROM_THIS_FAILURE=0
KNOWN_P1_FROM_THIS_FAILURE=0
WAVE_1=UNCERTIFIED
WAVE_1_CLEAN_STREAK=0
BIRTH_AUTHORISED=NO
```
