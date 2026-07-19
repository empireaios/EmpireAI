/** R5-18 — Cross-Channel Orchestrator Controller. */

import { appendCcoLog } from "./cco-logging.js";
import { CrossChannelOrchestratorManager } from "./cross-channel-orchestrator-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { CrossChannelAnalyticsEngine } from "./cross-channel-analytics-engine.js";
import type { CrossChannelOrchestratorConfiguration } from "./configuration.js";
import type {
  ConnectCrossChannelOrchestratorInput,
  CoordinateCampaignsInput,
  EngineStatus,
  OrchestrationActionInput,
  OrchestrationPerformanceStats,
  OrchestrationRunReport,
} from "./types.js";

export class CrossChannelOrchestratorController {
  private config: CrossChannelOrchestratorConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: OrchestrationRunReport | null = null;
  private readonly manager: CrossChannelOrchestratorManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly analytics = new CrossChannelAnalyticsEngine();
  private readonly performance: OrchestrationPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    coordinationsRun: 0,
    synchronizationsRun: 0,
    conflictsDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: CrossChannelOrchestratorManager,
    config: CrossChannelOrchestratorConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCcoLog({
      event: "engine_initialization",
      level: "info",
      details: "Cross-Channel Orchestrator ready (R5-18)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CrossChannelOrchestratorConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CrossChannelOrchestratorConfiguration): void {
    this.config = config;
  }

  getLatestReport(): OrchestrationRunReport | null {
    return this.latestReport;
  }

  getManager(): CrossChannelOrchestratorManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): OrchestrationPerformanceStats {
    return { ...this.performance };
  }

  getConflictedCount(): number {
    return this.analytics.conflictedCount(this.manager.getOrchestrationRecords());
  }

  connectCrossChannelOrchestrator(
    input: ConnectCrossChannelOrchestratorInput = {},
  ): OrchestrationRunReport {
    if (!this.config.enabled) throw new Error("Cross-Channel Orchestrator is disabled");
    this.status = "connecting";
    const report = this.manager.connectCrossChannelOrchestrator(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  coordinateCampaigns(input: CoordinateCampaignsInput = {}): OrchestrationRunReport {
    this.status = "orchestrating";
    this.performance.coordinationsRun += 1;
    const report = this.manager.coordinateCampaigns(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  synchronizeExecution(input: OrchestrationActionInput = {}): OrchestrationRunReport {
    this.performance.synchronizationsRun += 1;
    const report = this.manager.synchronizeExecution(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  synchronizeSchedules(
    input: OrchestrationActionInput & { schedule?: string } = {},
  ): OrchestrationRunReport {
    this.performance.synchronizationsRun += 1;
    const report = this.manager.synchronizeSchedules(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  coordinateJourneys(input: OrchestrationActionInput = {}): OrchestrationRunReport {
    this.performance.coordinationsRun += 1;
    const report = this.manager.coordinateJourneys(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  coordinateChannels(input: OrchestrationActionInput = {}): OrchestrationRunReport {
    this.performance.coordinationsRun += 1;
    const report = this.manager.coordinateChannels(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  coordinateBudgets(input: OrchestrationActionInput = {}): OrchestrationRunReport {
    this.performance.coordinationsRun += 1;
    const report = this.manager.coordinateBudgets(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  coordinateAssets(input: OrchestrationActionInput = {}): OrchestrationRunReport {
    this.performance.coordinationsRun += 1;
    const report = this.manager.coordinateAssets(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  coordinateExperiments(input: OrchestrationActionInput = {}): OrchestrationRunReport {
    this.performance.coordinationsRun += 1;
    const report = this.manager.coordinateExperiments(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectConflicts(input: OrchestrationActionInput = {}): OrchestrationRunReport {
    const report = this.manager.detectConflicts(input, this.config);
    if (report.orchestrationRecords.some((r) => r.conflictStatus === "detected")) {
      this.performance.conflictsDetected += 1;
    }
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: OrchestrationRunReport): void {
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
    appendCcoLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
