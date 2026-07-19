/** PILLOW-CMM-001 — Competitor Marketing Monitor paths (R5-15). */

export const COMPETITOR_MARKETING_MONITOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_COMPETITOR_MARKETING_MONITOR_SYSTEM.md";

export const CMM_METADATA_VERSION = "CMM-001-v1" as const;

export const COMPETITOR_MARKETING_MONITOR_ID = "competitor-marketing-monitor" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "monitoring",
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

export const CMM_CAPABILITIES = [
  "competitor_campaign_monitoring",
  "competitor_advertisement_monitoring",
  "competitor_keyword_monitoring",
  "competitor_seo_ranking_monitoring",
  "competitor_landing_page_monitoring",
  "competitor_promotion_monitoring",
  "strategy_change_detection",
  "emerging_competitor_detection",
  "competitive_intelligence_generation",
  "competitor_validation",
  "competitor_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
