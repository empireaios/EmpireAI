/** R2-09 — Procurement Controller. */

import { appendPceLog } from "./pce-logging.js";
import { ProcurementManager } from "./procurement-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ProcurementEngineConfiguration } from "./configuration.js";
import type {
  ApproveProcurementInput,
  CreateProcurementRequestInput,
  EngineStatus,
  ProcurementPerformanceStats,
  ProcurementReport,
} from "./types.js";

export class ProcurementController {
  private config: ProcurementEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ProcurementReport | null = null;
  private readonly manager: ProcurementManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ProcurementPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    procurementRequests: 0,
    purchaseOrdersCreated: 0,
    approvalsGranted: 0,
    approvalsRejected: 0,
    supplierSelections: 0,
    procurementFailures: 0,
    invalidRequestsDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: ProcurementManager, config: ProcurementEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendPceLog({
      event: "engine_initialization",
      level: "info",
      details: "Procurement Engine ready (R2-09)",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ProcurementEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ProcurementEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ProcurementReport | null {
    return this.latestReport;
  }

  getManager(): ProcurementManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): ProcurementPerformanceStats {
    return { ...this.performance };
  }

  createProcurementRequest(
    input: CreateProcurementRequestInput = {},
  ): ProcurementReport {
    if (!this.config.enabled) throw new Error("Procurement Engine is disabled");
    this.status = "procuring";
    this.performance.procurementRequests += 1;
    appendPceLog({
      event: "procurement_start",
      level: "info",
      details: "createProcurementRequest started",
    });
    const report = this.manager.createProcurementRequest(input, this.config);
    this.recordProcurementMetrics(report);
    this.finalizeOperation(report, "request");
    return report;
  }

  approveProcurement(input: ApproveProcurementInput): ProcurementReport {
    const report = this.manager.approveProcurement(input, this.config);
    this.recordProcurementMetrics(report);
    this.finalizeOperation(report, "approve");
    return report;
  }

  private recordProcurementMetrics(report: ProcurementReport): void {
    if (report.selection) this.performance.supplierSelections += 1;
    if (report.purchaseOrder) this.performance.purchaseOrdersCreated += 1;
    this.performance.procurementFailures += report.failures.length;
    this.performance.invalidRequestsDetected += report.invalidRequests.length;
    for (const record of report.records) {
      if (record.approvalStatus === "approved" || record.approvalStatus === "auto_approved") {
        this.performance.approvalsGranted += 1;
      }
      if (record.approvalStatus === "rejected") {
        this.performance.approvalsRejected += 1;
      }
    }
  }

  private finalizeOperation(report: ProcurementReport, action: string): void {
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
      (this.performance.averageOperationDurationMs * (this.performance.totalOperations - 1) +
        duration) /
        this.performance.totalOperations,
    );
    if (duration > this.performance.peakOperationDurationMs) {
      this.performance.peakOperationDurationMs = duration;
    }

    this.healthMonitor.recordOperation(
      report.validation.decision,
      report.failures,
      report.invalidRequests,
      report.purchaseOrder !== null,
    );
    appendPceLog({
      event: "procurement_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
