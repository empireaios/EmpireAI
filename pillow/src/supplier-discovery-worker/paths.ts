/** PILLOW-SDW-001 — Supplier Discovery Worker (Q3-04). */
export const SUPPLIER_DISCOVERY_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SUPPLIER_DISCOVERY_WORKER_SYSTEM.md" as const;
export const SUPPLIER_DISCOVERY_WORKER_ID = "supplier-discovery-worker" as const;
export const SDW_METADATA_VERSION = "SDW-001-v1" as const;
export const SUPPLIER_DISCOVERY_REPORT_VERSION = "SDW-RPT-v1" as const;

export const SUPPLIER_DISCOVERY_WORKER_IDENTITY = {
  workerId: "wkr-supplier-discovery-01",
  workerName: "Supplier Discovery Worker",
  workerType: "analyst",
  department: "commerce",
  factory: "commerce-factory",
  role: "role-analyst-supplier-discovery",
  reportingLine: ["wkr-supplier-discovery-01", "pillow"] as string[],
  skillProfile: [
    "skill-supplier-platform-search",
    "skill-supplier-api-search",
    "skill-pricing-capture",
    "skill-moq-capture",
    "skill-shipping-availability",
  ],
  approvedTools: ["supplier_ledger", "source_traceability", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "searching",
  "discovering",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const APPROVED_SUPPLIER_PLATFORMS = [
  "alibaba",
  "aliexpress",
  "cjdropshipping",
  "spocket",
  "local_wholesale",
] as const;

export const APPROVED_SUPPLIER_APIS = [
  "alibaba_open_api",
  "cj_dropshipping_api",
  "spocket_api",
  "internal_supplier_catalog_api",
] as const;

export const DISCOVERY_CHANNELS = ["supplier_platform", "supplier_api", "aggregated"] as const;

export const INFORMATION_STATUSES = ["available", "unavailable", "missing"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "product_evaluation_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const SDW_CAPABILITIES = [
  "receive_approved_products",
  "search_approved_supplier_platforms",
  "search_integrated_supplier_apis",
  "discover_multiple_supplier_candidates",
  "capture_supplier_product_information",
  "capture_pricing_information",
  "capture_moq_information",
  "capture_shipping_availability",
  "capture_supplier_location",
  "preserve_supplier_source_references",
  "produce_machine_readable_supplier_discovery_reports",
  "use_only_approved_supplier_platforms_and_apis",
  "preserve_supplier_traceability",
  "preserve_audit_history",
  "never_modify_supplier_data",
  "distinguish_unavailable_from_missing_information",
  "submit_reports_through_executive_reporting_runtime",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_product_evaluation_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "supplier_discovery_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
