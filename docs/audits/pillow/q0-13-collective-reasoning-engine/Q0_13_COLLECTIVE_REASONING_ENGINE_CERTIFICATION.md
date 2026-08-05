# Q0-13 Collective Reasoning Engine

**Status:** FINAL PASS  
**Doctrine:** PILLOW-CORE-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-13 Collective Reasoning Engine  
**Primary Deliverable:** Coordinates multi-worker reasoning, debate, challenge, review and consensus.

> Doctrine ID uses **PILLOW-CORE-001** because `PILLOW-CRE-001` is already reserved by Customer/Capital Risk modules.

## How Q0-13 works

1. Pillow submits an executive question to the authoritative Collective Reasoning Engine.
2. Required expertise is identified and a temporary multi-worker reasoning panel is assembled.
3. Workers produce independent opinions; conflicts are detected; structured debate and peer challenges refine positions.
4. Consensus is attempted, minority opinions are preserved, and a final executive recommendation is produced.
5. Every session emits a machine-readable Reasoning Record (`CORE-001-v1`).
6. Collective Reasoning Engine never executes work, assigns workers permanently, replaces Pillow, overrides Grand King, or approves actions.

## Reasoning modes

`independent_analysis`, `structured_debate`, `peer_challenge`, `consensus_building`, `minority_report`

## Verification

`npx --yes tsx --test "src/validation/tests/collective-reasoning-engine.test.ts"` — 10 passing, 0 failing.
