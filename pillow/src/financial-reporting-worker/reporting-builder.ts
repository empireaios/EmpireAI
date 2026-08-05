import type { FinancialReportingWorkerConfiguration } from "./configuration.js";
import {
  DASHBOARD_WIDGET_KINDS,
  FINANCIAL_REPORTING_WORKER_IDENTITY,
  FINANCIAL_REPORT_VERSION,
  FRW_CAPABILITIES,
  FRW_METADATA_VERSION,
  REPORT_SECTION_KINDS,
} from "./paths.js";
import { buildExecutiveDashboard, computeConfidenceScore } from "./reporting-aggregator.js";
import { nextDashboardId, nextEngineRecordId, nextReportId } from "./reporting-store.js";
import type {
  CapitalSummary,
  ExecutiveDashboard,
  FinancialReport,
  FinancialReportingWorkerCatalog,
  FinancialReportingWorkerEngineRecord,
  FrwCapability,
  IntegrationHandshake,
  OperationalState,
  Q910ConsumableContract,
  ValidationResult,
} from "./types.js";
import type {
  BudgetSummary,
  CashflowSummary,
  EnterpriseKpis,
  ExpenseSummary,
  ForecastSummary,
  InvestmentSummary,
  ProfitabilitySummary,
  RevenueSummary,
  TaxSupportSummary,
} from "./types.js";

export function buildFinancialReport(params: {
  capitalBusinessId: string;
  capitalProjectId: string;
  reportingPeriod: string;
  currency: string;
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
  outstandingIssues: string[];
  confidenceScore: number;
  validation: ValidationResult;
  config: FinancialReportingWorkerConfiguration;
}): FinancialReport {
  return {
    reportId: nextReportId(),
    timestamp: new Date().toISOString(),
    capitalProjectId: params.capitalProjectId,
    reportingPeriod: params.reportingPeriod,
    executiveDashboard: params.executiveDashboard,
    revenueSummary: params.revenueSummary,
    expenseSummary: params.expenseSummary,
    cashflowSummary: params.cashflowSummary,
    budgetSummary: params.budgetSummary,
    profitabilitySummary: params.profitabilitySummary,
    forecastSummary: params.forecastSummary,
    investmentSummary: params.investmentSummary,
    taxSupportSummary: params.taxSupportSummary,
    capitalSummary: params.capitalSummary,
    enterpriseKpis: params.enterpriseKpis,
    supportingEvidence: [...params.supportingEvidence],
    auditStatus: "pending",
    outstandingIssues: [...params.outstandingIssues],
    confidenceScore: params.confidenceScore,
    metadataVersion: FRW_METADATA_VERSION,
    reportVersion: FINANCIAL_REPORT_VERSION,
    workerId: params.config.workerId,
    capitalBusinessId: params.capitalBusinessId,
    currency: params.currency,
    validation: params.validation,
    runTimestamp: new Date().toISOString(),
    consumableByQ910: true,
    submittedThroughExecutiveReportingRuntime: false,
    executiveReportId: null,
    traceabilityRefs: [...params.supportingEvidence],
    neverExecuteFinancialTransactions: true,
    neverApproveFinancialDecisions: true,
    neverModifyAccountingRecords: true,
    neverFabricateFinancialFigures: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ910OrLater: true,
    preserveCompleteTraceability: true,
    preserveReportHistory: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    measuredDataDistinctFromProjections: true,
  };
}

export function buildQ910ConsumableContract(
  config: FinancialReportingWorkerConfiguration,
): Q910ConsumableContract {
  return {
    contractId: `frw-q910-contract-${FRW_METADATA_VERSION}`,
    contractVersion: FRW_METADATA_VERSION,
    producedBy: "financial-reporting-worker",
    missionId: "Q9-09",
    consumerMissionId: "Q9-10",
    exposedFields: [
      "reportId",
      "timestamp",
      "capitalProjectId",
      "reportingPeriod",
      "executiveDashboard",
      "revenueSummary",
      "expenseSummary",
      "cashflowSummary",
      "budgetSummary",
      "profitabilitySummary",
      "forecastSummary",
      "investmentSummary",
      "taxSupportSummary",
      "capitalSummary",
      "enterpriseKpis",
      "supportingEvidence",
      "auditStatus",
      "outstandingIssues",
      "confidenceScore",
      "metadataVersion",
    ],
    reportSectionCatalog: [...REPORT_SECTION_KINDS],
    dashboardWidgetCatalog: [...config.dashboardWidgetKinds],
    currencyCatalog: [...config.currencies],
    notes: [
      "Financial Reporting Worker (Q9-09) consolidates verified upstream financial snapshots into executive dashboards and Financial Reports — it never executes financial transactions, never approves financial decisions, never modifies accounting records, and never fabricates figures.",
      "Factual vs projected data is distinguished via recordKind on each summary; missing sources remain unavailable rather than zero-filled as facts.",
      "Q9-10 and later workers must consume this contract rather than reimplement Q9-09 financial reporting logic.",
    ],
    neverImplementQ910OrLater: true,
    structuralSignalOnly: true,
  };
}

export function buildCatalog(config: FinancialReportingWorkerConfiguration): FinancialReportingWorkerCatalog {
  return {
    catalogVersion: FRW_METADATA_VERSION,
    reportSectionKinds: [...config.reportSectionKinds],
    dashboardWidgetKinds: [...config.dashboardWidgetKinds],
    currencies: [...config.currencies],
    capabilities: [...FRW_CAPABILITIES] as FrwCapability[],
  };
}

export function buildEngineRecord(params: {
  operationalState: OperationalState;
  healthStatus: FinancialReportingWorkerEngineRecord["healthStatus"];
  validationStatus: FinancialReportingWorkerEngineRecord["validationStatus"];
  totalReports: number;
  totalDashboards: number;
  lastBusinessId: string | null;
  lastReportingPeriod: string | null;
  handshakes: IntegrationHandshake[];
}): FinancialReportingWorkerEngineRecord {
  const bound = (target: string) =>
    params.handshakes.some((h) => h.target === target && h.status === "bound");
  return {
    engineRecordId: nextEngineRecordId(),
    timestamp: new Date().toISOString(),
    engineId: FINANCIAL_REPORTING_WORKER_IDENTITY.workerId,
    engineVersion: "PILLOW-FRW-001",
    currentOperationalState: params.operationalState,
    healthStatus: params.healthStatus,
    validationStatus: params.validationStatus,
    supportedCapabilities: [...FRW_CAPABILITIES] as FrwCapability[],
    totalReports: params.totalReports,
    totalDashboards: params.totalDashboards,
    lastBusinessId: params.lastBusinessId,
    lastReportingPeriod: params.lastReportingPeriod,
    dependencyPresence: {
      capitalFactoryCore: bound("capital_factory_core"),
      accountingWorker: bound("accounting_worker"),
      cashflowWorker: bound("cashflow_worker"),
      budgetPlanningWorker: bound("budget_planning_worker"),
      profitabilityWorker: bound("profitability_worker"),
      forecastingWorker: bound("forecasting_worker"),
      taxSupportWorker: bound("tax_support_worker"),
      investmentPlanningWorker: bound("investment_planning_worker"),
    },
    metadataVersion: FRW_METADATA_VERSION,
  };
}

export function buildDashboardFromSummaries(params: {
  currency: string;
  revenue: RevenueSummary;
  expense: ExpenseSummary;
  cashflow: CashflowSummary;
  budget: BudgetSummary;
  profitability: ProfitabilitySummary;
  forecast: ForecastSummary;
  investment: InvestmentSummary;
  taxSupport: TaxSupportSummary;
  capital: CapitalSummary;
  kpis: EnterpriseKpis;
}): ExecutiveDashboard {
  return buildExecutiveDashboard({
    dashboardId: nextDashboardId(),
    timestamp: new Date().toISOString(),
    ...params,
  });
}

export function buildReportConfidence(summaries: Array<{ status: string; sourceRefs: string[] }>): number {
  const available = summaries.filter((s) => s.status === "available").length;
  const evidenceRefCount = summaries.reduce((acc, s) => acc + s.sourceRefs.length, 0);
  return computeConfidenceScore({
    availableSummaryCount: available,
    totalSummaryCount: summaries.length,
    evidenceRefCount,
  });
}
