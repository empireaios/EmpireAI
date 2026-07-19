/** R4-07 — Chat session manager. */

import { LCI_METADATA_VERSION } from "./paths.js";
import type { LiveChatIntegrationConfiguration } from "./configuration.js";
import type { ChatStatus, LiveChatRecord } from "./types.js";
import type { LiveChatRegistry } from "./live-chat-registry.js";
import { ChatMetadataGenerator } from "./chat-metadata-generator.js";

export class ChatSessionManager {
  private readonly metadata = new ChatMetadataGenerator();

  createSession(
    registry: LiveChatRegistry,
    config: LiveChatIntegrationConfiguration,
    input: { customerId: string; conversationId?: string },
  ): { session: LiveChatRecord; conversationId: string; error: string | null } {
    if (config.sessionRulesEnabled) {
      const rule = config.sessionRules.find((r) => r.ruleId === "default_session");
      if (rule?.enabled) {
        const active = registry
          .listSessions()
          .filter((s) => s.customerId === input.customerId && s.chatStatus !== "closed").length;
        if (active >= rule.maxActiveSessions) {
          return {
            session: null as unknown as LiveChatRecord,
            conversationId: "",
            error: "Maximum active sessions reached for customer",
          };
        }
      }
    }

    const session = this.metadata.buildLiveChatRecord({
      customerId: input.customerId,
      conversationId: input.conversationId ?? "pending",
      chatStatus: "waiting",
    });

    let conversationId = input.conversationId;
    if (!conversationId) {
      const conversation = this.metadata.buildConversation({
        customerId: input.customerId,
        chatSessionId: session.chatSessionId,
        status: "waiting",
      });
      conversationId = conversation.conversationId;
      registry.storeConversation(conversation);
      session.conversationId = conversationId;
    }

    registry.storeSession(session);
    return { session, conversationId, error: null };
  }

  updateSessionStatus(session: LiveChatRecord, status: ChatStatus): LiveChatRecord {
    return {
      ...session,
      timestamp: new Date().toISOString(),
      chatStatus: status,
      metadataVersion: LCI_METADATA_VERSION,
    };
  }

  assignHandler(session: LiveChatRecord, handlerId: string): LiveChatRecord {
    return {
      ...session,
      timestamp: new Date().toISOString(),
      assignedHandler: handlerId,
      chatStatus: "assigned",
      metadataVersion: LCI_METADATA_VERSION,
    };
  }

  recordResponseTime(session: LiveChatRecord, responseTimeMs: number): LiveChatRecord {
    return {
      ...session,
      timestamp: new Date().toISOString(),
      responseTimeMs,
      metadataVersion: LCI_METADATA_VERSION,
    };
  }

  appendMessageReference(session: LiveChatRecord, messageId: string): LiveChatRecord {
    return {
      ...session,
      timestamp: new Date().toISOString(),
      messageReferences: [...session.messageReferences, messageId],
      chatStatus: session.chatStatus === "waiting" ? "active" : session.chatStatus,
      metadataVersion: LCI_METADATA_VERSION,
    };
  }
}
