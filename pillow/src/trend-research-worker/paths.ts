/** PILLOW-TRW-001 — Trend Research Worker (Q4-03). */
export const TREND_RESEARCH_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_TREND_RESEARCH_WORKER_SYSTEM.md" as const;
export const TREND_RESEARCH_WORKER_ID = "trend-research-worker" as const;
export const TRW_METADATA_VERSION = "TRW-001-v1" as const;
export const TREND_RESEARCH_REPORT_VERSION = "TRW-RPT-v1" as const;

export const TREND_RESEARCH_WORKER_IDENTITY = {
  workerId: "wkr-trend-research-01",
  workerName: "Trend Research Worker",
  workerType: "analyst",
  department: "media",
  factory: "media-factory",
  role: "role-analyst-trend-research",
  reportingLine: ["wkr-trend-research-01", "pillow"] as string[],
  skillProfile: [
    "skill-search-trend-monitoring",
    "skill-competitor-channel-analysis",
    "skill-social-signal-analysis",
    "skill-audience-behaviour-analysis",
    "skill-current-events-monitoring",
    "skill-trend-opportunity-scoring",
  ],
  approvedTools: ["trend_ledger", "source_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "monitoring",
  "identifying",
  "scoring",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const TREND_CATEGORIES = [
  "search_demand",
  "competitor",
  "social",
  "audience_behaviour",
  "current_events",
  "hybrid",
  "unknown",
] as const;

export const DISCOVERY_SOURCES = [
  "google_trends",
  "youtube_trends",
  "tiktok_trends",
  "competitor_channel",
  "news_wire",
  "social_listening",
  "audience_analytics",
  "approved_research_feed",
  "multi_source",
] as const;

export const APPROVED_RESEARCH_SOURCES = [...DISCOVERY_SOURCES] as const;

export const TREND_DIRECTIONS = ["emerging", "stable", "declining"] as const;
export const PRIORITY_LEVELS = ["critical", "high", "medium", "low", "watch"] as const;
export const EVIDENCE_KINDS = ["fact", "assumption"] as const;
export const DEMAND_LEVELS = ["surging", "high", "moderate", "low", "fading"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "media_factory_core",
  "editor_in_chief_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const TRW_CAPABILITIES = [
  "monitor_search_trends",
  "monitor_competitor_channels",
  "monitor_social_platform_trends",
  "monitor_audience_behaviour_signals",
  "monitor_current_events",
  "identify_emerging_trends",
  "identify_declining_trends",
  "categorize_discovered_opportunities",
  "score_trend_confidence",
  "produce_machine_readable_trend_research_reports",
  "use_approved_research_sources",
  "preserve_complete_source_traceability",
  "preserve_historical_trend_records",
  "distinguish_facts_from_assumptions",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_generate_content_directly",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_media_factory_core",
  "integrate_editor_in_chief_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "trend_research_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
