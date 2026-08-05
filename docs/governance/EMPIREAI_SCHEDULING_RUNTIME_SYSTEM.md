# EmpireAI Scheduling Runtime

PILLOW-SCHRT-001 / Q10-12 provides the Scheduling Runtime inside Pillow.

The Scheduling Runtime is the enterprise schedule coordination service for EmpireAI. It registers schedule definitions, computes deterministic nextExecution values, evaluates due schedules from an explicit now clock, fires event-driven triggers, coordinates execution windows, detects conflicts, emits structural mission/queue signals, and produces Scheduling Runtime Reports consumable by Q10-13.

The Scheduling Runtime reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It is distinct from `queue-runtime/scheduler.ts` and does not replace Queue Runtime or Mission Runtime. It never fabricates execution times (next/previous only from deterministic computation or recorded evidence), never bypasses Pillow or Grand King governance, and never executes unauthorized business work.

## Schedule Types

one_time, daily, weekly, monthly, cron, event_driven, delayed, custom_extension.

## Trigger Types

time, event, manual, dependency, custom_extension.

## Schedule Statuses

draft, active, paused, triggered, completed, cancelled, missed, conflicted, awaiting_approval.

## Workflow

1. Connect and bootstrap scheduling services (registry, recurrence, one-time, event trigger, window coordinator, conflict detector, mission trigger, queue coordinator, metrics, report builder).
2. Register schedules with structural mission/worker/factory identity and audit references.
3. Compute nextExecution deterministically (same schedule + same now → same nextExecution). Cron support for SCHRT-001 is limited to `M H * * *` (minute hour UTC).
4. Evaluate due schedules with an explicit `now` ISO timestamp — never random wall-clock fabrication for tests.
5. On due fire: record ScheduleExecution, set previousExecution from the prior nextExecution, advance recurring nextExecution deterministically, complete one-time schedules.
6. Event-driven schedules fire only on matching eventKey; nextExecution remains null until triggered.
7. Detect conflicts when overlapping schedules share missionId and workerId in the same window.
8. Emit structural mission trigger refs and queue enqueue signals only — never replace those runtimes.
9. Produce Scheduling Runtime Reports (`SCHRT-RPT-v1` / `SCHRT-001-v1`) with `consumableByQ1013: true`.
10. Expose Q1013ConsumableContract for Q10-13 and preserve complete scheduling and audit history.

## Integrations

- Shared Runtime Core
- Pillow Orchestration Runtime
- Mission Runtime (structural createMission/monitor presence only)
- Queue Runtime (structural enqueue signal only — never replaces Queue Runtime)
- Memory Runtime
- API Runtime
- Tool Runtime
- Communication Runtime
- Approval Runtime
- Monitoring Runtime
- Recovery Runtime (Q1012 contract consumption)
- Executive Reporting Runtime
- Audit Runtime (presence / record only — this module does not implement Audit Runtime / Q10-13)

## Boundaries

The Scheduling Runtime:

- DOES register, update, pause, resume, and cancel schedules.
- DOES compute deterministic nextExecution for daily/weekly/monthly/cron/one_time.
- DOES evaluate due schedules and record executions with evidence.
- DOES fire event-driven schedules on matching eventKey.
- DOES detect scheduling conflicts and produce Scheduling Runtime Reports for Q10-13 consumption.
- DOES preserve scheduling history and never delete historical records.
- DOES NOT fabricate execution times or invent past completions.
- DOES NOT bypass Pillow governance or Grand King approval.
- DOES NOT replace Queue Runtime or Mission Runtime.
- DOES NOT execute unauthorized business work.
- DOES NOT implement Q10-13 Audit Runtime or later.
