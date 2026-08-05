/** PILLOW-FINART-001 — Financial Readiness Audit (Q11-08). Eighth Q11 acceptance gate. */
export const FINANCIAL_READINESS_AUDIT_SYSTEM_PATH =
  "docs/governance/EMPIREAI_FINANCIAL_READINESS_AUDIT_SYSTEM.md" as const;
export const FINANCIAL_READINESS_AUDIT_ID = "financial-readiness-audit" as const;
export const FINART_METADATA_VERSION = "FINART-001-v1" as const;
export const FINANCIAL_READINESS_AUDIT_REPORT_VERSION = "FINART-RPT-v1" as const;
export const FINART_MISSION_ID = "Q11-08" as const;
export const FINANCIAL_READINESS_AUDIT_RUNTIME_VERSION = "Q11-FINART-v1" as const;

export const FINANCIAL_READINESS_AUDIT_IDENTITY = {
  workerId: "wkr-financial-readiness-audit-01",
  workerName: "Financial Readiness Audit",
  workerType: "auditor",
  department: "financial_readiness_audit",
  factory: "financial-readiness-audit",
  role: "role-auditor-financial-readiness-audit",
  reportingLine: ["wkr-financial-readiness-audit-01", "pillow"] as string[],
  skillProfile: [
    "skill-financial-component-discovery",
    "skill-payment-workflow-verification",
    "skill-revenue-recording-verification",
    "skill-expense-tracking-verification",
    "skill-accounting-records-verification",
    "skill-financial-reporting-verification",
    "skill-cost-control-verification",
    "skill-financial-governance-verification",
    "skill-audit-traceability-verification",
    "skill-financial-readiness-classification",
    "skill-financial-readiness-audit-reporting",
  ],
  approvedTools: ["repository_evidence_scanner", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "discovering_financial_components",
  "verifying_payment_workflows",
  "verifying_revenue_recording",
  "verifying_expense_tracking",
  "verifying_accounting_records",
  "verifying_financial_reporting",
  "verifying_cost_controls",
  "verifying_financial_governance",
  "verifying_audit_traceability",
  "classifying_financial_readiness",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Per-check structural outcome — derived strictly from capability-presence evidence. */
export const CHECK_STATUSES = ["Passed", "Partial", "Failed", "Missing"] as const;

/** Per-component financial readiness classification. */
export const READINESS_CLASSIFICATIONS = [
  "certified",
  "partially_certified",
  "failed",
  "missing",
  "blocked",
  "deferred",
] as const;

/** Overall audit decision. */
export const READINESS_DECISIONS = ["certify", "withhold", "escalate", "defer"] as const;

export const AUDIT_STATUSES = [
  "draft",
  "financial_components_discovered",
  "evidence_collected",
  "financial_readiness_assessed",
  "certified",
  "partially_certified",
  "failed",
  "missing",
  "blocked",
  "deferred",
  "submitted",
  "rejected",
  "unknown",
] as const;

/**
 * Evidence-backed financial component catalog. Discovery walks this fixed,
 * read-only key list and checks binding presence on injected dependencies
 * only — targets are never invented beyond this catalog.
 */
export const FINANCIAL_COMPONENT_KEYS = [
  "commerce-factory-core",
  "payment-gateway-integration",
  "billing-worker",
  "revenue-engine",
  "expense-engine",
  "accounting-worker",
  "financial-reporting-worker",
  "profit-calculation-engine",
  "audit-runtime",
  "executive-reporting-runtime",
  "production-certification-core",
  "api-runtime",
  "monitoring-runtime",
] as const;

export const OPTIONAL_FINANCIAL_COMPONENT_KEYS = [
  "refund-engine",
  "reconciliation-engine",
  "capital-factory-core",
  "financial-operations-certification",
  "financial-risk-monitor",
] as const;

export const ALL_FINANCIAL_COMPONENT_KEYS = [
  ...FINANCIAL_COMPONENT_KEYS,
  ...OPTIONAL_FINANCIAL_COMPONENT_KEYS,
] as const;

export const FINANCIAL_COMPONENT_LABELS: Record<(typeof ALL_FINANCIAL_COMPONENT_KEYS)[number], string> = {
  "commerce-factory-core": "Commerce Factory Core",
  "payment-gateway-integration": "Payment Gateway Integration",
  "billing-worker": "Billing Worker",
  "revenue-engine": "Revenue Engine",
  "expense-engine": "Expense Engine",
  "accounting-worker": "Accounting Worker",
  "financial-reporting-worker": "Financial Reporting Worker",
  "profit-calculation-engine": "Profit Calculation Engine",
  "audit-runtime": "Audit Runtime",
  "executive-reporting-runtime": "Executive Reporting Runtime",
  "production-certification-core": "Production Certification Core",
  "api-runtime": "API Runtime",
  "monitoring-runtime": "Monitoring Runtime",
  "refund-engine": "Refund Engine",
  "reconciliation-engine": "Reconciliation Engine",
  "capital-factory-core": "Capital Factory Core",
  "financial-operations-certification": "Financial Operations Certification",
  "financial-risk-monitor": "Financial Risk Monitor",
};

export const FINANCIAL_COMPONENT_TYPES: Record<(typeof ALL_FINANCIAL_COMPONENT_KEYS)[number], string> = {
  "commerce-factory-core": "commerce_financial_foundation",
  "payment-gateway-integration": "payment_gateway_capability",
  "billing-worker": "billing_workflow_capability",
  "revenue-engine": "revenue_recording_capability",
  "expense-engine": "expense_tracking_capability",
  "accounting-worker": "accounting_records_capability",
  "financial-reporting-worker": "financial_reporting_capability",
  "profit-calculation-engine": "cost_control_capability",
  "audit-runtime": "financial_audit_trail",
  "executive-reporting-runtime": "financial_executive_reporting",
  "production-certification-core": "certification_signal",
  "api-runtime": "financial_api_integration",
  "monitoring-runtime": "financial_monitoring_signal",
  "refund-engine": "refund_capability",
  "reconciliation-engine": "reconciliation_capability",
  "capital-factory-core": "capital_factory_signal",
  "financial-operations-certification": "financial_operations_certification",
  "financial-risk-monitor": "financial_risk_monitoring",
};

/** Safe structural probe methods — presence-checked via typeof only; NEVER invoked if mutating. */
export const FINANCIAL_COMPONENT_PROBES: Record<(typeof ALL_FINANCIAL_COMPONENT_KEYS)[number], string[]> = {
  "commerce-factory-core": ["getState", "connectCommerceFactoryCore", "validateCommerceFactoryCore"],
  "payment-gateway-integration": ["getState", "processPaymentAuthorization", "processPaymentCapture"],
  "billing-worker": ["getState", "generateInvoices", "recordBillingTransactions"],
  "revenue-engine": ["getState", "recordRevenueEvent"],
  "expense-engine": ["getState", "recordExpenseEvent", "aggregateExpenses"],
  "accounting-worker": ["getState", "postJournalEntry", "generateAccountingSummary"],
  "financial-reporting-worker": ["getState", "produceReport", "submitReport"],
  "profit-calculation-engine": ["getState", "calculateProfit", "aggregateProfit"],
  "audit-runtime": ["getState", "query"],
  "executive-reporting-runtime": ["getState", "submitWorkerReport"],
  "production-certification-core": ["getState", "getCertificationResults"],
  "api-runtime": ["getState"],
  "monitoring-runtime": ["getState", "getDashboard"],
  "refund-engine": ["getState", "processRefund"],
  "reconciliation-engine": ["getState", "reconcileAccounts"],
  "capital-factory-core": ["getState"],
  "financial-operations-certification": ["getState", "getCertificationResults"],
  "financial-risk-monitor": ["getState", "assessRisk"],
};

export const REQUIRED_FINANCIAL_COMPONENT_KEYS = [
  "payment-gateway-integration",
  "revenue-engine",
  "audit-runtime",
] as const;

export const INTEGRATION_TARGETS = [
  "recovery_audit",
  "production_certification_core",
  "commerce_factory_core",
  "payment_gateway_integration",
  "billing_worker",
  "revenue_engine",
  "expense_engine",
  "accounting_worker",
  "financial_reporting_worker",
  "profit_calculation_engine",
  "refund_engine",
  "reconciliation_engine",
  "financial_operations_certification",
  "capital_factory_core",
  "api_runtime",
  "audit_runtime",
  "monitoring_runtime",
  "executive_reporting_runtime",
  "shared_runtime_core",
  "worker_registry",
] as const;

export const FINART_CAPABILITIES = [
  "discover_financial_components",
  "verify_payment_workflows",
  "verify_revenue_recording",
  "verify_expense_tracking",
  "verify_accounting_records",
  "verify_financial_reporting",
  "verify_cost_controls",
  "verify_financial_governance",
  "verify_audit_traceability",
  "classify_financial_readiness",
  "produce_financial_readiness_audit_reports",
  "submit_reports_through_executive_reporting_runtime",
  "expose_q1109_consumable_contract",
  "consume_q1108_consumable_contract",
  "preserve_complete_traceability",
  "preserve_immutable_financial_history",
  "preserve_audit_history",
  "never_fabricate_financial_evidence",
  "never_certify_unverified_financial_capability",
  "never_execute_financial_transactions",
  "never_modify_accounting_records",
  "never_assume_implementation",
  "never_repair_failed_financial_components",
  "never_bypass_pillow_governance",
  "never_bypass_grand_king_approval",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_implement_q1109_or_later",
  "integrate_recovery_audit",
  "integrate_production_certification_core",
  "integrate_commerce_factory_core",
  "integrate_payment_gateway_integration",
  "integrate_billing_worker",
  "integrate_revenue_engine",
  "integrate_expense_engine",
  "integrate_accounting_worker",
  "integrate_financial_reporting_worker",
  "integrate_profit_calculation_engine",
  "integrate_api_runtime",
  "integrate_audit_runtime",
  "integrate_monitoring_runtime",
  "integrate_executive_reporting_runtime",
  "integrate_shared_runtime_core",
  "integrate_worker_registry",
  "deterministic_audit_behaviour",
  "structural_signal_only",
  "evidence_based_only",
  "health_monitoring",
  "financial_readiness_management",
  "eighth_q11_gate",
] as const;
