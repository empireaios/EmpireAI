# Q0-10 Workforce Capability Registry

**Status:** FINAL PASS  
**Doctrine:** PILLOW-WCR-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-10 Workforce Capability Registry  
**Primary Deliverable:** Maintains a live registry of all workers, skills, tools, departments, limits and status.

## How Q0-10 works

1. Pillow consults the authoritative Workforce Capability Registry instead of hardcoding worker knowledge.
2. Workers, departments, capabilities, tools, skills, limits, dependencies, and status are registered and queryable.
3. Lookups by worker, capability, department, tool, skill, and status return machine-readable Registry Records.
4. Workforce Capability Registry never executes work, assigns workers, orchestrates workers, approves actions, or replaces Pillow.

## Lookup dimensions

`worker`, `capability`, `department`, `tool`, `skill`, `status`

## Verification

`npx --yes tsx --test "src/validation/tests/workforce-capability-registry.test.ts"` — 10 passing, 0 failing.
