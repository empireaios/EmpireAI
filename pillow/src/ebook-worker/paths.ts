/** PILLOW-EBW-001 — Ebook Worker (Q5-03). */
export const EBOOK_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EBOOK_WORKER_SYSTEM.md" as const;
export const EBOOK_WORKER_ID = "ebook-worker" as const;
export const EBW_METADATA_VERSION = "EBW-001-v1" as const;
export const EBOOK_REPORT_VERSION = "EBW-RPT-v1" as const;

export const EBOOK_WORKER_IDENTITY = {
  workerId: "wkr-ebook-01",
  workerName: "Ebook Worker",
  workerType: "creator",
  department: "digital_products",
  factory: "digital-products-factory",
  role: "role-creator-ebook-worker",
  reportingLine: ["wkr-ebook-01", "pillow"] as string[],
  skillProfile: [
    "skill-approved-research-intake",
    "skill-product-outline",
    "skill-chapter-structure",
    "skill-long-form-content",
    "skill-tables-checklists-summaries",
    "skill-references-appendices",
    "skill-consistent-formatting",
    "skill-self-review",
    "skill-export-ready-assets",
  ],
  approvedTools: ["ebook_ledger", "ebook_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "outlining",
  "structuring",
  "writing",
  "formatting",
  "reviewing",
  "exporting",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Supported ebook / digital written product types (extensible). */
export const PRODUCT_TYPES = [
  "ebook",
  "guide",
  "manual",
  "handbook",
  "workbook",
  "checklist_collection",
  "sop_collection",
  "reference_guide",
  "unknown",
] as const;

export const EXPORT_FORMATS = [
  "markdown",
  "pdf_ready",
  "epub_ready",
  "docx_ready",
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

export const EBW_CAPABILITIES = [
  "receive_approved_digital_product_research",
  "create_product_outline",
  "create_chapter_structure",
  "generate_complete_written_content",
  "generate_tables_checklists_summaries",
  "generate_references_and_appendices",
  "apply_consistent_formatting",
  "perform_self_review",
  "prepare_export_ready_ebook_assets",
  "produce_machine_readable_ebook_reports",
  "follow_approved_product_research",
  "follow_approved_product_intent",
  "produce_original_content",
  "preserve_complete_traceability",
  "perform_self_review_before_submission",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_build_sales_pages",
  "never_process_payments",
  "never_deliver_products_to_customers",
  "never_publish_products_directly",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_digital_products_factory_core",
  "integrate_digital_product_research_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "ebook_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
