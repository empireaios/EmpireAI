/** PILLOW-FF-001 — Financial Framework paths (R3-01). */

export const FINANCIAL_FRAMEWORK_SYSTEM_PATH =
  "docs/governance/EMPIREAI_FINANCIAL_FRAMEWORK_SYSTEM.md";

export const FINANCIAL_METADATA_VERSION = "FF-001-v1" as const;

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

export const MODULE_STATES = [
  "registered",
  "initialized",
  "active",
  "suspended",
  "shutdown",
  "failed",
] as const;

export const MODULE_TYPES = ["financial", "template", "integration"] as const;

export const AUTHENTICATION_METHODS = [
  "oauth2",
  "api_key",
  "hmac",
  "webhook_secret",
  "bearer",
  "none",
] as const;

export const FRAMEWORK_CAPABILITIES = [
  "financial_module_registration",
  "financial_module_initialization",
  "financial_module_activation",
  "financial_module_suspension",
  "financial_module_shutdown",
  "financial_event_routing",
  "financial_data_abstraction",
  "financial_validation",
  "financial_metadata_generation",
  "health_monitoring",
  "recovery_handling",
  "diagnostics",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pass", "partial", "fail", "pending"] as const;
