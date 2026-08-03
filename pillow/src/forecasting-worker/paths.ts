/** PILLOW-FRCW-001 — Forecasting Worker (Q9-06). */
export const FORECASTING_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_FORECASTING_WORKER_SYSTEM.md" as const;
export const FORECASTING_WORKER_ID = "forecasting-worker" as const;
export const FRCW_METADATA_VERSION = "FRCW-001-v1" as const;
export const FORECASTING_REPORT_VERSION = "FRCW-RPT-v1" as const;

export const FORECASTING_WORKER_IDENTITY = {
  workerId: "wkr-forecasting-01",
  workerName: "Forecasting Worker",
  workerType: "forecasting_analyst",
  department: "capital",
  factory: "capital-factory",
  role: "role-analyst-forecasting",
  reportingLine: ["wkr-forecasting-01", "pillow"] as string[],
  skillProfile: [
    "skill-historical-trend-analysis",
    "skill-revenue-forecasting",
    "skill-cost-forecasting",
    "skill-cashflow-forecasting",
    "skill-cash-runway-estimation",
    "skill-profit-forecasting",
    "skill-reinvestment-recommendation",
    "skill-scenario-modelling",
    "skill-sensitivity-analysis",
    "skill-forecasting-reporting",
    "skill-traceability",
  ],
  approvedTools: ["forecast_registry", "scenario_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "consuming_records",
  "forecasting_revenue",
  "forecasting_costs",
  "forecasting_cashflow",
  "estimating_runway",
  "forecasting_profit",
  "modelling_reinvestment",
  "comparing_scenarios",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const AUDIT_STATUSES = ["not_audited", "pending", "passed", "partial", "failed"] as const;

/**
 * Metrics recognised on a `HistoricalPoint`/`ForecastPoint` — never fabricated.
 * Every historical point must arrive already tagged with exactly one of
 * these metrics by the verified upstream source (direct caller input or an
 * integrated worker) — the Forecasting Worker never infers a metric from
 * raw, uncategorised figures.
 */
export const FORECAST_METRICS = ["revenue", "cost", "cash", "profit", "net_cashflow", "closing_cash"] as const;

/**
 * Deterministic forecasting methodologies the Forecasting Worker applies.
 * `historical_trend` / `rolling` tag revenue and cost roll-forward
 * projections; `scenario` tags scenario-comparison output; `sensitivity`
 * tags sensitivity-analysis output; `growth_assumption` / `cost_assumption`
 * tag the derived-or-supplied growth-rate assumptions; `cash_runway` tags
 * runway-related assumptions; `profit_projection` tags profit forecasts;
 * `reinvestment` tags reinvestment-recommendation assumptions.
 */
export const FORECAST_MODELS = [
  "historical_trend",
  "rolling",
  "scenario",
  "sensitivity",
  "growth_assumption",
  "cost_assumption",
  "cash_runway",
  "profit_projection",
  "reinvestment",
] as const;

/** Scenario kinds every scenario-bearing forecast is produced across. */
export const SCENARIO_KINDS = ["best_case", "expected", "worst_case"] as const;

/** Multi-currency extension points — SGD is the default operating currency. */
export const CURRENCIES = ["USD", "SGD", "EUR", "GBP", "PHP", "UNKNOWN"] as const;
export const DEFAULT_CURRENCY: (typeof CURRENCIES)[number] = "SGD";

export const INTEGRATION_TARGETS = [
  "capital_factory_core",
  "accounting_worker",
  "cashflow_worker",
  "budget_planning_worker",
  "profitability_worker",
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "executive_reporting_runtime",
  "audit_runtime",
  "worker_recovery_system",
] as const;

export const FRCW_CAPABILITIES = [
  "consume_verified_historical_series",
  "consume_verified_accounting_records",
  "consume_verified_cashflow_reports",
  "consume_verified_budget_reports",
  "consume_verified_profitability_reports",
  "forecast_revenue",
  "forecast_costs",
  "forecast_cashflow",
  "estimate_cash_runway",
  "forecast_profitability",
  "recommend_reinvestment_options",
  "compare_scenarios",
  "run_sensitivity_analysis",
  "produce_forecasting_reports",
  "support_multiple_businesses_simultaneously",
  "support_multiple_currencies",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_forecast_history",
  "preserve_audit_history",
  "never_fabricate_historical_financial_data",
  "never_present_forecasts_as_guaranteed_outcomes",
  "never_execute_investments",
  "never_approve_budgets",
  "never_replace_investment_planning_worker",
  "never_modify_accounting_records",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q907_or_later",
  "integrate_capital_factory_core",
  "integrate_accounting_worker",
  "integrate_cashflow_worker",
  "integrate_budget_planning_worker",
  "integrate_profitability_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_executive_reporting_runtime",
  "integrate_audit_runtime",
  "integrate_worker_recovery_system",
  "forecasting_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q907_consumable_contract",
] as const;
