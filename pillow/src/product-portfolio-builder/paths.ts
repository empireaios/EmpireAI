/** PILLOW-PPB-001 — Product Portfolio Builder paths (X1-08). */

export const PRODUCT_PORTFOLIO_BUILDER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PRODUCT_PORTFOLIO_BUILDER_SYSTEM.md";

export const PPB_METADATA_VERSION = "PPB-001-v1" as const;

export const PRODUCT_PORTFOLIO_BUILDER_ID = "product-portfolio-builder" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "building",
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

export const PPB_CAPABILITIES = [
  "product_portfolio_generation",
  "product_discovery",
  "product_opportunity_evaluation",
  "product_categorization",
  "product_ranking",
  "product_profitability_estimation",
  "product_demand_estimation",
  "overlapping_product_detection",
  "portfolio_optimization",
  "portfolio_improvement_recommendation",
  "product_portfolio_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
