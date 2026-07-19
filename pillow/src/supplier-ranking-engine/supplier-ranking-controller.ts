/** R2-08 — Supplier Ranking Controller. */

import { appendSreLog } from "./sre-logging.js";
import { SupplierRankingManager } from "./supplier-ranking-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { SupplierRankingEngineConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  EvaluateSupplierInput,
  RankSuppliersInput,
  SupplierRankingPerformanceStats,
  SupplierRankingReport,
} from "./types.js";

export class SupplierRankingController {
  private config: SupplierRankingEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: SupplierRankingReport | null = null;
  private readonly manager: SupplierRankingManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: SupplierRankingPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    rankingRuns: 0,
    suppliersRanked: 0,
    highPerformersDetected: 0,
    decliningPerformersDetected: 0,
    invalidRecordsDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: SupplierRankingManager, config: SupplierRankingEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendSreLog({
      event: "engine_initialization",
      level: "info",
      details: "Supplier Ranking Engine ready (R2-08)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): SupplierRankingEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: SupplierRankingEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): SupplierRankingReport | null {
    return this.latestReport;
  }

  getManager(): SupplierRankingManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): SupplierRankingPerformanceStats {
    return { ...this.performance };
  }

  rankSuppliers(input: RankSuppliersInput = {}): SupplierRankingReport {
    if (!this.config.enabled) throw new Error("Supplier Ranking Engine is disabled");
    this.status = "ranking";
    this.performance.rankingRuns += 1;
    appendSreLog({
      event: "ranking_start",
      level: "info",
      details: "rankSuppliers started",
    });
    const report = this.manager.rankSuppliers(input, this.config);
    this.recordRankingMetrics(report);
    this.finalizeOperation(report, "rank");
    return report;
  }

  evaluateSupplier(input: EvaluateSupplierInput): SupplierRankingReport {
    const report = this.manager.evaluateSupplier(input, this.config);
    this.recordRankingMetrics(report);
    this.finalizeOperation(report, "evaluate");
    return report;
  }

  private recordRankingMetrics(report: SupplierRankingReport): void {
    this.performance.suppliersRanked += report.rankings.length;
    this.performance.highPerformersDetected += report.findings.filter(
      (f) => f.findingType === "high_performing",
    ).length;
    this.performance.decliningPerformersDetected += report.findings.filter(
      (f) => f.findingType === "declining",
    ).length;
    this.performance.invalidRecordsDetected += report.invalidRecords.length;
  }

  private finalizeOperation(report: SupplierRankingReport, action: string): void {
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
      (this.performance.averageOperationDurationMs * (this.performance.totalOperations - 1) +
        duration) /
        this.performance.totalOperations,
    );
    if (duration > this.performance.peakOperationDurationMs) {
      this.performance.peakOperationDurationMs = duration;
    }

    this.healthMonitor.recordOperation(
      report.validation.decision,
      report.findings,
      report.invalidRecords,
    );
    appendSreLog({
      event: "ranking_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
