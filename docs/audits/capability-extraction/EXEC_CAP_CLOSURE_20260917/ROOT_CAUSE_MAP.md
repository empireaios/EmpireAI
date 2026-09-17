# Root-cause map (living) — EXEC_CAP_CLOSURE_20260917

WAVE_CREDIT=0 · SC-01 FROZEN · Birth unauthorized · Real commerce locked

## Path (answer-changing authorities)

1. UI/BFF `empireai-web` → `/api/pillow/chat`
2. Brain durable admission (`pcr_*`) / tier0 recycle
3. `pillow-host.routePrompt`:
   - constitutional gate
   - **typed response contract** (`executive-response-contract.ts`) — can short-circuit
   - **Shadow CEO admission** (`chat-admission.ts`) — request-control path
   - command/context/LLM + release gates / polish / DNS
4. Decision case (`executive-decision-case-state.ts`) — eligibility + ranking
5. Fact precedence / commercial arithmetic (`executive-fact-precedence.ts`, `executive-commercial-arithmetic.ts`)

## Confirmed defects

| ID | Finding | Fix status |
|----|---------|------------|
| D-002 | `metricFromBody` / contribution gates used `Number` on digit runs, so `US$5,000` → `5` and `US$4,950` could dominate ranking | **FIXED locally** (parseMoney + comma regex + null-metric UNRESOLVED); regression test added |
| D-001 | Worker exit 78 flapping → tier0_only | OPEN — monitor |
| D-005 | Demo slice substitution | MITIGATED on e45cb051; re-verify on tip |
| D-006 | Accepted without answer | OPEN — WS-A |
| D-007 | V53 missing | OPEN — repo sources |

## P0/P1 priorities for implementation

1. **P1** Keep worker healthy; prove normal-chat completion (WS-A)
2. **P1** Deploy D-002 ranking fix after batch tests
3. **P1** Correction supersession audits (D-003) + arithmetic not demanding selling price (D-004)
4. **P1** Coverage manifest from repo (no V53)
5. Commerce rails / stateful missions after A–B stable

## Ownership

| Fact | Owner |
|------|-------|
| Eligible set / selection | `buildDecisionCaseState` |
| Exact contribution totals | `executive-fact-precedence` + response contract |
| Shadow CEO episode products | `request-owner` + `candidate-evaluation-episode` |
| Demo vertical slice | `/shadow-ceo/run-vertical-slice` only |
| Birth / live commerce | frozen unauthorized |
