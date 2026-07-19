/** PILLOW-MFW-001 — Marketing Framework paths (R5-01). */

export const MARKETING_FRAMEWORK_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MARKETING_FRAMEWORK_SYSTEM.md";

export const MARKETING_METADATA_VERSION = "MFW-001-v1" as const;

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

export const MODULE_TYPES = ["marketing", "template", "integration"] as const;

export const AUTHENTICATION_METHODS = [
  "oauth2",
  "api_key",
  "hmac",
  "webhook_secret",
  "bearer",
  "none",
] as const;

export const FRAMEWORK_CAPABILITIES = [
  "marketing_module_registration",
  "marketing_module_initialization",
  "marketing_module_activation",
  "marketing_module_suspension",
  "marketing_module_shutdown",
  "marketing_event_routing",
  "marketing_data_abstraction",
  "marketing_validation",
  "marketing_metadata_generation",
  "health_monitoring",
  "recovery_handling",
  "diagnostics",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pass", "partial", "fail", "pending"] as const;
