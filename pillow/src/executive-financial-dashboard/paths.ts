/** PILLOW-EFD-001 — Executive Financial Dashboard paths (R3-16). */

export const EXECUTIVE_FINANCIAL_DASHBOARD_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EXECUTIVE_FINANCIAL_DASHBOARD_SYSTEM.md";

export const EFD_METADATA_VERSION = "EFD-001-v1" as const;

export const EXECUTIVE_FINANCIAL_DASHBOARD_ID = "executive-financial-dashboard" as const;

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

export const WIDGET_TYPES = [
  "revenue",
  "expense",
  "profit",
  "cash_flow",
  "liquidity",
  "budget",
  "forecast",
  "risk",
  "kpi",
  "trend",
] as const;

export const EFD_CAPABILITIES = [
  "revenue_display",
  "expense_display",
  "profit_display",
  "cash_flow_display",
  "liquidity_display",
  "budget_display",
  "forecast_display",
  "risk_display",
  "trend_display",
  "kpi_aggregation",
  "executive_summary",
  "dashboard_health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
