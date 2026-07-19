/** R5-06 — SEO Intelligence Controller. */

import { appendSieLog } from "./sie-logging.js";
import { SeoIntelligenceManager } from "./seo-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { SeoIntelligenceConfiguration } from "./configuration.js";
import type {
  AnalyzePageInput,
  ConnectSeoEngineInput,
  DetectIssuesInput,
  EngineStatus,
  GenerateRecommendationsInput,
  ManageKeywordInput,
  ManageSeoProjectInput,
  MonitorOrganicPerformanceInput,
  OptimizeMetadataInput,
  RecommendInternalLinksInput,
  SeoPerformanceStats,
  SeoRunReport,
  TrackRankingInput,
} from "./types.js";

export class SeoIntelligenceController {
  private config: SeoIntelligenceConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: SeoRunReport | null = null;
  private readonly manager: SeoIntelligenceManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: SeoPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    pagesAnalyzed: 0,
    keywordsTracked: 0,
    rankingsUpdated: 0,
    recommendationsGenerated: 0,
    issuesDetected: 0,
    organicPerformanceChecks: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: SeoIntelligenceManager, config: SeoIntelligenceConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendSieLog({
      event: "engine_initialization",
      level: "info",
      details: "SEO Intelligence Engine ready (R5-06)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): SeoIntelligenceConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: SeoIntelligenceConfiguration): void {
    this.config = config;
  }

  getLatestReport(): SeoRunReport | null {
    return this.latestReport;
  }

  getManager(): SeoIntelligenceManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): SeoPerformanceStats {
    return { ...this.performance };
  }

  connectSeoEngine(input: ConnectSeoEngineInput = {}): SeoRunReport {
    if (!this.config.enabled) throw new Error("SEO Intelligence Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectSeoEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  manageProject(input: ManageSeoProjectInput): SeoRunReport {
    const report = this.manager.manageProject(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  analyzePage(input: AnalyzePageInput): SeoRunReport {
    this.status = "analyzing";
    this.performance.pagesAnalyzed += 1;
    const report = this.manager.analyzePage(input, this.config);
    this.performance.issuesDetected += report.issues.length;
    this.finalizeOperation(report);
    return report;
  }

  manageKeyword(input: ManageKeywordInput): SeoRunReport {
    this.performance.keywordsTracked += 1;
    const report = this.manager.manageKeyword(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  trackRanking(input: TrackRankingInput = {}): SeoRunReport {
    this.performance.rankingsUpdated += 1;
    const report = this.manager.trackRanking(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectIssues(input: DetectIssuesInput = {}): SeoRunReport {
    this.performance.issuesDetected += 1;
    const report = this.manager.detectIssues(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  optimizeMetadata(input: OptimizeMetadataInput): SeoRunReport {
    const report = this.manager.optimizeMetadata(input, this.config);
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.finalizeOperation(report);
    return report;
  }

  recommendInternalLinks(input: RecommendInternalLinksInput): SeoRunReport {
    const report = this.manager.recommendInternalLinks(input, this.config);
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(input: GenerateRecommendationsInput = {}): SeoRunReport {
    const report = this.manager.generateRecommendations(input, this.config);
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.finalizeOperation(report);
    return report;
  }

  monitorOrganicPerformance(input: MonitorOrganicPerformanceInput = {}): SeoRunReport {
    this.performance.organicPerformanceChecks += 1;
    const report = this.manager.monitorOrganicPerformance(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: SeoRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      this.recoveryManager.recordFailure(
        `${report.action} failed: ${report.validation.errors.join("; ")}`,
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
    appendSieLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
