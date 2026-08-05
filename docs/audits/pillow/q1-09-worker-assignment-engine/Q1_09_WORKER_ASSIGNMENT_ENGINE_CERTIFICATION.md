# Q1-09 Worker Assignment Engine

**Status:** FINAL PASS  
**Doctrine:** PILLOW-WAE-001  
**Programme:** Q1 — Workforce Factory Foundation  
**Mission:** Q1-09 Worker Assignment Engine  
**Primary Deliverable:** Assign workers to missions based on skills, availability, risk, cost and dependencies.

> Doctrine ID uses **PILLOW-WAE-001**. Worker Assignment Engine recommends only; it never executes worker tasks, replaces Workforce Orchestrator, replaces Task Negotiation Protocol, overrides Pillow, or overrides Grand King.

## How Q1-09 works

1. The authoritative Worker Assignment Engine is defined (`WAE-ASN-v1`).
2. Pillow submits mission requirements; the engine discovers and scores eligible workers.
3. Mandatory rules exclude uncertified, unavailable, authority-exceeding, and matrix-violating candidates.
4. Primary and supporting workers are recommended with explicit assignment reasoning.
5. Machine-readable assignment records are produced (`WAE-001-v1`).

## Prerequisites

- Q0 Unified Workforce Certification (`PILLOW-UWC-001` / Q0-30)
- Q1-01 through Q1-08 (Worker Constitution → Worker Lifecycle)

## Assignment factors

`skills`, `certification`, `availability`, `current_workload`, `authority`, `required_tools`, `dependencies`, `risk`, `cost`, `historical_performance`

## Mandatory assignment rules

`never_assign_uncertified_workers`, `never_assign_unavailable_workers`, `never_exceed_worker_authority`, `never_violate_authority_matrix`, `respect_responsibility_matrix`, `respect_worker_lifecycle_status`, `respect_worker_certification_status`

## Verification

`npx --yes tsx --test "src/validation/tests/worker-assignment-engine.test.ts"` — 10 passing, 0 failing.
