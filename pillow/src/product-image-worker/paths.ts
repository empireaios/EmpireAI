/** PILLOW-PIW-001 — Product Image Worker (Q3-07). */
export const PRODUCT_IMAGE_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PRODUCT_IMAGE_WORKER_SYSTEM.md" as const;
export const PRODUCT_IMAGE_WORKER_ID = "product-image-worker" as const;
export const PIW_METADATA_VERSION = "PIW-001-v1" as const;
export const PRODUCT_IMAGE_REPORT_VERSION = "PIW-RPT-v1" as const;

export const PRODUCT_IMAGE_WORKER_IDENTITY = {
  workerId: "wkr-product-image-01",
  workerName: "Product Image Worker",
  workerType: "analyst",
  department: "commerce",
  factory: "commerce-factory",
  role: "role-analyst-product-image",
  reportingLine: ["wkr-product-image-01", "pillow"] as string[],
  skillProfile: [
    "skill-image-quality-validation",
    "skill-duplicate-detection",
    "skill-marketplace-compliance",
    "skill-image-variant-generation",
    "skill-visual-asset-packaging",
  ],
  approvedTools: ["image_ledger", "quality_scoring", "variant_pipeline"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "validating",
  "organizing",
  "processing",
  "packaging",
  "reporting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const IMAGE_QUALITY_STATUSES = ["pass", "review", "fail"] as const;
export const COMPLIANCE_STATUSES = ["compliant", "review_required", "non_compliant"] as const;
export const MARKETPLACE_TARGETS = ["amazon", "shopify", "ebay", "generic"] as const;

export const EVIDENCE_KINDS = ["fact", "assumption"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "supplier_evaluation_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const PIW_CAPABILITIES = [
  "receive_approved_supplier_images",
  "validate_image_quality",
  "detect_duplicate_or_unusable_images",
  "organize_product_image_sets",
  "prepare_marketplace_compliant_images",
  "generate_standardized_image_variants",
  "preserve_image_metadata",
  "validate_marketplace_compliance",
  "package_product_visual_assets",
  "produce_machine_readable_product_image_reports",
  "preserve_original_supplier_assets",
  "maintain_traceability_to_supplier",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_overwrite_original_source_assets",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_supplier_evaluation_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "product_image_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
