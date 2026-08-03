/** PILLOW-GMI-001 — Global Market Intelligence paths (X4-09). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_GLOBAL_MARKET_INTELLIGENCE_SYSTEM.md" as const;
export const GLOBAL_MARKET_INTELLIGENCE_SYSTEM_PATH = SYSTEM_PATH;

export const GMI_METADATA_VERSION = "GMI-001-v1" as const;
export const GLOBAL_MARKET_INTELLIGENCE_ID = "global-market-intelligence" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "monitoring",
  "analyzing",
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

export const MARKET_CATEGORIES = [
  "international_market",
  "market_trend",
  "customer_demand",
  "competitor_activity",
  "product_opportunity",
  "regional_growth",
  "emerging_market",
  "declining_market",
  "opportunity_ranking",
] as const;

export const MARKET_SIGNALS = [
  "emerging",
  "stable",
  "declining",
  "volatile",
  "unknown",
] as const;

export const RISK_LEVELS = ["critical", "high", "medium", "low", "informational"] as const;

export const GMI_CAPABILITIES = [
  "international_market_monitoring",
  "market_trend_monitoring",
  "customer_demand_monitoring",
  "competitor_activity_monitoring",
  "product_opportunity_monitoring",
  "regional_growth_monitoring",
  "emerging_market_detection",
  "declining_market_detection",
  "global_opportunity_ranking",
  "market_recommendations",
  "market_intelligence_records",
  "market_validation",
  "market_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
