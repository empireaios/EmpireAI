/** X3-15 — Autonomous Growth Optimizer orchestration controller. */

import { appendAgoLog } from "./ago-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { AutonomousGrowthOptimizerManager } from "./autonomous-growth-optimizer-manager.js";
import type { AutonomousGrowthOptimizerConfiguration } from "./configuration.js";
import type {
  GrowthOptimizationInput,
  AgoPerformanceStats,
  AgoRunReport,
  ConnectAutonomousGrowthOptimizerInput,
  EngineStatus,
  RunAgoDiagnosticsInput,
} from "./types.js";

export class AutonomousGrowthOptimizerController {
  private config: AutonomousGrowthOptimizerConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: AgoRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: AgoPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    monitoringRuns: 0,
    opportunitiesIdentified: 0,
    constraintsIdentified: 0,
    strategiesOptimized: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: AutonomousGrowthOptimizerManager,
    config: AutonomousGrowthOptimizerConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendAgoLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Autonomous Growth Optimizer ready — never optimize growth beyond validated operational limits; structural signals only",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): AutonomousGrowthOptimizerConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: AutonomousGrowthOptimizerConfiguration): void {
    this.config = config;
  }

  getLatestReport(): AgoRunReport | null {
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

  getPerformance(): AgoPerformanceStats {
    return { ...this.performance };
  }

  connectAutonomousGrowthOptimizer(
    input: ConnectAutonomousGrowthOptimizerInput = {},
  ): AgoRunReport {
    if (!this.config.enabled) throw new Error("Autonomous Growth Optimizer is disabled");
    this.status = "connecting";
    const report = this.manager.connectAutonomousGrowthOptimizer(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorEnterpriseGrowth(input: GrowthOptimizationInput = {}): AgoRunReport {
    this.status = "evaluating";
    const report = this.manager.monitorEnterpriseGrowth(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorRevenueGrowth(input: GrowthOptimizationInput = {}): AgoRunReport {
    this.status = "evaluating";
    const report = this.manager.monitorRevenueGrowth(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorProfitGrowth(input: GrowthOptimizationInput = {}): AgoRunReport {
    this.status = "evaluating";
    const report = this.manager.monitorProfitGrowth(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorCustomerGrowth(input: GrowthOptimizationInput = {}): AgoRunReport {
    this.status = "evaluating";
    const report = this.manager.monitorCustomerGrowth(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorOperationalGrowth(input: GrowthOptimizationInput = {}): AgoRunReport {
    this.status = "evaluating";
    const report = this.manager.monitorOperationalGrowth(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  identifyGrowthOpportunities(input: GrowthOptimizationInput = {}): AgoRunReport {
    this.status = "identifying";
    const report = this.manager.identifyGrowthOpportunities(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.opportunitiesIdentified += report.growthOptimizationRecords.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  identifyGrowthConstraints(input: GrowthOptimizationInput = {}): AgoRunReport {
    this.status = "identifying";
    const report = this.manager.identifyGrowthConstraints(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.constraintsIdentified += report.growthOptimizationRecords.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  optimizeGrowthStrategies(input: GrowthOptimizationInput = {}): AgoRunReport {
    this.status = "optimizing";
    const report = this.manager.optimizeGrowthStrategies(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.strategiesOptimized += report.growthOptimizationRecords.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  rankGrowthPriorities(input: GrowthOptimizationInput = {}): AgoRunReport {
    this.status = "ranking";
    const report = this.manager.rankGrowthPriorities(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  recommendAutonomousGrowth(input: GrowthOptimizationInput = {}): AgoRunReport {
    this.status = "recommending";
    const report = this.manager.recommendAutonomousGrowth(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunAgoDiagnosticsInput = {}): AgoRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: AgoRunReport): void {
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
    appendAgoLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
