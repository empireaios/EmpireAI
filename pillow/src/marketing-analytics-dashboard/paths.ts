/** PILLOW-MAD-001 — Marketing Analytics Dashboard paths (R5-10). */

export const MARKETING_ANALYTICS_DASHBOARD_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MARKETING_ANALYTICS_DASHBOARD_SYSTEM.md";

export const MAD_METADATA_VERSION = "MAD-001-v1" as const;

export const MARKETING_ANALYTICS_DASHBOARD_ID = "marketing-analytics-dashboard" as const;

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
  "campaign_performance",
  "advertising_spend",
  "impressions",
  "clicks",
  "ctr",
  "conversions",
  "roas",
  "marketing_roi",
  "audience_performance",
  "seo_performance",
  "executive_summary",
] as const;

export const MAD_CAPABILITIES = [
  "campaign_performance_display",
  "advertising_spend_display",
  "impressions_display",
  "clicks_display",
  "ctr_display",
  "conversions_display",
  "roas_display",
  "marketing_roi_display",
  "audience_performance_display",
  "seo_performance_display",
  "dashboard_validation",
  "dashboard_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
