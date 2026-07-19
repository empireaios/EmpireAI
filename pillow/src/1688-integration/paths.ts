/** PILLOW-1688-001 — 1688 Integration paths (R2-04). */

export const OSS1688_INTEGRATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_1688_INTEGRATION_SYSTEM.md";

export const OSS1688_CONNECTOR_METADATA_VERSION = "OSS-001-v1" as const;

export const OSS1688_SUPPLIER_ID = "1688" as const;

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

export const OSS1688_CAPABILITIES = [
  "1688_authentication",
  "1688_connection_testing",
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

export const OSS1688_API_ENDPOINTS = {
  production: "https://gw.open.1688.com/openapi",
  sandbox: "https://gw.open.1688.com/openapi",
} as const;
