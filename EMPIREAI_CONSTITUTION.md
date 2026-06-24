# EMPIREAI CONSTITUTION

> Living memory document — permanent engineering law

## Article I — Brain Sovereignty

1. The Brain is the **only** orchestration point.
2. No frontend, script, or agent may bypass the Orchestrator.
3. All module actions route through `POST /brain/dispatch`.

## Article II — Guardian Protection

1. Every dispatch passes Guardian assessment when enabled.
2. Database integrity (`PRAGMA integrity_check`) is mandatory before writes.
3. High-risk actions require explicit confirmation.
4. L3/L4 authority requires founder approval in payload.

## Article III — Financial Integrity

1. Financial state is reconstructed from the **append-only ledger**.
2. Balances are never overwritten — only new events appended.
3. Every financial event must have: type, amount, direction, correlation ID, source.
4. Treasury buckets are **derived**, not stored as authoritative balances.

## Article IV — Modularity

1. No feature may tightly couple to a single provider.
2. Connectors implement a common interface.
3. Subsystems must be replaceable without breaking unrelated modules.
4. Prefer interfaces over shortcuts.

## Article V — Failure Doctrine

1. Design assuming failure.
2. Fail safely — never corrupt unrelated modules.
3. Log audit trails for important operations.
4. Provide recovery plans for blocked Guardian actions.

## Article VI — Founder Protection

1. Never delete founder businesses because of cancellation.
2. Cancellation transitions to **preserved** state.
3. Pause/resume must be supported without data loss.

## Article VII — Verification

1. Never claim success without verification.
2. Run validation gate before milestones.
3. Mark subsystems **unverified** when checks cannot run.

## Article VIII — Memory

1. Architecture decisions are recorded in `EMPIREAI_DECISIONS.md`.
2. Status is maintained in `EMPIREAI_STATUS.md`.
3. Reports are regenerated via `npm run architect:report`.

## Article IX — Quality

1. Never reduce code quality for development speed.
2. No temporary hacks in production paths.
3. No duplicated logic across modules.

_Last updated: Phase 3 architecture foundation_
