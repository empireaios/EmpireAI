/** PILLOW-SEOW-001 — SEO Content Worker (Q8-05). */
export const SEO_CONTENT_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SEO_CONTENT_WORKER_SYSTEM.md" as const;
export const SEO_CONTENT_WORKER_ID = "seo-content-worker" as const;
export const SEOW_METADATA_VERSION = "SEOW-001-v1" as const;
export const SEO_CONTENT_REPORT_VERSION = "SEOW-RPT-v1" as const;

export const SEO_CONTENT_WORKER_IDENTITY = {
  workerId: "wkr-seo-content-01",
  workerName: "SEO Content Worker",
  workerType: "analyst",
  department: "affiliate",
  factory: "affiliate-factory",
  role: "role-analyst-seo-content",
  reportingLine: ["wkr-seo-content-01", "pillow"] as string[],
  skillProfile: [
    "skill-seo-content-planning",
    "skill-article-brief-generation",
    "skill-seo-article-generation",
    "skill-keyword-mapping",
    "skill-search-intent-mapping",
    "skill-internal-linking",
    "skill-content-completeness",
    "skill-content-version-history",
    "skill-evidence-classified-reporting",
  ],
  approvedTools: ["seo_ledger", "evidence_ledger", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "consuming_opportunity",
  "consuming_review",
  "planning_content",
  "mapping_keywords",
  "generating_brief",
  "generating_article",
  "recommending_links",
  "evaluating_completeness",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const AUDIT_STATUSES = [
  "draft",
  "plan_ready",
  "brief_ready",
  "article_ready",
  "ready_for_q806",
  "submitted",
  "rejected",
  "unknown",
] as const;

export const SEARCH_INTENTS = [
  "informational",
  "commercial",
  "transactional",
  "navigational",
  "unknown",
] as const;

export const INTEGRATION_TARGETS = [
  "affiliate_factory_core",
  "affiliate_opportunity_worker",
  "comparison_site_worker",
  "review_content_worker",
  "worker_registry",
  "worker_lifecycle",
  "executive_reporting_runtime",
  "worker_recovery_system",
  "audit_runtime",
] as const;

export const SEOW_CAPABILITIES = [
  "consume_affiliate_opportunity_reports",
  "consume_review_content_reports",
  "generate_seo_content_plans",
  "generate_article_briefs",
  "generate_seo_optimized_articles",
  "generate_keyword_mapping",
  "generate_internal_linking_recommendations",
  "evaluate_content_completeness",
  "maintain_content_version_history",
  "produce_seo_content_reports",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_audit_history",
  "never_fabricate_seo_performance_claims",
  "never_publish_articles",
  "never_manipulate_search_rankings",
  "never_replace_analytics_worker",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q806_or_later",
  "integrate_affiliate_factory_core",
  "integrate_affiliate_opportunity_worker",
  "integrate_comparison_site_worker",
  "integrate_review_content_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_executive_reporting_runtime",
  "integrate_worker_recovery_system",
  "seo_content_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q806_consumable_contract",
] as const;
