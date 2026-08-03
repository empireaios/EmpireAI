/** PILLOW-WRS-001 — Worker Recovery System (Q1-12). */
export const WORKER_RECOVERY_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WORKER_RECOVERY_SYSTEM.md" as const;
export const WORKER_RECOVERY_SYSTEM_ID = "worker-recovery-system" as const;
export const WRS_METADATA_VERSION = "WRS-001-v1" as const;
export const RECOVERY_VERSION = "WRS-REC-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "detecting",
  "recovering",
  "escalating",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Minimum recovery strategies (Q1-12).
 * Architecture allows additional strategies via configuration without redesign.
 */
export const RECOVERY_STRATEGIES = [
  "retry",
  "restart",
  "resume",
  "rollback",
  "reassign",
  "replace_worker",
  "pause_mission",
  "escalate_to_pillow",
] as const;

/**
 * Minimum failure types (Q1-12).
 * Architecture allows additional failure types via configuration without redesign.
 */
export const FAILURE_TYPES = [
  "crash",
  "hang",
  "timeout",
  "dependency_failure",
  "communication_failure",
  "runtime_failure",
  "resource_exhaustion",
  "validation_failure",
  "unknown_failure",
] as const;

export const RECOVERY_STATUSES = [
  "pending",
  "in_progress",
  "recovered",
  "partially_recovered",
  "failed",
  "escalated",
] as const;

export const ESCALATION_STATUSES = [
  "none",
  "pending",
  "escalated",
  "acknowledged",
] as const;

export const RECOVERY_DECISIONS = ["valid", "partially_valid", "invalid"] as const;

export const RECOVERY_RULES = [
  "preserve_mission_integrity",
  "preserve_audit_history",
  "preserve_execution_history",
  "prevent_duplicate_execution",
  "respect_authority_matrix",
  "respect_worker_lifecycle",
  "respect_mission_coordination_engine",
  "escalate_when_automatic_recovery_unsafe",
] as const;

export const WRS_CAPABILITIES = [
  "detect_worker_failures",
  "detect_stalled_workers",
  "detect_hung_workers",
  "detect_repeated_failures",
  "analyse_recovery_options",
  "restart_workers",
  "resume_interrupted_workers",
  "reassign_work",
  "rollback_incomplete_work",
  "preserve_execution_state",
  "escalate_unrecoverable_failures_to_pillow",
  "produce_machine_readable_recovery_records",
  "extensible_recovery_strategies",
  "extensible_failure_types",
  "mission_continuation_after_recovery",
  "worker_recovery_validation",
  "health_monitoring",
  "recovery_management",
] as const;
