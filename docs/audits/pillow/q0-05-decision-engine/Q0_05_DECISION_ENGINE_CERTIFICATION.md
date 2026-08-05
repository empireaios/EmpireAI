# Q0-05 Decision Engine

**Status:** FINAL PASS  
**Doctrine:** PILLOW-DE-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-05 Decision Engine  
**Primary Deliverable:** Evaluates options, trade-offs, risks, confidence, and recommends the best course of action for Pillow.

## How Q0-05 works

1. Pillow submits an executive problem to the authoritative Decision Engine.
2. Multiple candidate options are generated and scored against extensible evaluation criteria.
3. A trade-off matrix and recommendation are produced as a machine-readable Decision Package.
4. Decision Engine never executes work, assigns workers, approves actions, overrides Pillow, or replaces Grand King approval.

## Evaluation criteria

`business_value`, `strategic_alignment`, `cost`, `complexity`, `risk`, `time`, `resource_requirement`, `probability_of_success` (additional criteria supported via configuration).

## Verification

`npx --yes tsx --test "src/validation/tests/decision-engine.test.ts"` — 10 passing, 0 failing.
