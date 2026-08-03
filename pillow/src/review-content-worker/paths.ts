/** PILLOW-RCW-001 — Review Content Worker (Q8-04). */
export const REVIEW_CONTENT_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_REVIEW_CONTENT_WORKER_SYSTEM.md" as const;
export const REVIEW_CONTENT_WORKER_ID = "review-content-worker" as const;
export const RCW_METADATA_VERSION = "RCW-001-v1" as const;
export const REVIEW_CONTENT_REPORT_VERSION = "RCW-RPT-v1" as const;

export const REVIEW_CONTENT_WORKER_IDENTITY = {
  workerId: "wkr-review-content-01",
  workerName: "Review Content Worker",
  workerType: "analyst",
  department: "affiliate",
  factory: "affiliate-factory",
  role: "role-analyst-review-content",
  reportingLine: ["wkr-review-content-01", "pillow"] as string[],
  skillProfile: [
    "skill-review-article-generation",
    "skill-pros-cons-generation",
    "skill-alternatives-recommendation",
    "skill-buying-recommendation",
    "skill-ideal-customer-profile",
    "skill-limitations-tradeoffs",
    "skill-evidence-preservation",
    "skill-review-version-history",
    "skill-evidence-classified-reporting",
  ],
  approvedTools: ["review_ledger", "evidence_ledger", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "consuming_opportunity",
  "consuming_comparison",
  "generating_review",
  "generating_pros_cons",
  "recommending_alternatives",
  "producing_buying_recommendation",
  "documenting_icp",
  "highlighting_limitations",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const AUDIT_STATUSES = [
  "draft",
  "review_ready",
  "evidence_attached",
  "ready_for_q805",
  "submitted",
  "rejected",
  "unknown",
] as const;

export const INTEGRATION_TARGETS = [
  "affiliate_factory_core",
  "affiliate_opportunity_worker",
  "comparison_site_worker",
  "worker_registry",
  "worker_lifecycle",
  "executive_reporting_runtime",
  "worker_recovery_system",
  "audit_runtime",
] as const;

export const RCW_CAPABILITIES = [
  "consume_affiliate_opportunity_reports",
  "consume_comparison_site_reports",
  "generate_structured_review_articles",
  "generate_pros_and_cons",
  "recommend_alternatives",
  "produce_buying_recommendations",
  "explain_ideal_customer_profiles",
  "highlight_limitations_and_tradeoffs",
  "preserve_supporting_evidence",
  "maintain_review_version_history",
  "produce_review_content_reports",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_audit_history",
  "never_fabricate_reviews_ratings_or_product_information",
  "never_publish_websites",
  "never_manipulate_ratings",
  "never_replace_comparison_site_worker",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q805_or_later",
  "integrate_affiliate_factory_core",
  "integrate_affiliate_opportunity_worker",
  "integrate_comparison_site_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_executive_reporting_runtime",
  "integrate_worker_recovery_system",
  "review_content_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q805_consumable_contract",
] as const;
