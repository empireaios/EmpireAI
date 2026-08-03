/** PILLOW-DPA-001 — Digital Product Analytics Worker (Q5-11). */
export const DIGITAL_PRODUCT_ANALYTICS_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_DIGITAL_PRODUCT_ANALYTICS_WORKER_SYSTEM.md" as const;
export const DIGITAL_PRODUCT_ANALYTICS_WORKER_ID = "digital-product-analytics-worker" as const;
export const DPA_METADATA_VERSION = "DPA-001-v1" as const;
export const DIGITAL_PRODUCT_ANALYTICS_WORKER_REPORT_VERSION = "DPA-RPT-v1" as const;

export const DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY = {
  workerId: "wkr-digital-product-analytics-01",
  workerName: "Digital Product Analytics Worker",
  workerType: "analyst",
  department: "digital_products",
  factory: "digital-products-factory",
  role: "role-analyst-digital-product-analytics",
  reportingLine: ["wkr-digital-product-analytics-01", "pillow"] as string[],
  skillProfile: [
    "skill-product-sales-tracking",
    "skill-revenue-profit-metrics",
    "skill-conversion-rate-tracking",
    "skill-refund-rate-tracking",
    "skill-customer-feedback-analysis",
    "skill-product-performance-trend-detection",
    "skill-underperforming-product-detection",
    "skill-improvement-opportunity-recommendation",
    "skill-executive-performance-summaries",
    "skill-structural-digital-product-analytics-reporting",
  ],
  approvedTools: ["analytics_ledger", "analytics_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "tracking_sales",
  "tracking_revenue_profit",
  "tracking_conversion",
  "tracking_refunds",
  "analysing_feedback",
  "detecting_trends",
  "detecting_underperformance",
  "recommending_improvements",
  "generating_executive_summary",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Supported analytics modules (extensible). */
export const ANALYTICS_TYPES = [
  "sales_performance",
  "revenue_performance",
  "profitability",
  "conversion_rate",
  "refund_rate",
  "customer_satisfaction",
  "product_ranking",
  "trend_analysis",
  "opportunity_detection",
  "executive_kpi_dashboard",
  "unknown",
] as const;

export const RESEARCH_COMPLIANCE_LEVELS = ["compliant", "partial", "non_compliant"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "digital_products_factory_core",
  "checkout_worker",
  "digital_delivery_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const DPA_CAPABILITIES = [
  "track_product_sales",
  "track_revenue_and_profit_metrics",
  "track_conversion_rates",
  "track_refund_rates",
  "analyse_customer_feedback",
  "detect_product_performance_trends",
  "detect_underperforming_products",
  "recommend_improvement_opportunities",
  "generate_executive_performance_summaries",
  "produce_machine_readable_digital_product_analytics_reports",
  "preserve_complete_data_traceability",
  "distinguish_measured_data_from_recommendations",
  "never_fabricate_metrics",
  "preserve_historical_analytics",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_modify_products_without_pillow_approval",
  "never_edit_products",
  "never_process_payments",
  "never_deliver_products",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_digital_products_factory_core",
  "integrate_checkout_worker",
  "integrate_digital_delivery_worker",
  "integrate_executive_reporting_runtime",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "digital_product_analytics_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
