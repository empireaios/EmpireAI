# EmpireAI Recovery Runtime

PILLOW-RECRT-001 / Q10-11 provides the Recovery Runtime inside Pillow.

The Recovery Runtime is the enterprise failure recovery coordination service for EmpireAI. It detects structural failures, classifies them deterministically, selects recovery strategies, restores checkpoint/state refs, restarts failed jobs, resumes interrupted workflows, rolls back partial execution where appropriate, escalates unrecoverable failures, and produces Recovery Runtime Reports consumable by Q10-12 Audit Runtime.

The Recovery Runtime reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It is distinct from worker-recovery-system, autonomous-recovery-engine, recovery, and recovery-doctrine. It never fabricates recovery success, never loses recoverable execution state (checkpoint/state refs are retained), never modifies validated business data, never replaces business logic, never exposes secrets (auditReference / structural refs only), and never bypasses Pillow or Grand King governance.

## Failure Classifications

transient, timeout, dependency, resource, state_corruption, unrecoverable, custom_extension.

## Recovery Strategies

restart_job, resume_workflow, restore_checkpoint, rollback_partial, escalate_only, manual_recovery, automatic_recovery, custom_extension.

## Recovery Statuses

detected, classified, restoring, restarting, rolling_back, resumed, completed, failed, escalated, awaiting_approval, cancelled.

## Workflow

1. Connect and bootstrap recovery services (failure detector, classifier, strategy selector, state restorer, job restarter, workflow resumer, rollback engine, escalation engine, metrics collector, report builder).
2. Detect failures from structural signals only (job/mission/worker/factory + checkpoint/state refs).
3. Classify failures deterministically from classification signals (same signals → same classification).
4. Select recovery strategy from classification; unrecoverable always maps to escalate_only.
5. Execute the appropriate structural engine (restore / restart / resume / rollback / escalate). Completed status is recorded only after a structural success step with stored evidence — never fabricated.
6. High-risk and Grand King paths require grandKingApproved; automatic_recovery requires automaticPermitted && pillowConfirmed && (!highRisk || grandKingApproved).
7. Produce Recovery Runtime Reports (`RECRT-RPT-v1` / `RECRT-001-v1`) with `consumableByQ1012: true`.
8. Expose Q1012ConsumableContract for Q10-12 and preserve complete recovery and audit history.

## Strategy Mapping

| Classification | Default Strategy |
| --- | --- |
| transient / timeout | restart_job |
| dependency / resource | resume_workflow |
| state_corruption (with checkpoint) | restore_checkpoint |
| state_corruption (no checkpoint) | rollback_partial |
| unrecoverable | escalate_only |
| custom_extension | custom_extension |

## Integrations

- Shared Runtime Core
- Pillow Orchestration Runtime
- Mission Runtime
- Queue Runtime
- Memory Runtime
- API Runtime
- Tool Runtime
- Communication Runtime
- Approval Runtime
- Monitoring Runtime (Q1011 contract consumption)
- Executive Reporting Runtime
- Audit Runtime (presence / record only — this module does not implement Audit Runtime)
- Worker Recovery System / Recovery (presence probes only — Recovery Runtime never calls repair methods on those systems)

## Boundaries

The Recovery Runtime:

- DOES detect, classify, and coordinate structural recovery of failed jobs and interrupted workflows.
- DOES restore checkpoint/state refs, restart jobs, resume workflows, roll back partial execution, and escalate unrecoverable cases.
- DOES produce Recovery Runtime Reports for downstream Q10-12 consumption.
- DOES preserve recovery history and never delete recoverable state refs.
- DOES NOT fabricate recovery success or mark completed without structural evidence.
- DOES NOT lose recoverable execution state.
- DOES NOT bypass Pillow governance or Grand King approval.
- DOES NOT modify validated business data or replace business logic.
- DOES NOT implement worker-recovery-system, autonomous-recovery-engine, recovery, or recovery-doctrine.
- DOES NOT implement Q10-12 Audit Runtime or later.
