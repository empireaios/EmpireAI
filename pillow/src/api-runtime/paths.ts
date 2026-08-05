/** PILLOW-APIRT-001 — API Runtime (Q10-06). */
export const API_RUNTIME_SYSTEM_PATH =
  "docs/governance/EMPIREAI_API_RUNTIME_SYSTEM.md" as const;
export const API_RUNTIME_ID = "api-runtime" as const;
export const APIRT_METADATA_VERSION = "APIRT-001-v1" as const;
export const APIRT_REPORT_VERSION = "APIRT-RPT-v1" as const;
export const APIRT_RUNTIME_VERSION = "Q10-APIRT-v1" as const;
export const APIRT_MISSION_ID = "Q10-06" as const;

export const API_RUNTIME_IDENTITY = {
  workerId: "wkr-api-runtime-01",
  workerName: "API Runtime",
  workerType: "coordinator",
  department: "runtime",
  factory: "pillow-api",
  role: "role-coordinator-api-runtime",
  reportingLine: ["wkr-api-runtime-01", "pillow"] as string[],
  skillProfile: [
    "skill-api-registration",
    "skill-api-routing",
    "skill-credential-reference",
    "skill-rate-limiting",
    "skill-circuit-breaking",
    "skill-api-health",
    "skill-api-reporting",
    "skill-api-traceability",
  ],
  approvedTools: [
    "shared_runtime_core",
    "pillow_orchestration_runtime",
    "mission_runtime",
    "queue_runtime",
    "memory_runtime",
    "approval_runtime",
    "monitoring_runtime",
    "audit_runtime",
    "executive_reporting_runtime",
    "worker_recovery_system",
  ],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const SERVICE_TYPES = [
  "supplier",
  "marketplace",
  "ai_model",
  "payment",
  "communication",
  "internal_service",
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

export const HEALTH_STATUSES = [
  "healthy",
  "degraded",
  "unhealthy",
  "unknown",
  "standby",
] as const;

export const RATE_LIMIT_STATUSES = [
  "ok",
  "approaching",
  "exceeded",
  "unknown",
] as const;

export const CIRCUIT_STATES = ["closed", "open", "half_open"] as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "routing",
  "authenticating",
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
  "approval_runtime",
  "monitoring_runtime",
  "audit_runtime",
  "executive_reporting_runtime",
  "worker_recovery_system",
  "recovery",
] as const;

export const APIRT_CAPABILITIES = [
  "register_api_providers",
  "manage_api_connections",
  "authenticate_via_credential_reference",
  "route_api_requests",
  "enforce_rate_limits",
  "apply_retry_policy",
  "circuit_break_failing_apis",
  "monitor_provider_health",
  "collect_api_metrics",
  "produce_api_runtime_reports",
  "preserve_complete_traceability",
  "preserve_request_traces",
  "preserve_audit_history",
  "submit_through_executive_reporting_runtime",
  "integrate_shared_runtime_core",
  "integrate_pillow_orchestration_runtime",
  "integrate_mission_runtime",
  "integrate_queue_runtime",
  "integrate_memory_runtime",
  "integrate_approval_runtime",
  "integrate_monitoring_runtime",
  "integrate_audit_runtime",
  "integrate_executive_reporting_runtime",
  "integrate_worker_recovery_system",
  "q1007_consumable_contract",
  "health_monitoring",
] as const;

export const AUTH_METHODS_REQUIRING_CREDENTIAL = [
  "api_key",
  "oauth",
  "bearer_token",
  "basic",
  "custom_extension",
] as const;
