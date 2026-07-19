/** PILLOW-TAI-001 — TikTok Ads Integration paths (R5-04). */

export const TIKTOK_ADS_INTEGRATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_TIKTOK_ADS_INTEGRATION_SYSTEM.md";

export const TAI_METADATA_VERSION = "TAI-001-v1" as const;

export const TIKTOK_ADS_INTEGRATION_ID = "tiktok-ads-integration" as const;

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

export const TAI_CAPABILITIES = [
  "tiktok_account_connection",
  "tiktok_authentication",
  "advertiser_account_management",
  "campaign_creation",
  "ad_group_creation",
  "advertisement_creation",
  "campaign_performance_retrieval",
  "campaign_status_synchronization",
  "audience_synchronization",
  "tiktok_ads_validation",
  "tiktok_ads_metadata_generation",
  "health_monitoring",
  "diagnostics",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const TIKTOK_ADS_API_ENDPOINTS = {
  production: "https://business-api.tiktok.com/open_api/v1.3",
  sandbox: "https://sandbox-ads.tiktok.com/open_api/v1.3",
} as const;
