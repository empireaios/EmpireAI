# PILLOW T1 Systemic Epistemic Repair — Round 2 (Release Gate)

**Date:** 2026-08-13  
**Baseline before repair:** `03b39ded`  
**Birth:** FORBIDDEN (`BIRTH_AUTHORISED=NO`, `BIRTH_TIMESTAMP=NULL`)  
**Sealed exam:** not requested, searched, encoded, or executed

## Failure class (independent retest)

Round 1 detectors worked but too late: invalid primary executive prose reached Grand King, then an `Epistemic corrections` appendix was appended. Architecture was draft→deliver→correct. Birth requires draft→validate→repair→revalidate→release|fail-closed.

## Architecture change

New module: `backend/src/orchestration/pillow-host/executive-release-gate.ts`

- `validateExecutiveDraft` (truth + epistemic + appendix leak)
- `reconstructExecutiveAnswer` (deterministic CURRENT_VERIFIED reconstruction; **0 extra LLM calls**)
- `failClosedExecutiveAnswer`
- `releaseExecutiveAnswer` / `enforceExecutiveTruthGrounding` (compatibility)

Host wiring (`pillow-host.ts`): post-LLM path always runs release gate; released message replaces draft; telemetry logged (`releasePath`, violation counts).

Streaming: `/api/pillow/chat/stream` awaits full `routePrompt` then tokenizes the **already gated** message — raw unvalidated LLM tokens are not streamed to Grand King.

## Test results (Cursor)

| Round | Harness | Result |
|------|---------|--------|
| A | `executive-release-gate.test.ts` + `executive-epistemic-grounding.test.ts` | **20/20 PASS** |
| B | `pillow-epistemic-adversarial-cert.mjs` | **15/15 PASS** |
| C | `pillow-epistemic-live-regression.mjs` | run after deploy |

## Anti-gaming

- No sealed T1 wording encoded
- Randomized synthetic entities in Round B
- Capability class detectors (not product-answer dictionary)
- Mini Fan / ASIN appear only as live CURRENT_VERIFIED snapshot facts, not exam keys

## Cost / latency

- Normal clean answer: **+0 LLM calls** (deterministic validate only)
- Reconstruction: **+0 LLM calls** (deterministic rebuild)
- Fail-closed: **+0 LLM calls**
- Expected latency: sub-ms to low-ms validation; no nested judge model
