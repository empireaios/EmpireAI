/** R3-10 — Refund Engine Controller. */

import { appendRfLog } from "./rf-logging.js";
import { RefundEngineManager } from "./refund-engine-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { RefundEngineConfiguration } from "./configuration.js";
import type {
  ConnectRefundEngineInput,
  CreateRefundRequestInput,
  EngineStatus,
  ProcessFullRefundInput,
  ProcessPartialRefundInput,
  RefundEngineRunReport,
  RefundPerformanceStats,
  ValidateRefundEligibilityInput,
} from "./types.js";

export class RefundEngineController {
  private config: RefundEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: RefundEngineRunReport | null = null;
  private readonly manager: RefundEngineManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: RefundPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    refundRequestsCreated: 0,
    eligibilityValidations: 0,
    fullRefundsProcessed: 0,
    partialRefundsProcessed: 0,
    anomaliesDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: RefundEngineManager, config: RefundEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendRfLog({
      event: "engine_initialization",
      level: "info",
      details: "Refund Engine ready (R3-10)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): RefundEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: RefundEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): RefundEngineRunReport | null {
    return this.latestReport;
  }

  getManager(): RefundEngineManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): RefundPerformanceStats {
    return { ...this.performance };
  }

  connectRefundEngine(input: ConnectRefundEngineInput = {}): RefundEngineRunReport {
    if (!this.config.enabled) throw new Error("Refund Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectRefundEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  createRefundRequest(input: CreateRefundRequestInput): RefundEngineRunReport {
    this.status = "processing";
    this.performance.refundRequestsCreated += 1;
    const report = this.manager.createRefundRequest(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "create_refund_request");
    return report;
  }

  validateRefundEligibility(input: ValidateRefundEligibilityInput): RefundEngineRunReport {
    this.performance.eligibilityValidations += 1;
    const report = this.manager.validateRefundEligibility(input, this.config);
    this.finalizeOperation(report, "validate_eligibility");
    return report;
  }

  processFullRefund(input: ProcessFullRefundInput): RefundEngineRunReport {
    this.status = "processing";
    this.performance.fullRefundsProcessed += 1;
    const report = this.manager.processFullRefund(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "process_full_refund");
    return report;
  }

  processPartialRefund(input: ProcessPartialRefundInput): RefundEngineRunReport {
    this.status = "processing";
    this.performance.partialRefundsProcessed += 1;
    const report = this.manager.processPartialRefund(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "process_partial_refund");
    return report;
  }

  private trackAnomalies(report: RefundEngineRunReport): void {
    if (report.anomalies.length > 0) {
      this.performance.anomaliesDetected += report.anomalies.length;
    }
  }

  private finalizeOperation(report: RefundEngineRunReport, action: string): void {
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
    appendRfLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
