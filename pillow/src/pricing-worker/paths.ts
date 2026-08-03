/** PILLOW-PRW-001 — Pricing Worker (Q3-09). */
export const PRICING_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PRICING_WORKER_SYSTEM.md" as const;
export const PRICING_WORKER_ID = "pricing-worker" as const;
export const PRW_METADATA_VERSION = "PRW-001-v1" as const;
export const PRICING_REPORT_VERSION = "PRW-RPT-v1" as const;

export const PRICING_WORKER_IDENTITY = {
  workerId: "wkr-pricing-01",
  workerName: "Pricing Worker",
  workerType: "analyst",
  department: "commerce",
  factory: "commerce-factory",
  role: "role-analyst-pricing",
  reportingLine: ["wkr-pricing-01", "pillow"] as string[],
  skillProfile: [
    "skill-landed-cost-calculation",
    "skill-fee-modeling",
    "skill-margin-targeting",
    "skill-competitor-price-comparison",
    "skill-selling-price-recommendation",
  ],
  approvedTools: ["pricing_ledger", "fee_calculator", "margin_engine"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "calculating",
  "comparing",
  "recommending",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const COST_KINDS = ["actual", "estimated"] as const;
export const MARKETPLACE_TARGETS = ["amazon", "shopify", "ebay", "generic"] as const;

export const EVIDENCE_KINDS = ["fact", "assumption"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "product_listing_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const PRW_CAPABILITIES = [
  "receive_approved_products",
  "receive_supplier_cost_information",
  "calculate_total_landed_cost",
  "calculate_marketplace_fees",
  "calculate_payment_processing_fees",
  "calculate_advertising_cost_assumptions",
  "calculate_shipping_cost",
  "calculate_target_margin",
  "calculate_target_profit",
  "compare_against_competitor_pricing",
  "recommend_selling_price",
  "produce_machine_readable_pricing_reports",
  "preserve_complete_pricing_traceability",
  "separate_actual_costs_from_estimated_costs",
  "explain_pricing_rationale",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_publish_pricing_automatically",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_product_listing_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "pricing_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
