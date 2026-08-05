/** PILLOW-IRPLN-001 — Implementation Recovery Planner (Q13-05). */

export const IMPLEMENTATION_RECOVERY_PLANNER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_IMPLEMENTATION_RECOVERY_PLANNER_SYSTEM.md" as const;

export const IMPLEMENTATION_RECOVERY_PLANNER_ID = "implementation-recovery-planner" as const;

export const IRPLN_METADATA_VERSION = "IRPLN-001-v1" as const;

export const IMPLEMENTATION_RECOVERY_PLANNER_REPORT_VERSION = "IRPLN-RPT-v1" as const;

export const IRPLN_MISSION_ID = "Q13-05" as const;

export const IMPLEMENTATION_RECOVERY_PLANNER_RUNTIME_VERSION = "Q13-IRPLN-v1" as const;

export const IMPLEMENTATION_RECOVERY_PLANNER_IDENTITY = {
  workerId: "wkr-implementation-recovery-planner-01",
  workerName: "Implementation Recovery Planner",
  workerType: "recovery_planning",
  department: "implementation_recovery_planner",
  factory: "implementation-recovery-planner",
  role: "role-irpln",
  reportingLine: ["wkr-implementation-recovery-planner-01", "pillow"] as string[],
  skillProfile: [
    "skill-interrupted-mission-detection",
    "skill-read-only-repository-analysis",
    "skill-specification-comparison",
    "skill-recovery-strategy-generation",
    "skill-recovery-plan-generation",
    "skill-recovery-specification-generation",
    "skill-recovery-reporting",
    "skill-q1305-contract-consumption",
    "skill-pillow-governance-integration",
  ],
  approvedTools: ["structured_reporting"],
  authorityLevel: "recovery_planning_only",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "connected",
  "active",
  "analysing",
  "planning",
  "reporting",
  "validating",
  "blocked",
  "standby",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "blocked", "standby", "failed"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby", "blocked"] as const;

export const INTERRUPTION_CLASSIFICATIONS = [
  "interrupted",
  "partial",
  "failed",
  "abandoned",
  "unknown",
] as const;

export const RECOVERY_SPEC_SECTIONS = [
  "Mission",
  "Approved specification",
  "Repository audit",
  "Completed work to preserve",
  "Partial work to extend",
  "Missing implementation",
  "Conflicts",
  "Recovery sequence",
  "Validation",
  "Acceptance",
  "Stop boundary",
] as const;

export const INTEGRATION_TARGETS = [
  "cursor_specification_generator",
  "repository_intelligence_engine",
  "implementation_specification_engine",
  "mission_planning_engine",
  "empire_knowledge_engine",
  "pillow_orchestration_runtime",
  "audit_runtime",
  "executive_reporting_runtime",
] as const;

export const IRPLN_CAPABILITIES = [
  "detect_interrupted_or_incomplete_mission",
  "analyse_current_repository_state",
  "compare_against_approved_specification",
  "detect_completed_work",
  "detect_partial_work",
  "detect_missing_implementation",
  "detect_conflicting_implementation",
  "generate_recovery_strategy",
  "generate_recovery_plan",
  "generate_recovery_specification",
  "produce_recovery_report",
  "consume_q1305_contract",
  "expose_q1306_consumable_contract",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_recovery_history",
  "never_execute_recovery",
  "never_modify_repository",
  "never_fabricate_repository_findings",
  "never_overwrite_verified_implementations",
  "never_implement_q1306_or_later",
  "never_bypass_governance",
  "recovery_planning_only",
] as const;
