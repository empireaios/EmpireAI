/** X2-03 — Portfolio Performance Engine orchestration controller. */

import { appendPpeLog } from "./ppe-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { PortfolioPerformanceManager } from "./portfolio-performance-manager.js";
import type { PortfolioPerformanceEngineConfiguration } from "./configuration.js";
import type {
  AnalyzePortfolioInput,
  CalculatePortfolioKpisInput,
  CompareCompaniesInput,
  ConnectPortfolioPerformanceInput,
  EngineStatus,
  MeasureCompanyPerformanceInput,
  PerformancePerformanceStats,
  PerformanceRunReport,
  RecommendPerformanceInput,
  RunPerformanceDiagnosticsInput,
} from "./types.js";

export class PortfolioPerformanceController {
  private config: PortfolioPerformanceEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: PerformanceRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: PerformancePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    companiesMeasured: 0,
    comparisonsRun: 0,
    kpiCalculations: 0,
    analyticsRuns: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: PortfolioPerformanceManager,
    config: PortfolioPerformanceEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendPpeLog({
      event: "framework_initialized",
      level: "info",
      details: "Portfolio Performance Engine ready",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): PortfolioPerformanceEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: PortfolioPerformanceEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): PerformanceRunReport | null {
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

  getPerformance(): PerformancePerformanceStats {
    return { ...this.performance };
  }

  connectPortfolioPerformanceEngine(
    input: ConnectPortfolioPerformanceInput = {},
  ): PerformanceRunReport {
    if (!this.config.enabled) throw new Error("Portfolio Performance Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectPortfolioPerformanceEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  measureCompanyPerformance(input: MeasureCompanyPerformanceInput): PerformanceRunReport {
    this.status = "measuring";
    const report = this.manager.measureCompanyPerformance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.companiesMeasured += 1;
    this.finalizeOperation(report);
    return report;
  }

  compareCompanies(input: CompareCompaniesInput = {}): PerformanceRunReport {
    this.status = "comparing";
    const report = this.manager.compareCompanies(input, this.config);
    if (report.validation.decision !== "fail") this.performance.comparisonsRun += 1;
    this.finalizeOperation(report);
    return report;
  }

  calculatePortfolioKpis(input: CalculatePortfolioKpisInput = {}): PerformanceRunReport {
    const report = this.manager.calculatePortfolioKpis(input, this.config);
    if (report.validation.decision !== "fail") this.performance.kpiCalculations += 1;
    this.finalizeOperation(report);
    return report;
  }

  analyzePortfolio(input: AnalyzePortfolioInput = {}): PerformanceRunReport {
    this.status = "analyzing";
    const report = this.manager.analyzePortfolio(input, this.config);
    if (report.validation.decision !== "fail") this.performance.analyticsRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(input: RecommendPerformanceInput = {}): PerformanceRunReport {
    const report = this.manager.generateRecommendations(input, this.config);
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunPerformanceDiagnosticsInput = {}): PerformanceRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: PerformanceRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      this.recoveryManager.recordFailure(
        `Operation failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
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
    appendPpeLog({
      event: "performance_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
