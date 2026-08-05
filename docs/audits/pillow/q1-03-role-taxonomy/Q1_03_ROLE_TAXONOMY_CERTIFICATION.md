# Q1-03 Role Taxonomy

**Status:** FINAL PASS  
**Doctrine:** PILLOW-RTX-001  
**Programme:** Q1 — Workforce Factory Foundation  
**Mission:** Q1-03 Role Taxonomy  
**Primary Deliverable:** Define worker categories, executive roles, manager roles, specialist roles, reviewer roles and support roles.

> Doctrine ID uses **PILLOW-RTX-001**. Role Taxonomy defines and classifies only; it never executes worker tasks, replaces Organization Charter, replaces Worker Constitution, overrides Pillow, or overrides Grand King.

## How Q1-03 works

1. The authoritative Role Taxonomy is defined (`RTX-TAX-v1`).
2. Mandatory role categories are registered (executive through system).
3. Roles declare purpose, responsibilities, authority, reporting, skills, quality and governance.
4. Workers inherit exactly one taxonomy role with a validated parent chain.
5. Machine-readable role definitions are produced (`RTX-001-v1`).

## Prerequisites

- Q0 Unified Workforce Certification (`PILLOW-UWC-001` / Q0-30)
- Q1-01 Worker Constitution (`PILLOW-WCT-001`)
- Q1-02 Organization Charter (`PILLOW-OCH-001`)

## Mandatory role categories

`executive`, `director`, `manager`, `lead`, `specialist`, `reviewer`, `analyst`, `coordinator`, `support`, `system`

## Mandatory role rules

`exactly_one_role_category`, `purpose_defined`, `responsibilities_defined`, `decision_authority_defined`, `escalation_authority_defined`, `reporting_structure_defined`, `required_skills_defined`, `quality_standard_required`, `governance_rules_required`, `inherits_from_valid_parent`

## Verification

`npx --yes tsx --test "src/validation/tests/role-taxonomy.test.ts"` — 10 passing, 0 failing.
