/** PILLOW-APVRT-001 — Approval Runtime (Q10-09). */
export const APPROVAL_RUNTIME_SYSTEM_PATH =
  "docs/governance/EMPIREAI_APPROVAL_RUNTIME_SYSTEM.md" as const;
export const APPROVAL_RUNTIME_ID = "approval-runtime" as const;
export const APVRT_METADATA_VERSION = "APVRT-001-v1" as const;
export const APVRT_REPORT_VERSION = "APVRT-RPT-v1" as const;
export const APVRT_RUNTIME_VERSION = "Q10-APVRT-v1" as const;
export const APVRT_MISSION_ID = "Q10-09" as const;

export const APPROVAL_RUNTIME_IDENTITY = {
  workerId: "wkr-approval-runtime-01",
  workerName: "Approval Runtime",
  workerType: "coordinator",
  department: "runtime",
  factory: "pillow-approval",
  role: "role-coordinator-approval-runtime",
  reportingLine: ["wkr-approval-runtime-01", "pillow"] as string[],
  skillProfile: [
    "skill-approval-routing",
    "skill-policy-registry",
    "skill-multi-stage-approval",
    "skill-delegation",
    "skill-escalation",
    "skill-resume-after-approval",
    "skill-approval-reporting",
    "skill-approval-traceability",
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
    "executive_reporting_runtime",
    "audit_runtime",
    "worker_registry",
    "factory_registry",
    "worker_recovery_system",
  ],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const APPROVAL_TYPES = [
  "pillow",
  "grand_king",
  "multi_stage",
  "conditional",
  "delegated",
  "escalated",
  "custom_extension",
] as const;

export const APPROVAL_STATUSES = [
  "pending",
  "routed",
  "awaiting_pillow",
  "awaiting_grand_king",
  "approved",
  "rejected",
  "escalated",
  "delegated",
  "timed_out",
  "resumed",
  "cancelled",
] as const;

export const POLICY_SCOPES = [
  "mission",
  "factory",
  "worker",
  "runtime",
  "global",
  "high_risk",
] as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "routing",
  "awaiting_decision",
  "deciding",
  "escalating",
  "delegating",
  "resuming",
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
  "executive_reporting_runtime",
  "audit_runtime",
  "worker_registry",
  "factory_registry",
  "worker_recovery_system",
  "recovery",
] as const;

export const APVRT_CAPABILITIES = [
  "register_approval_policies",
  "determine_approval_requirements",
  "submit_approval_requests",
  "route_approvals_deterministically",
  "enforce_pillow_approvals",
  "enforce_grand_king_approvals",
  "multi_stage_approvals",
  "delegate_approvals",
  "escalate_approvals",
  "handle_approval_timeouts",
  "record_decisions_append_only",
  "resume_after_full_approval",
  "produce_approval_runtime_reports",
  "preserve_complete_traceability",
  "preserve_approval_history",
  "preserve_audit_history",
  "prevent_unauthorized_execution",
  "submit_through_executive_reporting_runtime",
  "integrate_shared_runtime_core",
  "integrate_pillow_orchestration_runtime",
  "integrate_mission_runtime",
  "integrate_queue_runtime",
  "integrate_memory_runtime",
  "integrate_api_runtime",
  "integrate_tool_runtime",
  "integrate_communication_runtime",
  "integrate_executive_reporting_runtime",
  "integrate_audit_runtime",
  "integrate_worker_registry",
  "integrate_factory_registry",
  "integrate_worker_recovery_system",
  "q1010_consumable_contract",
] as const;
