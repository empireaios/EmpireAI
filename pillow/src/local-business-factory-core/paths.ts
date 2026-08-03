/** PILLOW-LBFC-001 — Local Business Factory Core (Q7-01). */
export const LOCAL_BUSINESS_FACTORY_CORE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_LOCAL_BUSINESS_FACTORY_CORE_SYSTEM.md" as const;
export const LOCAL_BUSINESS_FACTORY_CORE_ID = "local-business-factory-core" as const;
export const LBFC_METADATA_VERSION = "LBFC-001-v1" as const;
export const LOCAL_BUSINESS_FACTORY_REPORT_VERSION = "LBFC-RPT-v1" as const;
export const LOCAL_BUSINESS_MISSION_VERSION = "LBFC-LBM-v1" as const;
export const LOCAL_BUSINESS_FACTORY_VERSION = "Q7-LBFC-v1" as const;

export const LOCAL_BUSINESS_FACTORY_CORE_IDENTITY = {
  workerId: "wkr-local-business-factory-core-01",
  workerName: "Local Business Factory Core",
  workerType: "coordinator",
  department: "local_businesses",
  factory: "local-business-factory",
  role: "role-coordinator-local-business-factory-core",
  reportingLine: ["wkr-local-business-factory-core-01", "pillow"] as string[],
  skillProfile: [
    "skill-mission-creation",
    "skill-local-business-registration",
    "skill-lifecycle-coordination",
    "skill-approval-workflow",
    "skill-launch-readiness",
    "skill-customer-acquisition-coordination",
    "skill-traceability",
  ],
  approvedTools: [
    "mission_composer",
    "local_business_registry",
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

export const BUSINESS_CATEGORIES = [
  "handyman",
  "cleaning",
  "plumbing",
  "electrical",
  "air_conditioning_servicing",
  "painting",
  "renovation",
  "pest_control",
  "tutoring",
  "beauty_services",
  "car_detailing",
  "pet_services",
  "home_services",
  "unknown",
] as const;

export const LIFECYCLE_STAGES = [
  "opportunity_discovered",
  "project_registered",
  "workers_assigned",
  "preparation",
  "launch_readiness",
  "launched",
  "customer_acquisition",
  "fulfilment",
  "ongoing_operations",
  "completed",
] as const;

export const MISSION_STATUSES = [
  "drafted",
  "active",
  "coordinating",
  "awaiting_approval",
  "preparing",
  "launch_ready",
  "launched",
  "acquiring_customers",
  "fulfilling",
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

export const LAUNCH_READINESS_STATUSES = [
  "not_started",
  "in_progress",
  "ready",
  "blocked",
  "launched",
] as const;

export const CUSTOMER_ACQUISITION_STATUSES = [
  "not_started",
  "coordinating",
  "active",
  "paused",
  "completed",
  "blocked",
] as const;

export const OPERATIONAL_STATUSES = [
  "not_started",
  "coordinating",
  "operating",
  "degraded",
  "blocked",
  "completed",
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
  "local_business_factory_core_validation",
] as const;

export const LBFC_CAPABILITIES = [
  "create_local_business_missions",
  "register_local_business_projects",
  "coordinate_local_business_lifecycle",
  "coordinate_workers",
  "assign_workers",
  "coordinate_approval_workflows",
  "coordinate_launch_readiness",
  "coordinate_customer_acquisition",
  "coordinate_fulfilment",
  "coordinate_ongoing_operations",
  "track_project_progress",
  "produce_machine_readable_local_business_factory_reports",
  "coordinate_downstream_local_business_workers",
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
  "local_business_factory_core_validation",
  "health_monitoring",
  "recovery_management",
] as const;
