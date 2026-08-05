# Q0-01 Executive Planner

**Status:** FINAL PASS  
**Doctrine:** PILLOW-EP-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-01 Executive Planner  
**Primary Deliverable:** Pillow plans execution before assigning work to the AI Workforce.

## How Q0-01 works

1. Pillow submits a high-level objective to the Executive Planner (`submitObjective` / host `POST /api/pillow/executive-planner/submit-objective`).
2. The Objective Analyzer extracts intent, constraints, priorities, risks, assumptions, dependencies, approval needs, and success criteria using structural keyword rules (no LLM, no tools).
3. The Execution Plan Builder produces a machine-readable `ExecutionPlan` (`EP-001-v1`) with stages, deliverables, and required workforce **categories**.
4. Workers are never assigned. Work is never executed. Tools are never invoked. Actions are never approved.

## Boundaries

| Allowed | Forbidden |
|---------|-----------|
| Accept objective | Execute work |
| Produce structured plan | Assign workers |
| Identify workforce categories | Invoke tools |
| Validate plan completeness | Approve actions |

## Verification

`npx --yes tsx --test "src/validation/tests/executive-planner.test.ts"` — 10 passing, 0 failing.
