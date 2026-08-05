# Q0-06 Approval Router

**Status:** FINAL PASS  
**Doctrine:** PILLOW-AR-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-06 Approval Router  
**Primary Deliverable:** Routes actions requiring Grand King approval before execution.

## How Q0-06 works

1. Pillow submits an execution request to the authoritative Approval Router.
2. Configurable policies classify the approval level (autonomous, Pillow, Grand King, multi-stage).
3. An Approval Request package is generated and non-autonomous actions enter the pending queue.
4. Execution remains blocked until an external authority records an approved outcome.
5. Approval Router never approves, executes, assigns workers, overrides Pillow, or overrides Grand King.

## Approval levels

`autonomous`, `pillow_approval`, `grand_king_approval`, `multi_stage_approval`

## Approval states

`pending`, `approved`, `rejected`, `cancelled`, `expired`, `escalated`

## Verification

`npx --yes tsx --test "src/validation/tests/approval-router.test.ts"` — 10 passing, 0 failing.
