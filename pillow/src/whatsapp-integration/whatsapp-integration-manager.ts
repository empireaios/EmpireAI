/** R4-06 — WhatsApp Integration Manager. */

import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import { appendWaiLog } from "./wai-logging.js";
import { WhatsAppRegistry } from "./whatsapp-registry.js";
import { WhatsAppMetadataGenerator } from "./whatsapp-metadata-generator.js";
import { WhatsAppApiClient } from "./whatsapp-api-client.js";
import { WhatsAppMessagingEngine } from "./whatsapp-messaging-engine.js";
import { ConversationManager } from "./conversation-manager.js";
import { WhatsAppTemplateManager } from "./whatsapp-template-manager.js";
import { WhatsAppTrackingEngine } from "./whatsapp-tracking-engine.js";
import { WhatsAppAnalyticsEngine } from "./whatsapp-analytics-engine.js";
import { WhatsAppValidationEngine } from "./whatsapp-validation-engine.js";
import { WhatsAppValidator } from "./whatsapp-validator.js";
import type { WhatsAppIntegrationConfiguration } from "./configuration.js";
import type {
  ConnectWhatsAppIntegrationInput,
  CreateWhatsAppTemplateInput,
  DetectMessagingFailuresInput,
  ManageConversationInput,
  MessageCategory,
  ProcessMessageQueueInput,
  ReceiveInboundMessageInput,
  SendWhatsAppInput,
  TrackDeliveryInput,
  TrackReadReceiptInput,
  WhatsAppConversation,
  WhatsAppEngineRecord,
  WhatsAppFailure,
  WhatsAppRecord,
  WhatsAppRunReport,
} from "./types.js";

export class WhatsAppIntegrationManager {
  private engineRecord: WhatsAppEngineRecord | null = null;
  private readonly registry = new WhatsAppRegistry();
  private readonly metadataGenerator = new WhatsAppMetadataGenerator();
  private readonly apiClient = new WhatsAppApiClient();
  private readonly messagingEngine = new WhatsAppMessagingEngine();
  private readonly conversationManager = new ConversationManager();
  private readonly templateManager = new WhatsAppTemplateManager();
  private readonly trackingEngine = new WhatsAppTrackingEngine();
  private readonly analyticsEngine = new WhatsAppAnalyticsEngine();
  private readonly validationEngine = new WhatsAppValidationEngine();
  private readonly validator = new WhatsAppValidator();
  private readonly failures: WhatsAppFailure[] = [];

  constructor(
    private readonly crmFoundation: CrmFoundationEngine | null,
    private readonly timelineEngine: CustomerTimelineEngine | null,
  ) {}

  getEngineRecord(): WhatsAppEngineRecord | null {
    return this.engineRecord;
  }

  getRegistry(): WhatsAppRegistry {
    return this.registry;
  }

  getWhatsAppRecords(): WhatsAppRecord[] {
    return this.registry.listMessages();
  }

  getConversations(): WhatsAppConversation[] {
    return this.registry.listConversations();
  }

  getTemplates() {
    return this.registry.listTemplates();
  }

  getAnalyticsEngine(): WhatsAppAnalyticsEngine {
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
      this.timelineEngine?.recordCommunication({
        customerId,
        eventReference: reference,
        eventDescription: description,
        eventSource: "communication",
      });
    } catch {
      // best-effort
    }
  }

  connectWhatsAppIntegration(
    _input: ConnectWhatsAppIntegrationInput,
    config: WhatsAppIntegrationConfiguration,
  ): WhatsAppRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const crmConnected = this.isEngineConnected(this.crmFoundation);
    const timelineConnected = this.isEngineConnected(this.timelineEngine);
    const apiResult = this.apiClient.connect(config);

    const record = this.metadataGenerator.buildEngineRecord({
      operationalState:
        configValidation.decision === "fail" || !apiResult.success
          ? "failed"
          : crmConnected && timelineConnected
            ? "active"
            : "connected",
      validationStatus: configValidation.decision === "pass" ? "passed" : "partial",
      crmFoundationConnected: crmConnected,
      timelineEngineConnected: timelineConnected,
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
    if (!apiResult.success && apiResult.error) {
      validation.errors.push(apiResult.error);
      validation.decision = "fail";
    }

    appendWaiLog({
      event: "engine_initialization",
      level: "info",
      details: `WhatsApp Integration connected: ${validation.decision}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      whatsAppRecords: [],
      conversations: [],
      templates: [],
      failures: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  sendTransactionalWhatsApp(
    input: SendWhatsAppInput,
    config: WhatsAppIntegrationConfiguration,
  ): WhatsAppRunReport {
    return this.sendMessage("send_transactional", "transactional", input, config);
  }

  sendNotificationWhatsApp(
    input: SendWhatsAppInput,
    config: WhatsAppIntegrationConfiguration,
  ): WhatsAppRunReport {
    return this.sendMessage("send_notification", "notification", input, config);
  }

  sendTemplateWhatsApp(
    input: SendWhatsAppInput,
    config: WhatsAppIntegrationConfiguration,
  ): WhatsAppRunReport {
    return this.sendMessage("send_template", "template", input, config);
  }

  receiveInboundMessage(
    input: ReceiveInboundMessageInput,
    config: WhatsAppIntegrationConfiguration,
  ): WhatsAppRunReport {
    return this.runAction("receive_inbound", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return {
          whatsAppRecords: [],
          conversations: [],
          templates: [],
          failures: [],
          validation,
          error: customer.error,
        };
      }

      const phoneCheck = this.apiClient.validatePhoneNumber(input.senderPhoneNumber);
      if (!phoneCheck.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(phoneCheck.error ?? "Invalid phone");
        return {
          whatsAppRecords: [],
          conversations: [],
          templates: [],
          failures: [],
          validation,
          error: phoneCheck.error,
        };
      }

      const normalizedPhone = input.senderPhoneNumber.replace(/[\s\-()]/g, "");
      const convResult = this.conversationManager.resolveOrCreate(this.registry, config, {
        customerId: input.customerId,
        recipientPhoneNumber: normalizedPhone,
        conversationId: input.conversationId,
      });
      if (convResult.error) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(convResult.error);
        return {
          whatsAppRecords: [],
          conversations: [],
          templates: [],
          failures: [],
          validation,
          error: convResult.error,
        };
      }

      const conversation = this.conversationManager.recordMessage(convResult.conversation);
      this.registry.storeConversation(conversation);

      const record = this.metadataGenerator.buildWhatsAppRecord({
        customerId: input.customerId,
        conversationId: conversation.conversationId,
        messageTemplateReference: "inbound-message",
        messageCategory: "inbound",
        recipientPhoneNumber: normalizedPhone,
        deliveryStatus: "delivered",
        readStatus: "unread",
      });

      const validation = this.validationEngine.validateWhatsAppRecord(record, config);
      record.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      this.registry.storeMessage(record);

      appendWaiLog({
        event: "message_creation",
        level: "info",
        details: `Inbound WhatsApp ${record.whatsAppRecordId} received from ${input.customerId}`,
      });
      appendWaiLog({
        event: "conversation_update",
        level: "info",
        details: `Conversation ${conversation.conversationId} updated`,
      });

      this.recordToTimeline(
        input.customerId,
        `WhatsApp inbound: ${input.body.slice(0, 50)}`,
        record.whatsAppRecordId,
      );

      return {
        whatsAppRecords: [record],
        conversations: [conversation],
        templates: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  manageConversation(
    input: ManageConversationInput,
    config: WhatsAppIntegrationConfiguration,
  ): WhatsAppRunReport {
    return this.runAction("manage_conversation", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return {
          whatsAppRecords: [],
          conversations: [],
          templates: [],
          failures: [],
          validation,
          error: customer.error,
        };
      }

      const phoneCheck = this.apiClient.validatePhoneNumber(input.recipientPhoneNumber);
      if (!phoneCheck.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(phoneCheck.error ?? "Invalid phone");
        return {
          whatsAppRecords: [],
          conversations: [],
          templates: [],
          failures: [],
          validation,
          error: phoneCheck.error,
        };
      }

      const normalizedPhone = input.recipientPhoneNumber.replace(/[\s\-()]/g, "");
      const convResult = this.conversationManager.resolveOrCreate(this.registry, config, {
        customerId: input.customerId,
        recipientPhoneNumber: normalizedPhone,
        conversationId: input.conversationId,
      });
      if (convResult.error) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(convResult.error);
        return {
          whatsAppRecords: [],
          conversations: [],
          templates: [],
          failures: [],
          validation,
          error: convResult.error,
        };
      }

      const updated = this.conversationManager.updateConversation(convResult.conversation, {
        status: input.status,
      });
      this.registry.storeConversation(updated);

      appendWaiLog({
        event: "conversation_update",
        level: "info",
        details: `Conversation ${updated.conversationId} managed (${updated.status})`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        whatsAppRecords: [],
        conversations: [updated],
        templates: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  createWhatsAppTemplate(
    input: CreateWhatsAppTemplateInput,
    config: WhatsAppIntegrationConfiguration,
  ): WhatsAppRunReport {
    return this.runAction("create_template", config, () => {
      const template = this.templateManager.createTemplate(input);
      const validation = this.validationEngine.validateTemplate(template);
      if (validation.decision === "fail") {
        return {
          whatsAppRecords: [],
          conversations: [],
          templates: [],
          failures: [],
          validation,
          error: validation.errors.join("; "),
        };
      }
      this.registry.storeTemplate(template);
      appendWaiLog({
        event: "message_creation",
        level: "info",
        details: `Template ${template.templateId} created (${input.messageCategory})`,
      });
      return {
        whatsAppRecords: [],
        conversations: [],
        templates: [template],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  processMessageQueue(
    input: ProcessMessageQueueInput,
    config: WhatsAppIntegrationConfiguration,
  ): WhatsAppRunReport {
    return this.runAction("process_queue", config, () => {
      const batch = this.messagingEngine.dequeueBatch(this.registry, config, input.limit);
      const delivered: WhatsAppRecord[] = [];

      for (const record of batch) {
        const updated = this.messagingEngine.markDelivered(record);
        this.registry.storeMessage(updated);
        delivered.push(updated);

        const conversation = this.registry.getConversation(record.conversationId);
        if (conversation) {
          const convUpdated = this.conversationManager.recordMessage(conversation);
          this.registry.storeConversation(convUpdated);
        }

        this.recordToTimeline(
          updated.customerId,
          `WhatsApp delivered (${updated.messageCategory})`,
          updated.whatsAppRecordId,
        );
        appendWaiLog({
          event: "message_delivery",
          level: "info",
          details: `WhatsApp ${updated.whatsAppRecordId} delivered`,
        });
      }

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        whatsAppRecords: delivered,
        conversations: [],
        templates: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  trackDelivery(
    input: TrackDeliveryInput,
    config: WhatsAppIntegrationConfiguration,
  ): WhatsAppRunReport {
    return this.runAction("track_delivery", config, () => {
      const existing = this.registry.getMessage(input.whatsAppRecordId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("WhatsApp record not found");
        return {
          whatsAppRecords: [],
          conversations: [],
          templates: [],
          failures: [],
          validation,
          error: "WhatsApp record not found",
        };
      }
      const updated = this.trackingEngine.trackDelivery(existing);
      this.registry.storeMessage(updated);
      appendWaiLog({
        event: "message_delivery",
        level: "info",
        details: `Delivery tracked for ${input.whatsAppRecordId}`,
      });
      const validation = this.validationEngine.validateWhatsAppRecord(updated, config);
      return {
        whatsAppRecords: [updated],
        conversations: [],
        templates: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  trackReadReceipt(
    input: TrackReadReceiptInput,
    config: WhatsAppIntegrationConfiguration,
  ): WhatsAppRunReport {
    return this.runAction("track_read_receipt", config, () => {
      const existing = this.registry.getMessage(input.whatsAppRecordId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("WhatsApp record not found");
        return {
          whatsAppRecords: [],
          conversations: [],
          templates: [],
          failures: [],
          validation,
          error: "WhatsApp record not found",
        };
      }
      const updated = this.trackingEngine.trackReadReceipt(existing);
      this.registry.storeMessage(updated);
      appendWaiLog({
        event: "read_receipt",
        level: "info",
        details: `Read receipt tracked for ${input.whatsAppRecordId}`,
      });
      const validation = this.validationEngine.validateWhatsAppRecord(updated, config);
      return {
        whatsAppRecords: [updated],
        conversations: [],
        templates: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  detectMessagingFailures(
    input: DetectMessagingFailuresInput,
    config: WhatsAppIntegrationConfiguration,
  ): WhatsAppRunReport {
    return this.runAction("detect_failures", config, () => {
      const records = input.whatsAppRecordId
        ? [this.registry.getMessage(input.whatsAppRecordId)].filter(Boolean) as WhatsAppRecord[]
        : this.registry.listMessages();
      const detected: WhatsAppFailure[] = [];

      for (const record of records) {
        if (record.deliveryStatus === "failed" || record.deliveryStatus === "bounced") {
          detected.push(
            this.metadataGenerator.buildFailure(
              record.whatsAppRecordId,
              `WhatsApp ${record.whatsAppRecordId} ${record.deliveryStatus}`,
              "high",
            ),
          );
        }
      }

      for (const f of detected) {
        if (
          !this.failures.some((x) => x.whatsAppRecordId === f.whatsAppRecordId && x.reason === f.reason)
        ) {
          this.failures.push(f);
        }
      }

      appendWaiLog({
        event: "messaging_failure",
        level: detected.length > 0 ? "warn" : "info",
        details: `Detected ${detected.length} WhatsApp failure(s)`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        whatsAppRecords: records,
        conversations: [],
        templates: [],
        failures: detected,
        validation,
        error: detected.length > 0 ? "WhatsApp failures detected" : null,
      };
    });
  }

  private sendMessage(
    action: WhatsAppRunReport["action"],
    category: MessageCategory,
    input: SendWhatsAppInput,
    config: WhatsAppIntegrationConfiguration,
  ): WhatsAppRunReport {
    return this.runAction(action, config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return {
          whatsAppRecords: [],
          conversations: [],
          templates: [],
          failures: [],
          validation,
          error: customer.error,
        };
      }

      const phoneCheck = this.apiClient.validatePhoneNumber(input.recipientPhoneNumber);
      if (!phoneCheck.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(phoneCheck.error ?? "Invalid phone");
        return {
          whatsAppRecords: [],
          conversations: [],
          templates: [],
          failures: [],
          validation,
          error: phoneCheck.error,
        };
      }

      const sendCheck = this.apiClient.canSend(category, config);
      if (!sendCheck.allowed) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(sendCheck.error ?? "Messaging not allowed");
        return {
          whatsAppRecords: [],
          conversations: [],
          templates: [],
          failures: [],
          validation,
          error: sendCheck.error,
        };
      }

      const normalizedPhone = input.recipientPhoneNumber.replace(/[\s\-()]/g, "");
      const convResult = this.conversationManager.resolveOrCreate(this.registry, config, {
        customerId: input.customerId,
        recipientPhoneNumber: normalizedPhone,
        conversationId: input.conversationId,
      });
      if (convResult.error) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(convResult.error);
        return {
          whatsAppRecords: [],
          conversations: [],
          templates: [],
          failures: [],
          validation,
          error: convResult.error,
        };
      }

      const { reference } = this.templateManager.resolveTemplateRef(
        this.registry,
        input.templateId,
        category,
      );

      const sendKey = `${input.customerId}:${category}:${reference}:${normalizedPhone}`;
      if (config.duplicateDetectionEnabled && this.registry.hasSendKey(sendKey)) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Duplicate WhatsApp message request detected");
        return {
          whatsAppRecords: [],
          conversations: [],
          templates: [],
          failures: [],
          validation,
          error: "Duplicate WhatsApp message request detected",
        };
      }

      const conversation = this.conversationManager.recordMessage(convResult.conversation);
      this.registry.storeConversation(conversation);

      const record = this.metadataGenerator.buildWhatsAppRecord({
        customerId: input.customerId,
        conversationId: conversation.conversationId,
        messageTemplateReference: reference,
        messageCategory: category,
        recipientPhoneNumber: normalizedPhone,
        deliveryStatus: "queued",
      });

      const validation = this.validationEngine.validateWhatsAppRecord(record, config);
      if (validation.decision === "fail") {
        return {
          whatsAppRecords: [],
          conversations: [],
          templates: [],
          failures: [],
          validation,
          error: validation.errors.join("; "),
        };
      }

      record.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      this.messagingEngine.enqueue(this.registry, record);
      this.registry.storeMessage(record, sendKey);

      appendWaiLog({
        event: "message_creation",
        level: "info",
        details: `WhatsApp ${record.whatsAppRecordId} queued (${category}) for ${input.customerId}`,
      });

      this.recordToTimeline(
        input.customerId,
        `WhatsApp queued (${category}): ${reference}`,
        record.whatsAppRecordId,
      );

      return {
        whatsAppRecords: [record],
        conversations: [conversation],
        templates: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  private runAction(
    action: WhatsAppRunReport["action"],
    config: WhatsAppIntegrationConfiguration,
    fn: () => {
      whatsAppRecords: WhatsAppRecord[];
      conversations: WhatsAppConversation[];
      templates: WhatsAppRunReport["templates"];
      failures: WhatsAppFailure[];
      validation: WhatsAppRunReport["validation"];
      error: string | null;
    },
  ): WhatsAppRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("WhatsApp integration not connected");

    const result = fn();
    if (result.error && result.validation.decision !== "fail") {
      result.validation.decision = "fail";
      result.validation.errors.push(result.error);
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      whatsAppRecords: result.whatsAppRecords,
      conversations: result.conversations,
      templates: result.templates,
      failures: result.failures,
      validation: result.validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
    this.apiClient.resetForTesting();
    this.failures.length = 0;
  }
}
