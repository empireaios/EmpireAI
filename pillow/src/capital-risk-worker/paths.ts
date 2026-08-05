/** PILLOW-CAPRW-001 — Capital Risk Worker (Q9-10). */
export const CAPITAL_RISK_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_CAPITAL_RISK_WORKER_SYSTEM.md" as const;
export const CAPITAL_RISK_WORKER_ID = "capital-risk-worker" as const;
export const CAPRW_METADATA_VERSION = "CAPRW-001-v1" as const;
export const CAPITAL_RISK_REPORT_VERSION = "CAPRW-RPT-v1" as const;

export const CAPITAL_RISK_WORKER_IDENTITY = {
  workerId: "wkr-capital-risk-01",
  workerName: "Capital Risk Worker",
  workerType: "capital_risk_analyst",
  department: "capital",
  factory: "capital-factory",
  role: "role-analyst-capital-risk",
  reportingLine: ["wkr-capital-risk-01", "pillow"] as string[],
  skillProfile: [
    "skill-overspending-detection",
    "skill-cash-shortage-analysis",
    "skill-liquidity-risk-assessment",
    "skill-budget-overrun-detection",
    "skill-revenue-decline-analysis",
    "skill-margin-deterioration-detection",
    "skill-investment-risk-assessment",
    "skill-capital-concentration-analysis",
    "skill-executive-risk-reporting",
    "skill-traceability",
  ],
  approvedTools: ["risk_registry", "risk_scoring", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "consuming_records",
  "detecting_risks",
  "prioritising_risks",
  "dashboarding",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const AUDIT_STATUSES = ["not_audited", "pending", "passed", "partial", "failed"] as const;

export const RISK_CATEGORIES = [
  "overspending",
  "cash_shortage",
  "liquidity",
  "budget_overrun",
  "revenue_decline",
  "margin_deterioration",
  "negative_cashflow",
  "underperforming_investment",
  "capital_concentration",
  "financial_anomaly",
  "trend_risk",
  "other_extension",
] as const;

export const SEVERITY_LEVELS = ["info", "low", "medium", "high", "critical"] as const;
export const ESCALATION_LEVELS = ["monitor", "pillow", "grand_king"] as const;
export const RESOLUTION_STATUSES = ["open", "acknowledged", "mitigated", "closed"] as const;

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
  "financial_reporting_worker",
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "executive_reporting_runtime",
  "audit_runtime",
  "worker_recovery_system",
] as const;

export const CAPRW_CAPABILITIES = [
  "consume_verified_accounting_records",
  "consume_verified_cashflow_reports",
  "consume_verified_budget_reports",
  "consume_verified_profitability_reports",
  "consume_verified_forecasting_reports",
  "consume_verified_tax_support_reports",
  "consume_verified_investment_planning_reports",
  "consume_verified_financial_reporting_reports",
  "detect_capital_risks",
  "prioritise_risks_by_severity",
  "generate_executive_risk_dashboard",
  "generate_enterprise_risk_dashboard",
  "produce_capital_risk_reports",
  "maintain_risk_history",
  "support_multiple_businesses_simultaneously",
  "support_multiple_currencies",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_risk_history",
  "preserve_audit_history",
  "never_approve_financial_decisions",
  "never_execute_investments",
  "never_move_capital",
  "never_modify_accounting_records",
  "never_fabricate_risks_or_evidence",
  "never_automatically_execute_mitigation",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q911_or_later",
  "integrate_capital_factory_core",
  "integrate_accounting_worker",
  "integrate_cashflow_worker",
  "integrate_budget_planning_worker",
  "integrate_profitability_worker",
  "integrate_forecasting_worker",
  "integrate_tax_support_worker",
  "integrate_investment_planning_worker",
  "integrate_financial_reporting_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_executive_reporting_runtime",
  "integrate_audit_runtime",
  "integrate_worker_recovery_system",
  "capital_risk_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q911_consumable_contract",
] as const;
