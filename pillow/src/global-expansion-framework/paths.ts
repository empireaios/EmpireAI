/** PILLOW-GEF-001 — Global Expansion Framework paths (X4-01). */

export const GLOBAL_EXPANSION_FRAMEWORK_SYSTEM_PATH =
  "docs/governance/EMPIREAI_GLOBAL_EXPANSION_FRAMEWORK_SYSTEM.md";

export const GEF_METADATA_VERSION = "GEF-001-v1" as const;

export const GLOBAL_EXPANSION_FRAMEWORK_ID = "global-expansion-framework" as const;

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

export const MODULE_TYPES = [
  "expansion",
  "template",
  "integration",
] as const;

export const FRAMEWORK_CAPABILITIES = [
  "global_expansion_module_registration",
  "international_expansion_lifecycle_management",
  "global_expansion_event_routing",
  "regional_data_abstraction",
  "global_expansion_validation",
  "global_metadata_generation",
  "health_monitoring",
  "recovery_handling",
  "diagnostics",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pass", "partial", "fail", "pending"] as const;
