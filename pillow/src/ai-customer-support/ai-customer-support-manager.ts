/** R4-08 — AI Customer Support Manager. */

import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { EmailCommunicationEngine } from "../email-communication-engine/engine.js";
import type { SmsCommunicationEngine } from "../sms-communication-engine/engine.js";
import type { WhatsAppIntegration } from "../whatsapp-integration/engine.js";
import type { LiveChatIntegration } from "../live-chat-integration/engine.js";
import { appendAcsLog } from "./acs-logging.js";
import { AiSupportRegistry } from "./ai-support-registry.js";
import { SupportMetadataGenerator } from "./support-metadata-generator.js";
import { CustomerIntentEngine } from "./customer-intent-engine.js";
import { CustomerContextEngine } from "./customer-context-engine.js";
import { ResponseGenerationEngine } from "./response-generation-engine.js";
import { EscalationEngine } from "./escalation-engine.js";
import { MultiChannelSupportEngine } from "./multi-channel-support-engine.js";
import { SupportAnalyticsEngine } from "./support-analytics-engine.js";
import { SupportValidationEngine } from "./support-validation-engine.js";
import { SupportValidator } from "./support-validator.js";
import type { AiCustomerSupportConfiguration } from "./configuration.js";
import type {
  AiSupportEngineRecord,
  AiSupportFailure,
  AiSupportRecord,
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

export class AiCustomerSupportManager {
  private engineRecord: AiSupportEngineRecord | null = null;
  private readonly registry = new AiSupportRegistry();
  private readonly metadataGenerator = new SupportMetadataGenerator();
  private readonly intentEngine = new CustomerIntentEngine();
  private readonly contextEngine = new CustomerContextEngine();
  private readonly responseEngine = new ResponseGenerationEngine();
  private readonly escalationEngine = new EscalationEngine();
  private readonly multiChannelEngine = new MultiChannelSupportEngine();
  private readonly analyticsEngine = new SupportAnalyticsEngine();
  private readonly validationEngine = new SupportValidationEngine();
  private readonly validator = new SupportValidator();
  private readonly failures: AiSupportFailure[] = [];
  private readonly enquiryTexts = new Map<string, string>();
  private readonly responseTexts = new Map<string, string>();

  constructor(
    private readonly identityEngine: CustomerIdentityEngine | null,
    private readonly crmFoundation: CrmFoundationEngine | null,
    private readonly timelineEngine: CustomerTimelineEngine | null,
    private readonly emailEngine: EmailCommunicationEngine | null,
    private readonly smsEngine: SmsCommunicationEngine | null,
    private readonly whatsAppIntegration: WhatsAppIntegration | null,
    private readonly liveChatIntegration: LiveChatIntegration | null,
  ) {}

  getEngineRecord(): AiSupportEngineRecord | null {
    return this.engineRecord;
  }

  getRegistry(): AiSupportRegistry {
    return this.registry;
  }

  getAiSupportRecords(): AiSupportRecord[] {
    return this.registry.listRecords();
  }

  getAnalyticsEngine(): SupportAnalyticsEngine {
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
    if (!this.crmFoundation) {
      return { valid: false, error: "CRM Foundation unavailable" };
    }
    const crm = this.crmFoundation.getCrmRecords().find((r) => r.customerId === customerId);
    if (!crm) {
      return { valid: false, error: `CRM record for customer ${customerId} not found` };
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

  connectAiCustomerSupport(
    _input: ConnectAiCustomerSupportInput,
    config: AiCustomerSupportConfiguration,
  ): AiSupportRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);

    const record = this.metadataGenerator.buildEngineRecord({
      operationalState:
        configValidation.decision === "fail" ? "failed" : "active",
      validationStatus: configValidation.decision === "pass" ? "passed" : "partial",
      identityEngineConnected: this.isEngineConnected(this.identityEngine),
      crmFoundationConnected: this.isEngineConnected(this.crmFoundation),
      timelineEngineConnected: this.isEngineConnected(this.timelineEngine),
      emailEngineConnected: this.isEngineConnected(this.emailEngine),
      smsEngineConnected: this.isEngineConnected(this.smsEngine),
      whatsAppIntegrationConnected: this.isEngineConnected(this.whatsAppIntegration),
      liveChatIntegrationConnected: this.isEngineConnected(this.liveChatIntegration),
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

    appendAcsLog({
      event: "engine_initialization",
      level: "info",
      details: `AI Customer Support connected: ${validation.decision}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      aiSupportRecords: [],
      contexts: [],
      summaries: [],
      failures: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  receiveCustomerEnquiry(
    input: ReceiveCustomerEnquiryInput,
    config: AiCustomerSupportConfiguration,
  ): AiSupportRunReport {
    return this.runAction("receive_enquiry", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return this.emptyResult(validation, customer.error);
      }

      const sendKey = `enq:${input.customerId}:${input.communicationChannel}:${input.enquiryText.slice(0, 50)}`;
      if (config.duplicateDetectionEnabled && this.registry.hasSendKey(sendKey)) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Duplicate enquiry detected");
        return this.emptyResult(validation, "Duplicate enquiry detected");
      }

      const intent = this.intentEngine.understandIntent(input.enquiryText);
      const conversationReference =
        input.conversationReference ?? `conv-${input.customerId}-${Date.now()}`;

      const record = this.metadataGenerator.buildAiSupportRecord({
        customerId: input.customerId,
        conversationReference,
        communicationChannel: input.communicationChannel,
        customerIntent: intent,
      });

      const escalationCheck = this.escalationEngine.shouldEscalate(intent, config);
      if (escalationCheck.escalate) {
        record.escalationStatus = "pending";
      }

      const validation = this.validationEngine.validateAiSupportRecord(record, config);
      if (validation.decision === "fail") {
        return this.emptyResult(validation, validation.errors.join("; "));
      }

      record.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      this.registry.storeRecord(record, sendKey);
      this.enquiryTexts.set(record.aiSupportRecordId, input.enquiryText);

      appendAcsLog({
        event: "customer_enquiry",
        level: "info",
        details: `Enquiry ${record.aiSupportRecordId} received (${intent}) via ${input.communicationChannel}`,
      });

      this.recordToTimeline(
        input.customerId,
        `AI support enquiry: ${input.enquiryText.slice(0, 80)}`,
        record.aiSupportRecordId,
      );

      return {
        aiSupportRecords: [record],
        contexts: [],
        summaries: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  understandCustomerIntent(
    input: UnderstandCustomerIntentInput,
    config: AiCustomerSupportConfiguration,
  ): AiSupportRunReport {
    return this.runAction("understand_intent", config, () => {
      const existing = this.registry.getRecord(input.aiSupportRecordId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("AI support record not found");
        return this.emptyResult(validation, "AI support record not found");
      }

      const enquiryText =
        input.enquiryText ?? this.enquiryTexts.get(input.aiSupportRecordId) ?? "";
      const intent = this.intentEngine.understandIntent(enquiryText);
      const updated = { ...existing, customerIntent: intent, timestamp: new Date().toISOString() };
      this.registry.storeRecord(updated);

      appendAcsLog({
        event: "intent_understood",
        level: "info",
        details: `Intent for ${input.aiSupportRecordId}: ${intent}`,
      });

      const validation = this.validationEngine.validateAiSupportRecord(updated, config);
      return {
        aiSupportRecords: [updated],
        contexts: [],
        summaries: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  retrieveCustomerContext(
    input: RetrieveCustomerContextInput,
    config: AiCustomerSupportConfiguration,
  ): AiSupportRunReport {
    return this.runAction("retrieve_context", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return this.emptyResult(validation, customer.error);
      }

      const context = this.contextEngine.retrieveContext(
        input.customerId,
        this.crmFoundation,
        this.timelineEngine,
      );
      this.registry.storeContext(context);

      appendAcsLog({
        event: "context_retrieved",
        level: "info",
        details: `Context for ${input.customerId}: ${context.timelineRecordCount} timeline records`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        aiSupportRecords: [],
        contexts: [context],
        summaries: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  generateAiResponse(
    input: GenerateAiResponseInput,
    config: AiCustomerSupportConfiguration,
  ): AiSupportRunReport {
    return this.runAction("generate_response", config, () => {
      const existing = this.registry.getRecord(input.aiSupportRecordId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("AI support record not found");
        return this.emptyResult(validation, "AI support record not found");
      }

      const context =
        this.registry.listContexts().find((c) => c.customerId === existing.customerId) ??
        this.contextEngine.retrieveContext(
          existing.customerId,
          this.crmFoundation,
          this.timelineEngine,
        );

      const generated = this.responseEngine.generateResponse(
        existing,
        context,
        existing.customerIntent,
        config,
        input.responseText,
      );

      if (generated.error) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(generated.error);
        return this.emptyResult(validation, generated.error);
      }

      const updated = {
        ...existing,
        timestamp: new Date().toISOString(),
        aiResponseReference: generated.responseReference,
        resolutionStatus: "in_progress" as const,
      };
      this.registry.storeRecord(updated);
      this.responseTexts.set(input.aiSupportRecordId, generated.responseText);

      appendAcsLog({
        event: "ai_response",
        level: "info",
        details: `AI response ${generated.responseReference} generated for ${input.aiSupportRecordId}`,
      });

      const validation = this.validationEngine.validateAiSupportRecord(updated, config);
      return {
        aiSupportRecords: [updated],
        contexts: context ? [context] : [],
        summaries: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  escalateEnquiry(
    input: EscalateEnquiryInput,
    config: AiCustomerSupportConfiguration,
  ): AiSupportRunReport {
    return this.runAction("escalate_enquiry", config, () => {
      const existing = this.registry.getRecord(input.aiSupportRecordId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("AI support record not found");
        return this.emptyResult(validation, "AI support record not found");
      }

      if (existing.escalationStatus === "escalated") {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Enquiry already escalated");
        return this.emptyResult(validation, "Enquiry already escalated");
      }

      const updated = this.escalationEngine.escalate(existing, input.reason);
      this.registry.storeRecord(updated);

      appendAcsLog({
        event: "escalation",
        level: "info",
        details: `Enquiry ${input.aiSupportRecordId} escalated${input.reason ? `: ${input.reason}` : ""}`,
      });

      this.recordToTimeline(
        existing.customerId,
        `AI support escalation: ${input.reason ?? "complex enquiry"}`,
        updated.aiSupportRecordId,
      );

      const validation = this.validationEngine.validateAiSupportRecord(updated, config);
      return {
        aiSupportRecords: [updated],
        contexts: [],
        summaries: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  handleMultiChannelSupport(
    input: HandleMultiChannelSupportInput,
    config: AiCustomerSupportConfiguration,
  ): AiSupportRunReport {
    return this.runAction("multi_channel_support", config, () => {
      const existing = this.registry.getRecord(input.aiSupportRecordId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("AI support record not found");
        return this.emptyResult(validation, "AI support record not found");
      }

      if (!existing.aiResponseReference) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("AI response must be generated before channel delivery");
        return this.emptyResult(validation, "AI response must be generated before channel delivery");
      }

      const responseText =
        this.responseTexts.get(input.aiSupportRecordId) ??
        `Thank you for contacting us. Your ${existing.customerIntent.replace("_", " ")} is being handled.`;

      const channelResult = this.multiChannelEngine.handleChannel(
        existing,
        config,
        {
          recipientAddress: input.recipientAddress,
          recipientPhoneNumber: input.recipientPhoneNumber,
          chatSessionId: input.chatSessionId,
          responseText,
        },
        {
          email: this.emailEngine,
          sms: this.smsEngine,
          whatsapp: this.whatsAppIntegration,
          liveChat: this.liveChatIntegration,
        },
      );

      if (channelResult.error) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(channelResult.error);
        return this.emptyResult(validation, channelResult.error);
      }

      const updated = {
        ...existing,
        timestamp: new Date().toISOString(),
        resolutionStatus: "resolved" as const,
        escalationStatus:
          existing.escalationStatus === "pending" ? ("resolved" as const) : existing.escalationStatus,
      };
      this.registry.storeRecord(updated);

      appendAcsLog({
        event: "resolution_event",
        level: "info",
        details: `Multi-channel delivery via ${existing.communicationChannel}: ${channelResult.channelReference}`,
      });

      const validation = this.validationEngine.validateAiSupportRecord(updated, config);
      return {
        aiSupportRecords: [updated],
        contexts: [],
        summaries: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  generateSupportSummary(
    input: GenerateSupportSummaryInput,
    config: AiCustomerSupportConfiguration,
  ): AiSupportRunReport {
    return this.runAction("generate_summary", config, () => {
      const existing = this.registry.getRecord(input.aiSupportRecordId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("AI support record not found");
        return this.emptyResult(validation, "AI support record not found");
      }

      const summaryText = [
        `Customer: ${existing.customerId}`,
        `Channel: ${existing.communicationChannel}`,
        `Intent: ${existing.customerIntent}`,
        `Status: ${existing.resolutionStatus}`,
        `Escalation: ${existing.escalationStatus}`,
        existing.aiResponseReference ? `Response: ${existing.aiResponseReference}` : "No response yet",
      ].join(" · ");

      const summary = this.metadataGenerator.buildSummary({
        aiSupportRecordId: existing.aiSupportRecordId,
        customerId: existing.customerId,
        summaryText,
      });
      this.registry.storeSummary(summary);

      appendAcsLog({
        event: "support_summary",
        level: "info",
        details: `Summary generated for ${input.aiSupportRecordId}`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        aiSupportRecords: [existing],
        contexts: [],
        summaries: [summary],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  detectSupportFailures(
    input: DetectSupportFailuresInput,
    config: AiCustomerSupportConfiguration,
  ): AiSupportRunReport {
    return this.runAction("detect_failures", config, () => {
      const records = input.aiSupportRecordId
        ? [this.registry.getRecord(input.aiSupportRecordId)].filter(Boolean) as AiSupportRecord[]
        : this.registry.listRecords();
      const detected: AiSupportFailure[] = [];

      for (const record of records) {
        if (record.resolutionStatus === "failed") {
          detected.push(
            this.metadataGenerator.buildFailure(
              record.aiSupportRecordId,
              `Support record ${record.aiSupportRecordId} failed`,
              "high",
            ),
          );
        }
      }

      for (const f of detected) {
        if (
          !this.failures.some(
            (x) => x.aiSupportRecordId === f.aiSupportRecordId && x.reason === f.reason,
          )
        ) {
          this.failures.push(f);
        }
      }

      appendAcsLog({
        event: "support_failure",
        level: detected.length > 0 ? "warn" : "info",
        details: `Detected ${detected.length} support failure(s)`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        aiSupportRecords: records,
        contexts: [],
        summaries: [],
        failures: detected,
        validation,
        error: detected.length > 0 ? "Support failures detected" : null,
      };
    });
  }

  private emptyResult(
    validation: AiSupportRunReport["validation"],
    error: string | null,
  ) {
    return {
      aiSupportRecords: [] as AiSupportRecord[],
      contexts: [],
      summaries: [],
      failures: [],
      validation,
      error,
    };
  }

  private runAction(
    action: AiSupportRunReport["action"],
    config: AiCustomerSupportConfiguration,
    fn: () => {
      aiSupportRecords: AiSupportRecord[];
      contexts: AiSupportRunReport["contexts"];
      summaries: AiSupportRunReport["summaries"];
      failures: AiSupportFailure[];
      validation: AiSupportRunReport["validation"];
      error: string | null;
    },
  ): AiSupportRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("AI customer support not connected");

    const result = fn();
    if (result.error && result.validation.decision !== "fail") {
      result.validation.decision = "fail";
      result.validation.errors.push(result.error);
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      aiSupportRecords: result.aiSupportRecords,
      contexts: result.contexts,
      summaries: result.summaries,
      failures: result.failures,
      validation: result.validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
    this.enquiryTexts.clear();
    this.responseTexts.clear();
    this.failures.length = 0;
  }
}
