/** PILLOW-DPR-001 — Digital Product Research Worker (Q5-02). */
export const DIGITAL_PRODUCT_RESEARCH_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_DIGITAL_PRODUCT_RESEARCH_WORKER_SYSTEM.md" as const;
export const DIGITAL_PRODUCT_RESEARCH_WORKER_ID = "digital-product-research-worker" as const;
export const DPR_METADATA_VERSION = "DPR-001-v1" as const;
export const DIGITAL_PRODUCT_RESEARCH_REPORT_VERSION = "DPR-RPT-v1" as const;

export const DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY = {
  workerId: "wkr-digital-product-research-01",
  workerName: "Digital Product Research Worker",
  workerType: "analyst",
  department: "digital_products",
  factory: "digital-products-factory",
  role: "role-analyst-digital-product-research",
  reportingLine: ["wkr-digital-product-research-01", "pillow"] as string[],
  skillProfile: [
    "skill-customer-pain-analysis",
    "skill-search-demand-analysis",
    "skill-market-gap-analysis",
    "skill-competitor-product-analysis",
    "skill-emerging-trend-analysis",
    "skill-niche-discovery",
    "skill-demand-estimation",
    "skill-commercial-opportunity-sizing",
    "skill-opportunity-ranking",
  ],
  approvedTools: ["research_notebook", "evidence_ledger", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "researching",
  "ranking",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** DPF-aligned digital product categories / types. */
export const PRODUCT_CATEGORIES = [
  "template",
  "toolkit",
  "printable",
  "software_tool",
  "membership",
  "bundle",
  "digital_download",
  "unknown",
] as const;

export const DISCOVERY_SOURCES = [
  "search_demand",
  "competitor_catalog",
  "marketplace_signals",
  "audience_pain_signals",
  "niche_forums",
  "product_review_signals",
  "trend_observatory",
  "approved_research_feed",
  "multi_source",
] as const;

export const APPROVED_RESEARCH_SOURCES = [...DISCOVERY_SOURCES] as const;

export const PRIORITY_LEVELS = ["critical", "high", "medium", "low", "watch"] as const;
export const EVIDENCE_KINDS = ["fact", "assumption"] as const;
export const DEMAND_LEVELS = ["surging", "high", "moderate", "low", "unclear"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "digital_products_factory_core",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const DPR_CAPABILITIES = [
  "analyse_customer_pain_points",
  "analyse_search_demand",
  "analyse_market_gaps",
  "analyse_competitor_products",
  "analyse_emerging_trends",
  "discover_underserved_niches",
  "estimate_demand",
  "estimate_commercial_opportunity",
  "rank_opportunities",
  "produce_machine_readable_digital_product_research_reports",
  "use_approved_research_sources",
  "preserve_complete_source_traceability",
  "distinguish_facts_from_assumptions",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_create_digital_products",
  "never_create_sales_pages",
  "never_process_payments",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_digital_products_factory_core",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "digital_product_research_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
