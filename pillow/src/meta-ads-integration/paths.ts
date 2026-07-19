/** PILLOW-MAI-001 — Meta Ads Integration paths (R5-02). */

export const META_ADS_INTEGRATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_META_ADS_INTEGRATION_SYSTEM.md";

export const MAI_METADATA_VERSION = "MAI-001-v1" as const;

export const META_ADS_INTEGRATION_ID = "meta-ads-integration" as const;

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

export const MAI_CAPABILITIES = [
  "meta_account_connection",
  "meta_authentication",
  "business_account_management",
  "ad_account_management",
  "campaign_creation",
  "ad_set_creation",
  "advertisement_creation",
  "campaign_performance_retrieval",
  "campaign_status_synchronization",
  "meta_validation",
  "meta_metadata_generation",
  "health_monitoring",
  "diagnostics",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const META_API_ENDPOINTS = {
  production: "https://graph.facebook.com/v19.0",
  sandbox: "https://graph.facebook.com/v19.0/sandbox",
} as const;
