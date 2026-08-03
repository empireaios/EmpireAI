/** PILLOW-TBW-001 — Template Builder Worker (Q5-06). */
export const TEMPLATE_BUILDER_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_TEMPLATE_BUILDER_WORKER_SYSTEM.md" as const;
export const TEMPLATE_BUILDER_WORKER_ID = "template-builder-worker" as const;
export const TBW_METADATA_VERSION = "TBW-001-v1" as const;
export const TEMPLATE_BUILDER_REPORT_VERSION = "TBW-RPT-v1" as const;

export const TEMPLATE_BUILDER_WORKER_IDENTITY = {
  workerId: "wkr-template-builder-01",
  workerName: "Template Builder Worker",
  workerType: "creator",
  department: "digital_products",
  factory: "digital-products-factory",
  role: "role-creator-template-builder",
  reportingLine: ["wkr-template-builder-01", "pillow"] as string[],
  skillProfile: [
    "skill-approved-research-intake",
    "skill-reusable-template-design",
    "skill-planner-generation",
    "skill-spreadsheet-schema-design",
    "skill-contract-document-templates",
    "skill-business-forms-checklists",
    "skill-prompt-library-authoring",
    "skill-usability-completeness-validation",
    "skill-export-ready-template-packages",
  ],
  approvedTools: ["template_ledger", "template_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "generating_templates",
  "generating_planners",
  "generating_spreadsheets",
  "generating_contracts",
  "generating_forms",
  "generating_prompts",
  "validating_usability",
  "exporting",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Supported reusable template / product types (extensible). */
export const PRODUCT_TYPES = [
  "business_templates",
  "spreadsheet_templates",
  "financial_templates",
  "project_planners",
  "calendars",
  "contracts",
  "checklists",
  "sop_templates",
  "forms",
  "prompt_templates",
  "unknown",
] as const;

export const EXPORT_FORMATS = [
  "markdown",
  "csv_ready",
  "xlsx_ready",
  "docx_ready",
  "zip_ready",
] as const;

export const SUPPORTED_ASSET_FORMATS = [
  "markdown",
  "csv",
  "xlsx_schema",
  "docx_outline",
  "json_pack",
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

export const TBW_CAPABILITIES = [
  "receive_approved_digital_product_research",
  "generate_reusable_templates",
  "generate_planners",
  "generate_spreadsheets",
  "generate_contracts_and_document_templates",
  "generate_business_forms_and_checklists",
  "generate_reusable_prompt_libraries",
  "validate_usability_and_completeness",
  "prepare_export_ready_template_packages",
  "produce_machine_readable_template_builder_reports",
  "follow_approved_product_research",
  "follow_approved_product_intent",
  "produce_original_reusable_assets",
  "preserve_complete_traceability",
  "validate_usability_before_submission",
  "perform_self_review",
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
  "template_builder_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
