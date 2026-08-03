/** X3-08 — Workforce Intelligence orchestration controller. */

import { appendWfiLog } from "./wfi-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { WorkforceIntelligenceManager } from "./workforce-intelligence-manager.js";
import type { WorkforceIntelligenceConfiguration } from "./configuration.js";
import type {
  ConnectWorkforceIntelligenceInput,
  EngineStatus,
  WorkforceIntelligenceInput,
  WfiPerformanceStats,
  WfiRunReport,
  RunWfiDiagnosticsInput,
} from "./types.js";

export class WorkforceIntelligenceController {
  private config: WorkforceIntelligenceConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: WfiRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: WfiPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    monitoringRuns: 0,
    underutilizedAgentsDetected: 0,
    bottlenecksDetected: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: WorkforceIntelligenceManager,
    config: WorkforceIntelligenceConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendWfiLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Workforce Intelligence ready — never overload workforce beyond validated limits; structural signals only",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): WorkforceIntelligenceConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: WorkforceIntelligenceConfiguration): void {
    this.config = config;
  }

  getLatestReport(): WfiRunReport | null {
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

  getPerformance(): WfiPerformanceStats {
    return { ...this.performance };
  }

  connectWorkforceIntelligence(
    input: ConnectWorkforceIntelligenceInput = {},
  ): WfiRunReport {
    if (!this.config.enabled) throw new Error("Workforce Intelligence is disabled");
    this.status = "connecting";
    const report = this.manager.connectWorkforceIntelligence(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorWorkforceCapacity(input: WorkforceIntelligenceInput = {}): WfiRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorWorkforceCapacity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorAgentUtilization(input: WorkforceIntelligenceInput = {}): WfiRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorAgentUtilization(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorWorkloadDistribution(input: WorkforceIntelligenceInput = {}): WfiRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorWorkloadDistribution(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorExecutionThroughput(input: WorkforceIntelligenceInput = {}): WfiRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorExecutionThroughput(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorTaskCompletion(input: WorkforceIntelligenceInput = {}): WfiRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorTaskCompletion(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorWorkforceEfficiency(input: WorkforceIntelligenceInput = {}): WfiRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorWorkforceEfficiency(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectWorkforceBottlenecks(input: WorkforceIntelligenceInput = {}): WfiRunReport {
    this.status = "detecting";
    const report = this.manager.detectWorkforceBottlenecks(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.bottlenecksDetected += report.workforceRecords.filter((r) =>
        /bottleneck|critical|overload/i.test(r.recommendationSummary),
      ).length;
    }
    this.finalizeOperation(report);
    return report;
  }

  detectUnderutilizedAgents(input: WorkforceIntelligenceInput = {}): WfiRunReport {
    this.status = "detecting";
    const report = this.manager.detectUnderutilizedAgents(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.underutilizedAgentsDetected += report.workforceRecords.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  recommendWorkforceOptimization(input: WorkforceIntelligenceInput = {}): WfiRunReport {
    this.status = "recommending";
    const report = this.manager.recommendWorkforceOptimization(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunWfiDiagnosticsInput = {}): WfiRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: WfiRunReport): void {
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
    appendWfiLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
