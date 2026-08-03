/** PILLOW-EPF-001 — Enterprise Portfolio Framework paths (X2-01). */

export const ENTERPRISE_PORTFOLIO_FRAMEWORK_SYSTEM_PATH =
  "docs/governance/EMPIREAI_ENTERPRISE_PORTFOLIO_FRAMEWORK_SYSTEM.md";

export const EPF_METADATA_VERSION = "EPF-001-v1" as const;

export const ENTERPRISE_PORTFOLIO_FRAMEWORK_ID = "enterprise-portfolio-framework" as const;

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

export const MODULE_TYPES = ["portfolio", "template", "integration"] as const;

export const FRAMEWORK_CAPABILITIES = [
  "portfolio_module_registration",
  "company_registration",
  "portfolio_lifecycle_management",
  "portfolio_event_routing",
  "portfolio_data_abstraction",
  "portfolio_validation",
  "portfolio_metadata_generation",
  "health_monitoring",
  "recovery_handling",
  "diagnostics",
] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const VALIDATION_STATUSES = ["pass", "partial", "fail", "pending"] as const;
