import type { ForecastingWorkerConfiguration } from "./configuration.js";
import { IntegrationCoordinator, type ForecastingWorkerDependencies } from "./integrations.js";
import { appendFrcwLog } from "./frcw-logging.js";
import { FORECASTING_WORKER_ID, FRCW_METADATA_VERSION, INTEGRATION_TARGETS, SCENARIO_KINDS } from "./paths.js";
import {
  buildAssumption,
  buildCatalog,
  buildConfidenceAssessment,
  buildEngineRecord,
  buildForecastSeries,
  buildHistoricalBaseline,
  buildQ907ConsumableContract,
  buildReinvestmentOptions,
  buildReport,
  buildRunwayEstimate,
  buildScenarioComparison,
  combineSeriesBySubtraction,
} from "./forecast-builder.js";
import {
  averageNetCashflow,
  buildScenarioGrowthRates,
  computeCashRunway,
  computeConfidenceBps,
  deriveGrowthRateBps,
  filterHistoricalPoints,
  normalizeCurrency,
  resolveForecastPeriodLabel,
  sortHistoricalPointsChronologically,
} from "./forecast-calculator.js";
import { FrcwStore } from "./forecast-store.js";
import { FrcwValidator, HealthMonitor, RecoveryManager } from "./forecast-validator.js";
import { moneyFromMinor } from "./money.js";
import type {
  CashRunwayEstimate,
  ForecastAssumption,
  ForecastingReport,
  ForecastingWorkerCatalog,
  ForecastingWorkerEngineRecord,
  ForecastMetric,
  ForecastModel,
  ForecastSeries,
  HistoricalPoint,
  IntegrationHandshake,
  IntegrationTarget,
  OperationalState,
  ReinvestmentOption,
  ScenarioComparison,
  ScenarioComparisonEntry,
  ScenarioKind,
  FrcwInput,
  FrcwRunReport,
  FrcwValidationReport,
  Q907ConsumableContract,
} from "./types.js";

type TrendBundle = {
  points: HistoricalPoint[];
  seriesByScenario: Record<ScenarioKind, ForecastSeries> | null;
  assumptions: ForecastAssumption[];
  hasHistory: boolean;
};

type FullForecastSet = {
  hasHistory: boolean;
  missingMetrics: string[];
  revenueBundle: TrendBundle;
  costBundle: TrendBundle;
  cashflowByScenario: Record<ScenarioKind, ForecastSeries> | null;
  profitByScenario: Record<ScenarioKind, ForecastSeries> | null;
  usedProfitFallback: boolean;
  points: HistoricalPoint[];
  assumptions: ForecastAssumption[];
};

export class ForecastingWorkerManager {
  private engineRecord: ForecastingWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: ForecastingWorkerCatalog | null = null;
  private readonly store = new FrcwStore();
  private readonly validator = new FrcwValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];

  bindIntegrations(deps: ForecastingWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: ForecastingWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedHistoricalPoints);
    this.rebuildCatalog(config);
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
          integrationTargets: [...this.engineRecord.integrationTargets],
        }
      : null;
  }

  getCatalog() {
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getHistoricalPoints(filter?: { businessId?: string | null; metric?: ForecastMetric; currency?: string | null }) {
    return this.store.listHistoricalPoints(filter);
  }

  getForecastSeries(metric?: ForecastMetric) {
    const all = this.store.listAllForecastSeries();
    return metric ? all.filter((s) => s.metric === metric) : all;
  }

  getRunwayEstimates() {
    return this.store.listRunwayEstimates();
  }

  getReinvestmentOptions() {
    return this.store.listReinvestmentOptions();
  }

  getScenarioComparisons() {
    return this.store.listScenarioComparisons();
  }

  getReports() {
    return this.store.listReports();
  }

  getLatestBusinessId() {
    return this.store.getLatestBusinessId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  getQ907ConsumableContract(config: ForecastingWorkerConfiguration): Q907ConsumableContract {
    return buildQ907ConsumableContract(config);
  }

  connect(_input: Record<string, unknown>, config: ForecastingWorkerConfiguration): FrcwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.integrationTargets.length ? (config.integrationTargets as IntegrationTarget[]) : [...INTEGRATION_TARGETS],
    );
    this.rebuildCatalog(config);
    this.ensureRecord("connected", config);
    appendFrcwLog({ event: "connect", details: `Forecasting Worker connected; integrations=${this.handshakes.length}` });
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Forecasting Worker is disabled"],
      [],
      started,
    );
    return this.report({ action: "connect", validation, started });
  }

  consumeAccountingRecords(input: FrcwInput, config: ForecastingWorkerConfiguration): FrcwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("consume_accounting_records", input, started);
    const provided = input.accountingEntries ?? [];
    const entries = provided.length ? provided : this.integrations.fetchAccountingEntries();
    this.store.addAccountingEntries(entries);
    this.rebuildCatalog(config);
    const validation = this.validator.validateGeneric({ ...input, validated: input.validated ?? true }, started);
    this.ensureRecord("active", config);
    appendFrcwLog({ event: "consume_accounting_records", details: `count=${entries.length}` });
    return this.report({
      action: "consume_accounting_records",
      validation,
      started,
      notes: [`Consumed ${entries.length} verified accounting entries for traceability/context.`],
    });
  }

  consumeCashflowReports(input: FrcwInput, config: ForecastingWorkerConfiguration): FrcwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("consume_cashflow_reports", input, started);
    const provided = input.cashflowReports ?? [];
    const reports = provided.length ? provided : this.integrations.fetchCashflowReports();
    this.store.addCashflowReports(reports);
    this.rebuildCatalog(config);
    const validation = this.validator.validateGeneric({ ...input, validated: input.validated ?? true }, started);
    this.ensureRecord("active", config);
    appendFrcwLog({ event: "consume_cashflow_reports", details: `count=${reports.length}` });
    return this.report({
      action: "consume_cashflow_reports",
      validation,
      started,
      notes: [`Consumed ${reports.length} verified cashflow reports for traceability/context.`],
    });
  }

  consumeBudgetReports(input: FrcwInput, config: ForecastingWorkerConfiguration): FrcwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("consume_budget_reports", input, started);
    const provided = input.budgetReports ?? [];
    const reports = provided.length ? provided : this.integrations.fetchBudgetReports();
    this.store.addBudgetReports(reports);
    this.rebuildCatalog(config);
    const validation = this.validator.validateGeneric({ ...input, validated: input.validated ?? true }, started);
    this.ensureRecord("active", config);
    appendFrcwLog({ event: "consume_budget_reports", details: `count=${reports.length}` });
    return this.report({
      action: "consume_budget_reports",
      validation,
      started,
      notes: [`Consumed ${reports.length} verified budget reports for traceability/context.`],
    });
  }

  consumeProfitabilityReports(input: FrcwInput, config: ForecastingWorkerConfiguration): FrcwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("consume_profitability_reports", input, started);
    const provided = input.profitabilityReports ?? [];
    const reports = provided.length ? provided : this.integrations.fetchProfitabilityReports();
    this.store.addProfitabilityReports(reports);
    this.rebuildCatalog(config);
    const validation = this.validator.validateGeneric({ ...input, validated: input.validated ?? true }, started);
    this.ensureRecord("active", config);
    appendFrcwLog({ event: "consume_profitability_reports", details: `count=${reports.length}` });
    return this.report({
      action: "consume_profitability_reports",
      validation,
      started,
      notes: [`Consumed ${reports.length} verified profitability reports for traceability/context.`],
    });
  }

  forecastRevenue(input: FrcwInput, config: ForecastingWorkerConfiguration): FrcwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("forecast_revenue", input, started);

    const currency = normalizeCurrency(input.currency, config.defaultCurrency);
    const businessId = this.resolveBusinessId(input);
    const horizonPeriods = this.resolveHorizon(input, config);
    const sensitivityDeltaBps = this.resolveSensitivityDelta(input, config);
    const sensitivityDeltaExplicit = typeof input.sensitivityDeltaBps === "number";
    this.mergeInputHistoricalPoints(input);

    const bundle = this.buildTrendBundle({
      metric: "revenue",
      explicitGrowthBps: input.growthRateBps,
      assumptionKey: "growth_assumption",
      model: this.resolveModel(input, config, "historical_trend"),
      businessId,
      currency,
      horizonPeriods,
      sensitivityDeltaBps,
      sensitivityDeltaExplicit,
    });

    if (!bundle.hasHistory || !bundle.seriesByScenario) {
      const validation = this.validator.validateHistoricalRequirement(false, input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config);
      return this.report({ action: "forecast_revenue", validation, started });
    }

    let expectedSeries = bundle.seriesByScenario.expected;
    const assumptions = [...bundle.assumptions];
    if (
      typeof input.revenueForecastOverrideMinor === "number" &&
      Number.isFinite(input.revenueForecastOverrideMinor) &&
      expectedSeries.points.length
    ) {
      const overrideResult = this.applyRevenueOverride(expectedSeries, input.revenueForecastOverrideMinor);
      expectedSeries = overrideResult.series;
      assumptions.push(overrideResult.assumption);
      bundle.seriesByScenario.expected = expectedSeries;
    }

    for (const scenario of SCENARIO_KINDS) {
      this.store.upsertForecastSeries(businessId, bundle.seriesByScenario[scenario]);
    }
    this.rebuildCatalog(config);

    const historicalBaseline = buildHistoricalBaseline({ currency, capitalBusinessId: businessId, points: bundle.points });
    const validation = this.validator.validateSeries(expectedSeries, [], input, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", "expected", businessId);
    appendFrcwLog({ event: "forecast_revenue", details: `business=${businessId} points=${expectedSeries.points.length}` });
    return this.report({
      action: "forecast_revenue",
      revenueForecast: expectedSeries,
      historicalBaseline,
      forecastAssumptions: assumptions,
      validation,
      started,
    });
  }

  forecastCosts(input: FrcwInput, config: ForecastingWorkerConfiguration): FrcwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("forecast_costs", input, started);

    const currency = normalizeCurrency(input.currency, config.defaultCurrency);
    const businessId = this.resolveBusinessId(input);
    const horizonPeriods = this.resolveHorizon(input, config);
    const sensitivityDeltaBps = this.resolveSensitivityDelta(input, config);
    const sensitivityDeltaExplicit = typeof input.sensitivityDeltaBps === "number";
    this.mergeInputHistoricalPoints(input);

    const bundle = this.buildTrendBundle({
      metric: "cost",
      explicitGrowthBps: input.costGrowthRateBps,
      assumptionKey: "cost_assumption",
      model: this.resolveModel(input, config, "historical_trend"),
      businessId,
      currency,
      horizonPeriods,
      sensitivityDeltaBps,
      sensitivityDeltaExplicit,
    });

    if (!bundle.hasHistory || !bundle.seriesByScenario) {
      const validation = this.validator.validateHistoricalRequirement(false, input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config);
      return this.report({ action: "forecast_costs", validation, started });
    }

    for (const scenario of SCENARIO_KINDS) {
      this.store.upsertForecastSeries(businessId, bundle.seriesByScenario[scenario]);
    }
    this.rebuildCatalog(config);

    const historicalBaseline = buildHistoricalBaseline({ currency, capitalBusinessId: businessId, points: bundle.points });
    const expectedSeries = bundle.seriesByScenario.expected;
    const validation = this.validator.validateSeries(expectedSeries, [], input, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", "expected", businessId);
    appendFrcwLog({ event: "forecast_costs", details: `business=${businessId} points=${expectedSeries.points.length}` });
    return this.report({
      action: "forecast_costs",
      costForecast: expectedSeries,
      historicalBaseline,
      forecastAssumptions: bundle.assumptions,
      validation,
      started,
    });
  }

  forecastCashflow(input: FrcwInput, config: ForecastingWorkerConfiguration): FrcwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("forecast_cashflow", input, started);

    const currency = normalizeCurrency(input.currency, config.defaultCurrency);
    const businessId = this.resolveBusinessId(input);
    const horizonPeriods = this.resolveHorizon(input, config);
    const sensitivityDeltaBps = this.resolveSensitivityDelta(input, config);
    const sensitivityDeltaExplicit = typeof input.sensitivityDeltaBps === "number";
    this.mergeInputHistoricalPoints(input);

    const revenueBundle = this.buildTrendBundle({
      metric: "revenue",
      explicitGrowthBps: input.growthRateBps,
      assumptionKey: "growth_assumption",
      model: this.resolveModel(input, config, "historical_trend"),
      businessId,
      currency,
      horizonPeriods,
      sensitivityDeltaBps,
      sensitivityDeltaExplicit,
    });
    const costBundle = this.buildTrendBundle({
      metric: "cost",
      explicitGrowthBps: input.costGrowthRateBps,
      assumptionKey: "cost_assumption",
      model: this.resolveModel(input, config, "historical_trend"),
      businessId,
      currency,
      horizonPeriods,
      sensitivityDeltaBps,
      sensitivityDeltaExplicit,
    });

    if (!revenueBundle.hasHistory || !costBundle.hasHistory || !revenueBundle.seriesByScenario || !costBundle.seriesByScenario) {
      const validation = this.validator.validateHistoricalRequirement(false, input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config);
      return this.report({ action: "forecast_cashflow", validation, started });
    }

    const cashflowModel = this.resolveModel(input, config, "rolling");
    const cashflowByScenario = {} as Record<ScenarioKind, ForecastSeries>;
    for (const scenario of SCENARIO_KINDS) {
      cashflowByScenario[scenario] = combineSeriesBySubtraction({
        metric: "net_cashflow",
        model: cashflowModel,
        minuend: revenueBundle.seriesByScenario[scenario],
        subtrahend: costBundle.seriesByScenario[scenario],
      });
      this.store.upsertForecastSeries(businessId, revenueBundle.seriesByScenario[scenario]);
      this.store.upsertForecastSeries(businessId, costBundle.seriesByScenario[scenario]);
      this.store.upsertForecastSeries(businessId, cashflowByScenario[scenario]);
    }
    this.rebuildCatalog(config);

    const historicalBaseline = buildHistoricalBaseline({
      currency,
      capitalBusinessId: businessId,
      points: sortHistoricalPointsChronologically([...revenueBundle.points, ...costBundle.points]),
    });
    const assumptions = [...revenueBundle.assumptions, ...costBundle.assumptions];
    const expectedCashflow = cashflowByScenario.expected;
    const validation = this.validator.validateSeries(expectedCashflow, [], input, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", "expected", businessId);
    appendFrcwLog({ event: "forecast_cashflow", details: `business=${businessId} points=${expectedCashflow.points.length}` });
    return this.report({
      action: "forecast_cashflow",
      revenueForecast: revenueBundle.seriesByScenario.expected,
      costForecast: costBundle.seriesByScenario.expected,
      cashflowForecast: expectedCashflow,
      historicalBaseline,
      forecastAssumptions: assumptions,
      validation,
      started,
    });
  }

  forecastProfitability(input: FrcwInput, config: ForecastingWorkerConfiguration): FrcwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("forecast_profitability", input, started);

    const currency = normalizeCurrency(input.currency, config.defaultCurrency);
    const businessId = this.resolveBusinessId(input);
    const horizonPeriods = this.resolveHorizon(input, config);
    const sensitivityDeltaBps = this.resolveSensitivityDelta(input, config);
    const sensitivityDeltaExplicit = typeof input.sensitivityDeltaBps === "number";
    this.mergeInputHistoricalPoints(input);

    const profitModel = this.resolveModel(input, config, "profit_projection");
    const profitBundleDirect = this.buildTrendBundle({
      metric: "profit",
      explicitGrowthBps: undefined,
      assumptionKey: "profit_projection",
      model: profitModel,
      businessId,
      currency,
      horizonPeriods,
      sensitivityDeltaBps,
      sensitivityDeltaExplicit,
    });

    let profitByScenario: Record<ScenarioKind, ForecastSeries>;
    let assumptions: ForecastAssumption[];
    let historicalPoints: HistoricalPoint[];

    if (profitBundleDirect.hasHistory && profitBundleDirect.seriesByScenario) {
      profitByScenario = profitBundleDirect.seriesByScenario;
      assumptions = profitBundleDirect.assumptions;
      historicalPoints = profitBundleDirect.points;
    } else {
      const revenueBundle = this.buildTrendBundle({
        metric: "revenue",
        explicitGrowthBps: input.growthRateBps,
        assumptionKey: "growth_assumption",
        model: this.resolveModel(input, config, "historical_trend"),
        businessId,
        currency,
        horizonPeriods,
        sensitivityDeltaBps,
        sensitivityDeltaExplicit,
      });
      const costBundle = this.buildTrendBundle({
        metric: "cost",
        explicitGrowthBps: input.costGrowthRateBps,
        assumptionKey: "cost_assumption",
        model: this.resolveModel(input, config, "historical_trend"),
        businessId,
        currency,
        horizonPeriods,
        sensitivityDeltaBps,
        sensitivityDeltaExplicit,
      });
      if (!revenueBundle.hasHistory || !costBundle.hasHistory || !revenueBundle.seriesByScenario || !costBundle.seriesByScenario) {
        const validation = this.validator.validateHistoricalRequirement(false, input, started);
        this.recovery.recordFailure();
        this.ensureRecord("failed", config);
        return this.report({ action: "forecast_profitability", validation, started });
      }
      profitByScenario = {} as Record<ScenarioKind, ForecastSeries>;
      for (const scenario of SCENARIO_KINDS) {
        profitByScenario[scenario] = combineSeriesBySubtraction({
          metric: "profit",
          model: profitModel,
          minuend: revenueBundle.seriesByScenario[scenario],
          subtrahend: costBundle.seriesByScenario[scenario],
        });
        this.store.upsertForecastSeries(businessId, revenueBundle.seriesByScenario[scenario]);
        this.store.upsertForecastSeries(businessId, costBundle.seriesByScenario[scenario]);
      }
      assumptions = [...revenueBundle.assumptions, ...costBundle.assumptions];
      historicalPoints = sortHistoricalPointsChronologically([...revenueBundle.points, ...costBundle.points]);
    }

    for (const scenario of SCENARIO_KINDS) {
      this.store.upsertForecastSeries(businessId, profitByScenario[scenario]);
    }
    this.rebuildCatalog(config);

    const historicalBaseline = buildHistoricalBaseline({ currency, capitalBusinessId: businessId, points: historicalPoints });
    const expectedProfit = profitByScenario.expected;
    const validation = this.validator.validateSeries(expectedProfit, [], input, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", "expected", businessId);
    appendFrcwLog({ event: "forecast_profitability", details: `business=${businessId} points=${expectedProfit.points.length}` });
    return this.report({
      action: "forecast_profitability",
      profitForecast: expectedProfit,
      historicalBaseline,
      forecastAssumptions: assumptions,
      validation,
      started,
    });
  }

  estimateCashRunway(input: FrcwInput, config: ForecastingWorkerConfiguration): FrcwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("estimate_cash_runway", input, started);

    const currency = normalizeCurrency(input.currency, config.defaultCurrency);
    const businessId = this.resolveBusinessId(input);
    const scenario = this.resolveScenario(input, config);
    this.mergeInputHistoricalPoints(input);

    const resolution = this.resolveCashRunway(input, businessId, currency, scenario);
    if (!resolution.hasEvidence) {
      const validation = this.validator.validateHistoricalRequirement(false, input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config);
      return this.report({ action: "estimate_cash_runway", validation, started });
    }

    this.store.addRunwayEstimate(resolution.estimate);
    this.rebuildCatalog(config);
    const validation = this.validator.finalize(resolution.issues.length ? "partial" : "pass", [], resolution.issues, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", scenario, businessId);
    appendFrcwLog({ event: "estimate_cash_runway", details: `business=${businessId} status=${resolution.estimate.runwayStatus}` });
    return this.report({
      action: "estimate_cash_runway",
      cashRunway: resolution.estimate,
      forecastAssumptions: resolution.estimate.assumptions,
      validation,
      started,
    });
  }

  recommendReinvestmentOptions(input: FrcwInput, config: ForecastingWorkerConfiguration): FrcwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("recommend_reinvestment_options", input, started);

    const currency = normalizeCurrency(input.currency, config.defaultCurrency);
    const businessId = this.resolveBusinessId(input);
    const scenario = this.resolveScenario(input, config);
    this.mergeInputHistoricalPoints(input);

    const resolution = this.resolveCashRunway(input, businessId, currency, scenario);
    if (!resolution.hasEvidence) {
      const validation = this.validator.validateHistoricalRequirement(false, input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config);
      return this.report({ action: "recommend_reinvestment_options", validation, started });
    }

    this.store.addRunwayEstimate(resolution.estimate);
    const options = buildReinvestmentOptions({
      capitalBusinessId: businessId,
      monthlySurplusMinor: resolution.estimate.monthlySurplusMinor.minorUnits,
      currency,
      tierBps: config.reinvestmentTierBps,
      evidenceRefs: resolution.estimate.supportingEvidence,
    });
    this.store.setReinvestmentOptions(options);
    this.rebuildCatalog(config);

    const extraNotes = options.length
      ? []
      : [
          resolution.estimate.runwayStatus === "burning"
            ? "No reinvestment recommended — the business is burning cash and has no monthly surplus."
            : "No reinvestment recommended — no monthly surplus is currently available.",
        ];
    const validation = this.validator.finalize(
      resolution.issues.length ? "partial" : "pass",
      [],
      [...resolution.issues, ...extraNotes],
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", scenario, businessId);
    appendFrcwLog({ event: "recommend_reinvestment_options", details: `business=${businessId} options=${options.length}` });
    return this.report({
      action: "recommend_reinvestment_options",
      reinvestmentOptions: options,
      cashRunway: resolution.estimate,
      forecastAssumptions: resolution.estimate.assumptions,
      validation,
      started,
    });
  }

  compareScenarios(input: FrcwInput, config: ForecastingWorkerConfiguration): FrcwRunReport {
    return this.compareScenariosInternal(input, config, "compare_scenarios", "scenario");
  }

  runSensitivityAnalysis(input: FrcwInput, config: ForecastingWorkerConfiguration): FrcwRunReport {
    return this.compareScenariosInternal(input, config, "run_sensitivity_analysis", "sensitivity");
  }

  private compareScenariosInternal(
    input: FrcwInput,
    config: ForecastingWorkerConfiguration,
    action: "compare_scenarios" | "run_sensitivity_analysis",
    modelTag: ForecastModel,
  ): FrcwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, started);

    const currency = normalizeCurrency(input.currency, config.defaultCurrency);
    const businessId = this.resolveBusinessId(input);
    const horizonPeriods = this.resolveHorizon(input, config);
    const sensitivityDeltaBps = this.resolveSensitivityDelta(input, config);
    const sensitivityDeltaExplicit = typeof input.sensitivityDeltaBps === "number";
    this.mergeInputHistoricalPoints(input);

    const set = this.buildFullForecastSet({
      input,
      businessId,
      currency,
      horizonPeriods,
      sensitivityDeltaBps,
      sensitivityDeltaExplicit,
      revenueModel: modelTag,
      costModel: modelTag,
      cashflowModel: modelTag,
      profitModel: modelTag,
    });

    if (!set.hasHistory || !set.cashflowByScenario || !set.profitByScenario) {
      const validation = this.validator.validateHistoricalRequirement(false, input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config);
      return this.report({ action, validation, started });
    }

    for (const scenario of SCENARIO_KINDS) {
      this.store.upsertForecastSeries(businessId, set.revenueBundle.seriesByScenario![scenario]);
      this.store.upsertForecastSeries(businessId, set.costBundle.seriesByScenario![scenario]);
      this.store.upsertForecastSeries(businessId, set.cashflowByScenario[scenario]);
      this.store.upsertForecastSeries(businessId, set.profitByScenario[scenario]);
    }

    const closingCashChron = sortHistoricalPointsChronologically(
      this.store.listHistoricalPoints({ businessId, currency, metric: "closing_cash" }),
    );
    const opening = this.resolveOpeningCash(input, closingCashChron);
    const entries = this.buildScenarioEntries(set, currency, opening.openingCashMinor);

    const comparison = buildScenarioComparison({
      capitalBusinessId: businessId,
      currency,
      horizonPeriods,
      entries,
      assumptionRefs: set.assumptions.map((a) => a.assumptionId),
    });
    this.store.addScenarioComparison(comparison);
    this.rebuildCatalog(config);

    const historicalBaseline = buildHistoricalBaseline({ currency, capitalBusinessId: businessId, points: set.points });
    const validation = this.validator.finalize(opening.issue ? "partial" : "pass", [], opening.issue ? [opening.issue] : [], started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", "expected", businessId);
    appendFrcwLog({ event: action, details: `business=${businessId} scenarios=${entries.length}` });
    return this.report({
      action,
      revenueForecast: set.revenueBundle.seriesByScenario!.expected,
      costForecast: set.costBundle.seriesByScenario!.expected,
      cashflowForecast: set.cashflowByScenario.expected,
      profitForecast: set.profitByScenario.expected,
      scenarioComparison: comparison,
      historicalBaseline,
      forecastAssumptions: set.assumptions,
      validation,
      started,
    });
  }

  produceForecastingReport(input: FrcwInput, config: ForecastingWorkerConfiguration): FrcwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("produce_forecasting_report", input, started);

    const currency = normalizeCurrency(input.currency, config.defaultCurrency);
    const businessId = this.resolveBusinessId(input);
    const horizonPeriods = this.resolveHorizon(input, config);
    const sensitivityDeltaBps = this.resolveSensitivityDelta(input, config);
    const sensitivityDeltaExplicit = typeof input.sensitivityDeltaBps === "number";
    const forecastPeriod = resolveForecastPeriodLabel(input.forecastPeriod);
    this.mergeInputHistoricalPoints(input);

    const set = this.buildFullForecastSet({
      input,
      businessId,
      currency,
      horizonPeriods,
      sensitivityDeltaBps,
      sensitivityDeltaExplicit,
      revenueModel: this.resolveModel(input, config, "historical_trend"),
      costModel: this.resolveModel(input, config, "historical_trend"),
      cashflowModel: this.resolveModel(input, config, "rolling"),
      profitModel: this.resolveModel(input, config, "profit_projection"),
    });

    if (!set.hasHistory || !set.cashflowByScenario || !set.profitByScenario) {
      const validation = this.validator.validateHistoricalRequirement(false, input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config);
      return this.report({ action: "produce_forecasting_report", validation, started });
    }

    let expectedRevenue = set.revenueBundle.seriesByScenario!.expected;
    const extraAssumptions: ForecastAssumption[] = [];
    if (
      typeof input.revenueForecastOverrideMinor === "number" &&
      Number.isFinite(input.revenueForecastOverrideMinor) &&
      expectedRevenue.points.length
    ) {
      const overrideResult = this.applyRevenueOverride(expectedRevenue, input.revenueForecastOverrideMinor);
      expectedRevenue = overrideResult.series;
      extraAssumptions.push(overrideResult.assumption);
      set.revenueBundle.seriesByScenario!.expected = expectedRevenue;
    }

    for (const scenario of SCENARIO_KINDS) {
      this.store.upsertForecastSeries(businessId, set.revenueBundle.seriesByScenario![scenario]);
      this.store.upsertForecastSeries(businessId, set.costBundle.seriesByScenario![scenario]);
      this.store.upsertForecastSeries(businessId, set.cashflowByScenario[scenario]);
      this.store.upsertForecastSeries(businessId, set.profitByScenario[scenario]);
    }

    const scenario = this.resolveScenario(input, config);
    const runwayResolution = this.resolveCashRunway(input, businessId, currency, scenario);
    this.store.addRunwayEstimate(runwayResolution.estimate);

    const reinvestmentOptions = buildReinvestmentOptions({
      capitalBusinessId: businessId,
      monthlySurplusMinor: runwayResolution.estimate.monthlySurplusMinor.minorUnits,
      currency,
      tierBps: config.reinvestmentTierBps,
      evidenceRefs: runwayResolution.estimate.supportingEvidence,
    });
    this.store.setReinvestmentOptions(reinvestmentOptions);

    const closingCashChron = sortHistoricalPointsChronologically(
      this.store.listHistoricalPoints({ businessId, currency, metric: "closing_cash" }),
    );
    const opening = this.resolveOpeningCash(input, closingCashChron);
    const scenarioEntries = this.buildScenarioEntries(set, currency, opening.openingCashMinor);
    const scenarioComparison = buildScenarioComparison({
      capitalBusinessId: businessId,
      currency,
      horizonPeriods,
      entries: scenarioEntries,
      assumptionRefs: set.assumptions.map((a) => a.assumptionId),
    });
    this.store.addScenarioComparison(scenarioComparison);

    const allBusinessPoints = sortHistoricalPointsChronologically(this.store.listHistoricalPoints({ businessId, currency }));
    const historicalBaseline = buildHistoricalBaseline({ currency, capitalBusinessId: businessId, points: allBusinessPoints });

    const forecastAssumptions = [...set.assumptions, ...extraAssumptions, ...runwayResolution.estimate.assumptions];
    const extraOutstandingIssues = [...runwayResolution.issues, ...(opening.issue ? [opening.issue] : [])];

    const draft = buildReport({
      capitalBusinessId: businessId,
      capitalProjectId: input.capitalProjectId?.trim() || input.projectId?.trim() || null,
      forecastPeriod,
      revenueForecast: expectedRevenue,
      costForecast: set.costBundle.seriesByScenario!.expected,
      cashflowForecast: set.cashflowByScenario.expected,
      profitForecast: set.profitByScenario.expected,
      cashRunway: runwayResolution.estimate,
      reinvestmentOptions,
      forecastAssumptions,
      scenarioComparison,
      historicalBaseline,
      extraOutstandingIssues,
    });

    const validation = this.validator.validateReport(draft, { ...input, validated: input.validated ?? true }, started);
    const finalReport: ForecastingReport = { ...draft, validation };
    this.store.addReport(finalReport);
    this.rebuildCatalog(config);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", "expected", businessId);
    appendFrcwLog({ event: "produce_forecasting_report", details: `business=${businessId} forecastPeriod=${forecastPeriod}` });
    return this.report({
      action: "produce_forecasting_report",
      revenueForecast: expectedRevenue,
      costForecast: set.costBundle.seriesByScenario!.expected,
      cashflowForecast: set.cashflowByScenario.expected,
      profitForecast: set.profitByScenario.expected,
      cashRunway: runwayResolution.estimate,
      reinvestmentOptions,
      scenarioComparison,
      historicalBaseline,
      forecastAssumptions,
      validation,
      started,
      latestReport: finalReport,
    });
  }

  submitReport(input: FrcwInput, config: ForecastingWorkerConfiguration): FrcwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("submit_report", input, started);
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, started, "Executive reporting submission is disabled");
    }

    let report = this.store.getLatestReport();
    if (!report) {
      const produced = this.produceForecastingReport(input, config);
      report = produced.latestReport;
    }
    if (!report) {
      return this.disabled("submit_report", config, started, "No Forecasting Report available for submission");
    }

    const audit = this.integrations.recordAudit(report);
    if (audit.audited) {
      report = { ...report, auditStatus: "passed" };
      this.store.replaceLatestReport(report);
    }

    const submission = this.integrations.submitReport(report);
    if (submission.submitted && submission.executiveReportId) {
      report = { ...report, submittedToExecutiveReporting: true, executiveReportId: submission.executiveReportId };
      this.store.replaceLatestReport(report);
    }
    this.integrations.recordMemory(report);

    this.rebuildCatalog(config);
    let validation = this.validator.validateReport(report, { ...input, validated: input.validated ?? true }, started);
    if (!submission.submitted) validation = mergeIssuesAsWarnings(validation, ["executive_reporting_runtime_unavailable"]);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", undefined, report.capitalBusinessId);
    return this.report({ action: "submit_report", validation, started, latestReport: report });
  }

  list(config: ForecastingWorkerConfiguration): FrcwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.rebuildCatalog(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Forecasting Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report({
      action: "list",
      validation,
      started,
      notes: [`forecastSeries=${this.store.countForecastSeries()}`],
    });
  }

  validate(input: FrcwInput, config: ForecastingWorkerConfiguration): FrcwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.rebuildCatalog(config);
    const validation = this.validator.validateGeneric({ ...input, validated: input.validated ?? true }, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report({ action: "validate", validation, started });
  }

  diagnostics(config: ForecastingWorkerConfiguration): FrcwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.rebuildCatalog(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Forecasting Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendFrcwLog({
      event: "diagnostics",
      details: `forecastSeries=${this.store.countForecastSeries()} historicalPoints=${this.store.countHistoricalPoints()}`,
    });
    return this.report({ action: "diagnostics", validation, started });
  }

  runDiagnostics(config: ForecastingWorkerConfiguration) {
    return this.diagnostics(config);
  }

  /* ------------------------------------------------------------------ */
  /* Internal helpers                                                    */
  /* ------------------------------------------------------------------ */

  private buildTrendBundle(params: {
    metric: ForecastMetric;
    explicitGrowthBps: number | null | undefined;
    assumptionKey: string;
    model: ForecastModel;
    businessId: string;
    currency: string;
    horizonPeriods: number;
    sensitivityDeltaBps: number;
    sensitivityDeltaExplicit: boolean;
  }): TrendBundle {
    const chronological = sortHistoricalPointsChronologically(
      filterHistoricalPoints(this.store.listHistoricalPoints({ businessId: params.businessId, currency: params.currency }), {
        metric: params.metric,
      }),
    );
    if (!chronological.length) {
      return { points: [], seriesByScenario: null, assumptions: [], hasHistory: false };
    }

    const growthResult = deriveGrowthRateBps(chronological, params.explicitGrowthBps);
    const scenarioRates = buildScenarioGrowthRates(growthResult.growthRateBps, params.sensitivityDeltaBps);
    const growthAssumption = buildAssumption({
      key: params.assumptionKey,
      description:
        !growthResult.derived && !growthResult.usedDefault
          ? `Growth rate for ${params.metric} supplied explicitly by the caller.`
          : growthResult.usedDefault
            ? `Insufficient verified historical ${params.metric} data to derive a growth rate — defaulted to 0 bps (never fabricated).`
            : `Growth rate for ${params.metric} derived from the last two verified historical points.`,
      valueBps: growthResult.growthRateBps,
      source:
        !growthResult.derived && !growthResult.usedDefault
          ? "caller_input"
          : growthResult.usedDefault
            ? "zero_growth_default_due_to_insufficient_history"
            : "derived_from_historical_trend",
    });
    const deltaAssumption = buildAssumption({
      key: "sensitivity",
      description: `Best-case/worst-case scenarios derived using a +/-${params.sensitivityDeltaBps} bps sensitivity spread from the expected ${params.metric} growth rate.`,
      valueBps: params.sensitivityDeltaBps,
      source: params.sensitivityDeltaExplicit ? "caller_input" : "config_default",
    });

    const confidenceBps = computeConfidenceBps([chronological.length >= 2, !growthResult.usedDefault]);
    const lastPoint = chronological[chronological.length - 1]!;
    const assumptionRefs = [growthAssumption.assumptionId, deltaAssumption.assumptionId];

    const seriesByScenario = {} as Record<ScenarioKind, ForecastSeries>;
    for (const scenario of SCENARIO_KINDS) {
      seriesByScenario[scenario] = buildForecastSeries({
        metric: params.metric,
        scenario,
        model: params.model,
        currency: params.currency,
        businessId: params.businessId,
        growthRateBps: scenarioRates[scenario],
        horizonPeriods: params.horizonPeriods,
        lastAmountMinor: lastPoint.amountMinor,
        lastPeriodLabel: lastPoint.periodLabel,
        assumptionRefs,
        confidenceBps,
      });
    }

    return { points: chronological, seriesByScenario, assumptions: [growthAssumption, deltaAssumption], hasHistory: true };
  }

  private buildFullForecastSet(params: {
    input: FrcwInput;
    businessId: string;
    currency: string;
    horizonPeriods: number;
    sensitivityDeltaBps: number;
    sensitivityDeltaExplicit: boolean;
    revenueModel: ForecastModel;
    costModel: ForecastModel;
    cashflowModel: ForecastModel;
    profitModel: ForecastModel;
  }): FullForecastSet {
    const { input, businessId, currency, horizonPeriods, sensitivityDeltaBps, sensitivityDeltaExplicit } = params;

    const revenueBundle = this.buildTrendBundle({
      metric: "revenue",
      explicitGrowthBps: input.growthRateBps,
      assumptionKey: "growth_assumption",
      model: params.revenueModel,
      businessId,
      currency,
      horizonPeriods,
      sensitivityDeltaBps,
      sensitivityDeltaExplicit,
    });
    const costBundle = this.buildTrendBundle({
      metric: "cost",
      explicitGrowthBps: input.costGrowthRateBps,
      assumptionKey: "cost_assumption",
      model: params.costModel,
      businessId,
      currency,
      horizonPeriods,
      sensitivityDeltaBps,
      sensitivityDeltaExplicit,
    });

    const missingMetrics: string[] = [];
    if (!revenueBundle.hasHistory) missingMetrics.push("revenue");
    if (!costBundle.hasHistory) missingMetrics.push("cost");
    if (missingMetrics.length) {
      return {
        hasHistory: false,
        missingMetrics,
        revenueBundle,
        costBundle,
        cashflowByScenario: null,
        profitByScenario: null,
        usedProfitFallback: false,
        points: [],
        assumptions: [],
      };
    }

    const cashflowByScenario = {} as Record<ScenarioKind, ForecastSeries>;
    for (const scenario of SCENARIO_KINDS) {
      cashflowByScenario[scenario] = combineSeriesBySubtraction({
        metric: "net_cashflow",
        model: params.cashflowModel,
        minuend: revenueBundle.seriesByScenario![scenario],
        subtrahend: costBundle.seriesByScenario![scenario],
      });
    }

    const profitBundleDirect = this.buildTrendBundle({
      metric: "profit",
      explicitGrowthBps: undefined,
      assumptionKey: "profit_projection",
      model: params.profitModel,
      businessId,
      currency,
      horizonPeriods,
      sensitivityDeltaBps,
      sensitivityDeltaExplicit,
    });

    let profitByScenario: Record<ScenarioKind, ForecastSeries>;
    let usedProfitFallback = false;
    let profitAssumptions: ForecastAssumption[] = [];
    let profitPoints: HistoricalPoint[] = [];

    if (profitBundleDirect.hasHistory && profitBundleDirect.seriesByScenario) {
      profitByScenario = profitBundleDirect.seriesByScenario;
      profitAssumptions = profitBundleDirect.assumptions;
      profitPoints = profitBundleDirect.points;
    } else {
      usedProfitFallback = true;
      profitByScenario = {} as Record<ScenarioKind, ForecastSeries>;
      for (const scenario of SCENARIO_KINDS) {
        profitByScenario[scenario] = combineSeriesBySubtraction({
          metric: "profit",
          model: params.profitModel,
          minuend: revenueBundle.seriesByScenario![scenario],
          subtrahend: costBundle.seriesByScenario![scenario],
        });
      }
    }

    const pointsMap = new Map<string, HistoricalPoint>();
    for (const p of [...revenueBundle.points, ...costBundle.points, ...profitPoints]) pointsMap.set(p.sourceRef, p);
    const points = sortHistoricalPointsChronologically([...pointsMap.values()]);
    const assumptions = [...revenueBundle.assumptions, ...costBundle.assumptions, ...profitAssumptions];

    return {
      hasHistory: true,
      missingMetrics: [],
      revenueBundle,
      costBundle,
      cashflowByScenario,
      profitByScenario,
      usedProfitFallback,
      points,
      assumptions,
    };
  }

  private buildScenarioEntries(set: FullForecastSet, currency: string, openingCashMinor: number): ScenarioComparisonEntry[] {
    return SCENARIO_KINDS.map((scenario) => {
      const revenueSeries = set.revenueBundle.seriesByScenario![scenario];
      const costSeries = set.costBundle.seriesByScenario![scenario];
      const cashflowSeries = set.cashflowByScenario![scenario];
      const profitSeries = set.profitByScenario![scenario];
      const endingRevenue = revenueSeries.points[revenueSeries.points.length - 1]!;
      const endingCost = costSeries.points[costSeries.points.length - 1]!;
      const endingCashflow = cashflowSeries.points[cashflowSeries.points.length - 1]!;
      const endingProfit = profitSeries.points[profitSeries.points.length - 1]!;
      const avgProjectedCashflow = cashflowSeries.points.length
        ? Math.trunc(cashflowSeries.points.reduce((sum, p) => sum + p.amountMinor, 0) / cashflowSeries.points.length)
        : 0;
      const runwayComputation = computeCashRunway(openingCashMinor, avgProjectedCashflow);
      return {
        scenario,
        growthRateBps: revenueSeries.growthRateBps,
        endingRevenueMinor: moneyFromMinor(endingRevenue.amountMinor, currency),
        endingCostMinor: moneyFromMinor(endingCost.amountMinor, currency),
        endingCashflowMinor: moneyFromMinor(endingCashflow.amountMinor, currency),
        endingProfitMinor: moneyFromMinor(endingProfit.amountMinor, currency),
        runwayMonths: runwayComputation.runwayMonths,
      };
    });
  }

  private applyRevenueOverride(series: ForecastSeries, overrideMinor: number): { series: ForecastSeries; assumption: ForecastAssumption } {
    const assumption = buildAssumption({
      key: "growth_assumption",
      description:
        "Caller-supplied override applied to the expected-scenario forecast ending revenue value. Never treated as, or used to invent, historical data.",
      valueMinor: Math.trunc(overrideMinor),
      source: "caller_input_forecast_override",
    });
    const points = [...series.points];
    const lastIndex = points.length - 1;
    points[lastIndex] = {
      ...points[lastIndex]!,
      amountMinor: Math.trunc(overrideMinor),
      assumptionRefs: [...points[lastIndex]!.assumptionRefs, assumption.assumptionId],
    };
    return {
      series: { ...series, points, assumptionRefs: [...series.assumptionRefs, assumption.assumptionId] },
      assumption,
    };
  }

  private resolveCashRunway(
    input: FrcwInput,
    businessId: string,
    currency: string,
    scenario: ScenarioKind,
  ): { estimate: CashRunwayEstimate; issues: string[]; hasEvidence: boolean } {
    const netCashflowPoints = this.store.listHistoricalPoints({ businessId, currency, metric: "net_cashflow" });
    const closingCashChron = sortHistoricalPointsChronologically(
      this.store.listHistoricalPoints({ businessId, currency, metric: "closing_cash" }),
    );
    const avg = averageNetCashflow(netCashflowPoints, closingCashChron);
    const opening = this.resolveOpeningCash(input, closingCashChron);
    const computation = computeCashRunway(opening.openingCashMinor, avg.avgNetCashflowMinor);
    const supportingEvidence = Array.from(
      new Set([...netCashflowPoints.map((p) => p.sourceRef), ...closingCashChron.map((p) => p.sourceRef)]),
    );

    const assumptions: ForecastAssumption[] = [
      buildAssumption({
        key: "cash_runway",
        description:
          avg.sampleCount === 0
            ? "No verified net_cashflow or closing_cash historical points were available — average net cashflow recorded as zero pending real data."
            : avg.derivedFromClosingCash
              ? "Average net monthly cashflow derived from period-over-period closing-cash deltas."
              : "Average net monthly cashflow derived directly from verified net_cashflow historical points.",
        valueMinor: avg.avgNetCashflowMinor,
        source:
          avg.sampleCount === 0
            ? "no_cash_evidence_recorded_as_zero"
            : avg.derivedFromClosingCash
              ? "derived_from_closing_cash_deltas"
              : "historical_net_cashflow_points",
      }),
    ];
    if (computation.runwayDays !== null) {
      assumptions.push(
        buildAssumption({
          key: "cash_runway",
          description: "runwayDays approximates each calendar month as exactly 30 days.",
          source: "fixed_30_day_month_approximation",
        }),
      );
    }

    const issues: string[] = [];
    if (opening.issue) issues.push(opening.issue);
    if (avg.sampleCount === 0) {
      issues.push("No verified net_cashflow or closing_cash historical points were available to estimate cash runway.");
    }

    const estimate = buildRunwayEstimate({
      capitalBusinessId: businessId,
      openingCashMinor: opening.openingCashMinor,
      computation,
      currency,
      scenario,
      assumptions,
      supportingEvidence,
    });

    return { estimate, issues, hasEvidence: avg.sampleCount > 0 };
  }

  private resolveOpeningCash(input: FrcwInput, closingCashChron: HistoricalPoint[]): { openingCashMinor: number; issue: string | null } {
    if (typeof input.openingCashMinor === "number" && Number.isFinite(input.openingCashMinor)) {
      return { openingCashMinor: Math.trunc(input.openingCashMinor), issue: null };
    }
    if (closingCashChron.length) {
      return { openingCashMinor: closingCashChron[closingCashChron.length - 1]!.amountMinor, issue: null };
    }
    return {
      openingCashMinor: 0,
      issue:
        "No openingCashMinor was provided and no closing_cash historical points were available — opening cash recorded as zero pending real data.",
    };
  }

  private resolveBusinessId(input: FrcwInput): string {
    return (
      input.capitalBusinessId?.trim() ||
      input.businessId?.trim() ||
      this.integrations.resolveCapitalBusinessId(null) ||
      this.store.getLatestBusinessId() ||
      "unspecified-business"
    );
  }

  private resolveHorizon(input: FrcwInput, config: ForecastingWorkerConfiguration): number {
    const h = typeof input.horizonPeriods === "number" ? Math.trunc(input.horizonPeriods) : NaN;
    return Number.isFinite(h) && h > 0 ? h : config.defaultHorizonPeriods;
  }

  private resolveSensitivityDelta(input: FrcwInput, config: ForecastingWorkerConfiguration): number {
    const d = typeof input.sensitivityDeltaBps === "number" ? Math.trunc(input.sensitivityDeltaBps) : NaN;
    return Number.isFinite(d) ? d : config.defaultSensitivityDeltaBps;
  }

  private resolveScenario(input: FrcwInput, config: ForecastingWorkerConfiguration): ScenarioKind {
    return typeof input.scenario === "string" && (config.scenarioKinds as string[]).includes(input.scenario)
      ? (input.scenario as ScenarioKind)
      : "expected";
  }

  private resolveModel(input: FrcwInput, config: ForecastingWorkerConfiguration, fallback: ForecastModel): ForecastModel {
    return typeof input.model === "string" && (config.forecastModels as string[]).includes(input.model)
      ? (input.model as ForecastModel)
      : fallback;
  }

  private mergeInputHistoricalPoints(input: FrcwInput) {
    const points = input.historicalSeries ?? [];
    if (points.length) this.store.addHistoricalPoints(points as HistoricalPoint[]);
  }

  private rebuildCatalog(config: ForecastingWorkerConfiguration) {
    this.catalog = buildCatalog(
      config,
      this.store.countHistoricalPoints(),
      this.store.listAllForecastSeries(),
      this.store.listRunwayEstimates(),
      this.store.listReinvestmentOptions(),
      this.store.listScenarioComparisons(),
      this.store.listReports(),
      this.handshakes,
    );
  }

  private hasBoundary(input: FrcwInput) {
    return (
      input.fabricateHistoricalFinancialData === true ||
      input.presentForecastsAsGuaranteedOutcomes === true ||
      input.executeInvestments === true ||
      input.approveBudgets === true ||
      input.replaceInvestmentPlanningWorker === true ||
      input.modifyAccountingRecords === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.bypassGrandKingApproval === true ||
      input.bypassApproval === true ||
      input.implementQ907OrLater === true ||
      (!!input.missionId && /^(Q9-0[7-9]|Q9-\d{3,}|Q[1-9]\d-\d+)/i.test(input.missionId.trim()))
    );
  }

  private boundaryFail(action: FrcwRunReport["action"], input: FrcwInput, started: number): FrcwRunReport {
    const validation = this.validator.validateGeneric(input, started);
    this.recovery.recordFailure();
    return this.report({ action, validation, started });
  }

  private disabled(action: FrcwRunReport["action"], config: ForecastingWorkerConfiguration, started: number, message: string): FrcwRunReport {
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config);
    return this.report({ action, validation, started });
  }

  private ensureRecord(
    state: OperationalState,
    config: ForecastingWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastScenario?: ScenarioKind,
    lastBusinessId?: string | null,
  ) {
    this.engineRecord = buildEngineRecord({
      existingId: this.engineRecord?.engineRecordId ?? null,
      engineId: FORECASTING_WORKER_ID,
      state,
      healthStatus: this.healthMonitor.status(validationStatus === "failed" ? "fail" : "pass", config.enabled),
      validationStatus,
      totalForecastSeries: this.store.countForecastSeries(),
      totalRunwayEstimates: this.store.listRunwayEstimates().length,
      totalReports: this.store.listReports().length,
      lastScenario: lastScenario ?? this.engineRecord?.lastScenario ?? this.store.getLatestScenario() ?? null,
      lastBusinessId: lastBusinessId ?? this.store.getLatestBusinessId(),
      lastReportId: this.store.getLatestReport()?.reportId ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
    });
  }

  private report(params: {
    action: FrcwRunReport["action"];
    revenueForecast?: ForecastSeries | null;
    costForecast?: ForecastSeries | null;
    cashflowForecast?: ForecastSeries | null;
    profitForecast?: ForecastSeries | null;
    cashRunway?: CashRunwayEstimate | null;
    reinvestmentOptions?: ReinvestmentOption[];
    scenarioComparison?: ScenarioComparison | null;
    historicalBaseline?: import("./types.js").HistoricalBaseline | null;
    forecastAssumptions?: ForecastAssumption[];
    validation: FrcwValidationReport;
    started: number;
    notes?: string[];
    latestReport?: ForecastingReport | null;
  }): FrcwRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      frcwRunReportId: `frcw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: params.action,
      engineRecord,
      catalog: this.getCatalog(),
      historicalBaseline: params.historicalBaseline ?? null,
      revenueForecast: params.revenueForecast ?? null,
      costForecast: params.costForecast ?? null,
      cashflowForecast: params.cashflowForecast ?? null,
      profitForecast: params.profitForecast ?? null,
      cashRunway: params.cashRunway ?? null,
      reinvestmentOptions: params.reinvestmentOptions ?? this.store.listReinvestmentOptions(),
      scenarioComparison: params.scenarioComparison ?? null,
      forecastAssumptions: params.forecastAssumptions ?? [],
      latestReport: params.latestReport === undefined ? this.store.getLatestReport() : params.latestReport,
      integrations: this.getIntegrations(),
      validation: params.validation,
      durationMs: Date.now() - params.started,
      metadataVersion: FRCW_METADATA_VERSION,
      notes: params.notes ?? [],
    };
  }
}

function mergeIssuesAsWarnings(validation: FrcwValidationReport, issues: string[]): FrcwValidationReport {
  const warnings = Array.from(new Set([...validation.warnings, ...issues]));
  const decision = validation.decision === "fail" ? "fail" : warnings.length ? "partial" : validation.decision;
  return { ...validation, warnings, decision };
}

function cloneCatalog(catalog: ForecastingWorkerCatalog): ForecastingWorkerCatalog {
  return {
    ...catalog,
    forecastModels: [...catalog.forecastModels],
    scenarioKinds: [...catalog.scenarioKinds],
    forecastMetrics: [...catalog.forecastMetrics],
    currencies: [...catalog.currencies],
    forecastSeries: catalog.forecastSeries.map((s) => ({ ...s })),
    runwayEstimates: catalog.runwayEstimates.map((r) => ({ ...r })),
    reinvestmentOptions: catalog.reinvestmentOptions.map((r) => ({ ...r })),
    scenarioComparisons: catalog.scenarioComparisons.map((c) => ({ ...c })),
    reports: catalog.reports.map((r) => ({ ...r })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
