# Q1-07 Worker Registry

**Status:** FINAL PASS  
**Doctrine:** PILLOW-WRG-001  
**Programme:** Q1 — Workforce Factory Foundation  
**Mission:** Q1-07 Worker Registry  
**Primary Deliverable:** Register every worker with identity, role, skills, tools, owner and reporting line.

> Doctrine ID uses **PILLOW-WRG-001**. Worker Registry registers and discovers only; it never executes worker tasks, replaces Workforce Capability Registry, replaces Organization Charter, overrides Pillow, or overrides Grand King.

## How Q1-07 works

1. The authoritative Worker Registry is defined (`WRG-REG-v1`).
2. Workers register with globally unique IDs and mandatory identity fields.
3. Pillow is always the governing authority; reporting lines must reach Pillow.
4. Workers can be retrieved by ID and queried by department, role, or factory.
5. Machine-readable worker records are produced (`WRG-001-v1`).

## Prerequisites

- Q0 Unified Workforce Certification (`PILLOW-UWC-001` / Q0-30)
- Q1-01 Worker Constitution (`PILLOW-WCT-001`)
- Q1-02 Organization Charter (`PILLOW-OCH-001`)
- Q1-03 Role Taxonomy (`PILLOW-RTX-001`)
- Q1-04 Skill Taxonomy (`PILLOW-STX-001`)
- Q1-05 Authority Matrix (`PILLOW-AMX-001`)
- Q1-06 Responsibility Matrix (`PILLOW-RMX-001`)

## Worker states

`registered`, `active`, `busy`, `idle`, `suspended`, `retired`, `disabled`, `offline`

## Mandatory registry rules

`unique_worker_id`, `one_primary_role`, `one_department`, `one_factory`, `pillow_governing_authority`, `reporting_relationship_defined`, `skill_profile_defined`, `approved_tools_defined`, `authority_level_defined`, `certification_status_defined`, `no_unregistered_execution`

## Verification

`npx --yes tsx --test "src/validation/tests/worker-registry.test.ts"` — 10 passing, 0 failing.
