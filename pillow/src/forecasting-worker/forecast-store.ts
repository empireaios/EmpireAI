import type {
  CashRunwayEstimate,
  ForecastingReport,
  ForecastMetric,
  ForecastSeries,
  HistoricalPoint,
  InjectedAccountingEntry,
  InjectedBudgetReport,
  InjectedCashflowReport,
  InjectedProfitabilityReport,
  ReinvestmentOption,
  ScenarioComparison,
  ScenarioKind,
} from "./types.js";

let historicalSeq = 0;
let seriesSeq = 0;
let assumptionSeq = 0;
let runwaySeq = 0;
let reinvestmentSeq = 0;
let comparisonSeq = 0;
let reportSeq = 0;

export function resetFrcwSequenceForTesting() {
  historicalSeq = 0;
  seriesSeq = 0;
  assumptionSeq = 0;
  runwaySeq = 0;
  reinvestmentSeq = 0;
  comparisonSeq = 0;
  reportSeq = 0;
}

export function nextHistoricalSourceRef(): string {
  historicalSeq += 1;
  return `frcw-hist-${String(historicalSeq).padStart(4, "0")}`;
}

export function nextSeriesId(): string {
  seriesSeq += 1;
  return `frcw-series-${String(seriesSeq).padStart(4, "0")}`;
}

export function nextAssumptionId(): string {
  assumptionSeq += 1;
  return `frcw-assumption-${String(assumptionSeq).padStart(4, "0")}`;
}

export function nextRunwayEstimateId(): string {
  runwaySeq += 1;
  return `frcw-runway-${String(runwaySeq).padStart(4, "0")}`;
}

export function nextReinvestmentOptionId(): string {
  reinvestmentSeq += 1;
  return `frcw-reinvest-${String(reinvestmentSeq).padStart(4, "0")}`;
}

export function nextScenarioComparisonId(): string {
  comparisonSeq += 1;
  return `frcw-comparison-${String(comparisonSeq).padStart(4, "0")}`;
}

export function nextReportId(): string {
  reportSeq += 1;
  return `frcw-rpt-${String(reportSeq).padStart(4, "0")}`;
}

function seriesKey(businessId: string, metric: ForecastMetric, scenario: ScenarioKind): string {
  return `${businessId}:${metric}:${scenario}`;
}

/**
 * Authoritative in-memory forecasting store. Historical points are
 * accumulated and deduplicated by `sourceRef` (an upsert-by-source model:
 * re-submitting the same verified point replaces the earlier copy rather
 * than double-counting it) — they are never fabricated, only ever supplied
 * by a verified source. Forecast series are upserted per
 * `businessId:metric:scenario`. Historical Forecasting Reports, runway
 * estimates, and scenario comparisons are preserved (append-only) in
 * keeping with `preserveForecastHistory`.
 */
export class FrcwStore {
  private historicalPoints = new Map<string, HistoricalPoint>();
  private accountingEntries: InjectedAccountingEntry[] = [];
  private cashflowReports: InjectedCashflowReport[] = [];
  private budgetReports: InjectedBudgetReport[] = [];
  private profitabilityReports: InjectedProfitabilityReport[] = [];
  private forecastSeries = new Map<string, ForecastSeries>();
  private runwayEstimates: CashRunwayEstimate[] = [];
  private reinvestmentOptions: ReinvestmentOption[] = [];
  private scenarioComparisons: ScenarioComparison[] = [];
  private reports: ForecastingReport[] = [];
  private latestBusinessId: string | null = null;
  private latestScenario: ScenarioKind | null = null;
  private auditTrail: Array<{ timestamp: string; action: string; detail: string }> = [];

  seed(points: HistoricalPoint[]) {
    this.historicalPoints.clear();
    for (const point of points) {
      this.historicalPoints.set(point.sourceRef, clonePoint(point));
      if (point.businessId) this.latestBusinessId = point.businessId;
    }
  }

  addHistoricalPoints(points: HistoricalPoint[]): HistoricalPoint[] {
    const added: HistoricalPoint[] = [];
    for (const point of points) {
      const cloned = clonePoint(point);
      this.historicalPoints.set(point.sourceRef, cloned);
      added.push(cloned);
      if (point.businessId) this.latestBusinessId = point.businessId;
    }
    if (added.length) this.audit("add_historical_points", `count=${added.length}`);
    return added;
  }

  listHistoricalPoints(filter?: { businessId?: string | null; metric?: ForecastMetric; currency?: string | null }): HistoricalPoint[] {
    let all = [...this.historicalPoints.values()].map(clonePoint);
    if (filter?.businessId) all = all.filter((p) => p.businessId === filter.businessId);
    if (filter?.metric) all = all.filter((p) => p.metric === filter.metric);
    if (filter?.currency) all = all.filter((p) => p.currency === filter.currency);
    return all;
  }

  countHistoricalPoints(): number {
    return this.historicalPoints.size;
  }

  addAccountingEntries(entries: InjectedAccountingEntry[]): InjectedAccountingEntry[] {
    const cloned = entries.map((e) => ({ ...e, lines: e.lines.map((l) => ({ ...l })) }));
    this.accountingEntries.push(...cloned);
    for (const entry of entries) {
      if (entry.businessId) this.latestBusinessId = entry.businessId;
    }
    if (cloned.length) this.audit("consume_accounting_records", `count=${cloned.length}`);
    return cloned;
  }

  listAccountingEntries(): InjectedAccountingEntry[] {
    return this.accountingEntries.map((e) => ({ ...e, lines: e.lines.map((l) => ({ ...l })) }));
  }

  addCashflowReports(reports: InjectedCashflowReport[]): InjectedCashflowReport[] {
    const cloned = reports.map((r) => ({ ...r }));
    this.cashflowReports.push(...cloned);
    for (const report of reports) {
      if (report.capitalBusinessId) this.latestBusinessId = report.capitalBusinessId;
    }
    if (cloned.length) this.audit("consume_cashflow_reports", `count=${cloned.length}`);
    return cloned;
  }

  listCashflowReports(): InjectedCashflowReport[] {
    return this.cashflowReports.map((r) => ({ ...r }));
  }

  addBudgetReports(reports: InjectedBudgetReport[]): InjectedBudgetReport[] {
    const cloned = reports.map((r) => ({ ...r }));
    this.budgetReports.push(...cloned);
    for (const report of reports) {
      if (report.capitalBusinessId) this.latestBusinessId = report.capitalBusinessId;
    }
    if (cloned.length) this.audit("consume_budget_reports", `count=${cloned.length}`);
    return cloned;
  }

  listBudgetReports(): InjectedBudgetReport[] {
    return this.budgetReports.map((r) => ({ ...r }));
  }

  addProfitabilityReports(reports: InjectedProfitabilityReport[]): InjectedProfitabilityReport[] {
    const cloned = reports.map((r) => ({ ...r }));
    this.profitabilityReports.push(...cloned);
    for (const report of reports) {
      if (report.capitalBusinessId) this.latestBusinessId = report.capitalBusinessId;
    }
    if (cloned.length) this.audit("consume_profitability_reports", `count=${cloned.length}`);
    return cloned;
  }

  listProfitabilityReports(): InjectedProfitabilityReport[] {
    return this.profitabilityReports.map((r) => ({ ...r }));
  }

  upsertForecastSeries(businessId: string, series: ForecastSeries): ForecastSeries {
    const key = seriesKey(businessId, series.metric, series.scenario);
    this.forecastSeries.set(key, cloneSeries(series));
    this.latestBusinessId = businessId;
    this.latestScenario = series.scenario;
    this.audit(`upsert_forecast_series:${key}`, `points=${series.points.length}`);
    return this.getForecastSeries(businessId, series.metric, series.scenario)!;
  }

  getForecastSeries(businessId: string, metric: ForecastMetric, scenario: ScenarioKind): ForecastSeries | null {
    const found = this.forecastSeries.get(seriesKey(businessId, metric, scenario));
    return found ? cloneSeries(found) : null;
  }

  listForecastSeriesForMetric(businessId: string, metric: ForecastMetric): ForecastSeries[] {
    return [...this.forecastSeries.values()]
      .filter((s) => s.businessId === businessId && s.metric === metric)
      .map(cloneSeries);
  }

  listAllForecastSeries(): ForecastSeries[] {
    return [...this.forecastSeries.values()].map(cloneSeries);
  }

  countForecastSeries(): number {
    return this.forecastSeries.size;
  }

  addRunwayEstimate(estimate: CashRunwayEstimate): CashRunwayEstimate {
    const cloned = cloneRunway(estimate);
    this.runwayEstimates.push(cloned);
    this.latestBusinessId = estimate.capitalBusinessId;
    this.audit(`add_runway_estimate:${estimate.estimateId}`, `status=${estimate.runwayStatus}`);
    return cloneRunway(cloned);
  }

  getLatestRunwayEstimate(businessId?: string): CashRunwayEstimate | null {
    const pool = businessId ? this.runwayEstimates.filter((r) => r.capitalBusinessId === businessId) : this.runwayEstimates;
    return pool.length ? cloneRunway(pool[pool.length - 1]!) : null;
  }

  listRunwayEstimates(): CashRunwayEstimate[] {
    return this.runwayEstimates.map(cloneRunway);
  }

  setReinvestmentOptions(options: ReinvestmentOption[]): ReinvestmentOption[] {
    this.reinvestmentOptions = options.map(cloneOption);
    return this.listReinvestmentOptions();
  }

  listReinvestmentOptions(): ReinvestmentOption[] {
    return this.reinvestmentOptions.map(cloneOption);
  }

  addScenarioComparison(comparison: ScenarioComparison): ScenarioComparison {
    const cloned = cloneComparison(comparison);
    this.scenarioComparisons.push(cloned);
    this.latestBusinessId = comparison.capitalBusinessId;
    this.audit(`add_scenario_comparison:${comparison.comparisonId}`, `scenarios=${comparison.scenarios.length}`);
    return cloneComparison(cloned);
  }

  getLatestScenarioComparison(): ScenarioComparison | null {
    return this.scenarioComparisons.length ? cloneComparison(this.scenarioComparisons[this.scenarioComparisons.length - 1]!) : null;
  }

  listScenarioComparisons(): ScenarioComparison[] {
    return this.scenarioComparisons.map(cloneComparison);
  }

  /** Historical reports are preserved — never overwritten. */
  addReport(report: ForecastingReport): ForecastingReport {
    const stored = cloneReport(report);
    this.reports.push(stored);
    this.latestBusinessId = report.capitalBusinessId;
    this.audit(`add_report:${report.reportId}`, `business=${report.capitalBusinessId}`);
    return cloneReport(stored);
  }

  replaceLatestReport(report: ForecastingReport): ForecastingReport {
    if (this.reports.length && this.reports[this.reports.length - 1]!.reportId === report.reportId) {
      this.reports[this.reports.length - 1] = cloneReport(report);
    } else {
      this.reports.push(cloneReport(report));
    }
    this.latestBusinessId = report.capitalBusinessId;
    return cloneReport(this.getLatestReport()!);
  }

  getLatestReport(): ForecastingReport | null {
    return this.reports.length ? cloneReport(this.reports[this.reports.length - 1]!) : null;
  }

  listReports(): ForecastingReport[] {
    return this.reports.map(cloneReport);
  }

  getLatestBusinessId(): string | null {
    return this.latestBusinessId;
  }

  getLatestScenario(): ScenarioKind | null {
    return this.latestScenario;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((e) => ({ ...e }));
  }

  private audit(action: string, detail: string) {
    this.auditTrail.push({ timestamp: new Date().toISOString(), action, detail });
  }
}

function clonePoint(point: HistoricalPoint): HistoricalPoint {
  return { ...point };
}

function cloneForecastPoint<T extends { assumptionRefs: string[] }>(point: T): T {
  return { ...point, assumptionRefs: [...point.assumptionRefs] };
}

function cloneSeries(series: ForecastSeries): ForecastSeries {
  return {
    ...series,
    points: series.points.map(cloneForecastPoint),
    assumptionRefs: [...series.assumptionRefs],
  };
}

function cloneRunway(estimate: CashRunwayEstimate): CashRunwayEstimate {
  return {
    ...estimate,
    openingCashMinor: { ...estimate.openingCashMinor },
    monthlyNetBurnMinor: { ...estimate.monthlyNetBurnMinor },
    monthlySurplusMinor: { ...estimate.monthlySurplusMinor },
    assumptions: estimate.assumptions.map((a) => ({ ...a })),
    supportingEvidence: [...estimate.supportingEvidence],
  };
}

function cloneOption(option: ReinvestmentOption): ReinvestmentOption {
  return {
    ...option,
    recommendedAmountMinor: { ...option.recommendedAmountMinor },
    riskNotes: [...option.riskNotes],
    evidenceRefs: [...option.evidenceRefs],
  };
}

function cloneComparison(comparison: ScenarioComparison): ScenarioComparison {
  return {
    ...comparison,
    scenarios: comparison.scenarios.map((s) => ({
      ...s,
      endingRevenueMinor: { ...s.endingRevenueMinor },
      endingCostMinor: { ...s.endingCostMinor },
      endingCashflowMinor: { ...s.endingCashflowMinor },
      endingProfitMinor: { ...s.endingProfitMinor },
    })),
    assumptionRefs: [...comparison.assumptionRefs],
  };
}

function cloneReport(report: ForecastingReport): ForecastingReport {
  return {
    ...report,
    revenueForecast: cloneSeries(report.revenueForecast),
    costForecast: cloneSeries(report.costForecast),
    cashflowForecast: cloneSeries(report.cashflowForecast),
    profitForecast: cloneSeries(report.profitForecast),
    cashRunway: cloneRunway(report.cashRunway),
    reinvestmentOptions: report.reinvestmentOptions.map(cloneOption),
    forecastAssumptions: report.forecastAssumptions.map((a) => ({ ...a })),
    confidenceAssessment: {
      ...report.confidenceAssessment,
      notes: [...report.confidenceAssessment.notes],
      limitingFactors: [...report.confidenceAssessment.limitingFactors],
    },
    scenarioComparison: cloneComparison(report.scenarioComparison),
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    historicalBaseline: {
      ...report.historicalBaseline,
      points: report.historicalBaseline.points.map(clonePoint),
      sourceRefs: [...report.historicalBaseline.sourceRefs],
    },
    validation: report.validation
      ? { ...report.validation, errors: [...report.validation.errors], warnings: [...report.validation.warnings] }
      : null,
    traceabilityRefs: [...report.traceabilityRefs],
  };
}
