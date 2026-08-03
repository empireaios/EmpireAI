/** PILLOW-RMX-001 — Responsibility Matrix (Q1-06). */
export const RESPONSIBILITY_MATRIX_SYSTEM_PATH =
  "docs/governance/EMPIREAI_RESPONSIBILITY_MATRIX_SYSTEM.md" as const;
export const RESPONSIBILITY_MATRIX_ID = "responsibility-matrix" as const;
export const RMX_METADATA_VERSION = "RMX-001-v1" as const;
export const MATRIX_VERSION = "RMX-MATRIX-v1" as const;

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

export const MATRIX_DECISIONS = ["valid", "partially_valid", "invalid"] as const;

export const RESPONSIBILITY_RULES = [
  "exactly_one_accountable_owner",
  "supporting_workers_optional",
  "required_inputs_defined",
  "expected_outputs_defined",
  "required_approvals_defined",
  "dependency_chain_defined",
  "escalation_path_defined",
  "quality_requirements_defined",
  "completion_criteria_defined",
  "no_responsibility_outside_matrix",
  "no_ambiguous_ownership",
] as const;

export const RMX_CAPABILITIES = [
  "define_responsibility_ownership",
  "define_primary_owner",
  "define_supporting_workers",
  "define_required_inputs",
  "define_expected_outputs",
  "define_dependencies",
  "define_required_approvals",
  "define_success_criteria",
  "define_failure_conditions",
  "define_escalation_path",
  "produce_machine_readable_responsibility_definitions",
  "register_responsibility",
  "derive_ownership",
  "validate_worker_ownership",
  "validate_inputs_outputs",
  "validate_dependencies",
  "validate_approvals",
  "preserve_auditability",
  "preserve_traceability",
  "responsibility_matrix_validation",
  "health_monitoring",
  "recovery_management",
] as const;
