/** PILLOW-PDW-001 — Product Discovery Worker (Q3-02). */
export const PRODUCT_DISCOVERY_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PRODUCT_DISCOVERY_WORKER_SYSTEM.md" as const;
export const PRODUCT_DISCOVERY_WORKER_ID = "product-discovery-worker" as const;
export const PDW_METADATA_VERSION = "PDW-001-v1" as const;
export const PRODUCT_DISCOVERY_REPORT_VERSION = "PDW-RPT-v1" as const;

export const PRODUCT_DISCOVERY_WORKER_IDENTITY = {
  workerId: "wkr-product-discovery-01",
  workerName: "Product Discovery Worker",
  workerType: "analyst",
  department: "commerce",
  factory: "commerce-factory",
  role: "role-analyst-product-discovery",
  reportingLine: ["wkr-product-discovery-01", "pillow"] as string[],
  skillProfile: [
    "skill-marketplace-discovery",
    "skill-supplier-discovery",
    "skill-trend-detection",
    "skill-demand-signals",
    "skill-product-categorization",
  ],
  approvedTools: ["discovery_ledger", "source_traceability", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "discovering",
  "categorizing",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const DISCOVERY_SOURCES = [
  "marketplace",
  "supplier",
  "search_trend",
  "customer_demand",
  "seasonal",
  "emerging_trend",
  "declining_signal",
  "aggregated",
] as const;

export const PRODUCT_CATEGORIES = [
  "home_goods",
  "electronics",
  "apparel",
  "beauty",
  "health",
  "sports",
  "toys",
  "pet",
  "food_beverage",
  "office",
  "automotive",
  "other",
  "unknown",
] as const;

export const TREND_DIRECTIONS = ["emerging", "stable", "declining", "unclear"] as const;

export const EVIDENCE_KINDS = ["fact", "assumption"] as const;

export const APPROVED_MARKETPLACES = [
  "amazon",
  "shopify",
  "etsy",
  "walmart",
  "ebay",
  "tiktok_shop",
] as const;

export const APPROVED_SUPPLIER_PLATFORMS = [
  "alibaba",
  "aliexpress",
  "cjdropshipping",
  "spocket",
  "local_wholesale",
] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const PDW_CAPABILITIES = [
  "discover_products_from_approved_marketplaces",
  "discover_products_from_approved_supplier_platforms",
  "discover_products_from_search_trend_sources",
  "discover_products_from_customer_demand_signals",
  "discover_seasonal_opportunities",
  "detect_emerging_product_trends",
  "detect_declining_products",
  "categorize_discovered_products",
  "remove_duplicate_discoveries",
  "produce_machine_readable_product_discovery_reports",
  "use_only_approved_discovery_sources",
  "preserve_source_traceability",
  "preserve_audit_history",
  "distinguish_facts_from_assumptions",
  "score_confidence",
  "submit_reports_through_executive_reporting_runtime",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "product_discovery_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
