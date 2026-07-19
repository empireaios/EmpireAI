/** R2-19 — Procurement Intelligence Controller. */

import { appendPiLog } from "./pi-logging.js";
import { ProcurementIntelligenceManager } from "./procurement-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ProcurementIntelligenceConfiguration } from "./configuration.js";
import type {
  AnalyzeProcurementInput,
  EngineStatus,
  ProcurementIntelligencePerformanceStats,
  ProcurementIntelligenceReport,
} from "./types.js";

export class ProcurementIntelligenceController {
  private config: ProcurementIntelligenceConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ProcurementIntelligenceReport | null = null;
  private readonly manager: ProcurementIntelligenceManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ProcurementIntelligencePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    analyzeRuns: 0,
    procurementsAnalyzed: 0,
    supplierEvaluations: 0,
    recommendationsGenerated: 0,
    anomaliesDetected: 0,
    costsOptimized: 0,
    analysisFailures: 0,
    invalidRecordsDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: ProcurementIntelligenceManager, config: ProcurementIntelligenceConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendPiLog({
      event: "engine_initialization",
      level: "info",
      details: "Procurement Intelligence ready (R2-19)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ProcurementIntelligenceConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ProcurementIntelligenceConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ProcurementIntelligenceReport | null {
    return this.latestReport;
  }

  getManager(): ProcurementIntelligenceManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): ProcurementIntelligencePerformanceStats {
    return { ...this.performance };
  }

  analyzeProcurement(input: AnalyzeProcurementInput = {}): ProcurementIntelligenceReport {
    if (!this.config.enabled) throw new Error("Procurement Intelligence is disabled");
    this.status = "analyzing";
    this.performance.analyzeRuns += 1;
    appendPiLog({ event: "analyze_start", level: "info", details: "analyzeProcurement started" });
    const report = this.manager.analyzeProcurement(input, this.config);
    this.recordIntelligenceMetrics(report);
    this.finalizeOperation(report, "analyze");
    return report;
  }

  private recordIntelligenceMetrics(report: ProcurementIntelligenceReport): void {
    this.performance.procurementsAnalyzed += report.records.length;
    this.performance.supplierEvaluations += report.records.length;
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.performance.anomaliesDetected += report.anomalies.length;
    this.performance.analysisFailures += report.failures.length;
    this.performance.invalidRecordsDetected += report.invalidRecords.length;
    this.performance.costsOptimized += report.recommendations.reduce((s, r) => s + r.estimatedSavings, 0);
  }

  private finalizeOperation(report: ProcurementIntelligenceReport, action: string): void {
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
      report.anomalies.length,
      report.recommendations.length,
    );
    appendPiLog({
      event: "analyze_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
