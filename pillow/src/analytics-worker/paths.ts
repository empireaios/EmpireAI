/** PILLOW-ANW-001 — Analytics Worker (Q8-07). */
export const ANALYTICS_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_ANALYTICS_WORKER_SYSTEM.md" as const;
export const ANALYTICS_WORKER_ID = "analytics-worker" as const;
export const ANW_METADATA_VERSION = "ANW-001-v1" as const;
export const ANALYTICS_REPORT_VERSION = "ANW-RPT-v1" as const;

export const ANALYTICS_WORKER_IDENTITY = {
  workerId: "wkr-analytics-01",
  workerName: "Analytics Worker",
  workerType: "analyst",
  department: "affiliate",
  factory: "affiliate-factory",
  role: "role-analyst-affiliate-analytics",
  reportingLine: ["wkr-analytics-01", "pillow"] as string[],
  skillProfile: [
    "skill-click-tracking",
    "skill-conversion-tracking",
    "skill-commission-tracking",
    "skill-seo-performance-measurement",
    "skill-funnel-performance-analysis",
    "skill-trend-anomaly-detection",
    "skill-optimisation-recommendations",
    "skill-analytics-history-preservation",
    "skill-evidence-classified-reporting",
  ],
  approvedTools: ["metrics_ledger", "evidence_ledger", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "collecting_metrics",
  "tracking_clicks",
  "tracking_conversions",
  "tracking_commissions",
  "measuring_seo",
  "analysing_funnel",
  "detecting_trends",
  "recommending_optimisations",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const AUDIT_STATUSES = [
  "draft",
  "metrics_ready",
  "analysis_ready",
  "ready_for_q808",
  "submitted",
  "rejected",
  "unknown",
] as const;

export const TREND_DIRECTIONS = ["up", "down", "flat", "unknown"] as const;
export const ANOMALY_SEVERITIES = ["info", "watch", "critical", "unknown"] as const;

export const INTEGRATION_TARGETS = [
  "affiliate_factory_core",
  "affiliate_opportunity_worker",
  "comparison_site_worker",
  "review_content_worker",
  "seo_content_worker",
  "email_funnel_worker",
  "executive_reporting_runtime",
  "audit_runtime",
  "worker_registry",
  "worker_lifecycle",
  "worker_recovery_system",
] as const;

export const ANW_CAPABILITIES = [
  "collect_affiliate_performance_metrics",
  "track_clicks",
  "track_conversions",
  "track_commissions_and_revenue",
  "track_seo_performance",
  "analyse_funnel_performance",
  "detect_trends_and_anomalies",
  "recommend_optimisation_opportunities",
  "preserve_historical_analytics",
  "produce_analytics_reports",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_analytics_history",
  "never_fabricate_analytics_or_performance_results",
  "never_modify_campaigns_automatically",
  "never_manipulate_analytics",
  "never_replace_affiliate_compliance_worker",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q808_or_later",
  "integrate_affiliate_factory_core",
  "integrate_affiliate_opportunity_worker",
  "integrate_comparison_site_worker",
  "integrate_review_content_worker",
  "integrate_seo_content_worker",
  "integrate_email_funnel_worker",
  "integrate_executive_reporting_runtime",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_recovery_system",
  "analytics_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q808_consumable_contract",
] as const;
