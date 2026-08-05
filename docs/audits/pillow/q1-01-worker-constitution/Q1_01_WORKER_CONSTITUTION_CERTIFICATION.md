# Q1-01 Worker Constitution

**Status:** FINAL PASS  
**Doctrine:** PILLOW-WCT-001  
**Programme:** Q1 — Workforce Factory Foundation  
**Mission:** Q1-01 Worker Constitution  
**Primary Deliverable:** Define what an AI Worker is, how it behaves, and how it remains governed by Pillow.

> Doctrine ID uses **PILLOW-WCT-001**. Worker Constitution defines and governs only; it never executes worker tasks, replaces Worker Quality Standard, replaces Governance, overrides Pillow, or overrides Grand King.

## How Q1-01 works

1. The authoritative Worker Constitution is defined (`WCT-CONST-v1`).
2. Every AI Worker inherits the constitution before production use.
3. Constitutional compliance is validated against mandatory rules.
4. A machine-readable constitution definition is produced (`WCT-001-v1`).
5. Inheritance records prove workers remain governed by Pillow.

## Prerequisite

Q0 Unified Workforce Certification (`PILLOW-UWC-001` / Q0-30) is implemented and certified.

## Mandatory constitutional rules

`governed_by_pillow`, `follow_executive_instructions`, `never_bypass_pillow`, `never_execute_outside_authority`, `report_all_work`, `preserve_audit_history`, `preserve_traceability`, `follow_worker_quality_standard`, `follow_worker_self_critique_protocol`, `participate_peer_review_when_required`, `use_approved_tools_only`, `escalate_beyond_authority`, `remain_certifiable`

## Verification

`npx --yes tsx --test "src/validation/tests/worker-constitution.test.ts"` — 10 passing, 0 failing.
