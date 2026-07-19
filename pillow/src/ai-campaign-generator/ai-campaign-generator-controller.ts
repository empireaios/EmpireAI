/** R5-12 — AI Campaign Generator Controller. */

import { appendAcgLog } from "./acg-logging.js";
import { AiCampaignGeneratorManager } from "./ai-campaign-generator-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { AiCampaignGeneratorConfiguration } from "./configuration.js";
import type {
  AiCampaignPerformanceStats,
  AiCampaignRunReport,
  ConnectAiCampaignGeneratorInput,
  EngineStatus,
  GenerateCampaignInput,
  GenerateStrategyInput,
  RecommendInput,
} from "./types.js";

export class AiCampaignGeneratorController {
  private config: AiCampaignGeneratorConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: AiCampaignRunReport | null = null;
  private readonly manager: AiCampaignGeneratorManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: AiCampaignPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    campaignsGenerated: 0,
    strategiesGenerated: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: AiCampaignGeneratorManager, config: AiCampaignGeneratorConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendAcgLog({
      event: "engine_initialization",
      level: "info",
      details: "AI Campaign Generator ready (R5-12)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): AiCampaignGeneratorConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: AiCampaignGeneratorConfiguration): void {
    this.config = config;
  }

  getLatestReport(): AiCampaignRunReport | null {
    return this.latestReport;
  }

  getManager(): AiCampaignGeneratorManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): AiCampaignPerformanceStats {
    return { ...this.performance };
  }

  connectAiCampaignGenerator(input: ConnectAiCampaignGeneratorInput = {}): AiCampaignRunReport {
    if (!this.config.enabled) throw new Error("AI Campaign Generator is disabled");
    this.status = "connecting";
    const report = this.manager.connectAiCampaignGenerator(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateCampaign(input: GenerateCampaignInput = {}): AiCampaignRunReport {
    this.status = "generating";
    this.performance.campaignsGenerated += 1;
    const report = this.manager.generateCampaign(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateStrategy(input: GenerateStrategyInput = {}): AiCampaignRunReport {
    this.status = "generating";
    this.performance.strategiesGenerated += 1;
    const report = this.manager.generateStrategy(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateObjective(input: GenerateStrategyInput = {}): AiCampaignRunReport {
    this.performance.strategiesGenerated += 1;
    const report = this.manager.generateObjective(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  recommendChannels(input: RecommendInput = {}): AiCampaignRunReport {
    this.performance.recommendationsGenerated += 1;
    const report = this.manager.recommendChannels(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  recommendAudience(input: RecommendInput = {}): AiCampaignRunReport {
    this.performance.recommendationsGenerated += 1;
    const report = this.manager.recommendAudience(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  recommendBudget(input: RecommendInput = {}): AiCampaignRunReport {
    this.performance.recommendationsGenerated += 1;
    const report = this.manager.recommendBudget(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  recommendSchedule(input: RecommendInput = {}): AiCampaignRunReport {
    this.performance.recommendationsGenerated += 1;
    const report = this.manager.recommendSchedule(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  recommendKeywords(input: RecommendInput = {}): AiCampaignRunReport {
    this.performance.recommendationsGenerated += 1;
    const report = this.manager.recommendKeywords(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  recommendCreatives(input: RecommendInput = {}): AiCampaignRunReport {
    this.performance.recommendationsGenerated += 1;
    const report = this.manager.recommendCreatives(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateSummary(input: RecommendInput = {}): AiCampaignRunReport {
    const report = this.manager.generateSummary(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: AiCampaignRunReport): void {
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
    appendAcgLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
