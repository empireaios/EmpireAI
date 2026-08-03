/** X2-19 — Enterprise Value Engine orchestration controller. */

import { appendEveLog } from "./eve-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { EnterpriseValueManager } from "./enterprise-value-manager.js";
import type { EnterpriseValueEngineConfiguration } from "./configuration.js";
import type {
  CalculateCompanyValuationInput,
  CalculateEnterpriseValueInput,
  CalculatePortfolioValuationInput,
  ConnectEnterpriseValueEngineInput,
  DetectValuationAnomaliesInput,
  EngineStatus,
  EstimateIntrinsicValueInput,
  EstimateMarketValueInput,
  GenerateValuationRecommendationsInput,
  MeasureValueGrowthInput,
  RunValuationDiagnosticsInput,
  TrackValuationHistoryInput,
  ValuationPerformanceStats,
  ValuationRunReport,
} from "./types.js";

export class EnterpriseValueController {
  private config: EnterpriseValueEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ValuationRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ValuationPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    enterpriseValueOps: 0,
    companyValuationOps: 0,
    portfolioValuationOps: 0,
    intrinsicEstimateOps: 0,
    marketEstimateOps: 0,
    valueGrowthOps: 0,
    historyTrackingOps: 0,
    anomalyDetectionOps: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: EnterpriseValueManager,
    config: EnterpriseValueEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendEveLog({
      event: "framework_initialized",
      level: "info",
      details: "Enterprise Value Engine ready — estimated values are not guaranteed market prices",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): EnterpriseValueEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: EnterpriseValueEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ValuationRunReport | null {
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

  getPerformance(): ValuationPerformanceStats {
    return { ...this.performance };
  }

  connectEnterpriseValueEngine(
    input: ConnectEnterpriseValueEngineInput = {},
  ): ValuationRunReport {
    if (!this.config.enabled) throw new Error("Enterprise Value Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectEnterpriseValueEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  calculateEnterpriseValue(
    input: CalculateEnterpriseValueInput = {},
  ): ValuationRunReport {
    this.status = "valuing";
    const report = this.manager.calculateEnterpriseValue(input, this.config);
    if (report.validation.decision !== "fail") this.performance.enterpriseValueOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  calculateCompanyValuation(
    input: CalculateCompanyValuationInput = {},
  ): ValuationRunReport {
    this.status = "valuing";
    const report = this.manager.calculateCompanyValuation(input, this.config);
    if (report.validation.decision !== "fail") this.performance.companyValuationOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  calculatePortfolioValuation(
    input: CalculatePortfolioValuationInput = {},
  ): ValuationRunReport {
    this.status = "valuing";
    const report = this.manager.calculatePortfolioValuation(input, this.config);
    if (report.validation.decision !== "fail") this.performance.portfolioValuationOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  estimateIntrinsic(input: EstimateIntrinsicValueInput = {}): ValuationRunReport {
    this.status = "analyzing";
    const report = this.manager.estimateIntrinsic(input, this.config);
    if (report.validation.decision !== "fail") this.performance.intrinsicEstimateOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  estimateMarket(input: EstimateMarketValueInput = {}): ValuationRunReport {
    this.status = "analyzing";
    const report = this.manager.estimateMarket(input, this.config);
    if (report.validation.decision !== "fail") this.performance.marketEstimateOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  measureValueGrowth(input: MeasureValueGrowthInput = {}): ValuationRunReport {
    this.status = "analyzing";
    const report = this.manager.measureValueGrowth(input, this.config);
    if (report.validation.decision !== "fail") this.performance.valueGrowthOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  trackHistory(input: TrackValuationHistoryInput = {}): ValuationRunReport {
    this.status = "analyzing";
    const report = this.manager.trackHistory(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.historyTrackingOps += report.historyEntries.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  detectAnomalies(input: DetectValuationAnomaliesInput = {}): ValuationRunReport {
    this.status = "analyzing";
    const report = this.manager.detectAnomalies(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.anomalyDetectionOps += report.anomalies.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(
    input: GenerateValuationRecommendationsInput = {},
  ): ValuationRunReport {
    this.status = "recommending";
    const report = this.manager.generateRecommendations(input, this.config);
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunValuationDiagnosticsInput = {}): ValuationRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: ValuationRunReport): void {
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
    appendEveLog({
      event: "valuation_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
