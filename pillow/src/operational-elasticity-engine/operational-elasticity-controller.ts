/** X3-11 — Operational Elasticity Engine orchestration controller. */

import { appendOeeLog } from "./oee-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { OperationalElasticityManager } from "./operational-elasticity-manager.js";
import type { OperationalElasticityEngineConfiguration } from "./configuration.js";
import type {
  OperationalElasticityInput,
  OeePerformanceStats,
  OeeRunReport,
  ConnectOperationalElasticityEngineInput,
  EngineStatus,
  RunOeeDiagnosticsInput,
} from "./types.js";

export class OperationalElasticityController {
  private config: OperationalElasticityEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: OeeRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: OeePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    monitoringRuns: 0,
    capacityAdjustments: 0,
    overcapacityDetected: 0,
    undercapacityDetected: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: OperationalElasticityManager,
    config: OperationalElasticityEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendOeeLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Operational Elasticity Engine ready — never exceed validated operational limits; structural signals only",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): OperationalElasticityEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: OperationalElasticityEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): OeeRunReport | null {
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

  getPerformance(): OeePerformanceStats {
    return { ...this.performance };
  }

  connectOperationalElasticityEngine(
    input: ConnectOperationalElasticityEngineInput = {},
  ): OeeRunReport {
    if (!this.config.enabled) throw new Error("Operational Elasticity Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectOperationalElasticityEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorOperationalDemand(input: OperationalElasticityInput = {}): OeeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorOperationalDemand(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorOperationalUtilization(input: OperationalElasticityInput = {}): OeeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorOperationalUtilization(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  scaleCapacityUpward(input: OperationalElasticityInput = {}): OeeRunReport {
    this.status = "analyzing";
    const report = this.manager.scaleCapacityUpward(input, this.config);
    if (report.validation.decision !== "fail") this.performance.capacityAdjustments += 1;
    this.finalizeOperation(report);
    return report;
  }

  scaleCapacityDownward(input: OperationalElasticityInput = {}): OeeRunReport {
    this.status = "analyzing";
    const report = this.manager.scaleCapacityDownward(input, this.config);
    if (report.validation.decision !== "fail") this.performance.capacityAdjustments += 1;
    this.finalizeOperation(report);
    return report;
  }

  balanceWorkloadsDynamically(input: OperationalElasticityInput = {}): OeeRunReport {
    this.status = "analyzing";
    const report = this.manager.balanceWorkloadsDynamically(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  optimizeResourceUtilization(input: OperationalElasticityInput = {}): OeeRunReport {
    this.status = "analyzing";
    const report = this.manager.optimizeResourceUtilization(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectOvercapacity(input: OperationalElasticityInput = {}): OeeRunReport {
    this.status = "detecting";
    const report = this.manager.detectOvercapacity(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.overcapacityDetected += report.elasticityRecords.filter((r) =>
        /overcapacity|contract/i.test(r.resourceAllocationSummary),
      ).length;
    }
    this.finalizeOperation(report);
    return report;
  }

  detectUndercapacity(input: OperationalElasticityInput = {}): OeeRunReport {
    this.status = "detecting";
    const report = this.manager.detectUndercapacity(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.undercapacityDetected += report.elasticityRecords.filter((r) =>
        /undercapacity|expand/i.test(r.resourceAllocationSummary),
      ).length;
    }
    this.finalizeOperation(report);
    return report;
  }

  recommendElasticityActions(input: OperationalElasticityInput = {}): OeeRunReport {
    this.status = "recommending";
    const report = this.manager.recommendElasticityActions(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunOeeDiagnosticsInput = {}): OeeRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: OeeRunReport): void {
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
    appendOeeLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
