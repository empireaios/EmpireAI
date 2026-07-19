import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { EmailCommunicationEngine } from "../email-communication-engine/engine.js";
import type { SmsCommunicationEngine } from "../sms-communication-engine/engine.js";
import type { WhatsAppIntegration } from "../whatsapp-integration/engine.js";
import type { LiveChatIntegration } from "../live-chat-integration/engine.js";
import type { AiCustomerSupport } from "../ai-customer-support/engine.js";
import type { TicketManagementEngine } from "../ticket-management-engine/engine.js";
import {
  buildCustomerSentimentEngineConfiguration,
  type CustomerSentimentEngineConfiguration,
} from "./configuration.js";
import { appendCseLog, getCseLogs, resetCseLogsForTesting } from "./cse-logging.js";
import { CUSTOMER_SENTIMENT_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AnalyzeCustomerConversationInput,
  AnalyzeCustomerMessageInput,
  CalculateSentimentScoreInput,
  ConnectCustomerSentimentEngineInput,
  DetectCustomerFrustrationInput,
  DetectCustomerSatisfactionInput,
  DetectEscalationRiskInput,
  DetectPositiveExperienceInput,
  DetectSentimentFailuresInput,
  GenerateSentimentAlertsInput,
  SentimentCockpitSnapshot,
  CustomerSentimentEngineState,
  SentimentRunReport,
  TrackSentimentTrendsInput,
} from "./types.js";
import { CustomerSentimentController } from "./customer-sentiment-controller.js";
import { CustomerSentimentManager } from "./customer-sentiment-manager.js";

export interface CustomerSentimentEngineOptions {
  configuration?: Partial<CustomerSentimentEngineConfiguration>;
}

/**
 * Customer Sentiment Engine (PILLOW-CSE-001 / R4-10).
 * Continuous customer sentiment analysis consuming R4-03 through R4-09.
 */
export class CustomerSentimentEngine {
  private initializedAt: string | null = null;
  private readonly controller: CustomerSentimentController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    timelineEngine: CustomerTimelineEngine,
    emailEngine: EmailCommunicationEngine,
    smsEngine: SmsCommunicationEngine,
    whatsAppIntegration: WhatsAppIntegration,
    liveChatIntegration: LiveChatIntegration,
    aiCustomerSupport: AiCustomerSupport,
    ticketManagementEngine: TicketManagementEngine,
    options: CustomerSentimentEngineOptions = {},
  ) {
    const config = buildCustomerSentimentEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CustomerSentimentManager(
      timelineEngine,
      emailEngine,
      smsEngine,
      whatsAppIntegration,
      liveChatIntegration,
      aiCustomerSupport,
      ticketManagementEngine,
    );
    this.controller = new CustomerSentimentController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CustomerSentimentEngineState> {
    const doc = await this.reader.readText(CUSTOMER_SENTIMENT_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Customer Sentiment Engine")) {
      throw new Error(
        `${CUSTOMER_SENTIMENT_ENGINE_SYSTEM_PATH} missing — Customer Sentiment Engine requires R4-10 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCseLog({
      event: "engine_initialization",
      level: "info",
      details: "R4-10 Customer Sentiment Engine initialized",
    });
    return this.getState();
  }

  getState(): CustomerSentimentEngineState {
    if (!this.initializedAt) {
      throw new Error("Customer Sentiment Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const sentimentRecords = this.controller.getManager().getSentimentRecords();
    const summary = this.controller.getManager().getAnalyticsEngine().summarize(sentimentRecords);

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalSentimentRecords: summary.total,
      positiveRecords: summary.positive + summary.satisfied,
      negativeRecords: summary.negative,
      frustratedRecords: summary.frustrated,
      activeAlerts: summary.activeAlerts,
      failedRecords: summary.failed,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CSE-001",
      missionId: "R4-10",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectCustomerSentimentEngine(
    input: ConnectCustomerSentimentEngineInput = {},
  ): SentimentRunReport {
    return this.controller.connectCustomerSentimentEngine(input);
  }

  analyzeCustomerMessage(input: AnalyzeCustomerMessageInput): SentimentRunReport {
    return this.controller.analyzeCustomerMessage(input);
  }

  analyzeCustomerConversation(input: AnalyzeCustomerConversationInput): SentimentRunReport {
    return this.controller.analyzeCustomerConversation(input);
  }

  detectCustomerSatisfaction(input: DetectCustomerSatisfactionInput = {}): SentimentRunReport {
    return this.controller.detectCustomerSatisfaction(input);
  }

  detectCustomerFrustration(input: DetectCustomerFrustrationInput = {}): SentimentRunReport {
    return this.controller.detectCustomerFrustration(input);
  }

  detectEscalationRisk(input: DetectEscalationRiskInput = {}): SentimentRunReport {
    return this.controller.detectEscalationRisk(input);
  }

  detectPositiveExperience(input: DetectPositiveExperienceInput = {}): SentimentRunReport {
    return this.controller.detectPositiveExperience(input);
  }

  trackSentimentTrends(input: TrackSentimentTrendsInput): SentimentRunReport {
    return this.controller.trackSentimentTrends(input);
  }

  calculateSentimentScore(input: CalculateSentimentScoreInput): SentimentRunReport {
    return this.controller.calculateSentimentScore(input);
  }

  generateSentimentAlerts(input: GenerateSentimentAlertsInput = {}): SentimentRunReport {
    return this.controller.generateSentimentAlerts(input);
  }

  detectSentimentFailures(input: DetectSentimentFailuresInput = {}): SentimentRunReport {
    return this.controller.detectSentimentFailures(input);
  }

  getLatestReport(): SentimentRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getSentimentRecords() {
    return this.controller.getManager().getSentimentRecords();
  }

  getAlerts() {
    return this.controller.getManager().getRegistry().listAlerts();
  }

  getTrends() {
    return this.controller.getManager().getRegistry().listTrends();
  }

  getMachineReadableRecord(sentimentRecordId: string): Record<string, unknown> | null {
    const record = this.controller.getManager().getRegistry().getRecord(sentimentRecordId);
    if (!record) return null;
    return this.controller.getManager().getAnalyticsEngine().toMachineReadable(record);
  }

  updateConfiguration(
    overrides: Partial<CustomerSentimentEngineConfiguration>,
  ): CustomerSentimentEngineState {
    const next = buildCustomerSentimentEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Sentiment engine status: ${state.status}`,
        `Records: ${state.health.totalSentimentRecords} total · ${state.health.positiveRecords} positive`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No sentiment operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SentimentCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalSentimentRecords: state.health.totalSentimentRecords,
      positiveRecords: state.health.positiveRecords,
      negativeRecords: state.health.negativeRecords,
      frustratedRecords: state.health.frustratedRecords,
      activeAlerts: state.health.activeAlerts,
      timelineEngineConnected: record?.timelineEngineConnected ?? false,
      aiCustomerSupportConnected: record?.aiCustomerSupportConnected ?? false,
      ticketManagementEngineConnected: record?.ticketManagementEngineConnected ?? false,
      recentLogs: getCseLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCustomerSentimentEngine(
  bootstrap: EmpireBootstrapContext,
  timelineEngine: CustomerTimelineEngine,
  emailEngine: EmailCommunicationEngine,
  smsEngine: SmsCommunicationEngine,
  whatsAppIntegration: WhatsAppIntegration,
  liveChatIntegration: LiveChatIntegration,
  aiCustomerSupport: AiCustomerSupport,
  ticketManagementEngine: TicketManagementEngine,
  options?: CustomerSentimentEngineOptions,
): CustomerSentimentEngine {
  return new CustomerSentimentEngine(
    bootstrap,
    timelineEngine,
    emailEngine,
    smsEngine,
    whatsAppIntegration,
    liveChatIntegration,
    aiCustomerSupport,
    ticketManagementEngine,
    options,
  );
}

export function resetCustomerSentimentEngineForTesting(): void {
  resetCseLogsForTesting();
  new CustomerSentimentManager(null, null, null, null, null, null, null).resetForTesting();
}
