# Q0-21 Peer Review Runtime

**Status:** FINAL PASS  
**Doctrine:** PILLOW-PRR-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-21 Peer Review Runtime  
**Primary Deliverable:** Requires automatic peer review for high-impact outputs before completion or escalation.

> Doctrine ID uses **PILLOW-PRR-001**. Peer Review Runtime validates quality and never performs the work being reviewed.

## How Q0-21 works

1. Completed high-impact work is submitted to the authoritative Peer Review Runtime.
2. The runtime determines whether peer review is required and selects independent reviewers.
3. Independent reviews are collected and compared for agreement and disagreement.
4. Revision is requested when necessary; unresolved disagreements escalate to Pillow.
5. Every review emits a machine-readable Peer Review Record (`PRR-001-v1`).
6. Peer Review Runtime never replaces workers, rewrites completed work, overrides Pillow, overrides Grand King, or executes business tasks.

## Review outcomes

`approved`, `approved_with_notes`, `revision_required`, `rejected`, `escalated`

## Verification

`npx --yes tsx --test "src/validation/tests/peer-review-runtime.test.ts"` — 10 passing, 0 failing.
