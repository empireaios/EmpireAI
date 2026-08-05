# Q0-20 Task Negotiation Protocol

**Status:** FINAL PASS  
**Doctrine:** PILLOW-TNP-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-20 Task Negotiation Protocol  
**Primary Deliverable:** Allows workers to negotiate task ownership, dependencies, handoffs and required support.

> Doctrine ID uses **PILLOW-TNP-001**. Task Negotiation Protocol coordinates ownership before execution and never replaces Workforce Orchestrator.

## How Q0-20 works

1. Workforce Orchestrator submits a task into the authoritative Task Negotiation Protocol.
2. Candidate workers declare capability or decline work.
3. Ownership is resolved; supporting workers and dependency chains are assigned.
4. Conflicts (for example ownership ties) are detected and unresolved negotiations escalate to Pillow.
5. Every negotiation emits a machine-readable Negotiation Record (`TNP-001-v1`).
6. Task Negotiation Protocol never executes worker tasks, replaces Workforce Orchestrator, replaces Pillow, overrides Grand King, or performs strategic planning.

## Negotiation outcomes

`accepted`, `declined`, `shared_ownership`, `delegated`, `escalated`, `waiting_dependency`, `cancelled`

## Verification

`npx --yes tsx --test "src/validation/tests/task-negotiation-protocol.test.ts"` — 10 passing, 0 failing.
