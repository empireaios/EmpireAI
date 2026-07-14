/** PILLOW-WMT-001 — Walmart Marketplace Integration paths (R1-06). */

export const WALMART_MARKETPLACE_INTEGRATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WALMART_MARKETPLACE_INTEGRATION_SYSTEM.md";

export const WALMART_CONNECTOR_METADATA_VERSION = "WMT-001-v1" as const;

export const WALMART_MARKETPLACE_ID = "walmart" as const;

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

export const WALMART_CAPABILITIES = [
  "walmart_authentication",
  "walmart_connection_testing",
  "api_request_routing",
  "api_response_normalization",
  "rate_limit_handling",
  "retry_handling",
  "connector_health_monitoring",
  "diagnostics",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Walmart Marketplace API endpoints (structural — no live HTTP in R1-06). */
export const WALMART_API_ENDPOINTS = {
  production: "https://marketplace.walmartapis.com",
  sandbox: "https://sandbox.walmartapis.com",
} as const;
