/** PILLOW-ETSY-001 — Etsy Marketplace Integration paths (R1-07). */

export const ETSY_MARKETPLACE_INTEGRATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_ETSY_MARKETPLACE_INTEGRATION_SYSTEM.md";

export const ETSY_CONNECTOR_METADATA_VERSION = "ETSY-001-v1" as const;

export const ETSY_MARKETPLACE_ID = "etsy" as const;

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

export const ETSY_CAPABILITIES = [
  "etsy_authentication",
  "etsy_connection_testing",
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

/** Etsy Open API v3 endpoints (structural — no live HTTP in R1-07). */
export const ETSY_API_ENDPOINTS = {
  production: "https://openapi.etsy.com/v3",
  sandbox: "https://openapi.etsy.com/v3",
} as const;
