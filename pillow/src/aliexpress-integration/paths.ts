/** PILLOW-AEX-001 — AliExpress Integration paths (R2-03). */

export const ALIEXPRESS_INTEGRATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_ALIEXPRESS_INTEGRATION_SYSTEM.md";

export const AEX_CONNECTOR_METADATA_VERSION = "AEX-001-v1" as const;

export const AEX_SUPPLIER_ID = "aliexpress" as const;

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

export const AEX_CAPABILITIES = [
  "aliexpress_authentication",
  "aliexpress_connection_testing",
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

export const AEX_API_ENDPOINTS = {
  production: "https://api-sg.aliexpress.com/sync",
  sandbox: "https://api-sg.aliexpress.com/sync",
} as const;
