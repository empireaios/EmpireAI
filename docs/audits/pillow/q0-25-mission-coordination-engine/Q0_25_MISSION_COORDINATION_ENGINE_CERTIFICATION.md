# Q0-25 Mission Coordination Engine

**Status:** FINAL PASS  
**Doctrine:** PILLOW-MCE-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-25 Mission Coordination Engine  
**Primary Deliverable:** Coordinates multi-worker missions from planning to execution, review, approval and closure.

> Doctrine ID uses **PILLOW-MCE-001** (not ECC — Execution Control Center). Mission Coordination Engine coordinates mission lifecycle only and never performs worker tasks.

## How Q0-25 works

1. Mission plans are received and mission records are created.
2. The engine coordinates phases from planning through closure.
3. Worker dependencies and approval checkpoints are tracked.
4. Blocked and stalled missions are detected.
5. Missions are completed and closed with machine-readable records (`MCE-001-v1`).
6. Mission Coordination Engine never executes worker logic, replaces Workforce Orchestrator, replaces Executive Planner, overrides Pillow, or overrides Grand King.

## Mission states

`planned`, `waiting`, `ready`, `running`, `waiting_approval`, `blocked`, `paused`, `recovering`, `completed`, `cancelled`, `failed`

## Mission phases

`planning`, `preparation`, `execution`, `review`, `approval`, `completion`, `closure`

## Verification

`npx --yes tsx --test "src/validation/tests/mission-coordination-engine.test.ts"` — 10 passing, 0 failing.
