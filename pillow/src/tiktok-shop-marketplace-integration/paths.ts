/** PILLOW-TTS-001 — TikTok Shop Marketplace Integration paths (R1-09). */

export const TIKTOK_SHOP_MARKETPLACE_INTEGRATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_TIKTOK_SHOP_MARKETPLACE_INTEGRATION_SYSTEM.md";

export const TIKTOK_SHOP_CONNECTOR_METADATA_VERSION = "TTS-001-v1" as const;

export const TIKTOK_SHOP_MARKETPLACE_ID = "tiktok-shop" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "authenticating",
  "active",
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

export const SESSION_STATUSES = ["none", "initializing", "active", "expired", "failed"] as const;

export const CONNECTION_STATUSES = [
  "disconnected",
  "testing",
  "connected",
  "degraded",
  "failed",
] as const;

export const TIKTOK_SHOP_CAPABILITIES = [
  "tiktok_shop_authentication",
  "tiktok_shop_connection_testing",
  "api_request_routing",
  "api_response_normalization",
  "event_processing",
  "rate_limit_handling",
  "retry_handling",
  "connector_health_monitoring",
  "diagnostics",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** TikTok Shop Open API endpoints (structural — no live HTTP in R1-09). */
export const TIKTOK_SHOP_API_ENDPOINTS = {
  production: "https://open-api.tiktokglobalshop.com",
  sandbox: "https://open-api-sandbox.tiktokglobalshop.com",
} as const;
