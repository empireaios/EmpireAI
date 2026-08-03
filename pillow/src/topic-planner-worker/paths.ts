/** PILLOW-TPW-001 — Topic Planner Worker (Q4-04). */
export const TOPIC_PLANNER_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_TOPIC_PLANNER_WORKER_SYSTEM.md" as const;
export const TOPIC_PLANNER_WORKER_ID = "topic-planner-worker" as const;
export const TPW_METADATA_VERSION = "TPW-001-v1" as const;
export const TOPIC_PLAN_VERSION = "TPW-PLAN-v1" as const;

export const TOPIC_PLANNER_WORKER_IDENTITY = {
  workerId: "wkr-topic-planner-01",
  workerName: "Topic Planner Worker",
  workerType: "planner",
  department: "media",
  factory: "media-factory",
  role: "role-planner-topic-planner",
  reportingLine: ["wkr-topic-planner-01", "pillow"] as string[],
  skillProfile: [
    "skill-editorial-strategy-alignment",
    "skill-trend-evidence-integration",
    "skill-channel-objective-analysis",
    "skill-content-opportunity-prioritization",
    "skill-publishing-cadence-management",
    "skill-topic-deduplication",
  ],
  approvedTools: ["topic_ledger", "plan_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "analysing",
  "planning",
  "ranking",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const TOPIC_PRIORITIES = ["critical", "high", "medium", "low", "backlog"] as const;
export const CONTENT_MIX = ["evergreen", "trending", "hybrid"] as const;
export const CADENCE_STATUSES = ["on_schedule", "ahead", "behind", "paused", "unknown"] as const;
export const ALIGNMENT_LEVELS = ["strong", "moderate", "weak", "misaligned"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "editor_in_chief_worker",
  "trend_research_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const TPW_CAPABILITIES = [
  "receive_editorial_strategy",
  "receive_trend_research_reports",
  "analyse_channel_objectives",
  "prioritize_content_opportunities",
  "select_daily_publishing_topics",
  "balance_evergreen_and_trending_content",
  "prevent_duplicate_topics",
  "maintain_publishing_cadence",
  "rank_topics_by_strategic_priority",
  "produce_machine_readable_topic_plans",
  "follow_editor_in_chief_strategy",
  "use_trend_research_evidence",
  "preserve_complete_planning_traceability",
  "avoid_duplicate_or_conflicting_topics",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_bypass_pillow_governance",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_editor_in_chief_worker",
  "integrate_trend_research_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "topic_planner_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
