/** X2-16 — Portfolio Optimization Engine orchestration controller. */

import { appendPoeLog } from "./poe-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { PortfolioOptimizationManager } from "./portfolio-optimization-manager.js";
import type { PortfolioOptimizationEngineConfiguration } from "./configuration.js";
import type {
  ConnectPortfolioOptimizationEngineInput,
  DetectOptimizationOpportunitiesInput,
  EngineStatus,
  GenerateOptimizationRecommendationsInput,
  OptimizationPerformanceStats,
  OptimizationRunReport,
  OptimizePortfolioInput,
  RankOptimizationPrioritiesInput,
  RunOptimizationDiagnosticsInput,
} from "./types.js";

export class PortfolioOptimizationController {
  private config: PortfolioOptimizationEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: OptimizationRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: OptimizationPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    performanceOptimizations: 0,
    capitalOptimizations: 0,
    resourceOptimizations: 0,
    priorityOptimizations: 0,
    operationalOptimizations: 0,
    balanceOptimizations: 0,
    opportunitiesDetected: 0,
    rankingsRun: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: PortfolioOptimizationManager,
    config: PortfolioOptimizationEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendPoeLog({
      event: "framework_initialized",
      level: "info",
      details: "Portfolio Optimization Engine ready",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): PortfolioOptimizationEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: PortfolioOptimizationEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): OptimizationRunReport | null {
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

  getPerformance(): OptimizationPerformanceStats {
    return { ...this.performance };
  }

  connectPortfolioOptimizationEngine(
    input: ConnectPortfolioOptimizationEngineInput = {},
  ): OptimizationRunReport {
    if (!this.config.enabled) throw new Error("Portfolio Optimization Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectPortfolioOptimizationEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  optimizeEnterprisePerformance(input: OptimizePortfolioInput = {}): OptimizationRunReport {
    this.status = "optimizing";
    const report = this.manager.optimizeEnterprisePerformance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.performanceOptimizations += 1;
    this.finalizeOperation(report);
    return report;
  }

  optimizeCapitalAllocation(input: OptimizePortfolioInput = {}): OptimizationRunReport {
    this.status = "optimizing";
    const report = this.manager.optimizeCapitalAllocation(input, this.config);
    if (report.validation.decision !== "fail") this.performance.capitalOptimizations += 1;
    this.finalizeOperation(report);
    return report;
  }

  optimizeResourceUtilization(input: OptimizePortfolioInput = {}): OptimizationRunReport {
    this.status = "optimizing";
    const report = this.manager.optimizeResourceUtilization(input, this.config);
    if (report.validation.decision !== "fail") this.performance.resourceOptimizations += 1;
    this.finalizeOperation(report);
    return report;
  }

  optimizeCompanyPriorities(input: OptimizePortfolioInput = {}): OptimizationRunReport {
    this.status = "optimizing";
    const report = this.manager.optimizeCompanyPriorities(input, this.config);
    if (report.validation.decision !== "fail") this.performance.priorityOptimizations += 1;
    this.finalizeOperation(report);
    return report;
  }

  optimizeOperationalEfficiency(input: OptimizePortfolioInput = {}): OptimizationRunReport {
    this.status = "optimizing";
    const report = this.manager.optimizeOperationalEfficiency(input, this.config);
    if (report.validation.decision !== "fail") this.performance.operationalOptimizations += 1;
    this.finalizeOperation(report);
    return report;
  }

  optimizePortfolioBalance(input: OptimizePortfolioInput = {}): OptimizationRunReport {
    this.status = "optimizing";
    const report = this.manager.optimizePortfolioBalance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.balanceOptimizations += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectOpportunities(
    input: DetectOptimizationOpportunitiesInput = {},
  ): OptimizationRunReport {
    this.status = "analyzing";
    const report = this.manager.detectOpportunities(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.opportunitiesDetected += report.optimizationRecords.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  rankPriorities(input: RankOptimizationPrioritiesInput = {}): OptimizationRunReport {
    this.status = "analyzing";
    const report = this.manager.rankPriorities(input, this.config);
    if (report.validation.decision !== "fail") this.performance.rankingsRun += 1;
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(
    input: GenerateOptimizationRecommendationsInput = {},
  ): OptimizationRunReport {
    this.status = "recommending";
    const report = this.manager.generateRecommendations(input, this.config);
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunOptimizationDiagnosticsInput = {}): OptimizationRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: OptimizationRunReport): void {
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
    appendPoeLog({
      event: "optimization_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
