/** PILLOW-DPC-001 — Digital Products Certification (Q5-12). */

export const DIGITAL_PRODUCTS_CERTIFICATION_SYSTEM_PATH =

  "docs/governance/EMPIREAI_DIGITAL_PRODUCTS_CERTIFICATION_SYSTEM.md" as const;

export const DIGITAL_PRODUCTS_CERTIFICATION_ID = "digital-products-certification" as const;

export const DPC_METADATA_VERSION = "DPC-001-v1" as const;

export const DIGITAL_PRODUCTS_FACTORY_VERSION = "Q5-DPF-v1" as const;

export const DPC_REPORT_VERSION = "DPC-REPORT-v1" as const;



export const ENGINE_STATUSES = [

  "idle",

  "connecting",

  "active",

  "certifying",

  "assessing",

  "failed",

] as const;



export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;



/** Final certification status vocabulary (Q5-12). */

export const CERTIFICATION_STATUSES = [

  "Certified",

  "Conditionally Certified",

  "Partially Implemented",

  "Failed",

  "Missing",

] as const;



export const COMPONENT_PROBE_RESULTS = ["pass", "warning", "fail"] as const;



/**

 * Mandatory Digital Products Factory components (Q5-01 … Q5-11).

 */

export const DIGITAL_PRODUCTS_FACTORY_COMPONENTS = [

  {

    id: "digital-products-factory-core",

    label: "Digital Products Factory Core",

    missionId: "Q5-01",

    workerId: "wkr-digital-products-factory-core-01",

  },

  {

    id: "digital-product-research-worker",

    label: "Digital Product Research Worker",

    missionId: "Q5-02",

    workerId: "wkr-digital-product-research-01",

  },

  {

    id: "ebook-worker",

    label: "Ebook Worker",

    missionId: "Q5-03",

    workerId: "wkr-ebook-01",

  },

  {

    id: "prompt-product-worker",

    label: "Prompt Product Worker",

    missionId: "Q5-04",

    workerId: "wkr-prompt-product-01",

  },

  {

    id: "course-builder-worker",

    label: "Course Builder Worker",

    missionId: "Q5-05",

    workerId: "wkr-course-builder-01",

  },

  {

    id: "template-builder-worker",

    label: "Template Builder Worker",

    missionId: "Q5-06",

    workerId: "wkr-template-builder-01",

  },

  {

    id: "design-worker",

    label: "Design Worker",

    missionId: "Q5-07",

    workerId: "wkr-design-01",

  },

  {

    id: "sales-page-worker",

    label: "Sales Page Worker",

    missionId: "Q5-08",

    workerId: "wkr-sales-page-01",

  },

  {

    id: "checkout-worker",

    label: "Checkout Worker",

    missionId: "Q5-09",

    workerId: "wkr-checkout-01",

  },

  {

    id: "digital-delivery-worker",

    label: "Digital Delivery Worker",

    missionId: "Q5-10",

    workerId: "wkr-digital-delivery-01",

  },

  {

    id: "digital-product-analytics-worker",

    label: "Digital Product Analytics Worker",

    missionId: "Q5-11",

    workerId: "wkr-digital-product-analytics-01",

  },

] as const;



/** Repository audit evidence paths per mission (evidence-based certification). */

export const MISSION_AUDIT_PATHS: Record<string, string> = {

  "Q5-01": "docs/audits/pillow/q5-01-digital-products-factory-core",

  "Q5-02": "docs/audits/pillow/q5-02-digital-product-research-worker",

  "Q5-03": "docs/audits/pillow/q5-03-ebook-worker",

  "Q5-04": "docs/audits/pillow/q5-04-prompt-product-worker",

  "Q5-05": "docs/audits/pillow/q5-05-course-builder-worker",

  "Q5-06": "docs/audits/pillow/q5-06-template-builder-worker",

  "Q5-07": "docs/audits/pillow/q5-07-design-worker",

  "Q5-08": "docs/audits/pillow/q5-08-sales-page-worker",

  "Q5-09": "docs/audits/pillow/q5-09-checkout-worker",

  "Q5-10": "docs/audits/pillow/q5-10-digital-delivery-worker",

  "Q5-11": "docs/audits/pillow/q5-11-digital-product-analytics-worker",

};



/**

 * Final acceptance integration domains (Q5-12).

 */

export const INTEGRATION_DOMAINS = [

  "research_to_product_creation",

  "product_creation_to_design",

  "design_to_sales_page",

  "sales_page_to_checkout",

  "checkout_to_delivery",

  "delivery_to_analytics",

  "analytics_to_factory_core",

  "cross_worker_integration",

  "executive_reporting",

  "audit_runtime",

  "worker_performance_review",

  "worker_recovery_system",

  "traceability_chain",

  "pillow_governance",

  "autonomous_operation_under_pillow",

  "digital_products_operational_readiness",

] as const;



/**

 * Mandatory Digital Products Factory governance validations (Q5-12).

 */

export const DIGITAL_PRODUCTS_GOVERNANCE_RULES = [

  "digital_products_factory_core_operational_under_pillow",

  "digital_product_research_worker_operational_under_pillow",

  "ebook_worker_operational_under_pillow",

  "prompt_product_worker_operational_under_pillow",

  "course_builder_worker_operational_under_pillow",

  "template_builder_worker_operational_under_pillow",

  "design_worker_operational_under_pillow",

  "sales_page_worker_operational_under_pillow",

  "checkout_worker_operational_under_pillow",

  "digital_delivery_worker_operational_under_pillow",

  "digital_product_analytics_worker_operational_under_pillow",

  "full_traceability_preserved",

  "entire_digital_products_factory_operates_under_pillow_governance",

  "never_modify_products_without_pillow_approval",

  "deliver_only_verified_purchases",

  "never_fabricate_metrics",

] as const;



export const DPC_CAPABILITIES = [

  "verify_digital_products_factory_core",

  "verify_digital_product_research_worker",

  "verify_ebook_worker",

  "verify_prompt_product_worker",

  "verify_course_builder_worker",

  "verify_template_builder_worker",

  "verify_design_worker",

  "verify_sales_page_worker",

  "verify_checkout_worker",

  "verify_digital_delivery_worker",

  "verify_digital_product_analytics_worker",

  "verify_worker_registration",

  "verify_worker_invocation",

  "verify_worker_dependencies",

  "verify_cross_worker_integration",

  "verify_end_to_end_workflow",

  "verify_executive_reporting_integration",

  "verify_governance_compliance",

  "verify_failure_handling_and_recovery",

  "verify_audit_trail_completeness",

  "verify_autonomous_operation_under_pillow",

  "produce_unified_digital_products_certification_report",

  "assess_digital_products_workflow_completeness",

  "determine_q5_production_readiness",

  "confirm_never_begin_q6",

  "extensible_certification_statuses",

  "extensible_integration_domains",

  "preserve_auditability",

  "preserve_traceability",

  "digital_products_certification_validation",

  "health_monitoring",

  "recovery_management",

  "submit_to_executive_reporting",

] as const;


