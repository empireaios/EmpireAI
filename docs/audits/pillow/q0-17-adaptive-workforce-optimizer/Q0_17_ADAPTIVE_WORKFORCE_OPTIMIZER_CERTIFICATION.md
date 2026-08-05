# Q0-17 Adaptive Workforce Optimizer

**Status:** FINAL PASS  
**Doctrine:** PILLOW-AWO-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-17 Adaptive Workforce Optimizer  
**Primary Deliverable:** Improves worker assignment, routing, collaboration and execution quality over time.

> Doctrine ID uses **PILLOW-AWO-001** because `PILLOW-WFO-001` is reserved for Workflow Optimization (T2-05). Adaptive Workforce Optimizer analyses and recommends only.

## How Q0-17 works

1. Pillow analyses workforce performance, utilization, routing, and collaboration through the authoritative Adaptive Workforce Optimizer.
2. Bottlenecks, overloaded workers, underutilized workers, and idle workers are detected from operational snapshots.
3. Optimization recommendations cover workforce, routing, collaboration, and capability improvements.
4. Every analysis cycle emits a machine-readable Optimization Record (`AWO-001-v1`).
5. Adaptive Workforce Optimizer never executes worker tasks, modifies workers automatically, replaces Pillow, overrides Grand King, or performs strategic planning.

## Optimization targets

`worker_assignment`, `worker_utilization`, `worker_performance`, `collaboration`, `routing`, `queue_efficiency`, `throughput`, `accuracy`, `reliability`, `operational_cost`

## Verification

`npx --yes tsx --test "src/validation/tests/adaptive-workforce-optimizer.test.ts"` — 10 passing, 0 failing.
