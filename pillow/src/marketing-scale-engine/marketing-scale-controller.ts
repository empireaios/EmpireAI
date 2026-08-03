/** X3-05 — Marketing Scale Engine orchestration controller. */

import { appendMseLog } from "./mse-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { MarketingScaleManager } from "./marketing-scale-manager.js";
import type { MarketingScaleEngineConfiguration } from "./configuration.js";
import type {
  ConnectMarketingScaleEngineInput,
  EngineStatus,
  MarketingScaleInput,
  MsePerformanceStats,
  MseRunReport,
  RunMseDiagnosticsInput,
} from "./types.js";

export class MarketingScaleController {
  private config: MarketingScaleEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: MseRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: MsePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    monitoringRuns: 0,
    scalableCampaignsDetected: 0,
    bottlenecksDetected: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: MarketingScaleManager,
    config: MarketingScaleEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendMseLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Marketing Scale Engine ready — never recommend marketing expansion without validated performance; structural signals only",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): MarketingScaleEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: MarketingScaleEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): MseRunReport | null {
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

  getPerformance(): MsePerformanceStats {
    return { ...this.performance };
  }

  connectMarketingScaleEngine(
    input: ConnectMarketingScaleEngineInput = {},
  ): MseRunReport {
    if (!this.config.enabled) throw new Error("Marketing Scale Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectMarketingScaleEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorMarketingPerformance(input: MarketingScaleInput = {}): MseRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorMarketingPerformance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorCampaignScalability(input: MarketingScaleInput = {}): MseRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorCampaignScalability(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorCustomerAcquisitionCost(input: MarketingScaleInput = {}): MseRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorCustomerAcquisitionCost(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorReturnOnAdvertisingSpend(input: MarketingScaleInput = {}): MseRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorReturnOnAdvertisingSpend(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorConversionPerformance(input: MarketingScaleInput = {}): MseRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorConversionPerformance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorChannelPerformance(input: MarketingScaleInput = {}): MseRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorChannelPerformance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectScalableCampaigns(input: MarketingScaleInput = {}): MseRunReport {
    this.status = "detecting";
    const report = this.manager.detectScalableCampaigns(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.scalableCampaignsDetected += report.scalingRecords.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  detectMarketingBottlenecks(input: MarketingScaleInput = {}): MseRunReport {
    this.status = "detecting";
    const report = this.manager.detectMarketingBottlenecks(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.bottlenecksDetected += report.scalingRecords.filter((r) =>
        /bottleneck|critical/i.test(r.recommendationSummary),
      ).length;
    }
    this.finalizeOperation(report);
    return report;
  }

  recommendMarketingScaling(input: MarketingScaleInput = {}): MseRunReport {
    this.status = "recommending";
    const report = this.manager.recommendMarketingScaling(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunMseDiagnosticsInput = {}): MseRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: MseRunReport): void {
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
    appendMseLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
