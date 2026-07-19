/** R4-05 — SMS Communication Controller. */

import { appendSceLog } from "./sce-logging.js";
import { SmsCommunicationManager } from "./sms-communication-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { SmsCommunicationEngineConfiguration } from "./configuration.js";
import type {
  ConnectSmsCommunicationEngineInput,
  CreateSmsTemplateInput,
  DetectSmsFailuresInput,
  EngineStatus,
  ProcessSmsQueueInput,
  RetrySmsInput,
  SendSmsInput,
  SmsPerformanceStats,
  SmsRunReport,
  TrackDeliveryConfirmationInput,
} from "./types.js";

export class SmsCommunicationController {
  private config: SmsCommunicationEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: SmsRunReport | null = null;
  private readonly manager: SmsCommunicationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: SmsPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    smsSent: 0,
    transactionalSent: 0,
    notificationSent: 0,
    verificationSent: 0,
    templatesCreated: 0,
    confirmationsTracked: 0,
    retriesPerformed: 0,
    failuresDetected: 0,
    queueProcessed: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: SmsCommunicationManager, config: SmsCommunicationEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendSceLog({
      event: "engine_initialization",
      level: "info",
      details: "SMS Communication Engine ready (R4-05)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): SmsCommunicationEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: SmsCommunicationEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): SmsRunReport | null {
    return this.latestReport;
  }

  getManager(): SmsCommunicationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): SmsPerformanceStats {
    return {
      ...this.performance,
      retryAttempts: this.manager.getRetryManager().getRetryAttempts(),
    };
  }

  connectSmsCommunicationEngine(
    input: ConnectSmsCommunicationEngineInput = {},
  ): SmsRunReport {
    if (!this.config.enabled) throw new Error("SMS Communication Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectSmsCommunicationEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  sendTransactionalSms(input: SendSmsInput): SmsRunReport {
    this.performance.smsSent += 1;
    this.performance.transactionalSent += 1;
    const report = this.manager.sendTransactionalSms(input, this.config);
    this.finalizeOperation(report, "send_transactional");
    return report;
  }

  sendNotificationSms(input: SendSmsInput): SmsRunReport {
    this.performance.smsSent += 1;
    this.performance.notificationSent += 1;
    const report = this.manager.sendNotificationSms(input, this.config);
    this.finalizeOperation(report, "send_notification");
    return report;
  }

  sendVerificationSms(input: SendSmsInput): SmsRunReport {
    this.performance.smsSent += 1;
    this.performance.verificationSent += 1;
    const report = this.manager.sendVerificationSms(input, this.config);
    this.finalizeOperation(report, "send_verification");
    return report;
  }

  createSmsTemplate(input: CreateSmsTemplateInput): SmsRunReport {
    this.performance.templatesCreated += 1;
    const report = this.manager.createSmsTemplate(input, this.config);
    this.finalizeOperation(report, "create_template");
    return report;
  }

  processSmsQueue(input: ProcessSmsQueueInput = {}): SmsRunReport {
    this.performance.queueProcessed += 1;
    const report = this.manager.processSmsQueue(input, this.config);
    this.finalizeOperation(report, "process_queue");
    return report;
  }

  trackDeliveryConfirmation(input: TrackDeliveryConfirmationInput): SmsRunReport {
    this.performance.confirmationsTracked += 1;
    const report = this.manager.trackDeliveryConfirmation(input, this.config);
    this.finalizeOperation(report, "track_confirmation");
    return report;
  }

  retrySms(input: RetrySmsInput): SmsRunReport {
    this.performance.retriesPerformed += 1;
    const report = this.manager.retrySms(input, this.config);
    this.finalizeOperation(report, "retry_sms");
    return report;
  }

  detectSmsFailures(input: DetectSmsFailuresInput = {}): SmsRunReport {
    const report = this.manager.detectSmsFailures(input, this.config);
    this.performance.failuresDetected += report.failures.length;
    this.finalizeOperation(report, "detect_failures");
    return report;
  }

  private finalizeOperation(report: SmsRunReport, action: string): void {
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
    appendSceLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
