/** PILLOW-EGD-001 — Executive Global Dashboard paths (X4-10). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_EXECUTIVE_GLOBAL_DASHBOARD_SYSTEM.md" as const;
export const EXECUTIVE_GLOBAL_DASHBOARD_SYSTEM_PATH = SYSTEM_PATH;

export const EGD_METADATA_VERSION = "EGD-001-v1" as const;
export const EXECUTIVE_GLOBAL_DASHBOARD_ID = "executive-global-dashboard" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "refreshing",
  "aggregating",
  "alerting",
  "recommending",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const OPERATIONAL_STATES = [
  "disconnected",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const DASHBOARD_WIDGETS = [
  "worldwide_operations",
  "country_expansion",
  "regional_performance",
  "market_opportunities",
  "logistics_performance",
  "compliance_status",
  "taxation_status",
  "localization_readiness",
  "executive_alerts",
  "global_recommendations",
] as const;

export const ALERT_SEVERITIES = ["critical", "high", "medium", "low", "informational"] as const;

export const EGD_CAPABILITIES = [
  "worldwide_operations_display",
  "country_expansion_status_display",
  "regional_performance_display",
  "market_opportunities_display",
  "logistics_performance_display",
  "compliance_status_display",
  "taxation_status_display",
  "localization_readiness_display",
  "executive_alerts_display",
  "global_recommendations_display",
  "dashboard_records",
  "dashboard_validation",
  "dashboard_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
