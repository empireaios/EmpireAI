/** PILLOW-AUD-001 — Audience Intelligence paths (R5-08). */

export const AUDIENCE_INTELLIGENCE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_AUDIENCE_INTELLIGENCE_SYSTEM.md";

export const AUD_METADATA_VERSION = "AUD-001-v1" as const;

export const AUDIENCE_INTELLIGENCE_ID = "audience-intelligence" as const;

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

export const AUDIENCE_SOURCES = [
  "customer_segmentation",
  "customer_journey",
  "meta_ads",
  "google_ads",
  "tiktok_ads",
  "youtube_ads",
  "campaign_manager",
  "composite",
] as const;

export const AUD_CAPABILITIES = [
  "audience_building",
  "demographic_analysis",
  "interest_analysis",
  "behaviour_analysis",
  "intent_analysis",
  "engagement_measurement",
  "quality_measurement",
  "overlap_detection",
  "audience_recommendations",
  "audience_validation",
  "audience_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
