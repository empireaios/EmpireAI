import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { buildForecastingWorkerConfiguration, type ForecastingWorkerConfiguration } from "./configuration.js";
import type { ForecastingWorkerDependencies } from "./integrations.js";
import { ForecastingWorkerController } from "./forecasting-worker-controller.js";
import { resetFrcwLogsForTesting } from "./frcw-logging.js";
import { ForecastingWorkerManager } from "./forecast-manager.js";
import { resetFrcwSequenceForTesting } from "./forecast-store.js";
import { FORECASTING_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  ForecastingWorkerCockpitSnapshot,
  ForecastingWorkerState,
  ForecastMetric,
  FrcwInput,
  Q907ConsumableContract,
} from "./types.js";

export interface ForecastingWorkerOptions {
  configuration?: Partial<ForecastingWorkerConfiguration>;
  dependencies?: ForecastingWorkerDependencies;
}

/**
 * Authoritative Q9-06 Forecasting Worker — deterministic revenue, cost,
 * cashflow, and profit forecasting; cash-runway estimation; structural
 * reinvestment suggestions; and best/expected/worst-case scenario
 * comparison inside the Capital Factory.
 *
 * The Forecasting Worker projects future revenue, cost, cashflow, and
 * profit exclusively from verified historical evidence (`HistoricalPoint`
 * records supplied directly or seeded via configuration) — plus verified
 * Q9-02 Accounting Worker, Q9-03 Cashflow Worker, Q9-04 Budget Planning
 * Worker, and Q9-05 Profitability Worker records consumed for
 * traceability/context only. Every forecast is deterministic, integer-money
 * based, clearly labelled `isForecast: true` (never mixed with historical
 * `isHistorical: true` data), and never presented as a guaranteed outcome.
 * It integrates with the Q9-01 Capital Factory Core and Q9-02..Q9-05
 * workers exclusively through dependency injection — it never reimplements
 * their orchestration, never fabricates historical financial data, never
 * executes investments, never approves budgets, never replaces the
 * Investment Planning Worker, and never modifies accounting records.
 */
export class ForecastingWorker {
  private initializedAt: string | null = null;
  private readonly controller: ForecastingWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ForecastingWorkerOptions = {},
  ) {
    const manager = new ForecastingWorkerManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new ForecastingWorkerController(
      manager,
      buildForecastingWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(FORECASTING_WORKER_SYSTEM_PATH);
    if (!doc?.includes("Forecasting Worker")) {
      throw new Error(`${FORECASTING_WORKER_SYSTEM_PATH} missing — Q9-06 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ForecastingWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): ForecastingWorkerState {
    if (!this.initializedAt) {
      throw new Error("Forecasting Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-FRCW-001",
      missionId: "Q9-06",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalForecastSeries: engineRecord?.totalForecastSeries ?? 0,
        totalRunwayEstimates: engineRecord?.totalRunwayEstimates ?? 0,
        lastScenario: engineRecord?.lastScenario ?? null,
        lastBusinessId: engineRecord?.lastBusinessId ?? null,
        notes: [
          "Forecasting Worker projects revenue, cost, cashflow, and profit exclusively from verified historical evidence: it never fabricates historical financial data, never presents forecasts as guaranteed outcomes, never executes investments, never approves budgets, never replaces the Investment Planning Worker, never modifies accounting records, never overrides Pillow or Grand King, or implements Q9-07 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  consumeAccountingRecords(input: FrcwInput = {}) {
    return this.controller.consumeAccountingRecords(input);
  }

  consumeCashflowReports(input: FrcwInput = {}) {
    return this.controller.consumeCashflowReports(input);
  }

  consumeBudgetReports(input: FrcwInput = {}) {
    return this.controller.consumeBudgetReports(input);
  }

  consumeProfitabilityReports(input: FrcwInput = {}) {
    return this.controller.consumeProfitabilityReports(input);
  }

  forecastRevenue(input: FrcwInput = {}) {
    return this.controller.forecastRevenue(input);
  }

  forecastCosts(input: FrcwInput = {}) {
    return this.controller.forecastCosts(input);
  }

  forecastCashflow(input: FrcwInput = {}) {
    return this.controller.forecastCashflow(input);
  }

  estimateCashRunway(input: FrcwInput = {}) {
    return this.controller.estimateCashRunway(input);
  }

  forecastProfitability(input: FrcwInput = {}) {
    return this.controller.forecastProfitability(input);
  }

  recommendReinvestmentOptions(input: FrcwInput = {}) {
    return this.controller.recommendReinvestmentOptions(input);
  }

  compareScenarios(input: FrcwInput = {}) {
    return this.controller.compareScenarios(input);
  }

  runSensitivityAnalysis(input: FrcwInput = {}) {
    return this.controller.runSensitivityAnalysis(input);
  }

  produceForecastingReport(input: FrcwInput = {}) {
    return this.controller.produceForecastingReport(input);
  }

  produceReport(input: FrcwInput = {}) {
    return this.controller.produceForecastingReport(input);
  }

  submitReport(input: FrcwInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getForecasts(metric?: ForecastMetric) {
    return this.controller.getManager().getForecastSeries(metric);
  }

  getRunwayEstimates() {
    return this.controller.getManager().getRunwayEstimates();
  }

  getReinvestmentOptions() {
    return this.controller.getManager().getReinvestmentOptions();
  }

  getScenarios() {
    return this.controller.getManager().getScenarioComparisons();
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestBusinessId() {
    return this.controller.getManager().getLatestBusinessId();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
  }

  getQ907ConsumableContract(): Q907ConsumableContract {
    return this.controller.getQ907ConsumableContract();
  }

  validate(input: FrcwInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  runDiagnostics() {
    return this.controller.runDiagnostics();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : 100;
    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Forecast series tracked: ${state.health.totalForecastSeries}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ForecastingWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q9-06",
      status: state.status,
      healthStatus: state.health.status,
      totalForecastSeries: state.health.totalForecastSeries,
      totalRunwayEstimates: state.health.totalRunwayEstimates,
      lastScenario: state.health.lastScenario,
      latestCapitalBusinessId: this.getLatestBusinessId(),
      workerId: state.configuration.workerId,
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
      consumableByQ907: true,
    };
  }
}

export function createForecastingWorker(bootstrap: EmpireBootstrapContext, options?: ForecastingWorkerOptions) {
  return new ForecastingWorker(bootstrap, options);
}

export function resetForecastingWorkerForTesting() {
  resetFrcwLogsForTesting();
  resetFrcwSequenceForTesting();
}
