/** PILLOW-POR-001 — Pillow Orchestration Runtime (Q10-02). */
export const PILLOW_ORCHESTRATION_RUNTIME_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PILLOW_ORCHESTRATION_RUNTIME_SYSTEM.md" as const;
export const PILLOW_ORCHESTRATION_RUNTIME_ID = "pillow-orchestration-runtime" as const;
export const POR_METADATA_VERSION = "POR-001-v1" as const;
export const POR_REPORT_VERSION = "POR-RPT-v1" as const;
export const POR_RUNTIME_VERSION = "Q10-POR-v1" as const;
export const POR_MISSION_ID = "Q10-02" as const;

export const PILLOW_ORCHESTRATION_RUNTIME_IDENTITY = {
  workerId: "wkr-pillow-orchestration-runtime-01",
  workerName: "Pillow Orchestration Runtime",
  workerType: "coordinator",
  department: "runtime",
  factory: "pillow-orchestration",
  role: "role-coordinator-pillow-orchestration-runtime",
  reportingLine: ["wkr-pillow-orchestration-runtime-01", "pillow"] as string[],
  skillProfile: [
    "skill-worker-invocation",
    "skill-tool-invocation",
    "skill-workflow-orchestration",
    "skill-approval-coordination",
    "skill-executive-report-retrieval",
    "skill-cross-factory-orchestration",
    "skill-permission-validation",
    "skill-orchestration-traceability",
  ],
  approvedTools: [
    "command_dispatcher",
    "worker_registry",
    "shared_runtime_core",
    "approval_runtime",
    "executive_reporting_runtime",
    "structured_reporting",
  ],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ORCHESTRATION_SERVICES = [
  "command_dispatcher",
  "worker_invocation_manager",
  "tool_invocation_manager",
  "workflow_orchestrator",
  "approval_coordinator",
  "report_coordinator",
  "execution_context_manager",
  "permission_validator",
  "runtime_session_manager",
  "orchestration_event_logger",
  "execution_state_manager",
  "failure_escalation_interface",
] as const;

export const INVOCATION_KINDS = [
  "worker",
  "tool",
  "workflow",
  "approval",
  "report",
] as const;

export const EXECUTION_STATUSES = [
  "pending",
  "succeeded",
  "structural_recorded",
  "unavailable",
  "blocked",
  "failed",
] as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "dispatching",
  "invoking",
  "orchestrating",
  "reporting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby", "unavailable"] as const;
export const AUDIT_STATUSES = ["not_audited", "pending", "passed", "partial", "failed"] as const;

export const INTEGRATION_TARGETS = [
  "shared_runtime_core",
  "worker_registry",
  "approval_router",
  "approval_workflow",
  "executive_reporting_runtime",
  "audit_runtime",
  "worker_recovery_system",
] as const;

export const POR_CAPABILITIES = [
  "invoke_workers",
  "invoke_tools",
  "orchestrate_workflows",
  "route_approvals",
  "retrieve_executive_reports",
  "cross_factory_orchestration",
  "permission_validation",
  "orchestration_session_management",
  "execution_context_propagation",
  "orchestration_event_logging",
  "execution_state_management",
  "failure_escalation_records",
  "produce_orchestration_reports",
  "preserve_complete_traceability",
  "preserve_orchestration_history",
  "preserve_audit_history",
  "submit_through_executive_reporting_runtime",
  "integrate_shared_runtime_core",
  "integrate_worker_registry",
  "integrate_approval_runtime",
  "integrate_executive_reporting_runtime",
  "integrate_audit_runtime",
  "integrate_worker_recovery_system",
  "q1003_consumable_contract",
  "health_monitoring",
] as const;
