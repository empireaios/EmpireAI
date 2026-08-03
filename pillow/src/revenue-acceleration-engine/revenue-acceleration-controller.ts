/** X3-16 — Revenue Acceleration Engine orchestration controller. */

import { appendRaeLog } from "./rae-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { RevenueAccelerationManager } from "./revenue-acceleration-manager.js";
import type { RevenueAccelerationEngineConfiguration } from "./configuration.js";
import type {
  RevenueAccelerationInput,
  RaePerformanceStats,
  RaeRunReport,
  ConnectRevenueAccelerationEngineInput,
  EngineStatus,
  RunRaeDiagnosticsInput,
} from "./types.js";

export class RevenueAccelerationController {
  private config: RevenueAccelerationEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: RaeRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: RaePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    monitoringRuns: 0,
    opportunitiesIdentified: 0,
    bottlenecksIdentified: 0,
    strategiesOptimized: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: RevenueAccelerationManager,
    config: RevenueAccelerationEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendRaeLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Revenue Acceleration Engine ready — never recommend revenue actions without validated supporting data; structural signals only",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): RevenueAccelerationEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: RevenueAccelerationEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): RaeRunReport | null {
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

  getPerformance(): RaePerformanceStats {
    return { ...this.performance };
  }

  connectRevenueAccelerationEngine(
    input: ConnectRevenueAccelerationEngineInput = {},
  ): RaeRunReport {
    if (!this.config.enabled) throw new Error("Revenue Acceleration Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectRevenueAccelerationEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorRevenueGrowth(input: RevenueAccelerationInput = {}): RaeRunReport {
    this.status = "evaluating";
    const report = this.manager.monitorRevenueGrowth(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorRevenueTrends(input: RevenueAccelerationInput = {}): RaeRunReport {
    this.status = "evaluating";
    const report = this.manager.monitorRevenueTrends(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorProductRevenue(input: RevenueAccelerationInput = {}): RaeRunReport {
    this.status = "evaluating";
    const report = this.manager.monitorProductRevenue(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorChannelRevenue(input: RevenueAccelerationInput = {}): RaeRunReport {
    this.status = "evaluating";
    const report = this.manager.monitorChannelRevenue(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorCustomerRevenue(input: RevenueAccelerationInput = {}): RaeRunReport {
    this.status = "evaluating";
    const report = this.manager.monitorCustomerRevenue(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  identifyRevenueAccelerationOpportunities(
    input: RevenueAccelerationInput = {},
  ): RaeRunReport {
    this.status = "identifying";
    const report = this.manager.identifyRevenueAccelerationOpportunities(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.opportunitiesIdentified += report.revenueAccelerationRecords.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  identifyRevenueBottlenecks(input: RevenueAccelerationInput = {}): RaeRunReport {
    this.status = "identifying";
    const report = this.manager.identifyRevenueBottlenecks(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.bottlenecksIdentified += report.revenueAccelerationRecords.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  optimizeRevenueStrategies(input: RevenueAccelerationInput = {}): RaeRunReport {
    this.status = "optimizing";
    const report = this.manager.optimizeRevenueStrategies(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.strategiesOptimized += report.revenueAccelerationRecords.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  rankRevenueOpportunities(input: RevenueAccelerationInput = {}): RaeRunReport {
    this.status = "ranking";
    const report = this.manager.rankRevenueOpportunities(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  recommendRevenueAcceleration(input: RevenueAccelerationInput = {}): RaeRunReport {
    this.status = "recommending";
    const report = this.manager.recommendRevenueAcceleration(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunRaeDiagnosticsInput = {}): RaeRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: RaeRunReport): void {
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
    appendRaeLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
