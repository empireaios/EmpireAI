# Q1-02 Organization Charter

**Status:** FINAL PASS  
**Doctrine:** PILLOW-OCH-001  
**Programme:** Q1 — Workforce Factory Foundation  
**Mission:** Q1-02 Organization Charter  
**Primary Deliverable:** Define departments, reporting lines, authority, responsibilities and escalation to Pillow.

> Doctrine ID uses **PILLOW-OCH-001**. Organization Charter defines and registers only; it never executes worker tasks, replaces Workforce Operating System, replaces Workforce Orchestrator, overrides Pillow, or overrides Grand King.

## How Q1-02 works

1. The authoritative Organization Charter is defined (`OCH-CHARTER-v1`).
2. Factories and departments are registered under Pillow executive authority.
3. Workers register to exactly one department with a reporting chain.
4. Reporting and escalation hierarchies are validated to Pillow.
5. A machine-readable organizational structure is produced (`OCH-001-v1`).

## Prerequisites

- Q0 Unified Workforce Certification (`PILLOW-UWC-001` / Q0-30)
- Q1-01 Worker Constitution (`PILLOW-WCT-001`)

## Mandatory organizational rules

`pillow_supreme_executive_authority`, `worker_belongs_to_exactly_one_department`, `department_belongs_to_one_factory`, `factory_reports_to_pillow`, `worker_has_reporting_chain`, `responsibility_has_owner`, `escalation_reaches_pillow`, `no_worker_outside_organization`

## Verification

`npx --yes tsx --test "src/validation/tests/organization-charter.test.ts"` — 10 passing, 0 failing.
