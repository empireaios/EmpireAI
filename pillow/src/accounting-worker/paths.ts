/** PILLOW-ACCW-001 — Accounting Worker (Q9-02). */
export const ACCOUNTING_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_ACCOUNTING_WORKER_SYSTEM.md" as const;
export const ACCOUNTING_WORKER_ID = "accounting-worker" as const;
export const ACCW_METADATA_VERSION = "ACCW-001-v1" as const;
export const ACCOUNTING_REPORT_VERSION = "ACCW-RPT-v1" as const;

export const ACCOUNTING_WORKER_IDENTITY = {
  workerId: "wkr-accounting-01",
  workerName: "Accounting Worker",
  workerType: "accountant",
  department: "capital",
  factory: "capital-factory",
  role: "role-accountant-capital-factory",
  reportingLine: ["wkr-accounting-01", "pillow"] as string[],
  skillProfile: [
    "skill-chart-of-accounts-maintenance",
    "skill-income-recording",
    "skill-expense-recording",
    "skill-asset-maintenance",
    "skill-liability-maintenance",
    "skill-fund-transfer-posting",
    "skill-general-ledger-posting",
    "skill-financial-summary-reporting",
    "skill-traceability",
  ],
  approvedTools: ["ledger_registry", "journal_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "recording_income",
  "recording_expense",
  "maintaining_assets",
  "maintaining_liabilities",
  "recording_transfer",
  "posting_ledger",
  "summarizing",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const AUDIT_STATUSES = ["not_audited", "pending", "passed", "partial", "failed"] as const;

/** Chart-of-accounts categories — orchestrated as real ledger accounts, never fabricated. */
export const ACCOUNT_TYPES = ["income", "expense", "asset", "liability", "equity"] as const;

/** Journal entry classes recognised by the general ledger. */
export const ENTRY_TYPES = ["income", "expense", "asset", "liability", "transfer", "journal"] as const;

/** Multi-currency extension points — SGD is the default operating currency. */
export const CURRENCIES = ["USD", "SGD", "EUR", "GBP", "PHP", "UNKNOWN"] as const;
export const DEFAULT_CURRENCY: (typeof CURRENCIES)[number] = "SGD";

/** Standard chart-of-accounts seeded per business on first use — never fabricated transactions. */
export const STANDARD_CHART_OF_ACCOUNTS = [
  { accountType: "income", name: "Income" },
  { accountType: "expense", name: "Expenses" },
  { accountType: "asset", name: "Cash/Bank" },
  { accountType: "liability", name: "Accounts Payable" },
  { accountType: "equity", name: "Owner Equity" },
] as const;

export const INTEGRATION_TARGETS = [
  "capital_factory_core",
  "worker_registry",
  "worker_lifecycle",
  "executive_reporting_runtime",
  "worker_recovery_system",
  "audit_runtime",
] as const;

export const ACCW_CAPABILITIES = [
  "maintain_chart_of_accounts",
  "record_income",
  "record_expense",
  "maintain_assets",
  "maintain_liabilities",
  "record_transfers",
  "post_general_ledger_entries",
  "maintain_general_ledger",
  "generate_accounting_summaries",
  "produce_accounting_reports",
  "support_multiple_businesses_simultaneously",
  "support_multiple_currencies",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_immutable_accounting_history",
  "preserve_audit_history",
  "never_fabricate_accounting_records",
  "never_forecast_finances",
  "never_approve_investments",
  "never_replace_budget_planning_worker",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q903_or_later",
  "integrate_capital_factory_core",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_executive_reporting_runtime",
  "integrate_worker_recovery_system",
  "integrate_audit_runtime",
  "accounting_worker_validation",
  "health_monitoring",
  "recovery_management",
  "q903_consumable_contract",
] as const;
