/** PILLOW-EPFC-001 — Enterprise Platform Factory Core (Q6-01). */
export const ENTERPRISE_PLATFORM_FACTORY_CORE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_ENTERPRISE_PLATFORM_FACTORY_CORE_SYSTEM.md" as const;
export const ENTERPRISE_PLATFORM_FACTORY_CORE_ID = "enterprise-platform-factory-core" as const;
export const EPFC_METADATA_VERSION = "EPFC-001-v1" as const;
export const ENTERPRISE_PLATFORM_FACTORY_REPORT_VERSION = "EPFC-RPT-v1" as const;
export const ENTERPRISE_PLATFORM_MISSION_VERSION = "EPFC-EPM-v1" as const;
export const ENTERPRISE_PLATFORM_FACTORY_VERSION = "Q6-EPFC-v1" as const;

export const ENTERPRISE_PLATFORM_FACTORY_CORE_IDENTITY = {
  workerId: "wkr-enterprise-platform-factory-core-01",
  workerName: "Enterprise Platform Factory Core",
  workerType: "coordinator",
  department: "enterprise_platforms",
  factory: "enterprise-platform-factory",
  role: "role-coordinator-enterprise-platform-factory-core",
  reportingLine: ["wkr-enterprise-platform-factory-core-01", "pillow"] as string[],
  skillProfile: [
    "skill-mission-creation",
    "skill-platform-registration",
    "skill-sdlc-coordination",
    "skill-approval-workflow",
    "skill-deployment-coordination",
    "skill-traceability",
  ],
  approvedTools: [
    "mission_composer",
    "platform_registry",
    "lifecycle_registry",
    "structured_reporting",
  ],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "coordinating",
  "validating",
  "creating",
  "registering",
  "reporting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const PLATFORM_TYPES = [
  "saas",
  "paas",
  "marketplace",
  "api_platform",
  "internal_tool",
  "multi_tenant",
  "enterprise_suite",
  "unknown",
] as const;

export const PIPELINE_TYPES = [
  "software_development",
  "architecture",
  "implementation",
  "testing",
  "deployment",
  "production_operations",
  "multi_stage",
] as const;

export const PIPELINE_STAGES = [
  "mission_created",
  "platform_registered",
  "software_development",
  "architecture",
  "implementation",
  "testing",
  "deployment",
  "production_operations",
  "completed",
] as const;

/** Alias for PIPELINE_STAGES — lifecycle stage taxonomy. */
export const LIFECYCLE_STAGES = PIPELINE_STAGES;

export const MISSION_STATUSES = [
  "drafted",
  "active",
  "coordinating",
  "awaiting_approval",
  "testing",
  "deploying",
  "operating",
  "completed",
  "rejected",
] as const;

export const APPROVAL_STATUSES = [
  "pending",
  "in_review",
  "approved",
  "rejected",
  "blocked_bypass_attempt",
] as const;

export const TESTING_STATUSES = [
  "pending",
  "in_progress",
  "passed",
  "failed",
  "blocked",
] as const;

export const DEPLOYMENT_STATUSES = [
  "pending",
  "ready",
  "deploying",
  "deployed",
  "failed",
  "rolled_back",
] as const;

export const PRODUCTION_STATUSES = [
  "not_started",
  "coordinating",
  "in_production",
  "awaiting_approval",
  "ready_for_operations",
  "completed",
  "blocked",
] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "mission_coordination_engine",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
  "health_monitoring",
  "recovery_management",
  "enterprise_platform_factory_core_validation",
] as const;

export const EPFC_CAPABILITIES = [
  "create_enterprise_platform_missions",
  "register_software_platform_projects",
  "coordinate_software_development_lifecycle",
  "coordinate_architecture_decisions",
  "coordinate_implementation_workers",
  "coordinate_testing_workflows",
  "coordinate_deployment_workflows",
  "coordinate_production_operations",
  "track_platform_lifecycle",
  "produce_machine_readable_enterprise_platform_factory_reports",
  "coordinate_downstream_enterprise_platform_workers",
  "coordinate_approval_workflows",
  "preserve_mission_traceability",
  "preserve_audit_history",
  "submit_through_executive_reporting_runtime",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_mission_coordination_engine",
  "integrate_executive_reporting_runtime",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "integrate_health_monitoring",
  "integrate_recovery_management",
  "enterprise_platform_factory_core_validation",
  "health_monitoring",
  "recovery_management",
] as const;
