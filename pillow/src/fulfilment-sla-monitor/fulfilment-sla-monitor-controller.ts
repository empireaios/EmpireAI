/** R2-18 — Fulfilment SLA Monitor Controller. */

import { appendFsmLog } from "./fsm-logging.js";
import { FulfilmentSlaMonitorManager } from "./fulfilment-sla-monitor-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { FulfilmentSlaMonitorConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  MonitorFulfilmentSlaInput,
  SlaPerformanceStats,
  SlaReport,
} from "./types.js";

export class FulfilmentSlaMonitorController {
  private config: FulfilmentSlaMonitorConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: SlaReport | null = null;
  private readonly manager: FulfilmentSlaMonitorManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: SlaPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    monitorRuns: 0,
    ordersMonitored: 0,
    complianceScoresCalculated: 0,
    breachesDetected: 0,
    risksDetected: 0,
    alertsGenerated: 0,
    monitoringFailures: 0,
    invalidRecordsDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: FulfilmentSlaMonitorManager, config: FulfilmentSlaMonitorConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendFsmLog({
      event: "engine_initialization",
      level: "info",
      details: "Fulfilment SLA Monitor ready (R2-18)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): FulfilmentSlaMonitorConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: FulfilmentSlaMonitorConfiguration): void {
    this.config = config;
  }

  getLatestReport(): SlaReport | null {
    return this.latestReport;
  }

  getManager(): FulfilmentSlaMonitorManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): SlaPerformanceStats {
    return { ...this.performance };
  }

  monitorFulfilmentSla(input: MonitorFulfilmentSlaInput = {}): SlaReport {
    if (!this.config.enabled) throw new Error("Fulfilment SLA Monitor is disabled");
    this.status = "monitoring";
    this.performance.monitorRuns += 1;
    appendFsmLog({ event: "monitor_start", level: "info", details: "monitorFulfilmentSla started" });
    const report = this.manager.monitorFulfilmentSla(input, this.config);
    this.recordSlaMetrics(report);
    this.finalizeOperation(report, "monitor");
    return report;
  }

  private recordSlaMetrics(report: SlaReport): void {
    this.performance.ordersMonitored += report.records.length;
    this.performance.complianceScoresCalculated += report.records.length;
    this.performance.breachesDetected += report.records.filter((r) => r.complianceStatus === "breached").length;
    this.performance.risksDetected += report.records.filter((r) => r.complianceStatus === "at_risk").length;
    this.performance.alertsGenerated += report.records.reduce((s, r) => s + r.activeAlerts.length, 0);
    this.performance.monitoringFailures += report.failures.length;
    this.performance.invalidRecordsDetected += report.invalidRecords.length;
  }

  private finalizeOperation(report: SlaReport, action: string): void {
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
      report.records.filter((r) => r.complianceStatus === "breached").length,
      report.records.filter((r) => r.complianceStatus === "at_risk").length,
      report.records.reduce((s, r) => s + r.activeAlerts.length, 0),
    );
    appendFsmLog({
      event: "monitor_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
