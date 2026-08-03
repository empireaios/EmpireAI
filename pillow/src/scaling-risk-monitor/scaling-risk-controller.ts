/** X3-13 — Scaling Risk Monitor orchestration controller. */

import { appendSrmLog } from "./srm-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { ScalingRiskManager } from "./scaling-risk-manager.js";
import type { ScalingRiskMonitorConfiguration } from "./configuration.js";
import type {
  ScalingRiskInput,
  SrmPerformanceStats,
  SrmRunReport,
  ConnectScalingRiskMonitorInput,
  EngineStatus,
  RunSrmDiagnosticsInput,
} from "./types.js";

export class ScalingRiskController {
  private config: ScalingRiskMonitorConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: SrmRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: SrmPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    monitoringRuns: 0,
    uncontrolledExpansionDetected: 0,
    criticalRisksDetected: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: ScalingRiskManager,
    config: ScalingRiskMonitorConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendSrmLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Scaling Risk Monitor ready — never suppress critical scaling risks; structural signals only",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ScalingRiskMonitorConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ScalingRiskMonitorConfiguration): void {
    this.config = config;
  }

  getLatestReport(): SrmRunReport | null {
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

  getPerformance(): SrmPerformanceStats {
    return { ...this.performance };
  }

  connectScalingRiskMonitor(input: ConnectScalingRiskMonitorInput = {}): SrmRunReport {
    if (!this.config.enabled) throw new Error("Scaling Risk Monitor is disabled");
    this.status = "connecting";
    const report = this.manager.connectScalingRiskMonitor(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorScalingRisks(input: ScalingRiskInput = {}): SrmRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorScalingRisks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorOperationalRisks(input: ScalingRiskInput = {}): SrmRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorOperationalRisks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorFinancialRisks(input: ScalingRiskInput = {}): SrmRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorFinancialRisks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorSupplierRisks(input: ScalingRiskInput = {}): SrmRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorSupplierRisks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorMarketingRisks(input: ScalingRiskInput = {}): SrmRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorMarketingRisks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorWorkforceRisks(input: ScalingRiskInput = {}): SrmRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorWorkforceRisks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorInfrastructureRisks(input: ScalingRiskInput = {}): SrmRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorInfrastructureRisks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectUncontrolledExpansion(input: ScalingRiskInput = {}): SrmRunReport {
    this.status = "detecting";
    const report = this.manager.detectUncontrolledExpansion(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.uncontrolledExpansionDetected += report.scalingRiskRecords.filter(
        (r) =>
          r.riskCategory === "uncontrolled_expansion" &&
          (r.riskSeverity === "high" || r.riskSeverity === "critical"),
      ).length;
      this.performance.criticalRisksDetected += report.scalingRiskRecords.filter(
        (r) => r.riskSeverity === "critical",
      ).length;
    }
    this.finalizeOperation(report);
    return report;
  }

  rankScalingRisks(input: ScalingRiskInput = {}): SrmRunReport {
    this.status = "ranking";
    const report = this.manager.rankScalingRisks(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  recommendRiskMitigations(input: ScalingRiskInput = {}): SrmRunReport {
    this.status = "recommending";
    const report = this.manager.recommendRiskMitigations(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunSrmDiagnosticsInput = {}): SrmRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: SrmRunReport): void {
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
    appendSrmLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
