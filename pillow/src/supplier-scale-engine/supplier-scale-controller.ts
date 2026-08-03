/** X3-06 — Supplier Scale Engine orchestration controller. */

import { appendSseLog } from "./sse-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { SupplierScaleManager } from "./supplier-scale-manager.js";
import type { SupplierScaleEngineConfiguration } from "./configuration.js";
import type {
  ConnectSupplierScaleEngineInput,
  EngineStatus,
  SupplierScaleInput,
  SsePerformanceStats,
  SseRunReport,
  RunSseDiagnosticsInput,
} from "./types.js";

export class SupplierScaleController {
  private config: SupplierScaleEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: SseRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: SsePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    monitoringRuns: 0,
    scalingRisksDetected: 0,
    bottlenecksDetected: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: SupplierScaleManager,
    config: SupplierScaleEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendSseLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Supplier Scale Engine ready — never recommend supplier expansion without validated capacity; structural signals only",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): SupplierScaleEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: SupplierScaleEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): SseRunReport | null {
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

  getPerformance(): SsePerformanceStats {
    return { ...this.performance };
  }

  connectSupplierScaleEngine(
    input: ConnectSupplierScaleEngineInput = {},
  ): SseRunReport {
    if (!this.config.enabled) throw new Error("Supplier Scale Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectSupplierScaleEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorSupplierCapacity(input: SupplierScaleInput = {}): SseRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorSupplierCapacity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorSupplierPerformance(input: SupplierScaleInput = {}): SseRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorSupplierPerformance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorLeadTimes(input: SupplierScaleInput = {}): SseRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorLeadTimes(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorInventory(input: SupplierScaleInput = {}): SseRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorInventory(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorFulfilment(input: SupplierScaleInput = {}): SseRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorFulfilment(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorReliability(input: SupplierScaleInput = {}): SseRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorReliability(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectSupplierBottlenecks(input: SupplierScaleInput = {}): SseRunReport {
    this.status = "detecting";
    const report = this.manager.detectSupplierBottlenecks(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.bottlenecksDetected += report.scalingRecords.filter((r) =>
        /bottleneck|critical/i.test(r.recommendationSummary),
      ).length;
    }
    this.finalizeOperation(report);
    return report;
  }

  detectScalingRisks(input: SupplierScaleInput = {}): SseRunReport {
    this.status = "detecting";
    const report = this.manager.detectScalingRisks(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.scalingRisksDetected += report.scalingRecords.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  recommendSupplierExpansion(input: SupplierScaleInput = {}): SseRunReport {
    this.status = "recommending";
    const report = this.manager.recommendSupplierExpansion(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunSseDiagnosticsInput = {}): SseRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: SseRunReport): void {
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
    appendSseLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
