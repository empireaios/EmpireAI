/** PILLOW-XPL-001 — Experience Replay Engine (Q0-14). */
export const EXPERIENCE_REPLAY_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EXPERIENCE_REPLAY_ENGINE_SYSTEM.md" as const;
export const EXPERIENCE_REPLAY_ENGINE_ID = "experience-replay-engine" as const;
export const XPL_METADATA_VERSION = "XPL-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "retrieving",
  "analysing",
  "learning",
  "recommending",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Default experience sources (Q0-14).
 * Architecture allows additional sources via configuration without redesign.
 */
export const EXPERIENCE_SOURCES = [
  "successful_missions",
  "failed_missions",
  "grand_king_approvals",
  "grand_king_rejections",
  "executive_decisions",
  "audit_reports",
  "worker_reviews",
  "production_results",
] as const;

export const EVENT_TYPES = [
  "mission_success",
  "mission_failure",
  "grand_king_approval",
  "grand_king_rejection",
  "executive_decision",
  "audit_report",
  "worker_review",
  "production_result",
] as const;

export const OUTCOMES = ["success", "failure", "rejected", "corrected", "partial"] as const;

export const XPL_CAPABILITIES = [
  "retrieve_historical_execution_records",
  "analyse_successful_missions",
  "analyse_failed_missions",
  "analyse_rejected_outputs",
  "analyse_grand_king_corrections",
  "identify_repeating_patterns",
  "extract_reusable_lessons",
  "generate_executive_recommendations",
  "detect_repeated_mistakes",
  "update_experience_records",
  "produce_experience_records",
  "machine_readable_experience_output",
  "extensible_experience_sources",
  "preserve_auditability",
  "preserve_traceability",
  "experience_validation",
  "health_monitoring",
  "recovery_management",
] as const;
