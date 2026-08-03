import type { WorkerPerformanceReviewConfiguration } from "./configuration.js";
import { WorkerPerformanceReviewCore } from "./worker-performance-review-core.js";
import type {
  EngineStatus,
  WorkerPerformanceInput,
  WorkerPerformanceRunReport,
} from "./types.js";

export class WorkerPerformanceReviewController {
  private status: EngineStatus = "idle";
  private latestReport: WorkerPerformanceRunReport | null = null;

  constructor(
    private readonly manager: WorkerPerformanceReviewCore,
    private readonly config: WorkerPerformanceReviewConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  getStatus() {
    return this.status;
  }

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return {
      ...this.config,
      performanceMetrics: [...this.config.performanceMetrics],
      performanceRatings: [...this.config.performanceRatings],
      performanceRules: [...this.config.performanceRules],
      seedWorkers: this.config.seedWorkers.map((w) => ({
        ...w,
        metrics: { ...w.metrics },
        neverExecuteWorkerTasks: true as const,
      })),
      seedRecords: this.config.seedRecords.map((r) => ({
        ...r,
        improvementRecommendations: [...r.improvementRecommendations],
        metricScores: { ...r.metricScores },
        trend: { ...r.trend, notes: [...r.trend.notes] },
        neverExecuteWorkerTasks: true as const,
        neverReplaceWorkerMonitoring: true as const,
        neverReplaceWorkforceCertificationMonitor: true as const,
        neverOverridePillow: true as const,
        neverOverrideGrandKing: true as const,
        integratesWithWorkerAssignmentEngine: true as const,
        integratesWithWorkforceCertificationMonitor: true as const,
        integratesWithAdaptiveWorkforceOptimizer: true as const,
        preserveHistoricalPerformance: true as const,
        structuralSignalOnly: true as const,
        maskSensitiveValues: true as const,
      })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  registerWorker(input: WorkerPerformanceInput = {}) {
    this.status = "active";
    return this.finish(this.manager.registerWorker(input, this.config));
  }

  reviewWorker(input: WorkerPerformanceInput = {}) {
    this.status = "reviewing";
    return this.finish(this.manager.reviewWorker(input, this.config));
  }

  reviewActive(input: WorkerPerformanceInput = {}) {
    this.status = "reviewing";
    return this.finish(this.manager.reviewActive(input, this.config));
  }

  analyzeTrends(input: WorkerPerformanceInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.analyzeTrends(input, this.config));
  }

  scoreWorker(input: WorkerPerformanceInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.scoreWorker(input, this.config));
  }

  recommendImprovements(input: WorkerPerformanceInput = {}) {
    this.status = "reviewing";
    return this.finish(this.manager.recommendImprovements(input, this.config));
  }

  produceExecutiveReport(input: WorkerPerformanceInput = {}) {
    this.status = "reviewing";
    return this.finish(this.manager.produceExecutiveReport(input, this.config));
  }

  produce(input: WorkerPerformanceInput = {}) {
    this.status = "active";
    return this.finish(this.manager.produce(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: WorkerPerformanceInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: WorkerPerformanceRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
