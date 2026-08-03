/** PILLOW-BPW-001 — Budget Planning Worker (Q9-04). */
export const BUDGET_PLANNING_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_BUDGET_PLANNING_WORKER_SYSTEM.md" as const;
export const BUDGET_PLANNING_WORKER_ID = "budget-planning-worker" as const;
export const BPW_METADATA_VERSION = "BPW-001-v1" as const;
export const BUDGET_PLANNING_REPORT_VERSION = "BPW-RPT-v1" as const;

export const BUDGET_PLANNING_WORKER_IDENTITY = {
  workerId: "wkr-budget-planning-01",
  workerName: "Budget Planning Worker",
  workerType: "budget_planning_analyst",
  department: "capital",
  factory: "capital-factory",
  role: "role-analyst-budget-planning",
  reportingLine: ["wkr-budget-planning-01", "pillow"] as string[],
  skillProfile: [
    "skill-project-budget-creation",
    "skill-business-budget-creation",
    "skill-advertising-budget-creation",
    "skill-infrastructure-budget-creation",
    "skill-budget-utilisation-tracking",
    "skill-budget-overrun-detection",
    "skill-budget-underutilisation-detection",
    "skill-actual-vs-budget-comparison",
    "skill-budget-adjustment-recommendation",
    "skill-budget-revision-history",
    "skill-budget-planning-reporting",
    "skill-traceability",
  ],
  approvedTools: ["budget_registry", "budget_variance_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "creating_budget",
  "tracking_utilisation",
  "detecting_variance",
  "recommending",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const AUDIT_STATUSES = ["not_audited", "pending", "passed", "partial", "failed"] as const;

/** Budget classification categories recognised by the Budget Planning Worker — never fabricated. */
export const BUDGET_CATEGORIES = [
  "project",
  "business",
  "advertising",
  "infrastructure",
  "operating_expenditure",
  "capital_expenditure",
  "department",
  "marketing",
  "unknown",
] as const;

/** Deterministic budgeting cadences supported by the Budget Planning Worker. */
export const BUDGET_PERIODS = ["annual", "quarterly", "monthly", "custom"] as const;

/** Governance/approval lifecycle a budget record may occupy. */
export const APPROVAL_STATUSES = [
  "draft",
  "planned",
  "pending_approval",
  "approved",
  "revised",
  "rejected",
  "archived",
  "unknown",
] as const;

/** Variance signals the Budget Planning Worker may surface — never invented. */
export const VARIANCE_SIGNALS = [
  "overspending",
  "underspending",
  "depletion_risk",
  "expenditure_spike",
  "category_variance",
  "period_variance",
  "efficiency_signal",
  "significant_deviation",
  "none",
] as const;

/** Scope a budget or Budget Planning Report may be produced at. */
export const BUDGET_SCOPES = ["project", "business", "department", "enterprise"] as const;

export const VARIANCE_SEVERITIES = ["low", "medium", "high", "critical"] as const;

export const RECOMMENDATION_ACTIONS = [
  "increase",
  "decrease",
  "reallocate",
  "monitor",
  "freeze",
  "investigate",
] as const;

/** Multi-currency extension points — SGD is the default operating currency. */
export const CURRENCIES = ["USD", "SGD", "EUR", "GBP", "PHP", "UNKNOWN"] as const;
export const DEFAULT_CURRENCY: (typeof CURRENCIES)[number] = "SGD";

export const INTEGRATION_TARGETS = [
  "capital_factory_core",
  "accounting_worker",
  "cashflow_worker",
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "executive_reporting_runtime",
  "audit_runtime",
  "worker_recovery_system",
] as const;

export const BPW_CAPABILITIES = [
  "consume_verified_accounting_records",
  "consume_verified_cashflow_reports",
  "create_project_budgets",
  "create_business_budgets",
  "create_advertising_budgets",
  "create_infrastructure_budgets",
  "create_department_budgets",
  "create_marketing_budgets",
  "track_budget_utilisation",
  "detect_budget_overruns",
  "detect_underutilised_budgets",
  "compare_actual_vs_budget",
  "recommend_budget_adjustments",
  "produce_budget_planning_reports",
  "support_multiple_businesses_simultaneously",
  "support_multiple_currencies",
  "preserve_budget_revision_history",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_historical_budget_revisions",
  "preserve_audit_history",
  "never_fabricate_budget_values_or_spending_data",
  "never_approve_expenditure",
  "never_execute_payments",
  "never_forecast_revenue",
  "never_replace_profitability_worker",
  "never_modify_accounting_records",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q905_or_later",
  "integrate_capital_factory_core",
  "integrate_accounting_worker",
  "integrate_cashflow_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_executive_reporting_runtime",
  "integrate_audit_runtime",
  "integrate_worker_recovery_system",
  "budget_planning_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q905_consumable_contract",
] as const;
