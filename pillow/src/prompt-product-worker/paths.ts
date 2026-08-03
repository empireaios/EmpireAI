/** PILLOW-PPW-001 — Prompt Product Worker (Q5-04). */
export const PROMPT_PRODUCT_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PROMPT_PRODUCT_WORKER_SYSTEM.md" as const;
export const PROMPT_PRODUCT_WORKER_ID = "prompt-product-worker" as const;
export const PPW_METADATA_VERSION = "PPW-001-v1" as const;
export const PROMPT_PRODUCT_REPORT_VERSION = "PPW-RPT-v1" as const;

export const PROMPT_PRODUCT_WORKER_IDENTITY = {
  workerId: "wkr-prompt-product-01",
  workerName: "Prompt Product Worker",
  workerType: "creator",
  department: "digital_products",
  factory: "digital-products-factory",
  role: "role-creator-prompt-product",
  reportingLine: ["wkr-prompt-product-01", "pillow"] as string[],
  skillProfile: [
    "skill-approved-research-intake",
    "skill-prompt-architecture",
    "skill-prompt-libraries",
    "skill-reusable-prompt-templates",
    "skill-ai-workflow-products",
    "skill-structured-prompt-packs",
    "skill-user-instructions",
    "skill-prompt-consistency-validation",
    "skill-export-ready-prompt-products",
  ],
  approvedTools: ["prompt_ledger", "prompt_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "architecting",
  "library_building",
  "templating",
  "workflow_building",
  "packing",
  "instructing",
  "validating_prompts",
  "exporting",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Supported prompt product types (extensible). */
export const PRODUCT_TYPES = [
  "prompt_pack",
  "prompt_library",
  "ai_workflow_system",
  "prompt_collection",
  "ai_productivity_kit",
  "business_prompt_pack",
  "creative_prompt_pack",
  "technical_prompt_pack",
  "unknown",
] as const;

/** Target AI platforms (extensible). */
export const TARGET_AI_PLATFORMS = [
  "chatgpt",
  "claude",
  "gemini",
  "copilot",
  "multi_platform",
  "unknown",
] as const;

export const EXPORT_FORMATS = [
  "markdown",
  "json_pack",
  "zip_ready",
  "notion_ready",
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

export const PPW_CAPABILITIES = [
  "receive_approved_digital_product_research",
  "design_prompt_architecture",
  "create_prompt_libraries",
  "create_reusable_prompt_templates",
  "create_ai_workflow_products",
  "organize_prompts_into_structured_packs",
  "generate_user_instructions",
  "validate_prompt_consistency",
  "package_export_ready_prompt_products",
  "produce_machine_readable_prompt_product_reports",
  "follow_approved_product_research",
  "follow_approved_product_intent",
  "produce_original_prompt_products",
  "preserve_complete_traceability",
  "validate_prompt_quality",
  "include_user_documentation",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_build_sales_pages",
  "never_process_customer_payments",
  "never_deliver_products",
  "never_publish_products_directly",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_digital_products_factory_core",
  "integrate_digital_product_research_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "prompt_product_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
