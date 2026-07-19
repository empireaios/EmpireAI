/** PILLOW-VTI-001 — Viral Trend Intelligence paths (R5-16). */

export const VIRAL_TREND_INTELLIGENCE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_VIRAL_TREND_INTELLIGENCE_SYSTEM.md";

export const VTI_METADATA_VERSION = "VTI-001-v1" as const;

export const VIRAL_TREND_INTELLIGENCE_ID = "viral-trend-intelligence" as const;

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

export const TREND_CATEGORIES = [
  "keyword",
  "hashtag",
  "product",
  "content",
  "creator",
  "cross_category",
] as const;

export const TREND_SOURCES = [
  "meta_ads",
  "google_ads",
  "tiktok_ads",
  "youtube_ads",
  "seo",
  "audience",
  "competitor",
  "cross_source",
] as const;

export const VTI_CAPABILITIES = [
  "emerging_trend_discovery",
  "trending_keyword_monitoring",
  "trending_hashtag_monitoring",
  "trending_product_monitoring",
  "trending_content_monitoring",
  "trending_creator_monitoring",
  "trend_acceleration_detection",
  "trend_decline_detection",
  "trend_prediction",
  "trend_recommendations",
  "trend_validation",
  "trend_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
