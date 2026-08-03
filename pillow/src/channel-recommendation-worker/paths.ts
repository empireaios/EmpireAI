/** PILLOW-CRW-001 — Channel Recommendation Worker (Q4-17). */
export const CHANNEL_RECOMMENDATION_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CHANNEL_RECOMMENDATION_WORKER_SYSTEM.md" as const;
export const CHANNEL_RECOMMENDATION_WORKER_ID = "channel-recommendation-worker" as const;
export const CRW_METADATA_VERSION = "CRW-001-v1" as const;
export const CRW_REPORT_VERSION = "CRW-RPT-v1" as const;

export const CHANNEL_RECOMMENDATION_WORKER_IDENTITY = {
  workerId: "wkr-channel-recommendation-01",
  workerName: "Channel Recommendation Worker",
  workerType: "analyst",
  department: "media",
  factory: "media-factory",
  role: "role-analyst-channel-recommendation",
  reportingLine: ["wkr-channel-recommendation-01", "pillow"] as string[],
  skillProfile: [
    "skill-channel-opportunity-analysis",
    "skill-audience-potential-analysis",
    "skill-revenue-potential-analysis",
    "skill-production-feasibility-analysis",
    "skill-competition-assessment",
    "skill-strategic-fit-analysis",
    "skill-content-sustainability-analysis",
    "skill-channel-recommendation-ranking",
  ],
  approvedTools: [
    "channel_recommendation_ledger",
    "recommendation_traceability_registry",
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
  "ranking",
  "recommending",
  "validating",
  "reporting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const RECOMMENDATION_DECISIONS = ["Proceed", "Monitor", "Reject"] as const;

export const EVIDENCE_SOURCE_TYPES = [
  "trend_research",
  "media_analytics",
  "media_learning",
  "input",
  "derived",
] as const;

export const EVIDENCE_KINDS = ["fact", "assumption"] as const;

export const SCORED_DIMENSION_KINDS = ["fact", "assumption", "mixed"] as const;

export const RISK_LEVELS = ["low", "medium", "high"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "trend_research_worker",
  "media_analytics_worker",
  "media_learning_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const CRW_CAPABILITIES = [
  "receive_trend_research",
  "receive_media_analytics",
  "receive_media_learning_outputs",
  "analyse_audience_potential",
  "analyse_revenue_potential",
  "analyse_production_feasibility",
  "analyse_competition",
  "analyse_strategic_fit",
  "analyse_expected_content_sustainability",
  "rank_channel_opportunities",
  "recommend_proceed_monitor_or_reject",
  "produce_machine_readable_channel_recommendation_reports",
  "base_recommendations_on_evidence",
  "preserve_complete_source_traceability",
  "distinguish_facts_from_assumptions",
  "explain_every_recommendation",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_create_channels_automatically",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_trend_research_worker",
  "integrate_media_analytics_worker",
  "integrate_media_learning_worker",
  "integrate_executive_reporting_runtime",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "channel_recommendation_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
