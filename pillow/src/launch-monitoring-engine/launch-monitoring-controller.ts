/** X1-13 — Launch Monitoring Controller. */

import { appendLmeLog } from "./lme-logging.js";
import { LaunchMonitoringManager } from "./launch-monitoring-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { LaunchMonitoringEngineConfiguration } from "./configuration.js";
import type {
  ConnectLaunchMonitoringEngineInput,
  EngineStatus,
  LaunchMonitoringActionInput,
  LaunchMonitoringPerformanceStats,
  LaunchMonitoringRunReport,
  MonitorLaunchInput,
} from "./types.js";

export class LaunchMonitoringController {
  private config: LaunchMonitoringEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: LaunchMonitoringRunReport | null = null;
  private readonly manager: LaunchMonitoringManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: LaunchMonitoringPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    monitoringRuns: 0,
    operationalRuns: 0,
    salesRuns: 0,
    customerRuns: 0,
    anomalyRuns: 0,
    recommendationRuns: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: LaunchMonitoringManager, config: LaunchMonitoringEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendLmeLog({
      event: "engine_initialization",
      level: "info",
      details: "Launch Monitoring Engine ready (X1-13)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): LaunchMonitoringEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: LaunchMonitoringEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): LaunchMonitoringRunReport | null {
    return this.latestReport;
  }

  getManager(): LaunchMonitoringManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): LaunchMonitoringPerformanceStats {
    return { ...this.performance };
  }

  connectLaunchMonitoringEngine(
    input: ConnectLaunchMonitoringEngineInput = {},
  ): LaunchMonitoringRunReport {
    if (!this.config.enabled) throw new Error("Launch Monitoring Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectLaunchMonitoringEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorLaunch(input: MonitorLaunchInput = {}): LaunchMonitoringRunReport {
    this.status = "monitoring";
    this.performance.monitoringRuns += 1;
    const report = this.manager.monitorLaunch(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorOperationalHealth(input: LaunchMonitoringActionInput = {}): LaunchMonitoringRunReport {
    this.performance.operationalRuns += 1;
    const report = this.manager.monitorOperationalHealth(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorCustomerActivity(input: LaunchMonitoringActionInput = {}): LaunchMonitoringRunReport {
    this.performance.customerRuns += 1;
    const report = this.manager.monitorCustomerActivity(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorSalesPerformance(input: LaunchMonitoringActionInput = {}): LaunchMonitoringRunReport {
    this.performance.salesRuns += 1;
    const report = this.manager.monitorSalesPerformance(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorOrderActivity(input: LaunchMonitoringActionInput = {}): LaunchMonitoringRunReport {
    this.performance.salesRuns += 1;
    const report = this.manager.monitorOrderActivity(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorSystemStability(input: LaunchMonitoringActionInput = {}): LaunchMonitoringRunReport {
    this.performance.operationalRuns += 1;
    const report = this.manager.monitorSystemStability(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectLaunchAnomalies(input: LaunchMonitoringActionInput = {}): LaunchMonitoringRunReport {
    this.performance.anomalyRuns += 1;
    const report = this.manager.detectLaunchAnomalies(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectOperationalFailures(input: LaunchMonitoringActionInput = {}): LaunchMonitoringRunReport {
    this.performance.anomalyRuns += 1;
    const report = this.manager.detectOperationalFailures(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateLaunchHealthRecommendations(
    input: LaunchMonitoringActionInput = {},
  ): LaunchMonitoringRunReport {
    this.performance.recommendationRuns += 1;
    const report = this.manager.generateLaunchHealthRecommendations(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: LaunchMonitoringRunReport): void {
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
    appendLmeLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
