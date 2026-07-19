/** PILLOW-MVE-001 — Market Validation Engine paths (X1-03). */

export const MARKET_VALIDATION_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MARKET_VALIDATION_ENGINE_SYSTEM.md";

export const MVE_METADATA_VERSION = "MVE-001-v1" as const;

export const MARKET_VALIDATION_ENGINE_ID = "market-validation-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "validating",
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

export const INVESTMENT_RECOMMENDATIONS = [
  "proceed",
  "caution",
  "investigate",
  "reject",
] as const;

export const MARKET_RISKS = [
  "demand_uncertainty",
  "competitive_pressure",
  "size_ambiguity",
  "profitability_risk",
  "data_gaps",
  "structural_only",
] as const;

export const MVE_CAPABILITIES = [
  "market_validation",
  "market_demand_validation",
  "customer_interest_validation",
  "competitive_landscape_validation",
  "market_size_validation",
  "profitability_potential_validation",
  "validation_confidence_calculation",
  "market_risk_identification",
  "investment_recommendation_generation",
  "validation_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
