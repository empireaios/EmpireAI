/** PILLOW-PG-001 — Payment Gateway Integration paths (R3-02). */

export const PAYMENT_GATEWAY_INTEGRATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PAYMENT_GATEWAY_INTEGRATION_SYSTEM.md";

export const PG_METADATA_VERSION = "PG-001-v1" as const;

export const PAYMENT_GATEWAY_ID = "payment-gateway" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "authenticating",
  "active",
  "processing",
  "degraded",
  "suspended",
  "failed",
  "stopped",
] as const;

export const GATEWAY_STATES = [
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

export const PAYMENT_STATUSES = [
  "pending",
  "authorized",
  "captured",
  "cancelled",
  "failed",
  "refunded",
] as const;

export const AUTHORIZATION_STATUSES = [
  "none",
  "pending",
  "authorized",
  "declined",
  "expired",
] as const;

export const PG_CAPABILITIES = [
  "gateway_registration",
  "gateway_authentication",
  "payment_session_management",
  "payment_request_creation",
  "payment_authorization",
  "payment_capture",
  "payment_cancellation",
  "payment_webhook_handling",
  "payment_status_sync",
  "rate_limit_handling",
  "retry_handling",
  "gateway_health_monitoring",
  "diagnostics",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const PG_API_ENDPOINTS = {
  production: "https://api.payment-gateway.empireai.test/v1",
  sandbox: "https://sandbox.payment-gateway.empireai.test/v1",
} as const;
