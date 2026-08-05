/** PILLOW-MPENG-001 — Mission Planning Engine (Q13-03). */

export const MISSION_PLANNING_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MISSION_PLANNING_ENGINE_SYSTEM.md" as const;

export const MISSION_PLANNING_ENGINE_ID = "mission-planning-engine" as const;

export const MPENG_METADATA_VERSION = "MPENG-001-v1" as const;

export const MISSION_PLANNING_ENGINE_REPORT_VERSION = "MPENG-RPT-v1" as const;

export const MPENG_MISSION_ID = "Q13-03" as const;

export const MISSION_PLANNING_ENGINE_RUNTIME_VERSION = "Q13-MPENG-v1" as const;

export const MISSION_PLANNING_ENGINE_IDENTITY = {
  workerId: "wkr-mission-planning-engine-01",
  workerName: "Mission Planning Engine",
  workerType: "planning",
  department: "mission_planning_engine",
  factory: "mission-planning-engine",
  role: "role-mission-plan",
  reportingLine: ["wkr-mission-planning-engine-01", "pillow"] as string[],
  skillProfile: [
    "skill-mission-analysis",
    "skill-repository-intelligence-consumption",
    "skill-dependency-identification",
    "skill-execution-sequencing",
    "skill-integration-point-mapping",
    "skill-validation-strategy",
    "skill-acceptance-criteria",
    "skill-risk-estimation",
    "skill-mission-plan-generation",
    "skill-pillow-governance-integration",
    "skill-mission-planning-reporting",
  ],
  approvedTools: ["structured_reporting"],
  authorityLevel: "planning_only",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "connected",
  "active",
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

export const EXECUTION_STEP_IDS = [
  "parse_mission",
  "preserve_existing",
  "scaffold",
  "integrate",
  "validate",
  "accept",
] as const;

export const INTEGRATION_TARGETS = [
  "repository_intelligence_engine",
  "implementation_specification_engine",
  "intelligence_context",
  "audit_runtime",
  "executive_reporting_runtime",
  "pillow_orchestration_runtime",
  "empire_knowledge_engine",
] as const;

export const MPENG_CAPABILITIES = [
  "analyse_approved_mission",
  "consume_repository_intelligence",
  "identify_implementation_dependencies",
  "determine_execution_sequence",
  "identify_integration_points",
  "produce_validation_strategy",
  "produce_acceptance_criteria",
  "estimate_implementation_risks",
  "generate_mission_plan",
  "produce_mission_planning_report",
  "consume_q1303_contract",
  "consume_q1302_observation",
  "expose_q1304_consumable_contract",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_planning_history",
  "never_modify_repository",
  "never_execute_implementation",
  "never_fabricate_repository_state",
  "never_implement_q1304_or_later",
  "never_bypass_governance",
  "planning_only",
] as const;
