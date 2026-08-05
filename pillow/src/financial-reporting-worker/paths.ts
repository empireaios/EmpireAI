/** PILLOW-FRW-001 — Financial Reporting Worker (Q9-09). */
export const FINANCIAL_REPORTING_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_FINANCIAL_REPORTING_WORKER_SYSTEM.md" as const;
export const FINANCIAL_REPORTING_WORKER_ID = "financial-reporting-worker" as const;
export const FRW_METADATA_VERSION = "FRW-001-v1" as const;
export const FINANCIAL_REPORT_VERSION = "FRW-RPT-v1" as const;

export const FINANCIAL_REPORTING_WORKER_IDENTITY = {
  workerId: "wkr-financial-reporting-01",
  workerName: "Financial Reporting Worker",
  workerType: "financial_reporting_analyst",
  department: "capital",
  factory: "capital-factory",
  role: "role-analyst-financial-reporting",
  reportingLine: ["wkr-financial-reporting-01", "pillow"] as string[],
  skillProfile: [
    "skill-financial-consolidation",
    "skill-executive-dashboard-generation",
    "skill-kpi-computation",
    "skill-multi-source-reporting",
    "skill-traceability",
    "skill-capital-summary",
    "skill-structural-reporting",
  ],
  approvedTools: ["report_registry", "dashboard_builder", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "consuming_records",
  "consolidating",
  "dashboarding",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const AUDIT_STATUSES = ["not_audited", "pending", "passed", "partial", "failed"] as const;

export const REPORT_SECTION_KINDS = [
  "revenue",
  "expense",
  "cashflow",
  "budget",
  "profitability",
  "forecast",
  "investment",
  "tax_support",
  "capital",
  "enterprise_kpis",
  "executive_dashboard",
  "other_extension",
] as const;

export const DASHBOARD_WIDGET_KINDS = [
  "revenue_kpi",
  "expense_kpi",
  "cashflow_kpi",
  "budget_kpi",
  "profitability_kpi",
  "forecast_kpi",
  "investment_kpi",
  "tax_support_kpi",
  "capital_kpi",
  "net_profit_kpi",
  "margin_kpi",
  "other_extension",
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
  "investment_planning_worker",
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "executive_reporting_runtime",
  "audit_runtime",
  "worker_recovery_system",
] as const;

export const FRW_CAPABILITIES = [
  "consume_verified_accounting_records",
  "consume_verified_cashflow_reports",
  "consume_verified_budget_reports",
  "consume_verified_profitability_reports",
  "consume_verified_forecasting_reports",
  "consume_verified_tax_support_reports",
  "consume_verified_investment_planning_reports",
  "consolidate_financial_summaries",
  "generate_executive_dashboard",
  "generate_capital_summary",
  "compute_enterprise_kpis",
  "produce_financial_reports",
  "maintain_financial_report_history",
  "support_multiple_businesses_simultaneously",
  "support_multiple_currencies",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_report_history",
  "preserve_audit_history",
  "never_execute_financial_transactions",
  "never_approve_financial_decisions",
  "never_modify_accounting_records",
  "never_fabricate_financial_figures",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q910_or_later",
  "integrate_capital_factory_core",
  "integrate_accounting_worker",
  "integrate_cashflow_worker",
  "integrate_budget_planning_worker",
  "integrate_profitability_worker",
  "integrate_forecasting_worker",
  "integrate_tax_support_worker",
  "integrate_investment_planning_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_executive_reporting_runtime",
  "integrate_audit_runtime",
  "integrate_worker_recovery_system",
  "financial_reporting_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q910_consumable_contract",
] as const;
