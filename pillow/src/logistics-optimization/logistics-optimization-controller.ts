/** R2-17 — Logistics Optimization Controller. */

import { appendLoLog } from "./lo-logging.js";
import { LogisticsOptimizationManager } from "./logistics-optimization-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { LogisticsOptimizationConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  LogisticsPerformanceStats,
  LogisticsReport,
  OptimizeShippingInput,
} from "./types.js";

export class LogisticsOptimizationController {
  private config: LogisticsOptimizationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: LogisticsReport | null = null;
  private readonly manager: LogisticsOptimizationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: LogisticsPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    optimizeRuns: 0,
    ordersOptimized: 0,
    routesAnalyzed: 0,
    carriersSelected: 0,
    warehousesOptimized: 0,
    costsReduced: 0,
    deliveryTimesOptimized: 0,
    bottlenecksDetected: 0,
    inefficientRoutesDetected: 0,
    recommendationsGenerated: 0,
    optimizationFailures: 0,
    invalidRecordsDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: LogisticsOptimizationManager, config: LogisticsOptimizationConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendLoLog({
      event: "engine_initialization",
      level: "info",
      details: "Logistics Optimization ready (R2-17)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): LogisticsOptimizationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: LogisticsOptimizationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): LogisticsReport | null {
    return this.latestReport;
  }

  getManager(): LogisticsOptimizationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): LogisticsPerformanceStats {
    return { ...this.performance };
  }

  optimizeShipping(input: OptimizeShippingInput = {}): LogisticsReport {
    if (!this.config.enabled) throw new Error("Logistics Optimization is disabled");
    this.status = "optimizing";
    this.performance.optimizeRuns += 1;
    appendLoLog({ event: "optimize_start", level: "info", details: "optimizeShipping started" });
    const report = this.manager.optimizeShipping(input, this.config);
    this.recordOptimizationMetrics(report);
    this.finalizeOperation(report, "optimize");
    return report;
  }

  private recordOptimizationMetrics(report: LogisticsReport): void {
    this.performance.ordersOptimized += report.records.length;
    this.performance.routesAnalyzed += report.records.length;
    this.performance.carriersSelected += report.records.length;
    this.performance.warehousesOptimized += report.records.length;
    this.performance.bottlenecksDetected += report.bottlenecks.length;
    this.performance.inefficientRoutesDetected += report.recommendations.filter(
      (r) => r.improvementType === "reroute_warehouse",
    ).length;
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.performance.optimizationFailures += report.failures.length;
    this.performance.invalidRecordsDetected += report.invalidRecords.length;
    this.performance.costsReduced += report.recommendations.reduce((s, r) => s + r.estimatedSavings, 0);
    this.performance.deliveryTimesOptimized += report.records.filter((r) => r.estimatedDeliveryTime <= 4).length;
  }

  private finalizeOperation(report: LogisticsReport, action: string): void {
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
      this.status = "active";
    }

    this.performance.averageOperationDurationMs = Math.round(
      (this.performance.averageOperationDurationMs * (this.performance.totalOperations - 1) + duration) /
        this.performance.totalOperations,
    );
    if (duration > this.performance.peakOperationDurationMs) {
      this.performance.peakOperationDurationMs = duration;
    }

    this.healthMonitor.recordOperation(
      report.validation.decision,
      report.failures,
      report.invalidRecords,
      report.bottlenecks.length,
      report.recommendations.filter((r) => r.improvementType === "reroute_warehouse").length,
      report.recommendations.length,
    );
    appendLoLog({
      event: "optimize_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
