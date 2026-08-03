/** PILLOW-CMF-001 — Commerce Factory Core (Q3-01). */
export const COMMERCE_FACTORY_CORE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_COMMERCE_FACTORY_CORE_SYSTEM.md" as const;
export const COMMERCE_FACTORY_CORE_ID = "commerce-factory-core" as const;
export const CMF_METADATA_VERSION = "CMF-001-v1" as const;
export const COMMERCE_BUILD_MISSION_VERSION = "CMF-CBM-v1" as const;

export const COMMERCE_FACTORY_CORE_IDENTITY = {
  workerId: "wkr-commerce-factory-core-01",
  workerName: "Commerce Factory Core",
  workerType: "coordinator",
  department: "commerce",
  factory: "commerce-factory",
  role: "role-coordinator-commerce-factory-core",
  reportingLine: ["wkr-commerce-factory-core-01", "pillow"] as string[],
  skillProfile: [
    "skill-mission-creation",
    "skill-readiness-validation",
    "skill-commerce-classification",
    "skill-traceability",
  ],
  approvedTools: ["mission_composer", "readiness_checker", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "validating",
  "creating",
  "classifying",
  "registering",
  "reporting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const BUSINESS_TYPES = [
  "media",
  "commerce",
  "local_cleaning",
  "affiliate",
  "digital_product",
  "local_services",
  "saas",
  "agency",
  "unknown",
] as const;

/** Commerce category taxonomy — extensible via configuration. */
export const COMMERCE_CATEGORIES = [
  "online_store",
  "marketplace",
  "dropshipping",
  "subscription_commerce",
  "wholesale",
  "hybrid_commerce",
  "unknown",
] as const;

export const MISSION_STATUSES = [
  "drafted",
  "validated",
  "classified",
  "registered",
  "ready_for_q3_workers",
  "rejected",
] as const;

export const APPROVAL_STATUSES = [
  "pending_grand_king",
  "approved",
  "rejected",
  "not_approved",
] as const;

export const REQUIRED_NEXT_STEPS = [
  "verify_grand_king_approval",
  "verify_blueprint_completeness",
  "verify_implementation_prerequisites",
  "register_with_mission_coordination",
  "hand_off_to_q3_02",
  "none",
] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "mission_coordination_engine",
  "executive_reporting_runtime",
  "business_blueprint_worker",
  "business_approval_pack_worker",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const CMF_CAPABILITIES = [
  "receive_approved_business_blueprint",
  "receive_approved_business_approval_pack",
  "verify_grand_king_approval_status",
  "verify_blueprint_completeness",
  "verify_implementation_prerequisites",
  "create_commerce_build_mission",
  "classify_commerce_business_type",
  "register_mission_with_mission_coordination",
  "preserve_end_to_end_traceability",
  "produce_machine_readable_commerce_build_mission",
  "reject_incomplete_blueprints",
  "reject_unapproved_approval_packs",
  "preserve_audit_history",
  "submit_through_executive_reporting_runtime",
  "integrate_worker_registry",
  "integrate_mission_coordination_engine",
  "integrate_business_blueprint_worker",
  "integrate_business_approval_pack_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "commerce_factory_core_validation",
  "health_monitoring",
  "recovery_management",
] as const;
