/** R4-04 — Email Communication Controller. */

import { appendEceLog } from "./ece-logging.js";
import { EmailCommunicationManager } from "./email-communication-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { EmailCommunicationEngineConfiguration } from "./configuration.js";
import type {
  ConnectEmailCommunicationEngineInput,
  CreateEmailTemplateInput,
  DetectEmailFailuresInput,
  EmailPerformanceStats,
  EmailRunReport,
  EngineStatus,
  ProcessEmailQueueInput,
  SendEmailInput,
  TrackEmailClickInput,
  TrackEmailOpenInput,
} from "./types.js";

export class EmailCommunicationController {
  private config: EmailCommunicationEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: EmailRunReport | null = null;
  private readonly manager: EmailCommunicationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: EmailPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    emailsSent: 0,
    transactionalSent: 0,
    marketingSent: 0,
    notificationSent: 0,
    supportSent: 0,
    templatesCreated: 0,
    opensTracked: 0,
    clicksTracked: 0,
    failuresDetected: 0,
    queueProcessed: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: EmailCommunicationManager, config: EmailCommunicationEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendEceLog({
      event: "engine_initialization",
      level: "info",
      details: "Email Communication Engine ready (R4-04)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): EmailCommunicationEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: EmailCommunicationEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): EmailRunReport | null {
    return this.latestReport;
  }

  getManager(): EmailCommunicationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): EmailPerformanceStats {
    return {
      ...this.performance,
      retryAttempts: this.manager.getRetryManager().getRetryAttempts(),
    };
  }

  connectEmailCommunicationEngine(
    input: ConnectEmailCommunicationEngineInput = {},
  ): EmailRunReport {
    if (!this.config.enabled) throw new Error("Email Communication Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectEmailCommunicationEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  sendTransactionalEmail(input: SendEmailInput): EmailRunReport {
    this.performance.emailsSent += 1;
    this.performance.transactionalSent += 1;
    const report = this.manager.sendTransactionalEmail(input, this.config);
    this.finalizeOperation(report, "send_transactional");
    return report;
  }

  sendMarketingEmail(input: SendEmailInput): EmailRunReport {
    this.performance.emailsSent += 1;
    this.performance.marketingSent += 1;
    const report = this.manager.sendMarketingEmail(input, this.config);
    this.finalizeOperation(report, "send_marketing");
    return report;
  }

  sendNotificationEmail(input: SendEmailInput): EmailRunReport {
    this.performance.emailsSent += 1;
    this.performance.notificationSent += 1;
    const report = this.manager.sendNotificationEmail(input, this.config);
    this.finalizeOperation(report, "send_notification");
    return report;
  }

  sendSupportEmail(input: SendEmailInput): EmailRunReport {
    this.performance.emailsSent += 1;
    this.performance.supportSent += 1;
    const report = this.manager.sendSupportEmail(input, this.config);
    this.finalizeOperation(report, "send_support");
    return report;
  }

  createEmailTemplate(input: CreateEmailTemplateInput): EmailRunReport {
    this.performance.templatesCreated += 1;
    const report = this.manager.createEmailTemplate(input, this.config);
    this.finalizeOperation(report, "create_template");
    return report;
  }

  processEmailQueue(input: ProcessEmailQueueInput = {}): EmailRunReport {
    this.performance.queueProcessed += 1;
    const report = this.manager.processEmailQueue(input, this.config);
    this.finalizeOperation(report, "process_queue");
    return report;
  }

  trackEmailOpen(input: TrackEmailOpenInput): EmailRunReport {
    this.performance.opensTracked += 1;
    const report = this.manager.trackEmailOpen(input, this.config);
    this.finalizeOperation(report, "track_open");
    return report;
  }

  trackEmailClick(input: TrackEmailClickInput): EmailRunReport {
    this.performance.clicksTracked += 1;
    const report = this.manager.trackEmailClick(input, this.config);
    this.finalizeOperation(report, "track_click");
    return report;
  }

  detectEmailFailures(input: DetectEmailFailuresInput = {}): EmailRunReport {
    const report = this.manager.detectEmailFailures(input, this.config);
    this.performance.failuresDetected += report.failures.length;
    this.finalizeOperation(report, "detect_failures");
    return report;
  }

  private finalizeOperation(report: EmailRunReport, action: string): void {
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
    appendEceLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
