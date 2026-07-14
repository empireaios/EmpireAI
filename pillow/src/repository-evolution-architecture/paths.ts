/** PILLOW-REV-001 — Continuous Repository Evolution Engine paths (P9-01). */

export const REPOSITORY_EVOLUTION_ARCHITECTURE_PATH =
  "docs/governance/EMPIREAI_REPOSITORY_EVOLUTION_ARCHITECTURE.md";

export const REPOSITORY_INTELLIGENCE_COMPANION_PATH =
  "pillow/src/repository-intelligence/";

export const CONTINUOUS_EVOLUTION_COMPANION_PATH =
  "pillow/src/continuous-evolution/";

/** Repository evolution pipeline (P9-01) — safe evolution without regression. */
export const REPOSITORY_EVOLUTION_PIPELINE = [
  "vision_synchronization",
  "repository_scan",
  "evidence_collection",
  "health_analysis",
  "architecture_analysis",
  "drift_detection",
  "improvement_recommendation",
  "executive_validation",
  "safe_evolution",
  "validation",
  "knowledge_integration",
] as const;

export const EVOLUTION_PRINCIPLES = [
  "vision_first",
  "soul_first",
  "ctd_first",
  "constitution_first",
  "repository_first",
  "evidence_first",
  "evolution_without_regression",
  "no_destructive_changes",
  "no_canonical_drift",
  "single_source_of_truth",
] as const;

/** Domains governed by the Repository Evolution Engine. */
export const GOVERNED_DOMAINS = [
  "repository_health",
  "architecture_health",
  "documentation_health",
  "code_health",
  "folder_structure",
  "naming_consistency",
  "canonical_truth",
  "technical_debt",
  "production_readiness",
  "future_repository_evolution",
] as const;

export const REPOSITORY_HEALTH_DOMAINS = [
  "architecture_consistency",
  "folder_consistency",
  "documentation_quality",
  "canonical_truth",
  "mission_coverage",
  "registry_health",
  "code_quality",
  "technical_debt",
  "naming_consistency",
  "production_readiness",
  "repository_integrity",
] as const;

export const DRIFT_DETECTION_TYPES = [
  "duplicate_architectures",
  "duplicate_engines",
  "duplicate_documents",
  "conflicting_truth",
  "broken_references",
  "unused_components",
  "dead_code",
  "obsolete_files",
  "mission_drift",
  "repository_fragmentation",
] as const;

export const IMPROVEMENT_TYPES = [
  "repository_cleanup",
  "repository_consolidation",
  "documentation_improvement",
  "architecture_improvement",
  "naming_improvement",
  "registry_improvement",
  "technical_debt_reduction",
  "performance_improvement",
  "production_readiness_improvement",
  "future_improvements",
] as const;

/** Legacy capability aliases — consolidated under IMPROVEMENT_TYPES. */
export const EVOLUTION_CAPABILITIES = [
  "repository_analysis",
  "repository_refactoring",
  "repository_cleanup",
  "repository_classification",
  "repository_optimisation",
  "knowledge_consolidation",
  "documentation_consolidation",
  "architecture_consolidation",
  "dependency_optimisation",
] as const;

export const HEALTH_EVALUATIONS = [...REPOSITORY_HEALTH_DOMAINS] as const;

export const CHANGE_GOVERNANCE_FIELDS = [
  "purpose",
  "reason",
  "evidence",
  "dependencies",
  "affected_systems",
  "repository_impact",
  "architecture_impact",
  "business_impact",
  "validation",
  "journey_entry",
] as const;
