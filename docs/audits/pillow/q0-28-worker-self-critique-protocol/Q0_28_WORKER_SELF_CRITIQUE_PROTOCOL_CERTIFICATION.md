# Q0-28 Worker Self-Critique Protocol

**Status:** FINAL PASS  
**Doctrine:** PILLOW-WSCP-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-28 Worker Self-Critique Protocol  
**Primary Deliverable:** Requires workers to critique their own output before submission.

> Doctrine ID uses **PILLOW-WSCP-001**. Worker Self-Critique Protocol evaluates completed output only and never replaces Peer Review Runtime, replaces Worker Quality Standard, executes worker tasks, overrides Pillow, or overrides Grand King.

## How Q0-28 works

1. A worker completes a task and produces an output.
2. The authoritative Worker Self-Critique Protocol evaluates that completed result.
3. Completeness, consistency, evidence, assumptions, weaknesses, and improvements are assessed.
4. Confidence is recalculated and a submission decision is produced.
5. Every evaluation emits a machine-readable Self-Critique Record (`WSCP-001-v1`).
6. Revision is required when the critique fails quality thresholds before Peer Review or Executive Review.

## Mandatory critique checks

`completeness`, `correctness`, `evidence`, `internal_consistency`, `assumptions`, `risks`, `missing_information`, `quality`, `executive_readiness`

## Submission decisions

`submit`, `revise_before_submit`, `escalate`, `reject_output`

## Verification

`npx --yes tsx --test "src/validation/tests/worker-self-critique-protocol.test.ts"` — 10 passing, 0 failing.
