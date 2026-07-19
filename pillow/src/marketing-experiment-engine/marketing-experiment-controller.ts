/** R5-17 — Marketing Experiment Engine Controller. */

import { appendMeeLog } from "./mee-logging.js";
import { MarketingExperimentManager } from "./marketing-experiment-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { ExperimentAnalyticsEngine } from "./experiment-analytics-engine.js";
import type { MarketingExperimentEngineConfiguration } from "./configuration.js";
import type {
  AnalyzeExperimentInput,
  ArchiveExperimentInput,
  AssignAudienceInput,
  ConnectMarketingExperimentEngineInput,
  CreateExperimentInput,
  EngineStatus,
  ExperimentPerformanceStats,
  ExperimentRunReport,
  ManageExperimentInput,
} from "./types.js";

export class MarketingExperimentController {
  private config: MarketingExperimentEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ExperimentRunReport | null = null;
  private readonly manager: MarketingExperimentManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly analytics = new ExperimentAnalyticsEngine();
  private readonly performance: ExperimentPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    experimentsCreated: 0,
    significanceChecks: 0,
    winnersRecommended: 0,
    archivesRun: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: MarketingExperimentManager,
    config: MarketingExperimentEngineConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendMeeLog({
      event: "engine_initialization",
      level: "info",
      details: "Marketing Experiment Engine ready (R5-17)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): MarketingExperimentEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: MarketingExperimentEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ExperimentRunReport | null {
    return this.latestReport;
  }

  getManager(): MarketingExperimentManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): ExperimentPerformanceStats {
    return { ...this.performance };
  }

  getRunningExperiments(): number {
    return this.analytics.runningCount(this.manager.getExperimentRecords());
  }

  connectMarketingExperimentEngine(
    input: ConnectMarketingExperimentEngineInput = {},
  ): ExperimentRunReport {
    if (!this.config.enabled) throw new Error("Marketing Experiment Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectMarketingExperimentEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  createExperiment(input: CreateExperimentInput = {}): ExperimentRunReport {
    this.status = "experimenting";
    this.performance.experimentsCreated += 1;
    const report = this.manager.createExperiment(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  manageAbTest(input: ManageExperimentInput = {}): ExperimentRunReport {
    this.status = "experimenting";
    const report = this.manager.manageAbTest(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  manageMultivariateTest(input: ManageExperimentInput = {}): ExperimentRunReport {
    this.status = "experimenting";
    const report = this.manager.manageMultivariateTest(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  assignAudience(input: AssignAudienceInput = {}): ExperimentRunReport {
    const report = this.manager.assignAudience(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  measurePerformance(input: AnalyzeExperimentInput = {}): ExperimentRunReport {
    const report = this.manager.measurePerformance(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  compareVariants(input: AnalyzeExperimentInput = {}): ExperimentRunReport {
    const report = this.manager.compareVariants(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectSignificance(input: AnalyzeExperimentInput = {}): ExperimentRunReport {
    this.performance.significanceChecks += 1;
    const report = this.manager.detectSignificance(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  recommendWinner(input: AnalyzeExperimentInput = {}): ExperimentRunReport {
    this.performance.winnersRecommended += 1;
    const report = this.manager.recommendWinner(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  archiveExperiment(input: ArchiveExperimentInput = {}): ExperimentRunReport {
    this.performance.archivesRun += 1;
    const report = this.manager.archiveExperiment(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: ExperimentRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      const recovered = this.recoveryManager.recordFailure(
        `${report.action} failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
      if (recovered) this.performance.retryAttempts += 1;
      this.status = "failed";
    } else {
      this.performance.successfulOperations += 1;
      this.recoveryManager.recordSuccess();
      this.status =
        report.engineRecord.currentOperationalState === "active" ? "active" : "connected";
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
    appendMeeLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
