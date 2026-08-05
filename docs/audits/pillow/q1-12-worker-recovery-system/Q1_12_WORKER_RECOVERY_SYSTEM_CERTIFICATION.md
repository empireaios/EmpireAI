# Q1-12 Worker Recovery System

**Status:** FINAL PASS  
**Doctrine:** PILLOW-WRS-001  
**Programme:** Q1 — Workforce Factory Foundation  
**Mission:** Q1-12 Worker Recovery System  
**Primary Deliverable:** Restart, reassign, rollback or escalate failed and stalled workers.

> Doctrine ID uses **PILLOW-WRS-001**. Worker Recovery System recovers continuity only; it never executes worker business logic, replaces Worker Monitoring, replaces Workforce Orchestrator, overrides Pillow, or overrides Grand King.

## How Q1-12 works

1. The authoritative Worker Recovery System is defined (`WRS-REC-v1`).
2. Recoverable workers register for lifecycle failure detection.
3. Failures, stalls and hangs are analysed against extensible recovery strategies.
4. Safe strategies restart, resume, reassign or roll back work while preserving execution state.
5. Unrecoverable or repeated failures escalate to Pillow with machine-readable recovery records (`WRS-001-v1`).

## Prerequisites

- Q0 Unified Workforce Certification (`PILLOW-UWC-001` / Q0-30)
- Q1-01 through Q1-11 (Worker Constitution → Worker Performance Review)

## Recovery strategies

`retry`, `restart`, `resume`, `rollback`, `reassign`, `replace_worker`, `pause_mission`, `escalate_to_pillow`

## Failure types

`crash`, `hang`, `timeout`, `dependency_failure`, `communication_failure`, `runtime_failure`, `resource_exhaustion`, `validation_failure`, `unknown_failure`

## Mandatory recovery rules

`preserve_mission_integrity`, `preserve_audit_history`, `preserve_execution_history`, `prevent_duplicate_execution`, `respect_authority_matrix`, `respect_worker_lifecycle`, `respect_mission_coordination_engine`, `escalate_when_automatic_recovery_unsafe`

## Verification

`npx --yes tsx --test "src/validation/tests/worker-recovery-system.test.ts"` — 10 passing, 0 failing.
