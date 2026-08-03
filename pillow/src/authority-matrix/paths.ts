/** PILLOW-AMX-001 — Authority Matrix (Q1-05). */
export const AUTHORITY_MATRIX_SYSTEM_PATH =
  "docs/governance/EMPIREAI_AUTHORITY_MATRIX_SYSTEM.md" as const;
export const AUTHORITY_MATRIX_ID = "authority-matrix" as const;
export const AMX_METADATA_VERSION = "AMX-001-v1" as const;
export const MATRIX_VERSION = "AMX-MATRIX-v1" as const;

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
 * Minimum authority levels (Q1-05).
 * Architecture allows additional levels via configuration without redesign.
 */
export const AUTHORITY_LEVELS = [
  "autonomous_worker_decision",
  "manager_approval",
  "department_approval",
  "factory_approval",
  "pillow_approval",
  "grand_king_approval",
] as const;

/**
 * Example decision categories (Q1-05).
 * Architecture allows additional categories via configuration without redesign.
 */
export const DECISION_CATEGORIES = [
  "information_retrieval",
  "planning",
  "business_operations",
  "financial_decisions",
  "marketplace_actions",
  "media_publishing",
  "infrastructure_changes",
  "security",
  "data_management",
  "customer_communications",
  "external_integrations",
] as const;

export const RISK_CLASSIFICATIONS = ["low", "medium", "high", "critical"] as const;

export const MATRIX_DECISIONS = ["valid", "partially_valid", "invalid"] as const;

export const AUTHORITY_RULES = [
  "who_may_perform_defined",
  "approval_required_defined",
  "maximum_authority_defined",
  "escalation_path_defined",
  "risk_level_defined",
  "audit_requirements_defined",
  "required_approval_valid",
  "no_bypass_authority_matrix",
  "inherits_from_valid_parent",
  "pillow_executive_authority",
  "grand_king_supreme_authority",
] as const;

export const AMX_CAPABILITIES = [
  "define_decision_authority_levels",
  "define_worker_authority",
  "define_manager_authority",
  "define_department_authority",
  "define_factory_authority",
  "define_pillow_authority",
  "define_grand_king_authority",
  "define_approval_requirements",
  "define_escalation_thresholds",
  "define_authority_inheritance",
  "produce_machine_readable_authority_definitions",
  "register_authority_rule",
  "validate_worker_authority",
  "validate_pillow_authority",
  "validate_grand_king_authority",
  "validate_approval_routing",
  "extensible_authority_levels",
  "extensible_decision_categories",
  "preserve_auditability",
  "preserve_traceability",
  "authority_matrix_validation",
  "health_monitoring",
  "recovery_management",
] as const;
