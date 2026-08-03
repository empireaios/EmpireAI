/** X3-10 — Bottleneck Intelligence orchestration controller. */

import { appendBniLog } from "./bni-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { BottleneckIntelligenceManager } from "./bottleneck-intelligence-manager.js";
import type { BottleneckIntelligenceConfiguration } from "./configuration.js";
import type {
  BottleneckIntelligenceInput,
  BniPerformanceStats,
  BniRunReport,
  ConnectBottleneckIntelligenceInput,
  EngineStatus,
  RunBniDiagnosticsInput,
} from "./types.js";

export class BottleneckIntelligenceController {
  private config: BottleneckIntelligenceConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: BniRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: BniPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    monitoringRuns: 0,
    throughputConstraintsDetected: 0,
    bottlenecksRanked: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: BottleneckIntelligenceManager,
    config: BottleneckIntelligenceConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendBniLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Bottleneck Intelligence ready — never generate unsupported bottleneck conclusions; structural signals only",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): BottleneckIntelligenceConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: BottleneckIntelligenceConfiguration): void {
    this.config = config;
  }

  getLatestReport(): BniRunReport | null {
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

  getPerformance(): BniPerformanceStats {
    return { ...this.performance };
  }

  connectBottleneckIntelligence(
    input: ConnectBottleneckIntelligenceInput = {},
  ): BniRunReport {
    if (!this.config.enabled) throw new Error("Bottleneck Intelligence is disabled");
    this.status = "connecting";
    const report = this.manager.connectBottleneckIntelligence(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorOperationalBottlenecks(input: BottleneckIntelligenceInput = {}): BniRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorOperationalBottlenecks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorInfrastructureBottlenecks(input: BottleneckIntelligenceInput = {}): BniRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorInfrastructureBottlenecks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorSupplierBottlenecks(input: BottleneckIntelligenceInput = {}): BniRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorSupplierBottlenecks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorMarketingBottlenecks(input: BottleneckIntelligenceInput = {}): BniRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorMarketingBottlenecks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorFinancialBottlenecks(input: BottleneckIntelligenceInput = {}): BniRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorFinancialBottlenecks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorWorkforceBottlenecks(input: BottleneckIntelligenceInput = {}): BniRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorWorkforceBottlenecks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectThroughputConstraints(input: BottleneckIntelligenceInput = {}): BniRunReport {
    this.status = "detecting";
    const report = this.manager.detectThroughputConstraints(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.throughputConstraintsDetected += report.bottleneckRecords.filter((r) =>
        /constraint|hold|watch|high-severity/i.test(r.recommendationSummary),
      ).length;
    }
    this.finalizeOperation(report);
    return report;
  }

  rankBottlenecksByImpact(input: BottleneckIntelligenceInput = {}): BniRunReport {
    this.status = "analyzing";
    const report = this.manager.rankBottlenecksByImpact(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.bottlenecksRanked += report.bottleneckRecords.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  recommendBottleneckResolutions(input: BottleneckIntelligenceInput = {}): BniRunReport {
    this.status = "recommending";
    const report = this.manager.recommendBottleneckResolutions(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunBniDiagnosticsInput = {}): BniRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: BniRunReport): void {
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
    appendBniLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
