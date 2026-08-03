/** PILLOW-CFW-001 — Cashflow Worker (Q9-03). */
export const CASHFLOW_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CASHFLOW_WORKER_SYSTEM.md" as const;
export const CASHFLOW_WORKER_ID = "cashflow-worker" as const;
export const CFW_METADATA_VERSION = "CFW-001-v1" as const;
export const CASHFLOW_REPORT_VERSION = "CFW-RPT-v1" as const;

export const CASHFLOW_WORKER_IDENTITY = {
  workerId: "wkr-cashflow-01",
  workerName: "Cashflow Worker",
  workerType: "cashflow_analyst",
  department: "capital",
  factory: "capital-factory",
  role: "role-analyst-cashflow",
  reportingLine: ["wkr-cashflow-01", "pillow"] as string[],
  skillProfile: [
    "skill-cash-inflow-tracking",
    "skill-cash-outflow-tracking",
    "skill-opening-closing-balance-maintenance",
    "skill-transfer-reconciliation",
    "skill-liquidity-monitoring",
    "skill-period-over-period-comparison",
    "skill-cashflow-reporting",
    "skill-traceability",
  ],
  approvedTools: ["cashflow_registry", "cash_movement_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "consuming_records",
  "tracking_inflows",
  "tracking_outflows",
  "calculating",
  "reconciling",
  "comparing",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const AUDIT_STATUSES = ["not_audited", "pending", "passed", "partial", "failed"] as const;

/** Cash movement classifications recognised by the Cashflow Worker — never fabricated. */
export const CASH_MOVEMENT_DIRECTIONS = ["inflow", "outflow", "transfer_in", "transfer_out"] as const;

/** Reconciliation state of an individual movement or aggregate total. */
export const AMOUNT_STATUSES = ["recorded", "reconciled", "pending", "disputed"] as const;

/** Deterministic reporting cadences supported by the Cashflow Worker. */
export const REPORTING_FREQUENCIES = ["daily", "weekly", "monthly", "annual", "custom"] as const;

/** Scopes a cashflow view or report may be produced at. */
export const CASHFLOW_SCOPES = ["account", "business", "factory", "enterprise"] as const;

/** Liquidity health classifications for a cashflow view/report. */
export const LIQUIDITY_STATUSES = [
  "healthy",
  "adequate",
  "tight",
  "critical",
  "unknown",
  "unreconciled",
] as const;

/** Reconciliation posture across the movements underlying a view/report. */
export const RECONCILIATION_STATUSES = [
  "reconciled",
  "partial",
  "unreconciled",
  "disputed",
  "pending",
] as const;

/** Multi-currency extension points — SGD is the default operating currency. */
export const CURRENCIES = ["USD", "SGD", "EUR", "GBP", "PHP", "UNKNOWN"] as const;
export const DEFAULT_CURRENCY: (typeof CURRENCIES)[number] = "SGD";

export const INTEGRATION_TARGETS = [
  "capital_factory_core",
  "accounting_worker",
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "executive_reporting_runtime",
  "audit_runtime",
  "worker_recovery_system",
] as const;

export const CFW_CAPABILITIES = [
  "consume_verified_accounting_records",
  "track_cash_inflows",
  "track_cash_outflows",
  "calculate_net_cashflow",
  "maintain_opening_closing_balances",
  "produce_daily_cashflow_views",
  "produce_weekly_cashflow_views",
  "produce_monthly_cashflow_views",
  "produce_annual_cashflow_views",
  "produce_custom_cashflow_views",
  "produce_business_level_cashflow_views",
  "produce_consolidated_cashflow_views",
  "identify_unreconciled_movements",
  "compare_periods",
  "produce_cashflow_reports",
  "support_multiple_businesses_simultaneously",
  "support_multiple_currencies",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_historical_reports",
  "preserve_audit_history",
  "never_fabricate_balances_or_flows",
  "never_create_budgets",
  "never_forecast_future_cashflow",
  "never_calculate_complete_business_profitability",
  "never_approve_spending",
  "never_move_money",
  "never_modify_verified_accounting_records",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q904_or_later",
  "integrate_capital_factory_core",
  "integrate_accounting_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_executive_reporting_runtime",
  "integrate_audit_runtime",
  "integrate_worker_recovery_system",
  "cashflow_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q904_consumable_contract",
] as const;
