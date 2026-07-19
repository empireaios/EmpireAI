/** PILLOW-SF-001 — Supplier Framework paths (R2-01). */

export const SUPPLIER_FRAMEWORK_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SUPPLIER_FRAMEWORK_SYSTEM.md";

export const SUPPLIER_METADATA_VERSION = "SF-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "registering",
  "active",
  "suspended",
  "shutting_down",
  "stopped",
  "failed",
] as const;

export const CONNECTOR_STATES = [
  "registered",
  "initialized",
  "active",
  "suspended",
  "shutdown",
  "failed",
] as const;

export const CONNECTOR_TYPES = ["supplier", "template", "integration"] as const;

export const AUTHENTICATION_METHODS = [
  "oauth2",
  "api_key",
  "hmac",
  "webhook_secret",
  "bearer",
  "none",
] as const;

export const FRAMEWORK_CAPABILITIES = [
  "supplier_registration",
  "supplier_initialization",
  "supplier_activation",
  "supplier_suspension",
  "supplier_shutdown",
  "supplier_event_routing",
  "supplier_data_abstraction",
  "supplier_validation",
  "supplier_metadata_generation",
  "health_monitoring",
  "recovery_handling",
  "diagnostics",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pass", "partial", "fail", "pending"] as const;
