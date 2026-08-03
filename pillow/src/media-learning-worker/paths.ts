/** PILLOW-MLW-001 — Media Learning Worker (Q4-16). */
export const MEDIA_LEARNING_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MEDIA_LEARNING_WORKER_SYSTEM.md" as const;
export const MEDIA_LEARNING_WORKER_ID = "media-learning-worker" as const;
export const MLW_METADATA_VERSION = "MLW-001-v1" as const;
export const MLW_REPORT_VERSION = "MLW-RPT-v1" as const;

export const MEDIA_LEARNING_WORKER_IDENTITY = {
  workerId: "wkr-media-learning-01",
  workerName: "Media Learning Worker",
  workerType: "analyst",
  department: "media",
  factory: "media-factory",
  role: "role-analyst-media-learning",
  reportingLine: ["wkr-media-learning-01", "pillow"] as string[],
  skillProfile: [
    "skill-media-pattern-learning",
    "skill-topic-performance-analysis",
    "skill-hook-performance-analysis",
    "skill-thumbnail-performance-analysis",
    "skill-retention-pacing-analysis",
    "skill-publishing-timing-analysis",
    "skill-playbook-recommendation-updates",
  ],
  approvedTools: [
    "media_learning_ledger",
    "learning_traceability_registry",
    "structured_reporting",
  ],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "analysing",
  "learning",
  "recommending",
  "validating",
  "reporting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const LEARNING_OUTCOME_KINDS = ["measured", "inferred", "assumption"] as const;

export const PATTERN_OUTCOMES = ["successful", "unsuccessful", "mixed"] as const;

export const PATTERN_DIMENSIONS = [
  "topic",
  "hook",
  "thumbnail",
  "pacing",
  "retention",
  "format",
  "publishing_timing",
  "engagement",
] as const;

export const INSIGHT_CATEGORIES = [
  "topic",
  "hook",
  "thumbnail",
  "retention",
  "publishing",
] as const;

export const RECOMMENDATION_AREAS = [
  "topics",
  "hooks",
  "thumbnails",
  "pacing",
  "formats",
  "publishing_timing",
  "playbook",
] as const;

export const RECOMMENDATION_PRIORITIES = ["high", "medium", "low"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "media_analytics_worker",
  "experience_replay_engine",
  "operational_playbook_engine",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const MLW_CAPABILITIES = [
  "receive_media_analytics_reports",
  "identify_successful_content_patterns",
  "identify_unsuccessful_content_patterns",
  "analyse_topic_performance",
  "analyse_hook_performance",
  "analyse_thumbnail_performance",
  "analyse_pacing_and_retention",
  "analyse_publishing_timing",
  "generate_reusable_learning_insights",
  "update_media_playbook_recommendations",
  "produce_machine_readable_media_learning_reports",
  "learn_only_from_verified_analytics",
  "preserve_complete_traceability",
  "preserve_historical_learning_records",
  "distinguish_measured_outcomes_from_assumptions",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_overwrite_historical_learning",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_media_analytics_worker",
  "integrate_experience_replay_engine",
  "integrate_operational_playbook_engine",
  "integrate_executive_reporting_runtime",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "media_learning_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
