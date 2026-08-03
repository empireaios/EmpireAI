/** X1-12 — Growth Initialization Controller. */

import { appendGieLog } from "./gie-logging.js";
import { GrowthInitializationManager } from "./growth-initialization-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { GrowthInitializationEngineConfiguration } from "./configuration.js";
import type {
  ConnectGrowthInitializationEngineInput,
  EngineStatus,
  GrowthActionInput,
  GrowthPerformanceStats,
  GrowthRunReport,
  InitializeGrowthPlanInput,
} from "./types.js";

export class GrowthInitializationController {
  private config: GrowthInitializationEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: GrowthRunReport | null = null;
  private readonly manager: GrowthInitializationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: GrowthPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    plansInitialized: 0,
    strategyRuns: 0,
    milestoneRuns: 0,
    acquisitionRuns: 0,
    recommendationRuns: 0,
    analyticsRuns: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: GrowthInitializationManager,
    config: GrowthInitializationEngineConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendGieLog({
      event: "engine_initialization",
      level: "info",
      details: "Growth Initialization Engine ready (X1-12)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): GrowthInitializationEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: GrowthInitializationEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): GrowthRunReport | null {
    return this.latestReport;
  }

  getManager(): GrowthInitializationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): GrowthPerformanceStats {
    return { ...this.performance };
  }

  connectGrowthInitializationEngine(
    input: ConnectGrowthInitializationEngineInput = {},
  ): GrowthRunReport {
    if (!this.config.enabled) throw new Error("Growth Initialization Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectGrowthInitializationEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  initializeGrowthPlan(input: InitializeGrowthPlanInput = {}): GrowthRunReport {
    this.status = "planning";
    this.performance.plansInitialized += 1;
    const report = this.manager.initializeGrowthPlan(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateGrowthStrategy(input: GrowthActionInput = {}): GrowthRunReport {
    this.performance.strategyRuns += 1;
    const report = this.manager.generateGrowthStrategy(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateLaunchMarketingRecommendations(input: GrowthActionInput = {}): GrowthRunReport {
    this.performance.recommendationRuns += 1;
    const report = this.manager.generateLaunchMarketingRecommendations(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateSalesTargets(input: GrowthActionInput = {}): GrowthRunReport {
    const report = this.manager.generateSalesTargets(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateOperationalPriorities(input: GrowthActionInput = {}): GrowthRunReport {
    const report = this.manager.generateOperationalPriorities(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateRevenueMilestones(input: GrowthActionInput = {}): GrowthRunReport {
    this.performance.milestoneRuns += 1;
    const report = this.manager.generateRevenueMilestones(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateCustomerAcquisitionPlan(input: GrowthActionInput = {}): GrowthRunReport {
    this.performance.acquisitionRuns += 1;
    const report = this.manager.generateCustomerAcquisitionPlan(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generatePerformanceBaselines(input: GrowthActionInput = {}): GrowthRunReport {
    this.performance.analyticsRuns += 1;
    const report = this.manager.generatePerformanceBaselines(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  trackEarlyPerformance(input: GrowthActionInput = {}): GrowthRunReport {
    this.performance.analyticsRuns += 1;
    const report = this.manager.trackEarlyPerformance(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  recommendImmediateOptimizations(input: GrowthActionInput = {}): GrowthRunReport {
    this.performance.recommendationRuns += 1;
    const report = this.manager.recommendImmediateOptimizations(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: GrowthRunReport): void {
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
    appendGieLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
