/** PILLOW-MAW-001 — Media Analytics Worker (Q4-15). */
export const MEDIA_ANALYTICS_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MEDIA_ANALYTICS_WORKER_SYSTEM.md" as const;
export const MEDIA_ANALYTICS_WORKER_ID = "media-analytics-worker" as const;
export const MAW_METADATA_VERSION = "MAW-001-v1" as const;
export const MAW_REPORT_VERSION = "MAW-RPT-v1" as const;

export const MEDIA_ANALYTICS_WORKER_IDENTITY = {
  workerId: "wkr-media-analytics-01",
  workerName: "Media Analytics Worker",
  workerType: "analyst",
  department: "media",
  factory: "media-factory",
  role: "role-analyst-media-analytics",
  reportingLine: ["wkr-media-analytics-01", "pillow"] as string[],
  skillProfile: [
    "skill-view-impression-tracking",
    "skill-ctr-watch-time-analysis",
    "skill-audience-retention-analysis",
    "skill-subscriber-growth-tracking",
    "skill-engagement-revenue-metrics",
    "skill-performance-pattern-detection",
    "skill-media-comparison-analytics",
  ],
  approvedTools: ["media_analytics_ledger", "metric_traceability_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "tracking",
  "analyzing",
  "comparing",
  "validating",
  "reporting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const ANALYTICS_PLATFORMS = [
  "youtube",
  "tiktok",
  "instagram",
  "facebook",
  "x",
  "linkedin",
] as const;

/** Alias — same platform set as Publishing Worker, extensible. */
export const PUBLISHING_PLATFORMS = ANALYTICS_PLATFORMS;

export const METRIC_SOURCES = [
  "platform_reported",
  "estimated",
  "derived",
] as const;

export const PATTERN_CLASSIFICATIONS = [
  "strong",
  "weak",
  "neutral",
  "emerging",
] as const;

export const PATTERN_DIMENSIONS = [
  "video",
  "format",
  "topic",
  "hook",
  "channel",
  "retention",
  "ctr",
  "engagement",
  "revenue",
] as const;

export const COMPARISON_DIMENSIONS = [
  "video",
  "format",
  "topic",
  "hook",
  "channel",
] as const;

export const PATTERN_SEVERITIES = ["info", "notable", "critical"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "publishing_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const MAW_CAPABILITIES = [
  "track_views",
  "track_impressions",
  "track_click_through_rate",
  "track_watch_time",
  "track_audience_retention",
  "track_subscriber_growth",
  "track_engagement_metrics",
  "track_revenue_where_available",
  "detect_strong_and_weak_performance_patterns",
  "compare_videos_formats_topics_hooks_channels",
  "produce_machine_readable_media_analytics_reports",
  "preserve_complete_metric_traceability",
  "preserve_historical_performance_records",
  "distinguish_platform_reported_metrics_from_estimates",
  "detect_meaningful_performance_changes",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_alter_source_analytics_data",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_publishing_worker",
  "integrate_executive_reporting_runtime",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "media_analytics_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
