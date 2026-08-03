/** PILLOW-ESD-001 — Executive Scaling Dashboard paths (X3-09). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_EXECUTIVE_SCALING_DASHBOARD_SYSTEM.md" as const;
export const EXECUTIVE_SCALING_DASHBOARD_SYSTEM_PATH = SYSTEM_PATH;

export const ESD_METADATA_VERSION = "ESD-001-v1" as const;
export const EXECUTIVE_SCALING_DASHBOARD_ID = "executive-scaling-dashboard" as const;

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

export const ESD_CAPABILITIES = [
  "enterprise_scaling_status_display",
  "scaling_opportunities_display",
  "scaling_decisions_display",
  "operational_capacity_display",
  "marketing_growth_display",
  "supplier_readiness_display",
  "financial_readiness_display",
  "workforce_utilization_display",
  "executive_alerts_display",
  "scaling_recommendations_display",
  "dashboard_records",
  "dashboard_validation",
  "dashboard_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
