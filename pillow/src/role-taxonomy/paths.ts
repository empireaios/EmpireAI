/** PILLOW-RTX-001 — Role Taxonomy (Q1-03). */
export const ROLE_TAXONOMY_SYSTEM_PATH =
  "docs/governance/EMPIREAI_ROLE_TAXONOMY_SYSTEM.md" as const;
export const ROLE_TAXONOMY_ID = "role-taxonomy" as const;
export const RTX_METADATA_VERSION = "RTX-001-v1" as const;
export const TAXONOMY_VERSION = "RTX-TAX-v1" as const;

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

/**
 * Mandatory role categories (Q1-03).
 * Architecture allows additional categories via configuration without redesign.
 */
export const ROLE_CATEGORIES = [
  "executive",
  "director",
  "manager",
  "lead",
  "specialist",
  "reviewer",
  "analyst",
  "coordinator",
  "support",
  "system",
] as const;

export const ROLE_KINDS = [
  "standard",
  "temporary",
  "shared",
  "cross_functional",
] as const;

export const TAXONOMY_DECISIONS = ["valid", "partially_valid", "invalid"] as const;

export const ROLE_RULES = [
  "exactly_one_role_category",
  "purpose_defined",
  "responsibilities_defined",
  "decision_authority_defined",
  "escalation_authority_defined",
  "reporting_structure_defined",
  "required_skills_defined",
  "quality_standard_required",
  "governance_rules_required",
  "inherits_from_valid_parent",
] as const;

export const RTX_CAPABILITIES = [
  "define_worker_role_categories",
  "define_executive_roles",
  "define_manager_roles",
  "define_specialist_roles",
  "define_reviewer_roles",
  "define_support_roles",
  "define_temporary_roles",
  "define_shared_roles",
  "define_cross_functional_roles",
  "define_role_inheritance",
  "define_role_responsibilities",
  "define_role_authority",
  "define_role_collaboration_rules",
  "produce_machine_readable_role_definitions",
  "register_role",
  "inherit_role",
  "validate_role_reporting",
  "validate_role_inheritance",
  "extensible_role_categories",
  "preserve_auditability",
  "preserve_traceability",
  "role_taxonomy_validation",
  "health_monitoring",
  "recovery_management",
] as const;
