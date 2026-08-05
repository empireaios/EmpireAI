/** PILLOW-QRT-001 — Queue Runtime (Q10-04). */
export const QUEUE_RUNTIME_SYSTEM_PATH =
  "docs/governance/EMPIREAI_QUEUE_RUNTIME_SYSTEM.md" as const;
export const QUEUE_RUNTIME_ID = "queue-runtime" as const;
export const QRT_METADATA_VERSION = "QRT-001-v1" as const;
export const QRT_REPORT_VERSION = "QRT-RPT-v1" as const;
export const QRT_RUNTIME_VERSION = "Q10-QRT-v1" as const;
export const QRT_MISSION_ID = "Q10-04" as const;

export const QUEUE_RUNTIME_IDENTITY = {
  workerId: "wkr-queue-runtime-01",
  workerName: "Queue Runtime",
  workerType: "coordinator",
  department: "runtime",
  factory: "pillow-queue",
  role: "role-coordinator-queue-runtime",
  reportingLine: ["wkr-queue-runtime-01", "pillow"] as string[],
  skillProfile: [
    "skill-queue-management",
    "skill-job-scheduling",
    "skill-priority-ordering",
    "skill-dependency-dispatch",
    "skill-retry-dead-letter",
    "skill-queue-metrics",
    "skill-queue-reporting",
    "skill-queue-traceability",
  ],
  approvedTools: [
    "shared_runtime_core",
    "pillow_orchestration_runtime",
    "mission_runtime",
    "worker_registry",
    "executive_reporting_runtime",
    "audit_runtime",
    "worker_recovery_system",
  ],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const QUEUE_TYPES = [
  "fifo",
  "priority",
  "scheduled",
  "delayed",
  "retry",
  "dead_letter",
  "custom_extension",
] as const;

export const JOB_STATUSES = [
  "queued",
  "waiting_dependency",
  "scheduled",
  "ready",
  "dispatched",
  "running",
  "completed",
  "failed",
  "retrying",
  "deferred",
  "cancelled",
  "dead_lettered",
] as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "creating",
  "dispatching",
  "monitoring",
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
  "worker_registry",
  "executive_reporting_runtime",
  "audit_runtime",
  "worker_recovery_system",
  "recovery",
] as const;

export const QRT_CAPABILITIES = [
  "create_queues",
  "enqueue_jobs",
  "prioritize_jobs",
  "pause_queues",
  "resume_queues",
  "cancel_jobs",
  "dispatch_ready_jobs",
  "retry_failed_jobs",
  "move_to_dead_letter",
  "resolve_dependencies",
  "schedule_jobs",
  "collect_metrics",
  "produce_queue_runtime_reports",
  "preserve_complete_traceability",
  "preserve_execution_history",
  "preserve_audit_history",
  "submit_through_executive_reporting_runtime",
  "integrate_shared_runtime_core",
  "integrate_pillow_orchestration_runtime",
  "integrate_mission_runtime",
  "integrate_worker_registry",
  "integrate_executive_reporting_runtime",
  "integrate_audit_runtime",
  "integrate_worker_recovery_system",
  "q1005_consumable_contract",
  "health_monitoring",
] as const;
