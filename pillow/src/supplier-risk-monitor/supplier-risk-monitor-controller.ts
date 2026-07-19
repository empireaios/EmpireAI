/** R2-16 — Supplier Risk Monitor Controller. */

import { appendSrmLog } from "./srm-logging.js";
import { SupplierRiskMonitorManager } from "./supplier-risk-monitor-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { SupplierRiskMonitorConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  MonitorSupplierHealthInput,
  SupplierRiskPerformanceStats,
  SupplierRiskReport,
} from "./types.js";

export class SupplierRiskMonitorController {
  private config: SupplierRiskMonitorConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: SupplierRiskReport | null = null;
  private readonly manager: SupplierRiskMonitorManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: SupplierRiskPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    monitorRuns: 0,
    suppliersMonitored: 0,
    riskScoresCalculated: 0,
    alertsGenerated: 0,
    disruptionsDetected: 0,
    abnormalBehaviourDetected: 0,
    monitoringFailures: 0,
    invalidRecordsDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: SupplierRiskMonitorManager, config: SupplierRiskMonitorConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendSrmLog({
      event: "engine_initialization",
      level: "info",
      details: "Supplier Risk Monitor ready (R2-16)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): SupplierRiskMonitorConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: SupplierRiskMonitorConfiguration): void {
    this.config = config;
  }

  getLatestReport(): SupplierRiskReport | null {
    return this.latestReport;
  }

  getManager(): SupplierRiskMonitorManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): SupplierRiskPerformanceStats {
    return { ...this.performance };
  }

  monitorSupplierHealth(input: MonitorSupplierHealthInput = {}): SupplierRiskReport {
    if (!this.config.enabled) throw new Error("Supplier Risk Monitor is disabled");
    this.status = "monitoring";
    this.performance.monitorRuns += 1;
    appendSrmLog({ event: "monitor_start", level: "info", details: "monitorSupplierHealth started" });
    const report = this.manager.monitorSupplierHealth(input, this.config);
    this.recordRiskMetrics(report);
    this.finalizeOperation(report, "monitor");
    return report;
  }

  private recordRiskMetrics(report: SupplierRiskReport): void {
    this.performance.suppliersMonitored += report.records.length;
    this.performance.riskScoresCalculated += report.records.length;
    this.performance.alertsGenerated += report.records.reduce(
      (sum, r) => sum + r.activeRiskAlerts.length,
      0,
    );
    this.performance.disruptionsDetected += report.records.filter(
      (r) => r.availabilityStatus === "disrupted" || r.availabilityStatus === "unavailable",
    ).length;
    this.performance.abnormalBehaviourDetected += report.records.filter((r) =>
      r.activeRiskAlerts.includes("abnormal_behaviour"),
    ).length;
    this.performance.monitoringFailures += report.failures.length;
    this.performance.invalidRecordsDetected += report.invalidRecords.length;
  }

  private finalizeOperation(report: SupplierRiskReport, action: string): void {
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
      report.records.filter((r) => r.riskScore >= this.config.highRiskThresholdScore).length,
      report.records.filter(
        (r) => r.availabilityStatus === "disrupted" || r.availabilityStatus === "unavailable",
      ).length,
      report.records.reduce((sum, r) => sum + r.activeRiskAlerts.length, 0),
    );
    appendSrmLog({
      event: "monitor_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
