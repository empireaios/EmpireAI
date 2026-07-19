/** R4-06 — Conversation manager. */

import { WAI_METADATA_VERSION } from "./paths.js";
import type { WhatsAppIntegrationConfiguration } from "./configuration.js";
import type { WhatsAppConversation } from "./types.js";
import type { WhatsAppRegistry } from "./whatsapp-registry.js";
import { WhatsAppMetadataGenerator } from "./whatsapp-metadata-generator.js";

export class ConversationManager {
  private readonly metadata = new WhatsAppMetadataGenerator();

  resolveOrCreate(
    registry: WhatsAppRegistry,
    config: WhatsAppIntegrationConfiguration,
    input: { customerId: string; recipientPhoneNumber: string; conversationId?: string },
  ): { conversation: WhatsAppConversation; created: boolean; error: string | null } {
    if (input.conversationId) {
      const existing = registry.getConversation(input.conversationId);
      if (!existing) {
        return { conversation: null as unknown as WhatsAppConversation, created: false, error: "Conversation not found" };
      }
      return { conversation: existing, created: false, error: null };
    }

    const normalizedPhone = input.recipientPhoneNumber.replace(/[\s\-()]/g, "");
    const existing = registry.findConversation(input.customerId, normalizedPhone);
    if (existing) {
      return { conversation: existing, created: false, error: null };
    }

    if (config.conversationRulesEnabled) {
      const rule = config.conversationRules.find((r) => r.ruleId === "default_conversation");
      if (rule?.enabled && registry.listConversations().length >= rule.maxConversations) {
        return {
          conversation: null as unknown as WhatsAppConversation,
          created: false,
          error: "Maximum conversation limit reached",
        };
      }
    }

    const conversation = this.metadata.buildConversation({
      customerId: input.customerId,
      recipientPhoneNumber: normalizedPhone,
    });
    registry.storeConversation(conversation);
    return { conversation, created: true, error: null };
  }

  updateConversation(
    conversation: WhatsAppConversation,
    input: { status?: WhatsAppConversation["status"] },
  ): WhatsAppConversation {
    const now = new Date().toISOString();
    return {
      ...conversation,
      timestamp: now,
      status: input.status ?? conversation.status,
      metadataVersion: WAI_METADATA_VERSION,
    };
  }

  recordMessage(conversation: WhatsAppConversation): WhatsAppConversation {
    const now = new Date().toISOString();
    return {
      ...conversation,
      timestamp: now,
      lastMessageAt: now,
      messageCount: conversation.messageCount + 1,
      metadataVersion: WAI_METADATA_VERSION,
    };
  }
}
