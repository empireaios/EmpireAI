/** PILLOW-CVI-001 — Conversion Intelligence paths (R5-14). */

export const CONVERSION_INTELLIGENCE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CONVERSION_INTELLIGENCE_SYSTEM.md";

export const CVI_METADATA_VERSION = "CVI-001-v1" as const;

export const CONVERSION_INTELLIGENCE_ID = "conversion-intelligence" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "analyzing",
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

export const MARKETING_CHANNELS = [
  "meta_ads",
  "google_ads",
  "tiktok_ads",
  "youtube_ads",
  "seo",
  "cross_channel",
] as const;

export const FUNNEL_STAGES = [
  "awareness",
  "consideration",
  "landing",
  "engagement",
  "conversion",
  "retention",
] as const;

export const CVI_CAPABILITIES = [
  "funnel_tracking",
  "drop_off_tracking",
  "landing_page_performance",
  "campaign_conversion_measurement",
  "channel_conversion_measurement",
  "bottleneck_detection",
  "abandonment_detection",
  "conversion_efficiency_calculation",
  "funnel_improvement_recommendations",
  "funnel_optimization",
  "conversion_validation",
  "conversion_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
