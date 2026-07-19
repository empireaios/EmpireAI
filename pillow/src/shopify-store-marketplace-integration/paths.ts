/** PILLOW-SHF-001 — Shopify Store Marketplace Integration paths (R1-10). */

export const SHOPIFY_STORE_MARKETPLACE_INTEGRATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SHOPIFY_STORE_MARKETPLACE_INTEGRATION_SYSTEM.md";

export const SHOPIFY_STORE_CONNECTOR_METADATA_VERSION = "SHF-001-v1" as const;

export const SHOPIFY_STORE_MARKETPLACE_ID = "shopify" as const;

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

export const SHOPIFY_STORE_CAPABILITIES = [
  "shopify_authentication",
  "shopify_store_connection_testing",
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

/** Shopify Admin API endpoints (structural — no live HTTP in R1-10). */
export const SHOPIFY_STORE_API_ENDPOINTS = {
  production: "https://admin.shopify.com",
  sandbox: "https://admin.shopify.com",
} as const;
