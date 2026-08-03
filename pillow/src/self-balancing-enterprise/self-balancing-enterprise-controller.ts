/** X3-19 — Self-Balancing Enterprise orchestration controller. */

import { appendSbeLog } from "./sbe-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { SelfBalancingEnterpriseManager } from "./self-balancing-enterprise-manager.js";
import type { SelfBalancingEnterpriseConfiguration } from "./configuration.js";
import type {
  SelfBalancingInput,
  SbePerformanceStats,
  SbeRunReport,
  ConnectSelfBalancingEnterpriseInput,
  EngineStatus,
  RunSbeDiagnosticsInput,
} from "./types.js";

export class SelfBalancingEnterpriseController {
  private config: SelfBalancingEnterpriseConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: SbeRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: SbePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    monitoringRuns: 0,
    reallocationsPerformed: 0,
    optimizationsPerformed: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: SelfBalancingEnterpriseManager,
    config: SelfBalancingEnterpriseConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendSbeLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Self-Balancing Enterprise ready — never reallocate protected resources beyond approval policies; structural signals only",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): SelfBalancingEnterpriseConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: SelfBalancingEnterpriseConfiguration): void {
    this.config = config;
  }

  getLatestReport(): SbeRunReport | null {
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

  getPerformance(): SbePerformanceStats {
    return { ...this.performance };
  }

  connectSelfBalancingEnterprise(
    input: ConnectSelfBalancingEnterpriseInput = {},
  ): SbeRunReport {
    if (!this.config.enabled) throw new Error("Self-Balancing Enterprise is disabled");
    this.status = "connecting";
    const report = this.manager.connectSelfBalancingEnterprise(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorEnterpriseResourceUtilization(input: SelfBalancingInput = {}): SbeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorEnterpriseResourceUtilization(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorOperationalBalance(input: SelfBalancingInput = {}): SbeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorOperationalBalance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorFinancialBalance(input: SelfBalancingInput = {}): SbeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorFinancialBalance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorWorkforceBalance(input: SelfBalancingInput = {}): SbeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorWorkforceBalance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorSupplierBalance(input: SelfBalancingInput = {}): SbeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorSupplierBalance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorInfrastructureBalance(input: SelfBalancingInput = {}): SbeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorInfrastructureBalance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectResourceImbalances(input: SelfBalancingInput = {}): SbeRunReport {
    this.status = "evaluating";
    const report = this.manager.detectResourceImbalances(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  reallocateResourcesPerPolicy(input: SelfBalancingInput = {}): SbeRunReport {
    this.status = "reallocating";
    const report = this.manager.reallocateResourcesPerPolicy(input, this.config);
    if (report.validation.decision !== "fail") this.performance.reallocationsPerformed += 1;
    this.finalizeOperation(report);
    return report;
  }

  optimizeEnterpriseEquilibrium(input: SelfBalancingInput = {}): SbeRunReport {
    this.status = "optimizing";
    const report = this.manager.optimizeEnterpriseEquilibrium(input, this.config);
    if (report.validation.decision !== "fail") this.performance.optimizationsPerformed += 1;
    this.finalizeOperation(report);
    return report;
  }

  recommendBalancingActions(input: SelfBalancingInput = {}): SbeRunReport {
    this.status = "recommending";
    const report = this.manager.recommendBalancingActions(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunSbeDiagnosticsInput = {}): SbeRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: SbeRunReport): void {
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
    appendSbeLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
