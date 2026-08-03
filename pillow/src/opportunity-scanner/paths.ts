/** PILLOW-OSC-001 — Opportunity Scanner (Q0-02). */
export const OPPORTUNITY_SCANNER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_OPPORTUNITY_SCANNER_SYSTEM.md" as const;
export const OPPORTUNITY_SCANNER_ID = "opportunity-scanner" as const;
export const OSC_METADATA_VERSION = "OSC-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "scanning",
  "scoring",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const OPPORTUNITY_CATEGORIES = ["business", "operational"] as const;
export const REVIEW_STATUSES = ["pending_pillow_review", "reviewed", "deferred", "rejected"] as const;

/** Configurable opportunity domains the scanner can target. */
export const DEFAULT_OPPORTUNITY_DOMAINS = [
  "market_expansion",
  "product_innovation",
  "revenue_growth",
  "cost_efficiency",
  "process_automation",
  "customer_retention",
  "supply_chain",
  "talent_leverage",
  "compliance_optimization",
  "capital_allocation",
] as const;

export const OSC_CAPABILITIES = [
  "accept_configured_opportunity_domains",
  "scan_business_opportunities",
  "scan_operational_improvement_opportunities",
  "normalize_opportunity_records",
  "score_relevance",
  "score_potential_value",
  "score_feasibility",
  "score_confidence",
  "score_risk",
  "mark_pending_pillow_review",
  "machine_readable_opportunity_output",
  "preserve_traceability",
  "preserve_auditability",
  "opportunity_validation",
  "health_monitoring",
  "recovery_management",
] as const;
