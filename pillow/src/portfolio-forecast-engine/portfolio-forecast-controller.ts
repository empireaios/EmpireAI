/** X2-14 — Portfolio Forecast Engine orchestration controller. */

import { appendPfeLog } from "./pfe-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { PortfolioForecastManager } from "./portfolio-forecast-manager.js";
import type { PortfolioForecastEngineConfiguration } from "./configuration.js";
import type {
  ConnectPortfolioForecastEngineInput,
  EngineStatus,
  ForecastPerformanceStats,
  ForecastRequestInput,
  ForecastRunReport,
  GenerateExecutiveForecastInput,
  GenerateScenariosInput,
  RunForecastDiagnosticsInput,
} from "./types.js";

export class PortfolioForecastController {
  private config: PortfolioForecastEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ForecastRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ForecastPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    revenueForecasts: 0,
    profitForecasts: 0,
    growthForecasts: 0,
    capitalForecasts: 0,
    customerGrowthForecasts: 0,
    supplierCapacityForecasts: 0,
    riskForecasts: 0,
    scenariosGenerated: 0,
    executiveForecasts: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: PortfolioForecastManager,
    config: PortfolioForecastEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendPfeLog({
      event: "framework_initialized",
      level: "info",
      details: "Portfolio Forecast Engine ready",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): PortfolioForecastEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: PortfolioForecastEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ForecastRunReport | null {
    return this.latestReport;
  }

  getManager() {
    return this.manager;
  }

  getHealthMonitor() {
    return this.healthMonitor;
  }

  getRecoveryManager() {
    return this.recoveryManager;
  }

  getPerformance(): ForecastPerformanceStats {
    return { ...this.performance };
  }

  connectPortfolioForecastEngine(
    input: ConnectPortfolioForecastEngineInput = {},
  ): ForecastRunReport {
    if (!this.config.enabled) throw new Error("Portfolio Forecast Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectPortfolioForecastEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  forecastRevenue(input: ForecastRequestInput = {}): ForecastRunReport {
    this.status = "forecasting";
    const report = this.manager.forecastRevenue(input, this.config);
    if (report.validation.decision !== "fail") this.performance.revenueForecasts += 1;
    this.finalizeOperation(report);
    return report;
  }

  forecastProfit(input: ForecastRequestInput = {}): ForecastRunReport {
    this.status = "forecasting";
    const report = this.manager.forecastProfit(input, this.config);
    if (report.validation.decision !== "fail") this.performance.profitForecasts += 1;
    this.finalizeOperation(report);
    return report;
  }

  forecastGrowth(input: ForecastRequestInput = {}): ForecastRunReport {
    this.status = "forecasting";
    const report = this.manager.forecastGrowth(input, this.config);
    if (report.validation.decision !== "fail") this.performance.growthForecasts += 1;
    this.finalizeOperation(report);
    return report;
  }

  forecastCapital(input: ForecastRequestInput = {}): ForecastRunReport {
    this.status = "forecasting";
    const report = this.manager.forecastCapital(input, this.config);
    if (report.validation.decision !== "fail") this.performance.capitalForecasts += 1;
    this.finalizeOperation(report);
    return report;
  }

  forecastCustomerGrowth(input: ForecastRequestInput = {}): ForecastRunReport {
    this.status = "forecasting";
    const report = this.manager.forecastCustomerGrowth(input, this.config);
    if (report.validation.decision !== "fail") this.performance.customerGrowthForecasts += 1;
    this.finalizeOperation(report);
    return report;
  }

  forecastSupplierCapacity(input: ForecastRequestInput = {}): ForecastRunReport {
    this.status = "forecasting";
    const report = this.manager.forecastSupplierCapacity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.supplierCapacityForecasts += 1;
    this.finalizeOperation(report);
    return report;
  }

  forecastRisks(input: ForecastRequestInput = {}): ForecastRunReport {
    this.status = "forecasting";
    const report = this.manager.forecastRisks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.riskForecasts += 1;
    this.finalizeOperation(report);
    return report;
  }

  generateScenarios(input: GenerateScenariosInput = {}): ForecastRunReport {
    this.status = "scenario_generation";
    const report = this.manager.generateScenarios(input, this.config);
    this.performance.scenariosGenerated += report.scenarios.length;
    this.finalizeOperation(report);
    return report;
  }

  generateExecutiveForecast(input: GenerateExecutiveForecastInput = {}): ForecastRunReport {
    this.status = "forecasting";
    const report = this.manager.generateExecutiveForecast(input, this.config);
    if (report.validation.decision !== "fail") this.performance.executiveForecasts += 1;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunForecastDiagnosticsInput = {}): ForecastRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: ForecastRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      const recovered = this.recoveryManager.recordFailure(
        `Operation failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
      if (recovered) this.performance.retryAttempts += 1;
    } else {
      this.performance.successfulOperations += 1;
      this.recoveryManager.recordSuccess();
    }

    this.performance.averageOperationDurationMs = Math.round(
      (this.performance.averageOperationDurationMs * (this.performance.totalOperations - 1) +
        duration) /
        this.performance.totalOperations,
    );
    if (duration > this.performance.peakOperationDurationMs) {
      this.performance.peakOperationDurationMs = duration;
    }

    this.healthMonitor.recordOperation(report.validation.decision);
    this.status = "active";
    appendPfeLog({
      event: "forecast_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
