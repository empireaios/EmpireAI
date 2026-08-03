/** PILLOW-ELE-001 — Empire Legacy Engine (X5-14). */
export const EMPIRE_LEGACY_ENGINE_SYSTEM_PATH = "docs/governance/EMPIREAI_EMPIRE_LEGACY_ENGINE_SYSTEM.md" as const;
export const EMPIRE_LEGACY_ENGINE_ID = "empire-legacy-engine" as const;
export const ELE_METADATA_VERSION = "ELE-001-v1" as const;
export const ENGINE_STATUSES = ["idle", "connecting", "active", "archiving", "timeline", "registering", "detecting", "recommending", "failed"] as const;
export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const SIGNIFICANCE_LEVELS = ["routine", "notable", "major", "foundational"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const ELE_CAPABILITIES = [
  "strategic_decision_preservation",
  "operational_decision_preservation",
  "governance_history_preservation",
  "enterprise_milestone_preservation",
  "achievement_preservation",
  "lessons_learned_preservation",
  "chronological_enterprise_history",
  "missing_historical_record_detection",
  "historical_intelligence_recommendations",
  "legacy_metadata_generation",
  "legacy_validation",
  "health_monitoring",
  "recovery_management",
] as const;
