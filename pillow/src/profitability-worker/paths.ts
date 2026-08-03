/** PILLOW-PRFW-001 — Profitability Worker (Q9-05). */
export const PROFITABILITY_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_PROFITABILITY_WORKER_SYSTEM.md" as const;
export const PROFITABILITY_WORKER_ID = "profitability-worker" as const;
export const PRFW_METADATA_VERSION = "PRFW-001-v1" as const;
export const PROFITABILITY_REPORT_VERSION = "PRFW-RPT-v1" as const;

export const PROFITABILITY_WORKER_IDENTITY = {
  workerId: "wkr-profitability-01",
  workerName: "Profitability Worker",
  workerType: "profitability_analyst",
  department: "capital",
  factory: "capital-factory",
  role: "role-analyst-profitability",
  reportingLine: ["wkr-profitability-01", "pillow"] as string[],
  skillProfile: [
    "skill-revenue-aggregation",
    "skill-cost-aggregation",
    "skill-fee-aggregation",
    "skill-refund-aggregation",
    "skill-tax-provisioning",
    "skill-gross-profit-calculation",
    "skill-operating-profit-calculation",
    "skill-net-profit-calculation",
    "skill-shared-cost-allocation",
    "skill-business-profitability-analysis",
    "skill-product-profitability-analysis",
    "skill-project-profitability-analysis",
    "skill-profit-driver-identification",
    "skill-loss-driver-identification",
    "skill-profitability-ranking",
    "skill-profitability-reporting",
    "skill-traceability",
  ],
  approvedTools: ["profitability_registry", "profitability_ranking_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "consuming_records",
  "calculating_gross",
  "calculating_operating",
  "calculating_net",
  "allocating_costs",
  "ranking",
  "identifying_drivers",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const AUDIT_STATUSES = ["not_audited", "pending", "passed", "partial", "failed"] as const;

/**
 * Profit-and-loss line-item classifications recognised by the Profitability
 * Worker — never fabricated. Every `FinancialLineItem` consumed by the
 * worker must be tagged with exactly one of these categories by the
 * verified upstream source (never inferred by the Profitability Worker
 * itself from raw, uncategorised ledger debit/credit lines).
 */
export const COST_CATEGORIES = [
  "revenue",
  "discount",
  "refund",
  "cogs",
  "opex",
  "advertising",
  "platform_fee",
  "payment_fee",
  "tax",
  "shared_cost",
  "other",
] as const;

/** Fee categories tracked distinctly in the Fee Summary. */
export const FEE_TYPES = ["platform_fee", "payment_fee"] as const;

/** Scope a profitability analysis or Profitability Report may be produced at. */
export const ANALYSIS_SCOPES = ["business", "product", "project", "factory", "enterprise"] as const;

/** Multi-currency extension points — SGD is the default operating currency. */
export const CURRENCIES = ["USD", "SGD", "EUR", "GBP", "PHP", "UNKNOWN"] as const;
export const DEFAULT_CURRENCY: (typeof CURRENCIES)[number] = "SGD";

export const INTEGRATION_TARGETS = [
  "capital_factory_core",
  "accounting_worker",
  "cashflow_worker",
  "budget_planning_worker",
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "executive_reporting_runtime",
  "audit_runtime",
  "worker_recovery_system",
] as const;

export const PRFW_CAPABILITIES = [
  "consume_verified_accounting_records",
  "consume_verified_cashflow_reports",
  "consume_verified_budget_reports",
  "calculate_gross_profit",
  "calculate_operating_profit",
  "calculate_net_profit",
  "allocate_shared_operational_costs",
  "analyse_profitability_by_business",
  "analyse_profitability_by_product",
  "analyse_profitability_by_project",
  "identify_profit_drivers",
  "identify_loss_drivers",
  "rank_profitability",
  "produce_profitability_reports",
  "support_multiple_businesses_simultaneously",
  "support_multiple_currencies",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_historical_profitability_reports",
  "preserve_audit_history",
  "never_fabricate_revenue_cost_fee_refund_or_profitability_figures",
  "never_forecast_future_profitability",
  "never_approve_spending",
  "never_execute_financial_transactions",
  "never_replace_forecasting_worker",
  "never_modify_accounting_records",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q906_or_later",
  "integrate_capital_factory_core",
  "integrate_accounting_worker",
  "integrate_cashflow_worker",
  "integrate_budget_planning_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_executive_reporting_runtime",
  "integrate_audit_runtime",
  "integrate_worker_recovery_system",
  "profitability_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q906_consumable_contract",
] as const;
