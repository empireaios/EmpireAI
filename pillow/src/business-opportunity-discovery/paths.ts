/** PILLOW-BOD-001 — Business Opportunity Discovery paths (X1-02). */

export const BUSINESS_OPPORTUNITY_DISCOVERY_SYSTEM_PATH =
  "docs/governance/EMPIREAI_BUSINESS_OPPORTUNITY_DISCOVERY_SYSTEM.md";

export const BOD_METADATA_VERSION = "BOD-001-v1" as const;

export const BUSINESS_OPPORTUNITY_DISCOVERY_ID = "business-opportunity-discovery" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "discovering",
  "monitoring",
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

export const OPPORTUNITY_CATEGORIES = [
  "underserved_market",
  "profitable_niche",
  "emerging_industry",
  "customer_demand",
  "competitor_gap",
  "market_trend",
  "general",
] as const;

export const BOD_CAPABILITIES = [
  "business_opportunity_discovery",
  "market_trend_monitoring",
  "emerging_industry_monitoring",
  "customer_demand_monitoring",
  "competitor_activity_monitoring",
  "underserved_market_identification",
  "profitable_niche_identification",
  "opportunity_scoring",
  "opportunity_ranking",
  "opportunity_validation",
  "opportunity_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
