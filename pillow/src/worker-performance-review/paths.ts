/** PILLOW-WPR-001 — Worker Performance Review (Q1-11). */
export const WORKER_PERFORMANCE_REVIEW_SYSTEM_PATH =
  "docs/governance/EMPIREAI_WORKER_PERFORMANCE_REVIEW_SYSTEM.md" as const;
export const WORKER_PERFORMANCE_REVIEW_ID = "worker-performance-review" as const;
export const WPR_METADATA_VERSION = "WPR-001-v1" as const;
export const PERFORMANCE_VERSION = "WPR-PERF-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "reviewing",
  "scoring",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Minimum performance metrics (Q1-11).
 * Architecture allows additional metrics via configuration without redesign.
 */
export const PERFORMANCE_METRICS = [
  "quality",
  "accuracy",
  "speed",
  "reliability",
  "consistency",
  "collaboration",
  "recovery",
  "efficiency",
  "business_value",
  "governance_compliance",
] as const;

/**
 * Minimum performance ratings (Q1-11).
 * Architecture allows additional ratings via configuration without redesign.
 */
export const PERFORMANCE_RATINGS = [
  "outstanding",
  "excellent",
  "good",
  "acceptable",
  "needs_improvement",
  "poor",
] as const;

export const TREND_DIRECTIONS = ["improving", "stable", "declining", "insufficient_history"] as const;

export const PERFORMANCE_DECISIONS = ["valid", "partially_valid", "invalid"] as const;

export const PERFORMANCE_RULES = [
  "evaluate_every_active_worker",
  "preserve_historical_performance",
  "detect_improving_performance",
  "detect_declining_performance",
  "recommend_improvements",
  "integrate_with_worker_assignment_engine",
  "integrate_with_workforce_certification_monitor",
  "integrate_with_adaptive_workforce_optimizer",
] as const;

export const WPR_CAPABILITIES = [
  "measure_worker_quality",
  "measure_worker_speed",
  "measure_worker_accuracy",
  "measure_worker_reliability",
  "measure_worker_collaboration",
  "measure_worker_recovery_capability",
  "measure_business_outcomes",
  "measure_review_outcomes",
  "measure_approval_rates",
  "track_long_term_performance_trends",
  "generate_overall_performance_scores",
  "produce_machine_readable_performance_records",
  "extensible_performance_metrics",
  "extensible_performance_ratings",
  "improvement_recommendations",
  "executive_performance_reports",
  "worker_performance_validation",
  "health_monitoring",
  "recovery_management",
] as const;
