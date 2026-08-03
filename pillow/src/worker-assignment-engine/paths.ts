/** PILLOW-WAE-001 — Worker Assignment Engine (Q1-09). */
export const WORKER_ASSIGNMENT_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WORKER_ASSIGNMENT_ENGINE_SYSTEM.md" as const;
export const WORKER_ASSIGNMENT_ENGINE_ID = "worker-assignment-engine" as const;
export const WAE_METADATA_VERSION = "WAE-001-v1" as const;
export const ASSIGNMENT_VERSION = "WAE-ASN-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "evaluating",
  "recommending",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Minimum assignment factors (Q1-09).
 * Architecture allows additional factors via configuration without redesign.
 */
export const ASSIGNMENT_FACTORS = [
  "skills",
  "certification",
  "availability",
  "current_workload",
  "authority",
  "required_tools",
  "dependencies",
  "risk",
  "cost",
  "historical_performance",
] as const;

export const ASSIGNMENT_DECISIONS = ["valid", "partially_valid", "invalid"] as const;

export const ASSIGNMENT_RULES = [
  "never_assign_uncertified_workers",
  "never_assign_unavailable_workers",
  "never_exceed_worker_authority",
  "never_violate_authority_matrix",
  "respect_responsibility_matrix",
  "respect_worker_lifecycle_status",
  "respect_worker_certification_status",
] as const;

/** Lifecycle states considered available for assignment. */
export const ASSIGNABLE_LIFECYCLE_STATES = ["active", "idle", "busy"] as const;

export const AUTHORITY_RANK = [
  "autonomous_worker_decision",
  "manager_approval",
  "department_approval",
  "factory_approval",
  "pillow_approval",
  "grand_king_approval",
] as const;

export const WAE_CAPABILITIES = [
  "receive_mission_requirements",
  "discover_eligible_workers",
  "evaluate_worker_skills",
  "evaluate_worker_certification_status",
  "evaluate_worker_availability",
  "evaluate_worker_workload",
  "evaluate_authority_level",
  "evaluate_required_tools",
  "evaluate_dependencies",
  "evaluate_execution_risk",
  "evaluate_execution_cost",
  "recommend_primary_worker",
  "recommend_supporting_workers",
  "produce_machine_readable_assignment_records",
  "extensible_assignment_factors",
  "worker_assignment_validation",
  "health_monitoring",
  "recovery_management",
] as const;
