/** PILLOW-PLW-001 — Product Listing Worker (Q3-08). */
export const PRODUCT_LISTING_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PRODUCT_LISTING_WORKER_SYSTEM.md" as const;
export const PRODUCT_LISTING_WORKER_ID = "product-listing-worker" as const;
export const PLW_METADATA_VERSION = "PLW-001-v1" as const;
export const PRODUCT_LISTING_REPORT_VERSION = "PLW-RPT-v1" as const;

export const PRODUCT_LISTING_WORKER_IDENTITY = {
  workerId: "wkr-product-listing-01",
  workerName: "Product Listing Worker",
  workerType: "analyst",
  department: "commerce",
  factory: "commerce-factory",
  role: "role-analyst-product-listing",
  reportingLine: ["wkr-product-listing-01", "pillow"] as string[],
  skillProfile: [
    "skill-product-title-generation",
    "skill-product-description",
    "skill-listing-attributes",
    "skill-variant-structuring",
    "skill-marketplace-seo",
  ],
  approvedTools: ["listing_ledger", "seo_field_builder", "marketplace_packager"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "generating",
  "validating",
  "packaging",
  "reporting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const LISTING_VALIDATION_STATUSES = ["pass", "review", "fail"] as const;
export const MARKETPLACE_TARGETS = ["amazon", "shopify", "ebay", "generic"] as const;

export const EVIDENCE_KINDS = ["fact", "assumption"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "product_image_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const PLW_CAPABILITIES = [
  "receive_approved_product_information",
  "receive_approved_product_images",
  "generate_product_titles",
  "generate_product_descriptions",
  "generate_product_bullet_points",
  "generate_product_attributes",
  "generate_product_variants",
  "generate_marketplace_seo_fields",
  "validate_required_listing_fields",
  "produce_marketplace_specific_listing_packages",
  "produce_machine_readable_product_listing_reports",
  "preserve_product_traceability",
  "preserve_supplier_references",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_publish_listings_automatically",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_product_image_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "product_listing_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
