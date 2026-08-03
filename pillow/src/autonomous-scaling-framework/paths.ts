/** PILLOW-ASF-001 — Autonomous Scaling Framework paths (X3-01). */

export const AUTONOMOUS_SCALING_FRAMEWORK_SYSTEM_PATH =
  "docs/governance/EMPIREAI_AUTONOMOUS_SCALING_FRAMEWORK_SYSTEM.md";

export const ASF_METADATA_VERSION = "ASF-001-v1" as const;

export const AUTONOMOUS_SCALING_FRAMEWORK_ID = "autonomous-scaling-framework" as const;

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

export const MODULE_TYPES = ["scaling", "template", "integration"] as const;

export const FRAMEWORK_CAPABILITIES = [
  "scaling_module_registration",
  "scaling_lifecycle_management",
  "scaling_event_routing",
  "scaling_data_abstraction",
  "scaling_validation",
  "scaling_metadata_generation",
  "health_monitoring",
  "recovery_handling",
  "diagnostics",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pass", "partial", "fail", "pending"] as const;
