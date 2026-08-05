# Q1-08 Worker Lifecycle

**Status:** FINAL PASS  
**Doctrine:** PILLOW-WLC-001  
**Programme:** Q1 — Workforce Factory Foundation  
**Mission:** Q1-08 Worker Lifecycle  
**Primary Deliverable:** Create, onboard, activate, pause, retire, replace and audit workers.

> Doctrine ID uses **PILLOW-WLC-001**. Worker Lifecycle governs transitions only; it never executes worker tasks, replaces Worker Registry, replaces Workforce Certification Monitor, overrides Pillow, or overrides Grand King. Workers are never permanently deleted.

## How Q1-08 works

1. The authoritative Worker Lifecycle is defined (`WLC-LIFE-v1`).
2. Workers progress through standardized states with immutable history.
3. Registration precedes onboarding; onboarding precedes activation; certification precedes production use.
4. Suspension, resumption, replacement, retirement, archival, audit and restoration are governed transitions.
5. Retirement and replacement require Pillow authorization.
6. Machine-readable lifecycle records are produced (`WLC-001-v1`).

## Prerequisites

- Q0 Unified Workforce Certification (`PILLOW-UWC-001` / Q0-30)
- Q1-01 Worker Constitution (`PILLOW-WCT-001`)
- Q1-02 Organization Charter (`PILLOW-OCH-001`)
- Q1-03 Role Taxonomy (`PILLOW-RTX-001`)
- Q1-04 Skill Taxonomy (`PILLOW-STX-001`)
- Q1-05 Authority Matrix (`PILLOW-AMX-001`)
- Q1-06 Responsibility Matrix (`PILLOW-RMX-001`)
- Q1-07 Worker Registry (`PILLOW-WRG-001`)

## Lifecycle states

`created`, `registered`, `onboarding`, `configured`, `certified`, `active`, `busy`, `idle`, `suspended`, `recovering`, `replaced`, `retired`, `archived`

## Mandatory lifecycle rules

`registered_before_onboarding`, `onboarded_before_activation`, `certified_before_production_use`, `preserve_lifecycle_history`, `preserve_audit_records`, `preserve_traceability`, `pillow_authorization_for_retirement`, `pillow_authorization_for_replacement`, `never_permanently_deleted`

## Verification

`npx --yes tsx --test "src/validation/tests/worker-lifecycle.test.ts"` — 10 passing, 0 failing.
