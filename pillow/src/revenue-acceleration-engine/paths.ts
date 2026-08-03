/** PILLOW-RAE-001 — Revenue Acceleration Engine paths (X3-16). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_REVENUE_ACCELERATION_ENGINE_SYSTEM.md" as const;
export const REVENUE_ACCELERATION_ENGINE_SYSTEM_PATH = SYSTEM_PATH;

export const RAE_METADATA_VERSION = "RAE-001-v1" as const;
export const REVENUE_ACCELERATION_ENGINE_ID = "revenue-acceleration-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "evaluating",
  "identifying",
  "optimizing",
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

export const REVENUE_OPERATIONS = [
  "revenue_growth_monitoring",
  "revenue_trend_monitoring",
  "product_revenue_monitoring",
  "channel_revenue_monitoring",
  "customer_revenue_monitoring",
  "revenue_acceleration_opportunities",
  "revenue_bottleneck_identification",
  "revenue_strategy_optimization",
  "revenue_opportunity_ranking",
] as const;

export const REVENUE_CATEGORIES = [
  "growth",
  "trend",
  "product",
  "channel",
  "customer",
] as const;

export const RAE_CAPABILITIES = [
  "revenue_growth_monitoring",
  "revenue_trend_monitoring",
  "product_revenue_monitoring",
  "channel_revenue_monitoring",
  "customer_revenue_monitoring",
  "revenue_acceleration_opportunities",
  "revenue_bottleneck_identification",
  "revenue_strategy_optimization",
  "revenue_opportunity_ranking",
  "revenue_acceleration_recommendations",
  "revenue_acceleration_records",
  "revenue_validation",
  "revenue_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
