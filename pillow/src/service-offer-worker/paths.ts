/** PILLOW-SOW-001 — Service Offer Worker (Q7-03). */
export const SERVICE_OFFER_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SERVICE_OFFER_WORKER_SYSTEM.md" as const;
export const SERVICE_OFFER_WORKER_ID = "service-offer-worker" as const;
export const SOW_METADATA_VERSION = "SOW-001-v1" as const;
export const SERVICE_OFFER_REPORT_VERSION = "SOW-RPT-v1" as const;

export const SERVICE_OFFER_WORKER_IDENTITY = {
  workerId: "wkr-service-offer-01",
  workerName: "Service Offer Worker",
  workerType: "analyst",
  department: "local_business",
  factory: "local-business-factory",
  role: "role-analyst-service-offer",
  reportingLine: ["wkr-service-offer-01", "pillow"] as string[],
  skillProfile: [
    "skill-service-catalogue-definition",
    "skill-service-package-design",
    "skill-pricing-recommendation-from-research",
    "skill-guarantee-definition",
    "skill-fulfilment-requirements",
    "skill-service-offer-reporting",
  ],
  approvedTools: ["service_offer_ledger", "package_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "consuming_research",
  "defining_catalogue",
  "defining_packages",
  "recommending_pricing",
  "defining_guarantees",
  "defining_fulfilment",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Supported package types (extensible via config). */
export const PACKAGE_TYPES = [
  "basic",
  "premium",
  "enterprise",
  "optional_addon",
  "emergency",
  "recurring",
  "unknown",
] as const;

export const EVIDENCE_CLASSES = ["verified", "estimated", "inference", "unknown", "assumption"] as const;

export const INTEGRATION_TARGETS = [
  "local_business_factory_core",
  "local_market_research_worker",
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const SOW_CAPABILITIES = [
  "consume_market_research",
  "define_service_catalogue",
  "define_service_packages",
  "recommend_pricing_structure",
  "define_package_inclusions",
  "define_package_exclusions",
  "define_guarantees",
  "define_fulfilment_requirements",
  "define_required_resources",
  "produce_service_offer_reports",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_audit_history",
  "distinguish_evidence_from_assumptions",
  "never_build_booking_systems",
  "never_build_crm",
  "never_execute_customer_jobs",
  "never_launch_business",
  "never_fabricate_pricing_evidence",
  "never_override_approved_architecture",
  "integrate_local_business_factory_core",
  "integrate_local_market_research_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_executive_reporting_runtime",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "service_offer_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q704_consumable_contract",
] as const;
