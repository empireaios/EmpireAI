/** PILLOW-CAW-001 — Commerce Analytics Worker (Q3-13). */
export const COMMERCE_ANALYTICS_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_COMMERCE_ANALYTICS_WORKER_SYSTEM.md" as const;
export const COMMERCE_ANALYTICS_WORKER_ID = "commerce-analytics-worker" as const;
export const CAW_METADATA_VERSION = "CAW-001-v1" as const;
export const COMMERCE_ANALYTICS_REPORT_VERSION = "CAW-RPT-v1" as const;

export const COMMERCE_ANALYTICS_WORKER_IDENTITY = {
  workerId: "wkr-commerce-analytics-01",
  workerName: "Commerce Analytics Worker",
  workerType: "analyst",
  department: "commerce",
  factory: "commerce-factory",
  role: "role-analyst-commerce-analytics",
  reportingLine: ["wkr-commerce-analytics-01", "pillow"] as string[],
  skillProfile: [
    "skill-product-performance-tracking",
    "skill-sales-analytics",
    "skill-conversion-tracking",
    "skill-profit-analytics",
    "skill-refund-rate-analysis",
    "skill-supplier-performance-scoring",
    "skill-optimization-opportunity-detection",
  ],
  approvedTools: ["analytics_ledger", "metric_calculator", "opportunity_detector"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "tracking",
  "detecting",
  "identifying",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const METRIC_KINDS = ["measured", "estimated"] as const;

export const PRODUCT_PERFORMANCE_CLASSIFICATIONS = [
  "high_performing",
  "stable",
  "declining",
  "insufficient_data",
] as const;

export const OPPORTUNITY_SEVERITIES = [
  "info",
  "opportunity",
  "warning",
  "critical",
] as const;

export const EVIDENCE_KINDS = ["fact", "assumption"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "pricing_worker",
  "inventory_worker",
  "order_worker",
  "refund_dispute_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const CAW_CAPABILITIES = [
  "track_product_performance",
  "track_sales_performance",
  "track_conversion_rates",
  "track_gross_and_net_profit",
  "track_customer_issues",
  "track_refund_rates",
  "track_supplier_performance",
  "detect_declining_products",
  "detect_high_performing_products",
  "identify_optimization_opportunities",
  "produce_machine_readable_commerce_analytics_reports",
  "preserve_complete_traceability",
  "preserve_historical_analytics",
  "distinguish_measured_metrics_from_estimates",
  "highlight_significant_changes",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_modify_operational_data",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_pricing_worker",
  "integrate_inventory_worker",
  "integrate_order_worker",
  "integrate_refund_dispute_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "commerce_analytics_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
