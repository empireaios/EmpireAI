import type { ForecastingWorkerConfiguration } from "./configuration.js";
import { FORECASTING_REPORT_VERSION, FORECASTING_WORKER_IDENTITY, FRCW_CAPABILITIES, FRCW_METADATA_VERSION } from "./paths.js";
import {
  nextAssumptionId,
  nextReinvestmentOptionId,
  nextReportId,
  nextRunwayEstimateId,
  nextScenarioComparisonId,
  nextSeriesId,
} from "./forecast-store.js";
import { computeConfidenceScore, projectSeriesForward, type CashRunwayComputation } from "./forecast-calculator.js";
import { moneyFromMinor, splitByBasisPoints } from "./money.js";
import type {
  CashRunwayEstimate,
  ConfidenceAssessment,
  ForecastAssumption,
  ForecastingReport,
  ForecastingWorkerCatalog,
  ForecastingWorkerEngineRecord,
  ForecastMetric,
  ForecastModel,
  ForecastPoint,
  ForecastSeries,
  HistoricalBaseline,
  HistoricalPoint,
  IntegrationHandshake,
  OperationalState,
  Q907ConsumableContract,
  ReinvestmentOption,
  ScenarioComparison,
  ScenarioComparisonEntry,
  ScenarioKind,
  FrcwCapability,
} from "./types.js";

/* ------------------------------------------------------------------------ */
/* Forecast series assembly                                                 */
/* ------------------------------------------------------------------------ */

export function buildForecastSeries(params: {
  metric: ForecastMetric;
  scenario: ScenarioKind;
  model: ForecastModel;
  currency: string;
  businessId: string;
  growthRateBps: number;
  horizonPeriods: number;
  lastAmountMinor: number;
  lastPeriodLabel: string;
  assumptionRefs: string[];
  confidenceBps: number;
}): ForecastSeries {
  const projected = projectSeriesForward({
    lastAmountMinor: params.lastAmountMinor,
    lastPeriodLabel: params.lastPeriodLabel,
    growthRateBps: params.growthRateBps,
    horizonPeriods: params.horizonPeriods,
  });
  const points: ForecastPoint[] = projected.map((p) => ({
    periodLabel: p.periodLabel,
    amountMinor: p.amountMinor,
    currency: params.currency,
    metric: params.metric,
    scenario: params.scenario,
    model: params.model,
    isForecast: true,
    isHistorical: false,
    fabricated: false,
    assumptionRefs: [...params.assumptionRefs],
    confidenceBps: params.confidenceBps,
  }));
  return {
    seriesId: nextSeriesId(),
    metric: params.metric,
    scenario: params.scenario,
    model: params.model,
    currency: params.currency,
    businessId: params.businessId,
    growthRateBps: params.growthRateBps,
    horizonPeriods: params.horizonPeriods,
    points,
    assumptionRefs: [...params.assumptionRefs],
    isForecast: true,
    fabricated: false,
  };
}

/**
 * Derive a series (e.g. net-cashflow or profit) as the period-aligned
 * subtraction of one series from another (`minuend - subtrahend`) — used
 * when no direct historical trend for the metric is available. Never
 * invents periods beyond the shorter of the two input series.
 */
export function combineSeriesBySubtraction(params: {
  metric: ForecastMetric;
  model: ForecastModel;
  minuend: ForecastSeries;
  subtrahend: ForecastSeries;
}): ForecastSeries {
  const { metric, model, minuend, subtrahend } = params;
  const length = Math.min(minuend.points.length, subtrahend.points.length);
  const points: ForecastPoint[] = [];
  for (let i = 0; i < length; i += 1) {
    const a = minuend.points[i]!;
    const b = subtrahend.points[i]!;
    points.push({
      periodLabel: a.periodLabel,
      amountMinor: a.amountMinor - b.amountMinor,
      currency: minuend.currency,
      metric,
      scenario: minuend.scenario,
      model,
      isForecast: true,
      isHistorical: false,
      fabricated: false,
      assumptionRefs: Array.from(new Set([...a.assumptionRefs, ...b.assumptionRefs])),
      confidenceBps: Math.min(a.confidenceBps, b.confidenceBps),
    });
  }
  return {
    seriesId: nextSeriesId(),
    metric,
    scenario: minuend.scenario,
    model,
    currency: minuend.currency,
    businessId: minuend.businessId,
    growthRateBps: minuend.growthRateBps,
    horizonPeriods: length,
    points,
    assumptionRefs: Array.from(new Set([...minuend.assumptionRefs, ...subtrahend.assumptionRefs])),
    isForecast: true,
    fabricated: false,
  };
}

/* ------------------------------------------------------------------------ */
/* Assumptions, historical baseline                                         */
/* ------------------------------------------------------------------------ */

export function buildAssumption(params: {
  key: ForecastModel | string;
  description: string;
  valueBps?: number | null;
  valueMinor?: number | null;
  source: string;
}): ForecastAssumption {
  return {
    assumptionId: nextAssumptionId(),
    key: params.key,
    description: params.description,
    valueBps: params.valueBps ?? null,
    valueMinor: params.valueMinor ?? null,
    source: params.source,
    fabricated: false,
  };
}

export function buildHistoricalBaseline(params: {
  currency: string;
  capitalBusinessId: string;
  points: HistoricalPoint[];
}): HistoricalBaseline {
  const sourceRefs = Array.from(new Set(params.points.map((p) => p.sourceRef)));
  const periodsCovered = new Set(params.points.map((p) => p.periodLabel)).size;
  return {
    currency: params.currency,
    capitalBusinessId: params.capitalBusinessId,
    points: params.points,
    sourceRefs,
    periodsCovered,
    isHistorical: true,
    fabricated: false,
  };
}

/* ------------------------------------------------------------------------ */
/* Cash runway, reinvestment, scenario comparison                           */
/* ------------------------------------------------------------------------ */

export function buildRunwayEstimate(params: {
  capitalBusinessId: string;
  openingCashMinor: number;
  computation: CashRunwayComputation;
  currency: string;
  scenario: ScenarioKind;
  assumptions: ForecastAssumption[];
  supportingEvidence: string[];
}): CashRunwayEstimate {
  return {
    estimateId: nextRunwayEstimateId(),
    capitalBusinessId: params.capitalBusinessId,
    openingCashMinor: moneyFromMinor(params.openingCashMinor, params.currency),
    monthlyNetBurnMinor: moneyFromMinor(params.computation.monthlyNetBurnMinor, params.currency),
    monthlySurplusMinor: moneyFromMinor(params.computation.monthlySurplusMinor, params.currency),
    runwayStatus: params.computation.status,
    runwayMonths: params.computation.runwayMonths,
    runwayDays: params.computation.runwayDays,
    currency: params.currency,
    scenario: params.scenario,
    assumptions: params.assumptions,
    supportingEvidence: params.supportingEvidence,
    isForecast: true,
    fabricated: false,
  };
}

const REINVESTMENT_LABELS = ["conservative_reinvestment", "balanced_reinvestment", "aggressive_reinvestment"];

/**
 * Structural, non-binding reinvestment suggestions sized as basis-point
 * portions of the monthly surplus — produced only when a real surplus
 * exists. Never an instruction to execute; every option is explicitly
 * flagged `isForecast: true` and carries risk notes reiterating that the
 * Forecasting Worker never executes investments or approves budgets.
 */
export function buildReinvestmentOptions(params: {
  capitalBusinessId: string;
  monthlySurplusMinor: number;
  currency: string;
  tierBps: readonly number[];
  evidenceRefs: string[];
}): ReinvestmentOption[] {
  if (params.monthlySurplusMinor <= 0) return [];
  const amounts = splitByBasisPoints(params.monthlySurplusMinor, params.tierBps);
  return amounts.map((amountMinor, index) => {
    const tierBps = params.tierBps[index]!;
    const label = REINVESTMENT_LABELS[index] ?? `reinvestment_tier_${index + 1}`;
    return {
      optionId: nextReinvestmentOptionId(),
      label,
      recommendedAmountMinor: moneyFromMinor(amountMinor, params.currency),
      rationale: `Structural suggestion sized at ${tierBps} bps of the estimated monthly surplus (${params.monthlySurplusMinor} ${params.currency} minor units) for capital business ${params.capitalBusinessId}.`,
      expectedImpact:
        index === 0
          ? "Conservative allocation intended to preserve runway while funding modest growth initiatives."
          : index === amounts.length - 1
            ? "Aggressive allocation intended to accelerate growth; reduces the cash buffer available for downside scenarios."
            : "Balanced allocation intended to fund growth initiatives while preserving a meaningful cash buffer.",
      riskNotes: [
        "This is a structural suggestion only — the Forecasting Worker never executes investments or approves budgets.",
        "Any deployment of capital requires Grand King approval and execution by an authorised worker.",
      ],
      evidenceRefs: [...params.evidenceRefs],
      isForecast: true,
      fabricated: false,
    };
  });
}

export function buildScenarioComparison(params: {
  capitalBusinessId: string;
  currency: string;
  horizonPeriods: number;
  entries: ScenarioComparisonEntry[];
  assumptionRefs: string[];
}): ScenarioComparison {
  return {
    comparisonId: nextScenarioComparisonId(),
    currency: params.currency,
    capitalBusinessId: params.capitalBusinessId,
    horizonPeriods: params.horizonPeriods,
    scenarios: params.entries,
    assumptionRefs: [...params.assumptionRefs],
    isForecast: true,
    fabricated: false,
  };
}

export function buildConfidenceAssessment(params: {
  overallConfidenceBps: number;
  notes: string[];
  limitingFactors: string[];
}): ConfidenceAssessment {
  return {
    overallConfidenceBps: params.overallConfidenceBps,
    notes: params.notes,
    limitingFactors: params.limitingFactors,
    fabricated: false,
  };
}

/* ------------------------------------------------------------------------ */
/* Catalog, report, contract, engine record                                 */
/* ------------------------------------------------------------------------ */

export function buildCatalog(
  config: ForecastingWorkerConfiguration,
  historicalPointCount: number,
  forecastSeries: ForecastSeries[],
  runwayEstimates: CashRunwayEstimate[],
  reinvestmentOptions: ReinvestmentOption[],
  scenarioComparisons: ScenarioComparison[],
  reports: ForecastingReport[],
  integrations: IntegrationHandshake[],
): ForecastingWorkerCatalog {
  return {
    reportVersion: FORECASTING_REPORT_VERSION,
    workerId: config.workerId,
    forecastModels: [...config.forecastModels],
    scenarioKinds: [...config.scenarioKinds],
    forecastMetrics: [...config.forecastMetrics],
    currencies: [...config.currencies],
    historicalPointCount,
    forecastSeries: forecastSeries.map((s) => ({ ...s })),
    runwayEstimates: runwayEstimates.map((r) => ({ ...r })),
    reinvestmentOptions: reinvestmentOptions.map((r) => ({ ...r })),
    scenarioComparisons: scenarioComparisons.map((c) => ({ ...c })),
    reports: reports.map((r) => ({ ...r })),
    integrations: integrations.map((i) => ({ ...i })),
    metadataVersion: FRCW_METADATA_VERSION,
    executiveAuthority: "pillow",
    neverFabricateHistoricalFinancialData: true,
    neverPresentForecastsAsGuaranteedOutcomes: true,
    neverExecuteInvestments: true,
    neverApproveBudgets: true,
    neverReplaceInvestmentPlanningWorker: true,
    neverModifyAccountingRecords: true,
    neverBypassGrandKingApproval: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ907OrLater: true,
  };
}

export function buildReport(params: {
  capitalBusinessId: string;
  capitalProjectId: string | null;
  forecastPeriod: string;
  revenueForecast: ForecastSeries;
  costForecast: ForecastSeries;
  cashflowForecast: ForecastSeries;
  profitForecast: ForecastSeries;
  cashRunway: CashRunwayEstimate;
  reinvestmentOptions: ReinvestmentOption[];
  forecastAssumptions: ForecastAssumption[];
  scenarioComparison: ScenarioComparison;
  historicalBaseline: HistoricalBaseline;
  extraOutstandingIssues: string[];
}): ForecastingReport {
  const {
    capitalBusinessId,
    capitalProjectId,
    forecastPeriod,
    revenueForecast,
    costForecast,
    cashflowForecast,
    profitForecast,
    cashRunway,
    reinvestmentOptions,
    forecastAssumptions,
    scenarioComparison,
    historicalBaseline,
    extraOutstandingIssues,
  } = params;

  const outstandingIssues = Array.from(new Set(extraOutstandingIssues));

  const hasHistory = historicalBaseline.points.length > 0;
  const growthAssumptionsFromRealData = forecastAssumptions.some(
    (a) => (a.key === "growth_assumption" || a.key === "cost_assumption") && a.source !== "zero_growth_default_due_to_insufficient_history",
  );
  const confidenceScore = computeConfidenceScore([
    hasHistory,
    outstandingIssues.length === 0,
    growthAssumptionsFromRealData,
    cashRunway.runwayStatus !== "breakeven" || cashRunway.openingCashMinor.minorUnits > 0,
  ]);

  const overallConfidenceBps = confidenceScore * 100;
  const confidenceAssessment = buildConfidenceAssessment({
    overallConfidenceBps,
    notes: [
      "Forecasts are structural projections derived from verified historical evidence and documented assumptions — never a guaranteed outcome.",
      `Historical baseline covers ${historicalBaseline.periodsCovered} distinct period(s) across ${historicalBaseline.points.length} verified point(s).`,
    ],
    limitingFactors: outstandingIssues,
  });

  const auditStatus = outstandingIssues.length === 0 && hasHistory ? "passed" : !hasHistory ? "pending" : "partial";

  const reportId = nextReportId();
  const now = new Date().toISOString();

  const supportingEvidence = Array.from(
    new Set([
      ...historicalBaseline.sourceRefs,
      ...revenueForecast.assumptionRefs,
      ...costForecast.assumptionRefs,
      ...cashflowForecast.assumptionRefs,
      ...profitForecast.assumptionRefs,
      ...cashRunway.supportingEvidence,
      ...reinvestmentOptions.flatMap((o) => o.evidenceRefs),
    ]),
  );

  const traceabilityRefs = Array.from(
    new Set([
      `q9-06:report:${reportId}`,
      `q9-06:capital_business:${capitalBusinessId}`,
      `q9-06:forecast_period:${forecastPeriod}`,
      ...supportingEvidence,
    ]),
  );

  return {
    reportId,
    timestamp: now,
    capitalProjectId,
    forecastPeriod,
    revenueForecast,
    costForecast,
    cashflowForecast,
    cashRunway,
    profitForecast,
    reinvestmentOptions,
    forecastAssumptions,
    confidenceAssessment,
    scenarioComparison,
    supportingEvidence,
    auditStatus,
    outstandingIssues,
    confidenceScore,
    metadataVersion: FRCW_METADATA_VERSION,
    reportVersion: FORECASTING_REPORT_VERSION,
    workerId: FORECASTING_WORKER_IDENTITY.workerId,
    capitalBusinessId,
    historicalBaseline,
    validation: null,
    runTimestamp: now,
    consumableByQ907: true,
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    traceabilityRefs,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    preserveCompleteTraceability: true,
    preserveForecastHistory: true,
    neverPresentForecastsAsGuaranteedOutcomes: true,
    neverFabricateHistoricalFinancialData: true,
    neverExecuteInvestments: true,
    neverApproveBudgets: true,
    neverReplaceInvestmentPlanningWorker: true,
    neverModifyAccountingRecords: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ907OrLater: true,
  };
}

export function buildQ907ConsumableContract(config: ForecastingWorkerConfiguration): Q907ConsumableContract {
  return {
    contractId: `frcw-q907-contract-${FRCW_METADATA_VERSION}`,
    contractVersion: FRCW_METADATA_VERSION,
    producedBy: "forecasting-worker",
    missionId: "Q9-06",
    consumerMissionId: "Q9-07",
    exposedFields: [
      "capitalBusinessId",
      "forecastPeriod",
      "revenueForecast",
      "costForecast",
      "cashflowForecast",
      "cashRunway",
      "profitForecast",
      "reinvestmentOptions",
      "forecastAssumptions",
      "confidenceAssessment",
      "scenarioComparison",
      "historicalBaseline",
      "confidenceScore",
      "metadataVersion",
    ],
    forecastModelCatalog: [...config.forecastModels],
    scenarioKindCatalog: [...config.scenarioKinds],
    forecastMetricCatalog: [...config.forecastMetrics],
    currencyCatalog: [...config.currencies],
    notes: [
      "Forecasting Worker (Q9-06) projects revenue, cost, cashflow, profit, cash runway, and structural reinvestment suggestions from verified historical evidence only — it never fabricates historical financial data and never presents a forecast as a guaranteed outcome.",
      "It does not execute investments, approve budgets, replace the Investment Planning Worker, or modify accounting records.",
      "Q9-07 (Tax Support Worker) and later workers must consume this contract rather than reimplement Q9-06 forecasting logic.",
    ],
    neverImplementQ907OrLater: true,
    structuralSignalOnly: true,
  };
}

export function buildEngineRecord(params: {
  existingId: string | null;
  engineId: string;
  state: OperationalState;
  healthStatus: ForecastingWorkerEngineRecord["healthStatus"];
  validationStatus: ForecastingWorkerEngineRecord["validationStatus"];
  totalForecastSeries: number;
  totalRunwayEstimates: number;
  totalReports: number;
  lastScenario: ScenarioKind | null;
  lastBusinessId: string | null;
  lastReportId: string | null;
  workerId: string;
  integrationTargets: ForecastingWorkerEngineRecord["integrationTargets"];
}): ForecastingWorkerEngineRecord {
  return {
    engineRecordId: params.existingId ?? `frcw-eng-${Date.now()}`,
    timestamp: new Date().toISOString(),
    engineId: params.engineId,
    engineVersion: "PILLOW-FRCW-001",
    currentOperationalState: params.state,
    healthStatus: params.healthStatus,
    validationStatus: params.validationStatus,
    supportedCapabilities: [...FRCW_CAPABILITIES] as FrcwCapability[],
    totalForecastSeries: params.totalForecastSeries,
    totalRunwayEstimates: params.totalRunwayEstimates,
    totalReports: params.totalReports,
    lastScenario: params.lastScenario,
    lastBusinessId: params.lastBusinessId,
    lastReportId: params.lastReportId,
    workerId: params.workerId,
    integrationTargets: params.integrationTargets,
    metadataVersion: FRCW_METADATA_VERSION,
  };
}
