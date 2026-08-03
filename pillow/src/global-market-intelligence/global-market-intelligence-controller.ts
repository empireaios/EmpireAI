/** X4-09 — Global Market Intelligence orchestration controller. */

import { appendGmiLog } from "./gmi-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { GlobalMarketIntelligenceManager } from "./global-market-intelligence-manager.js";
import type { GlobalMarketIntelligenceConfiguration } from "./configuration.js";
import type {
  ConnectGlobalMarketIntelligenceInput,
  EngineStatus,
  GmiPerformanceStats,
  GmiRunReport,
  MarketAnalysisInput,
  RunGmiDiagnosticsInput,
} from "./types.js";

export class GlobalMarketIntelligenceController {
  private config: GlobalMarketIntelligenceConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: GmiRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: GmiPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    marketMonitors: 0,
    trendAnalyses: 0,
    demandMonitors: 0,
    competitorAnalyses: 0,
    productOpportunityOps: 0,
    regionalGrowthOps: 0,
    emergingDetections: 0,
    decliningDetections: 0,
    opportunityRankings: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: GlobalMarketIntelligenceManager,
    config: GlobalMarketIntelligenceConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendGmiLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Global Market Intelligence ready — structural signals only; never recommend with unvalidated intelligence",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): GlobalMarketIntelligenceConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: GlobalMarketIntelligenceConfiguration): void {
    this.config = config;
  }

  getLatestReport(): GmiRunReport | null {
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

  getPerformance(): GmiPerformanceStats {
    return { ...this.performance };
  }

  connectGlobalMarketIntelligence(
    input: ConnectGlobalMarketIntelligenceInput = {},
  ): GmiRunReport {
    if (!this.config.enabled) throw new Error("Global Market Intelligence is disabled");
    this.status = "connecting";
    const report = this.manager.connectGlobalMarketIntelligence(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorInternationalMarkets(input: MarketAnalysisInput = {}): GmiRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorInternationalMarkets(input, this.config);
    if (report.validation.decision !== "fail") this.performance.marketMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorMarketTrends(input: MarketAnalysisInput = {}): GmiRunReport {
    this.status = "analyzing";
    const report = this.manager.monitorMarketTrends(input, this.config);
    if (report.validation.decision !== "fail") this.performance.trendAnalyses += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorCustomerDemand(input: MarketAnalysisInput = {}): GmiRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorCustomerDemand(input, this.config);
    if (report.validation.decision !== "fail") this.performance.demandMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorCompetitorActivity(input: MarketAnalysisInput = {}): GmiRunReport {
    this.status = "analyzing";
    const report = this.manager.monitorCompetitorActivity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.competitorAnalyses += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorProductOpportunities(input: MarketAnalysisInput = {}): GmiRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorProductOpportunities(input, this.config);
    if (report.validation.decision !== "fail") this.performance.productOpportunityOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorRegionalGrowth(input: MarketAnalysisInput = {}): GmiRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorRegionalGrowth(input, this.config);
    if (report.validation.decision !== "fail") this.performance.regionalGrowthOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectEmergingMarkets(input: MarketAnalysisInput = {}): GmiRunReport {
    this.status = "analyzing";
    const report = this.manager.detectEmergingMarkets(input, this.config);
    if (report.validation.decision !== "fail") this.performance.emergingDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectDecliningMarkets(input: MarketAnalysisInput = {}): GmiRunReport {
    this.status = "analyzing";
    const report = this.manager.detectDecliningMarkets(input, this.config);
    if (report.validation.decision !== "fail") this.performance.decliningDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  rankGlobalOpportunities(input: MarketAnalysisInput = {}): GmiRunReport {
    this.status = "ranking";
    const report = this.manager.rankGlobalOpportunities(input, this.config);
    if (report.validation.decision !== "fail") this.performance.opportunityRankings += 1;
    this.finalizeOperation(report);
    return report;
  }

  recommendMarket(input: MarketAnalysisInput = {}): GmiRunReport {
    this.status = "recommending";
    const report = this.manager.recommendMarket(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunGmiDiagnosticsInput = {}): GmiRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: GmiRunReport): void {
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
    appendGmiLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
