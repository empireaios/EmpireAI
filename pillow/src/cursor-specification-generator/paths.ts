/** PILLOW-CSGEN-001 — Cursor Specification Generator (Q13-04). */

export const CURSOR_SPECIFICATION_GENERATOR_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CURSOR_SPECIFICATION_GENERATOR_SYSTEM.md" as const;

export const CURSOR_SPECIFICATION_GENERATOR_ID = "cursor-specification-generator" as const;

export const CSGEN_METADATA_VERSION = "CSGEN-001-v1" as const;

export const CURSOR_SPECIFICATION_GENERATOR_REPORT_VERSION = "CSGEN-RPT-v1" as const;

export const CSGEN_MISSION_ID = "Q13-04" as const;

export const CURSOR_SPECIFICATION_GENERATOR_RUNTIME_VERSION = "Q13-CSGEN-v1" as const;

export const CURSOR_SPECIFICATION_GENERATOR_IDENTITY = {
  workerId: "wkr-cursor-specification-generator-01",
  workerName: "Cursor Specification Generator",
  workerType: "specification",
  department: "cursor_specification_generator",
  factory: "cursor-specification-generator",
  role: "role-cursor-spec",
  reportingLine: ["wkr-cursor-specification-generator-01", "pillow"] as string[],
  skillProfile: [
    "skill-mission-consumption",
    "skill-repository-intelligence-consumption",
    "skill-mission-planning-consumption",
    "skill-implementation-specification-consumption",
    "skill-cursor-specification-generation",
    "skill-constitutional-body-formatting",
    "skill-boundary-validation",
    "skill-governance-validation",
    "skill-completeness-validation",
    "skill-pillow-governance-integration",
    "skill-cursor-specification-reporting",
  ],
  approvedTools: ["structured_reporting"],
  authorityLevel: "specification_only",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "connected",
  "active",
  "generating",
  "reporting",
  "validating",
  "blocked",
  "standby",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "blocked", "standby", "failed"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby", "blocked"] as const;

export const CONSTITUTIONAL_SECTIONS = [
  "Mission",
  "Source of truth",
  "Roadmap row",
  "Implement ONLY this mission",
  "Repository audit",
  "Objective",
  "Required capabilities",
  "Supported features",
  "Model/schema",
  "Report schema",
  "Mandatory rules",
  "Boundaries",
  "Architecture",
  "Implementation rules",
  "Validation",
  "Mission completion",
  "Stop before next mission",
] as const;

export const INTEGRATION_TARGETS = [
  "mission_planning_engine",
  "repository_intelligence_engine",
  "implementation_specification_engine",
  "empire_knowledge_engine",
  "approval_runtime",
  "grand_king_acceptance_gate",
  "pillow_orchestration_runtime",
  "audit_runtime",
  "executive_reporting_runtime",
  "intelligence_context",
] as const;

export const CSGEN_CAPABILITIES = [
  "consume_approved_roadmap_mission",
  "consume_repository_intelligence",
  "consume_mission_planning",
  "consume_implementation_specification",
  "generate_cursor_specification",
  "validate_boundaries",
  "validate_governance",
  "validate_completeness",
  "produce_cursor_specification_report",
  "consume_q1304_contract",
  "expose_q1305_consumable_contract",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_specification_history",
  "never_implement_code",
  "never_execute_cursor_missions",
  "never_fabricate_repository_findings",
  "never_invent_missions",
  "never_implement_q1305_or_later",
  "never_self_approve",
  "never_bypass_governance",
  "specification_only",
] as const;
