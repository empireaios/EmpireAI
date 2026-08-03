/** PILLOW-SPW-001 — Sales Page Worker (Q5-08). */
export const SALES_PAGE_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SALES_PAGE_WORKER_SYSTEM.md" as const;
export const SALES_PAGE_WORKER_ID = "sales-page-worker" as const;
export const SPW_METADATA_VERSION = "SPW-001-v1" as const;
export const SALES_PAGE_WORKER_REPORT_VERSION = "SPW-RPT-v1" as const;

export const SALES_PAGE_WORKER_IDENTITY = {
  workerId: "wkr-sales-page-01",
  workerName: "Sales Page Worker",
  workerType: "creator",
  department: "digital_products",
  factory: "digital-products-factory",
  role: "role-creator-sales-page",
  reportingLine: ["wkr-sales-page-01", "pillow"] as string[],
  skillProfile: [
    "skill-approved-product-information-intake",
    "skill-landing-page-structure",
    "skill-compelling-headlines",
    "skill-benefit-driven-copy",
    "skill-feature-sections",
    "skill-pricing-presentation",
    "skill-testimonial-placeholders",
    "skill-faq-sections",
    "skill-call-to-action-sections",
    "skill-guarantee-sections",
    "skill-conversion-structure-optimization",
  ],
  approvedTools: ["sales_page_ledger", "sales_page_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "structuring",
  "writing_headlines",
  "writing_benefits",
  "writing_features",
  "writing_pricing",
  "writing_testimonials",
  "writing_faqs",
  "writing_ctas",
  "writing_guarantees",
  "optimizing",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Supported sales / landing page types (extensible).
 * Used as PRODUCT_TYPES and PAGE_TYPES for sibling-pattern consistency.
 */
export const PRODUCT_TYPES = [
  "product_landing_page",
  "long_form_sales_page",
  "short_form_sales_page",
  "lead_magnet_page",
  "webinar_registration_page",
  "course_sales_page",
  "ebook_sales_page",
  "template_product_page",
  "unknown",
] as const;

export const PAGE_TYPES = PRODUCT_TYPES;

export const EXPORT_FORMATS = [
  "markdown",
  "html_structure",
  "json_page_pack",
  "zip_ready",
] as const;

export const RESEARCH_COMPLIANCE_LEVELS = ["compliant", "partial", "non_compliant"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "digital_products_factory_core",
  "design_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const SPW_CAPABILITIES = [
  "receive_approved_digital_product_information",
  "generate_complete_landing_page_structure",
  "generate_compelling_headlines",
  "generate_benefit_driven_copy",
  "generate_feature_sections",
  "generate_pricing_presentation",
  "generate_testimonials_or_placeholders",
  "generate_faq_sections",
  "generate_call_to_action_sections",
  "generate_guarantee_sections",
  "optimize_page_structure_for_readability_and_conversion",
  "produce_machine_readable_sales_page_reports",
  "follow_approved_product_information",
  "produce_original_sales_copy",
  "preserve_complete_traceability",
  "maintain_empire_ai_branding_standards",
  "perform_quality_review_before_submission",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_process_payments",
  "never_deliver_products",
  "never_publish_websites",
  "never_publish_pages_directly",
  "never_fabricate_testimonials",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_digital_products_factory_core",
  "integrate_design_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "sales_page_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
