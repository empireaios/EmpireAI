# Q0-15 Operational Playbook Engine

**Status:** FINAL PASS  
**Doctrine:** PILLOW-OPBK-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-15 Operational Playbook Engine  
**Primary Deliverable:** Executes approved SOPs, business playbooks, marketplace playbooks, marketing playbooks and finance playbooks.

> Doctrine ID uses **PILLOW-OPBK-001** because `PILLOW-OPE-001` and `PILLOW-PBE-001` are reserved. Distinct from backend `empire-playbook-engine`.

## How Q0-15 works

1. Pillow registers and retrieves approved playbooks through the authoritative Operational Playbook Engine.
2. Playbooks are categorized, versioned, and integrity-validated.
3. Intent/category selection identifies the correct playbook; steps are interpreted into an executable workflow.
4. Prerequisites are validated and execution progress is tracked without performing worker tasks.
5. Every prepare/track cycle emits a machine-readable Playbook Execution Record (`OPBK-001-v1`).
6. Operational Playbook Engine never executes worker tasks, replaces workers, replaces Workforce Orchestrator, overrides Pillow, or overrides Grand King.

## Playbook categories

`business`, `commerce`, `media`, `marketplace`, `marketing`, `finance`, `customer_service`, `operations`, `recovery`, `emergency`

## Verification

`npx --yes tsx --test "src/validation/tests/operational-playbook-engine.test.ts"` — 10 passing, 0 failing.
