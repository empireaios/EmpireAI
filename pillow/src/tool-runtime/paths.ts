/** PILLOW-TOOLRT-001 — Tool Runtime (Q10-07). */
export const TOOL_RUNTIME_SYSTEM_PATH =
  "docs/governance/EMPIREAI_TOOL_RUNTIME_SYSTEM.md" as const;
export const TOOL_RUNTIME_ID = "tool-runtime" as const;
export const TOOLRT_METADATA_VERSION = "TOOLRT-001-v1" as const;
export const TOOLRT_REPORT_VERSION = "TOOLRT-RPT-v1" as const;
export const TOOLRT_RUNTIME_VERSION = "Q10-TOOLRT-v1" as const;
export const TOOLRT_MISSION_ID = "Q10-07" as const;

export const TOOL_RUNTIME_IDENTITY = {
  workerId: "wkr-tool-runtime-01",
  workerName: "Tool Runtime",
  workerType: "coordinator",
  department: "runtime",
  factory: "pillow-tool",
  role: "role-coordinator-tool-runtime",
  reportingLine: ["wkr-tool-runtime-01", "pillow"] as string[],
  skillProfile: [
    "skill-tool-registration",
    "skill-tool-discovery",
    "skill-credential-reference",
    "skill-tool-invocation",
    "skill-permission-gating",
    "skill-tool-availability",
    "skill-tool-reporting",
    "skill-tool-traceability",
  ],
  approvedTools: [
    "shared_runtime_core",
    "pillow_orchestration_runtime",
    "mission_runtime",
    "queue_runtime",
    "memory_runtime",
    "api_runtime",
    "approval_runtime",
    "executive_reporting_runtime",
    "audit_runtime",
    "worker_recovery_system",
  ],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const TOOL_CATEGORIES = [
  "cursor",
  "github",
  "design",
  "analytics",
  "ai_provider",
  "marketplace",
  "supplier",
  "cloud_platform",
  "deployment",
  "database",
  "monitoring",
  "internal_enterprise",
  "custom_extension",
] as const;

export const AUTH_METHODS = [
  "api_key",
  "oauth",
  "bearer_token",
  "basic",
  "none",
  "custom_extension",
] as const;

export const CONNECTION_STATUSES = [
  "disconnected",
  "connecting",
  "connected",
  "degraded",
  "failed",
  "closed",
] as const;

export const AVAILABILITY_STATUSES = [
  "available",
  "degraded",
  "unavailable",
  "unknown",
  "standby",
] as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "discovering",
  "authenticating",
  "invoking",
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
  "queue_runtime",
  "memory_runtime",
  "api_runtime",
  "approval_runtime",
  "executive_reporting_runtime",
  "audit_runtime",
  "worker_recovery_system",
  "recovery",
] as const;

export const TOOLRT_CAPABILITIES = [
  "register_tools",
  "discover_tools",
  "authenticate_via_credential_reference",
  "invoke_approved_tools",
  "enforce_permission_policy",
  "apply_retry_policy",
  "monitor_tool_availability",
  "collect_tool_metrics",
  "track_tool_usage",
  "produce_tool_runtime_reports",
  "preserve_complete_traceability",
  "preserve_invocation_traces",
  "preserve_audit_history",
  "submit_through_executive_reporting_runtime",
  "integrate_shared_runtime_core",
  "integrate_pillow_orchestration_runtime",
  "integrate_mission_runtime",
  "integrate_queue_runtime",
  "integrate_memory_runtime",
  "integrate_api_runtime",
  "integrate_approval_runtime",
  "integrate_executive_reporting_runtime",
  "integrate_audit_runtime",
  "integrate_worker_recovery_system",
  "q1008_consumable_contract",
  "availability_monitoring",
] as const;

export const AUTH_METHODS_REQUIRING_CREDENTIAL = [
  "api_key",
  "oauth",
  "bearer_token",
  "basic",
  "custom_extension",
] as const;
