/** R4-06 — WhatsApp Integration Controller. */

import { appendWaiLog } from "./wai-logging.js";
import { WhatsAppIntegrationManager } from "./whatsapp-integration-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { WhatsAppIntegrationConfiguration } from "./configuration.js";
import type {
  ConnectWhatsAppIntegrationInput,
  CreateWhatsAppTemplateInput,
  DetectMessagingFailuresInput,
  EngineStatus,
  ManageConversationInput,
  ProcessMessageQueueInput,
  ReceiveInboundMessageInput,
  SendWhatsAppInput,
  TrackDeliveryInput,
  TrackReadReceiptInput,
  WhatsAppPerformanceStats,
  WhatsAppRunReport,
} from "./types.js";

export class WhatsAppIntegrationController {
  private config: WhatsAppIntegrationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: WhatsAppRunReport | null = null;
  private readonly manager: WhatsAppIntegrationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: WhatsAppPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    messagesSent: 0,
    transactionalSent: 0,
    notificationSent: 0,
    templateSent: 0,
    inboundReceived: 0,
    templatesCreated: 0,
    conversationsManaged: 0,
    deliveriesTracked: 0,
    readReceiptsTracked: 0,
    failuresDetected: 0,
    queueProcessed: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: WhatsAppIntegrationManager, config: WhatsAppIntegrationConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendWaiLog({
      event: "engine_initialization",
      level: "info",
      details: "WhatsApp Integration ready (R4-06)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): WhatsAppIntegrationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: WhatsAppIntegrationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): WhatsAppRunReport | null {
    return this.latestReport;
  }

  getManager(): WhatsAppIntegrationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): WhatsAppPerformanceStats {
    return { ...this.performance };
  }

  connectWhatsAppIntegration(input: ConnectWhatsAppIntegrationInput = {}): WhatsAppRunReport {
    if (!this.config.enabled) throw new Error("WhatsApp Integration is disabled");
    this.status = "connecting";
    const report = this.manager.connectWhatsAppIntegration(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  sendTransactionalWhatsApp(input: SendWhatsAppInput): WhatsAppRunReport {
    this.performance.messagesSent += 1;
    this.performance.transactionalSent += 1;
    const report = this.manager.sendTransactionalWhatsApp(input, this.config);
    this.finalizeOperation(report, "send_transactional");
    return report;
  }

  sendNotificationWhatsApp(input: SendWhatsAppInput): WhatsAppRunReport {
    this.performance.messagesSent += 1;
    this.performance.notificationSent += 1;
    const report = this.manager.sendNotificationWhatsApp(input, this.config);
    this.finalizeOperation(report, "send_notification");
    return report;
  }

  sendTemplateWhatsApp(input: SendWhatsAppInput): WhatsAppRunReport {
    this.performance.messagesSent += 1;
    this.performance.templateSent += 1;
    const report = this.manager.sendTemplateWhatsApp(input, this.config);
    this.finalizeOperation(report, "send_template");
    return report;
  }

  receiveInboundMessage(input: ReceiveInboundMessageInput): WhatsAppRunReport {
    this.performance.inboundReceived += 1;
    const report = this.manager.receiveInboundMessage(input, this.config);
    this.finalizeOperation(report, "receive_inbound");
    return report;
  }

  manageConversation(input: ManageConversationInput): WhatsAppRunReport {
    this.performance.conversationsManaged += 1;
    const report = this.manager.manageConversation(input, this.config);
    this.finalizeOperation(report, "manage_conversation");
    return report;
  }

  createWhatsAppTemplate(input: CreateWhatsAppTemplateInput): WhatsAppRunReport {
    this.performance.templatesCreated += 1;
    const report = this.manager.createWhatsAppTemplate(input, this.config);
    this.finalizeOperation(report, "create_template");
    return report;
  }

  processMessageQueue(input: ProcessMessageQueueInput = {}): WhatsAppRunReport {
    this.performance.queueProcessed += 1;
    const report = this.manager.processMessageQueue(input, this.config);
    this.finalizeOperation(report, "process_queue");
    return report;
  }

  trackDelivery(input: TrackDeliveryInput): WhatsAppRunReport {
    this.performance.deliveriesTracked += 1;
    const report = this.manager.trackDelivery(input, this.config);
    this.finalizeOperation(report, "track_delivery");
    return report;
  }

  trackReadReceipt(input: TrackReadReceiptInput): WhatsAppRunReport {
    this.performance.readReceiptsTracked += 1;
    const report = this.manager.trackReadReceipt(input, this.config);
    this.finalizeOperation(report, "track_read_receipt");
    return report;
  }

  detectMessagingFailures(input: DetectMessagingFailuresInput = {}): WhatsAppRunReport {
    const report = this.manager.detectMessagingFailures(input, this.config);
    this.performance.failuresDetected += report.failures.length;
    this.finalizeOperation(report, "detect_failures");
    return report;
  }

  private finalizeOperation(report: WhatsAppRunReport, action: string): void {
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
    appendWaiLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
