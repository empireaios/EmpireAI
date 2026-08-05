# Q1-05 Authority Matrix

**Status:** FINAL PASS  
**Doctrine:** PILLOW-AMX-001  
**Programme:** Q1 — Workforce Factory Foundation  
**Mission:** Q1-05 Authority Matrix  
**Primary Deliverable:** Define what workers may decide alone, what requires Pillow, and what requires Grand King approval.

> Doctrine ID uses **PILLOW-AMX-001**. Authority Matrix defines and governs only; it never executes worker tasks, replaces Approval Router, replaces Organization Charter, overrides Pillow, or overrides Grand King.

## How Q1-05 works

1. The authoritative Authority Matrix is defined (`AMX-MATRIX-v1`).
2. Authority rules cover decision categories with permitted/restricted actions.
3. Approval levels escalate from autonomous worker decisions through Pillow to Grand King.
4. Workers, departments and factories derive authority bindings from the matrix.
5. Machine-readable authority definitions are produced (`AMX-001-v1`).

## Prerequisites

- Q0 Unified Workforce Certification (`PILLOW-UWC-001` / Q0-30)
- Q1-01 Worker Constitution (`PILLOW-WCT-001`)
- Q1-02 Organization Charter (`PILLOW-OCH-001`)
- Q1-03 Role Taxonomy (`PILLOW-RTX-001`)
- Q1-04 Skill Taxonomy (`PILLOW-STX-001`)

## Authority levels

`autonomous_worker_decision`, `manager_approval`, `department_approval`, `factory_approval`, `pillow_approval`, `grand_king_approval`

## Decision categories

`information_retrieval`, `planning`, `business_operations`, `financial_decisions`, `marketplace_actions`, `media_publishing`, `infrastructure_changes`, `security`, `data_management`, `customer_communications`, `external_integrations`

## Mandatory authority rules

`who_may_perform_defined`, `approval_required_defined`, `maximum_authority_defined`, `escalation_path_defined`, `risk_level_defined`, `audit_requirements_defined`, `required_approval_valid`, `no_bypass_authority_matrix`, `inherits_from_valid_parent`, `pillow_executive_authority`, `grand_king_supreme_authority`

## Verification

`npx --yes tsx --test "src/validation/tests/authority-matrix.test.ts"` — 10 passing, 0 failing.
