/** X2-08 — Portfolio Balance Engine orchestration controller. */

import { appendPbeLog } from "./pbe-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { PortfolioBalanceManager } from "./portfolio-balance-manager.js";
import type { PortfolioBalanceEngineConfiguration } from "./configuration.js";
import type {
  AnalyzeConcentrationInput,
  AnalyzeExposureInput,
  BalancePerformanceStats,
  BalanceRunReport,
  ConnectPortfolioBalanceInput,
  DetectImbalanceInput,
  EngineStatus,
  MeasureDiversificationInput,
  OptimizePortfolioBalanceInput,
  RecommendBalanceInput,
  RunBalanceDiagnosticsInput,
} from "./types.js";

export class PortfolioBalanceController {
  private config: PortfolioBalanceEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: BalanceRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: BalancePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    diversificationAnalyses: 0,
    concentrationAnalyses: 0,
    exposureAnalyses: 0,
    optimizationRuns: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: PortfolioBalanceManager,
    config: PortfolioBalanceEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendPbeLog({
      event: "framework_initialized",
      level: "info",
      details: "Portfolio Balance Engine ready",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): PortfolioBalanceEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: PortfolioBalanceEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): BalanceRunReport | null {
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

  getPerformance(): BalancePerformanceStats {
    return { ...this.performance };
  }

  connectPortfolioBalanceEngine(
    input: ConnectPortfolioBalanceInput = {},
  ): BalanceRunReport {
    if (!this.config.enabled) throw new Error("Portfolio Balance Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectPortfolioBalanceEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  measureDiversification(input: MeasureDiversificationInput = {}): BalanceRunReport {
    this.status = "analyzing";
    const report = this.manager.measureDiversification(input, this.config);
    if (report.validation.decision !== "fail") this.performance.diversificationAnalyses += 1;
    this.finalizeOperation(report);
    return report;
  }

  analyzeConcentration(input: AnalyzeConcentrationInput = {}): BalanceRunReport {
    this.status = "analyzing";
    const report = this.manager.analyzeConcentration(input, this.config);
    if (report.validation.decision !== "fail") this.performance.concentrationAnalyses += 1;
    this.finalizeOperation(report);
    return report;
  }

  analyzeExposure(input: AnalyzeExposureInput = {}): BalanceRunReport {
    this.status = "analyzing";
    const report = this.manager.analyzeExposure(input, this.config);
    if (report.validation.decision !== "fail") this.performance.exposureAnalyses += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectImbalance(input: DetectImbalanceInput = {}): BalanceRunReport {
    this.status = "analyzing";
    const report = this.manager.detectImbalance(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  optimizePortfolioBalance(input: OptimizePortfolioBalanceInput = {}): BalanceRunReport {
    this.status = "optimizing";
    const report = this.manager.optimizePortfolioBalance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.optimizationRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(input: RecommendBalanceInput = {}): BalanceRunReport {
    const report = this.manager.generateRecommendations(input, this.config);
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunBalanceDiagnosticsInput = {}): BalanceRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: BalanceRunReport): void {
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
    appendPbeLog({
      event: "balance_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
