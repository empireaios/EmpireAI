/** PILLOW-CJ-001 — CJdropshipping Integration paths (R2-02). */

export const CJDROPSHIPPING_INTEGRATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CJDROPSHIPPING_INTEGRATION_SYSTEM.md";

export const CJ_CONNECTOR_METADATA_VERSION = "CJ-001-v1" as const;

export const CJ_SUPPLIER_ID = "cj-dropshipping" as const;

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

export const CJ_CAPABILITIES = [
  "cj_authentication",
  "cj_connection_testing",
  "api_request_routing",
  "api_response_normalization",
  "webhook_event_handling",
  "rate_limit_handling",
  "retry_handling",
  "connector_health_monitoring",
  "diagnostics",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const CJ_API_ENDPOINTS = {
  production: "https://developers.cjdropshipping.com/api2.0/v1",
  sandbox: "https://developers.cjdropshipping.com/api2.0/v1",
} as const;
