/** PILLOW-OEW-001 — Opportunity Evaluation Worker (Q2-05). */
export const OPPORTUNITY_EVALUATION_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_OPPORTUNITY_EVALUATION_WORKER_SYSTEM.md" as const;
export const OPPORTUNITY_EVALUATION_WORKER_ID = "opportunity-evaluation-worker" as const;
export const OEW_METADATA_VERSION = "OEW-001-v1" as const;
export const OPPORTUNITY_EVALUATION_REPORT_VERSION = "OEW-RPT-v1" as const;

export const OPPORTUNITY_EVALUATION_WORKER_IDENTITY = {
  workerId: "wkr-opportunity-evaluation-01",
  workerName: "Opportunity Evaluation Worker",
  workerType: "analyst",
  department: "strategy",
  factory: "empire-builder-factory",
  role: "role-analyst-opportunity-evaluation",
  reportingLine: ["wkr-opportunity-evaluation-01", "pillow"] as string[],
  skillProfile: [
    "skill-opportunity-scoring",
    "skill-feasibility-analysis",
    "skill-risk-assessment",
    "skill-strategic-fit",
  ],
  approvedTools: ["evaluation_scorecard", "evidence_ledger", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "evaluating",
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

export const RECOMMENDATIONS = ["Proceed", "Improve", "Reject"] as const;
export const EVIDENCE_KINDS = ["fact", "assumption"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

/** Default weights sum to 1.0 — overall uses inverted risk contribution. */
export const DEFAULT_SCORE_WEIGHTS = {
  demand: 0.25,
  feasibility: 0.2,
  profitPotential: 0.2,
  risk: 0.15,
  strategicFit: 0.2,
} as const;

export const OEW_CAPABILITIES = [
  "receive_business_model",
  "receive_market_research_report",
  "evaluate_market_demand",
  "evaluate_implementation_feasibility",
  "evaluate_revenue_potential",
  "evaluate_profitability_potential",
  "evaluate_operational_complexity",
  "evaluate_execution_risk",
  "evaluate_strategic_fit_with_empireai",
  "generate_weighted_opportunity_scores",
  "recommend_proceed_improve_reject",
  "produce_machine_readable_opportunity_evaluation_reports",
  "explain_every_score",
  "distinguish_facts_from_assumptions",
  "preserve_complete_traceability",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_full_audit_history",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "opportunity_evaluation_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
