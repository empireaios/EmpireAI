# Q1-11 Worker Performance Review

**Status:** FINAL PASS  
**Doctrine:** PILLOW-WPR-001  
**Programme:** Q1 — Workforce Factory Foundation  
**Mission:** Q1-11 Worker Performance Review  
**Primary Deliverable:** Score workers by quality, speed, accuracy, recovery, collaboration and business outcome.

> Doctrine ID uses **PILLOW-WPR-001**. Worker Performance Review evaluates only; it never executes worker tasks, replaces Worker Monitoring, replaces Workforce Certification Monitor, overrides Pillow, or overrides Grand King.

## How Q1-11 works

1. The authoritative Worker Performance Review service is defined (`WPR-PERF-v1`).
2. Active workers are reviewed against extensible performance metrics.
3. Overall scores map to executive ratings; historical deltas detect improving/declining trends.
4. Improvement recommendations and executive reports are produced for Pillow.
5. Machine-readable performance records (`WPR-001-v1`) integrate with Assignment, Certification Monitor and Adaptive Optimizer.

## Prerequisites

- Q0 Unified Workforce Certification (`PILLOW-UWC-001` / Q0-30)
- Q1-01 through Q1-10 (Worker Constitution → Worker Monitoring)

## Performance metrics

`quality`, `accuracy`, `speed`, `reliability`, `consistency`, `collaboration`, `recovery`, `efficiency`, `business_value`, `governance_compliance`

## Performance ratings

`outstanding`, `excellent`, `good`, `acceptable`, `needs_improvement`, `poor`

## Mandatory performance rules

`evaluate_every_active_worker`, `preserve_historical_performance`, `detect_improving_performance`, `detect_declining_performance`, `recommend_improvements`, `integrate_with_worker_assignment_engine`, `integrate_with_workforce_certification_monitor`, `integrate_with_adaptive_workforce_optimizer`

## Verification

`npx --yes tsx --test "src/validation/tests/worker-performance-review.test.ts"` — 10 passing, 0 failing.
