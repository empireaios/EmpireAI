/** PILLOW-AMZ-001 — Amazon Marketplace Integration paths (R1-02). */

export const AMAZON_MARKETPLACE_INTEGRATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_AMAZON_MARKETPLACE_INTEGRATION_SYSTEM.md";

export const AMAZON_CONNECTOR_METADATA_VERSION = "AMZ-001-v1" as const;

export const AMAZON_MARKETPLACE_ID = "amazon" as const;

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

export const AMAZON_CAPABILITIES = [
  "amazon_authentication",
  "amazon_connection_testing",
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

/** SP-API regional endpoints (structural — no live calls in R1-02). */
export const AMAZON_SP_API_ENDPOINTS = {
  na: "https://sellingpartnerapi-na.amazon.com",
  fe: "https://sellingpartnerapi-fe.amazon.com",
  eu: "https://sellingpartnerapi-eu.amazon.com",
  sandboxNa: "https://sandbox.sellingpartnerapi-na.amazon.com",
} as const;
