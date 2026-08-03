/** PILLOW-LPW-001 — Launch Plan Worker (Q2-07). */
export const LAUNCH_PLAN_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_LAUNCH_PLAN_WORKER_SYSTEM.md" as const;
export const LAUNCH_PLAN_WORKER_ID = "launch-plan-worker" as const;
export const LPW_METADATA_VERSION = "LPW-001-v1" as const;
export const LAUNCH_PLAN_VERSION = "LPW-PLN-v1" as const;

export const LAUNCH_PLAN_WORKER_IDENTITY = {
  workerId: "wkr-launch-plan-01",
  workerName: "Launch Plan Worker",
  workerType: "planner",
  department: "strategy",
  factory: "empire-builder-factory",
  role: "role-planner-launch-plan",
  reportingLine: ["wkr-launch-plan-01", "pillow"] as string[],
  skillProfile: [
    "skill-launch-planning",
    "skill-dependency-mapping",
    "skill-milestone-planning",
    "skill-approval-checkpoint-design",
  ],
  approvedTools: ["launch_plan_composer", "evidence_ledger", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "planning",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const BUSINESS_TYPES = [
  "media",
  "commerce",
  "local_cleaning",
  "affiliate",
  "digital_product",
  "local_services",
  "saas",
  "agency",
  "unknown",
] as const;

/** Stage catalog — workers select a subset derived from the blueprint. */
export const LAUNCH_STAGE_CATALOG = [
  "preparation",
  "business_setup",
  "asset_creation",
  "integration",
  "testing",
  "approval",
  "soft_launch",
  "production_launch",
  "post_launch_validation",
] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "business_blueprint_worker",
  "mission_coordination_engine",
  "approval_router",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const LPW_CAPABILITIES = [
  "receive_approved_business_blueprint",
  "identify_launch_stages",
  "define_launch_milestones",
  "define_required_tasks_per_stage",
  "define_dependencies_between_tasks_and_stages",
  "define_required_workers_and_workforce_categories",
  "define_required_tools_and_integrations",
  "define_approval_checkpoints",
  "define_validation_checkpoints",
  "define_launch_blockers_and_prerequisites",
  "define_rollback_and_pause_conditions",
  "produce_machine_readable_launch_plan",
  "preserve_traceability_to_business_blueprint",
  "preserve_approved_business_decisions",
  "define_explicit_dependencies",
  "define_measurable_milestones",
  "identify_missing_prerequisites",
  "submit_through_executive_reporting_runtime",
  "preserve_full_audit_history",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_mission_coordination_engine",
  "integrate_approval_router",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "launch_plan_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
