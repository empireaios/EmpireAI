# Stage-2 retained-answer investigation

Base and rollback: PR #39, `79ba206471b4a755242747ebf12282713adfc694`.

## Retained evidence

Read-only production inspection identified request `pcr_994d39a1795d47b8`,
created 2026-10-03T09:54:34.028Z. Its exact user turn and exact assistant turn
remain in the durable Server transcript (09:54:34.557Z and .576Z respectively).
The user turn supplies a profitable hypothetical and asks for reasoning about
an independent finding, review, and the continuing execution boundary. The
assistant turn instead consists entirely of a generic conditional template.
The exact owner question is deliberately not copied into public test fixtures.

The corresponding durable request is `FAILED_FATAL`, error
`constitutional_gate_refused`, delivery `NOT_STARTED`, with no Brain result.
The provider ledger has **zero** `call_providers` rows for the SHA-256 request
key of this workspace/request. A visible Server transcript entry is therefore
not evidence that inference or durable delivery completed. This investigation
does not dispute that the owner could read that Server-record text.

## Deterministic cause

`PillowHost.chat` executes the constitutional gate before inference. On a gate
refusal it called `buildUsefulDegradedExecutiveAnswer`, appended the result to
the transcript, and recorded `useful: true`. That builder parsed a conditional
task, called `buildContractAwareReconstruct`, then
`synthesizeTaskUnitAnswer`. The generic `conditional_reasoning` branch inserts
the adverse-unit-economics sentence unconditionally, even when the supplied
scenario is profitable or is about an unrelated constraint. The retained answer
matches this template. There was no provider answer to transform or model
reasoning variance to diagnose for this request.

The gate consumes the current request plus recent conversation history; the
retained history includes earlier blocked requests. It normalizes those inputs
for broad compositional intent checks. The exact original finding was not
retained in the durable failure record, so this report does not claim a proven
specific regex match or authorize changing gate semantics. No owner question
was replayed to reconstruct a finding.

## Bounded correction

Both pre-inference failure branches now use an explicit refusal result. They
cannot call task reconstruction or introduce scenario conclusions. The
transcript states that reasoning was not performed and analysis remains
incomplete; the response has `semanticSuccess: false`, `brainCompleted: false`,
and a nonretryable typed failure. Telemetry no longer calls the result useful.
Durable transport still refuses completion and does not retry the gate failure.

This corrects the demonstrated false-answer substitution. **It does not claim
to make the retained question pass, supply its missing reasoning, or remove the
existing pre-inference refusal.** Doing so would require changing authority
interpretation, which is outside this bounded correction. PR #39's visible
answer validation, Defect B provenance, concurrent Work A, authority rules,
NOT_BORN and commerce LOCKED remain unchanged.

## Verification

No production mutation, inference call, owner-test replay, new acceptance
question, or use of unseen tests. Read-only readiness reports NOT_BORN,
commerce LOCKED, operational false. Original request/transcript/accounting
records were not changed.

Local deterministic verification: worker completion suite 15/15; response
completion 5/5; Assurance challenge semantics 6/6 (including the existing 210
bypass adjacency regressions and PR #39's generated passive cases); executive
gate 13/13. Backend typecheck and build pass. The new regression checks both
pre-inference failure kinds and prevents promotion even if a consumer omits
the constitutional gate field. It contains no owner question.

Hosted CI is required on the published candidate before any deployment request.
No deployment is authorized by this report.
