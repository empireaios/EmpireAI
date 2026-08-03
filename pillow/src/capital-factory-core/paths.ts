/** PILLOW-CAPFC-001 — Capital Factory Core (Q9-01). */
export const CAPITAL_FACTORY_CORE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CAPITAL_FACTORY_CORE_SYSTEM.md" as const;
export const CAPITAL_FACTORY_CORE_ID = "capital-factory-core" as const;
export const CAPFC_METADATA_VERSION = "CAPFC-001-v1" as const;
export const CAPITAL_FACTORY_REPORT_VERSION = "CAPFC-RPT-v1" as const;
export const CAPITAL_PROJECT_VERSION = "CAPFC-CP-v1" as const;
export const CAPITAL_FACTORY_VERSION = "Q9-CAPFC-v1" as const;

export const CAPITAL_FACTORY_CORE_IDENTITY = {
  workerId: "wkr-capital-factory-core-01",
  workerName: "Capital Factory Core",
  workerType: "coordinator",
  department: "capital",
  factory: "capital-factory",
  role: "role-coordinator-capital-factory-core",
  reportingLine: ["wkr-capital-factory-core-01", "pillow"] as string[],
  skillProfile: [
    "skill-capital-project-registration",
    "skill-capital-lifecycle-coordination",
    "skill-worker-orchestration",
    "skill-dependency-management",
    "skill-financial-readiness-monitoring",
    "skill-capital-allocation-tracking",
    "skill-traceability",
  ],
  approvedTools: [
    "capital_project_registry",
    "lifecycle_registry",
    "worker_role_registry",
    "structured_reporting",
  ],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "coordinating",
  "validating",
  "creating",
  "registering",
  "reporting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Capital allocation categories — extensible via config merge. */
export const CAPITAL_CATEGORIES = [
  "operating_reserves",
  "growth_allocation",
  "working_capital",
  "factory_investment",
  "emergency_buffer",
  "treasury",
  "multi_business_pool",
  "strategic_reserve",
  "unknown",
] as const;

/** Capital project lifecycle — orchestration only, never auto-invested. */
export const LIFECYCLE_STATUSES = [
  "project_registered",
  "workers_coordinated",
  "preparation",
  "readiness_review",
  "operating",
  "paused",
  "completed",
  "archived",
] as const;

export const PROJECT_STATUSES = [
  "active",
  "coordinating",
  "preparing",
  "in_readiness_review",
  "operating",
  "paused",
  "completed",
  "archived",
  "rejected",
] as const;

export const CAPITAL_STATUSES = [
  "registered",
  "allocated",
  "monitoring",
  "ready",
  "blocked",
  "paused",
  "closed",
  "unknown",
] as const;

export const WORKER_STATUSES = ["unassigned", "assigned", "ready", "blocked", "unknown"] as const;
export const READINESS_STATUSES = ["not_ready", "partial", "ready", "blocked", "unknown"] as const;
export const AUDIT_STATUSES = ["not_audited", "pending", "passed", "partial", "failed"] as const;

/**
 * Structural worker role slots for future Q9-02+ capital workers.
 * CAPFC registers these as placeholders only — it never implements the workers themselves.
 */
export const CAPITAL_WORKER_ROLES = [
  "accounting_worker",
  "forecasting_worker",
  "investment_analysis_worker",
  "capital_allocation_worker",
  "treasury_worker",
  "financial_reporting_worker",
  "risk_review_worker",
  "unknown",
] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "executive_reporting_runtime",
  "worker_recovery_system",
  "audit_runtime",
  "mission_runtime",
  "queue_runtime",
  "memory_runtime",
  "capital_factory_core_validation",
] as const;

export const CAPFC_CAPABILITIES = [
  "create_capital_projects",
  "register_capital_projects",
  "maintain_enterprise_capital_state",
  "coordinate_capital_lifecycle",
  "coordinate_workers",
  "assign_workers",
  "manage_worker_dependencies",
  "track_financial_readiness",
  "monitor_capital_allocation_status",
  "maintain_financial_metadata",
  "produce_executive_financial_summaries",
  "support_multiple_businesses_simultaneously",
  "produce_machine_readable_capital_factory_reports",
  "coordinate_downstream_capital_workers",
  "preserve_complete_financial_traceability",
  "preserve_factory_audit_history",
  "submit_through_executive_reporting_runtime",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_executive_reporting_runtime",
  "integrate_worker_recovery_system",
  "integrate_audit_runtime",
  "integrate_mission_runtime",
  "integrate_queue_runtime",
  "integrate_memory_runtime",
  "capital_factory_core_validation",
  "health_monitoring",
  "recovery_management",
  "q902_consumable_contract",
] as const;
