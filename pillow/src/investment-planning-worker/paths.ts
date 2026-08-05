/** PILLOW-IPW-001 — Investment Planning Worker (Q9-08). */
export const INVESTMENT_PLANNING_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_INVESTMENT_PLANNING_WORKER_SYSTEM.md" as const;
export const INVESTMENT_PLANNING_WORKER_ID = "investment-planning-worker" as const;
export const IPW_METADATA_VERSION = "IPW-001-v1" as const;
export const INVESTMENT_PLANNING_REPORT_VERSION = "IPW-RPT-v1" as const;

export const INVESTMENT_PLANNING_WORKER_IDENTITY = {
  workerId: "wkr-investment-planning-01",
  workerName: "Investment Planning Worker",
  workerType: "investment_planning_analyst",
  department: "capital",
  factory: "capital-factory",
  role: "role-analyst-investment-planning",
  reportingLine: ["wkr-investment-planning-01", "pillow"] as string[],
  skillProfile: [
    "skill-opportunity-evaluation",
    "skill-capital-allocation-analysis",
    "skill-roi-comparison",
    "skill-risk-adjusted-ranking",
    "skill-strategic-alignment-assessment",
    "skill-investment-planning-reporting",
    "skill-traceability",
    "skill-alternative-comparison",
  ],
  approvedTools: ["investment_registry", "opportunity_scoring", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "consuming_records",
  "evaluating_opportunities",
  "ranking_opportunities",
  "assessing_risks",
  "comparing_alternatives",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const AUDIT_STATUSES = ["not_audited", "pending", "passed", "partial", "failed"] as const;

export const OPPORTUNITY_TYPES = [
  "reinvestment",
  "capital_allocation",
  "internal_project",
  "business_expansion",
  "infrastructure",
  "marketing",
  "other_extension",
] as const;

export const RECOMMENDATION_KINDS = ["recommend", "defer", "reject", "monitor"] as const;

export const SCORING_WEIGHT_KEYS = [
  "roiBps",
  "strategicAlignmentBps",
  "paybackBps",
  "riskAdjustedBps",
] as const;

export const CURRENCIES = ["USD", "SGD", "EUR", "GBP", "PHP", "UNKNOWN"] as const;
export const DEFAULT_CURRENCY: (typeof CURRENCIES)[number] = "SGD";

export const INTEGRATION_TARGETS = [
  "capital_factory_core",
  "accounting_worker",
  "cashflow_worker",
  "budget_planning_worker",
  "profitability_worker",
  "forecasting_worker",
  "tax_support_worker",
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "executive_reporting_runtime",
  "audit_runtime",
  "worker_recovery_system",
] as const;

export const IPW_CAPABILITIES = [
  "consume_verified_accounting_records",
  "consume_verified_cashflow_reports",
  "consume_verified_profitability_reports",
  "consume_verified_forecasting_reports",
  "consume_verified_tax_support_reports",
  "consume_verified_budget_reports",
  "evaluate_investment_opportunities",
  "compare_investment_alternatives",
  "rank_opportunities_by_score",
  "assess_investment_risks",
  "generate_capital_allocation_recommendations",
  "maintain_investment_planning_history",
  "produce_investment_planning_reports",
  "support_multiple_businesses_simultaneously",
  "support_multiple_currencies",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_investment_history",
  "preserve_audit_history",
  "never_execute_investments",
  "never_approve_investments",
  "never_move_or_allocate_capital",
  "never_modify_accounting_records",
  "never_fabricate_roi_or_payback_or_recommendations",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q909_or_later",
  "integrate_capital_factory_core",
  "integrate_accounting_worker",
  "integrate_cashflow_worker",
  "integrate_budget_planning_worker",
  "integrate_profitability_worker",
  "integrate_forecasting_worker",
  "integrate_tax_support_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_executive_reporting_runtime",
  "integrate_audit_runtime",
  "integrate_worker_recovery_system",
  "investment_planning_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q909_consumable_contract",
] as const;
