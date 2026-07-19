/** R4-07 — Live Chat Integration Manager. */

import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import { appendLciLog } from "./lci-logging.js";
import { LiveChatRegistry } from "./live-chat-registry.js";
import { ChatMetadataGenerator } from "./chat-metadata-generator.js";
import { ChatSessionManager } from "./chat-session-manager.js";
import { ChatMessageEngine } from "./chat-message-engine.js";
import { ChatQueueManager } from "./chat-queue-manager.js";
import { ChatAssignmentEngine } from "./chat-assignment-engine.js";
import { ChatTimelineMapper } from "./chat-timeline-mapper.js";
import { ChatAnalyticsEngine } from "./chat-analytics-engine.js";
import { ChatValidationEngine } from "./chat-validation-engine.js";
import { ChatValidator } from "./chat-validator.js";
import type { LiveChatIntegrationConfiguration } from "./configuration.js";
import type {
  AssignChatSessionInput,
  ConnectLiveChatIntegrationInput,
  CreateChatSessionInput,
  DetectChatFailuresInput,
  LiveChatEngineRecord,
  LiveChatFailure,
  LiveChatRecord,
  LiveChatRunReport,
  ManageChatConversationInput,
  ProcessChatQueueInput,
  ReceiveCustomerMessageInput,
  SendSupportResponseInput,
  TrackChatStatusInput,
  TrackResponseTimeInput,
} from "./types.js";

export class LiveChatIntegrationManager {
  private engineRecord: LiveChatEngineRecord | null = null;
  private readonly registry = new LiveChatRegistry();
  private readonly metadataGenerator = new ChatMetadataGenerator();
  private readonly sessionManager = new ChatSessionManager();
  private readonly messageEngine = new ChatMessageEngine();
  private readonly queueManager = new ChatQueueManager();
  private readonly assignmentEngine = new ChatAssignmentEngine();
  private readonly timelineMapper = new ChatTimelineMapper();
  private readonly analyticsEngine = new ChatAnalyticsEngine();
  private readonly validationEngine = new ChatValidationEngine();
  private readonly validator = new ChatValidator();
  private readonly failures: LiveChatFailure[] = [];

  constructor(private readonly timelineEngine: CustomerTimelineEngine | null) {}

  getEngineRecord(): LiveChatEngineRecord | null {
    return this.engineRecord;
  }

  getRegistry(): LiveChatRegistry {
    return this.registry;
  }

  getLiveChatRecords(): LiveChatRecord[] {
    return this.registry.listSessions();
  }

  getConversations() {
    return this.registry.listConversations();
  }

  getMessages() {
    return this.registry.listMessages();
  }

  getAnalyticsEngine(): ChatAnalyticsEngine {
    return this.analyticsEngine;
  }

  private isTimelineConnected(): boolean {
    try {
      const record = this.timelineEngine?.getEngineRecord?.();
      return (
        record?.currentOperationalState === "active" ||
        record?.currentOperationalState === "connected"
      );
    } catch {
      return false;
    }
  }

  private resolveCustomer(
    customerId: string,
    options: { requireExistingLink?: boolean } = {},
  ): { valid: boolean; error: string | null } {
    if (!this.timelineEngine) {
      return { valid: false, error: "Customer Timeline Engine unavailable" };
    }
    if (!customerId?.trim()) {
      return { valid: false, error: "Customer ID is required" };
    }
    if (options.requireExistingLink) {
      const hasLink =
        this.timelineEngine.getTimelineRecords().some((r) => r.customerId === customerId) ||
        this.registry.listSessions().some((s) => s.customerId === customerId);
      if (!hasLink) {
        return {
          valid: false,
          error: `No timeline or chat profile link for customer ${customerId}`,
        };
      }
    }
    return { valid: true, error: null };
  }

  connectLiveChatIntegration(
    _input: ConnectLiveChatIntegrationInput,
    config: LiveChatIntegrationConfiguration,
  ): LiveChatRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const timelineConnected = this.isTimelineConnected();

    const record = this.metadataGenerator.buildEngineRecord({
      operationalState:
        configValidation.decision === "fail"
          ? "failed"
          : timelineConnected
            ? "active"
            : "connected",
      validationStatus: configValidation.decision === "pass" ? "passed" : "partial",
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

    appendLciLog({
      event: "engine_initialization",
      level: "info",
      details: `Live Chat Integration connected: ${validation.decision}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      liveChatRecords: [],
      conversations: [],
      messages: [],
      failures: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  createChatSession(
    input: CreateChatSessionInput,
    config: LiveChatIntegrationConfiguration,
  ): LiveChatRunReport {
    return this.runAction("create_session", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return this.emptyResult(validation, customer.error);
      }

      const result = this.sessionManager.createSession(this.registry, config, input);
      if (result.error) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(result.error);
        return this.emptyResult(validation, result.error);
      }

      const timelineEvent = this.timelineMapper.mapSessionCreated(this.timelineEngine, {
        customerId: input.customerId,
        chatSessionId: result.session.chatSessionId,
      });

      const session: LiveChatRecord = {
        ...result.session,
        relatedTimelineEvent: timelineEvent,
      };
      this.registry.storeSession(session);

      const validation = this.validationEngine.validateLiveChatRecord(session, config);
      appendLciLog({
        event: "session_creation",
        level: "info",
        details: `Chat session ${session.chatSessionId} created for ${input.customerId}`,
      });

      return {
        liveChatRecords: [session],
        conversations: this.registry.listConversations().filter(
          (c) => c.conversationId === session.conversationId,
        ),
        messages: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  receiveCustomerMessage(
    input: ReceiveCustomerMessageInput,
    config: LiveChatIntegrationConfiguration,
  ): LiveChatRunReport {
    return this.runAction("receive_message", config, () => {
      const session = this.registry.getSession(input.chatSessionId);
      if (!session) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Chat session not found");
        return this.emptyResult(validation, "Chat session not found");
      }

      const sendKey = `msg:${input.chatSessionId}:${input.body}`;
      if (config.duplicateDetectionEnabled && this.registry.hasSendKey(sendKey)) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Duplicate message detected");
        return this.emptyResult(validation, "Duplicate message detected");
      }

      const message = this.messageEngine.createCustomerMessage(this.registry, {
        chatSessionId: session.chatSessionId,
        conversationId: session.conversationId,
        customerId: session.customerId,
        body: input.body,
      });
      this.registry.addSendKey(sendKey);

      const timelineEvent = this.timelineMapper.mapCustomerMessage(this.timelineEngine, {
        customerId: session.customerId,
        messageId: message.messageId,
        body: input.body,
      });

      let updated = this.sessionManager.appendMessageReference(session, message.messageId);
      if (timelineEvent) updated = { ...updated, relatedTimelineEvent: timelineEvent };
      this.registry.storeSession(updated);

      const conversation = this.registry.getConversation(session.conversationId);
      if (conversation) {
        this.registry.storeConversation({
          ...conversation,
          messageCount: conversation.messageCount + 1,
          lastMessageAt: message.timestamp,
          status: "active",
        });
      }

      appendLciLog({
        event: "message_received",
        level: "info",
        details: `Customer message ${message.messageId} received`,
      });

      const validation = this.validationEngine.validateLiveChatRecord(updated, config);
      return {
        liveChatRecords: [updated],
        conversations: conversation ? [this.registry.getConversation(session.conversationId)!] : [],
        messages: [message],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  sendSupportResponse(
    input: SendSupportResponseInput,
    config: LiveChatIntegrationConfiguration,
  ): LiveChatRunReport {
    return this.runAction("send_response", config, () => {
      const session = this.registry.getSession(input.chatSessionId);
      if (!session) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Chat session not found");
        return this.emptyResult(validation, "Chat session not found");
      }

      const message = this.messageEngine.createSupportResponse(this.registry, {
        chatSessionId: session.chatSessionId,
        conversationId: session.conversationId,
        customerId: session.customerId,
        body: input.body,
      });

      this.timelineMapper.mapSupportResponse(this.timelineEngine, {
        customerId: session.customerId,
        messageId: message.messageId,
        handlerId: input.handlerId,
      });

      let updated = this.sessionManager.appendMessageReference(session, message.messageId);
      if (!updated.assignedHandler) {
        updated = this.sessionManager.assignHandler(updated, input.handlerId);
      }
      this.registry.storeSession(updated);

      appendLciLog({
        event: "message_delivery",
        level: "info",
        details: `Support response ${message.messageId} sent by ${input.handlerId}`,
      });

      const validation = this.validationEngine.validateLiveChatRecord(updated, config);
      return {
        liveChatRecords: [updated],
        conversations: [],
        messages: [message],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  manageChatConversation(
    input: ManageChatConversationInput,
    config: LiveChatIntegrationConfiguration,
  ): LiveChatRunReport {
    return this.runAction("manage_conversation", config, () => {
      const conversation = this.registry.getConversation(input.conversationId);
      if (!conversation) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Conversation not found");
        return this.emptyResult(validation, "Conversation not found");
      }

      const updated = {
        ...conversation,
        status: input.status ?? conversation.status,
        timestamp: new Date().toISOString(),
      };
      this.registry.storeConversation(updated);

      const session = this.registry.getSession(conversation.chatSessionId);
      if (session && input.status) {
        const sessionUpdated = this.sessionManager.updateSessionStatus(session, input.status);
        this.registry.storeSession(sessionUpdated);
      }

      appendLciLog({
        event: "conversation_update",
        level: "info",
        details: `Conversation ${input.conversationId} updated`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        liveChatRecords: session ? [this.registry.getSession(conversation.chatSessionId)!] : [],
        conversations: [updated],
        messages: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  processChatQueue(
    input: ProcessChatQueueInput,
    config: LiveChatIntegrationConfiguration,
  ): LiveChatRunReport {
    return this.runAction("process_queue", config, () => {
      const batch = this.queueManager.dequeueBatch(this.registry, config, input.limit);
      for (const message of batch) {
        this.queueManager.markProcessed(this.registry, message);
        appendLciLog({
          event: "message_delivery",
          level: "info",
          details: `Queued message ${message.messageId} processed`,
        });
      }

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        liveChatRecords: [],
        conversations: [],
        messages: batch,
        failures: [],
        validation,
        error: null,
      };
    });
  }

  assignChatSession(
    input: AssignChatSessionInput,
    config: LiveChatIntegrationConfiguration,
  ): LiveChatRunReport {
    return this.runAction("assign_session", config, () => {
      const session = this.registry.getSession(input.chatSessionId);
      if (!session) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Chat session not found");
        return this.emptyResult(validation, "Chat session not found");
      }

      const assignCheck = this.assignmentEngine.canAssign(this.registry, config, input.handlerId);
      if (!assignCheck.allowed) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(assignCheck.error ?? "Assignment not allowed");
        return this.emptyResult(validation, assignCheck.error);
      }

      const updated = this.sessionManager.assignHandler(session, input.handlerId);
      this.registry.storeSession(updated);

      appendLciLog({
        event: "session_assignment",
        level: "info",
        details: `Session ${input.chatSessionId} assigned to ${input.handlerId}`,
      });

      const validation = this.validationEngine.validateLiveChatRecord(updated, config);
      return {
        liveChatRecords: [updated],
        conversations: [],
        messages: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  trackChatStatus(
    input: TrackChatStatusInput,
    config: LiveChatIntegrationConfiguration,
  ): LiveChatRunReport {
    return this.runAction("track_status", config, () => {
      const session = this.registry.getSession(input.chatSessionId);
      if (!session) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Chat session not found");
        return this.emptyResult(validation, "Chat session not found");
      }

      const updated = this.sessionManager.updateSessionStatus(session, input.chatStatus);
      this.registry.storeSession(updated);

      appendLciLog({
        event: "status_tracking",
        level: "info",
        details: `Session ${input.chatSessionId} status: ${input.chatStatus}`,
      });

      const validation = this.validationEngine.validateLiveChatRecord(updated, config);
      return {
        liveChatRecords: [updated],
        conversations: [],
        messages: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  trackResponseTime(
    input: TrackResponseTimeInput,
    config: LiveChatIntegrationConfiguration,
  ): LiveChatRunReport {
    return this.runAction("track_response_time", config, () => {
      const session = this.registry.getSession(input.chatSessionId);
      if (!session) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Chat session not found");
        return this.emptyResult(validation, "Chat session not found");
      }

      const updated = this.sessionManager.recordResponseTime(session, input.responseTimeMs);
      this.registry.storeSession(updated);

      appendLciLog({
        event: "response_time",
        level: "info",
        details: `Session ${input.chatSessionId} response time: ${input.responseTimeMs}ms`,
      });

      const validation = this.validationEngine.validateLiveChatRecord(updated, config);
      return {
        liveChatRecords: [updated],
        conversations: [],
        messages: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  detectChatFailures(
    input: DetectChatFailuresInput,
    config: LiveChatIntegrationConfiguration,
  ): LiveChatRunReport {
    return this.runAction("detect_failures", config, () => {
      const records = input.chatSessionId
        ? [this.registry.getSession(input.chatSessionId)].filter(Boolean) as LiveChatRecord[]
        : this.registry.listSessions();
      const detected: LiveChatFailure[] = [];

      for (const record of records) {
        if (record.chatStatus === "failed") {
          detected.push(
            this.metadataGenerator.buildFailure(
              record.chatSessionId,
              `Chat session ${record.chatSessionId} failed`,
              "high",
            ),
          );
        }
      }

      for (const f of detected) {
        if (
          !this.failures.some((x) => x.chatSessionId === f.chatSessionId && x.reason === f.reason)
        ) {
          this.failures.push(f);
        }
      }

      appendLciLog({
        event: "chat_failure",
        level: detected.length > 0 ? "warn" : "info",
        details: `Detected ${detected.length} live chat failure(s)`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        liveChatRecords: records,
        conversations: [],
        messages: [],
        failures: detected,
        validation,
        error: detected.length > 0 ? "Live chat failures detected" : null,
      };
    });
  }

  private emptyResult(
    validation: LiveChatRunReport["validation"],
    error: string | null,
  ) {
    return {
      liveChatRecords: [] as LiveChatRecord[],
      conversations: [],
      messages: [],
      failures: [],
      validation,
      error,
    };
  }

  private runAction(
    action: LiveChatRunReport["action"],
    config: LiveChatIntegrationConfiguration,
    fn: () => {
      liveChatRecords: LiveChatRecord[];
      conversations: LiveChatRunReport["conversations"];
      messages: LiveChatRunReport["messages"];
      failures: LiveChatFailure[];
      validation: LiveChatRunReport["validation"];
      error: string | null;
    },
  ): LiveChatRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Live chat integration not connected");

    const result = fn();
    if (result.error && result.validation.decision !== "fail") {
      result.validation.decision = "fail";
      result.validation.errors.push(result.error);
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      liveChatRecords: result.liveChatRecords,
      conversations: result.conversations,
      messages: result.messages,
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
