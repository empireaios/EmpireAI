/** X3-04 — Capacity Planning Engine orchestration controller. */

import { appendCpeLog } from "./cpe-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { CapacityPlanningManager } from "./capacity-planning-manager.js";
import type { CapacityPlanningEngineConfiguration } from "./configuration.js";
import type {
  CapacityPlanningInput,
  ConnectCapacityPlanningEngineInput,
  CpePerformanceStats,
  CpeRunReport,
  EngineStatus,
  RunCpeDiagnosticsInput,
} from "./types.js";

export class CapacityPlanningController {
  private config: CapacityPlanningEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: CpeRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: CpePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    monitoringRuns: 0,
    forecastsRun: 0,
    bottlenecksDetected: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: CapacityPlanningManager,
    config: CapacityPlanningEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCpeLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Capacity Planning Engine ready — never recommend beyond validated limits; structural signals only",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CapacityPlanningEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CapacityPlanningEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): CpeRunReport | null {
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

  getPerformance(): CpePerformanceStats {
    return { ...this.performance };
  }

  connectCapacityPlanningEngine(
    input: ConnectCapacityPlanningEngineInput = {},
  ): CpeRunReport {
    if (!this.config.enabled) throw new Error("Capacity Planning Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectCapacityPlanningEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorOperationalCapacity(input: CapacityPlanningInput = {}): CpeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorOperationalCapacity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorInfrastructureCapacity(input: CapacityPlanningInput = {}): CpeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorInfrastructureCapacity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorSupplierCapacity(input: CapacityPlanningInput = {}): CpeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorSupplierCapacity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorFulfilmentCapacity(input: CapacityPlanningInput = {}): CpeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorFulfilmentCapacity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorInventoryCapacity(input: CapacityPlanningInput = {}): CpeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorInventoryCapacity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorWorkforceCapacity(input: CapacityPlanningInput = {}): CpeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorWorkforceCapacity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  forecastCapacity(input: CapacityPlanningInput = {}): CpeRunReport {
    this.status = "forecasting";
    const report = this.manager.forecastCapacity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.forecastsRun += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectBottlenecks(input: CapacityPlanningInput = {}): CpeRunReport {
    this.status = "detecting";
    const report = this.manager.detectBottlenecks(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.bottlenecksDetected += report.planningRecords.filter((r) =>
        /bottleneck|critical/i.test(r.bottleneckSummary),
      ).length;
    }
    this.finalizeOperation(report);
    return report;
  }

  recommendExpansion(input: CapacityPlanningInput = {}): CpeRunReport {
    this.status = "recommending";
    const report = this.manager.recommendExpansion(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunCpeDiagnosticsInput = {}): CpeRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: CpeRunReport): void {
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
    appendCpeLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
