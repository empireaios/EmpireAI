/** X4-05 — Currency Intelligence orchestration controller. */

import { appendCurLog } from "./cur-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { CurrencyIntelligenceManager } from "./currency-intelligence-manager.js";
import type { CurrencyIntelligenceConfiguration } from "./configuration.js";
import type {
  ConnectCurrencyIntelligenceInput,
  CurrencyAnalysisInput,
  CurPerformanceStats,
  CurRunReport,
  EngineStatus,
  RunCurDiagnosticsInput,
} from "./types.js";

export class CurrencyIntelligenceController {
  private config: CurrencyIntelligenceConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: CurRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: CurPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    currencyManagementOps: 0,
    preferenceDetections: 0,
    conversions: 0,
    exchangeRateRefreshes: 0,
    fluctuationMonitors: 0,
    regionalPricingOps: 0,
    anomalyDetections: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: CurrencyIntelligenceManager,
    config: CurrencyIntelligenceConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCurLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Currency Intelligence ready — structural FX only; never convert with unvalidated exchange data",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CurrencyIntelligenceConfiguration {
    return { ...this.config, supportedCurrencies: [...this.config.supportedCurrencies] };
  }

  updateConfiguration(config: CurrencyIntelligenceConfiguration): void {
    this.config = config;
  }

  getLatestReport(): CurRunReport | null {
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

  getPerformance(): CurPerformanceStats {
    return { ...this.performance };
  }

  connectCurrencyIntelligence(input: ConnectCurrencyIntelligenceInput = {}): CurRunReport {
    if (!this.config.enabled) throw new Error("Currency Intelligence is disabled");
    this.status = "connecting";
    const report = this.manager.connectCurrencyIntelligence(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  manageCurrencies(input: CurrencyAnalysisInput = {}): CurRunReport {
    this.status = "managing";
    const report = this.manager.manageCurrencies(input, this.config);
    if (report.validation.decision !== "fail") this.performance.currencyManagementOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectPreference(input: CurrencyAnalysisInput = {}): CurRunReport {
    this.status = "managing";
    const report = this.manager.detectPreference(input, this.config);
    if (report.validation.decision !== "fail") this.performance.preferenceDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  convertPrice(input: CurrencyAnalysisInput = {}): CurRunReport {
    this.status = "converting";
    const report = this.manager.convertPrice(input, this.config);
    if (report.validation.decision !== "fail") this.performance.conversions += 1;
    this.finalizeOperation(report);
    return report;
  }

  refreshExchangeRates(input: CurrencyAnalysisInput = {}): CurRunReport {
    this.status = "converting";
    const report = this.manager.refreshExchangeRates(input, this.config);
    if (report.validation.decision !== "fail") this.performance.exchangeRateRefreshes += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorFluctuations(input: CurrencyAnalysisInput = {}): CurRunReport {
    this.status = "analyzing";
    const report = this.manager.monitorFluctuations(input, this.config);
    if (report.validation.decision !== "fail") this.performance.fluctuationMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  regionalPricing(input: CurrencyAnalysisInput = {}): CurRunReport {
    this.status = "pricing";
    const report = this.manager.regionalPricing(input, this.config);
    if (report.validation.decision !== "fail") this.performance.regionalPricingOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectAnomalies(input: CurrencyAnalysisInput = {}): CurRunReport {
    this.status = "analyzing";
    const report = this.manager.detectAnomalies(input, this.config);
    if (report.validation.decision !== "fail") this.performance.anomalyDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  recommendCurrency(input: CurrencyAnalysisInput = {}): CurRunReport {
    this.status = "recommending";
    const report = this.manager.recommendCurrency(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunCurDiagnosticsInput = {}): CurRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: CurRunReport): void {
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
    appendCurLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
