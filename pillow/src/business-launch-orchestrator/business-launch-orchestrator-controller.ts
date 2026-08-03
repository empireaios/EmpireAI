/** X1-11 — Business Launch Orchestrator Controller. */

import { appendBloLog } from "./blo-logging.js";
import { BusinessLaunchOrchestratorManager } from "./business-launch-orchestrator-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { BusinessLaunchOrchestratorConfiguration } from "./configuration.js";
import type {
  ConnectBusinessLaunchOrchestratorInput,
  EngineStatus,
  LaunchActionInput,
  LaunchOrchestratorPerformanceStats,
  LaunchOrchestratorRunReport,
  OrchestrateLaunchInput,
} from "./types.js";

export class BusinessLaunchOrchestratorController {
  private config: BusinessLaunchOrchestratorConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: LaunchOrchestratorRunReport | null = null;
  private readonly manager: BusinessLaunchOrchestratorManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: LaunchOrchestratorPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    launchesOrchestrated: 0,
    workflowRuns: 0,
    dependencyRuns: 0,
    recoveryRuns: 0,
    reportRuns: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: BusinessLaunchOrchestratorManager,
    config: BusinessLaunchOrchestratorConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendBloLog({
      event: "engine_initialization",
      level: "info",
      details: "Business Launch Orchestrator ready (X1-11)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): BusinessLaunchOrchestratorConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: BusinessLaunchOrchestratorConfiguration): void {
    this.config = config;
  }

  getLatestReport(): LaunchOrchestratorRunReport | null {
    return this.latestReport;
  }

  getManager(): BusinessLaunchOrchestratorManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): LaunchOrchestratorPerformanceStats {
    return { ...this.performance };
  }

  connectBusinessLaunchOrchestrator(
    input: ConnectBusinessLaunchOrchestratorInput = {},
  ): LaunchOrchestratorRunReport {
    if (!this.config.enabled) throw new Error("Business Launch Orchestrator is disabled");
    this.status = "connecting";
    const report = this.manager.connectBusinessLaunchOrchestrator(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  orchestrateLaunch(input: OrchestrateLaunchInput = {}): LaunchOrchestratorRunReport {
    this.status = "launching";
    this.performance.launchesOrchestrated += 1;
    const report = this.manager.orchestrateLaunch(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  executeLaunchWorkflow(input: LaunchActionInput = {}): LaunchOrchestratorRunReport {
    this.performance.workflowRuns += 1;
    const report = this.manager.executeLaunchWorkflow(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  manageLaunchStages(input: LaunchActionInput = {}): LaunchOrchestratorRunReport {
    this.performance.workflowRuns += 1;
    const report = this.manager.manageLaunchStages(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  coordinateDependencies(input: LaunchActionInput = {}): LaunchOrchestratorRunReport {
    this.performance.dependencyRuns += 1;
    const report = this.manager.coordinateDependencies(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  trackLaunchProgress(input: LaunchActionInput = {}): LaunchOrchestratorRunReport {
    const report = this.manager.trackLaunchProgress(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectLaunchFailures(input: LaunchActionInput = {}): LaunchOrchestratorRunReport {
    const report = this.manager.detectLaunchFailures(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  coordinateLaunchRecovery(input: LaunchActionInput = {}): LaunchOrchestratorRunReport {
    this.performance.recoveryRuns += 1;
    const report = this.manager.coordinateLaunchRecovery(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateLaunchReport(input: LaunchActionInput = {}): LaunchOrchestratorRunReport {
    this.performance.reportRuns += 1;
    const report = this.manager.generateLaunchReport(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: LaunchOrchestratorRunReport): void {
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
    appendBloLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
