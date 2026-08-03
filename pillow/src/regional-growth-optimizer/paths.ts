/** PILLOW-RGO-001 — Regional Growth Optimizer paths (X4-14). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_REGIONAL_GROWTH_OPTIMIZER_SYSTEM.md" as const;
export const REGIONAL_GROWTH_OPTIMIZER_SYSTEM_PATH = SYSTEM_PATH;

export const RGO_METADATA_VERSION = "RGO-001-v1" as const;
export const REGIONAL_GROWTH_OPTIMIZER_ID = "regional-growth-optimizer" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "monitoring",
  "evaluating",
  "analyzing",
  "optimizing",
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

export const OPTIMIZATION_CATEGORIES = [
  "regional_business_performance",
  "regional_revenue_growth",
  "regional_profitability",
  "regional_customer_growth",
  "regional_operational_efficiency",
  "regional_growth_opportunity",
  "regional_performance_bottleneck",
  "regional_optimization_priority",
] as const;

export const OPTIMIZATION_STATUSES = [
  "under_review",
  "partial",
  "rejected",
  "validated_ready",
  "unknown",
] as const;

export const PRIORITY_LEVELS = ["critical", "high", "medium", "low", "informational"] as const;

export const RGO_CAPABILITIES = [
  "regional_business_performance_monitoring",
  "regional_revenue_growth_monitoring",
  "regional_profitability_monitoring",
  "regional_customer_growth_monitoring",
  "regional_operational_efficiency_monitoring",
  "regional_growth_opportunity_detection",
  "regional_performance_bottleneck_detection",
  "regional_optimization_priority_ranking",
  "regional_growth_recommendations",
  "regional_optimization_records",
  "regional_validation",
  "regional_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
