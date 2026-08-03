/** PILLOW-CSW-001 — Comparison Site Worker (Q8-03). */
export const COMPARISON_SITE_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_COMPARISON_SITE_WORKER_SYSTEM.md" as const;
export const COMPARISON_SITE_WORKER_ID = "comparison-site-worker" as const;
export const CSW_METADATA_VERSION = "CSW-001-v1" as const;
export const COMPARISON_SITE_REPORT_VERSION = "CSW-RPT-v1" as const;

export const COMPARISON_SITE_WORKER_IDENTITY = {
  workerId: "wkr-comparison-site-01",
  workerName: "Comparison Site Worker",
  workerType: "analyst",
  department: "affiliate",
  factory: "affiliate-factory",
  role: "role-analyst-comparison-site",
  reportingLine: ["wkr-comparison-site-01", "pillow"] as string[],
  skillProfile: [
    "skill-comparison-page-generation",
    "skill-ranking-page-generation",
    "skill-buyer-guide-generation",
    "skill-feature-comparison",
    "skill-pricing-comparison",
    "skill-comparison-tables",
    "skill-methodology-documentation",
    "skill-evidence-classified-reporting",
  ],
  approvedTools: ["comparison_ledger", "evidence_ledger", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "consuming_opportunity",
  "generating_comparison",
  "generating_ranking",
  "generating_buyer_guide",
  "building_tables",
  "documenting_methodology",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const AUDIT_STATUSES = [
  "draft",
  "assets_ready",
  "methodology_documented",
  "ready_for_q804",
  "submitted",
  "rejected",
  "unknown",
] as const;

export const INTEGRATION_TARGETS = [
  "affiliate_factory_core",
  "affiliate_opportunity_worker",
  "worker_registry",
  "worker_lifecycle",
  "executive_reporting_runtime",
  "worker_recovery_system",
  "audit_runtime",
] as const;

export const CSW_CAPABILITIES = [
  "consume_affiliate_opportunity_reports",
  "generate_comparison_pages",
  "generate_product_ranking_pages",
  "generate_buyer_guides",
  "compare_features_and_specifications",
  "compare_pricing_and_value",
  "generate_comparison_tables",
  "explain_ranking_methodology",
  "produce_comparison_site_reports",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_audit_history",
  "never_fabricate_rankings_or_product_information",
  "never_publish_websites",
  "never_manipulate_rankings_without_evidence",
  "never_replace_review_content_worker",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q804_or_later",
  "integrate_affiliate_factory_core",
  "integrate_affiliate_opportunity_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_executive_reporting_runtime",
  "integrate_worker_recovery_system",
  "comparison_site_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q804_consumable_contract",
] as const;
