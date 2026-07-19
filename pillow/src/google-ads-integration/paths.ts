/** PILLOW-GAI-001 — Google Ads Integration paths (R5-03). */

export const GOOGLE_ADS_INTEGRATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_GOOGLE_ADS_INTEGRATION_SYSTEM.md";

export const GAI_METADATA_VERSION = "GAI-001-v1" as const;

export const GOOGLE_ADS_INTEGRATION_ID = "google-ads-integration" as const;

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

export const GAI_CAPABILITIES = [
  "google_account_connection",
  "google_authentication",
  "customer_account_management",
  "advertising_account_management",
  "campaign_creation",
  "ad_group_creation",
  "advertisement_creation",
  "campaign_performance_retrieval",
  "campaign_status_synchronization",
  "google_ads_validation",
  "google_ads_metadata_generation",
  "health_monitoring",
  "diagnostics",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const GOOGLE_ADS_API_ENDPOINTS = {
  production: "https://googleads.googleapis.com/v19.0",
  sandbox: "https://googleads.googleapis.com/v19.0/sandbox",
} as const;
