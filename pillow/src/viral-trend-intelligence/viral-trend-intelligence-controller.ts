/** R5-16 — Viral Trend Intelligence Controller. */

import { appendVtiLog } from "./vti-logging.js";
import { ViralTrendIntelligenceManager } from "./viral-trend-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ViralTrendIntelligenceConfiguration } from "./configuration.js";
import type {
  ConnectViralTrendIntelligenceInput,
  DiscoverTrendsInput,
  EngineStatus,
  MonitorTrendsInput,
  PredictTrendsInput,
  RecommendTrendsInput,
  TrendPerformanceStats,
  TrendRunReport,
} from "./types.js";

export class ViralTrendIntelligenceController {
  private config: ViralTrendIntelligenceConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: TrendRunReport | null = null;
  private readonly manager: ViralTrendIntelligenceManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: TrendPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    discoveriesRun: 0,
    monitoringRuns: 0,
    predictionsGenerated: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: ViralTrendIntelligenceManager,
    config: ViralTrendIntelligenceConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendVtiLog({
      event: "engine_initialization",
      level: "info",
      details: "Viral Trend Intelligence ready (R5-16)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ViralTrendIntelligenceConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ViralTrendIntelligenceConfiguration): void {
    this.config = config;
  }

  getLatestReport(): TrendRunReport | null {
    return this.latestReport;
  }

  getManager(): ViralTrendIntelligenceManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): TrendPerformanceStats {
    return { ...this.performance };
  }

  connectViralTrendIntelligence(
    input: ConnectViralTrendIntelligenceInput = {},
  ): TrendRunReport {
    if (!this.config.enabled) throw new Error("Viral Trend Intelligence is disabled");
    this.status = "connecting";
    const report = this.manager.connectViralTrendIntelligence(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  discoverTrends(input: DiscoverTrendsInput = {}): TrendRunReport {
    this.status = "monitoring";
    this.performance.discoveriesRun += 1;
    const report = this.manager.discoverTrends(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorKeywords(input: MonitorTrendsInput = {}): TrendRunReport {
    this.performance.monitoringRuns += 1;
    const report = this.manager.monitorKeywords(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorHashtags(input: MonitorTrendsInput = {}): TrendRunReport {
    this.performance.monitoringRuns += 1;
    const report = this.manager.monitorHashtags(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorProducts(input: MonitorTrendsInput = {}): TrendRunReport {
    this.performance.monitoringRuns += 1;
    const report = this.manager.monitorProducts(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorContent(input: MonitorTrendsInput = {}): TrendRunReport {
    this.performance.monitoringRuns += 1;
    const report = this.manager.monitorContent(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorCreators(input: MonitorTrendsInput = {}): TrendRunReport {
    this.performance.monitoringRuns += 1;
    const report = this.manager.monitorCreators(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectAcceleration(input: MonitorTrendsInput = {}): TrendRunReport {
    const report = this.manager.detectAcceleration(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectDecline(input: MonitorTrendsInput = {}): TrendRunReport {
    const report = this.manager.detectDecline(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  predictTrends(input: PredictTrendsInput = {}): TrendRunReport {
    this.performance.predictionsGenerated += 1;
    const report = this.manager.predictTrends(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  recommendTrends(input: RecommendTrendsInput = {}): TrendRunReport {
    this.performance.recommendationsGenerated += 1;
    const report = this.manager.recommendTrends(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: TrendRunReport): void {
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
    appendVtiLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
