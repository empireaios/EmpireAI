/** PILLOW-CF-001 — Cash Flow Monitor paths (R3-07). */

export const CASH_FLOW_MONITOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CASH_FLOW_MONITOR_SYSTEM.md";

export const CF_METADATA_VERSION = "CF-001-v1" as const;

export const CASH_FLOW_MONITOR_ID = "cash-flow-monitor" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "monitoring",
  "forecasting",
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

export const LIQUIDITY_STATUSES = ["healthy", "adequate", "low", "critical"] as const;

export const CF_CAPABILITIES = [
  "cash_inflow_monitoring",
  "cash_outflow_monitoring",
  "account_balance_monitoring",
  "operating_cash_flow_calculation",
  "net_cash_flow_calculation",
  "liquidity_monitoring",
  "anomaly_detection",
  "negative_cash_flow_detection",
  "short_term_forecast",
  "cash_flow_aggregation",
  "cash_flow_health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
