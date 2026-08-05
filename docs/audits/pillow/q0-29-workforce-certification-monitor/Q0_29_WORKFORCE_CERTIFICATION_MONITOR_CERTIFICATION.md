# Q0-29 Workforce Certification Monitor

**Status:** FINAL PASS  
**Doctrine:** PILLOW-WCM-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-29 Workforce Certification Monitor  
**Primary Deliverable:** Continuously verifies that workers remain usable, reachable, governed and fit for task assignment.

> Doctrine ID uses **PILLOW-WCM-001**. Workforce Certification Monitor certifies readiness only and never executes worker tasks, repairs workers automatically, replaces Worker Quality Standard, overrides Pillow, or overrides Grand King.

## How Q0-29 works

1. Registered workers are submitted to the authoritative Workforce Certification Monitor.
2. Availability, reachability, capabilities, tool access, governance, quality, and self-critique compliance are verified.
3. Runtime and dependency health are checked for executive readiness.
4. A certification status is produced and failures are detected continuously.
5. Decertification and recertification update production fitness.
6. Every evaluation emits a machine-readable Certification Record (`WCM-001-v1`).

## Mandatory certification checks

`registration`, `reachability`, `capability`, `approved_tool_access`, `runtime_health`, `governance_compliance`, `quality_standard_compliance`, `self_critique_compliance`, `dependency_health`, `executive_readiness`

## Certification statuses

`certified`, `provisionally_certified`, `suspended`, `decertified`, `pending_review`, `offline`

## Verification

`npx --yes tsx --test "src/validation/tests/workforce-certification-monitor.test.ts"` — 10 passing, 0 failing.
