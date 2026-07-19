/** PILLOW-ATT-001 — Attribution Engine paths (R5-09). */

export const ATTRIBUTION_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_ATTRIBUTION_ENGINE_SYSTEM.md";

export const ATT_METADATA_VERSION = "ATT-001-v1" as const;

export const ATTRIBUTION_ENGINE_ID = "attribution-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "attributing",
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
  "campaign_manager",
  "audience_intelligence",
  "organic",
  "direct",
  "unknown",
] as const;

export const ATTRIBUTION_MODELS = [
  "first_touch",
  "last_touch",
  "linear",
  "time_decay",
  "position_based",
] as const;

export const ATT_CAPABILITIES = [
  "acquisition_source_tracking",
  "touchpoint_tracking",
  "conversion_journey_tracking",
  "campaign_contribution",
  "channel_contribution",
  "advertisement_contribution",
  "multi_model_attribution",
  "roas_calculation",
  "marketing_roi_calculation",
  "attribution_validation",
  "attribution_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
