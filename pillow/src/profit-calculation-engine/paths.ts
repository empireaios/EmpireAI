/** PILLOW-PC-001 — Profit Calculation Engine paths (R3-06). */

export const PROFIT_CALCULATION_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PROFIT_CALCULATION_ENGINE_SYSTEM.md";

export const PC_METADATA_VERSION = "PC-001-v1" as const;

export const PROFIT_CALCULATION_ENGINE_ID = "profit-calculation-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "calculating",
  "aggregating",
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

export const CALCULATION_SCOPES = [
  "global",
  "marketplace",
  "supplier",
  "product",
  "order",
] as const;

export const PC_CAPABILITIES = [
  "gross_profit_calculation",
  "operating_profit_calculation",
  "net_profit_calculation",
  "profit_margin_calculation",
  "marketplace_profit_calculation",
  "supplier_profit_calculation",
  "product_profit_calculation",
  "order_profit_calculation",
  "profit_aggregation",
  "anomaly_detection",
  "profit_health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
