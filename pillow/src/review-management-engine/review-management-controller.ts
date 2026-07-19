/** R4-11 — Review Management Controller. */

import { appendRmeLog } from "./rme-logging.js";
import { ReviewManagementManager } from "./review-management-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ReviewManagementEngineConfiguration } from "./configuration.js";
import type {
  ClassifyReviewSentimentInput,
  CollectCustomerReviewInput,
  ConnectReviewManagementEngineInput,
  DetectNegativeReviewsInput,
  DetectPositiveReviewsInput,
  DetectReviewFailuresInput,
  EngineStatus,
  GenerateReputationAlertsInput,
  ImportMarketplaceReviewInput,
  ReviewPerformanceStats,
  ReviewRunReport,
  TrackReviewTrendsInput,
} from "./types.js";

export class ReviewManagementController {
  private config: ReviewManagementEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ReviewRunReport | null = null;
  private readonly manager: ReviewManagementManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ReviewPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    reviewsCollected: 0,
    reviewsImported: 0,
    sentimentsClassified: 0,
    negativeDetected: 0,
    positiveDetected: 0,
    trendsTracked: 0,
    alertsGenerated: 0,
    failuresDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: ReviewManagementManager, config: ReviewManagementEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendRmeLog({
      event: "engine_initialization",
      level: "info",
      details: "Review Management Engine ready (R4-11)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ReviewManagementEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ReviewManagementEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ReviewRunReport | null {
    return this.latestReport;
  }

  getManager(): ReviewManagementManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): ReviewPerformanceStats {
    return { ...this.performance };
  }

  connectReviewManagementEngine(
    input: ConnectReviewManagementEngineInput = {},
  ): ReviewRunReport {
    if (!this.config.enabled) throw new Error("Review Management Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectReviewManagementEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  collectCustomerReview(input: CollectCustomerReviewInput): ReviewRunReport {
    this.performance.reviewsCollected += 1;
    const report = this.manager.collectCustomerReview(input, this.config);
    this.finalizeOperation(report, "collect_review");
    return report;
  }

  importMarketplaceReview(input: ImportMarketplaceReviewInput): ReviewRunReport {
    this.performance.reviewsImported += 1;
    const report = this.manager.importMarketplaceReview(input, this.config);
    this.finalizeOperation(report, "import_marketplace_review");
    return report;
  }

  classifyReviewSentiment(input: ClassifyReviewSentimentInput): ReviewRunReport {
    this.performance.sentimentsClassified += 1;
    const report = this.manager.classifyReviewSentiment(input, this.config);
    this.finalizeOperation(report, "classify_sentiment");
    return report;
  }

  detectNegativeReviews(input: DetectNegativeReviewsInput = {}): ReviewRunReport {
    const report = this.manager.detectNegativeReviews(input, this.config);
    this.performance.negativeDetected += report.reviewRecords.length;
    this.finalizeOperation(report, "detect_negative");
    return report;
  }

  detectPositiveReviews(input: DetectPositiveReviewsInput = {}): ReviewRunReport {
    const report = this.manager.detectPositiveReviews(input, this.config);
    this.performance.positiveDetected += report.reviewRecords.length;
    this.finalizeOperation(report, "detect_positive");
    return report;
  }

  trackReviewTrends(input: TrackReviewTrendsInput = {}): ReviewRunReport {
    const report = this.manager.trackReviewTrends(input, this.config);
    this.performance.trendsTracked += report.trends.length;
    this.finalizeOperation(report, "track_trends");
    return report;
  }

  generateReputationAlerts(input: GenerateReputationAlertsInput = {}): ReviewRunReport {
    const report = this.manager.generateReputationAlerts(input, this.config);
    this.performance.alertsGenerated += report.alerts.length;
    this.finalizeOperation(report, "generate_alerts");
    return report;
  }

  detectReviewFailures(input: DetectReviewFailuresInput = {}): ReviewRunReport {
    const report = this.manager.detectReviewFailures(input, this.config);
    this.performance.failuresDetected += report.failures.length;
    this.finalizeOperation(report, "detect_failures");
    return report;
  }

  reportReviewStatus(): ReviewRunReport {
    const report = this.manager.reportReviewStatus(this.config);
    this.finalizeOperation(report, "report_status");
    return report;
  }

  reportReviewHealth(): ReviewRunReport {
    const report = this.manager.reportReviewHealth(this.config);
    this.finalizeOperation(report, "report_health");
    return report;
  }

  private finalizeOperation(report: ReviewRunReport, action: string): void {
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
    appendRmeLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
