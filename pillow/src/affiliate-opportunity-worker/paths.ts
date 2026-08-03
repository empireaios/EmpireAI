/** PILLOW-AOW-001 — Affiliate Opportunity Worker (Q8-02). */
export const AFFILIATE_OPPORTUNITY_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_AFFILIATE_OPPORTUNITY_WORKER_SYSTEM.md" as const;
export const AFFILIATE_OPPORTUNITY_WORKER_ID = "affiliate-opportunity-worker" as const;
export const AOW_METADATA_VERSION = "AOW-001-v1" as const;
export const AFFILIATE_OPPORTUNITY_REPORT_VERSION = "AOW-RPT-v1" as const;

export const AFFILIATE_OPPORTUNITY_WORKER_IDENTITY = {
  workerId: "wkr-affiliate-opportunity-01",
  workerName: "Affiliate Opportunity Worker",
  workerType: "analyst",
  department: "affiliate",
  factory: "affiliate-factory",
  role: "role-analyst-affiliate-opportunity",
  reportingLine: ["wkr-affiliate-opportunity-01", "pillow"] as string[],
  skillProfile: [
    "skill-affiliate-programme-discovery",
    "skill-affiliate-product-discovery",
    "skill-niche-research",
    "skill-commission-analysis",
    "skill-demand-estimation",
    "skill-opportunity-ranking",
    "skill-risk-identification",
    "skill-evidence-classified-reporting",
  ],
  approvedTools: ["opportunity_ledger", "evidence_ledger", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "discovering_programmes",
  "discovering_products",
  "researching_niches",
  "analysing_commissions",
  "estimating_demand",
  "comparing",
  "ranking",
  "identifying_risks",
  "recommending",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const EVIDENCE_MODES = ["fixture", "sandbox", "cached", "live"] as const;
export const AUDIT_STATUSES = [
  "draft",
  "research_ready",
  "ranked",
  "ready_for_q803",
  "submitted",
  "rejected",
  "unknown",
] as const;
export const RECOMMENDATION_STATUSES = [
  "recommend",
  "recommend_with_conditions",
  "do_not_recommend",
  "insufficient_evidence",
  "unknown",
] as const;

export const INTEGRATION_TARGETS = [
  "affiliate_factory_core",
  "worker_registry",
  "worker_lifecycle",
  "executive_reporting_runtime",
  "worker_recovery_system",
  "audit_runtime",
] as const;

export const AOW_CAPABILITIES = [
  "discover_affiliate_programmes",
  "discover_affiliate_products",
  "research_profitable_niches",
  "analyse_commission_structures",
  "estimate_market_demand",
  "compare_competing_opportunities",
  "rank_opportunities",
  "identify_risks",
  "recommend_high_potential_opportunities",
  "produce_affiliate_opportunity_reports",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_research_evidence",
  "preserve_audit_history",
  "never_fabricate_commission_or_demand_data",
  "never_create_affiliate_content",
  "never_publish_websites",
  "never_join_affiliate_programmes_automatically",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q803_or_later",
  "integrate_affiliate_factory_core",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_executive_reporting_runtime",
  "integrate_worker_recovery_system",
  "affiliate_opportunity_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q803_consumable_contract",
] as const;
