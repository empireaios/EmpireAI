/** R4-16 — Customer Segmentation Controller. */

import { appendCsegLog } from "./cseg-logging.js";
import { CustomerSegmentationManager } from "./customer-segmentation-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { CustomerSegmentationEngineConfiguration } from "./configuration.js";
import type {
  AssignCustomerToSegmentsInput,
  ConnectSegmentationEngineInput,
  CreateCustomerSegmentInput,
  DetectSegmentChangesInput,
  DetectSegmentationFailuresInput,
  EngineStatus,
  SegmentationPerformanceStats,
  SegmentationRunReport,
  SegmentCustomerInput,
} from "./types.js";

export class CustomerSegmentationController {
  private config: CustomerSegmentationEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: SegmentationRunReport | null = null;
  private readonly manager: CustomerSegmentationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: SegmentationPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    segmentsCreated: 0,
    assignmentsPerformed: 0,
    demographicSegmentations: 0,
    purchasingSegmentations: 0,
    valueSegmentations: 0,
    loyaltySegmentations: 0,
    sentimentSegmentations: 0,
    riskSegmentations: 0,
    changesDetected: 0,
    failuresDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: CustomerSegmentationManager,
    config: CustomerSegmentationEngineConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCsegLog({
      event: "engine_initialization",
      level: "info",
      details: "Customer Segmentation Engine ready (R4-16)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CustomerSegmentationEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CustomerSegmentationEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): SegmentationRunReport | null {
    return this.latestReport;
  }

  getManager(): CustomerSegmentationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): SegmentationPerformanceStats {
    return { ...this.performance };
  }

  connectSegmentationEngine(input: ConnectSegmentationEngineInput = {}): SegmentationRunReport {
    if (!this.config.enabled) throw new Error("Customer Segmentation Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectSegmentationEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  createCustomerSegment(input: CreateCustomerSegmentInput): SegmentationRunReport {
    this.performance.segmentsCreated += 1;
    const report = this.manager.createCustomerSegment(input, this.config);
    this.finalizeOperation(report, "create_segment");
    return report;
  }

  assignCustomerToSegments(input: AssignCustomerToSegmentsInput): SegmentationRunReport {
    this.performance.assignmentsPerformed += 1;
    const report = this.manager.assignCustomerToSegments(input, this.config);
    this.finalizeOperation(report, "assign_segments");
    return report;
  }

  segmentByDemographics(input: SegmentCustomerInput): SegmentationRunReport {
    this.performance.demographicSegmentations += 1;
    const report = this.manager.segmentByDemographics(input, this.config);
    this.finalizeOperation(report, "segment_demographics");
    return report;
  }

  segmentByPurchasingBehaviour(input: SegmentCustomerInput): SegmentationRunReport {
    this.performance.purchasingSegmentations += 1;
    const report = this.manager.segmentByPurchasingBehaviour(input, this.config);
    this.finalizeOperation(report, "segment_purchasing");
    return report;
  }

  segmentByCustomerValue(input: SegmentCustomerInput): SegmentationRunReport {
    this.performance.valueSegmentations += 1;
    const report = this.manager.segmentByCustomerValue(input, this.config);
    this.finalizeOperation(report, "segment_value");
    return report;
  }

  segmentByLoyaltyStatus(input: SegmentCustomerInput): SegmentationRunReport {
    this.performance.loyaltySegmentations += 1;
    const report = this.manager.segmentByLoyaltyStatus(input, this.config);
    this.finalizeOperation(report, "segment_loyalty");
    return report;
  }

  segmentByCustomerSentiment(input: SegmentCustomerInput): SegmentationRunReport {
    this.performance.sentimentSegmentations += 1;
    const report = this.manager.segmentByCustomerSentiment(input, this.config);
    this.finalizeOperation(report, "segment_sentiment");
    return report;
  }

  segmentByCustomerRisk(input: SegmentCustomerInput): SegmentationRunReport {
    this.performance.riskSegmentations += 1;
    const report = this.manager.segmentByCustomerRisk(input, this.config);
    this.finalizeOperation(report, "segment_risk");
    return report;
  }

  detectSegmentChanges(input: DetectSegmentChangesInput = {}): SegmentationRunReport {
    const report = this.manager.detectSegmentChanges(input, this.config);
    this.performance.changesDetected += report.segmentChanges.length;
    this.finalizeOperation(report, "detect_changes");
    return report;
  }

  detectSegmentationFailures(input: DetectSegmentationFailuresInput = {}): SegmentationRunReport {
    const report = this.manager.detectSegmentationFailures(input, this.config);
    this.performance.failuresDetected += report.failures.length;
    this.finalizeOperation(report, "detect_failures");
    return report;
  }

  reportSegmentationStatus(): SegmentationRunReport {
    const report = this.manager.reportSegmentationStatus(this.config);
    this.finalizeOperation(report, "report_status");
    return report;
  }

  reportSegmentationHealth(): SegmentationRunReport {
    const report = this.manager.reportSegmentationHealth(this.config);
    this.finalizeOperation(report, "report_health");
    return report;
  }

  private finalizeOperation(report: SegmentationRunReport, action: string): void {
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
    appendCsegLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
