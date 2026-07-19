/** R5-19 — Autonomous Marketing Engine Controller. */

import { appendAmeLog } from "./ame-logging.js";
import { AutonomousMarketingManager } from "./autonomous-marketing-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { AutonomousMarketingEngineConfiguration } from "./configuration.js";
import type {
  AutonomousMarketingActionInput,
  AutonomousMarketingPerformanceStats,
  AutonomousMarketingRunReport,
  ConnectAutonomousMarketingEngineInput,
  EngineStatus,
  MonitorPerformanceInput,
} from "./types.js";

export class AutonomousMarketingController {
  private config: AutonomousMarketingEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: AutonomousMarketingRunReport | null = null;
  private readonly manager: AutonomousMarketingManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: AutonomousMarketingPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    recommendationsGenerated: 0,
    optimizationsRun: 0,
    approvedExecutions: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: AutonomousMarketingManager,
    config: AutonomousMarketingEngineConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendAmeLog({
      event: "engine_initialization",
      level: "info",
      details: "Autonomous Marketing Engine ready (R5-19)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): AutonomousMarketingEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: AutonomousMarketingEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): AutonomousMarketingRunReport | null {
    return this.latestReport;
  }

  getManager(): AutonomousMarketingManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): AutonomousMarketingPerformanceStats {
    return { ...this.performance };
  }

  connectAutonomousMarketingEngine(
    input: ConnectAutonomousMarketingEngineInput = {},
  ): AutonomousMarketingRunReport {
    if (!this.config.enabled) throw new Error("Autonomous Marketing Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectAutonomousMarketingEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorPerformance(input: MonitorPerformanceInput = {}): AutonomousMarketingRunReport {
    this.status = "optimizing";
    const report = this.manager.monitorPerformance(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(
    input: AutonomousMarketingActionInput = {},
  ): AutonomousMarketingRunReport {
    this.performance.recommendationsGenerated += 1;
    const report = this.manager.generateRecommendations(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  optimizeBudgets(input: AutonomousMarketingActionInput = {}): AutonomousMarketingRunReport {
    this.performance.optimizationsRun += 1;
    const report = this.manager.optimizeBudgets(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  optimizeAudience(input: AutonomousMarketingActionInput = {}): AutonomousMarketingRunReport {
    this.performance.optimizationsRun += 1;
    const report = this.manager.optimizeAudience(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  optimizeScheduling(input: AutonomousMarketingActionInput = {}): AutonomousMarketingRunReport {
    this.performance.optimizationsRun += 1;
    const report = this.manager.optimizeScheduling(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  optimizeCreative(input: AutonomousMarketingActionInput = {}): AutonomousMarketingRunReport {
    this.performance.optimizationsRun += 1;
    const report = this.manager.optimizeCreative(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  optimizeChannelAllocation(
    input: AutonomousMarketingActionInput = {},
  ): AutonomousMarketingRunReport {
    this.performance.optimizationsRun += 1;
    const report = this.manager.optimizeChannelAllocation(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  respondToPerformanceChanges(
    input: AutonomousMarketingActionInput = {},
  ): AutonomousMarketingRunReport {
    this.performance.optimizationsRun += 1;
    const report = this.manager.respondToPerformanceChanges(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  executeApprovedOptimizations(
    input: AutonomousMarketingActionInput = {},
  ): AutonomousMarketingRunReport {
    this.performance.approvedExecutions += 1;
    const report = this.manager.executeApprovedOptimizations(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: AutonomousMarketingRunReport): void {
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
    appendAmeLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
