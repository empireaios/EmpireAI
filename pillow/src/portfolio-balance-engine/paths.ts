/** PILLOW-PBE-001 — Portfolio Balance Engine paths (X2-08). */

export const PORTFOLIO_BALANCE_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PORTFOLIO_BALANCE_ENGINE_SYSTEM.md";

export const PBE_METADATA_VERSION = "PBE-001-v1" as const;

export const PORTFOLIO_BALANCE_ENGINE_ID = "portfolio-balance-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "analyzing",
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

export const PBE_CAPABILITIES = [
  "portfolio_diversification_measurement",
  "industry_concentration_measurement",
  "revenue_concentration_measurement",
  "capital_concentration_measurement",
  "geographic_exposure_measurement",
  "portfolio_imbalance_detection",
  "overexposure_detection",
  "diversification_score_calculation",
  "portfolio_balancing_recommendations",
  "portfolio_balance_validation",
  "portfolio_balance_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
