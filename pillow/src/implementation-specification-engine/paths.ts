/** PILLOW-ISENG-001 — Implementation Specification Engine (Q13-01). */

export const IMPLEMENTATION_SPECIFICATION_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_IMPLEMENTATION_SPECIFICATION_ENGINE_SYSTEM.md" as const;

export const IMPLEMENTATION_SPECIFICATION_ENGINE_ID = "implementation-specification-engine" as const;

export const ISENG_METADATA_VERSION = "ISENG-001-v1" as const;
export const IMPLEMENTATION_SPECIFICATION_REPORT_VERSION = "ISENG-RPT-v1" as const;
export const ISENG_MISSION_ID = "Q13-01" as const;
export const IMPLEMENTATION_SPECIFICATION_RUNTIME_VERSION = "Q13-ISENG-v1" as const;

export const IMPLEMENTATION_SPECIFICATION_ENGINE_IDENTITY = {
  workerId: "wkr-implementation-specification-engine-01",
  workerName: "Implementation Specification Engine",
  workerType: "specification",
  department: "implementation_specification_engine",
  factory: "implementation-specification-engine",
  role: "role-specification-architect",
  reportingLine: ["wkr-implementation-specification-engine-01", "pillow"] as string[],
  skillProfile: [
    "skill-roadmap-mission-parsing",
    "skill-repository-architecture-analysis",
    "skill-dependency-discovery",
    "skill-preservation-detection",
    "skill-specification-generation",
    "skill-specification-history-preservation",
    "skill-pillow-governance-integration",
    "skill-implementation-specification-reporting",
  ],
  approvedTools: ["injected_evidence_only", "read_only_repository_scan", "structured_reporting"],
  authorityLevel: "specification_only",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "parsing",
  "analysing",
  "discovering",
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

export const INTEGRATION_TARGETS = [
  "ai_innovation_factory",
  "q_series_completion",
  "intelligence_context",
  "shared_runtime_core",
  "worker_registry",
  "pillow_orchestration_runtime",
  "audit_runtime",
  "executive_reporting_runtime",
] as const;

/** Known read-only scan roots for deterministic local architecture evidence. */
export const KNOWN_SCAN_ROOTS = [
  "pillow/src",
  "backend/src",
  "config",
] as const;

export const ISENG_CAPABILITIES = [
  "parse_approved_roadmap_mission",
  "analyse_repository_architecture",
  "discover_implementation_dependencies",
  "detect_existing_implementations_to_preserve",
  "generate_implementation_specification",
  "produce_implementation_specification_report",
  "consume_q1301_consumable_contract",
  "expose_q1302_consumable_contract",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_specification_history",
  "never_fabricate_repository_state",
  "never_overwrite_verified_implementations",
  "never_execute_implementations",
  "never_auto_deploy",
  "never_bypass_governance",
  "never_override_grand_king",
  "never_override_pillow",
  "never_implement_q1302_or_later",
  "deterministic_specification_behaviour",
  "evidence_based_only",
  "governed_specification_only",
] as const;
