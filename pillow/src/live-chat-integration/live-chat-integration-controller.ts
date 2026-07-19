/** R4-07 — Live Chat Integration Controller. */

import { appendLciLog } from "./lci-logging.js";
import { LiveChatIntegrationManager } from "./live-chat-integration-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { LiveChatIntegrationConfiguration } from "./configuration.js";
import type {
  AssignChatSessionInput,
  ConnectLiveChatIntegrationInput,
  CreateChatSessionInput,
  DetectChatFailuresInput,
  EngineStatus,
  LiveChatPerformanceStats,
  LiveChatRunReport,
  ManageChatConversationInput,
  ProcessChatQueueInput,
  ReceiveCustomerMessageInput,
  SendSupportResponseInput,
  TrackChatStatusInput,
  TrackResponseTimeInput,
} from "./types.js";

export class LiveChatIntegrationController {
  private config: LiveChatIntegrationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: LiveChatRunReport | null = null;
  private readonly manager: LiveChatIntegrationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: LiveChatPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    sessionsCreated: 0,
    customerMessagesReceived: 0,
    supportResponsesSent: 0,
    conversationsManaged: 0,
    queueProcessed: 0,
    sessionsAssigned: 0,
    statusTracked: 0,
    responseTimesTracked: 0,
    failuresDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
    averageResponseTimeMs: 0,
  };

  constructor(manager: LiveChatIntegrationManager, config: LiveChatIntegrationConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendLciLog({
      event: "engine_initialization",
      level: "info",
      details: "Live Chat Integration ready (R4-07)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): LiveChatIntegrationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: LiveChatIntegrationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): LiveChatRunReport | null {
    return this.latestReport;
  }

  getManager(): LiveChatIntegrationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): LiveChatPerformanceStats {
    const summary = this.manager.getAnalyticsEngine().summarize(this.manager.getLiveChatRecords());
    return {
      ...this.performance,
      averageResponseTimeMs: summary.averageResponseTimeMs,
    };
  }

  connectLiveChatIntegration(input: ConnectLiveChatIntegrationInput = {}): LiveChatRunReport {
    if (!this.config.enabled) throw new Error("Live Chat Integration is disabled");
    this.status = "connecting";
    const report = this.manager.connectLiveChatIntegration(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  createChatSession(input: CreateChatSessionInput): LiveChatRunReport {
    this.performance.sessionsCreated += 1;
    const report = this.manager.createChatSession(input, this.config);
    this.finalizeOperation(report, "create_session");
    return report;
  }

  receiveCustomerMessage(input: ReceiveCustomerMessageInput): LiveChatRunReport {
    this.performance.customerMessagesReceived += 1;
    const report = this.manager.receiveCustomerMessage(input, this.config);
    this.finalizeOperation(report, "receive_message");
    return report;
  }

  sendSupportResponse(input: SendSupportResponseInput): LiveChatRunReport {
    this.performance.supportResponsesSent += 1;
    const report = this.manager.sendSupportResponse(input, this.config);
    this.finalizeOperation(report, "send_response");
    return report;
  }

  manageChatConversation(input: ManageChatConversationInput): LiveChatRunReport {
    this.performance.conversationsManaged += 1;
    const report = this.manager.manageChatConversation(input, this.config);
    this.finalizeOperation(report, "manage_conversation");
    return report;
  }

  processChatQueue(input: ProcessChatQueueInput = {}): LiveChatRunReport {
    this.performance.queueProcessed += 1;
    const report = this.manager.processChatQueue(input, this.config);
    this.finalizeOperation(report, "process_queue");
    return report;
  }

  assignChatSession(input: AssignChatSessionInput): LiveChatRunReport {
    this.performance.sessionsAssigned += 1;
    const report = this.manager.assignChatSession(input, this.config);
    this.finalizeOperation(report, "assign_session");
    return report;
  }

  trackChatStatus(input: TrackChatStatusInput): LiveChatRunReport {
    this.performance.statusTracked += 1;
    const report = this.manager.trackChatStatus(input, this.config);
    this.finalizeOperation(report, "track_status");
    return report;
  }

  trackResponseTime(input: TrackResponseTimeInput): LiveChatRunReport {
    this.performance.responseTimesTracked += 1;
    const report = this.manager.trackResponseTime(input, this.config);
    this.finalizeOperation(report, "track_response_time");
    return report;
  }

  detectChatFailures(input: DetectChatFailuresInput = {}): LiveChatRunReport {
    const report = this.manager.detectChatFailures(input, this.config);
    this.performance.failuresDetected += report.failures.length;
    this.finalizeOperation(report, "detect_failures");
    return report;
  }

  private finalizeOperation(report: LiveChatRunReport, action: string): void {
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
    appendLciLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
