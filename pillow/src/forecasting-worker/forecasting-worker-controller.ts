import type { ForecastingWorkerConfiguration } from "./configuration.js";
import type { ForecastingWorkerDependencies } from "./integrations.js";
import { ForecastingWorkerManager } from "./forecast-manager.js";
import type { EngineStatus, FrcwInput, FrcwRunReport } from "./types.js";

export class ForecastingWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: FrcwRunReport | null = null;

  constructor(
    private readonly manager: ForecastingWorkerManager,
    private readonly config: ForecastingWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: ForecastingWorkerDependencies = {}) {
    this.manager.bindIntegrations(deps);
  }

  getStatus() {
    return this.status;
  }

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return {
      ...this.config,
      forecastModels: [...this.config.forecastModels],
      scenarioKinds: [...this.config.scenarioKinds],
      forecastMetrics: [...this.config.forecastMetrics],
      currencies: [...this.config.currencies],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      reinvestmentTierBps: [...this.config.reinvestmentTierBps],
      seedHistoricalPoints: this.config.seedHistoricalPoints.map((point) => ({ ...point })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  consumeAccountingRecords(input: FrcwInput = {}) {
    this.status = "consuming_records";
    return this.finish(this.manager.consumeAccountingRecords(input, this.config));
  }

  consumeCashflowReports(input: FrcwInput = {}) {
    this.status = "consuming_records";
    return this.finish(this.manager.consumeCashflowReports(input, this.config));
  }

  consumeBudgetReports(input: FrcwInput = {}) {
    this.status = "consuming_records";
    return this.finish(this.manager.consumeBudgetReports(input, this.config));
  }

  consumeProfitabilityReports(input: FrcwInput = {}) {
    this.status = "consuming_records";
    return this.finish(this.manager.consumeProfitabilityReports(input, this.config));
  }

  forecastRevenue(input: FrcwInput = {}) {
    this.status = "forecasting_revenue";
    return this.finish(this.manager.forecastRevenue(input, this.config));
  }

  forecastCosts(input: FrcwInput = {}) {
    this.status = "forecasting_costs";
    return this.finish(this.manager.forecastCosts(input, this.config));
  }

  forecastCashflow(input: FrcwInput = {}) {
    this.status = "forecasting_cashflow";
    return this.finish(this.manager.forecastCashflow(input, this.config));
  }

  estimateCashRunway(input: FrcwInput = {}) {
    this.status = "estimating_runway";
    return this.finish(this.manager.estimateCashRunway(input, this.config));
  }

  forecastProfitability(input: FrcwInput = {}) {
    this.status = "forecasting_profit";
    return this.finish(this.manager.forecastProfitability(input, this.config));
  }

  recommendReinvestmentOptions(input: FrcwInput = {}) {
    this.status = "modelling_reinvestment";
    return this.finish(this.manager.recommendReinvestmentOptions(input, this.config));
  }

  compareScenarios(input: FrcwInput = {}) {
    this.status = "comparing_scenarios";
    return this.finish(this.manager.compareScenarios(input, this.config));
  }

  runSensitivityAnalysis(input: FrcwInput = {}) {
    this.status = "comparing_scenarios";
    return this.finish(this.manager.runSensitivityAnalysis(input, this.config));
  }

  produceForecastingReport(input: FrcwInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceForecastingReport(input, this.config));
  }

  submitReport(input: FrcwInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: FrcwInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  getQ907ConsumableContract() {
    return this.manager.getQ907ConsumableContract(this.config);
  }

  private finish(report: FrcwRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
