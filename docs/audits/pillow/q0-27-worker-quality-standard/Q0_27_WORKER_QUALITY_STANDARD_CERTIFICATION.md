# Q0-27 Worker Quality Standard

**Status:** FINAL PASS  
**Doctrine:** PILLOW-WQS-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-27 Worker Quality Standard  
**Primary Deliverable:** Applies common standards to every worker: reasoning, self-critique, confidence scoring, evidence and tool discipline.

> Doctrine ID uses **PILLOW-WQS-001**. Worker Quality Standard validates workforce quality only and never executes worker tasks or replaces Peer Review Runtime.

## How Q0-27 works

1. Worker outputs are submitted to the authoritative Worker Quality Standard.
2. Structured reasoning, confidence, evidence, assumptions, and limitations are evaluated.
3. Governance compliance and mandatory standards are checked.
4. A quality decision is produced: compliant, partially compliant, or non-compliant.
5. Every evaluation emits a machine-readable Quality Record (`WQS-001-v1`).
6. Worker Quality Standard never executes worker tasks, replaces worker implementations, replaces Peer Review Runtime, overrides Pillow, or overrides Grand King.

## Mandatory quality standards

`structured_reasoning`, `self_validation`, `confidence_scoring`, `evidence_tracking`, `assumption_recording`, `limitation_reporting`, `traceability`, `governance_compliance`, `standard_reporting`

## Verification

`npx --yes tsx --test "src/validation/tests/worker-quality-standard.test.ts"` — 10 passing, 0 failing.
