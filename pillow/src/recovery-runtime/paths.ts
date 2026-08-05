/** PILLOW-RECRT-001 — Recovery Runtime (Q10-11). */
export const RECOVERY_RUNTIME_SYSTEM_PATH =
  "docs/governance/EMPIREAI_RECOVERY_RUNTIME_SYSTEM.md" as const;
export const RECOVERY_RUNTIME_ID = "recovery-runtime" as const;
export const RECRT_METADATA_VERSION = "RECRT-001-v1" as const;
export const RECRT_REPORT_VERSION = "RECRT-RPT-v1" as const;
export const RECRT_RUNTIME_VERSION = "Q10-RECRT-v1" as const;
export const RECRT_MISSION_ID = "Q10-11" as const;

export const RECOVERY_RUNTIME_IDENTITY = {
  workerId: "wkr-recovery-runtime-01",
  workerName: "Recovery Runtime",
  workerType: "coordinator",
  department: "runtime",
  factory: "pillow-recovery",
  role: "role-coordinator-recovery-runtime",
  reportingLine: ["wkr-recovery-runtime-01", "pillow"] as string[],
  skillProfile: [
    "skill-failure-detection",
    "skill-failure-classification",
    "skill-recovery-strategy-selection",
    "skill-state-restoration",
    "skill-job-restart",
    "skill-workflow-resume",
    "skill-rollback-execution",
    "skill-escalation",
    "skill-recovery-reporting",
    "skill-recovery-traceability",
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
    "executive_reporting_runtime",
    "audit_runtime",
    "worker_recovery_system",
    "recovery",
  ],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const FAILURE_CLASSIFICATIONS = [
  "transient",
  "timeout",
  "dependency",
  "resource",
  "state_corruption",
  "unrecoverable",
  "custom_extension",
] as const;

export const RECOVERY_STRATEGIES = [
  "restart_job",
  "resume_workflow",
  "restore_checkpoint",
  "rollback_partial",
  "escalate_only",
  "manual_recovery",
  "automatic_recovery",
  "custom_extension",
] as const;

export const RECOVERY_STATUSES = [
  "detected",
  "classified",
  "restoring",
  "restarting",
  "rolling_back",
  "resumed",
  "completed",
  "failed",
  "escalated",
  "awaiting_approval",
  "cancelled",
] as const;

export const ESCALATION_STATUSES = [
  "none",
  "pending",
  "escalated",
  "acknowledged",
  "resolved_structurally",
  "failed",
] as const;

export const ROLLBACK_STATUSES = [
  "none",
  "pending",
  "in_progress",
  "completed",
  "failed",
  "not_applicable",
] as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "detecting",
  "classifying",
  "restoring",
  "restarting",
  "rolling_back",
  "escalating",
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
  "executive_reporting_runtime",
  "audit_runtime",
  "worker_recovery_system",
  "recovery",
] as const;

export const RECRT_CAPABILITIES = [
  "detect_failures",
  "classify_failures",
  "select_recovery_strategies",
  "restore_execution_state",
  "restart_failed_jobs",
  "resume_interrupted_workflows",
  "rollback_partial_execution",
  "escalate_unrecoverable_failures",
  "produce_recovery_runtime_reports",
  "preserve_complete_traceability",
  "preserve_recovery_history",
  "preserve_audit_history",
  "never_fabricate_recovery_success",
  "never_lose_recoverable_execution_state",
  "never_bypass_pillow_governance",
  "never_bypass_grand_king_approval",
  "never_modify_validated_business_data",
  "never_replace_business_logic",
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
  "integrate_executive_reporting_runtime",
  "integrate_audit_runtime",
  "integrate_worker_recovery_system",
  "q1012_consumable_contract",
] as const;
