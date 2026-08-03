/** PILLOW-DW-001 — Design Worker (Q5-07). */
export const DESIGN_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_DESIGN_WORKER_SYSTEM.md" as const;
export const DESIGN_WORKER_ID = "design-worker" as const;
export const DW_METADATA_VERSION = "DW-001-v1" as const;
export const DESIGN_WORKER_REPORT_VERSION = "DW-RPT-v1" as const;

export const DESIGN_WORKER_IDENTITY = {
  workerId: "wkr-design-01",
  workerName: "Design Worker",
  workerType: "creator",
  department: "digital_products",
  factory: "digital-products-factory",
  role: "role-creator-design-worker",
  reportingLine: ["wkr-design-01", "pillow"] as string[],
  skillProfile: [
    "skill-approved-product-information-intake",
    "skill-ebook-cover-design",
    "skill-course-cover-design",
    "skill-product-branding-assets",
    "skill-promotional-graphics",
    "skill-realistic-product-mockups",
    "skill-preview-image-generation",
    "skill-visual-branding-consistency",
    "skill-export-ready-design-assets",
  ],
  approvedTools: ["design_ledger", "design_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "generating_ebook_covers",
  "generating_course_covers",
  "generating_branding",
  "generating_promos",
  "generating_mockups",
  "generating_previews",
  "maintaining_branding",
  "exporting",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Supported visual asset / product types (extensible).
 * Used as PRODUCT_TYPES and ASSET_TYPES for sibling-pattern consistency.
 */
export const PRODUCT_TYPES = [
  "ebook_cover",
  "course_cover",
  "product_cover",
  "product_graphics",
  "promotional_graphics",
  "mockups",
  "preview_images",
  "branding_assets",
  "social_media_assets",
  "product_icons",
  "unknown",
] as const;

export const ASSET_TYPES = PRODUCT_TYPES;

export const EXPORT_FORMATS = [
  "png_ready",
  "jpg_ready",
  "svg_ready",
  "pdf_ready",
  "zip_ready",
] as const;

export const RESEARCH_COMPLIANCE_LEVELS = ["compliant", "partial", "non_compliant"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "digital_products_factory_core",
  "digital_product_research_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const DW_CAPABILITIES = [
  "receive_approved_digital_product_information",
  "generate_ebook_covers",
  "generate_course_covers",
  "generate_product_branding_assets",
  "generate_promotional_graphics",
  "generate_realistic_product_mockups",
  "generate_preview_images",
  "maintain_visual_branding_consistency",
  "prepare_export_ready_design_assets",
  "produce_machine_readable_design_worker_reports",
  "follow_approved_product_intent",
  "produce_original_visual_assets",
  "maintain_consistent_branding",
  "preserve_complete_traceability",
  "perform_quality_review_before_submission",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_build_sales_pages",
  "never_process_payments",
  "never_deliver_products",
  "never_publish_assets_directly",
  "never_publish_products_directly",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_digital_products_factory_core",
  "integrate_digital_product_research_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "design_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
