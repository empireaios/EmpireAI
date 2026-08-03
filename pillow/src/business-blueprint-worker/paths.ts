/** PILLOW-BBW-001 — Business Blueprint Worker (Q2-06). */
export const BUSINESS_BLUEPRINT_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_BUSINESS_BLUEPRINT_WORKER_SYSTEM.md" as const;
export const BUSINESS_BLUEPRINT_WORKER_ID = "business-blueprint-worker" as const;
export const BBW_METADATA_VERSION = "BBW-001-v1" as const;
export const BUSINESS_BLUEPRINT_VERSION = "BBW-BPL-v1" as const;

export const BUSINESS_BLUEPRINT_WORKER_IDENTITY = {
  workerId: "wkr-business-blueprint-01",
  workerName: "Business Blueprint Worker",
  workerType: "architect",
  department: "strategy",
  factory: "empire-builder-factory",
  role: "role-architect-business-blueprint",
  reportingLine: ["wkr-business-blueprint-01", "pillow"] as string[],
  skillProfile: [
    "skill-business-architecture",
    "skill-operational-design",
    "skill-worker-planning",
    "skill-milestone-planning",
  ],
  approvedTools: ["blueprint_composer", "evidence_ledger", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "consolidating",
  "blueprinting",
  "reporting",
  "validating",
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

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const BBW_CAPABILITIES = [
  "receive_approved_business_model",
  "receive_market_research_report",
  "receive_opportunity_evaluation_report",
  "consolidate_approved_information",
  "define_complete_business_architecture",
  "define_products_and_services",
  "define_operational_workflow",
  "define_required_ai_workers",
  "define_required_external_integrations",
  "define_required_assets",
  "define_business_milestones",
  "produce_machine_readable_business_blueprint",
  "preserve_complete_traceability",
  "preserve_approved_business_decisions",
  "reference_previous_q2_outputs",
  "define_implementation_dependencies",
  "produce_single_canonical_business_blueprint",
  "submit_through_executive_reporting_runtime",
  "preserve_audit_history",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "business_blueprint_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
