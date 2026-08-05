# Q0-12 Skill & Tool Router

**Status:** FINAL PASS  
**Doctrine:** PILLOW-STR-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-12 Skill & Tool Router  
**Primary Deliverable:** Routes tasks to the correct worker and approved tool based on capability, context, risk and cost.

## How Q0-12 works

1. Pillow submits executive intent to the authoritative Skill & Tool Router instead of selecting workers or tools manually.
2. Required capabilities are analysed and the Workforce Capability Registry-aligned catalog is queried.
3. Suitable workers and approved tools are matched using extensible routing factors (capability, availability, performance, authority, compatibility, security, cost, risk, business context).
4. Routing recommendations, alternatives, risk/cost assessments, and machine-readable Routing Records (`STR-001-v1`) are produced.
5. Skill & Tool Router never executes work, performs orchestration, replaces workers, overrides Pillow, or overrides Grand King.

## Routing factors

`worker_capability`, `worker_availability`, `worker_performance`, `worker_authority`, `tool_compatibility`, `tool_availability`, `security`, `cost`, `risk`, `business_context`

## Verification

`npx --yes tsx --test "src/validation/tests/skill-tool-router.test.ts"` — 10 passing, 0 failing.
