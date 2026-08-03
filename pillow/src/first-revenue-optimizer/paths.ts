/** PILLOW-FRO-001 — First Revenue Optimizer paths (X1-14). */

export const FIRST_REVENUE_OPTIMIZER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_FIRST_REVENUE_OPTIMIZER_SYSTEM.md";

export const FRO_METADATA_VERSION = "FRO-001-v1" as const;

export const FIRST_REVENUE_OPTIMIZER_ID = "first-revenue-optimizer" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "optimizing",
  "degraded",
  "suspended",
  "failed",
  "stopped",
] as const;

export const OPERATIONAL_STATES = [
  "registered",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const FRO_CAPABILITIES = [
  "first_sales_monitoring",
  "early_revenue_analysis",
  "product_performance_analysis",
  "customer_purchase_analysis",
  "revenue_bottleneck_detection",
  "underperforming_product_detection",
  "product_priority_optimization",
  "pricing_recommendation_optimization",
  "early_revenue_recommendations",
  "revenue_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
