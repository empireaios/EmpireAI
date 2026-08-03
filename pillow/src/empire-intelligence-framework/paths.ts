/** PILLOW-EIF-001 — Empire Intelligence Framework paths (X5-01). */
export const EMPIRE_INTELLIGENCE_FRAMEWORK_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EMPIRE_INTELLIGENCE_FRAMEWORK_SYSTEM.md";
export const EIF_METADATA_VERSION = "EIF-001-v1" as const;
export const EMPIRE_INTELLIGENCE_FRAMEWORK_ID = "empire-intelligence-framework" as const;
export const ENGINE_STATUSES = ["idle", "initializing", "active", "suspended", "stopped", "failed"] as const;
export const MODULE_STATES = ["registered", "initialized", "active", "suspended", "shutdown", "failed"] as const;
export const MODULE_TYPES = ["intelligence", "template", "integration"] as const;
export const FRAMEWORK_CAPABILITIES = [
  "empire_intelligence_module_registration", "enterprise_intelligence_lifecycle_management",
  "standardized_intelligence_interfaces", "empire_intelligence_event_routing",
  "enterprise_intelligence_metadata_management", "cross_company_intelligence_coordination",
  "empire_intelligence_validation", "health_monitoring", "recovery_handling", "diagnostics",
] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const VALIDATION_STATUSES = ["pass", "partial", "fail", "pending"] as const;
