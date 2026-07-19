/** PILLOW-ACG-001 — AI Campaign Generator paths (R5-12). */

export const AI_CAMPAIGN_GENERATOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_AI_CAMPAIGN_GENERATOR_SYSTEM.md";

export const ACG_METADATA_VERSION = "ACG-001-v1" as const;

export const AI_CAMPAIGN_GENERATOR_ID = "ai-campaign-generator" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "generating",
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

export const CAMPAIGN_OBJECTIVES = [
  "awareness",
  "traffic",
  "engagement",
  "leads",
  "conversions",
  "retention",
] as const;

export const MARKETING_CHANNELS = [
  "meta_ads",
  "google_ads",
  "tiktok_ads",
  "youtube_ads",
  "seo",
] as const;

export const ACG_CAPABILITIES = [
  "campaign_strategy_generation",
  "campaign_objective_generation",
  "channel_recommendation",
  "audience_recommendation",
  "budget_recommendation",
  "schedule_recommendation",
  "keyword_recommendation",
  "creative_recommendation",
  "campaign_summary_generation",
  "campaign_validation",
  "campaign_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
