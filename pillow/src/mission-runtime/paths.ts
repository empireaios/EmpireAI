/** PILLOW-MSR-001 — Mission Runtime (Q10-03). */
export const MISSION_RUNTIME_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MISSION_RUNTIME_SYSTEM.md" as const;
export const MISSION_RUNTIME_ID = "mission-runtime" as const;
export const MSR_METADATA_VERSION = "MSR-001-v1" as const;
export const MSR_REPORT_VERSION = "MSR-RPT-v1" as const;
export const MSR_RUNTIME_VERSION = "Q10-MSR-v1" as const;
export const MSR_MISSION_ID = "Q10-03" as const;

export const MISSION_RUNTIME_IDENTITY = {
  workerId: "wkr-mission-runtime-01",
  workerName: "Mission Runtime",
  workerType: "coordinator",
  department: "runtime",
  factory: "pillow-mission",
  role: "role-coordinator-mission-runtime",
  reportingLine: ["wkr-mission-runtime-01", "pillow"] as string[],
  skillProfile: [
    "skill-mission-lifecycle",
    "skill-mission-checkpointing",
    "skill-mission-recovery",
    "skill-mission-dependency-resolution",
    "skill-mission-metrics",
    "skill-mission-reporting",
    "skill-mission-traceability",
  ],
  approvedTools: [
    "shared_runtime_core",
    "pillow_orchestration_runtime",
    "worker_registry",
    "executive_reporting_runtime",
    "structured_reporting",
    "audit_runtime",
    "worker_recovery_system",
  ],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const MISSION_LIFECYCLE_STATES = [
  "Created",
  "Queued",
  "Ready",
  "Running",
  "Waiting",
  "Paused",
  "Resumed",
  "Retrying",
  "Completed",
  "Failed",
  "Cancelled",
  "Recovered",
  "Archived",
] as const;

export const MISSION_TYPES = [
  "enterprise",
  "factory",
  "worker_pipeline",
  "orchestration",
  "custom_extension",
] as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "creating",
  "executing",
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
  "worker_registry",
  "executive_reporting_runtime",
  "audit_runtime",
  "worker_recovery_system",
  "approval_router",
  "recovery",
] as const;

export const MSR_CAPABILITIES = [
  "create_missions",
  "queue_missions",
  "execute_missions",
  "pause_missions",
  "resume_missions",
  "retry_missions",
  "cancel_missions",
  "recover_missions",
  "archive_missions",
  "monitor_missions",
  "checkpoint_missions",
  "resolve_dependencies",
  "collect_metrics",
  "produce_mission_runtime_reports",
  "preserve_complete_traceability",
  "preserve_mission_history",
  "preserve_audit_history",
  "submit_through_executive_reporting_runtime",
  "integrate_shared_runtime_core",
  "integrate_pillow_orchestration_runtime",
  "integrate_worker_registry",
  "integrate_executive_reporting_runtime",
  "integrate_audit_runtime",
  "integrate_worker_recovery_system",
  "q1004_consumable_contract",
  "health_monitoring",
] as const;
