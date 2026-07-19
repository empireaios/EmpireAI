/** R5-09 — Attribution Engine Controller. */

import { appendAttLog } from "./att-logging.js";
import { AttributionManager } from "./attribution-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { AttributionEngineConfiguration } from "./configuration.js";
import type {
  AttributeInput,
  AttributionPerformanceStats,
  AttributionRunReport,
  CalculateRoiInput,
  ConnectAttributionEngineInput,
  EngineStatus,
  MeasureContributionInput,
  TrackAcquisitionSourceInput,
  TrackConversionJourneyInput,
  TrackTouchpointInput,
} from "./types.js";

export class AttributionEngineController {
  private config: AttributionEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: AttributionRunReport | null = null;
  private readonly manager: AttributionManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: AttributionPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    touchpointsTracked: 0,
    attributionsCalculated: 0,
    roiCalculations: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: AttributionManager, config: AttributionEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendAttLog({
      event: "engine_initialization",
      level: "info",
      details: "Attribution Engine ready (R5-09)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): AttributionEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: AttributionEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): AttributionRunReport | null {
    return this.latestReport;
  }

  getManager(): AttributionManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): AttributionPerformanceStats {
    return { ...this.performance };
  }

  connectAttributionEngine(input: ConnectAttributionEngineInput = {}): AttributionRunReport {
    if (!this.config.enabled) throw new Error("Attribution Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectAttributionEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  trackAcquisitionSource(input: TrackAcquisitionSourceInput): AttributionRunReport {
    this.performance.touchpointsTracked += 1;
    const report = this.manager.trackAcquisitionSource(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  trackTouchpoint(input: TrackTouchpointInput): AttributionRunReport {
    this.performance.touchpointsTracked += 1;
    const report = this.manager.trackTouchpoint(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  trackConversionJourney(input: TrackConversionJourneyInput): AttributionRunReport {
    this.status = "attributing";
    this.performance.attributionsCalculated += 1;
    const report = this.manager.trackConversionJourney(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  attribute(input: AttributeInput): AttributionRunReport {
    this.status = "attributing";
    this.performance.attributionsCalculated += 1;
    const report = this.manager.attribute(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  measureCampaignContribution(input: MeasureContributionInput = {}): AttributionRunReport {
    const report = this.manager.measureCampaignContribution(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  measureChannelContribution(input: MeasureContributionInput = {}): AttributionRunReport {
    const report = this.manager.measureChannelContribution(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  measureAdvertisementContribution(input: MeasureContributionInput = {}): AttributionRunReport {
    const report = this.manager.measureAdvertisementContribution(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  calculateRoas(input: CalculateRoiInput = {}): AttributionRunReport {
    this.performance.roiCalculations += 1;
    const report = this.manager.calculateRoas(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  calculateMarketingRoi(input: CalculateRoiInput = {}): AttributionRunReport {
    this.performance.roiCalculations += 1;
    const report = this.manager.calculateMarketingRoi(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: AttributionRunReport): void {
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
    appendAttLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
