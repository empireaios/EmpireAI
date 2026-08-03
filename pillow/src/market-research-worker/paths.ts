/** PILLOW-MRW-001 — Market Research Worker (Q2-04). */
export const MARKET_RESEARCH_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MARKET_RESEARCH_WORKER_SYSTEM.md" as const;
export const MARKET_RESEARCH_WORKER_ID = "market-research-worker" as const;
export const MRW_METADATA_VERSION = "MRW-001-v1" as const;
export const MARKET_RESEARCH_REPORT_VERSION = "MRW-RPT-v1" as const;

export const MARKET_RESEARCH_WORKER_IDENTITY = {
  workerId: "wkr-market-research-01",
  workerName: "Market Research Worker",
  workerType: "analyst",
  department: "strategy",
  factory: "empire-builder-factory",
  role: "role-analyst-market-research",
  reportingLine: [
    "wkr-market-research-01",
    "pillow",
  ] as string[],
  skillProfile: [
    "skill-research-synthesis",
    "skill-competitor-analysis",
    "skill-demand-assessment",
    "skill-opportunity-sizing",
  ],
  approvedTools: ["research_notebook", "evidence_ledger", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "researching",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const BUSINESS_TYPES = [
  "media",
  "commerce",
  "local_cleaning",
  "affiliate",
  "digital_product",
  "local_services",
  "saas",
  "agency",
  "unknown",
] as const;

export const EVIDENCE_KINDS = ["fact", "assumption"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const MRW_CAPABILITIES = [
  "research_market_demand",
  "research_market_size",
  "research_customer_problems",
  "research_customer_segments",
  "research_existing_competitors",
  "research_competitor_strengths",
  "research_competitor_weaknesses",
  "research_industry_trends",
  "research_opportunity_size",
  "research_barriers_to_entry",
  "research_market_risks",
  "produce_machine_readable_market_research_reports",
  "record_supporting_sources",
  "distinguish_facts_from_assumptions",
  "identify_missing_information",
  "produce_confidence_scores",
  "submit_findings_through_executive_reporting_runtime",
  "preserve_full_audit_history",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "market_research_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
