/** PILLOW-BI-001 — Banking Integration paths (R3-03). */

export const BANKING_INTEGRATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_BANKING_INTEGRATION_SYSTEM.md";

export const BI_METADATA_VERSION = "BI-001-v1" as const;

export const BANKING_INTEGRATION_ID = "banking-integration" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "authenticating",
  "active",
  "synchronizing",
  "degraded",
  "suspended",
  "failed",
  "stopped",
] as const;

export const INTEGRATION_STATES = [
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

export const SYNC_STATUSES = [
  "pending",
  "in_progress",
  "synchronized",
  "partial",
  "failed",
] as const;

export const ACCOUNT_TYPES = ["checking", "savings", "business", "operating"] as const;

export const BI_CAPABILITIES = [
  "banking_provider_registration",
  "banking_authentication",
  "banking_session_management",
  "bank_account_synchronization",
  "account_balance_synchronization",
  "transaction_history_synchronization",
  "banking_notification_handling",
  "sync_failure_detection",
  "rate_limit_handling",
  "retry_handling",
  "banking_health_monitoring",
  "diagnostics",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const BI_API_ENDPOINTS = {
  production: "https://api.banking.empireai.test/v1",
  sandbox: "https://sandbox.banking.empireai.test/v1",
} as const;
