/** PILLOW-FRM-001 — Financial Risk Monitor paths (R3-15). */

export const FINANCIAL_RISK_MONITOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_FINANCIAL_RISK_MONITOR_SYSTEM.md";

export const FRM_METADATA_VERSION = "FRM-001-v1" as const;

export const FINANCIAL_RISK_MONITOR_ID = "financial-risk-monitor" as const;

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

export const RISK_CATEGORIES = [
  "liquidity",
  "profitability",
  "cash_flow",
  "budget",
  "revenue_volatility",
  "expense_volatility",
  "composite",
] as const;

export const RISK_STATUSES = ["healthy", "warning", "critical", "unknown"] as const;

export const FRM_CAPABILITIES = [
  "financial_health_monitoring",
  "liquidity_risk_monitoring",
  "profitability_risk_monitoring",
  "cash_flow_risk_monitoring",
  "budget_risk_monitoring",
  "revenue_volatility_monitoring",
  "expense_volatility_monitoring",
  "anomaly_detection",
  "threshold_breach_detection",
  "risk_scoring",
  "alert_generation",
  "risk_health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
