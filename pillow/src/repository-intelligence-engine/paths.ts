/** PILLOW-RIENG-001 — Repository Intelligence Engine (Q13-02). */

export const REPOSITORY_INTELLIGENCE_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_REPOSITORY_INTELLIGENCE_ENGINE_SYSTEM.md" as const;

export const REPOSITORY_INTELLIGENCE_ENGINE_ID = "repository-intelligence-engine" as const;

export const RIENG_METADATA_VERSION = "RIENG-001-v1" as const;

export const REPOSITORY_INTELLIGENCE_ENGINE_REPORT_VERSION = "RIENG-RPT-v1" as const;

export const RIENG_MISSION_ID = "Q13-02" as const;

export const REPOSITORY_INTELLIGENCE_ENGINE_RUNTIME_VERSION = "Q13-RIENG-v1" as const;

export const REPOSITORY_INTELLIGENCE_ENGINE_IDENTITY = {
  workerId: "wkr-repository-intelligence-engine-01",
  workerName: "Repository Intelligence Engine",
  workerType: "analysis",
  department: "repository_intelligence_engine",
  factory: "repository-intelligence-engine",
  role: "role-repository-analyze",
  reportingLine: ["wkr-repository-intelligence-engine-01", "pillow"] as string[],
  skillProfile: [
    "skill-repository-structure-discovery",
    "skill-module-service-inventory",
    "skill-dependency-graph-analysis",
    "skill-architecture-boundary-detection",
    "skill-implementation-detection",
    "skill-reuse-conflict-detection",
    "skill-technical-debt-analysis",
    "skill-repository-fingerprinting",
    "skill-immutable-knowledge-history",
    "skill-pillow-governance-integration",
    "skill-repository-intelligence-reporting",
  ],
  approvedTools: ["node_fs_readonly", "structured_reporting"],
  authorityLevel: "read_only_analysis",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "connected",
  "active",
  "scanning",
  "analyzing",
  "reporting",
  "validating",
  "blocked",
  "standby",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "blocked", "standby", "failed"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby", "blocked"] as const;

export const ARCHITECTURE_LAYERS = [
  "pillow",
  "backend",
  "web",
  "config",
  "governance_docs",
  "tests",
  "other",
] as const;

export const DEFAULT_INCLUDE_ROOTS = [
  "pillow/src",
  "backend/src",
  "empireai-web/src",
  "config",
  "docs/governance",
] as const;

export const DEFAULT_EXCLUDE_DIRS = [
  "node_modules",
  "dist",
  ".git",
  ".tmp-ds",
  "artifacts",
  "coverage",
  ".next",
] as const;

export const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"] as const;

export const INTEGRATION_TARGETS = [
  "ai_innovation_factory",
  "implementation_specification_engine",
  "intelligence_context",
  "audit_runtime",
  "executive_reporting_runtime",
  "pillow_orchestration_runtime",
  "empire_knowledge_engine",
  "monitoring_runtime",
] as const;

export const RIENG_CAPABILITIES = [
  "discover_repository_structure",
  "analyze_modules_and_services",
  "build_dependency_graph",
  "detect_implementation_relationships",
  "discover_architectural_boundaries",
  "detect_existing_implementations",
  "identify_reusable_components",
  "detect_conflicts_and_duplicates",
  "analyze_repository",
  "produce_repository_intelligence_report",
  "consume_q1302_contract",
  "consume_q1301_observation",
  "expose_q1303_consumable_contract",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_repository_knowledge_history",
  "never_modify_analyzed_files",
  "never_implement_q1303_or_later",
  "never_certify_q1301",
  "deterministic_repository_analysis",
  "evidence_based_only",
  "read_only_repository_analysis",
] as const;
