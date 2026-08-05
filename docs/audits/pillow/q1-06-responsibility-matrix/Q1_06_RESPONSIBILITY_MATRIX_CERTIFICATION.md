# Q1-06 Responsibility Matrix

**Status:** FINAL PASS  
**Doctrine:** PILLOW-RMX-001  
**Programme:** Q1 — Workforce Factory Foundation  
**Mission:** Q1-06 Responsibility Matrix  
**Primary Deliverable:** Map every worker responsibility, input, output, owner, dependency and approval requirement.

> Doctrine ID uses **PILLOW-RMX-001**. Responsibility Matrix defines and owns only; it never executes worker tasks, replaces Authority Matrix, replaces Organization Charter, overrides Pillow, or overrides Grand King.

## How Q1-06 works

1. The authoritative Responsibility Matrix is defined (`RMX-MATRIX-v1`).
2. Each responsibility has exactly one accountable primary owner and optional supporters.
3. Inputs, outputs, dependencies, approvals, success and failure conditions are mapped.
4. Workers, departments and factories derive ownership bindings from the matrix.
5. Machine-readable responsibility definitions are produced (`RMX-001-v1`).

## Prerequisites

- Q0 Unified Workforce Certification (`PILLOW-UWC-001` / Q0-30)
- Q1-01 Worker Constitution (`PILLOW-WCT-001`)
- Q1-02 Organization Charter (`PILLOW-OCH-001`)
- Q1-03 Role Taxonomy (`PILLOW-RTX-001`)
- Q1-04 Skill Taxonomy (`PILLOW-STX-001`)
- Q1-05 Authority Matrix (`PILLOW-AMX-001`)

## Mandatory responsibility rules

`exactly_one_accountable_owner`, `supporting_workers_optional`, `required_inputs_defined`, `expected_outputs_defined`, `required_approvals_defined`, `dependency_chain_defined`, `escalation_path_defined`, `quality_requirements_defined`, `completion_criteria_defined`, `no_responsibility_outside_matrix`, `no_ambiguous_ownership`

## Verification

`npx --yes tsx --test "src/validation/tests/responsibility-matrix.test.ts"` — 10 passing, 0 failing.
