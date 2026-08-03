/** X1-14 — First Revenue Optimizer Controller. */

import { appendFroLog } from "./fro-logging.js";
import { FirstRevenueOptimizerManager } from "./first-revenue-optimizer-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { FirstRevenueOptimizerConfiguration } from "./configuration.js";
import type {
  ConnectFirstRevenueOptimizerInput,
  EngineStatus,
  OptimizeFirstRevenueInput,
  RevenueActionInput,
  RevenuePerformanceStats,
  RevenueRunReport,
} from "./types.js";

export class FirstRevenueOptimizerController {
  private config: FirstRevenueOptimizerConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: RevenueRunReport | null = null;
  private readonly manager: FirstRevenueOptimizerManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: RevenuePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    optimizationsRun: 0,
    analysisRuns: 0,
    productRuns: 0,
    recommendationRuns: 0,
    bottleneckRuns: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: FirstRevenueOptimizerManager,
    config: FirstRevenueOptimizerConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendFroLog({
      event: "engine_initialization",
      level: "info",
      details: "First Revenue Optimizer ready (X1-14)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): FirstRevenueOptimizerConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: FirstRevenueOptimizerConfiguration): void {
    this.config = config;
  }

  getLatestReport(): RevenueRunReport | null {
    return this.latestReport;
  }

  getManager(): FirstRevenueOptimizerManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): RevenuePerformanceStats {
    return { ...this.performance };
  }

  connectFirstRevenueOptimizer(
    input: ConnectFirstRevenueOptimizerInput = {},
  ): RevenueRunReport {
    if (!this.config.enabled) throw new Error("First Revenue Optimizer is disabled");
    this.status = "connecting";
    const report = this.manager.connectFirstRevenueOptimizer(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  optimizeFirstRevenue(input: OptimizeFirstRevenueInput = {}): RevenueRunReport {
    this.status = "optimizing";
    this.performance.optimizationsRun += 1;
    const report = this.manager.optimizeFirstRevenue(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorFirstSales(input: RevenueActionInput = {}): RevenueRunReport {
    this.performance.analysisRuns += 1;
    const report = this.manager.monitorFirstSales(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  analyzeEarlyRevenue(input: RevenueActionInput = {}): RevenueRunReport {
    this.performance.analysisRuns += 1;
    const report = this.manager.analyzeEarlyRevenue(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  analyzeProductPerformance(input: RevenueActionInput = {}): RevenueRunReport {
    this.performance.productRuns += 1;
    const report = this.manager.analyzeProductPerformance(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  analyzeCustomerPurchasing(input: RevenueActionInput = {}): RevenueRunReport {
    this.performance.analysisRuns += 1;
    const report = this.manager.analyzeCustomerPurchasing(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectRevenueBottlenecks(input: RevenueActionInput = {}): RevenueRunReport {
    this.performance.bottleneckRuns += 1;
    const report = this.manager.detectRevenueBottlenecks(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectUnderperformingProducts(input: RevenueActionInput = {}): RevenueRunReport {
    this.performance.productRuns += 1;
    const report = this.manager.detectUnderperformingProducts(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  optimizeProductPriorities(input: RevenueActionInput = {}): RevenueRunReport {
    this.performance.optimizationsRun += 1;
    const report = this.manager.optimizeProductPriorities(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  optimizePricingRecommendations(input: RevenueActionInput = {}): RevenueRunReport {
    this.performance.optimizationsRun += 1;
    const report = this.manager.optimizePricingRecommendations(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateEarlyRevenueRecommendations(input: RevenueActionInput = {}): RevenueRunReport {
    this.performance.recommendationRuns += 1;
    const report = this.manager.generateEarlyRevenueRecommendations(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: RevenueRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      const recovered = this.recoveryManager.recordFailure(
        `${report.action} failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
      if (recovered) this.performance.retryAttempts += 1;
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
    appendFroLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
