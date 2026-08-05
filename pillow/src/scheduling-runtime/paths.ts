/** PILLOW-SCHRT-001 — Scheduling Runtime (Q10-12). */
export const SCHEDULING_RUNTIME_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SCHEDULING_RUNTIME_SYSTEM.md" as const;
export const SCHEDULING_RUNTIME_ID = "scheduling-runtime" as const;
export const SCHRT_METADATA_VERSION = "SCHRT-001-v1" as const;
export const SCHRT_REPORT_VERSION = "SCHRT-RPT-v1" as const;
export const SCHRT_RUNTIME_VERSION = "Q10-SCHRT-v1" as const;
export const SCHRT_MISSION_ID = "Q10-12" as const;

/** Fixed seed clock for deterministic nextExecution on ensureSeeded. */
export const SCHRT_SEED_CLOCK_UTC = "2026-08-01T00:00:00.000Z" as const;

export const SCHEDULING_RUNTIME_IDENTITY = {
  workerId: "wkr-scheduling-runtime-01",
  workerName: "Scheduling Runtime",
  workerType: "coordinator",
  department: "runtime",
  factory: "pillow-scheduling",
  role: "role-coordinator-scheduling-runtime",
  reportingLine: ["wkr-scheduling-runtime-01", "pillow"] as string[],
  skillProfile: [
    "skill-schedule-registry",
    "skill-recurrence-computation",
    "skill-one-time-scheduling",
    "skill-event-triggering",
    "skill-window-coordination",
    "skill-conflict-detection",
    "skill-mission-trigger-structural",
    "skill-queue-coordination-structural",
    "skill-scheduling-reporting",
    "skill-scheduling-traceability",
    "skill-governance-enforcement",
  ],
  approvedTools: [
    "shared_runtime_core",
    "pillow_orchestration_runtime",
    "mission_runtime",
    "queue_runtime",
    "memory_runtime",
    "api_runtime",
    "tool_runtime",
    "communication_runtime",
    "approval_runtime",
    "monitoring_runtime",
    "recovery_runtime",
    "executive_reporting_runtime",
    "audit_runtime",
  ],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const SCHEDULE_TYPES = [
  "one_time",
  "daily",
  "weekly",
  "monthly",
  "cron",
  "event_driven",
  "delayed",
  "custom_extension",
] as const;

export const TRIGGER_TYPES = [
  "time",
  "event",
  "manual",
  "dependency",
  "custom_extension",
] as const;

export const SCHEDULE_STATUSES = [
  "draft",
  "active",
  "paused",
  "triggered",
  "completed",
  "cancelled",
  "missed",
  "conflicted",
  "awaiting_approval",
] as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "evaluating",
  "triggering",
  "detecting_conflicts",
  "reporting",
  "failed",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby", "unavailable"] as const;
export const AUDIT_STATUSES = ["not_audited", "pending", "passed", "partial", "failed"] as const;

export const INTEGRATION_TARGETS = [
  "shared_runtime_core",
  "pillow_orchestration_runtime",
  "mission_runtime",
  "queue_runtime",
  "memory_runtime",
  "api_runtime",
  "tool_runtime",
  "communication_runtime",
  "approval_runtime",
  "monitoring_runtime",
  "recovery_runtime",
  "executive_reporting_runtime",
  "audit_runtime",
] as const;

export const SCHRT_CAPABILITIES = [
  "register_schedules",
  "update_schedules",
  "cancel_schedules",
  "pause_resume_schedules",
  "compute_deterministic_next_execution",
  "evaluate_due_schedules",
  "trigger_event_driven_schedules",
  "coordinate_execution_windows",
  "detect_scheduling_conflicts",
  "structural_mission_trigger",
  "structural_queue_enqueue_signal",
  "produce_scheduling_runtime_reports",
  "preserve_complete_traceability",
  "preserve_scheduling_history",
  "preserve_audit_history",
  "never_fabricate_execution_times",
  "never_bypass_pillow_governance",
  "never_bypass_grand_king_approval",
  "never_replace_queue_runtime",
  "never_replace_mission_runtime",
  "never_execute_unauthorized_work",
  "submit_through_executive_reporting_runtime",
  "integrate_shared_runtime_core",
  "integrate_pillow_orchestration_runtime",
  "integrate_mission_runtime",
  "integrate_queue_runtime",
  "integrate_memory_runtime",
  "integrate_api_runtime",
  "integrate_tool_runtime",
  "integrate_communication_runtime",
  "integrate_approval_runtime",
  "integrate_monitoring_runtime",
  "integrate_recovery_runtime",
  "integrate_executive_reporting_runtime",
  "integrate_audit_runtime",
  "q1013_consumable_contract",
] as const;
