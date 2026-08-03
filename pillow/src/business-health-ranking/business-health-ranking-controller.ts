/** X2-09 — Business Health Ranking orchestration controller. */

import { appendBhrLog } from "./bhr-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { BusinessHealthRankingManager } from "./business-health-ranking-manager.js";
import type { BusinessHealthRankingConfiguration } from "./configuration.js";
import type {
  BusinessHealthRunReport,
  ConnectBusinessHealthRankingInput,
  DetectDecliningInput,
  DetectHighPerformingInput,
  EngineStatus,
  GeneratePrioritiesInput,
  MeasureBusinessHealthInput,
  RankCompaniesInput,
  RankingPerformanceStats,
  RunRankingDiagnosticsInput,
} from "./types.js";

export class BusinessHealthRankingController {
  private config: BusinessHealthRankingConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: BusinessHealthRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: RankingPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    healthCalculations: 0,
    rankingRuns: 0,
    prioritiesGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: BusinessHealthRankingManager,
    config: BusinessHealthRankingConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendBhrLog({
      event: "framework_initialized",
      level: "info",
      details: "Business Health Ranking ready",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): BusinessHealthRankingConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: BusinessHealthRankingConfiguration): void {
    this.config = config;
  }

  getLatestReport(): BusinessHealthRunReport | null {
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

  getPerformance(): RankingPerformanceStats {
    return { ...this.performance };
  }

  connectBusinessHealthRanking(
    input: ConnectBusinessHealthRankingInput = {},
  ): BusinessHealthRunReport {
    if (!this.config.enabled) throw new Error("Business Health Ranking is disabled");
    this.status = "connecting";
    const report = this.manager.connectBusinessHealthRanking(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  measureBusinessHealth(input: MeasureBusinessHealthInput = {}): BusinessHealthRunReport {
    this.status = "scoring";
    const report = this.manager.measureBusinessHealth(input, this.config);
    if (report.validation.decision !== "fail") this.performance.healthCalculations += 1;
    this.finalizeOperation(report);
    return report;
  }

  rankCompanies(input: RankCompaniesInput = {}): BusinessHealthRunReport {
    this.status = "ranking";
    const report = this.manager.rankCompanies(input, this.config);
    if (report.validation.decision !== "fail") this.performance.rankingRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectDeclining(input: DetectDecliningInput = {}): BusinessHealthRunReport {
    this.status = "ranking";
    const report = this.manager.detectDeclining(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectHighPerforming(input: DetectHighPerformingInput = {}): BusinessHealthRunReport {
    this.status = "ranking";
    const report = this.manager.detectHighPerforming(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generatePriorities(input: GeneratePrioritiesInput = {}): BusinessHealthRunReport {
    const report = this.manager.generatePriorities(input, this.config);
    this.performance.prioritiesGenerated += report.recommendations.length;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunRankingDiagnosticsInput = {}): BusinessHealthRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: BusinessHealthRunReport): void {
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
    appendBhrLog({
      event: "ranking_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
