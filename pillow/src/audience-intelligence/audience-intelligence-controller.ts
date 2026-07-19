/** R5-08 — Audience Intelligence Controller. */

import { appendAudLog } from "./aud-logging.js";
import { AudienceIntelligenceManager } from "./audience-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { AudienceIntelligenceConfiguration } from "./configuration.js";
import type {
  AnalyzeAudienceInput,
  AudiencePerformanceStats,
  AudienceRunReport,
  BuildAudienceInput,
  ConnectAudienceIntelligenceInput,
  DetectOverlapInput,
  EngineStatus,
  GenerateAudienceRecommendationsInput,
} from "./types.js";

export class AudienceIntelligenceController {
  private config: AudienceIntelligenceConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: AudienceRunReport | null = null;
  private readonly manager: AudienceIntelligenceManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: AudiencePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    audiencesBuilt: 0,
    analysesRun: 0,
    overlapsDetected: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: AudienceIntelligenceManager, config: AudienceIntelligenceConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendAudLog({
      event: "engine_initialization",
      level: "info",
      details: "Audience Intelligence ready (R5-08)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): AudienceIntelligenceConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: AudienceIntelligenceConfiguration): void {
    this.config = config;
  }

  getLatestReport(): AudienceRunReport | null {
    return this.latestReport;
  }

  getManager(): AudienceIntelligenceManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): AudiencePerformanceStats {
    return { ...this.performance };
  }

  connectAudienceIntelligence(
    input: ConnectAudienceIntelligenceInput = {},
  ): AudienceRunReport {
    if (!this.config.enabled) throw new Error("Audience Intelligence is disabled");
    this.status = "connecting";
    const report = this.manager.connectAudienceIntelligence(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  buildAudience(input: BuildAudienceInput): AudienceRunReport {
    this.performance.audiencesBuilt += 1;
    const report = this.manager.buildAudience(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  analyzeDemographics(input: AnalyzeAudienceInput): AudienceRunReport {
    this.status = "analyzing";
    this.performance.analysesRun += 1;
    const report = this.manager.analyzeDemographics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  analyzeInterests(input: AnalyzeAudienceInput): AudienceRunReport {
    this.performance.analysesRun += 1;
    const report = this.manager.analyzeInterests(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  analyzeBehaviour(input: AnalyzeAudienceInput): AudienceRunReport {
    this.performance.analysesRun += 1;
    const report = this.manager.analyzeBehaviour(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  analyzeIntent(input: AnalyzeAudienceInput): AudienceRunReport {
    this.performance.analysesRun += 1;
    const report = this.manager.analyzeIntent(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  measureEngagement(input: AnalyzeAudienceInput): AudienceRunReport {
    this.performance.analysesRun += 1;
    const report = this.manager.measureEngagement(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  measureQuality(input: AnalyzeAudienceInput): AudienceRunReport {
    this.performance.analysesRun += 1;
    const report = this.manager.measureQuality(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectOverlap(input: DetectOverlapInput = {}): AudienceRunReport {
    this.performance.overlapsDetected += 1;
    const report = this.manager.detectOverlap(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(
    input: GenerateAudienceRecommendationsInput = {},
  ): AudienceRunReport {
    const report = this.manager.generateRecommendations(input, this.config);
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: AudienceRunReport): void {
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
    appendAudLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
