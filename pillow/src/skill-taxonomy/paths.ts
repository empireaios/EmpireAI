/** PILLOW-STX-001 — Skill Taxonomy (Q1-04). */
export const SKILL_TAXONOMY_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SKILL_TAXONOMY_SYSTEM.md" as const;
export const SKILL_TAXONOMY_ID = "skill-taxonomy" as const;
export const STX_METADATA_VERSION = "STX-001-v1" as const;
export const TAXONOMY_VERSION = "STX-TAX-v1" as const;

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
 * Minimum skill categories (Q1-04).
 * Architecture allows additional categories via configuration without redesign.
 */
export const SKILL_CATEGORIES = [
  "executive",
  "business",
  "commerce",
  "media",
  "engineering",
  "finance",
  "operations",
  "marketing",
  "research",
  "customer_support",
  "analytics",
  "security",
] as const;

/**
 * Minimum proficiency levels (Q1-04).
 * Architecture allows additional levels via configuration without redesign.
 */
export const PROFICIENCY_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
  "master",
] as const;

export const TAXONOMY_DECISIONS = ["valid", "partially_valid", "invalid"] as const;

export const SKILL_RULES = [
  "exactly_one_skill_category",
  "purpose_defined",
  "required_knowledge_defined",
  "required_tools_defined",
  "validation_method_defined",
  "dependencies_defined",
  "capability_limits_defined",
  "certification_requirements_defined",
  "proficiency_level_valid",
  "inherits_from_valid_parent",
] as const;

export const STX_CAPABILITIES = [
  "define_skill_categories",
  "define_individual_skills",
  "define_skill_hierarchy",
  "define_skill_inheritance",
  "define_proficiency_levels",
  "define_required_tools",
  "define_capability_limits",
  "define_skill_prerequisites",
  "define_skill_validation_rules",
  "define_skill_certification_requirements",
  "produce_machine_readable_skill_definitions",
  "register_skill",
  "derive_worker_skills",
  "validate_skill_hierarchy",
  "validate_proficiency_levels",
  "extensible_skill_categories",
  "extensible_proficiency_levels",
  "preserve_auditability",
  "preserve_traceability",
  "skill_taxonomy_validation",
  "health_monitoring",
  "recovery_management",
] as const;
