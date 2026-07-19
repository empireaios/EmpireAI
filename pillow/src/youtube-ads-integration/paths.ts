/** PILLOW-YAI-001 — YouTube Ads Integration paths (R5-05). */

export const YOUTUBE_ADS_INTEGRATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_YOUTUBE_ADS_INTEGRATION_SYSTEM.md";

export const YAI_METADATA_VERSION = "YAI-001-v1" as const;

export const YOUTUBE_ADS_INTEGRATION_ID = "youtube-ads-integration" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "authenticating",
  "active",
  "syncing",
  "degraded",
  "suspended",
  "failed",
  "stopped",
] as const;

export const OPERATIONAL_STATES = [
  "registered",
  "authenticated",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const AUTHENTICATION_STATUSES = [
  "unauthenticated",
  "pending",
  "authenticated",
  "expired",
  "failed",
] as const;

export const CONNECTION_STATUSES = [
  "disconnected",
  "testing",
  "connected",
  "degraded",
  "failed",
] as const;

export const CAMPAIGN_STATUSES = [
  "draft",
  "pending_review",
  "active",
  "paused",
  "completed",
  "archived",
  "failed",
] as const;

export const SYNCHRONIZATION_STATUSES = [
  "pending",
  "syncing",
  "synced",
  "partial",
  "failed",
] as const;

export const YAI_CAPABILITIES = [
  "youtube_account_connection",
  "google_authentication",
  "advertiser_account_management",
  "youtube_campaign_creation",
  "ad_group_creation",
  "video_advertisement_creation",
  "video_asset_management",
  "campaign_performance_retrieval",
  "campaign_status_synchronization",
  "youtube_ads_validation",
  "youtube_ads_metadata_generation",
  "health_monitoring",
  "diagnostics",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** YouTube campaigns are managed through Google Ads API surfaces. */
export const YOUTUBE_ADS_API_ENDPOINTS = {
  production: "https://googleads.googleapis.com/v19.0",
  sandbox: "https://googleads.googleapis.com/v19.0/sandbox",
} as const;
