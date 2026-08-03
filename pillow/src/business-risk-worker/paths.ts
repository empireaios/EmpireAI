/** PILLOW-BRW-001 — Business Risk Worker (Q2-08). */
export const BUSINESS_RISK_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_BUSINESS_RISK_WORKER_SYSTEM.md" as const;
export const BUSINESS_RISK_WORKER_ID = "business-risk-worker" as const;
export const BRW_METADATA_VERSION = "BRW-001-v1" as const;
export const BUSINESS_RISK_REPORT_VERSION = "BRW-RPT-v1" as const;

export const BUSINESS_RISK_WORKER_IDENTITY = {
  workerId: "wkr-business-risk-01",
  workerName: "Business Risk Worker",
  workerType: "analyst",
  department: "strategy",
  factory: "empire-builder-factory",
  role: "role-analyst-business-risk",
  reportingLine: ["wkr-business-risk-01", "pillow"] as string[],
  skillProfile: [
    "skill-risk-identification",
    "skill-risk-scoring",
    "skill-mitigation-recommendation",
    "skill-evidence-synthesis",
  ],
  approvedTools: ["risk_register", "evidence_ledger", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "assessing",
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

/** Minimum risk categories — architecture supports additional categories via config. */
export const RISK_CATEGORIES = [
  "legal",
  "operational",
  "financial",
  "brand",
  "marketplace_platform",
  "supplier",
  "technical",
  "security",
  "compliance",
  "execution",
] as const;

export const LIKELIHOOD_LEVELS = ["low", "moderate", "high"] as const;
export const IMPACT_LEVELS = ["low", "moderate", "high"] as const;
export const OVERALL_RISK_RATINGS = ["low", "moderate", "high", "critical"] as const;
export const EVIDENCE_KINDS = ["fact", "assumption"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "business_blueprint_worker",
  "launch_plan_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const BRW_CAPABILITIES = [
  "receive_approved_business_blueprint",
  "receive_launch_plan",
  "identify_legal_risks",
  "identify_operational_risks",
  "identify_financial_risks",
  "identify_brand_and_reputation_risks",
  "identify_marketplace_platform_risks",
  "identify_supplier_risks",
  "identify_technical_risks",
  "identify_execution_risks",
  "assign_likelihood_and_impact_scores",
  "assign_overall_risk_ratings",
  "recommend_mitigation_actions",
  "produce_machine_readable_business_risk_reports",
  "preserve_complete_traceability",
  "base_findings_on_available_evidence",
  "distinguish_confirmed_risks_from_assumptions",
  "prioritize_risks_by_severity",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_full_audit_history",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_business_blueprint_worker",
  "integrate_launch_plan_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "business_risk_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
