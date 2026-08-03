/** PILLOW-WFC-001 — Workforce Factory Certification (Q1-13). */
export const WORKFORCE_FACTORY_CERTIFICATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WORKFORCE_FACTORY_CERTIFICATION_SYSTEM.md" as const;
export const WORKFORCE_FACTORY_CERTIFICATION_ID = "workforce-factory-certification" as const;
export const WFC_METADATA_VERSION = "WFC-001-v1" as const;
export const WORKFORCE_FACTORY_VERSION = "Q1-WFF-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "certifying",
  "assessing",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Final certification levels (Q1-13).
 * Architecture allows additional levels via configuration without redesign.
 */
export const CERTIFICATION_LEVELS = [
  "certified",
  "certified_with_warnings",
  "provisionally_certified",
  "failed_certification",
] as const;

/**
 * Mandatory Workforce Factory Foundation components (Q1-01 … Q1-12).
 */
export const WORKFORCE_FACTORY_COMPONENTS = [
  { id: "worker-constitution", label: "Worker Constitution", missionId: "Q1-01" },
  { id: "organization-charter", label: "Organization Charter", missionId: "Q1-02" },
  { id: "role-taxonomy", label: "Role Taxonomy", missionId: "Q1-03" },
  { id: "skill-taxonomy", label: "Skill Taxonomy", missionId: "Q1-04" },
  { id: "authority-matrix", label: "Authority Matrix", missionId: "Q1-05" },
  { id: "responsibility-matrix", label: "Responsibility Matrix", missionId: "Q1-06" },
  { id: "worker-registry", label: "Worker Registry", missionId: "Q1-07" },
  { id: "worker-lifecycle", label: "Worker Lifecycle", missionId: "Q1-08" },
  { id: "worker-assignment-engine", label: "Worker Assignment Engine", missionId: "Q1-09" },
  { id: "worker-monitoring", label: "Worker Monitoring", missionId: "Q1-10" },
  { id: "worker-performance-review", label: "Worker Performance Review", missionId: "Q1-11" },
  { id: "worker-recovery-system", label: "Worker Recovery System", missionId: "Q1-12" },
] as const;

/**
 * Final acceptance integration domains (Q1-13).
 */
export const INTEGRATION_DOMAINS = [
  "constitution_and_charter",
  "role_and_skill_taxonomy",
  "authority_and_responsibility",
  "registry_and_lifecycle",
  "assignment_and_monitoring",
  "performance_and_recovery",
  "cross_component_integration",
  "pillow_governance",
  "workforce_readiness",
] as const;

/**
 * Mandatory worker governance validations (Q1-13).
 */
export const WORKFORCE_GOVERNANCE_RULES = [
  "every_worker_can_be_registered",
  "every_worker_follows_worker_constitution",
  "every_worker_belongs_to_organization_charter",
  "every_worker_inherits_a_role",
  "every_worker_inherits_skills",
  "every_worker_respects_authority_matrix",
  "every_worker_respects_responsibility_matrix",
  "every_worker_follows_worker_lifecycle",
  "every_worker_can_be_assigned",
  "every_worker_can_be_monitored",
  "every_worker_can_be_performance_reviewed",
  "every_worker_can_be_recovered",
  "every_worker_remains_fully_governed_by_pillow",
] as const;

export const COMPONENT_PROBE_RESULTS = ["pass", "warning", "fail"] as const;

export const WFC_CAPABILITIES = [
  "verify_worker_constitution",
  "verify_organization_charter",
  "verify_role_taxonomy",
  "verify_skill_taxonomy",
  "verify_authority_matrix",
  "verify_responsibility_matrix",
  "verify_worker_registry",
  "verify_worker_lifecycle",
  "verify_worker_assignment_engine",
  "verify_worker_monitoring",
  "verify_worker_performance_review",
  "verify_worker_recovery_system",
  "verify_cross_component_integration",
  "verify_pillow_governance",
  "verify_workforce_readiness",
  "produce_unified_workforce_factory_certification_report",
  "assess_workforce_readiness",
  "determine_q1_production_readiness",
  "confirm_readiness_for_q2",
  "extensible_certification_levels",
  "extensible_integration_domains",
  "preserve_auditability",
  "preserve_traceability",
  "workforce_factory_certification_validation",
  "health_monitoring",
  "recovery_management",
] as const;
