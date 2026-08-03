import type { CashflowWorkerConfiguration } from "./configuration.js";
import {
  CASHFLOW_REPORT_VERSION,
  CASHFLOW_WORKER_IDENTITY,
  CFW_CAPABILITIES,
  CFW_METADATA_VERSION,
} from "./paths.js";
import { nextReportId, nextViewId } from "./cashflow-store.js";
import {
  buildAmountSummary,
  buildTransfersSummary,
  computeConfidenceScore,
  computeLiquidityStatus,
  computePercentChange,
  computeReconciliationStatus,
  resolvePeriodBoundaries,
  resolvePriorPeriodBoundaries,
} from "./cashflow-calculator.js";
import { moneyAdd, moneyFromMinor, moneySub, moneyZero } from "./money.js";
import type {
  AuditStatus,
  CashAmountSummary,
  CashflowReport,
  CashflowWorkerCatalog,
  CashflowWorkerEngineRecord,
  CashflowScope,
  CashMovement,
  CfwValidationReport,
  IntegrationHandshake,
  OperationalState,
  PeriodCashflowView,
  Q904ConsumableContract,
  ReportingFrequency,
} from "./types.js";

export type BuiltView = {
  view: PeriodCashflowView;
  periodMovements: CashMovement[];
  inflowSummary: CashAmountSummary;
  outflowSummary: CashAmountSummary;
  issues: string[];
};

/** Pure assembly of a single deterministic PeriodCashflowView from already scope-filtered movements. */
export function buildView(params: {
  scope: CashflowScope;
  scopeId: string;
  frequency: ReportingFrequency;
  reportingPeriod?: string | null;
  periodStartInput?: string | null;
  periodEndInput?: string | null;
  currency: string;
  scopeMovements: CashMovement[];
  openingOverrideMinor?: number | null;
  restrictedOverrideMinor?: number | null;
  priorView: PeriodCashflowView | null;
}): BuiltView {
  const {
    scope,
    scopeId,
    frequency,
    reportingPeriod,
    periodStartInput,
    periodEndInput,
    currency,
    scopeMovements,
    openingOverrideMinor,
    restrictedOverrideMinor,
    priorView,
  } = params;

  const boundaries = resolvePeriodBoundaries(frequency, reportingPeriod, periodStartInput, periodEndInput);
  const startMs = new Date(boundaries.periodStart).getTime();
  const endMs = new Date(boundaries.periodEnd).getTime();
  const issues: string[] = [];

  const periodMovements = scopeMovements.filter((movement) => {
    const ts = new Date(movement.timestamp).getTime();
    return Number.isFinite(ts) && ts >= startMs && ts <= endMs;
  });

  const inflowMovements = periodMovements.filter((m) => m.direction === "inflow");
  const outflowMovements = periodMovements.filter((m) => m.direction === "outflow");
  const inflowSummary = buildAmountSummary(inflowMovements, currency);
  const outflowSummary = buildAmountSummary(outflowMovements, currency);
  const transfersSummary = buildTransfersSummary(periodMovements, currency);

  const cashInflows = inflowSummary.totalMinor;
  const cashOutflows = outflowSummary.totalMinor;
  const netCashflow = moneySub(cashInflows, cashOutflows);

  let openingCashBalance = moneyZero(currency);
  let openingBalanceEvidencePresent = false;
  if (priorView) {
    openingCashBalance = priorView.closingCashBalance;
    openingBalanceEvidencePresent = true;
  } else if (typeof openingOverrideMinor === "number") {
    openingCashBalance = moneyFromMinor(openingOverrideMinor, currency);
    openingBalanceEvidencePresent = true;
  } else {
    issues.push(
      `No prior closing balance or provided opening balance found for scope=${scope} scopeId=${scopeId} period=${boundaries.periodLabel}; opening balance treated as 0 and flagged for reconciliation.`,
    );
  }

  let restrictedAmount = moneyZero(currency);
  let restrictedEvidencePresent = false;
  if (typeof restrictedOverrideMinor === "number") {
    restrictedAmount = moneyFromMinor(restrictedOverrideMinor, currency);
    restrictedEvidencePresent = true;
  }
  const restrictedCash = { amountMinor: restrictedAmount, evidencePresent: restrictedEvidencePresent, fabricated: false as const };

  const closingCashBalance =
    scope === "account"
      ? moneyAdd(moneyAdd(openingCashBalance, netCashflow), transfersSummary.netTransfers)
      : moneyAdd(openingCashBalance, netCashflow);
  const availableCash = moneySub(closingCashBalance, restrictedCash.amountMinor);

  const reconciliationStatus = computeReconciliationStatus(periodMovements);
  const unreconciledMovements = periodMovements.filter(
    (m) => m.amountStatus === "pending" || m.amountStatus === "disputed",
  );

  const hasEvidence = periodMovements.length > 0 || openingBalanceEvidencePresent;
  const liquidityStatus = computeLiquidityStatus({
    hasEvidence,
    reconciliationStatus,
    availableCashMinor: availableCash.minorUnits,
    outflowsMinor: cashOutflows.minorUnits,
  });

  const priorNetCashflow = priorView ? priorView.netCashflow : null;
  const periodComparison = priorView
    ? {
        priorPeriodLabel: priorView.periodLabel,
        priorNetCashflow,
        changeInNetCashflow: moneySub(netCashflow, priorView.netCashflow),
        percentChange: computePercentChange(netCashflow, priorView.netCashflow),
        evidencePresent: true,
      }
    : {
        priorPeriodLabel: null,
        priorNetCashflow: null,
        changeInNetCashflow: null,
        percentChange: null,
        evidencePresent: false,
      };

  const sourceRecordRefs = Array.from(new Set(periodMovements.flatMap((m) => m.traceabilityRefs)));

  const view: PeriodCashflowView = {
    viewId: nextViewId(),
    reportingFrequency: frequency,
    periodStart: boundaries.periodStart,
    periodEnd: boundaries.periodEnd,
    periodLabel: boundaries.periodLabel,
    scope,
    scopeId,
    currency,
    openingCashBalance,
    openingBalanceEvidencePresent,
    cashInflows,
    cashOutflows,
    netCashflow,
    transfersSummary,
    restrictedCash,
    availableCash,
    closingCashBalance,
    periodComparison,
    liquidityStatus,
    reconciliationStatus,
    unreconciledMovements,
    sourceRecordRefs,
    fabricated: false,
  };

  return { view, periodMovements, inflowSummary, outflowSummary, issues };
}

/** Resolve the prior view for period-over-period comparison via a store lookup callback. */
export function resolvePriorView(
  frequency: ReportingFrequency,
  reportingPeriod: string | null | undefined,
  periodStartInput: string | null | undefined,
  periodEndInput: string | null | undefined,
  lookup: (periodLabel: string) => PeriodCashflowView | null,
): PeriodCashflowView | null {
  if (frequency === "custom") return null;
  const current = resolvePeriodBoundaries(frequency, reportingPeriod, periodStartInput, periodEndInput);
  const prior = resolvePriorPeriodBoundaries(frequency, current);
  if (!prior) return null;
  return lookup(prior.periodLabel);
}

export function bucketViewsByFrequency(views: PeriodCashflowView[]): CashflowReport["views"] {
  return {
    daily: views.filter((v) => v.reportingFrequency === "daily"),
    weekly: views.filter((v) => v.reportingFrequency === "weekly"),
    monthly: views.filter((v) => v.reportingFrequency === "monthly"),
    annual: views.filter((v) => v.reportingFrequency === "annual"),
    custom: views.filter((v) => v.reportingFrequency === "custom"),
  };
}

export function buildCatalog(
  config: CashflowWorkerConfiguration,
  movements: CashMovement[],
  views: PeriodCashflowView[],
  reports: CashflowReport[],
  integrations: IntegrationHandshake[],
): CashflowWorkerCatalog {
  return {
    reportVersion: CASHFLOW_REPORT_VERSION,
    workerId: config.workerId,
    reportingFrequencies: [...config.reportingFrequencies],
    liquidityStatuses: ["healthy", "adequate", "tight", "critical", "unknown", "unreconciled"],
    reconciliationStatuses: ["reconciled", "partial", "unreconciled", "disputed", "pending"],
    amountStatuses: ["recorded", "reconciled", "pending", "disputed"],
    currencies: [...config.currencies],
    movements: movements.map((m) => ({ ...m, amountMinor: { ...m.amountMinor }, traceabilityRefs: [...m.traceabilityRefs] })),
    views: views.map((v) => ({ ...v })),
    reports: reports.map((r) => ({ ...r })),
    integrations: integrations.map((i) => ({ ...i })),
    metadataVersion: CFW_METADATA_VERSION,
    executiveAuthority: "pillow",
    neverFabricateBalancesOrFlows: true,
    neverCreateBudgets: true,
    neverForecastFutureCashflow: true,
    neverCalculateCompleteBusinessProfitability: true,
    neverApproveSpending: true,
    neverMoveMoney: true,
    neverModifyVerifiedAccountingRecords: true,
    neverBypassGrandKingApproval: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ904OrLater: true,
  };
}

export function buildReport(params: {
  capitalBusinessId: string;
  capitalProjectId: string | null;
  primaryView: PeriodCashflowView;
  inflowSummary: CashAmountSummary;
  outflowSummary: CashAmountSummary;
  scopeViews: PeriodCashflowView[];
  extraOutstandingIssues: string[];
  validation: CfwValidationReport | null;
}): CashflowReport {
  const {
    capitalBusinessId,
    capitalProjectId,
    primaryView,
    inflowSummary,
    outflowSummary,
    scopeViews,
    extraOutstandingIssues,
    validation,
  } = params;

  const outstandingIssues = Array.from(
    new Set([
      ...extraOutstandingIssues,
      ...primaryView.unreconciledMovements.map(
        (m) => `Unreconciled movement ${m.movementId} (${m.amountStatus}) on account ${m.accountId}`,
      ),
    ]),
  );

  const auditStatus: AuditStatus =
    primaryView.reconciliationStatus === "reconciled" && outstandingIssues.length === 0
      ? "passed"
      : primaryView.reconciliationStatus === "unreconciled"
        ? "pending"
        : "partial";

  const confidenceScore = computeConfidenceScore({
    hasSourceRecords: primaryView.sourceRecordRefs.length > 0,
    reconciliationStatus: primaryView.reconciliationStatus,
    outstandingIssueCount: outstandingIssues.length,
    openingBalanceEvidencePresent: primaryView.openingBalanceEvidencePresent,
  });

  const reportId = nextReportId();
  const now = new Date().toISOString();
  const views = bucketViewsByFrequency(
    scopeViews.some((v) => v.viewId === primaryView.viewId) ? scopeViews : [...scopeViews, primaryView],
  );

  const traceabilityRefs = Array.from(
    new Set([
      `q9-03:report:${reportId}`,
      `q9-03:capital_business:${capitalBusinessId}`,
      `q9-03:reporting_period:${primaryView.periodLabel}`,
      ...primaryView.sourceRecordRefs,
    ]),
  );

  return {
    reportId,
    timestamp: now,
    capitalProjectId,
    reportingPeriod: primaryView.periodLabel,
    reportingFrequency: primaryView.reportingFrequency,
    currency: primaryView.currency,
    openingCashBalance: primaryView.openingCashBalance,
    cashInflowSummary: inflowSummary,
    cashOutflowSummary: outflowSummary,
    netCashflow: primaryView.netCashflow,
    transfersSummary: primaryView.transfersSummary,
    restrictedCash: primaryView.restrictedCash,
    availableCash: primaryView.availableCash,
    closingCashBalance: primaryView.closingCashBalance,
    periodComparison: primaryView.periodComparison,
    liquidityStatus: primaryView.liquidityStatus,
    sourceRecordReferences: primaryView.sourceRecordRefs,
    reconciliationStatus: primaryView.reconciliationStatus,
    auditStatus,
    outstandingIssues,
    confidenceScore,
    metadataVersion: CFW_METADATA_VERSION,
    reportVersion: CASHFLOW_REPORT_VERSION,
    workerId: CASHFLOW_WORKER_IDENTITY.workerId,
    capitalBusinessId,
    views,
    validation,
    runTimestamp: now,
    consumableByQ904: true,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    traceabilityRefs,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    preserveCompleteTraceability: true,
    preserveHistoricalReports: true,
    neverFabricateBalancesOrFlows: true,
    neverCreateBudgets: true,
    neverForecastFutureCashflow: true,
    neverCalculateCompleteBusinessProfitability: true,
    neverApproveSpending: true,
    neverMoveMoney: true,
    neverModifyVerifiedAccountingRecords: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ904OrLater: true,
  };
}

export function buildQ904ConsumableContract(config: CashflowWorkerConfiguration): Q904ConsumableContract {
  return {
    contractId: `cfw-q904-contract-${CFW_METADATA_VERSION}`,
    contractVersion: CFW_METADATA_VERSION,
    producedBy: "cashflow-worker",
    missionId: "Q9-03",
    consumerMissionId: "Q9-04",
    exposedFields: [
      "capitalBusinessId",
      "reportingPeriod",
      "reportingFrequency",
      "openingCashBalance",
      "cashInflowSummary",
      "cashOutflowSummary",
      "netCashflow",
      "transfersSummary",
      "restrictedCash",
      "availableCash",
      "closingCashBalance",
      "periodComparison",
      "liquidityStatus",
      "reconciliationStatus",
      "views",
      "confidenceScore",
      "metadataVersion",
    ],
    reportingFrequencyCatalog: [...config.reportingFrequencies],
    liquidityStatusCatalog: ["healthy", "adequate", "tight", "critical", "unknown", "unreconciled"],
    reconciliationStatusCatalog: ["reconciled", "partial", "unreconciled", "disputed", "pending"],
    currencyCatalog: [...config.currencies],
    notes: [
      "Cashflow Worker (Q9-03) tracks real cash inflows/outflows from verified Accounting Worker records only.",
      "It does not create budgets, forecast future cashflow, or calculate complete business profitability.",
      "Q9-04 (Budget Planning Worker) and later workers must consume this contract rather than reimplement Q9-03 cashflow logic.",
    ],
    neverImplementQ904OrLater: true,
    structuralSignalOnly: true,
  };
}

export function buildEngineRecord(params: {
  existingId: string | null;
  engineId: string;
  state: OperationalState;
  healthStatus: CashflowWorkerEngineRecord["healthStatus"];
  validationStatus: CashflowWorkerEngineRecord["validationStatus"];
  totalMovements: number;
  totalViews: number;
  lastReconciliationStatus: CashflowWorkerEngineRecord["lastReconciliationStatus"];
  lastBusinessId: string | null;
  lastReportId: string | null;
  workerId: string;
  integrationTargets: CashflowWorkerEngineRecord["integrationTargets"];
}): CashflowWorkerEngineRecord {
  return {
    engineRecordId: params.existingId ?? `cfw-eng-${Date.now()}`,
    timestamp: new Date().toISOString(),
    engineId: params.engineId,
    engineVersion: "PILLOW-CFW-001",
    currentOperationalState: params.state,
    healthStatus: params.healthStatus,
    validationStatus: params.validationStatus,
    supportedCapabilities: [...CFW_CAPABILITIES],
    totalMovements: params.totalMovements,
    totalViews: params.totalViews,
    lastReconciliationStatus: params.lastReconciliationStatus,
    lastBusinessId: params.lastBusinessId,
    lastReportId: params.lastReportId,
    workerId: params.workerId,
    integrationTargets: params.integrationTargets,
    metadataVersion: CFW_METADATA_VERSION,
  };
}
