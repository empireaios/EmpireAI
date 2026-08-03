import type { BudgetPlanningWorkerConfiguration } from "./configuration.js";
import {
  BPW_CAPABILITIES,
  BPW_METADATA_VERSION,
  BUDGET_PLANNING_REPORT_VERSION,
  BUDGET_PLANNING_WORKER_IDENTITY,
} from "./paths.js";
import { nextBudgetId, nextFindingId, nextRecommendationId, nextReportId } from "./budget-store.js";
import {
  averageOf,
  classifyOverspendSeverity,
  classifyUnderspendSeverity,
  computeConfidenceScore,
  computeUtilisationPercent,
  computeVarianceAmount,
  computeVariancePercent,
  resolvePeriodBoundaries,
} from "./budget-calculator.js";
import { moneySub, moneySum, type MoneyMinor } from "./money.js";
import type {
  ApprovalStatus,
  AuditStatus,
  BpwCapability,
  BudgetAdjustmentRecommendation,
  BudgetCategory,
  BudgetPeriod,
  BudgetPlanningReport,
  BudgetPlanningWorkerCatalog,
  BudgetPlanningWorkerEngineRecord,
  BudgetRecord,
  BudgetRevisionEntry,
  BudgetScope,
  BudgetSubject,
  BudgetVarianceSummary,
  BpwValidationReport,
  IntegrationHandshake,
  OperationalState,
  Q905ConsumableContract,
  RecommendationAction,
  VarianceFinding,
  VarianceSeverity,
  VarianceSignal,
} from "./types.js";

/* ------------------------------------------------------------------------ */
/* Budget record assembly                                                   */
/* ------------------------------------------------------------------------ */

export type BuildBudgetParams = {
  budgetId: string | null;
  existing: BudgetRecord | null;
  budgetOwner: string | null;
  businessOrProject: BudgetSubject;
  budgetCategory: BudgetCategory;
  budgetPeriod: BudgetPeriod;
  periodLabelInput: string | null;
  periodStartInput: string | null;
  periodEndInput: string | null;
  plannedAmount: MoneyMinor;
  actualExpenditure: MoneyMinor;
  actualExpenditureEvidencePresent: boolean;
  approvalStatus: ApprovalStatus;
  supportingNotes: string[];
  currency: string;
  capitalProjectId: string | null;
  capitalBusinessId: string | null;
  extraTraceabilityRefs: string[];
  revisionReason: string | null;
};

export type BuiltBudget = {
  budget: BudgetRecord;
  isRevision: boolean;
  issues: string[];
};

/** Pure assembly of a BudgetRecord, appending a revision entry when planned amount/category/period/approval change. */
export function buildBudget(params: BuildBudgetParams): BuiltBudget {
  const {
    budgetId,
    existing,
    budgetOwner,
    businessOrProject,
    budgetCategory,
    budgetPeriod,
    periodLabelInput,
    periodStartInput,
    periodEndInput,
    plannedAmount,
    actualExpenditure,
    actualExpenditureEvidencePresent,
    approvalStatus,
    supportingNotes,
    currency,
    capitalProjectId,
    capitalBusinessId,
    extraTraceabilityRefs,
    revisionReason,
  } = params;

  const issues: string[] = [];
  const boundaries = resolvePeriodBoundaries(budgetPeriod, periodLabelInput, periodStartInput, periodEndInput);

  const remainingBudget = moneySub(plannedAmount, actualExpenditure);
  const varianceAmount = computeVarianceAmount(actualExpenditure, plannedAmount);
  const budgetUtilisationPercentage = computeUtilisationPercent(actualExpenditure, plannedAmount);
  const variancePercentage = computeVariancePercent(varianceAmount, plannedAmount);

  // Absence of actual-expenditure evidence is expected for a freshly
  // created or not-yet-spent budget (zero is a legitimate, non-fabricated
  // default). It is recorded transparently via
  // `actualExpenditureEvidencePresent` and surfaced in report-level
  // outstanding issues, but does not itself become a create-time warning.

  const resolvedId = budgetId ?? nextBudgetId();
  const now = new Date().toISOString();

  // Revisions are triggered strictly by planned amount, category, or period
  // changes — approval-status transitions are tracked informationally on
  // the revision entry (when one occurs) but never trigger one by themselves.
  const changedFields: string[] = [];
  if (existing) {
    if (existing.plannedAmount.minorUnits !== plannedAmount.minorUnits || existing.plannedAmount.currency !== plannedAmount.currency) {
      changedFields.push("plannedAmount");
    }
    if (existing.budgetCategory !== budgetCategory) changedFields.push("budgetCategory");
    if (existing.budgetPeriod !== budgetPeriod) changedFields.push("budgetPeriod");
  }
  const isRevision = Boolean(existing) && changedFields.length > 0;

  const revisionHistory: BudgetRevisionEntry[] = existing ? [...existing.revisionHistory] : [];
  if (isRevision && existing) {
    revisionHistory.push({
      revisionNumber: existing.revisionNumber,
      timestamp: now,
      changedFields,
      previousPlannedAmount: { ...existing.plannedAmount },
      previousBudgetCategory: existing.budgetCategory,
      previousBudgetPeriod: existing.budgetPeriod,
      previousApprovalStatus: existing.approvalStatus,
      reason: revisionReason,
      fabricated: false,
    });
  }
  const revisionNumber = isRevision ? (existing?.revisionNumber ?? 0) + 1 : existing?.revisionNumber ?? 1;

  const traceabilityRefs = Array.from(
    new Set([
      `q9-04:budget:${resolvedId}`,
      `q9-04:category:${budgetCategory}`,
      `q9-04:period:${boundaries.periodLabel}`,
      ...(existing?.traceabilityRefs ?? []),
      ...extraTraceabilityRefs,
    ]),
  );

  const budget: BudgetRecord = {
    budgetId: resolvedId,
    budgetOwner,
    businessOrProject,
    budgetCategory,
    budgetPeriod,
    periodLabel: boundaries.periodLabel,
    periodStart: boundaries.periodStart,
    periodEnd: boundaries.periodEnd,
    plannedAmount,
    actualExpenditure,
    remainingBudget,
    budgetUtilisationPercentage,
    varianceAmount,
    variancePercentage,
    approvalStatus,
    supportingNotes,
    currency,
    capitalProjectId,
    capitalBusinessId,
    revisionNumber,
    revisionHistory,
    actualExpenditureEvidencePresent,
    fabricated: false,
    traceabilityRefs,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  return { budget, isRevision, issues };
}

/* ------------------------------------------------------------------------ */
/* Variance findings                                                        */
/* ------------------------------------------------------------------------ */

export function buildVarianceFindingsForBudget(
  budget: BudgetRecord,
  config: BudgetPlanningWorkerConfiguration,
): VarianceFinding[] {
  const findings: VarianceFinding[] = [];
  const util = budget.budgetUtilisationPercentage;

  if (budget.varianceAmount.minorUnits > 0) {
    const severity = classifyOverspendSeverity(
      util,
      config.overspendHighSeverityThresholdPercent,
      config.overspendCriticalSeverityThresholdPercent,
    );
    findings.push(
      buildFinding({
        signal: "overspending",
        severity,
        description: `Budget ${budget.budgetId} (${budget.budgetCategory}) is overspent by ${budget.varianceAmount.minorUnits} ${budget.currency} minor units (${util.toFixed(2)}% utilised).`,
        budget,
        amountMinor: budget.varianceAmount,
        percent: budget.variancePercentage,
      }),
    );
  } else if (
    Number.isFinite(util) &&
    (util < config.severeUnderutilisationThresholdPercent || util < config.underutilisationThresholdPercent)
  ) {
    const severity = classifyUnderspendSeverity(util, config.severeUnderutilisationThresholdPercent);
    findings.push(
      buildFinding({
        signal: "underspending",
        severity,
        description: `Budget ${budget.budgetId} (${budget.budgetCategory}) is underutilised at ${util.toFixed(2)}% of planned amount.`,
        budget,
        amountMinor: budget.remainingBudget,
        percent: budget.variancePercentage,
      }),
    );
  }

  if (Number.isFinite(util) && util >= config.depletionRiskThresholdPercent && budget.varianceAmount.minorUnits <= 0) {
    findings.push(
      buildFinding({
        signal: "depletion_risk",
        severity: util >= 100 ? "high" : "medium",
        description: `Budget ${budget.budgetId} (${budget.budgetCategory}) has reached ${util.toFixed(2)}% utilisation and is at risk of depletion before period end.`,
        budget,
        amountMinor: budget.remainingBudget,
        percent: budget.variancePercentage,
      }),
    );
  }

  return findings;
}

export function buildExpenditureSpikeFindings(
  budget: BudgetRecord,
  actualHistoryMinor: number[],
  latestMinor: number,
  multiplier: number,
): VarianceFinding[] {
  const priorAverage = averageOf(actualHistoryMinor);
  if (priorAverage === null || priorAverage <= 0) return [];
  if (latestMinor < priorAverage * multiplier) return [];
  return [
    buildFinding({
      signal: "expenditure_spike",
      severity: "high",
      description: `Budget ${budget.budgetId} (${budget.budgetCategory}) shows a sudden expenditure spike: latest actual ${latestMinor} exceeds ${multiplier}x the historical average ${priorAverage.toFixed(2)}.`,
      budget,
      amountMinor: { currency: budget.currency, minorUnits: Math.round(latestMinor) },
      percent: null,
    }),
  ];
}

export function buildCrossBudgetVarianceFindings(
  budgets: BudgetRecord[],
  signal: "category_variance" | "period_variance",
  deviationThresholdPercent: number,
): VarianceFinding[] {
  const withPercent = budgets.filter((b) => typeof b.variancePercentage === "number" && Number.isFinite(b.variancePercentage));
  if (withPercent.length < 2) return [];
  const average = averageOf(withPercent.map((b) => b.variancePercentage as number));
  if (average === null) return [];

  const findings: VarianceFinding[] = [];
  for (const budget of withPercent) {
    const percent = budget.variancePercentage as number;
    const deviation = Math.abs(percent - average);
    if (deviation >= deviationThresholdPercent) {
      const groupKey = signal === "category_variance" ? budget.budgetCategory : budget.periodLabel;
      findings.push(
        buildFinding({
          signal,
          severity: deviation >= deviationThresholdPercent * 1.5 ? "high" : "medium",
          description: `Budget ${budget.budgetId} variance of ${percent.toFixed(2)}% deviates ${deviation.toFixed(2)} percentage points from the scope average of ${average.toFixed(2)}% (${signal === "category_variance" ? "category" : "period"}=${groupKey}).`,
          budget,
          amountMinor: budget.varianceAmount,
          percent,
        }),
      );
    }
  }
  return findings;
}

export function buildSignificantDeviationFindings(
  budgets: BudgetRecord[],
  deviationThresholdPercent: number,
): VarianceFinding[] {
  const withPercent = budgets.filter((b) => typeof b.variancePercentage === "number" && Number.isFinite(b.variancePercentage));
  if (withPercent.length < 2) return [];
  const average = averageOf(withPercent.map((b) => b.variancePercentage as number));
  if (average === null) return [];
  const findings: VarianceFinding[] = [];
  for (const budget of withPercent) {
    const percent = budget.variancePercentage as number;
    const deviation = Math.abs(percent - average);
    if (deviation >= deviationThresholdPercent * 2) {
      findings.push(
        buildFinding({
          signal: "significant_deviation",
          severity: "critical",
          description: `Budget ${budget.budgetId} variance of ${percent.toFixed(2)}% is a significant outlier (${deviation.toFixed(2)} percentage points from the scope average of ${average.toFixed(2)}%).`,
          budget,
          amountMinor: budget.varianceAmount,
          percent,
        }),
      );
    }
  }
  return findings;
}

export function buildEfficiencySignalFindings(budgets: BudgetRecord[]): VarianceFinding[] {
  const findings: VarianceFinding[] = [];
  for (const budget of budgets) {
    const util = budget.budgetUtilisationPercentage;
    if (Number.isFinite(util) && util >= 90 && util <= 100 && budget.varianceAmount.minorUnits <= 0) {
      findings.push(
        buildFinding({
          signal: "efficiency_signal",
          severity: "low",
          description: `Budget ${budget.budgetId} (${budget.budgetCategory}) shows efficient utilisation at ${util.toFixed(2)}% without overspending.`,
          budget,
          amountMinor: budget.remainingBudget,
          percent: budget.variancePercentage,
        }),
      );
    }
  }
  return findings;
}

function buildFinding(params: {
  signal: VarianceSignal;
  severity: VarianceSeverity;
  description: string;
  budget: BudgetRecord;
  amountMinor?: MoneyMinor;
  percent: number | null;
}): VarianceFinding {
  const { signal, severity, description, budget, amountMinor, percent } = params;
  return {
    findingId: nextFindingId(),
    signal,
    severity,
    description,
    budgetId: budget.budgetId,
    category: budget.budgetCategory,
    period: budget.periodLabel,
    amountMinor,
    percent,
    sourceRefs: [...budget.traceabilityRefs],
    fabricated: false,
  };
}

/* ------------------------------------------------------------------------ */
/* Recommendations                                                          */
/* ------------------------------------------------------------------------ */

const SIGNAL_ACTION: Partial<Record<VarianceSignal, RecommendationAction>> = {
  overspending: "decrease",
  underspending: "reallocate",
  depletion_risk: "monitor",
  expenditure_spike: "investigate",
  category_variance: "reallocate",
  period_variance: "reallocate",
  significant_deviation: "investigate",
};

/** Evidence-based recommendations derived exclusively from variance findings — never invents spending. */
export function buildRecommendationsFromFindings(findings: VarianceFinding[]): BudgetAdjustmentRecommendation[] {
  const recommendations: BudgetAdjustmentRecommendation[] = [];
  for (const finding of findings) {
    let action = SIGNAL_ACTION[finding.signal];
    if (!action) continue;
    if (finding.signal === "overspending" && finding.severity === "critical") action = "freeze";
    recommendations.push({
      recommendationId: nextRecommendationId(),
      budgetId: finding.budgetId,
      action,
      rationale: finding.description,
      suggestedDeltaMinor: finding.amountMinor,
      evidenceRefs: [`bpw:finding:${finding.findingId}`, ...finding.sourceRefs],
      fabricated: false,
    });
  }
  return recommendations;
}

/* ------------------------------------------------------------------------ */
/* Catalog, report, contract, engine record                                 */
/* ------------------------------------------------------------------------ */

export function buildCatalog(
  config: BudgetPlanningWorkerConfiguration,
  budgets: BudgetRecord[],
  variances: VarianceFinding[],
  recommendations: BudgetAdjustmentRecommendation[],
  reports: BudgetPlanningReport[],
  integrations: IntegrationHandshake[],
): BudgetPlanningWorkerCatalog {
  return {
    reportVersion: BUDGET_PLANNING_REPORT_VERSION,
    workerId: config.workerId,
    budgetCategories: [...config.budgetCategories],
    budgetPeriods: [...config.budgetPeriods],
    approvalStatuses: [...config.approvalStatuses],
    varianceSignals: [
      "overspending",
      "underspending",
      "depletion_risk",
      "expenditure_spike",
      "category_variance",
      "period_variance",
      "efficiency_signal",
      "significant_deviation",
      "none",
    ],
    currencies: [...config.currencies],
    budgets: budgets.map(cloneBudgetShallow),
    variances: variances.map((v) => ({ ...v, sourceRefs: [...v.sourceRefs] })),
    recommendations: recommendations.map((r) => ({ ...r, evidenceRefs: [...r.evidenceRefs] })),
    reports: reports.map((r) => ({ ...r })),
    integrations: integrations.map((i) => ({ ...i })),
    metadataVersion: BPW_METADATA_VERSION,
    executiveAuthority: "pillow",
    neverFabricateBudgetValuesOrSpendingData: true,
    neverApproveExpenditure: true,
    neverExecutePayments: true,
    neverForecastRevenue: true,
    neverReplaceProfitabilityWorker: true,
    neverModifyAccountingRecords: true,
    neverBypassGrandKingApproval: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ905OrLater: true,
  };
}

function cloneBudgetShallow(budget: BudgetRecord): BudgetRecord {
  return { ...budget, businessOrProject: { ...budget.businessOrProject } };
}

export function buildReport(params: {
  capitalBusinessId: string;
  capitalProjectId: string | null;
  budgetScope: BudgetScope;
  budgetPeriod: BudgetPeriod;
  budgets: BudgetRecord[];
  variances: VarianceFinding[];
  recommendations: BudgetAdjustmentRecommendation[];
  extraOutstandingIssues: string[];
  currency: string;
  validation: BpwValidationReport | null;
}): BudgetPlanningReport {
  const {
    capitalBusinessId,
    capitalProjectId,
    budgetScope,
    budgetPeriod,
    budgets,
    variances,
    recommendations,
    extraOutstandingIssues,
    currency,
    validation,
  } = params;

  const plannedBudget = moneySum(budgets.map((b) => b.plannedAmount), currency);
  const actualSpending = moneySum(budgets.map((b) => b.actualExpenditure), currency);
  const remainingBudget = moneySub(plannedBudget, actualSpending);
  const budgetUtilisation = computeUtilisationPercent(actualSpending, plannedBudget);

  const totalVarianceMinor = moneySum(budgets.map((b) => b.varianceAmount), currency);
  const totalVariancePercent = computeVariancePercent(totalVarianceMinor, plannedBudget);
  const overspendingCount = variances.filter((v) => v.signal === "overspending").length;
  const underspendingCount = variances.filter((v) => v.signal === "underspending").length;
  const depletionRiskCount = variances.filter((v) => v.signal === "depletion_risk").length;

  const varianceSummary: BudgetVarianceSummary = {
    totalVarianceMinor,
    totalVariancePercent,
    overspendingCount,
    underspendingCount,
    depletionRiskCount,
    findings: variances,
    fabricated: false,
  };

  const riskSignals: VarianceSignal[] = ["overspending", "depletion_risk", "expenditure_spike", "significant_deviation"];
  const budgetRisks = variances.filter((v) => riskSignals.includes(v.signal));

  const missingActualsIssues = budgets
    .filter((b) => !b.actualExpenditureEvidencePresent)
    .map((b) => `Budget ${b.budgetId} has no actual-expenditure evidence — treated as zero pending real spending data.`);

  const outstandingIssues = Array.from(new Set([...extraOutstandingIssues, ...missingActualsIssues]));

  const auditStatus: AuditStatus =
    outstandingIssues.length === 0 && budgets.length > 0
      ? "passed"
      : budgets.length === 0
        ? "pending"
        : "partial";

  const confidenceScore = computeConfidenceScore({
    hasBudgets: budgets.length > 0,
    outstandingIssueCount: outstandingIssues.length,
    allActualsEvidencePresent: budgets.every((b) => b.actualExpenditureEvidencePresent),
    allApprovalStatusResolved: budgets.every((b) => b.approvalStatus !== "unknown"),
  });

  const reportId = nextReportId();
  const now = new Date().toISOString();
  const budgetCategories = Array.from(new Set(budgets.map((b) => b.budgetCategory)));

  const traceabilityRefs = Array.from(
    new Set([
      `q9-04:report:${reportId}`,
      `q9-04:capital_business:${capitalBusinessId}`,
      `q9-04:scope:${budgetScope}`,
      ...budgets.flatMap((b) => b.traceabilityRefs),
    ]),
  );

  const supportingEvidence = Array.from(
    new Set([...budgets.flatMap((b) => b.traceabilityRefs), ...variances.flatMap((v) => v.sourceRefs)]),
  );

  return {
    reportId,
    timestamp: now,
    capitalProjectId,
    budgetPeriod,
    budgetScope,
    budgetCategories,
    plannedBudget,
    actualSpending,
    remainingBudget,
    budgetUtilisation,
    varianceSummary,
    budgetRisks,
    adjustmentRecommendations: recommendations,
    supportingEvidence,
    auditStatus,
    outstandingIssues,
    confidenceScore,
    metadataVersion: BPW_METADATA_VERSION,
    reportVersion: BUDGET_PLANNING_REPORT_VERSION,
    workerId: BUDGET_PLANNING_WORKER_IDENTITY.workerId,
    capitalBusinessId,
    budgets,
    validation,
    runTimestamp: now,
    consumableByQ905: true,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    traceabilityRefs,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    preserveCompleteTraceability: true,
    preserveHistoricalBudgetRevisions: true,
    neverFabricateBudgetValuesOrSpendingData: true,
    neverApproveExpenditure: true,
    neverExecutePayments: true,
    neverForecastRevenue: true,
    neverReplaceProfitabilityWorker: true,
    neverModifyAccountingRecords: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ905OrLater: true,
  };
}

export function buildQ905ConsumableContract(config: BudgetPlanningWorkerConfiguration): Q905ConsumableContract {
  return {
    contractId: `bpw-q905-contract-${BPW_METADATA_VERSION}`,
    contractVersion: BPW_METADATA_VERSION,
    producedBy: "budget-planning-worker",
    missionId: "Q9-04",
    consumerMissionId: "Q9-05",
    exposedFields: [
      "capitalBusinessId",
      "budgetPeriod",
      "budgetScope",
      "budgetCategories",
      "plannedBudget",
      "actualSpending",
      "remainingBudget",
      "budgetUtilisation",
      "varianceSummary",
      "budgetRisks",
      "adjustmentRecommendations",
      "budgets",
      "confidenceScore",
      "metadataVersion",
    ],
    budgetCategoryCatalog: [...config.budgetCategories],
    budgetPeriodCatalog: [...config.budgetPeriods],
    approvalStatusCatalog: [...config.approvalStatuses],
    varianceSignalCatalog: [
      "overspending",
      "underspending",
      "depletion_risk",
      "expenditure_spike",
      "category_variance",
      "period_variance",
      "efficiency_signal",
      "significant_deviation",
      "none",
    ],
    currencyCatalog: [...config.currencies],
    notes: [
      "Budget Planning Worker (Q9-04) creates and tracks budgets from real planned/actual amounts only — it never fabricates spending data.",
      "It does not approve expenditure, execute payments, forecast revenue, or calculate complete business profitability.",
      "Q9-05 (Profitability Worker) and later workers must consume this contract rather than reimplement Q9-04 budget logic.",
    ],
    neverImplementQ905OrLater: true,
    structuralSignalOnly: true,
  };
}

export function buildEngineRecord(params: {
  existingId: string | null;
  engineId: string;
  state: OperationalState;
  healthStatus: BudgetPlanningWorkerEngineRecord["healthStatus"];
  validationStatus: BudgetPlanningWorkerEngineRecord["validationStatus"];
  totalBudgets: number;
  totalVariances: number;
  lastApprovalStatus: ApprovalStatus | null;
  lastBusinessId: string | null;
  lastReportId: string | null;
  workerId: string;
  integrationTargets: BudgetPlanningWorkerEngineRecord["integrationTargets"];
}): BudgetPlanningWorkerEngineRecord {
  return {
    engineRecordId: params.existingId ?? `bpw-eng-${Date.now()}`,
    timestamp: new Date().toISOString(),
    engineId: params.engineId,
    engineVersion: "PILLOW-BPW-001",
    currentOperationalState: params.state,
    healthStatus: params.healthStatus,
    validationStatus: params.validationStatus,
    supportedCapabilities: [...BPW_CAPABILITIES] as BpwCapability[],
    totalBudgets: params.totalBudgets,
    totalVariances: params.totalVariances,
    lastApprovalStatus: params.lastApprovalStatus,
    lastBusinessId: params.lastBusinessId,
    lastReportId: params.lastReportId,
    workerId: params.workerId,
    integrationTargets: params.integrationTargets,
    metadataVersion: BPW_METADATA_VERSION,
  };
}