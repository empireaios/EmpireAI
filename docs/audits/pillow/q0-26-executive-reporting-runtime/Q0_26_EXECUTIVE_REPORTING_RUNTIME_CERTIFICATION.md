# Q0-26 Executive Reporting Runtime

**Status:** FINAL PASS  
**Doctrine:** PILLOW-ERT-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-26 Executive Reporting Runtime  
**Primary Deliverable:** Forces every worker and department to report progress, blockers, evidence and completion status to Pillow.

> Doctrine ID uses **PILLOW-ERT-001**. Executive Reporting Runtime standardizes executive reporting only and never performs worker tasks.

## How Q0-26 works

1. Workers, departments, factories, and executive components submit structured reports.
2. Progress, blockers, risks, evidence, and completion status are tracked.
3. Progress is aggregated and blockers remain visible to Pillow.
4. Executive summaries are generated on demand.
5. Every submission emits a machine-readable Report Record (`ERT-001-v1`).
6. Executive Reporting Runtime never executes worker logic, replaces Monitoring Runtime, replaces Mission Coordination, overrides Pillow, or overrides Grand King.

## Report types

`progress_report`, `status_report`, `completion_report`, `blocker_report`, `risk_report`, `exception_report`, `executive_summary`, `department_summary`, `factory_summary`

## Reporting frequencies

`real_time`, `event_driven`, `scheduled`, `on_demand`

## Verification

`npx --yes tsx --test "src/validation/tests/executive-reporting-runtime.test.ts"` — 10 passing, 0 failing.
