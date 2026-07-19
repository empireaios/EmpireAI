/** PILLOW-WOO-001 — WooCommerce Marketplace Integration paths (R1-11). */

export const WOOCOMMERCE_MARKETPLACE_INTEGRATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WOOCOMMERCE_MARKETPLACE_INTEGRATION_SYSTEM.md";

export const WOOCOMMERCE_CONNECTOR_METADATA_VERSION = "WOO-001-v1" as const;

export const WOOCOMMERCE_MARKETPLACE_ID = "woocommerce" as const;

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

export const WOOCOMMERCE_CAPABILITIES = [
  "woocommerce_authentication",
  "woocommerce_store_connection_testing",
  "api_request_routing",
  "api_response_normalization",
  "webhook_processing",
  "rate_limit_handling",
  "retry_handling",
  "connector_health_monitoring",
  "diagnostics",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** WooCommerce REST API endpoints (structural — no live HTTP in R1-11). */
export const WOOCOMMERCE_API_ENDPOINTS = {
  production: "https://wordpress.example",
  sandbox: "https://wordpress.example",
} as const;
