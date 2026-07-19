/** R5-14 — Conversion Intelligence Controller. */

import { appendCviLog } from "./cvi-logging.js";
import { ConversionIntelligenceManager } from "./conversion-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ConversionIntelligenceConfiguration } from "./configuration.js";
import type {
  ConnectConversionIntelligenceInput,
  ConversionPerformanceStats,
  ConversionRunReport,
  EngineStatus,
  MeasureConversionInput,
  OptimizeFunnelInput,
  RecommendImprovementsInput,
  TrackFunnelInput,
} from "./types.js";

export class ConversionIntelligenceController {
  private config: ConversionIntelligenceConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ConversionRunReport | null = null;
  private readonly manager: ConversionIntelligenceManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ConversionPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    funnelsTracked: 0,
    optimizationsRun: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: ConversionIntelligenceManager,
    config: ConversionIntelligenceConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCviLog({
      event: "engine_initialization",
      level: "info",
      details: "Conversion Intelligence ready (R5-14)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ConversionIntelligenceConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ConversionIntelligenceConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ConversionRunReport | null {
    return this.latestReport;
  }

  getManager(): ConversionIntelligenceManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): ConversionPerformanceStats {
    return { ...this.performance };
  }

  connectConversionIntelligence(
    input: ConnectConversionIntelligenceInput = {},
  ): ConversionRunReport {
    if (!this.config.enabled) throw new Error("Conversion Intelligence is disabled");
    this.status = "connecting";
    const report = this.manager.connectConversionIntelligence(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  trackFunnel(input: TrackFunnelInput): ConversionRunReport {
    this.status = "analyzing";
    this.performance.funnelsTracked += 1;
    const report = this.manager.trackFunnel(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  trackDropOff(input: MeasureConversionInput = {}): ConversionRunReport {
    const report = this.manager.trackDropOff(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  measureLandingPage(input: MeasureConversionInput = {}): ConversionRunReport {
    const report = this.manager.measureLandingPage(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  measureCampaignConversion(input: MeasureConversionInput = {}): ConversionRunReport {
    const report = this.manager.measureCampaignConversion(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  measureChannelConversion(input: MeasureConversionInput = {}): ConversionRunReport {
    const report = this.manager.measureChannelConversion(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectBottlenecks(input: MeasureConversionInput = {}): ConversionRunReport {
    const report = this.manager.detectBottlenecks(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectAbandonment(input: MeasureConversionInput = {}): ConversionRunReport {
    const report = this.manager.detectAbandonment(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  calculateEfficiency(input: MeasureConversionInput = {}): ConversionRunReport {
    const report = this.manager.calculateEfficiency(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  recommendImprovements(input: RecommendImprovementsInput = {}): ConversionRunReport {
    this.performance.recommendationsGenerated += 1;
    const report = this.manager.recommendImprovements(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  optimizeFunnel(input: OptimizeFunnelInput = {}): ConversionRunReport {
    this.status = "analyzing";
    this.performance.optimizationsRun += 1;
    const report = this.manager.optimizeFunnel(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: ConversionRunReport): void {
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
    appendCviLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
