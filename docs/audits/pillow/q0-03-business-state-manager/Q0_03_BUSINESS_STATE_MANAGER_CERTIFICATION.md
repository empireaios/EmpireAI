# Q0-03 Business State Manager

**Status:** FINAL PASS  
**Doctrine:** PILLOW-BSM-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-03 Business State Manager  
**Primary Deliverable:** Maintains live state of every active business, channel, workflow, and project.

## How Q0-03 works

1. Pillow registers businesses into the authoritative live registry.
2. Lifecycle, health, progress, blockers, and dependencies are updated through explicit state APIs.
3. Executive modules query business state from this single source — they must not keep independent copies.
4. The manager never executes missions, assigns workers, approves actions, launches businesses, or makes strategic decisions.

## Lifecycle states

`planned` → `building` → `testing` → `waiting_approval` → `operating` → (`paused` | `recovering`) → `archived`

## Health statuses

`healthy` | `warning` | `critical`

## Verification

`npx --yes tsx --test "src/validation/tests/business-state-manager.test.ts"` — 10 passing, 0 failing.
