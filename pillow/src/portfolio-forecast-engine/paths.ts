/** PILLOW-PFE-001 — Portfolio Forecast Engine paths (X2-14). */

export const PORTFOLIO_FORECAST_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PORTFOLIO_FORECAST_ENGINE_SYSTEM.md";

export const PFE_METADATA_VERSION = "PFE-001-v1" as const;

export const PORTFOLIO_FORECAST_ENGINE_ID = "portfolio-forecast-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "forecasting",
  "scenario_generation",
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

export const PFE_CAPABILITIES = [
  "portfolio_revenue_forecasting",
  "portfolio_profit_forecasting",
  "company_growth_forecasting",
  "capital_requirement_forecasting",
  "customer_growth_forecasting",
  "supplier_capacity_forecasting",
  "portfolio_risk_forecasting",
  "forecast_scenario_generation",
  "executive_forecast_generation",
  "forecast_validation",
  "forecast_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const FORECAST_PERIODS = ["30d", "90d", "180d", "365d"] as const;

export const SCENARIO_TYPES = ["base", "optimistic", "conservative", "stress"] as const;
