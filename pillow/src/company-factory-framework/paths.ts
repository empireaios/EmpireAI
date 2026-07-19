/** PILLOW-CFF-001 — Company Factory Framework paths (X1-01). */

export const COMPANY_FACTORY_FRAMEWORK_SYSTEM_PATH =
  "docs/governance/EMPIREAI_COMPANY_FACTORY_FRAMEWORK_SYSTEM.md";

export const COMPANY_FACTORY_METADATA_VERSION = "CFF-001-v1" as const;

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

export const MODULE_TYPES = ["company", "template", "integration"] as const;

export const AUTHENTICATION_METHODS = [
  "oauth2",
  "api_key",
  "hmac",
  "webhook_secret",
  "bearer",
  "none",
] as const;

export const FRAMEWORK_CAPABILITIES = [
  "company_module_registration",
  "company_module_initialization",
  "company_module_activation",
  "company_module_suspension",
  "company_module_shutdown",
  "company_event_routing",
  "company_data_abstraction",
  "company_validation",
  "company_metadata_generation",
  "health_monitoring",
  "recovery_handling",
  "diagnostics",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pass", "partial", "fail", "pending"] as const;
