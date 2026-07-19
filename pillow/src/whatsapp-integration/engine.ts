import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import {
  buildWhatsAppIntegrationConfiguration,
  type WhatsAppIntegrationConfiguration,
} from "./configuration.js";
import { appendWaiLog, getWaiLogs, resetWaiLogsForTesting } from "./wai-logging.js";
import { WHATSAPP_INTEGRATION_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectWhatsAppIntegrationInput,
  CreateWhatsAppTemplateInput,
  DetectMessagingFailuresInput,
  ManageConversationInput,
  ProcessMessageQueueInput,
  ReceiveInboundMessageInput,
  SendWhatsAppInput,
  TrackDeliveryInput,
  TrackReadReceiptInput,
  WhatsAppCockpitSnapshot,
  WhatsAppIntegrationState,
  WhatsAppRunReport,
} from "./types.js";
import { WhatsAppIntegrationController } from "./whatsapp-integration-controller.js";
import { WhatsAppIntegrationManager } from "./whatsapp-integration-manager.js";

export interface WhatsAppIntegrationOptions {
  configuration?: Partial<WhatsAppIntegrationConfiguration>;
}

/**
 * WhatsApp Integration (PILLOW-WAI-001 / R4-06).
 * Centralized WhatsApp Business communication consuming R4-02 and R4-03.
 */
export class WhatsAppIntegration {
  private initializedAt: string | null = null;
  private readonly controller: WhatsAppIntegrationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    crmFoundation: CrmFoundationEngine,
    timelineEngine: CustomerTimelineEngine,
    options: WhatsAppIntegrationOptions = {},
  ) {
    const config = buildWhatsAppIntegrationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new WhatsAppIntegrationManager(crmFoundation, timelineEngine);
    this.controller = new WhatsAppIntegrationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<WhatsAppIntegrationState> {
    const doc = await this.reader.readText(WHATSAPP_INTEGRATION_SYSTEM_PATH);
    if (!doc?.includes("WhatsApp Integration")) {
      throw new Error(
        `${WHATSAPP_INTEGRATION_SYSTEM_PATH} missing — WhatsApp Integration requires R4-06 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendWaiLog({
      event: "engine_initialization",
      level: "info",
      details: "R4-06 WhatsApp Integration initialized",
    });
    return this.getState();
  }

  getState(): WhatsAppIntegrationState {
    if (!this.initializedAt) {
      throw new Error("WhatsApp Integration not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const whatsAppRecords = this.controller.getManager().getWhatsAppRecords();
    const conversations = this.controller.getManager().getConversations();
    const summary = this.controller.getManager().getAnalyticsEngine().summarize(whatsAppRecords);

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalWhatsAppRecords: summary.total,
      queuedMessages: summary.queued,
      deliveredMessages: summary.delivered,
      failedMessages: summary.failed,
      activeConversations: conversations.filter((c) => c.status === "active").length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-WAI-001",
      missionId: "R4-06",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectWhatsAppIntegration(input: ConnectWhatsAppIntegrationInput = {}): WhatsAppRunReport {
    return this.controller.connectWhatsAppIntegration(input);
  }

  sendTransactionalWhatsApp(input: SendWhatsAppInput): WhatsAppRunReport {
    return this.controller.sendTransactionalWhatsApp(input);
  }

  sendNotificationWhatsApp(input: SendWhatsAppInput): WhatsAppRunReport {
    return this.controller.sendNotificationWhatsApp(input);
  }

  sendTemplateWhatsApp(input: SendWhatsAppInput): WhatsAppRunReport {
    return this.controller.sendTemplateWhatsApp(input);
  }

  receiveInboundMessage(input: ReceiveInboundMessageInput): WhatsAppRunReport {
    return this.controller.receiveInboundMessage(input);
  }

  manageConversation(input: ManageConversationInput): WhatsAppRunReport {
    return this.controller.manageConversation(input);
  }

  createWhatsAppTemplate(input: CreateWhatsAppTemplateInput): WhatsAppRunReport {
    return this.controller.createWhatsAppTemplate(input);
  }

  processMessageQueue(input: ProcessMessageQueueInput = {}): WhatsAppRunReport {
    return this.controller.processMessageQueue(input);
  }

  trackDelivery(input: TrackDeliveryInput): WhatsAppRunReport {
    return this.controller.trackDelivery(input);
  }

  trackReadReceipt(input: TrackReadReceiptInput): WhatsAppRunReport {
    return this.controller.trackReadReceipt(input);
  }

  detectMessagingFailures(input: DetectMessagingFailuresInput = {}): WhatsAppRunReport {
    return this.controller.detectMessagingFailures(input);
  }

  getLatestReport(): WhatsAppRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getWhatsAppRecords() {
    return this.controller.getManager().getWhatsAppRecords();
  }

  getConversations() {
    return this.controller.getManager().getConversations();
  }

  getTemplates() {
    return this.controller.getManager().getTemplates();
  }

  getMachineReadableRecord(whatsAppRecordId: string): Record<string, unknown> | null {
    const record = this.controller.getManager().getRegistry().getMessage(whatsAppRecordId);
    if (!record) return null;
    return this.controller.getManager().getAnalyticsEngine().toMachineReadable(record);
  }

  updateConfiguration(
    overrides: Partial<WhatsAppIntegrationConfiguration>,
  ): WhatsAppIntegrationState {
    const next = buildWhatsAppIntegrationConfiguration(this.bootstrap.repositoryRoot, {
      ...this.controller.getConfiguration(),
      ...overrides,
    });
    this.controller.updateConfiguration(next);
    return this.getState();
  }

  validateForSupervisorSync(): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
  } {
    const state = this.getState();
    const report = state.latestReport;
    const score = report
      ? report.validation.decision === "pass"
        ? 100
        : report.validation.decision === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `WhatsApp status: ${state.status}`,
        `WhatsApp: ${state.health.totalWhatsAppRecords} total · ${state.health.deliveredMessages} delivered`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No WhatsApp operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WhatsAppCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalWhatsAppRecords: state.health.totalWhatsAppRecords,
      queuedMessages: state.health.queuedMessages,
      deliveredMessages: state.health.deliveredMessages,
      activeConversations: state.health.activeConversations,
      crmFoundationConnected: record?.crmFoundationConnected ?? false,
      timelineEngineConnected: record?.timelineEngineConnected ?? false,
      recentLogs: getWaiLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createWhatsAppIntegration(
  bootstrap: EmpireBootstrapContext,
  crmFoundation: CrmFoundationEngine,
  timelineEngine: CustomerTimelineEngine,
  options?: WhatsAppIntegrationOptions,
): WhatsAppIntegration {
  return new WhatsAppIntegration(bootstrap, crmFoundation, timelineEngine, options);
}

export function resetWhatsAppIntegrationForTesting(): void {
  resetWaiLogsForTesting();
  new WhatsAppIntegrationManager(null, null).resetForTesting();
}
