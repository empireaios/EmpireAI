/** PILLOW-LMRW-001 — Local Market Research Worker (Q7-02). */
export const LOCAL_MARKET_RESEARCH_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_LOCAL_MARKET_RESEARCH_WORKER_SYSTEM.md" as const;
export const LOCAL_MARKET_RESEARCH_WORKER_ID = "local-market-research-worker" as const;
export const LMRW_METADATA_VERSION = "LMRW-001-v1" as const;
export const LOCAL_MARKET_RESEARCH_REPORT_VERSION = "LMRW-RPT-v1" as const;

export const LOCAL_MARKET_RESEARCH_WORKER_IDENTITY = {
  workerId: "wkr-local-market-research-01",
  workerName: "Local Market Research Worker",
  workerType: "analyst",
  department: "local_business",
  factory: "local-business-factory",
  role: "role-analyst-local-market-research",
  reportingLine: ["wkr-local-market-research-01", "pillow"] as string[],
  skillProfile: [
    "skill-local-demand-research",
    "skill-local-competitor-profiling",
    "skill-local-pricing-signals",
    "skill-pain-point-gap-analysis",
    "skill-service-opportunity-assessment",
    "skill-market-attractiveness-assessment",
    "skill-evidence-classified-reporting",
  ],
  approvedTools: ["local_research_ledger", "evidence_ledger", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving_request",
  "researching_demand",
  "profiling_competitors",
  "researching_pricing",
  "identifying_gaps",
  "assessing_attractiveness",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const EVIDENCE_CLASSES = ["verified", "estimated", "inference", "unknown"] as const;
export const EVIDENCE_MODES = ["fixture", "sandbox", "cached", "live"] as const;

export const INTEGRATION_TARGETS = [
  "local_business_factory_core",
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const LMRW_CAPABILITIES = [
  "submit_research_request",
  "research_local_demand",
  "identify_customer_segments",
  "research_competitors",
  "profile_competitors",
  "research_competitor_services",
  "research_market_pricing",
  "identify_pain_points",
  "identify_service_gaps",
  "analyze_service_opportunities",
  "assess_market_attractiveness",
  "produce_local_market_research_reports",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_audit_history",
  "distinguish_evidence_classes",
  "label_evidence_modes",
  "never_finalize_service_packages",
  "never_set_final_prices",
  "never_make_launch_decisions",
  "never_fabricate_demand_pricing_or_competitor_data",
  "integrate_local_business_factory_core",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_executive_reporting_runtime",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "local_market_research_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q703_consumable_contract",
] as const;
