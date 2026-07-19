/** R4-02 — CRM Controller. */

import { appendCrmLog } from "./crm-logging.js";
import { CrmManager } from "./crm-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { CrmFoundationConfiguration } from "./configuration.js";
import type {
  AddCustomerNoteInput,
  ConnectCrmFoundationInput,
  CreateCustomerProfileInput,
  CrmPerformanceStats,
  CrmRunReport,
  EngineStatus,
  SearchCustomerRecordsInput,
  UpdateCrmRecordInput,
  UpdateCustomAttributesInput,
  UpdateCustomerTagsInput,
} from "./types.js";

export class CrmController {
  private config: CrmFoundationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: CrmRunReport | null = null;
  private readonly manager: CrmManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: CrmPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    profilesCreated: 0,
    recordsUpdated: 0,
    searchesPerformed: 0,
    notesAdded: 0,
    tagsUpdated: 0,
    attributesUpdated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: CrmManager, config: CrmFoundationConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCrmLog({
      event: "engine_initialization",
      level: "info",
      details: "CRM Foundation ready (R4-02)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CrmFoundationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CrmFoundationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): CrmRunReport | null {
    return this.latestReport;
  }

  getManager(): CrmManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): CrmPerformanceStats {
    return {
      ...this.performance,
      retryAttempts: this.manager.getRetryManager().getRetryAttempts(),
    };
  }

  connectCrmFoundation(input: ConnectCrmFoundationInput = {}): CrmRunReport {
    if (!this.config.enabled) throw new Error("CRM Foundation is disabled");
    this.status = "connecting";
    const report = this.manager.connectCrmFoundation(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  createCustomerProfile(input: CreateCustomerProfileInput): CrmRunReport {
    this.status = "processing";
    this.performance.profilesCreated += 1;
    const report = this.manager.createCustomerProfile(input, this.config);
    this.finalizeOperation(report, "create_profile");
    return report;
  }

  updateCrmRecord(input: UpdateCrmRecordInput): CrmRunReport {
    this.status = "processing";
    this.performance.recordsUpdated += 1;
    const report = this.manager.updateCrmRecord(input, this.config);
    this.finalizeOperation(report, "update_record");
    return report;
  }

  searchCustomerRecords(input: SearchCustomerRecordsInput): CrmRunReport {
    this.performance.searchesPerformed += 1;
    const report = this.manager.searchCustomerRecords(input, this.config);
    this.finalizeOperation(report, "search_customers");
    return report;
  }

  addCustomerNote(input: AddCustomerNoteInput): CrmRunReport {
    this.performance.notesAdded += 1;
    const report = this.manager.addCustomerNote(input, this.config);
    this.finalizeOperation(report, "add_note");
    return report;
  }

  updateCustomerTags(input: UpdateCustomerTagsInput): CrmRunReport {
    this.performance.tagsUpdated += 1;
    const report = this.manager.updateCustomerTags(input, this.config);
    this.finalizeOperation(report, "update_tags");
    return report;
  }

  updateCustomAttributes(input: UpdateCustomAttributesInput): CrmRunReport {
    this.performance.attributesUpdated += 1;
    const report = this.manager.updateCustomAttributes(input, this.config);
    this.finalizeOperation(report, "update_attributes");
    return report;
  }

  private finalizeOperation(report: CrmRunReport, action: string): void {
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
    appendCrmLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
