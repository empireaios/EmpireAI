/** PILLOW-TSW-001 — Tax Support Worker (Q9-07). */
export const TAX_SUPPORT_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_TAX_SUPPORT_WORKER_SYSTEM.md" as const;
export const TAX_SUPPORT_WORKER_ID = "tax-support-worker" as const;
export const TSW_METADATA_VERSION = "TSW-001-v1" as const;
export const TAX_SUPPORT_REPORT_VERSION = "TSW-RPT-v1" as const;

export const TAX_SUPPORT_WORKER_IDENTITY = {
  workerId: "wkr-tax-support-01",
  workerName: "Tax Support Worker",
  workerType: "tax_support_analyst",
  department: "capital",
  factory: "capital-factory",
  role: "role-analyst-tax-support",
  reportingLine: ["wkr-tax-support-01", "pillow"] as string[],
  skillProfile: [
    "skill-tax-support-record-organisation",
    "skill-income-summary",
    "skill-expense-summary",
    "skill-tax-category-summary",
    "skill-document-tracking",
    "skill-missing-document-detection",
    "skill-filing-reminder-scheduling",
    "skill-professional-review-flagging",
    "skill-tax-support-reporting",
    "skill-traceability",
  ],
  approvedTools: ["tax_support_registry", "document_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "consuming_records",
  "organising_records",
  "preparing_summaries",
  "detecting_missing_docs",
  "scheduling_reminders",
  "flagging_review",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const AUDIT_STATUSES = ["not_audited", "pending", "passed", "partial", "failed"] as const;

/**
 * Tax-support category tags recognised on verified financial records.
 * Categories organise support data only — they never imply a calculated tax
 * obligation, filing position, or legal advice.
 */
export const TAX_SUPPORT_CATEGORIES = [
  "income_revenue",
  "income_other",
  "expense_cogs",
  "expense_opex",
  "expense_payroll",
  "expense_advertising",
  "expense_fees",
  "tax_withholding_recorded",
  "tax_provision_recorded",
  "capital",
  "transfer",
  "other",
] as const;

/** Document kinds tracked for tax-support evidence completeness. */
export const DOCUMENT_KINDS = [
  "invoice",
  "receipt",
  "bank_statement",
  "payroll_record",
  "contract",
  "prior_return",
  "identity",
  "other",
] as const;

/** Reminder kinds — calendar/support reminders only, never filing instructions. */
export const REMINDER_KINDS = [
  "period_close",
  "document_gathering",
  "professional_review",
  "filing_window",
  "extension_checkpoint",
] as const;

/** Professional-review flag reasons — structural signals only. */
export const REVIEW_FLAG_REASONS = [
  "missing_documentation",
  "multi_currency_present",
  "uncategorised_transactions",
  "high_value_transaction",
  "jurisdiction_extension_point",
  "incomplete_period_coverage",
] as const;

export const CURRENCIES = ["USD", "SGD", "EUR", "GBP", "PHP", "UNKNOWN"] as const;
export const DEFAULT_CURRENCY: (typeof CURRENCIES)[number] = "SGD";

export const INTEGRATION_TARGETS = [
  "capital_factory_core",
  "accounting_worker",
  "cashflow_worker",
  "profitability_worker",
  "forecasting_worker",
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "executive_reporting_runtime",
  "audit_runtime",
  "worker_recovery_system",
] as const;

export const TSW_CAPABILITIES = [
  "consume_verified_accounting_records",
  "consume_verified_cashflow_reports",
  "consume_verified_profitability_reports",
  "consume_verified_forecasting_reports",
  "organise_tax_support_records",
  "prepare_income_summaries",
  "prepare_expense_summaries",
  "prepare_tax_category_summaries",
  "track_tax_support_documents",
  "detect_missing_documentation",
  "generate_filing_reminders",
  "flag_professional_review_items",
  "maintain_tax_support_history",
  "produce_tax_support_reports",
  "support_multiple_businesses_simultaneously",
  "support_multiple_currencies",
  "jurisdiction_extension_points",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_tax_support_history",
  "preserve_audit_history",
  "never_provide_legal_or_tax_advice",
  "never_fabricate_tax_calculations_or_obligations",
  "never_submit_filings_automatically",
  "never_replace_accountants_or_tax_professionals",
  "never_modify_accounting_records",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q908_or_later",
  "integrate_capital_factory_core",
  "integrate_accounting_worker",
  "integrate_cashflow_worker",
  "integrate_profitability_worker",
  "integrate_forecasting_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_executive_reporting_runtime",
  "integrate_audit_runtime",
  "integrate_worker_recovery_system",
  "tax_support_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q908_consumable_contract",
] as const;
