/** X3-07 — Financial Scale Engine orchestration controller. */

import { appendFseLog } from "./fse-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { FinancialScaleManager } from "./financial-scale-manager.js";
import type { FinancialScaleEngineConfiguration } from "./configuration.js";
import type {
  ConnectFinancialScaleEngineInput,
  EngineStatus,
  FinancialScaleInput,
  FsePerformanceStats,
  FseRunReport,
  RunFseDiagnosticsInput,
} from "./types.js";

export class FinancialScaleController {
  private config: FinancialScaleEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: FseRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: FsePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    monitoringRuns: 0,
    capitalShortagesDetected: 0,
    bottlenecksDetected: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: FinancialScaleManager,
    config: FinancialScaleEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendFseLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Financial Scale Engine ready — never recommend scaling without validated financial readiness; structural signals only",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): FinancialScaleEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: FinancialScaleEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): FseRunReport | null {
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

  getPerformance(): FsePerformanceStats {
    return { ...this.performance };
  }

  connectFinancialScaleEngine(
    input: ConnectFinancialScaleEngineInput = {},
  ): FseRunReport {
    if (!this.config.enabled) throw new Error("Financial Scale Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectFinancialScaleEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorCapitalRequirements(input: FinancialScaleInput = {}): FseRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorCapitalRequirements(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorCashFlowReadiness(input: FinancialScaleInput = {}): FseRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorCashFlowReadiness(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorProfitability(input: FinancialScaleInput = {}): FseRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorProfitability(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorWorkingCapital(input: FinancialScaleInput = {}): FseRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorWorkingCapital(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorOperatingExpenses(input: FinancialScaleInput = {}): FseRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorOperatingExpenses(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorInvestmentEfficiency(input: FinancialScaleInput = {}): FseRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorInvestmentEfficiency(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectFinancialBottlenecks(input: FinancialScaleInput = {}): FseRunReport {
    this.status = "detecting";
    const report = this.manager.detectFinancialBottlenecks(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.bottlenecksDetected += report.scalingRecords.filter((r) =>
        /bottleneck|critical/i.test(r.recommendationSummary),
      ).length;
    }
    this.finalizeOperation(report);
    return report;
  }

  detectCapitalShortages(input: FinancialScaleInput = {}): FseRunReport {
    this.status = "detecting";
    const report = this.manager.detectCapitalShortages(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.capitalShortagesDetected += report.scalingRecords.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  recommendFinancialScaling(input: FinancialScaleInput = {}): FseRunReport {
    this.status = "recommending";
    const report = this.manager.recommendFinancialScaling(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunFseDiagnosticsInput = {}): FseRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: FseRunReport): void {
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
    appendFseLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
