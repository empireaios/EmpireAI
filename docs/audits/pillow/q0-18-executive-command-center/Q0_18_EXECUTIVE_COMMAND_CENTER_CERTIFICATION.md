# Q0-18 Pillow Executive Command Center

**Status:** FINAL PASS  
**Doctrine:** PILLOW-PECC-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-18 Pillow Executive Command Center  
**Primary Deliverable:** Provides Pillow with one unified command layer over all workers, tools, missions, approvals and reports.

> Doctrine ID uses **PILLOW-PECC-001** because `PILLOW-ECC-001` is reserved for Execution Control Center (P6-01). Distinct from backend execution-layer ExecutiveCommandCenter views.

## How Q0-18 works

1. Pillow submits executive commands through the authoritative Executive Command Center.
2. Commands are routed to registered services: workers, tools, missions, business state, approvals, execution memory, decision memory, and executive reports.
3. Structural views are aggregated without executing worker logic.
4. Every command emits a machine-readable Executive Command Record (`PECC-001-v1`).
5. Executive Command Center never executes worker logic, replaces Workforce Orchestrator, replaces workers, overrides Pillow, or overrides Grand King.

## Supported command types

`executive_query`, `executive_planning`, `executive_monitoring`, `executive_reporting`, `executive_routing`, `executive_inspection`, `executive_review`, `executive_approval`, `executive_recovery`, `executive_coordination`

## Verification

`npx --yes tsx --test "src/validation/tests/executive-command-center.test.ts"` — 10 passing, 0 failing.
