/** PILLOW-PEW-001 — Product Evaluation Worker (Q3-03). */
export const PRODUCT_EVALUATION_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PRODUCT_EVALUATION_WORKER_SYSTEM.md" as const;
export const PRODUCT_EVALUATION_WORKER_ID = "product-evaluation-worker" as const;
export const PEW_METADATA_VERSION = "PEW-001-v1" as const;
export const PRODUCT_EVALUATION_REPORT_VERSION = "PEW-RPT-v1" as const;

export const PRODUCT_EVALUATION_WORKER_IDENTITY = {
  workerId: "wkr-product-evaluation-01",
  workerName: "Product Evaluation Worker",
  workerType: "analyst",
  department: "commerce",
  factory: "commerce-factory",
  role: "role-analyst-product-evaluation",
  reportingLine: ["wkr-product-evaluation-01", "pillow"] as string[],
  skillProfile: [
    "skill-margin-scoring",
    "skill-demand-scoring",
    "skill-competition-scoring",
    "skill-shipping-risk-review",
    "skill-creative-potential",
  ],
  approvedTools: ["evaluation_ledger", "evidence_scoring", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "scoring",
  "recommending",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const RECOMMENDATIONS = ["Proceed", "Review", "Reject"] as const;

export const SCORE_DIMENSIONS = [
  "margin",
  "demand",
  "competition",
  "shipping",
  "risk",
  "review",
  "creative_potential",
  "overall",
] as const;

export const EVIDENCE_KINDS = ["fact", "assumption"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "product_discovery_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const PEW_CAPABILITIES = [
  "receive_discovered_products",
  "score_product_margin",
  "score_market_demand",
  "score_competition",
  "score_shipping_practicality",
  "score_operational_risk",
  "score_customer_review_quality",
  "score_creative_potential",
  "generate_overall_product_score",
  "recommend_proceed_review_or_reject",
  "produce_machine_readable_product_evaluation_reports",
  "base_evaluations_on_available_evidence",
  "preserve_traceability_to_product_discovery",
  "preserve_audit_history",
  "distinguish_facts_from_assumptions",
  "produce_confidence_scores",
  "submit_reports_through_executive_reporting_runtime",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_product_discovery_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "product_evaluation_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
