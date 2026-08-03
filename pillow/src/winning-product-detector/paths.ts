/** PILLOW-WPD-001 — Winning Product Detector paths (X3-02). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_WINNING_PRODUCT_DETECTOR_SYSTEM.md" as const;
export const WINNING_PRODUCT_DETECTOR_SYSTEM_PATH = SYSTEM_PATH;

export const WPD_METADATA_VERSION = "WPD-001-v1" as const;
export const WINNING_PRODUCT_DETECTOR_ID = "winning-product-detector" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "monitoring",
  "analyzing",
  "detecting",
  "ranking",
  "recommending",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const OPERATIONAL_STATES = [
  "disconnected",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const WPD_CAPABILITIES = [
  "product_performance_monitoring",
  "sales_velocity_analysis",
  "revenue_growth_monitoring",
  "profit_growth_monitoring",
  "customer_demand_monitoring",
  "conversion_rate_monitoring",
  "product_trend_monitoring",
  "inventory_movement_monitoring",
  "breakout_product_detection",
  "declining_product_detection",
  "scaling_potential_ranking",
  "scaling_recommendations",
  "product_validation",
  "product_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const OPPORTUNITY_CLASSES = ["breakout", "stable", "declining", "emerging"] as const;
