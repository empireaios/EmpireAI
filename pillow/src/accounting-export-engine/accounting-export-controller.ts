/** R3-17 — Accounting Export Controller. */

import { appendAeeLog } from "./aee-logging.js";
import { AccountingExportManager } from "./accounting-export-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { AccountingExportEngineConfiguration } from "./configuration.js";
import type {
  AccountingExportRunReport,
  ConnectAccountingExportEngineInput,
  DetectExportFailuresInput,
  EngineStatus,
  ExportFinancialRecordsInput,
  ExportPerformanceStats,
  PackageExportInput,
  ValidateExportInput,
} from "./types.js";

export class AccountingExportController {
  private config: AccountingExportEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: AccountingExportRunReport | null = null;
  private readonly manager: AccountingExportManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ExportPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    exportsGenerated: 0,
    exportsValidated: 0,
    failuresDetected: 0,
    packagesCreated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: AccountingExportManager, config: AccountingExportEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendAeeLog({
      event: "engine_initialization",
      level: "info",
      details: "Accounting Export Engine ready (R3-17)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): AccountingExportEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: AccountingExportEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): AccountingExportRunReport | null {
    return this.latestReport;
  }

  getManager(): AccountingExportManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): ExportPerformanceStats {
    return { ...this.performance };
  }

  connectAccountingExportEngine(
    input: ConnectAccountingExportEngineInput = {},
  ): AccountingExportRunReport {
    if (!this.config.enabled) throw new Error("Accounting Export Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectAccountingExportEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  exportFinancialRecords(
    input: ExportFinancialRecordsInput = {},
  ): AccountingExportRunReport {
    this.status = "processing";
    this.performance.exportsGenerated += 1;
    const report = this.manager.exportFinancialRecords(input, this.config);
    this.finalizeOperation(report, "export_records");
    return report;
  }

  validateExport(input: ValidateExportInput = {}): AccountingExportRunReport {
    this.performance.exportsValidated += 1;
    const report = this.manager.validateExport(input, this.config);
    this.finalizeOperation(report, "validate_export");
    return report;
  }

  detectExportFailures(
    input: DetectExportFailuresInput = {},
  ): AccountingExportRunReport {
    const report = this.manager.detectExportFailures(input, this.config);
    if (report.failures.length > 0) {
      this.performance.failuresDetected += report.failures.length;
    }
    this.finalizeOperation(report, "detect_failures");
    return report;
  }

  packageExport(input: PackageExportInput = {}): AccountingExportRunReport {
    this.performance.packagesCreated += 1;
    const report = this.manager.packageExport(input, this.config);
    this.finalizeOperation(report, "package_export");
    return report;
  }

  private finalizeOperation(report: AccountingExportRunReport, action: string): void {
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
    appendAeeLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
