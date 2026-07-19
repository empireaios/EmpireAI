/** R4-03 — Customer Timeline Controller. */

import { appendCteLog } from "./cte-logging.js";
import { CustomerTimelineManager } from "./customer-timeline-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { CustomerTimelineEngineConfiguration } from "./configuration.js";
import type {
  ConnectCustomerTimelineEngineInput,
  EngineStatus,
  RecordAccountChangeInput,
  RecordCommunicationInput,
  RecordCustomerInteractionInput,
  RecordCustomerMilestoneInput,
  RecordPurchaseInput,
  RecordSupportActivityInput,
  RecordTimelineEventInput,
  SearchTimelineHistoryInput,
  TimelinePerformanceStats,
  TimelineRunReport,
} from "./types.js";

export class CustomerTimelineController {
  private config: CustomerTimelineEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: TimelineRunReport | null = null;
  private readonly manager: CustomerTimelineManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: TimelinePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    eventsRecorded: 0,
    interactionsRecorded: 0,
    purchasesRecorded: 0,
    supportActivitiesRecorded: 0,
    communicationsRecorded: 0,
    accountChangesRecorded: 0,
    milestonesRecorded: 0,
    searchesPerformed: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: CustomerTimelineManager, config: CustomerTimelineEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCteLog({
      event: "engine_initialization",
      level: "info",
      details: "Customer Timeline Engine ready (R4-03)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CustomerTimelineEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CustomerTimelineEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): TimelineRunReport | null {
    return this.latestReport;
  }

  getManager(): CustomerTimelineManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): TimelinePerformanceStats {
    return {
      ...this.performance,
      retryAttempts: this.manager.getRetryManager().getRetryAttempts(),
    };
  }

  connectCustomerTimelineEngine(
    input: ConnectCustomerTimelineEngineInput = {},
  ): TimelineRunReport {
    if (!this.config.enabled) throw new Error("Customer Timeline Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectCustomerTimelineEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  recordTimelineEvent(input: RecordTimelineEventInput): TimelineRunReport {
    this.status = "processing";
    this.performance.eventsRecorded += 1;
    const report = this.manager.recordTimelineEvent(input, this.config);
    this.finalizeOperation(report, "record_event");
    return report;
  }

  recordCustomerInteraction(input: RecordCustomerInteractionInput): TimelineRunReport {
    this.performance.interactionsRecorded += 1;
    const report = this.manager.recordCustomerInteraction(input, this.config);
    this.finalizeOperation(report, "record_interaction");
    return report;
  }

  recordPurchase(input: RecordPurchaseInput): TimelineRunReport {
    this.performance.purchasesRecorded += 1;
    const report = this.manager.recordPurchase(input, this.config);
    this.finalizeOperation(report, "record_purchase");
    return report;
  }

  recordSupportActivity(input: RecordSupportActivityInput): TimelineRunReport {
    this.performance.supportActivitiesRecorded += 1;
    const report = this.manager.recordSupportActivity(input, this.config);
    this.finalizeOperation(report, "record_support");
    return report;
  }

  recordCommunication(input: RecordCommunicationInput): TimelineRunReport {
    this.performance.communicationsRecorded += 1;
    const report = this.manager.recordCommunication(input, this.config);
    this.finalizeOperation(report, "record_communication");
    return report;
  }

  recordAccountChange(input: RecordAccountChangeInput): TimelineRunReport {
    this.performance.accountChangesRecorded += 1;
    const report = this.manager.recordAccountChange(input, this.config);
    this.finalizeOperation(report, "record_account_change");
    return report;
  }

  recordCustomerMilestone(input: RecordCustomerMilestoneInput): TimelineRunReport {
    this.performance.milestonesRecorded += 1;
    const report = this.manager.recordCustomerMilestone(input, this.config);
    this.finalizeOperation(report, "record_milestone");
    return report;
  }

  searchTimelineHistory(input: SearchTimelineHistoryInput): TimelineRunReport {
    this.performance.searchesPerformed += 1;
    const report = this.manager.searchTimelineHistory(input, this.config);
    this.finalizeOperation(report, "search_timeline");
    return report;
  }

  private finalizeOperation(report: TimelineRunReport, action: string): void {
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
    appendCteLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
