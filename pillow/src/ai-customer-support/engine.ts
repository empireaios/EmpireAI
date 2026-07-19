import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { EmailCommunicationEngine } from "../email-communication-engine/engine.js";
import type { SmsCommunicationEngine } from "../sms-communication-engine/engine.js";
import type { WhatsAppIntegration } from "../whatsapp-integration/engine.js";
import type { LiveChatIntegration } from "../live-chat-integration/engine.js";
import {
  buildAiCustomerSupportConfiguration,
  type AiCustomerSupportConfiguration,
} from "./configuration.js";
import { appendAcsLog, getAcsLogs, resetAcsLogsForTesting } from "./acs-logging.js";
import { AI_CUSTOMER_SUPPORT_SYSTEM_PATH } from "./paths.js";
import type {
  AiSupportCockpitSnapshot,
  AiCustomerSupportState,
  AiSupportRunReport,
  ConnectAiCustomerSupportInput,
  DetectSupportFailuresInput,
  EscalateEnquiryInput,
  GenerateAiResponseInput,
  GenerateSupportSummaryInput,
  HandleMultiChannelSupportInput,
  ReceiveCustomerEnquiryInput,
  RetrieveCustomerContextInput,
  UnderstandCustomerIntentInput,
} from "./types.js";
import { AiCustomerSupportController } from "./ai-customer-support-controller.js";
import { AiCustomerSupportManager } from "./ai-customer-support-manager.js";

export interface AiCustomerSupportOptions {
  configuration?: Partial<AiCustomerSupportConfiguration>;
}

/**
 * AI Customer Support (PILLOW-ACS-001 / R4-08).
 * Autonomous customer support powered by Pillow consuming R4-01 through R4-07.
 */
export class AiCustomerSupport {
  private initializedAt: string | null = null;
  private readonly controller: AiCustomerSupportController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    identityEngine: CustomerIdentityEngine,
    crmFoundation: CrmFoundationEngine,
    timelineEngine: CustomerTimelineEngine,
    emailEngine: EmailCommunicationEngine,
    smsEngine: SmsCommunicationEngine,
    whatsAppIntegration: WhatsAppIntegration,
    liveChatIntegration: LiveChatIntegration,
    options: AiCustomerSupportOptions = {},
  ) {
    const config = buildAiCustomerSupportConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new AiCustomerSupportManager(
      identityEngine,
      crmFoundation,
      timelineEngine,
      emailEngine,
      smsEngine,
      whatsAppIntegration,
      liveChatIntegration,
    );
    this.controller = new AiCustomerSupportController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<AiCustomerSupportState> {
    const doc = await this.reader.readText(AI_CUSTOMER_SUPPORT_SYSTEM_PATH);
    if (!doc?.includes("AI Customer Support")) {
      throw new Error(
        `${AI_CUSTOMER_SUPPORT_SYSTEM_PATH} missing — AI Customer Support requires R4-08 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendAcsLog({
      event: "engine_initialization",
      level: "info",
      details: "R4-08 AI Customer Support initialized",
    });
    return this.getState();
  }

  getState(): AiCustomerSupportState {
    if (!this.initializedAt) {
      throw new Error("AI Customer Support not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const aiSupportRecords = this.controller.getManager().getAiSupportRecords();
    const summary = this.controller.getManager().getAnalyticsEngine().summarize(aiSupportRecords);

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalAiSupportRecords: summary.total,
      openEnquiries: summary.open,
      escalatedEnquiries: summary.escalated,
      resolvedEnquiries: summary.resolved,
      failedEnquiries: summary.failed,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-ACS-001",
      missionId: "R4-08",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectAiCustomerSupport(input: ConnectAiCustomerSupportInput = {}): AiSupportRunReport {
    return this.controller.connectAiCustomerSupport(input);
  }

  receiveCustomerEnquiry(input: ReceiveCustomerEnquiryInput): AiSupportRunReport {
    return this.controller.receiveCustomerEnquiry(input);
  }

  understandCustomerIntent(input: UnderstandCustomerIntentInput): AiSupportRunReport {
    return this.controller.understandCustomerIntent(input);
  }

  retrieveCustomerContext(input: RetrieveCustomerContextInput): AiSupportRunReport {
    return this.controller.retrieveCustomerContext(input);
  }

  generateAiResponse(input: GenerateAiResponseInput): AiSupportRunReport {
    return this.controller.generateAiResponse(input);
  }

  escalateEnquiry(input: EscalateEnquiryInput): AiSupportRunReport {
    return this.controller.escalateEnquiry(input);
  }

  handleMultiChannelSupport(input: HandleMultiChannelSupportInput): AiSupportRunReport {
    return this.controller.handleMultiChannelSupport(input);
  }

  generateSupportSummary(input: GenerateSupportSummaryInput): AiSupportRunReport {
    return this.controller.generateSupportSummary(input);
  }

  detectSupportFailures(input: DetectSupportFailuresInput = {}): AiSupportRunReport {
    return this.controller.detectSupportFailures(input);
  }

  getLatestReport(): AiSupportRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getAiSupportRecords() {
    return this.controller.getManager().getAiSupportRecords();
  }

  getSummaries() {
    return this.controller.getManager().getRegistry().listSummaries();
  }

  getMachineReadableRecord(aiSupportRecordId: string): Record<string, unknown> | null {
    const record = this.controller.getManager().getRegistry().getRecord(aiSupportRecordId);
    if (!record) return null;
    return this.controller.getManager().getAnalyticsEngine().toMachineReadable(record);
  }

  updateConfiguration(
    overrides: Partial<AiCustomerSupportConfiguration>,
  ): AiCustomerSupportState {
    const next = buildAiCustomerSupportConfiguration(this.bootstrap.repositoryRoot, {
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
        `AI support status: ${state.status}`,
        `Records: ${state.health.totalAiSupportRecords} total · ${state.health.resolvedEnquiries} resolved`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No AI support operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AiSupportCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalAiSupportRecords: state.health.totalAiSupportRecords,
      openEnquiries: state.health.openEnquiries,
      escalatedEnquiries: state.health.escalatedEnquiries,
      resolvedEnquiries: state.health.resolvedEnquiries,
      identityEngineConnected: record?.identityEngineConnected ?? false,
      crmFoundationConnected: record?.crmFoundationConnected ?? false,
      timelineEngineConnected: record?.timelineEngineConnected ?? false,
      recentLogs: getAcsLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createAiCustomerSupport(
  bootstrap: EmpireBootstrapContext,
  identityEngine: CustomerIdentityEngine,
  crmFoundation: CrmFoundationEngine,
  timelineEngine: CustomerTimelineEngine,
  emailEngine: EmailCommunicationEngine,
  smsEngine: SmsCommunicationEngine,
  whatsAppIntegration: WhatsAppIntegration,
  liveChatIntegration: LiveChatIntegration,
  options?: AiCustomerSupportOptions,
): AiCustomerSupport {
  return new AiCustomerSupport(
    bootstrap,
    identityEngine,
    crmFoundation,
    timelineEngine,
    emailEngine,
    smsEngine,
    whatsAppIntegration,
    liveChatIntegration,
    options,
  );
}

export function resetAiCustomerSupportForTesting(): void {
  resetAcsLogsForTesting();
  new AiCustomerSupportManager(null, null, null, null, null, null, null).resetForTesting();
}
