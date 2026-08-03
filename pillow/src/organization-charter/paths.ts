/** PILLOW-OCH-001 — Organization Charter (Q1-02). */
export const ORGANIZATION_CHARTER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_ORGANIZATION_CHARTER_SYSTEM.md" as const;
export const ORGANIZATION_CHARTER_ID = "organization-charter" as const;
export const OCH_METADATA_VERSION = "OCH-001-v1" as const;
export const CHARTER_VERSION = "OCH-CHARTER-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "defining",
  "registering",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const AUTHORITY_LEVELS = ["pillow", "factory", "department", "worker"] as const;

export const STRUCTURE_DECISIONS = ["valid", "partially_valid", "invalid"] as const;

/**
 * Mandatory organizational rules (Q1-02).
 * Architecture allows additional rules via configuration without redesign.
 */
export const ORGANIZATIONAL_RULES = [
  "pillow_supreme_executive_authority",
  "worker_belongs_to_exactly_one_department",
  "department_belongs_to_one_factory",
  "factory_reports_to_pillow",
  "worker_has_reporting_chain",
  "responsibility_has_owner",
  "escalation_reaches_pillow",
  "no_worker_outside_organization",
] as const;

export const OCH_CAPABILITIES = [
  "define_organizational_hierarchy",
  "define_executive_authority",
  "define_departments",
  "define_factories",
  "define_reporting_lines",
  "define_worker_ownership",
  "define_department_responsibilities",
  "define_factory_responsibilities",
  "define_cross_department_collaboration_rules",
  "define_escalation_hierarchy",
  "define_organizational_governance",
  "produce_machine_readable_organizational_structure",
  "register_department",
  "register_factory",
  "register_worker_ownership",
  "validate_reporting_hierarchy",
  "validate_escalation_hierarchy",
  "extensible_departments_and_factories",
  "preserve_auditability",
  "preserve_traceability",
  "organization_charter_validation",
  "health_monitoring",
  "recovery_management",
] as const;
