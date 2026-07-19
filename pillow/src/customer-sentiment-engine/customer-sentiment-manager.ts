/** R4-10 — Customer Sentiment Manager. */

import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { EmailCommunicationEngine } from "../email-communication-engine/engine.js";
import type { SmsCommunicationEngine } from "../sms-communication-engine/engine.js";
import type { WhatsAppIntegration } from "../whatsapp-integration/engine.js";
import type { LiveChatIntegration } from "../live-chat-integration/engine.js";
import type { AiCustomerSupport } from "../ai-customer-support/engine.js";
import type { TicketManagementEngine } from "../ticket-management-engine/engine.js";
import { appendCseLog } from "./cse-logging.js";
import { SentimentRegistry } from "./sentiment-registry.js";
import { SentimentMetadataGenerator } from "./sentiment-metadata-generator.js";
import { SentimentAnalysisEngine } from "./sentiment-analysis-engine.js";
import { ConversationAnalysisEngine } from "./conversation-analysis-engine.js";
import { SentimentScoringEngine } from "./sentiment-scoring-engine.js";
import { TrendAnalysisEngine } from "./trend-analysis-engine.js";
import { SentimentAlertEngine } from "./sentiment-alert-engine.js";
import { SentimentAnalyticsEngine } from "./sentiment-analytics-engine.js";
import { SentimentValidationEngine } from "./sentiment-validation-engine.js";
import { SentimentValidator } from "./sentiment-validator.js";
import type { CustomerSentimentEngineConfiguration } from "./configuration.js";
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
  SentimentAlert,
  SentimentEngineRecord,
  SentimentFailure,
  SentimentRecord,
  SentimentRunReport,
  SentimentTrend,
  TrackSentimentTrendsInput,
} from "./types.js";

export class CustomerSentimentManager {
  private engineRecord: SentimentEngineRecord | null = null;
  private readonly registry = new SentimentRegistry();
  private readonly metadataGenerator = new SentimentMetadataGenerator();
  private readonly analysisEngine = new SentimentAnalysisEngine();
  private readonly conversationEngine = new ConversationAnalysisEngine();
  private readonly scoringEngine = new SentimentScoringEngine();
  private readonly trendEngine = new TrendAnalysisEngine();
  private readonly alertEngine = new SentimentAlertEngine();
  private readonly analyticsEngine = new SentimentAnalyticsEngine();
  private readonly validationEngine = new SentimentValidationEngine();
  private readonly validator = new SentimentValidator();
  private readonly failures: SentimentFailure[] = [];

  constructor(
    private readonly timelineEngine: CustomerTimelineEngine | null,
    private readonly emailEngine: EmailCommunicationEngine | null,
    private readonly smsEngine: SmsCommunicationEngine | null,
    private readonly whatsAppIntegration: WhatsAppIntegration | null,
    private readonly liveChatIntegration: LiveChatIntegration | null,
    private readonly aiCustomerSupport: AiCustomerSupport | null,
    private readonly ticketManagementEngine: TicketManagementEngine | null,
  ) {}

  getEngineRecord(): SentimentEngineRecord | null {
    return this.engineRecord;
  }

  getRegistry(): SentimentRegistry {
    return this.registry;
  }

  getSentimentRecords(): SentimentRecord[] {
    return this.registry.listRecords();
  }

  getAnalyticsEngine(): SentimentAnalyticsEngine {
    return this.analyticsEngine;
  }

  private isEngineConnected(
    engine: { getEngineRecord?: () => { currentOperationalState?: string } | null } | null,
  ): boolean {
    try {
      const record = engine?.getEngineRecord?.();
      return (
        record?.currentOperationalState === "active" ||
        record?.currentOperationalState === "connected"
      );
    } catch {
      return false;
    }
  }

  private resolveCustomer(customerId: string): { valid: boolean; error: string | null } {
    if (!customerId?.trim()) {
      return { valid: false, error: "Customer ID is required" };
    }
    const hasTimeline =
      this.timelineEngine?.getTimelineRecords().some((r) => r.customerId === customerId) ?? false;
    const hasAiSupport =
      this.aiCustomerSupport?.getAiSupportRecords().some((r) => r.customerId === customerId) ??
      false;
    const hasTicket =
      this.ticketManagementEngine?.getTicketRecords().some((r) => r.customerId === customerId) ??
      false;
    if (!hasTimeline && !hasAiSupport && !hasTicket) {
      return { valid: false, error: `No customer records found for ${customerId}` };
    }
    return { valid: true, error: null };
  }

  private recordToTimeline(customerId: string, description: string, reference: string): void {
    try {
      this.timelineEngine?.recordSupportActivity({
        customerId,
        eventReference: reference,
        eventDescription: description,
        eventSource: "support",
      });
    } catch {
      // best-effort
    }
  }

  private storeRecordWithAlerts(
    record: SentimentRecord,
    config: CustomerSentimentEngineConfiguration,
  ): { record: SentimentRecord; alerts: SentimentAlert[] } {
    const alerts = this.alertEngine.generateAlerts(record, config);
    const alertStatus = alerts.length > 0 ? "pending" : record.alertStatus;
    const updated = { ...record, alertStatus: alertStatus as SentimentRecord["alertStatus"] };
    this.registry.storeRecord(updated);
    for (const alert of alerts) {
      this.registry.storeAlert(alert);
    }
    return { record: updated, alerts };
  }

  connectCustomerSentimentEngine(
    _input: ConnectCustomerSentimentEngineInput,
    config: CustomerSentimentEngineConfiguration,
  ): SentimentRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);

    const record = this.metadataGenerator.buildEngineRecord({
      operationalState: configValidation.decision === "fail" ? "failed" : "active",
      validationStatus: configValidation.decision === "pass" ? "passed" : "partial",
      timelineEngineConnected: this.isEngineConnected(this.timelineEngine),
      emailEngineConnected: this.isEngineConnected(this.emailEngine),
      smsEngineConnected: this.isEngineConnected(this.smsEngine),
      whatsAppIntegrationConnected: this.isEngineConnected(this.whatsAppIntegration),
      liveChatIntegrationConnected: this.isEngineConnected(this.liveChatIntegration),
      aiCustomerSupportConnected: this.isEngineConnected(this.aiCustomerSupport),
      ticketManagementEngineConnected: this.isEngineConnected(this.ticketManagementEngine),
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (configValidation.decision !== "pass") {
      validation.warnings.push(...configValidation.warnings);
      if (configValidation.errors.length > 0) {
        validation.errors.push(...configValidation.errors);
        validation.decision = "fail";
      } else {
        validation.decision = "partial";
      }
    }

    appendCseLog({
      event: "engine_initialization",
      level: "info",
      details: `Customer Sentiment Engine connected: ${validation.decision}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      sentimentRecords: [],
      alerts: [],
      trends: [],
      failures: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  analyzeCustomerMessage(
    input: AnalyzeCustomerMessageInput,
    config: CustomerSentimentEngineConfiguration,
  ): SentimentRunReport {
    return this.runAction("analyze_message", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return this.emptyResult(validation, customer.error);
      }

      const analyzeKey = `msg:${input.customerId}:${input.messageText.slice(0, 50)}`;
      if (config.duplicateDetectionEnabled && this.registry.hasAnalyzeKey(analyzeKey)) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Duplicate message analysis detected");
        return this.emptyResult(validation, "Duplicate message analysis detected");
      }

      const analysis = this.analysisEngine.analyzeMessage(input.messageText, config);
      const conversationReference =
        input.conversationReference ?? `conv-${input.customerId}-${Date.now()}`;

      let record = this.metadataGenerator.buildSentimentRecord({
        customerId: input.customerId,
        conversationReference,
        communicationChannel: input.communicationChannel,
        sentimentScore: analysis.sentimentScore,
        sentimentCategory: analysis.sentimentCategory,
        confidenceScore: analysis.confidenceScore,
      });

      const validation = this.validationEngine.validateSentimentRecord(record, config);
      if (validation.decision === "fail") {
        return this.emptyResult(validation, validation.errors.join("; "));
      }

      record.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      this.registry.storeRecord(record, analyzeKey);
      const { record: stored, alerts } = this.storeRecordWithAlerts(record, config);

      this.recordToTimeline(
        input.customerId,
        `Sentiment analyzed: ${stored.sentimentCategory} (${stored.sentimentScore})`,
        stored.sentimentRecordId,
      );

      appendCseLog({
        event: "sentiment_analysis",
        level: "info",
        details: `Message ${stored.sentimentRecordId}: ${stored.sentimentCategory} score ${stored.sentimentScore}`,
      });

      return {
        sentimentRecords: [stored],
        alerts,
        trends: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  analyzeCustomerConversation(
    input: AnalyzeCustomerConversationInput,
    config: CustomerSentimentEngineConfiguration,
  ): SentimentRunReport {
    return this.runAction("analyze_conversation", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return this.emptyResult(validation, customer.error);
      }

      if (input.messages.length === 0) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Conversation messages are required");
        return this.emptyResult(validation, "Conversation messages are required");
      }

      const analysis = this.conversationEngine.analyzeConversation(input.messages, config);
      let record = this.metadataGenerator.buildSentimentRecord({
        customerId: input.customerId,
        conversationReference: input.conversationReference,
        communicationChannel: input.communicationChannel,
        sentimentScore: analysis.sentimentScore,
        sentimentCategory: analysis.sentimentCategory,
        confidenceScore: analysis.confidenceScore,
      });

      const validation = this.validationEngine.validateSentimentRecord(record, config);
      if (validation.decision === "fail") {
        return this.emptyResult(validation, validation.errors.join("; "));
      }

      record.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      const { record: stored, alerts } = this.storeRecordWithAlerts(record, config);

      appendCseLog({
        event: "conversation_analysis",
        level: "info",
        details: `Conversation ${input.conversationReference}: ${stored.sentimentCategory}`,
      });

      return {
        sentimentRecords: [stored],
        alerts,
        trends: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  detectCustomerSatisfaction(
    input: DetectCustomerSatisfactionInput,
    config: CustomerSentimentEngineConfiguration,
  ): SentimentRunReport {
    return this.detectByCondition("detect_satisfaction", config, input, (r) =>
      this.scoringEngine.isSatisfied(r, config.satisfactionThreshold),
    );
  }

  detectCustomerFrustration(
    input: DetectCustomerFrustrationInput,
    config: CustomerSentimentEngineConfiguration,
  ): SentimentRunReport {
    return this.detectByCondition("detect_frustration", config, input, (r) =>
      this.scoringEngine.isFrustrated(r, config.frustrationThreshold),
    );
  }

  detectEscalationRisk(
    input: DetectEscalationRiskInput,
    config: CustomerSentimentEngineConfiguration,
  ): SentimentRunReport {
    return this.detectByCondition("detect_escalation_risk", config, input, (r) =>
      this.scoringEngine.isEscalationRisk(r, config.escalationThreshold),
    );
  }

  detectPositiveExperience(
    input: DetectPositiveExperienceInput,
    config: CustomerSentimentEngineConfiguration,
  ): SentimentRunReport {
    return this.detectByCondition("detect_positive_experience", config, input, (r) =>
      this.scoringEngine.isPositiveExperience(r, config.satisfactionThreshold),
    );
  }

  private detectByCondition(
    action: SentimentRunReport["action"],
    config: CustomerSentimentEngineConfiguration,
    input: { customerId?: string; sentimentRecordId?: string },
    predicate: (record: SentimentRecord) => boolean,
  ): SentimentRunReport {
    return this.runAction(action, config, () => {
      const records = input.sentimentRecordId
        ? [this.registry.getRecord(input.sentimentRecordId)].filter(Boolean) as SentimentRecord[]
        : this.registry
            .listRecords()
            .filter((r) => (input.customerId ? r.customerId === input.customerId : true));

      const matched = records.filter(predicate);
      const validation = this.validator.validateEngineRecord(this.engineRecord!);

      appendCseLog({
        event: action,
        level: matched.length > 0 ? "info" : "debug",
        details: `${action}: ${matched.length} match(es)`,
      });

      return {
        sentimentRecords: matched,
        alerts: this.registry.listAlerts().filter((a) =>
          matched.some((r) => r.sentimentRecordId === a.sentimentRecordId),
        ),
        trends: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  trackSentimentTrends(
    input: TrackSentimentTrendsInput,
    config: CustomerSentimentEngineConfiguration,
  ): SentimentRunReport {
    return this.runAction("track_trends", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return this.emptyResult(validation, customer.error);
      }

      const trend = this.trendEngine.trackTrends(this.registry.listRecords(), config, input);
      if (trend) {
        this.registry.storeTrend(trend);
      }

      appendCseLog({
        event: "trend_analysis",
        level: "info",
        details: trend
          ? `Trend ${trend.trendDirection} avg ${trend.averageScore}`
          : "Insufficient records for trend",
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        sentimentRecords: this.registry
          .listRecords()
          .filter((r) => r.customerId === input.customerId),
        alerts: [],
        trends: trend ? [trend] : [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  calculateSentimentScore(
    input: CalculateSentimentScoreInput,
    config: CustomerSentimentEngineConfiguration,
  ): SentimentRunReport {
    return this.runAction("calculate_score", config, () => {
      const existing = this.registry.getRecord(input.sentimentRecordId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Sentiment record not found");
        return this.emptyResult(validation, "Sentiment record not found");
      }

      const score = this.scoringEngine.calculateScore(existing);
      const updated = { ...existing, sentimentScore: score, timestamp: new Date().toISOString() };
      this.registry.storeRecord(updated);

      appendCseLog({
        event: "score_update",
        level: "info",
        details: `Score recalculated for ${input.sentimentRecordId}: ${score}`,
      });

      const validation = this.validationEngine.validateSentimentRecord(updated, config);
      return {
        sentimentRecords: [updated],
        alerts: [],
        trends: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  generateSentimentAlerts(
    input: GenerateSentimentAlertsInput,
    config: CustomerSentimentEngineConfiguration,
  ): SentimentRunReport {
    return this.runAction("generate_alerts", config, () => {
      const records = input.sentimentRecordId
        ? [this.registry.getRecord(input.sentimentRecordId)].filter(Boolean) as SentimentRecord[]
        : this.registry.listRecords();

      const allAlerts: SentimentAlert[] = [];
      const updatedRecords: SentimentRecord[] = [];

      for (const record of records) {
        const { record: stored, alerts } = this.storeRecordWithAlerts(record, config);
        updatedRecords.push(stored);
        allAlerts.push(...alerts);
      }

      appendCseLog({
        event: "alert_generation",
        level: allAlerts.length > 0 ? "warn" : "info",
        details: `Generated ${allAlerts.length} alert(s)`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        sentimentRecords: updatedRecords,
        alerts: allAlerts,
        trends: [],
        failures: [],
        validation,
        error: allAlerts.length > 0 ? "Sentiment alerts generated" : null,
      };
    });
  }

  detectSentimentFailures(
    input: DetectSentimentFailuresInput,
    config: CustomerSentimentEngineConfiguration,
  ): SentimentRunReport {
    return this.runAction("detect_failures", config, () => {
      const records = input.sentimentRecordId
        ? [this.registry.getRecord(input.sentimentRecordId)].filter(Boolean) as SentimentRecord[]
        : this.registry.listRecords();

      const detected: SentimentFailure[] = [];
      for (const record of records) {
        if (record.validationStatus === "failed") {
          detected.push(
            this.metadataGenerator.buildFailure(
              record.sentimentRecordId,
              `Sentiment record ${record.sentimentRecordId} failed validation`,
              "high",
            ),
          );
        }
      }

      for (const f of detected) {
        if (
          !this.failures.some(
            (x) => x.sentimentRecordId === f.sentimentRecordId && x.reason === f.reason,
          )
        ) {
          this.failures.push(f);
        }
      }

      appendCseLog({
        event: "sentiment_failure",
        level: detected.length > 0 ? "warn" : "info",
        details: `Detected ${detected.length} sentiment failure(s)`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        sentimentRecords: records,
        alerts: [],
        trends: [],
        failures: detected,
        validation,
        error: detected.length > 0 ? "Sentiment failures detected" : null,
      };
    });
  }

  private emptyResult(validation: SentimentRunReport["validation"], error: string | null) {
    return {
      sentimentRecords: [] as SentimentRecord[],
      alerts: [] as SentimentAlert[],
      trends: [] as SentimentTrend[],
      failures: [] as SentimentFailure[],
      validation,
      error,
    };
  }

  private runAction(
    action: SentimentRunReport["action"],
    config: CustomerSentimentEngineConfiguration,
    fn: () => {
      sentimentRecords: SentimentRecord[];
      alerts: SentimentAlert[];
      trends: SentimentTrend[];
      failures: SentimentFailure[];
      validation: SentimentRunReport["validation"];
      error: string | null;
    },
  ): SentimentRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Customer Sentiment Engine not connected");

    const result = fn();
    if (result.error && result.validation.decision !== "fail") {
      result.validation.decision = "fail";
      result.validation.errors.push(result.error);
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      sentimentRecords: result.sentimentRecords,
      alerts: result.alerts,
      trends: result.trends,
      failures: result.failures,
      validation: result.validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
    this.failures.length = 0;
  }
}
