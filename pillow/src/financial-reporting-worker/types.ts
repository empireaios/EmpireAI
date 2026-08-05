import type {
  AUDIT_STATUSES,
  CURRENCIES,
  DASHBOARD_WIDGET_KINDS,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  FRW_CAPABILITIES,
  OPERATIONAL_STATES,
  REPORT_SECTION_KINDS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { FinancialReportingWorkerConfiguration } from "./configuration.js";
import type { MoneyMinor } from "./money.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type ReportSectionKind = (typeof REPORT_SECTION_KINDS)[number];
export type DashboardWidgetKind = (typeof DASHBOARD_WIDGET_KINDS)[number];
export type Currency = (typeof CURRENCIES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type FrwCapability = (typeof FRW_CAPABILITIES)[number];

export type SummaryRecordKind = "factual_measured" | "projected_caller_supplied" | "unavailable";
export type SummaryStatus = "available" | "unavailable";

export type InjectedLedgerLine = {
  accountId: string;
  debit: number;
  credit: number;
  currency?: string | null;
};

export type InjectedAccountingEntry = {
  entryId: string;
  entryType: string;
  businessId: string;
  accountingPeriod: string;
  timestamp: string;
  currency: string;
  lines: InjectedLedgerLine[];
  traceabilityRefs?: string[];
};

export type InjectedCashflowReport = {
  reportId?: string | null;
  capitalBusinessId?: string | null;
  reportingPeriod?: string | null;
  netCashflow?: { currency: string; minorUnits: number } | null;
  closingCashBalance?: { currency: string; minorUnits: number } | null;
  openingCashBalance?: { currency: string; minorUnits: number } | null;
  confidenceScore?: number | null;
  [key: string]: unknown;
};

export type InjectedBudgetReport = {
  reportId?: string | null;
  capitalBusinessId?: string | null;
  reportingPeriod?: string | null;
  availableBudget?: { currency: string; minorUnits: number } | null;
  allocatedBudget?: { currency: string; minorUnits: number } | null;
  confidenceScore?: number | null;
  [key: string]: unknown;
};

export type InjectedProfitabilityReport = {
  reportId?: string | null;
  capitalBusinessId?: string | null;
  reportingPeriod?: string | null;
  grossProfit?: { currency: string; minorUnits: number } | null;
  operatingProfit?: { currency: string; minorUnits: number } | null;
  netProfit?: { currency: string; minorUnits: number } | null;
  confidenceScore?: number | null;
  [key: string]: unknown;
};

export type InjectedForecastingReport = {
  reportId?: string | null;
  capitalBusinessId?: string | null;
  forecastPeriod?: string | null;
  projectedRevenue?: { currency: string; minorUnits: number } | null;
  projectedExpenses?: { currency: string; minorUnits: number } | null;
  confidenceScore?: number | null;
  [key: string]: unknown;
};

export type InjectedTaxSupportReport = {
  reportId?: string | null;
  capitalBusinessId?: string | null;
  reportingPeriod?: string | null;
  estimatedTaxLiability?: { currency: string; minorUnits: number } | null;
  supportingEvidence?: string[];
  confidenceScore?: number | null;
  [key: string]: unknown;
};

export type InjectedInvestmentPlanningReport = {
  reportId?: string | null;
  capitalBusinessId?: string | null;
  planningPeriod?: string | null;
  availableCapital?: { currency: string; minorUnits: number } | null;
  evaluatedOpportunityCount?: number | null;
  confidenceScore?: number | null;
  [key: string]: unknown;
};

/** Caller-supplied verified snapshot — never fabricated by this worker. */
export type VerifiedRevenueSnapshot = {
  totalRevenueMinor: number;
  currency: string;
  sourceRefs: string[];
  fabricated: false;
};

export type VerifiedExpenseSnapshot = {
  totalExpenseMinor: number;
  currency: string;
  sourceRefs: string[];
  fabricated: false;
};

export type VerifiedCashflowSnapshot = {
  netCashflowMinor?: number | null;
  closingCashBalanceMinor?: number | null;
  openingCashBalanceMinor?: number | null;
  currency: string;
  sourceRefs: string[];
  fabricated: false;
};

export type VerifiedBudgetSnapshot = {
  availableBudgetMinor?: number | null;
  allocatedBudgetMinor?: number | null;
  currency: string;
  sourceRefs: string[];
  fabricated: false;
};

export type VerifiedProfitabilitySnapshot = {
  grossProfitMinor?: number | null;
  operatingProfitMinor?: number | null;
  netProfitMinor?: number | null;
  currency: string;
  sourceRefs: string[];
  fabricated: false;
};

export type VerifiedForecastSnapshot = {
  projectedRevenueMinor?: number | null;
  projectedExpensesMinor?: number | null;
  currency: string;
  sourceRefs: string[];
  fabricated: false;
};

export type VerifiedInvestmentSnapshot = {
  availableCapitalMinor?: number | null;
  evaluatedOpportunityCount?: number | null;
  currency: string;
  sourceRefs: string[];
  fabricated: false;
};

export type VerifiedTaxSupportSnapshot = {
  estimatedTaxLiabilityMinor?: number | null;
  currency: string;
  sourceRefs: string[];
  fabricated: false;
};

export type RevenueSummary = {
  totalRevenue: MoneyMinor | null;
  recordKind: SummaryRecordKind;
  sourceRefs: string[];
  status: SummaryStatus;
  fabricated: false;
};

export type ExpenseSummary = {
  totalExpense: MoneyMinor | null;
  recordKind: SummaryRecordKind;
  sourceRefs: string[];
  status: SummaryStatus;
  fabricated: false;
};

export type CashflowSummary = {
  netCashflow: MoneyMinor | null;
  closingCashBalance: MoneyMinor | null;
  openingCashBalance: MoneyMinor | null;
  recordKind: SummaryRecordKind;
  sourceRefs: string[];
  status: SummaryStatus;
  fabricated: false;
};

export type BudgetSummary = {
  availableBudget: MoneyMinor | null;
  allocatedBudget: MoneyMinor | null;
  recordKind: SummaryRecordKind;
  sourceRefs: string[];
  status: SummaryStatus;
  fabricated: false;
};

export type ProfitabilitySummary = {
  grossProfit: MoneyMinor | null;
  operatingProfit: MoneyMinor | null;
  netProfit: MoneyMinor | null;
  recordKind: SummaryRecordKind;
  sourceRefs: string[];
  status: SummaryStatus;
  fabricated: false;
};

export type ForecastSummary = {
  projectedRevenue: MoneyMinor | null;
  projectedExpenses: MoneyMinor | null;
  recordKind: SummaryRecordKind;
  sourceRefs: string[];
  status: SummaryStatus;
  fabricated: false;
};

export type InvestmentSummary = {
  availableCapital: MoneyMinor | null;
  evaluatedOpportunityCount: number | null;
  recordKind: SummaryRecordKind;
  sourceRefs: string[];
  status: SummaryStatus;
  fabricated: false;
};

export type TaxSupportSummary = {
  estimatedTaxLiability: MoneyMinor | null;
  recordKind: SummaryRecordKind;
  sourceRefs: string[];
  status: SummaryStatus;
  fabricated: false;
};

export type CapitalSummary = {
  totalCapitalPosition: MoneyMinor | null;
  availableCapital: MoneyMinor | null;
  closingCashBalance: MoneyMinor | null;
  recordKind: SummaryRecordKind;
  sourceRefs: string[];
  status: SummaryStatus;
  fabricated: false;
};

export type EnterpriseKpis = {
  totalRevenueMinor: number | null;
  totalExpenseMinor: number | null;
  netCashflowMinor: number | null;
  netProfitMinor: number | null;
  grossMarginBps: number | null;
  currency: string;
  factualSourceCount: number;
  projectedSourceCount: number;
  recordKind: "computed_from_factual_summaries";
  fabricated: false;
};

export type DashboardWidget = {
  widgetId: string;
  kind: DashboardWidgetKind;
  title: string;
  valueMinor: number | null;
  currency: string;
  recordKind: SummaryRecordKind;
  sourceRefs: string[];
};

export type ExecutiveDashboard = {
  dashboardId: string;
  timestamp: string;
  widgets: DashboardWidget[];
  kpis: EnterpriseKpis;
};

export type BusinessComparison = {
  businessId: string;
  reportingPeriod: string;
  revenueMinor: number | null;
  expenseMinor: number | null;
  netProfitMinor: number | null;
  recordKind: SummaryRecordKind;
  sourceRefs: string[];
  fabricated: false;
};

export type ExecutiveObservation = {
  observationId: string;
  category: string;
  message: string;
  severity: "info" | "warning" | "critical";
  sourceRefs: string[];
  fabricated: false;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "bound" | "unavailable";
  timestamp: string;
  details: string;
};

export type ValidationResult = {
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
};

export type FinancialReport = {
  reportId: string;
  timestamp: string;
  capitalProjectId: string;
  reportingPeriod: string;
  executiveDashboard: ExecutiveDashboard;
  revenueSummary: RevenueSummary;
  expenseSummary: ExpenseSummary;
  cashflowSummary: CashflowSummary;
  budgetSummary: BudgetSummary;
  profitabilitySummary: ProfitabilitySummary;
  forecastSummary: ForecastSummary;
  investmentSummary: InvestmentSummary;
  taxSupportSummary: TaxSupportSummary;
  capitalSummary: CapitalSummary;
  enterpriseKpis: EnterpriseKpis;
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: typeof import("./paths.js").FRW_METADATA_VERSION;
  reportVersion: typeof import("./paths.js").FINANCIAL_REPORT_VERSION;
  workerId: string;
  capitalBusinessId: string;
  currency: string;
  validation: ValidationResult;
  runTimestamp: string;
  consumableByQ910: true;
  submittedThroughExecutiveReportingRuntime: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  neverExecuteFinancialTransactions: true;
  neverApproveFinancialDecisions: true;
  neverModifyAccountingRecords: true;
  neverFabricateFinancialFigures: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ910OrLater: true;
  preserveCompleteTraceability: true;
  preserveReportHistory: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  measuredDataDistinctFromProjections: true;
};

export type Q910ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "financial-reporting-worker";
  missionId: "Q9-09";
  consumerMissionId: "Q9-10";
  exposedFields: string[];
  reportSectionCatalog: string[];
  dashboardWidgetCatalog: string[];
  currencyCatalog: string[];
  notes: string[];
  neverImplementQ910OrLater: true;
  structuralSignalOnly: true;
};

export type FinancialReportingWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-FRW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: FrwCapability[];
  totalReports: number;
  totalDashboards: number;
  lastBusinessId: string | null;
  lastReportingPeriod: string | null;
  dependencyPresence: {
    capitalFactoryCore: boolean;
    accountingWorker: boolean;
    cashflowWorker: boolean;
    budgetPlanningWorker: boolean;
    profitabilityWorker: boolean;
    forecastingWorker: boolean;
    taxSupportWorker: boolean;
    investmentPlanningWorker: boolean;
  };
  metadataVersion: typeof import("./paths.js").FRW_METADATA_VERSION;
};

export type FinancialReportingWorkerCatalog = {
  catalogVersion: string;
  reportSectionKinds: string[];
  dashboardWidgetKinds: string[];
  currencies: string[];
  capabilities: FrwCapability[];
};

export type FrwInput = {
  capitalBusinessId?: string | null;
  capitalProjectId?: string | null;
  reportingPeriod?: string | null;
  currency?: string | null;
  revenueSnapshot?: VerifiedRevenueSnapshot | null;
  expenseSnapshot?: VerifiedExpenseSnapshot | null;
  cashflowSnapshot?: VerifiedCashflowSnapshot | null;
  budgetSnapshot?: VerifiedBudgetSnapshot | null;
  profitabilitySnapshot?: VerifiedProfitabilitySnapshot | null;
  forecastSnapshot?: VerifiedForecastSnapshot | null;
  investmentSnapshot?: VerifiedInvestmentSnapshot | null;
  taxSupportSnapshot?: VerifiedTaxSupportSnapshot | null;
  validated?: boolean | null;
  forceFail?: boolean | null;
};

export type FrwAction =
  | "connect"
  | "consume_accounting"
  | "consume_cashflow"
  | "consume_budget"
  | "consume_profitability"
  | "consume_forecasting"
  | "consume_tax_support"
  | "consume_investment_planning"
  | "generate_executive_dashboard"
  | "generate_capital_summary"
  | "produce_financial_report"
  | "submit_report"
  | "list"
  | "validate"
  | "diagnostics";

export type FrwRunReport = {
  action: FrwAction;
  validation: ValidationResult;
  runTimestamp: string;
  capitalBusinessId?: string | null;
  reportingPeriod?: string | null;
  executiveDashboard?: ExecutiveDashboard | null;
  capitalSummary?: CapitalSummary | null;
  financialReport?: FinancialReport | null;
  handshakes?: IntegrationHandshake[] | null;
  details?: string | null;
};

export type FinancialReportingWorkerState = {
  engineVersion: "PILLOW-FRW-001";
  missionId: "Q9-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: FinancialReportingWorkerConfiguration;
  latestReport: FinancialReport | null;
  engineRecord: FinancialReportingWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReports: number;
    totalDashboards: number;
    lastBusinessId: string | null;
    notes: string[];
  };
};

export type FinancialReportingWorkerCockpitSnapshot = {
  missionId: "Q9-09";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalReports: number;
  totalDashboards: number;
  latestCapitalBusinessId: string | null;
  workerId: string;
  neverExecuteFinancialTransactions: true;
  neverApproveFinancialDecisions: true;
  neverModifyAccountingRecords: true;
  neverFabricateFinancialFigures: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ910OrLater: true;
  consumableByQ910: true;
};

export type ConsolidationContext = {
  currency: string;
  revenueSnapshot?: VerifiedRevenueSnapshot | null;
  expenseSnapshot?: VerifiedExpenseSnapshot | null;
  cashflowSnapshot?: VerifiedCashflowSnapshot | null;
  budgetSnapshot?: VerifiedBudgetSnapshot | null;
  profitabilitySnapshot?: VerifiedProfitabilitySnapshot | null;
  forecastSnapshot?: VerifiedForecastSnapshot | null;
  investmentSnapshot?: VerifiedInvestmentSnapshot | null;
  taxSupportSnapshot?: VerifiedTaxSupportSnapshot | null;
  injectedCashflowReports?: InjectedCashflowReport[];
  injectedBudgetReports?: InjectedBudgetReport[];
  injectedProfitabilityReports?: InjectedProfitabilityReport[];
  injectedForecastingReports?: InjectedForecastingReport[];
  injectedTaxSupportReports?: InjectedTaxSupportReport[];
  injectedInvestmentReports?: InjectedInvestmentPlanningReport[];
};
