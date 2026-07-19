/** R2-13 — Return Management Controller. */

import { appendRmLog } from "./rm-logging.js";
import { ReturnManagementManager } from "./return-management-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ReturnManagementConfiguration } from "./configuration.js";
import type {
  CreateReturnRequestInput,
  EngineStatus,
  ReceiveCustomerReturnRequestInput,
  ReturnPerformanceStats,
  ReturnReport,
  TrackReturnLifecycleInput,
} from "./types.js";

export class ReturnManagementController {
  private config: ReturnManagementConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ReturnReport | null = null;
  private readonly manager: ReturnManagementManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ReturnPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    returnRequestsCreated: 0,
    returnsAuthorized: 0,
    labelsGenerated: 0,
    returnsCompleted: 0,
    returnFailures: 0,
    invalidRecordsDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: ReturnManagementManager, config: ReturnManagementConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendRmLog({
      event: "engine_initialization",
      level: "info",
      details: "Return Management ready (R2-13)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ReturnManagementConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ReturnManagementConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ReturnReport | null {
    return this.latestReport;
  }

  getManager(): ReturnManagementManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): ReturnPerformanceStats {
    return { ...this.performance };
  }

  createReturnRequest(input: CreateReturnRequestInput = {}): ReturnReport {
    if (!this.config.enabled) throw new Error("Return Management is disabled");
    this.status = "processing";
    appendRmLog({ event: "return_start", level: "info", details: "createReturnRequest started" });
    const report = this.manager.createReturnRequest(input, this.config);
    this.recordReturnMetrics(report);
    this.finalizeOperation(report, "create");
    return report;
  }

  receiveCustomerReturnRequest(input: ReceiveCustomerReturnRequestInput): ReturnReport {
    const report = this.manager.receiveCustomerReturnRequest(input, this.config);
    this.recordReturnMetrics(report);
    this.finalizeOperation(report, "customer_request");
    return report;
  }

  trackReturnLifecycle(input: TrackReturnLifecycleInput): ReturnReport {
    const report = this.manager.trackReturnLifecycle(input, this.config);
    this.recordReturnMetrics(report);
    this.finalizeOperation(report, "track");
    return report;
  }

  private recordReturnMetrics(report: ReturnReport): void {
    this.performance.returnRequestsCreated += report.records.length;
    this.performance.returnsAuthorized += report.records.filter(
      (r) => r.returnAuthorizationStatus === "authorized",
    ).length;
    this.performance.labelsGenerated += report.records.filter((r) => r.returnLabelReference).length;
    this.performance.returnsCompleted += report.records.filter(
      (r) => r.returnCompletionStatus === "completed",
    ).length;
    this.performance.returnFailures += report.failures.length;
    this.performance.invalidRecordsDetected += report.invalidRecords.length;
  }

  private finalizeOperation(report: ReturnReport, action: string): void {
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
      this.status = "active";
    }

    this.performance.averageOperationDurationMs = Math.round(
      (this.performance.averageOperationDurationMs * (this.performance.totalOperations - 1) + duration) /
        this.performance.totalOperations,
    );
    if (duration > this.performance.peakOperationDurationMs) {
      this.performance.peakOperationDurationMs = duration;
    }

    this.healthMonitor.recordOperation(
      report.validation.decision,
      report.failures,
      report.invalidRecords,
      report.records.filter((r) => r.returnAuthorizationStatus === "authorized").length,
      report.records.filter((r) => r.returnCompletionStatus === "completed").length,
    );
    appendRmLog({
      event: "return_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
