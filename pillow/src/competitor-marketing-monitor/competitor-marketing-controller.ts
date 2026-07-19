/** R5-15 — Competitor Marketing Monitor Controller. */

import { appendCmmLog } from "./cmm-logging.js";
import { CompetitorMarketingManager } from "./competitor-marketing-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { CompetitorMarketingMonitorConfiguration } from "./configuration.js";
import type {
  CompetitorPerformanceStats,
  CompetitorRunReport,
  ConnectCompetitorMarketingMonitorInput,
  DiscoverCompetitorsInput,
  EngineStatus,
  GenerateIntelligenceInput,
  MonitorCompetitorsInput,
} from "./types.js";

export class CompetitorMarketingController {
  private config: CompetitorMarketingMonitorConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: CompetitorRunReport | null = null;
  private readonly manager: CompetitorMarketingManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: CompetitorPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    discoveriesRun: 0,
    monitoringRuns: 0,
    intelligenceGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: CompetitorMarketingManager,
    config: CompetitorMarketingMonitorConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCmmLog({
      event: "engine_initialization",
      level: "info",
      details: "Competitor Marketing Monitor ready (R5-15)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CompetitorMarketingMonitorConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CompetitorMarketingMonitorConfiguration): void {
    this.config = config;
  }

  getLatestReport(): CompetitorRunReport | null {
    return this.latestReport;
  }

  getManager(): CompetitorMarketingManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): CompetitorPerformanceStats {
    return { ...this.performance };
  }

  connectCompetitorMarketingMonitor(
    input: ConnectCompetitorMarketingMonitorInput = {},
  ): CompetitorRunReport {
    if (!this.config.enabled) throw new Error("Competitor Marketing Monitor is disabled");
    this.status = "connecting";
    const report = this.manager.connectCompetitorMarketingMonitor(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  discoverCompetitors(input: DiscoverCompetitorsInput = {}): CompetitorRunReport {
    this.status = "monitoring";
    this.performance.discoveriesRun += 1;
    const report = this.manager.discoverCompetitors(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorCampaigns(input: MonitorCompetitorsInput = {}): CompetitorRunReport {
    this.status = "monitoring";
    this.performance.monitoringRuns += 1;
    const report = this.manager.monitorCampaigns(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorAdvertisements(input: MonitorCompetitorsInput = {}): CompetitorRunReport {
    this.performance.monitoringRuns += 1;
    const report = this.manager.monitorAdvertisements(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorKeywords(input: MonitorCompetitorsInput = {}): CompetitorRunReport {
    this.performance.monitoringRuns += 1;
    const report = this.manager.monitorKeywords(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorSeoRankings(input: MonitorCompetitorsInput = {}): CompetitorRunReport {
    this.performance.monitoringRuns += 1;
    const report = this.manager.monitorSeoRankings(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorLandingPages(input: MonitorCompetitorsInput = {}): CompetitorRunReport {
    this.performance.monitoringRuns += 1;
    const report = this.manager.monitorLandingPages(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorPromotions(input: MonitorCompetitorsInput = {}): CompetitorRunReport {
    this.performance.monitoringRuns += 1;
    const report = this.manager.monitorPromotions(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectStrategyChanges(input: MonitorCompetitorsInput = {}): CompetitorRunReport {
    const report = this.manager.detectStrategyChanges(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectEmergingCompetitors(input: MonitorCompetitorsInput = {}): CompetitorRunReport {
    const report = this.manager.detectEmergingCompetitors(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateCompetitiveIntelligence(input: GenerateIntelligenceInput = {}): CompetitorRunReport {
    this.performance.intelligenceGenerated += 1;
    const report = this.manager.generateCompetitiveIntelligence(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: CompetitorRunReport): void {
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
    appendCmmLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
