/** PILLOW-EPD-001 — Executive Portfolio Dashboard paths (X2-06). */

export const EXECUTIVE_PORTFOLIO_DASHBOARD_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EXECUTIVE_PORTFOLIO_DASHBOARD_SYSTEM.md";

export const EPD_METADATA_VERSION = "EPD-001-v1" as const;

export const EXECUTIVE_PORTFOLIO_DASHBOARD_ID = "executive-portfolio-dashboard" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "refreshing",
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

export const DASHBOARD_WIDGETS = [
  "portfolio_summary",
  "company_performance",
  "portfolio_kpis",
  "capital_allocation",
  "portfolio_growth",
  "company_health",
  "enterprise_alerts",
  "enterprise_recommendations",
  "executive_summary",
] as const;

export const EPD_CAPABILITIES = [
  "enterprise_portfolio_summary_display",
  "company_performance_display",
  "portfolio_kpi_display",
  "capital_allocation_display",
  "portfolio_growth_display",
  "company_health_display",
  "enterprise_alerts_display",
  "enterprise_recommendations_display",
  "executive_drill_down",
  "dashboard_validation",
  "dashboard_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
