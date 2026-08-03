/** PILLOW-PEP-001 — Portfolio Expansion Planner paths (X2-18). */

export const PORTFOLIO_EXPANSION_PLANNER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PORTFOLIO_EXPANSION_PLANNER_SYSTEM.md";

export const PEP_METADATA_VERSION = "PEP-001-v1" as const;

export const PORTFOLIO_EXPANSION_PLANNER_ID = "portfolio-expansion-planner" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "discovering",
  "evaluating",
  "prioritizing",
  "recommending",
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

export const PEP_CAPABILITIES = [
  "market_expansion_planning",
  "industry_expansion_planning",
  "internal_expansion_planning",
  "acquisition_expansion_planning",
  "expansion_opportunity_detection",
  "expansion_market_evaluation",
  "expansion_industry_evaluation",
  "expansion_internal_evaluation",
  "expansion_acquisition_evaluation",
  "expansion_prioritization",
  "expansion_cost_estimation",
  "expansion_return_estimation",
  "expansion_recommendations",
  "expansion_validation",
  "expansion_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const EXPANSION_CATEGORIES = ["market", "industry", "internal", "acquisition"] as const;

export const EXPANSION_PRIORITIES = ["low", "medium", "high", "critical"] as const;
