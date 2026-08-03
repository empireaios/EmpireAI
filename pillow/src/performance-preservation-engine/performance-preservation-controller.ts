/** X3-12 — Performance Preservation Engine orchestration controller. */

import { appendPpeLog } from "./ppe-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { PerformancePreservationManager } from "./performance-preservation-manager.js";
import type { PerformancePreservationEngineConfiguration } from "./configuration.js";
import type {
  PerformancePreservationInput,
  PpePerformanceStats,
  PpeRunReport,
  ConnectPerformancePreservationEngineInput,
  EngineStatus,
  RunPpeDiagnosticsInput,
} from "./types.js";

export class PerformancePreservationController {
  private config: PerformancePreservationEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: PpeRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: PpePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    monitoringRuns: 0,
    degradationDetected: 0,
    qualityRegressionsDetected: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: PerformancePreservationManager,
    config: PerformancePreservationEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendPpeLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Performance Preservation Engine ready — never compromise customer experience for scaling; structural signals only",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): PerformancePreservationEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: PerformancePreservationEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): PpeRunReport | null {
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

  getPerformance(): PpePerformanceStats {
    return { ...this.performance };
  }

  connectPerformancePreservationEngine(
    input: ConnectPerformancePreservationEngineInput = {},
  ): PpeRunReport {
    if (!this.config.enabled) throw new Error("Performance Preservation Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectPerformancePreservationEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorServiceQuality(input: PerformancePreservationInput = {}): PpeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorServiceQuality(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorCustomerExperience(input: PerformancePreservationInput = {}): PpeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorCustomerExperience(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorOperationalPerformance(input: PerformancePreservationInput = {}): PpeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorOperationalPerformance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorResponseTimes(input: PerformancePreservationInput = {}): PpeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorResponseTimes(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorFulfilmentQuality(input: PerformancePreservationInput = {}): PpeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorFulfilmentQuality(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorReliability(input: PerformancePreservationInput = {}): PpeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorReliability(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectPerformanceDegradation(input: PerformancePreservationInput = {}): PpeRunReport {
    this.status = "detecting";
    const report = this.manager.detectPerformanceDegradation(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.degradationDetected += report.preservationRecords.filter(
        (r) => r.detectedDegradation,
      ).length;
    }
    this.finalizeOperation(report);
    return report;
  }

  detectQualityRegressions(input: PerformancePreservationInput = {}): PpeRunReport {
    this.status = "detecting";
    const report = this.manager.detectQualityRegressions(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.qualityRegressionsDetected += report.preservationRecords.filter((r) =>
        /regression|degraded|below/i.test(r.recommendationSummary),
      ).length;
    }
    this.finalizeOperation(report);
    return report;
  }

  recommendPreservationActions(input: PerformancePreservationInput = {}): PpeRunReport {
    this.status = "recommending";
    const report = this.manager.recommendPreservationActions(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunPpeDiagnosticsInput = {}): PpeRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: PpeRunReport): void {
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
    appendPpeLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
