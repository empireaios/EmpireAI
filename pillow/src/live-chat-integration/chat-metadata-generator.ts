/** R4-07 — Chat metadata generator. */

import {
  LCI_CAPABILITIES,
  LCI_METADATA_VERSION,
  LIVE_CHAT_INTEGRATION_ID,
} from "./paths.js";
import type {
  ChatConversation,
  ChatMessage,
  ChatStatus,
  EngineState,
  LiveChatEngineRecord,
  LiveChatFailure,
  LiveChatRecord,
  LiveChatRunReport,
  LiveChatValidationReport,
  MessageSender,
  ValidationStatus,
} from "./types.js";

export function buildLiveChatEngineRecordId(): string {
  return `lci-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildLiveChatRunReportId(): string {
  return `lci-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildChatSessionId(): string {
  return `lci-ses-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildChatConversationId(): string {
  return `lci-con-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildChatMessageId(): string {
  return `lci-msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildLiveChatFailureId(): string {
  return `lci-fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class ChatMetadataGenerator {
  buildEngineRecord(input: {
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    timelineEngineConnected: boolean;
  }): LiveChatEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildLiveChatEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: LIVE_CHAT_INTEGRATION_ID,
      engineVersion: LCI_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...LCI_CAPABILITIES],
      timelineEngineConnected: input.timelineEngineConnected,
      metadataVersion: LCI_METADATA_VERSION,
    };
  }

  buildLiveChatRecord(input: {
    customerId: string;
    conversationId: string;
    messageReferences?: string[];
    chatStatus?: ChatStatus;
    assignedHandler?: string | null;
    responseTimeMs?: number | null;
    relatedTimelineEvent?: string | null;
    validationStatus?: ValidationStatus;
    chatSessionId?: string;
  }): LiveChatRecord {
    return {
      chatSessionId: input.chatSessionId ?? buildChatSessionId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      conversationId: input.conversationId,
      messageReferences: input.messageReferences ?? [],
      chatStatus: input.chatStatus ?? "waiting",
      assignedHandler: input.assignedHandler ?? null,
      responseTimeMs: input.responseTimeMs ?? null,
      relatedTimelineEvent: input.relatedTimelineEvent ?? null,
      validationStatus: input.validationStatus ?? "passed",
      metadataVersion: LCI_METADATA_VERSION,
    };
  }

  buildConversation(input: {
    customerId: string;
    chatSessionId: string;
    status?: ChatStatus;
  }): ChatConversation {
    return {
      conversationId: buildChatConversationId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      chatSessionId: input.chatSessionId,
      status: input.status ?? "waiting",
      messageCount: 0,
      lastMessageAt: null,
      metadataVersion: LCI_METADATA_VERSION,
    };
  }

  buildMessage(input: {
    chatSessionId: string;
    conversationId: string;
    customerId: string;
    sender: MessageSender;
    body: string;
  }): ChatMessage {
    return {
      messageId: buildChatMessageId(),
      timestamp: new Date().toISOString(),
      chatSessionId: input.chatSessionId,
      conversationId: input.conversationId,
      customerId: input.customerId,
      sender: input.sender,
      body: input.body,
      metadataVersion: LCI_METADATA_VERSION,
    };
  }

  buildFailure(
    chatSessionId: string | null,
    reason: string,
    severity: LiveChatFailure["severity"],
  ): LiveChatFailure {
    return {
      failureId: buildLiveChatFailureId(),
      timestamp: new Date().toISOString(),
      chatSessionId,
      reason,
      severity,
      metadataVersion: LCI_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: LiveChatRunReport["action"];
    engineRecord: LiveChatEngineRecord;
    liveChatRecords: LiveChatRecord[];
    conversations: ChatConversation[];
    messages: ChatMessage[];
    failures: LiveChatFailure[];
    validation: LiveChatValidationReport;
    durationMs: number;
  }): LiveChatRunReport {
    return {
      liveChatRunReportId: buildLiveChatRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      liveChatRecords: input.liveChatRecords,
      conversations: input.conversations,
      messages: input.messages,
      failures: input.failures,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: LCI_METADATA_VERSION,
    };
  }
}
