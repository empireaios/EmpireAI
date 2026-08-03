/** PILLOW-EME-001 — Empire Memory Engine paths (X5-03). */
export const EMPIRE_MEMORY_ENGINE_SYSTEM_PATH = "docs/governance/EMPIREAI_EMPIRE_MEMORY_ENGINE_SYSTEM.md" as const;
export const EMPIRE_MEMORY_ENGINE_ID = "empire-memory-engine" as const;
export const EME_METADATA_VERSION = "EME-001-v1" as const;
export const ENGINE_STATUSES = ["idle", "connecting", "active", "persisting", "recording", "analyzing", "recommending", "failed"] as const;
export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const MEMORY_CATEGORIES = ["organizational_memory", "strategic_decision", "operational_decision", "business_outcome", "lesson_learned", "historical_event", "enterprise_milestone"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const EME_CAPABILITIES = [
  "long_term_organizational_memory", "strategic_decision_archive", "operational_decision_archive",
  "business_outcome_recording", "lesson_learned_recording", "historical_timeline",
  "enterprise_milestone_recording", "duplicate_memory_detection", "memory_conflict_detection",
  "organizational_memory_recommendations", "memory_metadata_generation", "memory_validation",
  "health_monitoring", "recovery",
] as const;
