/** PILLOW-EBAY-001 — eBay Marketplace Integration paths (R1-08). */

export const EBAY_MARKETPLACE_INTEGRATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EBAY_MARKETPLACE_INTEGRATION_SYSTEM.md";

export const EBAY_CONNECTOR_METADATA_VERSION = "EBAY-001-v1" as const;

export const EBAY_MARKETPLACE_ID = "ebay" as const;

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

export const EBAY_CAPABILITIES = [
  "ebay_authentication",
  "ebay_connection_testing",
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

/** eBay REST API endpoints (structural — no live HTTP in R1-08). */
export const EBAY_API_ENDPOINTS = {
  production: "https://api.ebay.com",
  sandbox: "https://api.sandbox.ebay.com",
} as const;
