# Q0-22 Escalation Framework

**Status:** FINAL PASS  
**Doctrine:** PILLOW-ESF-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-22 Escalation Framework  
**Primary Deliverable:** Escalates unresolved disagreement, risk, missing data or authority limits back to Pillow.

> Doctrine ID uses **PILLOW-ESF-001**. Escalation Framework manages escalation only and never resolves business problems itself.

## How Q0-22 works

1. Workers and Executive Intelligence components submit escalation signals to the authoritative Escalation Framework.
2. The framework detects unresolved disagreement, low confidence, missing information, conflicting evidence, authority/policy violations, deadlocks, and repeated failures.
3. Escalation requests are generated with supporting evidence and risk assessment.
4. Escalations are routed to Pillow; Pillow remains final executive authority.
5. Every escalation emits a machine-readable Escalation Record (`ESF-001-v1`).
6. Escalation Framework never executes worker tasks, resolves business disputes, overrides Pillow, overrides Grand King, or replaces executive judgement.

## Escalation categories

`low_confidence`, `missing_information`, `conflicting_recommendations`, `policy_violation`, `authority_limit`, `worker_deadlock`, `technical_failure`, `business_risk`, `security_risk`, `executive_decision_required`

## Escalation priorities

`critical`, `high`, `medium`, `low`

## Verification

`npx --yes tsx --test "src/validation/tests/escalation-framework.test.ts"` — 10 passing, 0 failing.
