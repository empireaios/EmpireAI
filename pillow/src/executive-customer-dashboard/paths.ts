/** PILLOW-ECD-001 — Executive Customer Dashboard paths (R4-18). */

export const EXECUTIVE_CUSTOMER_DASHBOARD_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EXECUTIVE_CUSTOMER_DASHBOARD_SYSTEM.md";

export const ECD_METADATA_VERSION = "ECD-001-v1" as const;

export const EXECUTIVE_CUSTOMER_DASHBOARD_ID = "executive-customer-dashboard" as const;

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
  "growth",
  "activity",
  "lifetime_value",
  "segmentation",
  "sentiment",
  "loyalty",
  "journey",
  "risk",
  "support",
  "kpi",
] as const;

export const ECD_CAPABILITIES = [
  "growth_display",
  "activity_display",
  "lifetime_value_display",
  "segmentation_display",
  "sentiment_display",
  "loyalty_display",
  "journey_display",
  "risk_display",
  "support_display",
  "kpi_aggregation",
  "executive_summary",
  "dashboard_health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
