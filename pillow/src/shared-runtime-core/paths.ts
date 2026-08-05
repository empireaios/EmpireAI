/** PILLOW-SRTC-001 — Shared Runtime Core (Q10-01). */
export const SHARED_RUNTIME_CORE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SHARED_RUNTIME_CORE_SYSTEM.md" as const;
export const SHARED_RUNTIME_CORE_ID = "shared-runtime-core" as const;
export const SRTC_METADATA_VERSION = "SRTC-001-v1" as const;
export const SHARED_RUNTIME_REPORT_VERSION = "SRTC-RPT-v1" as const;
export const SHARED_RUNTIME_VERSION = "Q10-SRTC-v1" as const;
export const SRTC_MISSION_ID = "Q10-01" as const;

export const SHARED_RUNTIME_CORE_IDENTITY = {
  workerId: "wkr-shared-runtime-core-01",
  workerName: "Shared Runtime Core",
  workerType: "coordinator",
  department: "runtime",
  factory: "shared-runtime",
  role: "role-coordinator-shared-runtime-core",
  reportingLine: ["wkr-shared-runtime-core-01", "pillow"] as string[],
  skillProfile: [
    "skill-factory-registration",
    "skill-worker-registration",
    "skill-runtime-service-discovery",
    "skill-execution-context-propagation",
    "skill-cross-factory-routing",
    "skill-runtime-health-monitoring",
    "skill-dependency-resolution",
    "skill-traceability",
  ],
  approvedTools: [
    "factory_registry",
    "worker_registry",
    "runtime_registry",
    "execution_context",
    "routing_engine",
    "structured_reporting",
  ],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const RUNTIME_SERVICES = [
  "factory_registry",
  "worker_registry",
  "runtime_registry",
  "execution_context",
  "shared_configuration",
  "service_discovery",
  "dependency_resolution",
  "runtime_metadata",
  "runtime_versioning",
  "runtime_health",
  "runtime_state",
  "runtime_diagnostics",
] as const;

export const FACTORY_KEYS = [
  "workforce-os",
  "workforce",
  "empire-builder-factory",
  "commerce-factory",
  "media-factory",
  "digital-products-factory",
  "enterprise-platform-factory",
  "local-business-factory",
  "affiliate-factory",
  "capital-factory",
] as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "registering",
  "routing",
  "resolving",
  "reporting",
  "diagnosing",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby", "unavailable"] as const;
export const ROUTING_STATUSES = ["pending", "routed", "blocked", "unavailable"] as const;
export const DEPENDENCY_STATUSES = ["available", "partial", "unavailable", "unknown"] as const;
export const AUDIT_STATUSES = ["not_audited", "pending", "passed", "partial", "failed"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "executive_reporting_runtime",
  "audit_runtime",
  "worker_recovery_system",
  "empire_builder_factory",
  "commerce_factory",
  "media_factory",
  "digital_products_factory",
  "enterprise_platform_factory",
  "local_business_factory",
  "affiliate_factory",
  "capital_factory",
  "workforce_os",
] as const;

export const SRTC_CAPABILITIES = [
  "register_factories",
  "register_workers",
  "unified_runtime_registry",
  "shared_execution_context",
  "cross_factory_routing_records",
  "runtime_lifecycle_coordination",
  "runtime_health_monitoring",
  "dependency_resolution",
  "service_discovery",
  "runtime_diagnostics",
  "produce_shared_runtime_reports",
  "preserve_complete_traceability",
  "preserve_runtime_history",
  "preserve_audit_history",
  "submit_through_executive_reporting_runtime",
  "integrate_worker_registry",
  "integrate_executive_reporting_runtime",
  "integrate_audit_runtime",
  "integrate_worker_recovery_system",
  "q1002_consumable_contract",
  "health_monitoring",
  "recovery_management",
] as const;
