/** PILLOW-DPF-001 — Digital Products Factory Core (Q5-01). */
export const DIGITAL_PRODUCTS_FACTORY_CORE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_DIGITAL_PRODUCTS_FACTORY_CORE_SYSTEM.md" as const;
export const DIGITAL_PRODUCTS_FACTORY_CORE_ID = "digital-products-factory-core" as const;
export const DPF_METADATA_VERSION = "DPF-001-v1" as const;
export const DIGITAL_PRODUCTS_FACTORY_REPORT_VERSION = "DPF-DFR-v1" as const;
export const DIGITAL_PRODUCT_BUSINESS_MISSION_VERSION = "DPF-DPM-v1" as const;

export const DIGITAL_PRODUCTS_FACTORY_CORE_IDENTITY = {
  workerId: "wkr-digital-products-factory-core-01",
  workerName: "Digital Products Factory Core",
  workerType: "coordinator",
  department: "digital_products",
  factory: "digital-products-factory",
  role: "role-coordinator-digital-products-factory-core",
  reportingLine: ["wkr-digital-products-factory-core-01", "pillow"] as string[],
  skillProfile: [
    "skill-mission-creation",
    "skill-business-registration",
    "skill-pipeline-coordination",
    "skill-approval-workflow",
    "skill-fulfilment-coordination",
    "skill-traceability",
  ],
  approvedTools: [
    "mission_composer",
    "business_registry",
    "pipeline_registry",
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

export const PRODUCT_TYPES = [
  "template",
  "toolkit",
  "printable",
  "software_tool",
  "membership",
  "bundle",
  "digital_download",
  "unknown",
] as const;

export const PIPELINE_TYPES = [
  "product_creation",
  "design_branding",
  "sales_page",
  "checkout",
  "fulfilment",
  "customer_delivery",
  "analytics",
  "learning",
  "multi_stage",
] as const;

export const PIPELINE_STAGES = [
  "mission_created",
  "business_registered",
  "product_creation",
  "design_branding",
  "sales_page",
  "checkout",
  "fulfilment",
  "customer_delivery",
  "analytics",
  "learning",
  "completed",
] as const;

/** Alias for PIPELINE_STAGES — lifecycle stage taxonomy. */
export const CONTENT_STAGES = PIPELINE_STAGES;

export const MISSION_STATUSES = [
  "drafted",
  "active",
  "coordinating",
  "awaiting_approval",
  "fulfilling",
  "learning",
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

export const FULFILMENT_STATUSES = [
  "not_ready",
  "queued",
  "coordinating",
  "fulfilled_signal",
  "blocked_pending_approval",
  "failed",
] as const;

export const ANALYTICS_STATUSES = [
  "idle",
  "collecting",
  "analyzing",
  "reported",
  "deferred",
] as const;

export const LEARNING_STATUSES = [
  "idle",
  "collecting",
  "analyzing",
  "applied",
  "deferred",
] as const;

export const PRODUCTION_STATUSES = [
  "not_started",
  "coordinating",
  "in_production",
  "awaiting_approval",
  "ready_for_fulfilment",
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
  "digital_products_factory_core_validation",
] as const;

export const DPF_CAPABILITIES = [
  "create_digital_product_business_missions",
  "register_digital_product_businesses",
  "coordinate_product_creation_pipelines",
  "coordinate_design_and_branding_workflows",
  "coordinate_sales_page_workflows",
  "coordinate_checkout_workflows",
  "coordinate_fulfilment_workflows",
  "coordinate_customer_delivery",
  "coordinate_analytics",
  "coordinate_continuous_learning",
  "track_business_lifecycle",
  "produce_machine_readable_digital_products_factory_reports",
  "coordinate_downstream_digital_products_workers",
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
  "digital_products_factory_core_validation",
  "health_monitoring",
  "recovery_management",
] as const;
