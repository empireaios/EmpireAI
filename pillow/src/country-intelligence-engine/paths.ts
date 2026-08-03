/** PILLOW-CIE-001 — Country Intelligence Engine paths (X4-02). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_COUNTRY_INTELLIGENCE_ENGINE_SYSTEM.md" as const;
export const COUNTRY_INTELLIGENCE_ENGINE_SYSTEM_PATH = SYSTEM_PATH;

export const CIE_METADATA_VERSION = "CIE-001-v1" as const;
export const COUNTRY_INTELLIGENCE_ENGINE_ID = "country-intelligence-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "evaluating",
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

export const CIE_CAPABILITIES = [
  "country_evaluation",
  "economic_indicator_monitoring",
  "market_size_monitoring",
  "purchasing_power_monitoring",
  "competitive_landscape_monitoring",
  "ease_of_doing_business_monitoring",
  "digital_commerce_readiness_monitoring",
  "operational_feasibility_monitoring",
  "country_ranking",
  "country_recommendations",
  "country_intelligence_records",
  "country_validation",
  "country_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const EXPANSION_PRIORITIES = [
  "critical",
  "high",
  "medium",
  "low",
  "deferred",
] as const;
