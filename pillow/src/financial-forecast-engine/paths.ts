/** PILLOW-FCT-001 — Financial Forecast Engine paths (R3-13). */

export const FINANCIAL_FORECAST_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_FINANCIAL_FORECAST_ENGINE_SYSTEM.md";

export const FCT_METADATA_VERSION = "FCT-001-v1" as const;

export const FINANCIAL_FORECAST_ENGINE_ID = "financial-forecast-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "processing",
  "degraded",
  "suspended",
  "failed",
  "stopped",
] as const;

export const ENGINE_STATES = [
  "registered",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const FORECAST_PERIODS = ["7d", "30d", "90d", "quarterly", "annual"] as const;

export const FCT_CAPABILITIES = [
  "revenue_forecasting",
  "expense_forecasting",
  "profit_forecasting",
  "cash_flow_forecasting",
  "liquidity_forecasting",
  "financial_trend_analysis",
  "deviation_detection",
  "risk_detection",
  "projection_generation",
  "forecast_health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
