/** R3-13 — Financial Forecast Controller. */

import { appendFctLog } from "./fct-logging.js";
import { FinancialForecastManager } from "./financial-forecast-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { FinancialForecastEngineConfiguration } from "./configuration.js";
import type {
  AnalyzeFinancialTrendsInput,
  ConnectFinancialForecastEngineInput,
  DetectForecastDeviationsInput,
  EngineStatus,
  FinancialForecastRunReport,
  ForecastPerformanceStats,
  GenerateFinancialProjectionInput,
} from "./types.js";

export class FinancialForecastController {
  private config: FinancialForecastEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: FinancialForecastRunReport | null = null;
  private readonly manager: FinancialForecastManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ForecastPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    projectionsGenerated: 0,
    trendsAnalyzed: 0,
    deviationsDetected: 0,
    risksDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: FinancialForecastManager, config: FinancialForecastEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendFctLog({
      event: "engine_initialization",
      level: "info",
      details: "Financial Forecast Engine ready (R3-13)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): FinancialForecastEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: FinancialForecastEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): FinancialForecastRunReport | null {
    return this.latestReport;
  }

  getManager(): FinancialForecastManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): ForecastPerformanceStats {
    return { ...this.performance };
  }

  connectFinancialForecastEngine(
    input: ConnectFinancialForecastEngineInput = {},
  ): FinancialForecastRunReport {
    if (!this.config.enabled) throw new Error("Financial Forecast Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectFinancialForecastEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  generateFinancialProjection(
    input: GenerateFinancialProjectionInput = {},
  ): FinancialForecastRunReport {
    this.status = "processing";
    this.performance.projectionsGenerated += 1;
    const report = this.manager.generateFinancialProjection(input, this.config);
    this.trackDeviationsAndRisks(report);
    this.finalizeOperation(report, "generate_projection");
    return report;
  }

  analyzeFinancialTrends(
    input: AnalyzeFinancialTrendsInput = {},
  ): FinancialForecastRunReport {
    this.performance.trendsAnalyzed += 1;
    const report = this.manager.analyzeFinancialTrends(input, this.config);
    this.finalizeOperation(report, "analyze_trends");
    return report;
  }

  detectForecastDeviations(
    input: DetectForecastDeviationsInput = {},
  ): FinancialForecastRunReport {
    const report = this.manager.detectForecastDeviations(input, this.config);
    this.trackDeviationsAndRisks(report);
    this.finalizeOperation(report, "detect_deviations");
    return report;
  }

  private trackDeviationsAndRisks(report: FinancialForecastRunReport): void {
    if (report.deviations.length > 0) {
      this.performance.deviationsDetected += report.deviations.length;
    }
    if (report.risks.length > 0) {
      this.performance.risksDetected += report.risks.length;
    }
  }

  private finalizeOperation(report: FinancialForecastRunReport, action: string): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      this.recoveryManager.recordFailure(
        `${action} failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
      this.status = "failed";
    } else {
      this.performance.successfulOperations += 1;
      this.recoveryManager.recordSuccess();
      this.status =
        report.engineRecord.currentOperationalState === "active" ? "active" : "connected";
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
    appendFctLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
